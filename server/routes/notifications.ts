import { Router } from "express";
import { db } from "../db";
import { messages, conversations, connections } from "@shared/schema";
import { eq, and, or, sql } from "drizzle-orm";
import { logger } from "../logger";

const router = Router();

router.get("/counts", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    const user = req.user as any;

    try {
        // 1. Unread Messages Count
        // Find messages in user's conversations where sender is not the user and readAt is null
        const unreadResult = await db
            .select({
                count: sql<number>`count(*)`
            })
            .from(messages)
            .innerJoin(conversations, eq(messages.conversationId, conversations.id))
            .where(
                and(
                    or(
                        eq(conversations.user1Id, user.id),
                        eq(conversations.user2Id, user.id)
                    ),
                    sql`${messages.senderId} != ${user.id}`,
                    sql`${messages.readAt} IS NULL`
                )
            );
        const unreadMessagesCount = Number(unreadResult[0]?.count || 0);

        // 2. Pending Connections Count
        const pendingResult = await db
            .select({
                count: sql<number>`count(*)`
            })
            .from(connections)
            .where(
                and(
                    eq(connections.receiverId, user.id),
                    eq(connections.status, "pending")
                )
            );
        const pendingConnectionsCount = Number(pendingResult[0]?.count || 0);

        res.json({
            unreadMessages: unreadMessagesCount,
            pendingConnections: pendingConnectionsCount,
            total: unreadMessagesCount + pendingConnectionsCount
        });
    } catch (error) {
        logger.error("Failed to fetch notification counts", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

export default router;
