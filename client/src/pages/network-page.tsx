import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Loader2, UserPlus, Search, UserCheck, Clock,
    MessageSquare, Briefcase, Plus, Heart, Share2,
    ChevronRight, ArrowLeft, Zap, Orbit, Link2
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";

export default function NetworkPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [, setLocation] = useLocation();
    const [search, setSearch] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Queries
    const { data: stories = [] } = useQuery<any[]>({
        queryKey: ["/api/social/flow/stories"],
    });

    const { data: posts = [] } = useQuery<any[]>({
        queryKey: ["/api/social/flow/posts"],
    });

    const { data: discoverUsers = [] } = useQuery<any[]>({
        queryKey: ["/api/profile/discover", search],
        queryFn: async () => {
            const res = await apiRequest("GET", `/api/profile/discover?search=${search}`);
            return res.json();
        }
    });

    // Mutations
    const createStoryMutation = useMutation({
        mutationFn: async (mediaUrl: string) => {
            const res = await apiRequest("POST", "/api/social/flow/stories", { mediaUrl });
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/social/flow/stories"] });
            toast({ title: "Story posted!" });
        }
    });

    const connectMutation = useMutation({
        mutationFn: async (userId: number) => {
            const res = await apiRequest("POST", `/api/profile/connect/${userId}`);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/profile/discover"] });
            toast({ title: "Connection request sent" });
        },
    });

    const createPostMutation = useMutation({
        mutationFn: async (data: { content: string, mediaUrl?: string }) => {
            const res = await apiRequest("POST", "/api/social/flow/posts", data);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/social/flow/posts"] });
            toast({ title: "Post published!" });
        }
    });

    const likePostMutation = useMutation({
        mutationFn: async (postId: number) => {
            const res = await apiRequest("POST", `/api/social/flow/posts/${postId}/like`);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/social/flow/posts"] });
        }
    });

    const handleStoryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            createStoryMutation.mutate(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    return (
        <div className="min-h-screen bg-[#0c0c0c] text-white selection:bg-neon-cyan/30 selection:text-white">
            {/* TOP NAVIGATION / HEADER */}
            <header className="sticky top-0 z-50 bg-[#0c0c0c]/80 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setLocation("/")}
                        className="rounded-full hover:bg-white/5 text-[#94a3b8]"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div className="flex flex-col">
                        <h1 className="text-xl font-bold tracking-tight">Prometix Flow</h1>
                        <p className="text-[10px] text-neon-cyan font-mono tracking-widest uppercase">Network Intelligence Feed</p>
                    </div>
                </div>

                <div className="relative w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]" />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="bg-white/5 border-transparent pl-12 h-11 rounded-full text-sm focus:ring-neon-cyan/20 focus:border-neon-cyan/50 transition-all placeholder:text-[#475569]"
                        placeholder="Scan for engineering nodes..."
                    />
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex -space-x-2">
                        {discoverUsers.slice(0, 3).map((u: any) => (
                            <Avatar key={u.id} className="w-8 h-8 border-2 border-[#0c0c0c]">
                                <AvatarImage src={u.avatar} />
                                <AvatarFallback>{u.username[0]}</AvatarFallback>
                            </Avatar>
                        ))}
                    </div>
                    <span className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-tighter">
                        {discoverUsers.length}+ Active Nodes
                    </span>
                </div>
            </header>

            <main className="max-w-[1400px] mx-auto px-6 py-8 grid grid-cols-12 gap-8">

                {/* LEFT COLUMN: STORIES & FEED */}
                <div className="col-span-12 lg:col-span-8 space-y-8">

                    {/* STORIES HORIZONTAL BAR */}
                    <div className="relative">
                        <div className="flex items-center gap-4 overflow-x-auto pb-4 no-scrollbar">
                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                className="flex-shrink-0 flex flex-col items-center gap-2 group cursor-pointer"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <div className="w-16 h-16 rounded-full border-2 border-dashed border-neon-cyan/50 flex items-center justify-center bg-white/5 transition-colors group-hover:bg-neon-cyan/10">
                                    <Plus className="w-6 h-6 text-neon-cyan" />
                                </div>
                                <span className="text-[10px] font-bold text-[#94a3b8] uppercase">New Status</span>
                                <input type="file" hidden ref={fileInputRef} onChange={handleStoryUpload} accept="image/*" />
                            </motion.div>

                            {stories.map((story: any) => (
                                <div key={story.id} className="flex-shrink-0 flex flex-col items-center gap-2">
                                    <div className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-neon-purple to-neon-cyan">
                                        <div className="w-full h-full rounded-full border-4 border-[#0c0c0c] overflow-hidden bg-[#1f1f1f]">
                                            <Avatar className="w-full h-full">
                                                <AvatarImage src={story.user.avatar} className="object-cover" />
                                                <AvatarFallback>{story.user.username[0]}</AvatarFallback>
                                            </Avatar>
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-bold text-white truncate w-16 text-center">{story.user.username}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* CREATE POST COMPONENT */}
                    <div className="bg-[#111111] border border-white/5 rounded-[2.5rem] p-6 space-y-4">
                        <div className="flex gap-4">
                            <Avatar className="w-12 h-12 rounded-2xl border border-white/10">
                                <AvatarImage src={user?.avatar || undefined} />
                                <AvatarFallback>{user?.username?.[0]}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <textarea
                                    className="w-full bg-transparent border-none focus:ring-0 text-lg placeholder:text-[#475569] resize-none h-20"
                                    placeholder="What's your latest deployment or insight?"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            const content = e.currentTarget.value;
                                            if (content.trim()) {
                                                createPostMutation.mutate({ content });
                                                e.currentTarget.value = "";
                                            }
                                        }
                                    }}
                                />
                            </div>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-white/5">
                            <div className="flex items-center gap-4">
                                <Button variant="ghost" size="sm" className="text-[#94a3b8] hover:text-neon-cyan hover:bg-white/5 font-bold uppercase text-[10px] tracking-widest px-4">
                                    <Share2 className="w-4 h-4 mr-2" /> Attachment
                                </Button>
                                <Button variant="ghost" size="sm" className="text-[#94a3b8] hover:text-neon-cyan hover:bg-white/5 font-bold uppercase text-[10px] tracking-widest px-4">
                                    <Orbit className="w-4 h-4 mr-2" /> Sector
                                </Button>
                            </div>
                            <Button className="bg-neon-cyan hover:bg-neon-cyan/90 text-black font-black px-6 rounded-xl text-[10px] uppercase tracking-tighter shadow-lg shadow-neon-cyan/20">
                                Post Node
                            </Button>
                        </div>
                    </div>

                    {/* HERO FEATURED POST (Latest Post) */}
                    {posts.length > 0 ? (
                        <motion.section
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="relative rounded-[2.5rem] bg-gradient-to-br from-neon-purple/5 to-neon-cyan/5 border border-white/5 overflow-hidden p-8 flex flex-col md:flex-row gap-8 min-h-[300px]"
                        >
                            <div className="flex-1 space-y-6">
                                <div className="flex items-center gap-3">
                                    <Badge className="bg-neon-cyan text-black font-black text-[10px] px-3 py-1 uppercase tracking-tighter shadow-lg shadow-neon-cyan/20">Latest Node Activity</Badge>
                                    <span className="text-[#94a3b8] text-xs font-mono">ID: {posts[0].id}</span>
                                </div>

                                <h2 className="text-3xl md:text-4xl font-black leading-tight uppercase">
                                    {posts[0].content}
                                </h2>

                                <div className="flex items-center gap-4 text-[#94a3b8]">
                                    <Avatar className="w-8 h-8 rounded-full border border-white/10">
                                        <AvatarImage src={posts[0].user.avatar} />
                                        <AvatarFallback>{posts[0].user.username[0]}</AvatarFallback>
                                    </Avatar>
                                    <span className="text-xs font-bold text-white">{posts[0].user.username}</span>
                                    <span className="text-[10px] uppercase font-mono tracking-widest">{formatDistanceToNow(new Date(posts[0].createdAt))} ago</span>
                                </div>

                                <div className="flex items-center gap-4 pt-4">
                                    <Button
                                        onClick={() => likePostMutation.mutate(posts[0].id)}
                                        className={`h-12 px-8 rounded-full font-black text-sm transition-all flex items-center gap-2 ${posts[0].hasLiked ? 'bg-neon-cyan text-black' : 'bg-white/5 text-white hover:bg-white/10'}`}
                                    >
                                        <Heart className={`w-4 h-4 ${posts[0].hasLiked ? 'fill-current' : ''}`} /> {posts[0].likesCount}
                                    </Button>
                                    <Button variant="ghost" className="text-white hover:bg-white/5 px-8 font-bold uppercase text-[10px] tracking-widest">
                                        <MessageSquare className="w-4 h-4 mr-2" /> {posts[0].commentsCount}
                                    </Button>
                                </div>
                            </div>

                            {posts[0].mediaUrl && (
                                <div className="md:w-1/2 rounded-[1.5rem] overflow-hidden border border-white/5">
                                    <img src={posts[0].mediaUrl} className="w-full h-full object-cover" />
                                </div>
                            )}
                        </motion.section>
                    ) : (
                        <motion.section
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="relative rounded-[2.5rem] bg-gradient-to-br from-neon-purple/10 to-neon-cyan/10 border border-white/10 overflow-hidden p-8 flex flex-col md:flex-row gap-8 min-h-[400px] shadow-2xl shadow-neon-purple/20"
                        >
                            <div className="flex-1 space-y-6">
                                <div className="flex items-center gap-3">
                                    <Badge className="bg-neon-purple text-white font-black text-[10px] px-3 py-1 uppercase tracking-tighter shadow-xl shadow-neon-purple/30">System Message</Badge>
                                    <span className="text-[#94a3b8] text-xs font-mono">ID: PROMETIX-ALPHA</span>
                                </div>

                                <h2 className="text-4xl md:text-5xl font-black leading-none uppercase">
                                    WELCOME TO THE <span className="text-neon-cyan">ENGINEERING FLOW</span>.
                                </h2>

                                <p className="text-[#94a3b8] text-lg leading-relaxed max-w-lg font-medium">
                                    Connect with top engineers, share your latest deployments, and stay updated with the network pulse.
                                </p>

                                <div className="flex items-center gap-4 pt-4">
                                    <Button className="bg-neon-cyan hover:brightness-110 text-black font-black px-8 py-6 rounded-full text-sm uppercase tracking-tighter flex items-center gap-2 shadow-2xl shadow-neon-cyan/20 transition-all">
                                        <Plus className="w-4 h-4" /> Start Thread
                                    </Button>
                                    <Button variant="ghost" className="text-white hover:bg-white/5 px-8 font-bold uppercase text-[10px] tracking-widest">
                                        Learn Protocols
                                    </Button>
                                </div>
                            </div>
                        </motion.section>
                    )}

                    {/* DYNAMIC POST FEED */}
                    <div className="space-y-6">
                        {posts.slice(1).map((post: any) => (
                            <motion.div
                                key={post.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="bg-[#111111] border border-white/5 rounded-[2.5rem] p-8 space-y-6"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <Avatar className="w-12 h-12 rounded-2xl border border-white/10">
                                            <AvatarImage src={post.user.avatar} />
                                            <AvatarFallback>{post.user.username[0]}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <h4 className="font-bold text-white">{post.user.username}</h4>
                                            <p className="text-[#94a3b8] text-[10px] font-bold uppercase tracking-widest">{post.user.headline || post.user.role}</p>
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-mono text-[#475569]">{formatDistanceToNow(new Date(post.createdAt))} ago</span>
                                </div>

                                <p className="text-[#cbd5e1] text-lg leading-relaxed font-medium">
                                    {post.content}
                                </p>

                                {post.mediaUrl && (
                                    <div className="rounded-[1.5rem] overflow-hidden border border-white/5 max-h-96">
                                        <img src={post.mediaUrl} className="w-full h-full object-cover" />
                                    </div>
                                )}

                                <div className="flex items-center gap-6 pt-4 border-t border-white/5">
                                    <button
                                        onClick={() => likePostMutation.mutate(post.id)}
                                        className={`flex items-center gap-2 text-sm font-bold transition-colors ${post.hasLiked ? 'text-neon-cyan' : 'text-[#94a3b8] hover:text-neon-cyan'}`}
                                    >
                                        <Heart className={`w-5 h-5 ${post.hasLiked ? 'fill-current' : ''}`} /> {post.likesCount}
                                    </button>
                                    <button className="flex items-center gap-2 text-[#94a3b8] hover:text-white text-sm font-bold transition-colors">
                                        <MessageSquare className="w-5 h-5" /> {post.commentsCount}
                                    </button>
                                    <button className="flex items-center gap-2 text-[#94a3b8] hover:text-white text-sm font-bold transition-colors ml-auto">
                                        <Share2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* DISCOVER GRID */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-black uppercase tracking-widest text-[#94a3b8]">Engineers within range</h3>
                            <Button variant="link" className="text-neon-cyan font-bold text-xs uppercase tracking-tighter">Expand Search</Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {discoverUsers.map((u: any) => (
                                <motion.div
                                    key={u.id}
                                    whileHover={{ y: -5 }}
                                    className="bg-[#111111] border border-white/5 rounded-3xl p-6 flex items-start gap-4 group transition-colors hover:bg-[#1a1a1a]"
                                >
                                    <Avatar className="w-16 h-16 rounded-2xl border border-white/10 group-hover:border-neon-cyan/30 transition-all">
                                        <AvatarImage src={u.avatar} className="object-cover" />
                                        <AvatarFallback className="bg-white/5 text-xl font-bold">{u.username[0]}</AvatarFallback>
                                    </Avatar>

                                    <div className="flex-1 space-y-3 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="min-w-0">
                                                <h4 className="font-bold text-white truncate text-lg">{u.username}</h4>
                                                <p className="text-[#94a3b8] text-xs font-medium truncate uppercase tracking-tighter">{u.headline || u.role}</p>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setLocation(`/users/${u.id}`)}
                                                className="rounded-xl hover:bg-neon-cyan hover:text-black transition-all"
                                            >
                                                <ChevronRight className="w-5 h-5" />
                                            </Button>
                                        </div>

                                        <div className="flex flex-wrap gap-1.5 h-6 overflow-hidden">
                                            {u.skills?.slice(0, 3).map((s: string) => (
                                                <Badge key={s} className="bg-white/5 hover:bg-white/10 text-[#94a3b8] rounded-md text-[9px] border-none px-2 uppercase font-black">
                                                    {s}
                                                </Badge>
                                            ))}
                                        </div>

                                        <div className="flex gap-2 pt-2">
                                            {u.connectionStatus === "none" ? (
                                                <Button
                                                    onClick={() => connectMutation.mutate(u.id)}
                                                    disabled={connectMutation.isPending}
                                                    className="flex-1 bg-white/5 hover:bg-neon-cyan hover:text-black text-white font-black text-[10px] uppercase tracking-widest rounded-xl py-5 border-none transition-all"
                                                >
                                                    {connectMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Link"}
                                                </Button>
                                            ) : (
                                                <Button
                                                    onClick={() => setLocation(`/chat?user=${u.id}`)}
                                                    className="flex-1 bg-neon-purple/10 text-neon-purple border border-neon-purple/20 font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-neon-purple hover:text-white transition-all shadow-lg shadow-neon-purple/10"
                                                >
                                                    Message
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: PULSE & STATS */}
                <div className="col-span-12 lg:col-span-4 space-y-8">

                    {/* ACTIVE PULSE LOG */}
                    <section className="bg-[#111111] border border-white/5 rounded-[2.5rem] p-8 space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Zap className="w-4 h-4 text-neon-cyan fill-current" />
                                <h3 className="text-sm font-black uppercase tracking-widest">Active Pulse</h3>
                            </div>
                            <span className="flex h-2 w-2 rounded-full bg-neon-cyan animate-pulse shadow-[0_0_8px_var(--neon-cyan)]"></span>
                        </div>

                        <div className="space-y-6">
                            {[
                                { user: "Skywalker", action: "deployed primary node", time: "2m ago" },
                                { user: "Trinity", action: "linked with Ghost01", time: "15m ago" },
                                { user: "Morpheus", action: "updated identity profile", time: "42m ago" },
                                { user: "Neo", action: "pushed security scan", time: "1h ago" },
                                { user: "Oracle", action: "joined DataEng sector", time: "3h ago" }
                            ].map((log, i) => (
                                <div key={i} className="flex gap-4 group">
                                    <div className="w-[1px] bg-white/5 relative">
                                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-[#475569] group-hover:bg-neon-cyan transition-colors" />
                                    </div>
                                    <div className="pb-2">
                                        <p className="text-xs leading-none">
                                            <span className="text-white font-black">{log.user}</span>
                                            <span className="text-[#94a3b8] ml-2">{log.action}</span>
                                        </p>
                                        <p className="text-[10px] font-mono text-[#475569] mt-1">{log.time}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <Button variant="ghost" className="w-full border border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-[#94a3b8] py-6 hover:bg-white/5">
                            View Streaming Logs
                        </Button>
                    </section>

                    {/* NETWORK OVERVIEW */}
                    <section className="bg-gradient-to-br from-[#111111] to-black border border-white/5 rounded-[2.5rem] p-8 space-y-6">
                        <div className="space-y-1">
                            <h3 className="text-sm font-black uppercase tracking-widest text-white">Your Node Hub</h3>
                            <p className="text-xs text-[#94a3b8]">Personal network performance</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white/5 rounded-3xl p-5 border border-white/5">
                                <p className="text-2xl font-black text-neon-cyan">{discoverUsers.length}</p>
                                <p className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-tighter">Linkable Nodes</p>
                            </div>
                            <div className="bg-white/5 rounded-3xl p-5 border border-white/5">
                                <p className="text-2xl font-black text-white">42</p>
                                <p className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-tighter">Linked Nodes</p>
                            </div>
                        </div>

                        <div className="p-6 bg-gradient-to-br from-neon-purple to-neon-cyan rounded-[2rem] text-black shadow-2xl shadow-neon-cyan/20">
                            <div className="flex items-center justify-between mb-4">
                                <Orbit className="w-6 h-6" />
                                <Badge className="bg-black/20 text-black border-none text-[9px] font-black uppercase">Level 12</Badge>
                            </div>
                            <h4 className="text-xl font-black leading-tight mb-2">NETWORK EXPANSION</h4>
                            <p className="text-black/60 text-xs font-bold mb-4 leading-tight">Link with 5 more DevOps nodes to unlock Enterprise-grade visibility.</p>
                            <div className="h-2 w-full bg-black/10 rounded-full overflow-hidden">
                                <div className="h-full bg-black w-2/3" />
                            </div>
                        </div>
                    </section>

                </div>
            </main>
        </div>
    );
}
