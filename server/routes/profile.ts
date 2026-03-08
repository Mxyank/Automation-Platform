import { Router } from "express";
import { db } from "../db";
import { users, connections } from "@shared/schema";
import { eq, ne, and, or, like, desc, sql, ilike } from "drizzle-orm";
import { logger } from "../logger";

const router = Router();

// ─── Get My Profile ────────────────────────────────────────────────────────────
router.get("/me", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    const user = req.user as any;
    res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        headline: user.headline,
        bio: user.bio,
        location: user.location,
        company: user.company,
        role: user.role,
        skills: user.skills || [],
        experience: user.experience || [],
        userProjects: user.userProjects || [],
        socialLinks: user.socialLinks || {},
        profileCompleted: user.profileCompleted,
        githubUsername: user.githubUsername,
        provider: user.provider,
        createdAt: user.createdAt,
    });
});

// ─── Update Profile ───────────────────────────────────────────────────────────
router.put("/me", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    const user = req.user as any;
    const {
        username, headline, bio, location, company, role,
        skills, experience, userProjects, socialLinks, avatar,
    } = req.body;

    try {
        // If username is being changed, check uniqueness
        if (username && username !== user.username) {
            const existing = await db.select().from(users).where(eq(users.username, username));
            if (existing.length > 0) {
                return res.status(400).json({ message: "Username already taken" });
            }
        }

        const [updated] = await db
            .update(users)
            .set({
                ...(username && { username }),
                ...(headline !== undefined && { headline }),
                ...(bio !== undefined && { bio }),
                ...(location !== undefined && { location }),
                ...(company !== undefined && { company }),
                ...(role !== undefined && { role }),
                ...(skills !== undefined && { skills }),
                ...(experience !== undefined && { experience }),
                ...(userProjects !== undefined && { userProjects }),
                ...(socialLinks !== undefined && { socialLinks }),
                ...(avatar !== undefined && { avatar }),
                profileCompleted: true,
            })
            .where(eq(users.id, user.id))
            .returning();

        res.json(updated);
    } catch (error: any) {
        logger.error("Profile update error", error);
        res.status(500).json({ message: error.message || "Failed to update profile" });
    }
});

// ─── Discover Users (paginated, searchable) ───────────────────────────────────
router.get("/discover", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    const user = req.user as any;
    const search = (req.query.search as string) || "";
    const page = parseInt(req.query.page as string) || 1;
    const limit = 20;
    const offset = (page - 1) * limit;

    try {
        const whereClause = [ne(users.id, user.id)];
        if (search) {
            whereClause.push(or(
                ilike(users.username, `%${search}%`),
                ilike(users.headline, `%${search}%`),
                ilike(users.company, `%${search}%`)
            ) as any);
        }

        logger.info(`[DISCOVER] Starting for user ID: ${user.id} (${typeof user.id}), search: "${search}"`);

        const result = await db
            .select({
                id: users.id,
                username: users.username,
                avatar: users.avatar,
                headline: users.headline,
                company: users.company,
                role: users.role,
                skills: users.skills,
                profileCompleted: users.profileCompleted,
                createdAt: users.createdAt,
            })
            .from(users)
            .where(and(...whereClause))
            .orderBy(desc(users.createdAt))
            .limit(limit)
            .offset(offset);

        logger.info(`[DISCOVER] DB result count: ${result.length}`);
        if (result.length > 0) {
            logger.debug(`[DISCOVER] First user found: ${result[0].username} (ID: ${result[0].id})`);
        } else {
            // Check total count for debugging
            const totalUsersCount = await db.select({ count: users.id }).from(users);
            logger.info(`[DISCOVER] Total users in DB: ${totalUsersCount.length}`);
        }

        // Get connection statuses for these users
        const userIds = result.map((u) => u.id);
        let connectionStatuses: Record<number, string> = {};

        if (userIds.length > 0) {
            const conns = await db
                .select()
                .from(connections)
                .where(
                    or(
                        and(eq(connections.requesterId, user.id)),
                        and(eq(connections.receiverId, user.id))
                    )
                );

            conns.forEach((c) => {
                const otherId = c.requesterId === user.id ? c.receiverId : c.requesterId;
                if (userIds.includes(otherId)) {
                    connectionStatuses[otherId] = c.status;
                }
            });
        }

        const usersWithStatus = result.map((u) => ({
            ...u,
            connectionStatus: connectionStatuses[u.id] || "none",
        }));

        res.json(usersWithStatus);
    } catch (error: any) {
        logger.error("User discover error", error);
        res.status(500).json({ message: "Failed to fetch users" });
    }
});

// ─── View User Profile ────────────────────────────────────────────────────────
router.get("/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    const userId = parseInt(req.params.id);
    const currentUser = req.user as any;

    try {
        const [profile] = await db
            .select({
                id: users.id,
                username: users.username,
                avatar: users.avatar,
                headline: users.headline,
                bio: users.bio,
                location: users.location,
                company: users.company,
                role: users.role,
                skills: users.skills,
                experience: users.experience,
                userProjects: users.userProjects,
                socialLinks: users.socialLinks,
                profileCompleted: users.profileCompleted,
                createdAt: users.createdAt,
            })
            .from(users)
            .where(eq(users.id, userId));

        if (!profile) {
            return res.status(404).json({ message: "User not found" });
        }

        // Get connection status between current user and this user
        const [conn] = await db
            .select()
            .from(connections)
            .where(
                or(
                    and(eq(connections.requesterId, currentUser.id), eq(connections.receiverId, userId)),
                    and(eq(connections.requesterId, userId), eq(connections.receiverId, currentUser.id))
                )
            );

        res.json({
            ...profile,
            connectionStatus: conn?.status || "none",
            connectionId: conn?.id || null,
            isRequester: conn ? conn.requesterId === currentUser.id : false,
        });
    } catch (error) {
        logger.error("View profile error", error);
        res.status(500).json({ message: "Failed to fetch profile" });
    }
});

