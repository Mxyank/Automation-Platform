import { Router } from "express";
import { db } from "../db";
import { messages, conversations, users, connections } from "@shared/schema";
import { eq, and, or, asc, desc, count, isNull } from "drizzle-orm";
import { logger } from "../logger";

const router = Router();

// ─── Get All My Conversations ────────────────────────────────────────────────
router.get("/conversations", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    const user = req.user as any;

    try {
        const convs = await db
            .select()
            .from(conversations)
            .where(
                or(
                    eq(conversations.user1Id, user.id),
                    eq(conversations.user2Id, user.id)
                )
            )
            .orderBy(desc(conversations.lastMessageAt));

        // Fetch the other user's profile and unread count for each conversation
        const result = await Promise.all(convs.map(async (c) => {
            const otherId = c.user1Id === user.id ? c.user2Id : c.user1Id;
            const [otherUser] = await db
                .select({
                    id: users.id,
                    username: users.username,
                    avatar: users.avatar,
                    headline: users.headline,
                })
                .from(users)
                .where(eq(users.id, otherId));

            const [unread] = await db
                .select({ count: count() })
                .from(messages)
                .where(
                    and(
                        eq(messages.conversationId, c.id),
                        eq(messages.senderId, otherId),
                        isNull(messages.readAt)
                    )
                );

            return {
                ...c,
                otherUser: otherUser || null,
                unreadCount: Number(unread.count),
            };
        }));

        res.json(result);
    } catch (error) {
        logger.error("Fetch conversations error", error);
        res.status(500).json({ message: "Failed to fetch conversations" });
    }
});

// ─── Mark Conversation as Read ───────────────────────────────────────────────
router.put("/conversations/:id/read", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    const user = req.user as any;
    const convId = parseInt(req.params.id);

    try {
        // Verify user is part of this conversation
        const [conv] = await db
            .select()
            .from(conversations)
            .where(
                and(
                    eq(conversations.id, convId),
                    or(eq(conversations.user1Id, user.id), eq(conversations.user2Id, user.id))
                )
            );

        if (!conv) {
            return res.status(403).json({ message: "Unauthorized or conversation not found" });
        }

        const otherId = conv.user1Id === user.id ? conv.user2Id : conv.user1Id;

        await db
            .update(messages)
            .set({ readAt: new Date() })
            .where(
                and(
                    eq(messages.conversationId, convId),
                    eq(messages.senderId, otherId),
                    isNull(messages.readAt)
                )
            );

        res.json({ success: true });
    } catch (error) {
        logger.error("Mark as read error", error);
        res.status(500).json({ message: "Failed to mark as read" });
    }
});

// ─── Get Message History ───────────────────────────────────────────────────
router.get("/messages/:conversationId", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    const user = req.user as any;
    const convId = parseInt(req.params.conversationId);

    try {
        // Verify user is part of this conversation
        const [conv] = await db
            .select()
            .from(conversations)
            .where(
                and(
                    eq(conversations.id, convId),
                    or(eq(conversations.user1Id, user.id), eq(conversations.user2Id, user.id))
                )
            );

        if (!conv) {
            return res.status(403).json({ message: "Unauthorized or conversation not found" });
        }

        const msgs = await db
            .select()
            .from(messages)
            .where(eq(messages.conversationId, convId))
            .orderBy(asc(messages.createdAt));

        res.json(msgs);
    } catch (error) {
        logger.error("Fetch messages error", error);
        res.status(500).json({ message: "Failed to fetch messages" });
    }
});

// ─── Get or Create Conversation with User ──────────────────────────────────
router.get("/conversations/with/:userId", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    const user = req.user as any;
    const targetId = parseInt(req.params.userId);

    try {
        // Facebook-style Gate: Check if users are connected and accepted
        const [connection] = await db
            .select()
            .from(connections)
            .where(
                or(
                    and(eq(connections.requesterId, user.id), eq(connections.receiverId, targetId), eq(connections.status, "accepted")),
                    and(eq(connections.requesterId, targetId), eq(connections.receiverId, user.id), eq(connections.status, "accepted"))
                )
            );

        if (!connection) {
            return res.status(403).json({ message: "You must be connected and accepted to start a chat." });
        }

        const [existing] = await db
            .select()
            .from(conversations)
            .where(
                or(
                    and(eq(conversations.user1Id, user.id), eq(conversations.user2Id, targetId)),
                    and(eq(conversations.user1Id, targetId), eq(conversations.user2Id, user.id))
                )
            );

        if (existing) {
            return res.json(existing);
        }

        const [newConv] = await db
            .insert(conversations)
            .values({
                user1Id: user.id,
                user2Id: targetId,
            })
            .returning();

        res.json(newConv);
    } catch (error) {
        logger.error("Get/Create conversation error", error);
        res.status(500).json({ message: "Failed to access conversation" });
    }
});

export default router;
