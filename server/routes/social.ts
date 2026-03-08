import { Router } from "express";
import { db } from "../db";
import { posts, postLikes, postComments, stories, users } from "@shared/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { logger } from "../logger";

const router = Router();

// ─── Stories ─────────────────────────────────────────────────────────────────

// Get active stories from the network
router.get("/stories", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });

    try {
        const now = new Date();
        const result = await db
            .select({
                id: stories.id,
                mediaUrl: stories.mediaUrl,
                createdAt: stories.createdAt,
                user: {
                    id: users.id,
                    username: users.username,
                    avatar: users.avatar,
                }
            })
            .from(stories)
            .innerJoin(users, eq(stories.userId, users.id))
            .where(sql`${stories.expiresAt} > ${now}`)
            .orderBy(desc(stories.createdAt));

        res.json(result);
    } catch (error) {
        logger.error("Fetch stories error", error);
        res.status(500).json({ message: "Failed to fetch stories" });
    }
});

// Create a new story
router.post("/stories", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    const { mediaUrl } = req.body;
    const user = req.user as any;

    if (!mediaUrl) return res.status(400).json({ message: "Media URL is required" });

    try {
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);

        const [story] = await db
            .insert(stories)
            .values({
                userId: user.id,
                mediaUrl,
                expiresAt,
            })
            .returning();

        res.json(story);
    } catch (error) {
        logger.error("Create story error", error);
        res.status(500).json({ message: "Failed to create story" });
    }
});

// ─── Posts ───────────────────────────────────────────────────────────────────

// Get feed of latest posts
router.get("/posts", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });

    const userId = req.query.userId ? parseInt(req.query.userId as string) : null;

    try {
        let query = db
            .select({
                id: posts.id,
                content: posts.content,
                mediaUrl: posts.mediaUrl,
                createdAt: posts.createdAt,
                user: {
                    id: users.id,
                    username: users.username,
                    avatar: users.avatar,
                    headline: users.headline,
                }
            })
            .from(posts)
            .innerJoin(users, eq(posts.userId, users.id));

        if (userId) {
            // @ts-ignore - Drizzle query builder typing can be tricky with dynamic where
            query = query.where(eq(posts.userId, userId));
        }

        const result = await query.orderBy(desc(posts.createdAt));

        // Get likes and comments count for each post
        const postsWithMeta = await Promise.all(result.map(async (post) => {
            const [likesCount] = await db
                .select({ count: sql<number>`count(*)` })
                .from(postLikes)
                .where(eq(postLikes.postId, post.id));

            const [commentsCount] = await db
                .select({ count: sql<number>`count(*)` })
                .from(postComments)
                .where(eq(postComments.postId, post.id));

            const [userLike] = await db
                .select()
                .from(postLikes)
                .where(and(eq(postLikes.postId, post.id), eq(postLikes.userId, (req.user as any).id)));

            return {
                ...post,
                likesCount: Number(likesCount.count),
                commentsCount: Number(commentsCount.count),
                hasLiked: !!userLike,
            };
        }));

        res.json(postsWithMeta);
    } catch (error) {
        logger.error("Fetch posts error", error);
        res.status(500).json({ message: "Failed to fetch posts" });
    }
});

// Create a new post
router.post("/posts", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    const { content, mediaUrl } = req.body;
    const user = req.user as any;

    try {
        const [post] = await db
            .insert(posts)
            .values({
                userId: user.id,
                content,
                mediaUrl,
            })
            .returning();

        res.json(post);
    } catch (error) {
        logger.error("Create post error", error);
        res.status(500).json({ message: "Failed to create post" });
    }
});

// Toggle like on a post
router.post("/posts/:id/like", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    const postId = parseInt(req.params.id);
    const userId = (req.user as any).id;

    try {
        const [existing] = await db
            .select()
            .from(postLikes)
            .where(and(eq(postLikes.postId, postId), eq(postLikes.userId, userId)));

        if (existing) {
            await db.delete(postLikes).where(eq(postLikes.id, existing.id));
            res.json({ liked: false });
        } else {
            await db.insert(postLikes).values({ postId, userId });
            res.json({ liked: true });
        }
    } catch (error) {
        logger.error("Toggle like error", error);
        res.status(500).json({ message: "Failed to toggle like" });
    }
});

// Add a comment to a post
router.post("/posts/:id/comment", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    const postId = parseInt(req.params.id);
    const { content } = req.body;
    const userId = (req.user as any).id;

    if (!content) return res.status(400).json({ message: "Comment content is required" });

    try {
        const [comment] = await db
            .insert(postComments)
            .values({
                postId,
                userId,
                content,
            })
            .returning();

        res.json(comment);
    } catch (error) {
        logger.error("Add comment error", error);
        res.status(500).json({ message: "Failed to add comment" });
    }
});

export default router;