// ─── Connection: Send Request ─────────────────────────────────────────────────
router.post("/connect/:userId", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    const user = req.user as any;
    const targetId = parseInt(req.params.userId);

    if (targetId === user.id) return res.status(400).json({ message: "Cannot connect with yourself" });

    try {
        // Check if connection already exists
        const [existing] = await db
            .select()
            .from(connections)
            .where(
                or(
                    and(eq(connections.requesterId, user.id), eq(connections.receiverId, targetId)),
                    and(eq(connections.requesterId, targetId), eq(connections.receiverId, user.id))
                )
            );

        if (existing) {
            return res.status(400).json({ message: `Connection already exists (${existing.status})` });
        }

        const [conn] = await db
            .insert(connections)
            .values({ requesterId: user.id, receiverId: targetId })
            .returning();

        res.json(conn);
    } catch (error) {
        logger.error("Connection request error", error);
        res.status(500).json({ message: "Failed to send connection request" });
    }
});

// ─── Connection: Accept/Decline ───────────────────────────────────────────────
router.put("/connections/:id/:action", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    const user = req.user as any;
    const connId = parseInt(req.params.id);
    const action = req.params.action; // "accept" or "decline"

    if (!["accept", "decline"].includes(action)) {
        return res.status(400).json({ message: "Invalid action" });
    }

    try {
        const [conn] = await db.select().from(connections).where(eq(connections.id, connId));
        if (!conn || conn.receiverId !== user.id) {
            return res.status(404).json({ message: "Connection request not found" });
        }

        const [updated] = await db
            .update(connections)
            .set({ status: action === "accept" ? "accepted" : "declined", updatedAt: new Date() })
            .where(eq(connections.id, connId))
            .returning();

        res.json(updated);
    } catch (error) {
        logger.error("Connection action error", error);
        res.status(500).json({ message: "Failed to update connection" });
    }
});

// ─── Connection: Remove ───────────────────────────────────────────────────────
router.delete("/connections/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    const user = req.user as any;
    const connId = parseInt(req.params.id);

    try {
        const [conn] = await db.select().from(connections).where(eq(connections.id, connId));
        if (!conn || (conn.requesterId !== user.id && conn.receiverId !== user.id)) {
            return res.status(404).json({ message: "Connection not found" });
        }

        await db.delete(connections).where(eq(connections.id, connId));
        res.json({ success: true });
    } catch (error) {
        logger.error("Connection delete error", error);
        res.status(500).json({ message: "Failed to remove connection" });
    }
});

// ─── My Connections ───────────────────────────────────────────────────────────
router.get("/connections/list", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    const user = req.user as any;
    const status = (req.query.status as string) || "accepted";

    try {
        const conns = await db
            .select()
            .from(connections)
            .where(
                and(
                    eq(connections.status, status),
                    or(
                        eq(connections.requesterId, user.id),
                        eq(connections.receiverId, user.id)
                    )
                )
            )
            .orderBy(desc(connections.updatedAt));

        // Fetch the other user's profile for each connection
        const connectedUserIds = conns.map((c) =>
            c.requesterId === user.id ? c.receiverId : c.requesterId
        );

        let connectedUsers: any[] = [];
        if (connectedUserIds.length > 0) {
            connectedUsers = await db
                .select({
                    id: users.id,
                    username: users.username,
                    avatar: users.avatar,
                    headline: users.headline,
                    company: users.company,
                    role: users.role,
                })
                .from(users)
                .where(
                    or(...connectedUserIds.map((id) => eq(users.id, id)))
                );
        }

        const result = conns.map((c) => {
            const otherId = c.requesterId === user.id ? c.receiverId : c.requesterId;
            const otherUser = connectedUsers.find((u) => u.id === otherId);
            return {
                connectionId: c.id,
                status: c.status,
                isRequester: c.requesterId === user.id,
                createdAt: c.createdAt,
                user: otherUser || null,
            };
        });

        res.json(result);
    } catch (error) {
        logger.error("Connections list error", error);
        res.status(500).json({ message: "Failed to fetch connections" });
    }
});

// ─── Pending Requests (received) ──────────────────────────────────────────────
router.get("/connections/pending", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    const user = req.user as any;

    try {
        const pending = await db
            .select()
            .from(connections)
            .where(
                and(
                    eq(connections.receiverId, user.id),
                    eq(connections.status, "pending")
                )
            )
            .orderBy(desc(connections.createdAt));

        const requesterIds = pending.map((c) => c.requesterId);
        let requesters: any[] = [];
        if (requesterIds.length > 0) {
            requesters = await db
                .select({
                    id: users.id,
                    username: users.username,
                    avatar: users.avatar,
                    headline: users.headline,
                    company: users.company,
                })
                .from(users)
                .where(or(...requesterIds.map((id) => eq(users.id, id))));
        }

        const result = pending.map((c) => ({
            connectionId: c.id,
            createdAt: c.createdAt,
            user: requesters.find((u) => u.id === c.requesterId) || null,
        }));

        res.json(result);
    } catch (error) {
        logger.error("Pending connections error", error);
        res.status(500).json({ message: "Failed to fetch pending requests" });
    }
});

export default router;
