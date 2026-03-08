import { type Express } from "express";
import { storage } from "../storage";
import { logger } from "../logger";
import { randomBytes } from "crypto";
import {
    isGitHubConfigured,
    getGitHubAuthUrl,
    exchangeCodeForToken,
    fetchGitHubUser,
    fetchUserRepos,
    fetchSecurityFiles,
} from "../services/github";
import { analyzeCodeSecurity } from "../services/gemini";
import { securityScans, users } from "@shared/schema";
import { db } from "../db";
import { eq, desc } from "drizzle-orm";
import passport from "passport";

export function registerGitHubRoutes(app: Express) {
    // ─── Status: Check if GitHub is connected ─────────────────────────────────────
    app.get("/api/github/status", async (req, res) => {
        if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
        const user = req.user as any;
        res.json({
            configured: isGitHubConfigured(),
            connected: !!user.githubAccessToken,
            username: user.githubUsername || null,
        });
    });

    // ─── Connect: Redirect to GitHub OAuth (scanner flow) ─────────────────────────
    app.get("/api/github/connect", (req, res) => {
        if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
        if (!isGitHubConfigured()) return res.status(400).json({ message: "GitHub OAuth is not configured" });

        const state = randomBytes(16).toString("hex");
        (req.session as any).githubOAuthState = state;
        (req.session as any).githubFlow = "scanner"; // Flag for the shared callback
        const url = getGitHubAuthUrl(state);
        res.json({ url });
    });

    // ─── Callback: Unified handler for both login and scanner flows ────────────
    app.get("/api/github/callback", (req, res, next) => {
        const flow = (req.session as any).githubFlow;
        delete (req.session as any).githubFlow; // Clean up

        if (flow === "login") {
            // Login/signup flow — use Passport to authenticate the user
            passport.authenticate("github", {
                failureRedirect: "/auth?error=oauth_failed",
                successRedirect: "/dashboard",
            })(req, res, next);
        } else {
            // Scanner "Connect GitHub" flow — save token to existing user
            (async () => {
                try {
                    const { code } = req.query;
                    if (!code || typeof code !== "string") {
                        return res.redirect("/github-scanner?error=no_code");
                    }

                    const token = await exchangeCodeForToken(code);
                    const ghUser = await fetchGitHubUser(token);

                    if (req.isAuthenticated()) {
                        const user = req.user as any;
                        await db
                            .update(users)
                            .set({ githubAccessToken: token, githubUsername: ghUser.login })
                            .where(eq(users.id, user.id));
                    }

                    res.redirect("/github-scanner?connected=true");
                } catch (error) {
                    logger.error("GitHub callback error", error);
                    res.redirect("/github-scanner?error=oauth_failed");
                }
            })();
        }
    });

    // ─── Disconnect: Remove GitHub token ──────────────────────────────────────────
    app.delete("/api/github/disconnect", async (req, res) => {
        if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
        const user = req.user as any;
        try {
            await db
                .update(users)
                .set({ githubAccessToken: null, githubUsername: null })
                .where(eq(users.id, user.id));
            res.json({ success: true });
        } catch (error) {
            logger.error("GitHub disconnect error", error);
            res.status(500).json({ message: "Failed to disconnect GitHub" });
        }
    });

    // ─── Repos: List user's repositories ──────────────────────────────────────────
    app.get("/api/github/repos", async (req, res) => {
        if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
        const user = req.user as any;
        if (!user.githubAccessToken) {
            return res.status(400).json({ message: "GitHub not connected" });
        }
        try {
            const repos = await fetchUserRepos(user.githubAccessToken);
            res.json(repos);
        } catch (error) {
            logger.error("GitHub repos error", error);
            res.status(500).json({ message: "Failed to fetch repositories" });
        }
    });

    // ─── Scan: Run security analysis on a repo ────────────────────────────────────
    app.post("/api/github/scan/:owner/:repo", async (req, res) => {
        if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
        const user = req.user as any;
        if (!user.githubAccessToken) {
            return res.status(400).json({ message: "GitHub not connected" });
        }

        const { owner, repo } = req.params;
        const creditCost = 2;

        // Check credits
        if ((user.credits || 0) < creditCost) {
            return res.status(403).json({ message: "Insufficient credits. You need 2 credits per scan." });
        }

        try {
            // Create scan record
            const [scan] = await db
                .insert(securityScans)
                .values({
                    userId: user.id,
                    repoName: `${owner}/${repo}`,
                    repoUrl: `https://github.com/${owner}/${repo}`,
                    status: "scanning",
                })
                .returning();

            // Deduct credits
            await storage.updateUserCredits(user.id, -creditCost);

            // Fetch files and analyze
            const files = await fetchSecurityFiles(user.githubAccessToken, owner, repo);

            if (files.length === 0) {
                await db
                    .update(securityScans)
                    .set({ status: "failed", summary: "No scannable files found in this repository." })
                    .where(eq(securityScans.id, scan.id));
                return res.json({
                    id: scan.id,
                    score: 0,
                    summary: "No scannable files found in this repository.",
                    findings: [],
                    status: "failed",
                });
            }

            const analysis = await analyzeCodeSecurity(files, `${owner}/${repo}`);

            // Update scan with results
            await db
                .update(securityScans)
                .set({
                    score: analysis.score,
                    findings: analysis.findings,
                    summary: analysis.summary,
                    status: "complete",
                })
                .where(eq(securityScans.id, scan.id));

            res.json({
                id: scan.id,
                ...analysis,
                status: "complete",
                filesScanned: files.length,
            });
        } catch (error: any) {
            logger.error("GitHub scan error", error);
            res.status(500).json({ message: error.message || "Scan failed" });
        }
    });

    // ─── History: Get user's past scans ───────────────────────────────────────────
    app.get("/api/github/scans", async (req, res) => {
        if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
        const user = req.user as any;
        try {
            const scans = await db
                .select()
                .from(securityScans)
                .where(eq(securityScans.userId, user.id))
                .orderBy(desc(securityScans.createdAt))
                .limit(20);
            res.json(scans);
        } catch (error) {
            logger.error("GitHub scans history error", error);
            res.status(500).json({ message: "Failed to fetch scan history" });
        }
    });

    // ─── Single Scan: Get a specific scan result ──────────────────────────────────
    app.get("/api/github/scans/:id", async (req, res) => {
        if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
        const user = req.user as any;
        const scanId = parseInt(req.params.id);
        try {
            const [scan] = await db
                .select()
                .from(securityScans)
                .where(eq(securityScans.id, scanId));
            if (!scan || scan.userId !== user.id) {
                return res.status(404).json({ message: "Scan not found" });
            }
            res.json(scan);
        } catch (error) {
            logger.error("GitHub scan detail error", error);
            res.status(500).json({ message: "Failed to fetch scan" });
        }
    });
}
