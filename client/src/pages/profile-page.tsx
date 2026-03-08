import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
    Card, CardContent, CardHeader, CardTitle, CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
    Loader2, User, Briefcase, Code, Link as LinkIcon,
    Settings, Save, Plus, Trash2, Camera, Github, Linkedin, Globe,
    UserPlus, MessageSquare, Clock, Cpu, Layers, Zap, Star, ShieldCheck, Mail, ExternalLink, Calendar, Monitor,
    MapPin, History, Shield, Smartphone, ChevronRight, LogOut, Search, Bell, Grid, Heart, MessageCircle, FileText, Image as ImageIcon,
    ChevronLeft
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { User as UserType } from "@shared/schema";

import { useParams, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useRef, useState } from "react";

export default function ProfilePage() {
    const { id } = useParams();
    const [, setLocation] = useLocation();
    const { user: currentUser } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState("activity");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const profileId = id || "me";

    const { data: profile, isLoading } = useQuery<any>({
        queryKey: [`/api/profile/${profileId}`],
    });

    const { data: connections = [] } = useQuery<any[]>({
        queryKey: ["/api/profile/connections/list"],
        enabled: !!profile,
    });

    const { data: userPosts = [] } = useQuery<any[]>({
        queryKey: ["/api/social/flow/posts", profileId],
        queryFn: async () => {
            const res = await apiRequest("GET", `/api/social/flow/posts?userId=${profile?.id}`);
            return res.json();
        },
        enabled: !!profile?.id,
    });

    const isOwnProfile = !id || parseInt(id) === currentUser?.id;

    const updateProfileMutation = useMutation({
        mutationFn: async (data: any) => {
            const res = await apiRequest("PUT", "/api/profile/me", data);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`/api/profile/${profileId}`] });
            queryClient.invalidateQueries({ queryKey: ["/api/user"] });
            toast({ title: "Profile updated" });
        },
        onError: (error: Error) => {
            toast({ title: "Update failed", description: error.message, variant: "destructive" });
        },
    });

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 1024 * 1024 * 2) {
            toast({ title: "File too large", description: "Please select an image under 2MB", variant: "destructive" });
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result as string;
            updateProfileMutation.mutate({ avatar: base64String });
        };
        reader.readAsDataURL(file);
    };

    const calculateCompletion = (user: any) => {
        if (!user) return 0;
        const fields = ['bio', 'headline', 'avatar', 'skills', 'experience', 'company', 'role', 'location'];
        const completed = fields.filter(f => {
            const val = user[f];
            if (Array.isArray(val)) return val.length > 0;
            return !!val;
        }).length;
        return Math.round((completed / fields.length) * 100);
    };

    const completion = calculateCompletion(profile);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#0c0c0c]">
                <Loader2 className="h-12 w-12 animate-spin text-[#f9f506]" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0c0c0c] text-white font-sans selection:bg-[#f9f506] selection:text-black">
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handlePhotoUpload}
            />

            <main className="flex justify-center py-12">
                <div className="flex max-w-[1244px] flex-1 gap-12 px-6">

                    {/* ─── LEFT SIDEBAR ─────────────────────────────────────── */}
                    <aside className="flex flex-col w-64 gap-8 shrink-0 h-fit sticky top-12">
                        {/* BACK BUTTON */}
                        <button
                            onClick={() => setLocation('/')}
                            className="flex items-center gap-2 text-[#64748b] hover:text-[#f9f506] transition-colors group mb-4 self-start"
                        >
                            <div className="size-8 rounded-full border border-[#1f1f1f] flex items-center justify-center group-hover:border-[#f9f506]/30">
                                <ChevronLeft className="w-4 h-4" />
                            </div>
                            <span className="text-sm font-bold">Back Home</span>
                        </button>

                        <div className="flex flex-col">
                            <h2 className="text-white text-xl font-bold">{profile?.username}</h2>
                            <p className="text-[#64748b] text-sm font-medium">@{profile?.username?.toLowerCase().replace(/\s+/g, '_')}</p>
                        </div>

                        <nav className="flex flex-col gap-1">
                            {[
                                { id: 'activity', label: 'Activity', icon: Grid },
                                { id: 'settings', label: 'Settings', icon: Settings, authOnly: true },
                                { id: 'security', label: 'Security', icon: Shield, authOnly: true }
                            ].map((item) => (
                                (!item.authOnly || isOwnProfile) && (
                                    <button
                                        key={item.id}
                                        onClick={() => setActiveTab(item.id)}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === item.id
                                            ? 'bg-[#f9f506] text-black font-bold'
                                            : 'text-[#94a3b8] hover:bg-[#1f1f1f] font-medium'
                                            }`}
                                    >
                                        <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'fill-current' : ''}`} />
                                        <span className="text-sm">{item.label}</span>
                                    </button>
                                )
                            ))}
                        </nav>

                        {isOwnProfile && (
                            <div className="mt-8 p-6 rounded-3xl bg-[#1a190b] border border-[#23220f]">
                                <div className="flex justify-between items-end mb-3">
                                    <p className="text-[10px] font-bold text-[#64748b] uppercase tracking-[0.2em]">Profile Strength</p>
                                    <span className="text-[#f9f506] text-[10px] font-bold">{completion}%</span>
                                </div>
                                <div className="w-full bg-[#23220f] h-2 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${completion}%` }}
                                        className="bg-[#f9f506] h-full"
                                    />
                                </div>
                                <p className="text-[11px] mt-3 text-[#94a3b8] font-medium leading-relaxed">Complete your details to reach 100%</p>
                            </div>
                        )}
                    </aside>

                    {/* ─── MAIN CONTENT ─────────────────────────────────────── */}
                    <div className="flex-1 flex flex-col gap-8 min-w-0">

                        {/* HERO HEADER */}
                        <section className="bg-[#1a190b] rounded-[2.5rem] border border-[#23220f] overflow-hidden">
                            <div className="h-44 bg-gradient-to-r from-[#f9f506]/30 to-[#f9f506]/5"></div>
                            <div className="px-10 pb-10 flex flex-col items-start relative">
                                <div className="relative group cursor-pointer" onClick={() => isOwnProfile && fileInputRef.current?.click()}>
                                    <Avatar className="w-40 h-40 border-[6px] border-[#0c0c0c] bg-[#1f1f1f] -mt-20 shadow-2xl overflow-hidden rounded-full ring-1 ring-white/5">
                                        <AvatarImage src={profile?.avatar || undefined} className="object-cover" />
                                        <AvatarFallback className="text-4xl font-bold bg-[#1f1f1f] text-white">
                                            {profile?.username?.[0]}
                                        </AvatarFallback>
                                    </Avatar>
                                    {isOwnProfile && (
                                        <div
                                            className="absolute inset-0 bg-black/40 -mt-20 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity border-[6px] border-transparent"
                                        >
                                            <Camera className="text-white w-8 h-8" />
                                        </div>
                                    )}
                                </div>

                                <div className="mt-6 flex w-full justify-between items-end gap-10">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <h2 className="text-4xl font-bold text-white tracking-tight">{profile?.username}</h2>
                                            {profile?.isPremium && <Badge className="bg-[#f9f506] text-black border-none font-bold">PRO</Badge>}
                                        </div>
                                        <p className="text-[#94a3b8] text-lg font-medium max-w-xl leading-relaxed">
                                            {profile?.bio || "No biography provided yet. Add one in settings to tell your story."}
                                        </p>
                                    </div>
                                    <div className="flex gap-4 shrink-0 mb-1">
                                        {!isOwnProfile ? (
                                            <>
                                                <Button
                                                    onClick={() => setLocation(`/chat?user=${profile.id}`)}
                                                    className="h-12 px-8 bg-[#1f1f1f] hover:bg-[#2f2f2f] text-white font-bold rounded-full transition-colors"
                                                >
                                                    Message
                                                </Button>
                                                {profile?.connectionStatus === "none" && (
                                                    <Button onClick={() => {
                                                        apiRequest("POST", `/api/profile/connect/${profile.id}`).then(() => {
                                                            queryClient.invalidateQueries({ queryKey: [`/api/profile/${profileId}`] });
                                                            toast({ title: "Connection request sent" });
                                                        });
                                                    }} className="h-12 px-10 bg-[#f9f506] hover:brightness-90 text-black font-bold rounded-full">
                                                        Connect
                                                    </Button>
                                                )}
                                                {profile?.connectionStatus === "pending" && (
                                                    <Button disabled className="h-12 px-10 bg-[#1a190b] text-[#94a3b8] font-bold rounded-full border border-[#23220f] cursor-default opacity-60">
                                                        Pending...
                                                    </Button>
                                                )}
                                            </>
                                        ) : (
                                            <>
                                                <Button className="h-12 px-8 bg-[#1f1f1f] hover:bg-[#2f2f2f] text-white font-bold rounded-full transition-colors">
                                                    Share Profile
                                                </Button>
                                                <Button onClick={() => setActiveTab('settings')} className="h-12 px-10 bg-[#f9f506] hover:brightness-90 text-black font-bold rounded-full">
                                                    Edit Profile
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </section>

                        <div className="grid grid-cols-12 gap-8">
                            {/* LEFT SIDE INFO */}
                            <div className="col-span-4 flex flex-col gap-6">
                                <Card className="bg-[#1a190b] border-[#23220f] rounded-[2rem] p-8">
                                    <h3 className="text-lg font-bold text-white mb-6">About</h3>
                                    <div className="space-y-5">
                                        <div className="flex items-center gap-3 text-[#94a3b8]">
                                            <MapPin className="w-4 h-4" />
                                            <span className="text-sm font-medium">{profile?.location || "Location not set"}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-[#94a3b8]">
                                            <Calendar className="w-4 h-4" />
                                            <span className="text-sm font-medium">Joined {new Date(profile?.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                                        </div>
                                        {profile?.socialLinks?.website && (
                                            <div className="flex items-center gap-3 text-[#94a3b8]">
                                                <LinkIcon className="w-4 h-4" />
                                                <a href={profile?.socialLinks?.website} target="_blank" className="text-sm font-bold text-[#f9f506] hover:underline decoration-[#f9f506]/40 underline-offset-4">{profile?.socialLinks?.website.replace(/^https?:\/\/(www\.)?/, '')}</a>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-3 text-[#94a3b8]">
                                            <Mail className="w-4 h-4" />
                                            <span className="text-sm font-medium truncate">{profile?.email}</span>
                                        </div>
                                    </div>

                                    <div className="mt-8 pt-8 border-t border-[#23220f]">
                                        <h4 className="text-[10px] font-bold text-[#64748b] uppercase tracking-[0.2em] mb-4">Skills</h4>
                                        <div className="flex flex-wrap gap-2 text-[#94a3b8]">
                                            {(profile?.skills && profile.skills.length > 0 ? profile.skills : ["No skills listed"]).map((skill: string) => (
                                                <Badge key={skill} className="px-4 py-1.5 bg-[#1f1f1f] hover:bg-[#2f2f2f] text-white border-none rounded-full text-xs font-semibold">
                                                    {skill}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                </Card>

                                <Card className="bg-[#1a190b] border-[#23220f] rounded-[2rem] p-8">
                                    <h3 className="text-lg font-bold text-white mb-6">Network</h3>
                                    <div className="flex -space-x-4 mb-6 cursor-pointer" onClick={() => setLocation('/discover')}>
                                        {connections.slice(0, 5).map((conn, i) => (
                                            <div key={conn.connectionId} className="w-11 h-11 rounded-full border-[3px] border-[#1a190b] bg-[#1f1f1f] ring-1 ring-[#23220f] overflow-hidden">
                                                <Avatar className="w-full h-full">
                                                    <AvatarImage src={conn.user?.avatar || undefined} />
                                                    <AvatarFallback className="text-[9px]">{conn.user?.username?.[0]}</AvatarFallback>
                                                </Avatar>
                                            </div>
                                        ))}
                                        {connections.length > 5 && (
                                            <div className="flex h-11 w-11 items-center justify-center rounded-full border-[3px] border-[#1a190b] bg-[#1f1f1f] text-xs font-bold text-[#94a3b8] ring-1 ring-[#23220f]">
                                                +{connections.length - 5}
                                            </div>
                                        )}
                                        {connections.length === 0 && (
                                            <p className="text-sm text-[#64748b] font-medium pl-4">No connections yet</p>
                                        )}
                                    </div>
                                    <button onClick={() => setLocation('/discover')} className="w-full py-2.5 text-sm font-bold text-[#64748b] hover:text-white transition-colors uppercase tracking-[0.1em]">
                                        Expand network
                                    </button>
                                </Card>
                            </div>

                            {/* RIGHT SIDE FEED */}
                            <div className="col-span-8">
                                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                                    <TabsList className="bg-transparent border-b border-[#1f1f1f] p-0 rounded-none w-full justify-start h-auto gap-10">
                                        <TabsTrigger value="activity" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#f9f506] data-[state=active]:bg-transparent data-[state=active]:text-white text-[#94a3b8] font-bold pb-3 px-1 text-sm transition-all focus-within:ring-0">
                                            Recent Activity
                                        </TabsTrigger>
                                        <TabsTrigger value="posts" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#f9f506] data-[state=active]:bg-transparent data-[state=active]:text-white text-[#94a3b8] font-bold pb-3 px-1 text-sm transition-all">
                                            Posts
                                        </TabsTrigger>
                                        <TabsTrigger value="media" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#f9f506] data-[state=active]:bg-transparent data-[state=active]:text-white text-[#94a3b8] font-bold pb-3 px-1 text-sm transition-all">
                                            Media
                                        </TabsTrigger>
                                        {isOwnProfile && (
                                            <TabsTrigger value="settings" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#f9f506] data-[state=active]:bg-transparent data-[state=active]:text-white text-[#94a3b8] font-bold pb-3 px-1 text-sm transition-all focus-within:ring-0">
                                                Settings
                                            </TabsTrigger>
                                        )}
                                        <TabsTrigger value="security" className="hidden">Security</TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="activity" className="m-0 space-y-4">
                                        {userPosts.length > 0 ? (
                                            userPosts.map((post: any) => (
                                                <motion.div
                                                    key={post.id}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className="bg-[#111111] border border-white/5 rounded-[2rem] p-6 space-y-4"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div className="size-8 rounded-full bg-[#1a190b] flex items-center justify-center">
                                                                <FileText className="w-4 h-4 text-[#f9f506]" />
                                                            </div>
                                                            <span className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-widest">Shared a post</span>
                                                        </div>
                                                        <span className="text-[10px] font-mono text-[#475569]">{new Date(post.createdAt).toLocaleDateString()}</span>
                                                    </div>
                                                    <p className="text-[#cbd5e1] text-md font-medium">{post.content}</p>
                                                    {post.mediaUrl && (
                                                        <div className="rounded-2xl overflow-hidden border border-white/5 max-h-60">
                                                            <img src={post.mediaUrl} className="w-full h-full object-cover" />
                                                        </div>
                                                    )}
                                                    <div className="flex items-center gap-4 pt-4 border-t border-white/5">
                                                        <div className="flex items-center gap-1.5 text-[#94a3b8] text-xs font-bold">
                                                            <Heart className="w-4 h-4" /> {post.likesCount}
                                                        </div>
                                                        <div className="flex items-center gap-1.5 text-[#94a3b8] text-xs font-bold">
                                                            <MessageSquare className="w-4 h-4" /> {post.commentsCount}
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))
                                        ) : (
                                            <div className="bg-[#1a190b]/50 p-12 rounded-[2.5rem] border border-[#23220f] border-dashed flex flex-col items-center justify-center text-center gap-4">
                                                <div className="size-16 rounded-full bg-[#1f1f1f] flex items-center justify-center">
                                                    <History className="w-8 h-8 text-[#2f2f2f]" />
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-white font-bold">Activity Log is Empty</p>
                                                    <p className="text-sm text-[#64748b]">Posts and interactions will appear here once registered.</p>
                                                </div>
                                            </div>
                                        )}
                                    </TabsContent>

                                    <TabsContent value="settings" className="m-0">
                                        <Card className="bg-[#1a190b] rounded-[2.5rem] border border-[#23220f] p-10">
                                            <div className="mb-12 flex justify-between items-start">
                                                <div>
                                                    <h3 className="text-2xl font-bold text-white">Identity Config</h3>
                                                    <p className="text-[#64748b] font-medium mt-1">Refine your public profile and core settings.</p>
                                                </div>
                                                <Badge className="bg-[#f9f506]/10 text-[#f9f506] border-[#f9f506]/20 px-4 py-1">
                                                    Live Sync Enabled
                                                </Badge>
                                            </div>
                                            <form onSubmit={(e) => {
                                                e.preventDefault();
                                                const formData = new FormData(e.currentTarget);
                                                const data = Object.fromEntries(formData.entries());

                                                // Handle skills split
                                                const rawSkills = data.skills as string;
                                                const skillsArray = rawSkills ? rawSkills.split(',').map(s => s.trim()).filter(s => !!s) : [];

                                                updateProfileMutation.mutate({
                                                    ...data,
                                                    skills: skillsArray
                                                });
                                            }} className="space-y-8">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                    <div className="space-y-2">
                                                        <Label className="text-xs font-bold text-[#64748b] ml-1 uppercase tracking-widest">Username</Label>
                                                        <Input
                                                            name="username"
                                                            defaultValue={profile?.username}
                                                            className="bg-[#0c0c0c] border-[#23220f] text-white rounded-2xl h-14 focus:ring-1 focus:ring-[#f9f506]/40 px-6 font-medium"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-xs font-bold text-[#64748b] ml-1 uppercase tracking-widest">Headline</Label>
                                                        <Input
                                                            name="headline"
                                                            defaultValue={profile?.headline}
                                                            placeholder="Product Designer"
                                                            className="bg-[#0c0c0c] border-[#23220f] text-white rounded-2xl h-14 focus:ring-1 focus:ring-[#f9f506]/40 px-6 font-medium"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                    <div className="space-y-2">
                                                        <Label className="text-xs font-bold text-[#64748b] ml-1 uppercase tracking-widest">Company</Label>
                                                        <Input
                                                            name="company"
                                                            defaultValue={profile?.company}
                                                            className="bg-[#0c0c0c] border-[#23220f] text-white rounded-2xl h-14 focus:ring-1 focus:ring-[#f9f506]/40 px-6 font-medium"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-xs font-bold text-[#64748b] ml-1 uppercase tracking-widest">Skills (comma separated)</Label>
                                                        <Input
                                                            name="skills"
                                                            defaultValue={profile?.skills?.join(', ')}
                                                            placeholder="React, Docker, AWS"
                                                            className="bg-[#0c0c0c] border-[#23220f] text-white rounded-2xl h-14 focus:ring-1 focus:ring-[#f9f506]/40 px-6 font-medium"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label className="text-xs font-bold text-[#64748b] ml-1 uppercase tracking-widest">Bio</Label>
                                                    <Textarea
                                                        name="bio"
                                                        defaultValue={profile?.bio}
                                                        className="bg-[#0c0c0c] border-[#23220f] text-white rounded-3xl min-h-[160px] p-6 focus:ring-1 focus:ring-[#f9f506]/40 font-medium"
                                                        placeholder="Tell the world about yourself..."
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <Label className="text-xs font-bold text-[#64748b] ml-1 uppercase tracking-widest">Location</Label>
                                                    <Input
                                                        name="location"
                                                        defaultValue={profile?.location}
                                                        placeholder="San Francisco, CA"
                                                        className="bg-[#0c0c0c] border-[#23220f] text-white rounded-2xl h-14 focus:ring-1 focus:ring-[#f9f506]/40 px-6 font-medium"
                                                    />
                                                </div>

                                                <div className="flex justify-end pt-8">
                                                    <Button
                                                        type="submit"
                                                        disabled={updateProfileMutation.isPending}
                                                        className="bg-[#f9f506] hover:brightness-90 text-black font-bold h-14 px-12 rounded-full transition-all shadow-lg shadow-[#f9f506]/10 flex items-center gap-3"
                                                    >
                                                        {updateProfileMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> Save Changes</>}
                                                    </Button>
                                                </div>
                                            </form>
                                        </Card>
                                    </TabsContent>
                                </Tabs>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
