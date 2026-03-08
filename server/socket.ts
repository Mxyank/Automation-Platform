import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import { logger } from "./logger";
import { db } from "./db";
import { messages, conversations, users } from "@shared/schema";
import { eq, and, or, isNull } from "drizzle-orm";

export function setupSocket(server: HttpServer) {
    const io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
        },
        path: "/socket.io",
    });

    // Map to store active user sockets: userId -> Set of socket IDs
    const userSockets = new Map<number, Set<string>>();

    io.on("connection", (socket: Socket) => {
        logger.info(`Socket connected: ${socket.id}`);

        socket.on("authenticate", (rawUserId: any) => {
            const userId = parseInt(rawUserId);
            if (!userId || isNaN(userId)) {
                logger.warn(`Socket ${socket.id} tried to authenticate with invalid userId: ${rawUserId}`);
                return;
            }

            if (!userSockets.has(userId)) {
                userSockets.set(userId, new Set());
            }
            userSockets.get(userId)?.add(socket.id);
            (socket as any).userId = userId;

            logger.info(`User ${userId} authenticated on socket ${socket.id}. Active sockets: ${userSockets.get(userId)?.size}`);
        });

        socket.on("send_message", async (data: {
            receiverId: number;
            content: string;
            conversationId?: number
        }) => {
            const senderId = (socket as any).userId;
            if (!senderId) return;

            try {
                let convId = data.conversationId;

                // 1. If no conversationId, check or create one
                if (!convId) {
                    const [existing] = await db
                        .select()
                        .from(conversations)
                        .where(
                            or(
                                and(eq(conversations.user1Id, senderId), eq(conversations.user2Id, data.receiverId)),
                                and(eq(conversations.user1Id, data.receiverId), eq(conversations.user2Id, senderId))
                            )
                        );

                    if (existing) {
                        convId = existing.id;
                    } else {
                        const [newConv] = await db
                            .insert(conversations)
                            .values({
                                user1Id: senderId,
                                user2Id: data.receiverId,
                            })
                            .returning();
                        convId = newConv.id;
                    }
                }

                // 2. Save message to DB
                const [msg] = await db
                    .insert(messages)
                    .values({
                        conversationId: convId!,
                        senderId,
                        content: data.content,
                    })
                    .returning();

                // Update conversation's lastMessageAt
                await db.update(conversations).set({ lastMessageAt: new Date() }).where(eq(conversations.id, convId!));

                // 3. Emit to receiver's active sockets
                const receiverId = parseInt(data.receiverId as any);
                const receiverSockets = userSockets.get(receiverId);
                logger.debug(`Sending message to receiver ${receiverId}, found ${receiverSockets?.size || 0} sockets`);

                if (receiverSockets) {
                    receiverSockets.forEach(sId => {
                        io.to(sId).emit("new_message", msg);
                    });
                }

                // 4. Emit back to sender's other sockets (for sync)
                const senderSockets = userSockets.get(senderId);
                if (senderSockets) {
                    senderSockets.forEach(sId => {
                        if (sId !== socket.id) {
                            io.to(sId).emit("new_message", msg);
                        }
                    });
                }

                // 5. Explicitly confirm to the current socket
                socket.emit("message_sent", msg);
                logger.info(`Message ${msg.id} processed from user ${senderId} to ${receiverId}`);

            } catch (error) {
                logger.error("Socket message error", error);
                socket.emit("error", { message: "Failed to send message" });
            }
        });

        socket.on("mark_read", async (data: { conversationId: number }) => {
            const userId = (socket as any).userId;
            if (!userId || !data.conversationId) return;

            try {
                // Find the conversation to get the other user ID
                const [conv] = await db
                    .select()
                    .from(conversations)
                    .where(eq(conversations.id, data.conversationId));

                if (!conv) return;

                const otherId = conv.user1Id === userId ? conv.user2Id : conv.user1Id;

                // Update messages in DB
                await db
                    .update(messages)
                    .set({ readAt: new Date() })
                    .where(
                        and(
                            eq(messages.conversationId, data.conversationId),
                            eq(messages.senderId, otherId),
                            isNull(messages.readAt)
                        )
                    );

                // Notify the other user (the sender) that their messages were read
                const otherSockets = userSockets.get(otherId);
                if (otherSockets) {
                    otherSockets.forEach(sId => {
                        io.to(sId).emit("messages_read", {
                            conversationId: data.conversationId,
                            readAt: new Date(),
                        });
                    });
                }

                logger.info(`User ${userId} marked conversation ${data.conversationId} as read`);
            } catch (error) {
                logger.error("Socket mark_read error", error);
            }
        });

        socket.on("disconnect", () => {
            const userId = (socket as any).userId;
            if (userId && userSockets.has(userId)) {
                userSockets.get(userId)?.delete(socket.id);
                if (userSockets.get(userId)?.size === 0) {
                    userSockets.delete(userId);
                }
            }
            logger.info(`Socket disconnected: ${socket.id}`);
        });
    });

    return io;
}
