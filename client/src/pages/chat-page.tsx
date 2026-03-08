import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Loader2, Send, Search, MessageSquare,
    MoreVertical, Phone, Video, Info, ChevronLeft,
    Plus, Image as ImageIcon, Smile, CheckCheck,
    Folder, Monitor, ShieldCheck, Zap
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { io, Socket } from "socket.io-client";
import { useLocation } from "wouter";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

export default function ChatPage() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [location, setLocation] = useLocation();
    const params = new URLSearchParams(window.location.search);
    const targetUserId = params.get("user");

    const [activeConvId, setActiveConvId] = useState<number | null>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const socketRef = useRef<Socket | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const [isTyping, setIsTyping] = useState(false);

    // 1. Fetch all conversations
    const { data: conversations, isLoading: loadingConvs } = useQuery<any[]>({
        queryKey: ["/api/chat/conversations"],
        refetchInterval: 5000, // Polling fallback
    });

    // 2. Fetch or Create conversation if targetUserId is present
    useEffect(() => {
        if (targetUserId) {
            const userId = parseInt(targetUserId);
            if (isNaN(userId)) return;

            apiRequest("GET", `/api/chat/conversations/with/${userId}`)
                .then((res) => res.json())
                .then((conv) => {
                    setActiveConvId(conv.id);
                    queryClient.invalidateQueries({ queryKey: ["/api/chat/conversations"] });
                })
                .catch(err => console.error("Failed to fetch/create conversation:", err));
        }
    }, [targetUserId, queryClient]);

    // 3. Fetch messages for active conversation
    const { data: history, isLoading: loadingHistory } = useQuery<any[]>({
        queryKey: [`/api/chat/messages/${activeConvId}`],
        enabled: !!activeConvId,
    });

    useEffect(() => {
        if (history) setMessages(history);
        if (activeConvId) {
            // Mark as read when opening
            socketRef.current?.emit("mark_read", { conversationId: activeConvId });
            apiRequest("PUT", `/api/chat/conversations/${activeConvId}/read`);
        }
    }, [history, activeConvId]);

    // 4. Socket.IO Setup
    useEffect(() => {
        if (!user) return;

        const socket = io(window.location.origin, {
            path: "/socket.io",
        });

        socket.on("connect", () => {
            socket.emit("authenticate", user.id);
        });

        socket.on("new_message", (msg) => {
            if (msg.conversationId === activeConvId) {
                setMessages((prev) => {
                    const exists = prev.some(m => m.id === msg.id);
                    if (exists) return prev;
                    return [...prev, msg];
                });
                // Mark as read immediately if chat is open
                socket.emit("mark_read", { conversationId: activeConvId });
            }
            queryClient.invalidateQueries({ queryKey: ["/api/chat/conversations"] });
        });

        socket.on("message_sent", (msg) => {
            if (msg.conversationId === activeConvId) {
                setMessages((prev) => {
                    const index = prev.findIndex(m => typeof m.id === 'string' && m.id.startsWith('temp-') && m.content === msg.content);
                    if (index !== -1) {
                        const newMsgs = [...prev];
                        newMsgs[index] = msg;
                        return newMsgs;
                    }
                    if (prev.some(m => m.id === msg.id)) return prev;
                    return [...prev, msg];
                });
            }
        });

        socket.on("messages_read", (data) => {
            if (data.conversationId === activeConvId) {
                setMessages(prev => prev.map(m =>
                    m.senderId === user.id && !m.readAt ? { ...m, readAt: data.readAt } : m
                ));
            }
        });

        socketRef.current = socket;
        return () => { socket.disconnect(); };
    }, [user, activeConvId, queryClient]);

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !activeConvId || !socketRef.current) return;

        const activeConv = conversations?.find(c => c.id === activeConvId);
        const receiverId = activeConv?.user1Id === user?.id ? activeConv?.user2Id : activeConv?.user1Id;

        const tempId = `temp-${Date.now()}`;
        const msgData = {
            conversationId: activeConvId,
            receiverId,
            content: newMessage,
        };

        socketRef.current.emit("send_message", msgData);

        setMessages((prev) => [
            ...prev,
            {
                id: tempId,
                senderId: user?.id,
                content: newMessage,
                createdAt: new Date().toISOString(),
                readAt: null
            },
        ]);

        setNewMessage("");
    };

    const activeConversation = conversations?.find((c) => c.id === activeConvId);

    return (
        <div className="flex h-screen bg-[#050505] text-white overflow-hidden selection:bg-purple-500/30">
            {/* Sidebar: Conversation List */}
            <div className={cn(
                "w-full md:w-[360px] border-r border-white/5 flex flex-col bg-black/40 backdrop-blur-2xl z-20 transition-all duration-300",
                activeConvId && "hidden md:flex"
            )}>
                {/* MESSAGES Brand Header */}
                <div className="p-8 pb-4">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-[1px]">
                                <div className="w-full h-full rounded-xl bg-black flex items-center justify-center">
                                    <MessageSquare className="w-5 h-5 text-purple-400 fill-purple-400" />
                                </div>
                            </div>
                            <h1 className="text-2xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
                                MESSAGES
                            </h1>
                        </div>
                        <Button variant="ghost" size="icon" className="rounded-full bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all">
                            <Plus className="w-5 h-5" />
                        </Button>
                    </div>

                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-purple-400 transition-colors" />
                        <Input
                            placeholder="Search signals..."
                            className="bg-white/5 border-none h-12 pl-12 rounded-2xl focus:ring-1 focus:ring-purple-500/50 transition-all placeholder:text-white/20"
                        />
                    </div>
                </div>

                <ScrollArea className="flex-1 px-4">
                    <div className="py-4 space-y-2">
                        {loadingConvs ? (
                            <div className="flex justify-center py-10"><Loader2 className="animate-spin text-purple-500/50" /></div>
                        ) : conversations?.map((conv) => (
                            <button
                                key={conv.id}
                                onClick={() => setActiveConvId(conv.id)}
                                className={cn(
                                    "w-full p-4 rounded-[24px] flex items-center gap-4 transition-all duration-300 relative group",
                                    activeConvId === conv.id
                                        ? "bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-white/10 shadow-[0_8px_32px_rgba(139,92,246,0.1)]"
                                        : "hover:bg-white/5 border border-transparent"
                                )}
                            >
                                <div className="relative">
                                    <Avatar className="w-14 h-14 border-2 border-white/5 group-hover:border-purple-500/30 transition-all">
                                        <AvatarImage src={conv.otherUser?.avatar || undefined} />
                                        <AvatarFallback className="bg-white/5 text-xs">{conv.otherUser?.username?.[0]?.toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#121212] shadow-lg" />
                                </div>

                                <div className="flex-1 text-left min-w-0">
                                    <div className="flex justify-between items-center mb-1">
                                        <h4 className="font-bold text-base truncate pr-2 group-hover:text-purple-300 transition-colors">
                                            {conv.otherUser?.username}
                                        </h4>
                                        <span className="text-[11px] font-medium text-white/30 uppercase tracking-widest">
                                            {conv.lastMessageAt && format(new Date(conv.lastMessageAt), "HH:mm")}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm text-white/40 truncate font-medium">
                                            {conv.otherUser?.headline || "Standby for uplink..."}
                                        </p>
                                        {conv.unreadCount > 0 && (
                                            <div className="min-w-[18px] h-[18px] flex items-center justify-center bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full text-[10px] font-bold shadow-lg shadow-purple-500/20 px-1 animate-pulse">
                                                {conv.unreadCount}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                {activeConvId === conv.id && (
                                    <motion.div layoutId="active" className="absolute inset-0 bg-white/5 rounded-[24px] -z-10" />
                                )}
                            </button>
                        ))}
                    </div>
                </ScrollArea>

                <div className="p-8 border-t border-white/5 flex items-center justify-between opacity-40 hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="hover:bg-white/10 rounded-xl"><Monitor className="w-5 h-5" /></Button>
                    <Button variant="ghost" size="icon" className="hover:bg-white/10 rounded-xl"><ShieldCheck className="w-5 h-5" /></Button>
                    <Button variant="ghost" onClick={() => setLocation("/profile")} className="rounded-xl flex gap-2">
                        <Avatar className="w-6 h-6 border border-white/10">
                            <AvatarImage src={user?.avatar || undefined} />
                        </Avatar>
                        <span className="text-xs font-bold uppercase tracking-widest">{user?.username}</span>
                    </Button>
                </div>
            </div>

            {/* Main: Chat Area */}
            <div className={cn(
                "flex-1 flex flex-col bg-black relative lg:ml-[1px]",
                !activeConvId && "hidden md:flex items-center justify-center bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.05),transparent)]"
            )}>
                {activeConvId ? (
                    <>
                        {/* Status Badge */}
                        <div className="absolute top-8 left-1/2 -translate-x-1/2 z-10 hidden md:block">
                            <div className="px-6 py-2 rounded-full bg-white/5 backdrop-blur-3xl border border-white/10 flex items-center gap-3 shadow-2xl">
                                <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
                                <span className="text-[10px] font-black tracking-[0.2em] text-white/40 uppercase">Encrypted Channel Established</span>
                            </div>
                        </div>

                        {/* Top Action Bar (Right Floating) */}
                        <div className="absolute top-8 right-8 z-10 hidden md:flex flex-col gap-2">
                            <Button variant="ghost" size="icon" className="w-12 h-12 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/10 transition-all">
                                <Video className="w-5 h-5 text-white/40" />
                            </Button>
                            <Button variant="ghost" size="icon" className="w-12 h-12 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/10 transition-all">
                                <Folder className="w-5 h-5 text-white/40" />
                            </Button>
                            <Button variant="ghost" size="icon" className="w-12 h-12 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/10 transition-all">
                                <MoreVertical className="w-5 h-5 text-white/40" />
                            </Button>
                        </div>

                        {/* Messages Area */}
                        <ScrollArea className="flex-1 h-full">
                            <div className="max-w-4xl mx-auto px-8 pt-32 pb-48 space-y-12">
                                <AnimatePresence initial={false}>
                                    {messages.map((msg, i) => {
                                        const isMe = msg.senderId === user?.id;
                                        const showAvatar = !isMe && (i === 0 || messages[i - 1].senderId !== msg.senderId);

                                        return (
                                            <motion.div
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                key={msg.id || i}
                                                className={cn("flex items-end gap-4", isMe ? "justify-end" : "justify-start")}
                                            >
                                                <div className="w-10 flex-shrink-0">
                                                    {showAvatar && (
                                                        <Avatar className="w-10 h-10 border border-white/10 shadow-xl">
                                                            <AvatarImage src={activeConversation?.otherUser?.avatar || undefined} />
                                                            <AvatarFallback>{activeConversation?.otherUser?.username?.[0]}</AvatarFallback>
                                                        </Avatar>
                                                    )}
                                                </div>

                                                <div className={cn("flex flex-col gap-2 group", isMe ? "items-end" : "items-start")}>
                                                    <div className={cn(
                                                        "px-6 py-4 rounded-[32px] text-[15px] max-w-lg leading-relaxed shadow-2xl relative",
                                                        isMe
                                                            ? "bg-gradient-to-br from-indigo-600/90 to-purple-600/90 text-white rounded-br-lg"
                                                            : "bg-white/5 backdrop-blur-2xl border border-white/10 text-white/90 rounded-bl-lg"
                                                    )}>
                                                        {msg.content}
                                                    </div>

                                                    <div className="flex items-center gap-2 px-2">
                                                        <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">
                                                            {format(new Date(msg.createdAt), "HH:mm")} UTC
                                                        </span>
                                                        {isMe && (
                                                            <CheckCheck className={cn(
                                                                "w-4 h-4 transition-colors",
                                                                msg.readAt ? "text-purple-400" : "text-white/10"
                                                            )} />
                                                        )}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>
                                <div ref={scrollRef} />
                            </div>
                        </ScrollArea>

                        {/* Glass Input Bar */}
                        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-[90%] max-w-4xl z-20">
                            <form
                                onSubmit={handleSend}
                                className="bg-white/5 backdrop-blur-[40px] border border-white/10 rounded-[32px] p-2 flex items-center gap-2 shadow-[0_24px_48px_rgba(0,0,0,0.4)]"
                            >
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="w-12 h-12 rounded-full text-white/40 hover:bg-white/5 hover:text-white"
                                >
                                    <Plus className="w-5 h-5" />
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="w-12 h-12 rounded-full text-white/40 hover:bg-white/5 hover:text-white"
                                >
                                    <ImageIcon className="w-5 h-5" />
                                </Button>

                                <Input
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Transmit message..."
                                    className="flex-1 bg-transparent border-none py-6 text-base focus-visible:ring-0 placeholder:text-white/20 h-12"
                                />

                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="w-12 h-12 rounded-full text-white/40 hover:bg-white/5 hover:text-white"
                                >
                                    <Smile className="w-5 h-5" />
                                </Button>

                                <Button
                                    type="submit"
                                    disabled={!newMessage.trim()}
                                    className="w-14 h-12 rounded-[24px] bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-[0_8px_16px_rgba(139,92,246,0.3)] hover:scale-105 active:scale-95 transition-all disabled:opacity-30 disabled:hover:scale-100"
                                >
                                    <Send className="w-5 h-5" />
                                </Button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center text-center max-w-md px-8 animate-in fade-in zoom-in duration-1000">
                        <div className="w-32 h-32 rounded-[48px] bg-white/5 flex items-center justify-center mb-8 border border-white/10 shadow-[inner_0_0_24px_rgba(255,255,255,0.05)] relative group overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                            <MessageSquare className="w-12 h-12 text-purple-400 group-hover:scale-110 transition-transform duration-500" />
                        </div>
                        <h3 className="text-3xl font-black tracking-tight mb-4">Select Message</h3>
                        <p className="text-white/40 text-lg leading-relaxed mb-8">
                            Initialize a secure uplink through the platform's neural network to begin transmission.
                        </p>
                        <Button
                            onClick={() => setLocation("/network")}
                            className="h-14 px-8 rounded-full bg-white text-black font-black uppercase tracking-widest hover:bg-white/90 hover:scale-105 active:scale-95 transition-all shadow-2xl"
                        >
                            Establish Link
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
