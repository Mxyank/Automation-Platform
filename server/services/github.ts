import { logger } from "../logger";

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID?.trim();
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET?.trim();
const APP_URL = process.env.APP_URL || "http://localhost:5002";

export function isGitHubConfigured(): boolean {
    return !!(GITHUB_CLIENT_ID && GITHUB_CLIENT_SECRET);
}

/** Build the GitHub OAuth authorization URL */
export function getGitHubAuthUrl(state: string): string {
    const params = new URLSearchParams({
        client_id: GITHUB_CLIENT_ID || "",
        redirect_uri: `${APP_URL}/api/github/callback`,
        scope: "repo read:user",
        state,
    });
    return `https://github.com/login/oauth/authorize?${params.toString()}`;
}

/** Exchange OAuth code for an access token */
export async function exchangeCodeForToken(code: string): Promise<string> {
    const res = await fetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            client_id: GITHUB_CLIENT_ID,
            client_secret: GITHUB_CLIENT_SECRET,
            code,
        }),
    });

    const data = await res.json();
    if (data.error) {
        logger.error("GitHub OAuth error", data);
        throw new Error(data.error_description || "GitHub OAuth failed");
    }
    return data.access_token;
}

/** Fetch the authenticated GitHub user profile */
export async function fetchGitHubUser(token: string): Promise<{ login: string; avatar_url: string; name: string }> {
    const res = await fetch("https://api.github.com/user", {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" },
    });
    if (!res.ok) throw new Error("Failed to fetch GitHub user");
    return res.json();
}

/** List the user's repositories (up to 100, sorted by updated) */
export async function fetchUserRepos(token: string): Promise<any[]> {
    const res = await fetch(
        "https://api.github.com/user/repos?per_page=100&sort=updated&direction=desc&type=all",
        { headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" } }
    );
    if (!res.ok) throw new Error("Failed to fetch repositories");
    const repos = await res.json();
    return repos.map((r: any) => ({
        id: r.id,
        name: r.name,
        fullName: r.full_name,
        description: r.description,
        language: r.language,
        private: r.private,
        stargazersCount: r.stargazers_count,
        forksCount: r.forks_count,
        updatedAt: r.updated_at,
        defaultBranch: r.default_branch,
        owner: r.owner.login,
        htmlUrl: r.html_url,
        size: r.size,
    }));
}

/** Fetch the file tree of a repository (recursive, limited to text files) */
export async function fetchRepoTree(
    token: string,
    owner: string,
    repo: string,
    branch: string = "main"
): Promise<{ path: string; size: number }[]> {
    const res = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
        { headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" } }
    );
    if (!res.ok) {
        // Try 'master' if 'main' fails
        if (branch === "main") {
            return fetchRepoTree(token, owner, repo, "master");
        }
        throw new Error(`Failed to fetch repo tree for ${owner}/${repo}`);
    }
    const data = await res.json();
    const securityRelevantExtensions = [
        ".js", ".ts", ".tsx", ".jsx", ".py", ".java", ".go", ".rb", ".php",
        ".yml", ".yaml", ".json", ".toml", ".env", ".env.example",
        ".dockerfile", ".sh", ".bash", ".sql", ".tf", ".hcl",
        ".xml", ".properties", ".cfg", ".ini", ".conf",
    ];
    const ignoredPaths = ["node_modules/", "dist/", "build/", ".git/", "vendor/", "__pycache__/", ".next/"];

    return (data.tree || [])
        .filter((f: any) => {
            if (f.type !== "blob") return false;
            if (f.size > 50000) return false; // Skip files >50KB
            const lower = f.path.toLowerCase();
            if (ignoredPaths.some(ip => lower.includes(ip))) return false;
            // Include Dockerfile, Makefile, etc. (no extension)
            const baseName = lower.split("/").pop() || "";
            if (["dockerfile", "makefile", "jenkinsfile", "vagrantfile", ".gitignore", ".dockerignore"].includes(baseName)) return true;
            return securityRelevantExtensions.some(ext => lower.endsWith(ext));
        })
        .map((f: any) => ({ path: f.path, size: f.size }));
}

/** Fetch content of a single file */
export async function fetchFileContent(
    token: string,
    owner: string,
    repo: string,
    path: string
): Promise<string> {
    const res = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
        { headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" } }
    );
    if (!res.ok) return "";
    const data = await res.json();
    if (data.encoding === "base64" && data.content) {
        return Buffer.from(data.content, "base64").toString("utf-8");
    }
    return "";
}

/**
 * Fetch key security-relevant files from a repo.
 * Limits to ~20 most important files to stay within AI token limits.
 */
export async function fetchSecurityFiles(
    token: string,
    owner: string,
    repo: string
): Promise<{ path: string; content: string }[]> {
    const tree = await fetchRepoTree(token, owner, repo);

    // Prioritize certain file types
    const priorityPatterns = [
        /dockerfile/i, /docker-compose/i, /\.env/i, /\.yml$/i, /\.yaml$/i,
        /jenkinsfile/i, /\.tf$/i, /\.sh$/i, /package\.json$/i,
        /requirements\.txt$/i, /pom\.xml$/i, /\.sql$/i, /\.conf$/i,
    ];

    const sorted = tree.sort((a, b) => {
        const aPriority = priorityPatterns.some(p => p.test(a.path)) ? 0 : 1;
        const bPriority = priorityPatterns.some(p => p.test(b.path)) ? 0 : 1;
        return aPriority - bPriority;
    });

    const selected = sorted.slice(0, 20);

    const files: { path: string; content: string }[] = [];
    for (const file of selected) {
        try {
            const content = await fetchFileContent(token, owner, repo, file.path);
            if (content.trim()) {
                files.push({ path: file.path, content: content.slice(0, 5000) }); // Cap per file
            }
        } catch {
            // Skip unreadable files
        }
    }

    return files;
}
