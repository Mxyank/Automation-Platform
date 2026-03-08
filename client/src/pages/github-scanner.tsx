import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Navigation } from "@/components/navigation";
import { BackButton } from "@/components/back-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
    Github,
    Shield,
    ShieldAlert,
    ShieldCheck,
    Search,
    GitBranch,
    Star,
    Lock,
    Unlock,
    Loader2,
    AlertTriangle,
    CheckCircle,
    XCircle,
    FileCode,
    ChevronRight,
    Clock,
    Unlink,
    RefreshCw,
    ArrowLeft,
    Eye,
} from "lucide-react";

interface Repo {
    id: number;
    name: string;
    fullName: string;
    description: string;
    language: string;
    private: boolean;
    stargazersCount: number;
    forksCount: number;
    updatedAt: string;
    defaultBranch: string;
    owner: string;
    htmlUrl: string;
    size: number;
}

interface Finding {
    severity: "critical" | "high" | "medium" | "low";
    category: string;
    file: string;
    line?: number;
    title: string;
    description: string;
    remediation: string;
    codeSnippet?: string;
}

interface ScanResult {
    id: number;
    score: number;
    summary: string;
    findings: Finding[];
    status: string;
    filesScanned?: number;
}

interface ScanHistory {
    id: number;
    repoName: string;
    repoUrl: string;
    score: number | null;
    summary: string | null;
    status: string;
    findings: Finding[] | null;
    createdAt: string;
}

const langColors: Record<string, string> = {
    JavaScript: "bg-yellow-400", TypeScript: "bg-blue-500", Python: "bg-green-500",
    Java: "bg-orange-500", Go: "bg-cyan-500", Rust: "bg-red-600",
    Ruby: "bg-red-500", PHP: "bg-purple-500", "C#": "bg-green-600",
    C: "bg-gray-500", "C++": "bg-pink-500", Shell: "bg-emerald-500",
    Dockerfile: "bg-blue-400", HCL: "bg-violet-500",
};

export default function GitHubScanner() {
    const { user } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [, setLocation] = useLocation();
    const [step, setStep] = useState<"connect" | "select" | "scanning" | "report" | "history">("connect");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedRepo, setSelectedRepo] = useState<Repo | null>(null);
    const [scanResult, setScanResult] = useState<ScanResult | null>(null);
    const [viewingScan, setViewingScan] = useState<ScanHistory | null>(null);

    // Check GitHub connection status
    const { data: ghStatus, isLoading: statusLoading } = useQuery<{ configured: boolean; connected: boolean; username: string | null }>({
        queryKey: ["/api/github/status"],
        enabled: !!user,
    });

    // Fetch repos when connected
    const { data: repos, isLoading: reposLoading } = useQuery<Repo[]>({
        queryKey: ["/api/github/repos"],
        enabled: !!ghStatus?.connected && step !== "connect",
    });

    // Fetch scan history
    const { data: scanHistory } = useQuery<ScanHistory[]>({
        queryKey: ["/api/github/scans"],
        enabled: !!ghStatus?.connected,
    });

    // Handle URL params (from OAuth callback)
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get("connected") === "true") {
            queryClient.invalidateQueries({ queryKey: ["/api/github/status"] });
            toast({ title: "GitHub Connected!", description: "You can now scan your repositories." });
            setStep("select");
            window.history.replaceState({}, "", "/github-scanner");
        }
        if (params.get("error")) {
            toast({ title: "Connection Error", description: "Failed to connect GitHub. Try again.", variant: "destructive" });
            window.history.replaceState({}, "", "/github-scanner");
        }
    }, []);

    // Auto-advance to select step when connected
    useEffect(() => {
        if (ghStatus?.connected && step === "connect") {
            setStep("select");
        }
    }, [ghStatus?.connected]);

    // Connect to GitHub
    const connectMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch("/api/github/connect");
            const data = await res.json();
            window.location.href = data.url;
        },
    });

    // Disconnect GitHub
    const disconnectMutation = useMutation({
        mutationFn: async () => {
            await fetch("/api/github/disconnect", { method: "DELETE" });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/github/status"] });
            setStep("connect");
            toast({ title: "GitHub Disconnected" });
        },
    });

    // Run scan
    const scanMutation = useMutation({
        mutationFn: async (repo: Repo) => {
            const res = await fetch(`/api/github/scan/${repo.owner}/${repo.name}`, { method: "POST" });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message);
            }
            return res.json();
        },
        onSuccess: (data) => {
            setScanResult(data);
            setStep("report");
            queryClient.invalidateQueries({ queryKey: ["/api/github/scans"] });
            queryClient.invalidateQueries({ queryKey: ["/api/user"] });
        },
        onError: (error: Error) => {
            toast({ title: "Scan Failed", description: error.message, variant: "destructive" });
            setStep("select");
        },
    });

    const handleScan = (repo: Repo) => {
        setSelectedRepo(repo);
        setScanResult(null);
        setStep("scanning");
        scanMutation.mutate(repo);
    };

    const filteredRepos = repos?.filter(r =>
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.description?.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case "critical": return "bg-red-500/20 text-red-400 border-red-500/30";
            case "high": return "bg-orange-500/20 text-orange-400 border-orange-500/30";
            case "medium": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
            case "low": return "bg-blue-500/20 text-blue-400 border-blue-500/30";
            default: return "bg-gray-500/20 text-gray-400 border-gray-500/30";
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return "text-green-400";
        if (score >= 60) return "text-yellow-400";
        if (score >= 40) return "text-orange-400";
        return "text-red-400";
    };

    const getScoreRing = (score: number) => {
        if (score >= 80) return "from-green-500 to-emerald-400";
        if (score >= 60) return "from-yellow-500 to-amber-400";
        if (score >= 40) return "from-orange-500 to-amber-500";
        return "from-red-500 to-rose-400";
    };

    // Render the report step content (shared between live scan and history view)
    const renderReport = (result: { score: number; summary: string; findings: Finding[]; filesScanned?: number }, repoName: string) => {
        const findings = result.findings || [];
        const stats = {
            critical: findings.filter(f => f.severity === "critical").length,
            high: findings.filter(f => f.severity === "high").length,
            medium: findings.filter(f => f.severity === "medium").length,
            low: findings.filter(f => f.severity === "low").length,
        };

        return (
            <div className="space-y-6">
                {/* Score Header */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
                    <div className="inline-flex items-center justify-center mb-4">
                        <div className={`w-32 h-32 rounded-full bg-gradient-to-br ${getScoreRing(result.score)} p-1`}>
                            <div className="w-full h-full rounded-full bg-background flex items-center justify-center">
                                <span className={`text-4xl font-bold ${getScoreColor(result.score)}`}>{result.score}</span>
                            </div>
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold text-foreground">{repoName}</h2>
                    <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">{result.summary}</p>
                    {result.filesScanned && (
                        <p className="text-xs text-muted-foreground mt-1">{result.filesScanned} files analyzed</p>
                    )}
                </motion.div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                        { label: "Critical", count: stats.critical, icon: XCircle, color: "text-red-400 bg-red-500/10" },
                        { label: "High", count: stats.high, icon: AlertTriangle, color: "text-orange-400 bg-orange-500/10" },
                        { label: "Medium", count: stats.medium, icon: ShieldAlert, color: "text-yellow-400 bg-yellow-500/10" },
                        { label: "Low", count: stats.low, icon: Shield, color: "text-blue-400 bg-blue-500/10" },
                    ].map((s) => (
                        <Card key={s.label} className="border-border bg-card">
                            <CardContent className="p-4 flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${s.color}`}>
                                    <s.icon className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-foreground">{s.count}</div>
                                    <div className="text-xs text-muted-foreground">{s.label}</div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Findings List */}
                <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-foreground">Findings ({findings.length})</h3>
                    {findings.length === 0 ? (
                        <Card className="border-green-500/30 bg-green-500/5">
                            <CardContent className="p-6 text-center">
                                <ShieldCheck className="w-12 h-12 text-green-400 mx-auto mb-3" />
                                <p className="text-green-400 font-medium">No security issues found!</p>
                                <p className="text-muted-foreground text-sm mt-1">Your codebase looks clean.</p>
                            </CardContent>
                        </Card>
                    ) : (
                        findings.map((f, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                            >
                                <Card className={`border ${getSeverityColor(f.severity).replace("bg-", "border-").split(" ")[0]}/20 bg-card hover:bg-card/80 transition-colors`}>
                                    <CardContent className="p-4">
                                        <div className="flex items-start gap-3">
                                            <Badge className={`${getSeverityColor(f.severity)} border text-xs shrink-0`}>
                                                {f.severity.toUpperCase()}
                                            </Badge>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-semibold text-foreground">{f.title}</h4>
                                                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                                    <FileCode className="w-3 h-3" />
                                                    <span>{f.file}{f.line ? `:${f.line}` : ""}</span>
                                                    <span className="text-border">•</span>
                                                    <span>{f.category}</span>
                                                </div>
                                                <p className="text-sm text-muted-foreground mt-2">{f.description}</p>
                                                {f.codeSnippet && (
                                                    <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto text-foreground">
                                                        <code>{f.codeSnippet}</code>
                                                    </pre>
                                                )}
                                                <div className="mt-3 p-3 bg-green-500/5 border border-green-500/20 rounded-lg">
                                                    <p className="text-sm text-green-400 font-medium">💡 Fix:</p>
                                                    <p className="text-sm text-muted-foreground mt-1">{f.remediation}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))
                    )}
                </div>

                <div className="flex gap-3 justify-center pt-4">
                    <Button variant="outline" onClick={() => { setStep("select"); setScanResult(null); setViewingScan(null); }}>
                        <ArrowLeft className="w-4 h-4 mr-2" /> Scan Another
                    </Button>
                    {scanHistory && scanHistory.length > 0 && (
                        <Button variant="outline" onClick={() => { setStep("history"); setViewingScan(null); }}>
                            <Clock className="w-4 h-4 mr-2" /> View History
                        </Button>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-background">
            <Navigation />
            <div className="pt-20 pb-12 px-4 max-w-5xl mx-auto">
                <BackButton />

                {/* Header */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 border border-border mb-4">
                        <Github className="w-8 h-8 text-foreground" />
                    </div>
                    <h1 className="text-3xl font-bold text-foreground">GitHub Security Scanner</h1>
                    <p className="text-muted-foreground mt-2">
                        Connect your GitHub, select a repo, and get AI-powered security analysis
                    </p>
                    {ghStatus?.connected && (
                        <div className="inline-flex items-center gap-2 mt-3 px-3 py-1.5 bg-green-500/10 border border-green-500/30 rounded-full">
                            <CheckCircle className="w-4 h-4 text-green-400" />
                            <span className="text-sm text-green-400">Connected as @{ghStatus.username}</span>
                            <button onClick={() => disconnectMutation.mutate()} className="text-red-400 hover:text-red-300 ml-2">
                                <Unlink className="w-3 h-3" />
                            </button>
                        </div>
                    )}
                </div>

                {/* Step Navigation */}
                {ghStatus?.connected && (
                    <div className="flex items-center justify-center gap-2 mb-8">
                        {[
                            { key: "select", label: "Select Repo", icon: GitBranch },
                            { key: "history", label: "Scan History", icon: Clock },
                        ].map((s) => (
                            <Button
                                key={s.key}
                                variant={step === s.key ? "default" : "outline"}
                                size="sm"
                                onClick={() => { setStep(s.key as any); setViewingScan(null); setScanResult(null); }}
                                className="gap-2"
                            >
                                <s.icon className="w-4 h-4" />
                                {s.label}
                            </Button>
                        ))}
                    </div>
                )}

                <AnimatePresence mode="wait">
                    {/* ── Step: Connect ── */}
                    {step === "connect" && !ghStatus?.connected && (
                        <motion.div key="connect" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                            <Card className="max-w-lg mx-auto border-border bg-card">
                                <CardContent className="p-8 text-center">
                                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center mx-auto mb-6">
                                        <Github className="w-10 h-10 text-white" />
                                    </div>
                                    <h2 className="text-xl font-bold text-foreground mb-2">Connect Your GitHub</h2>
                                    <p className="text-muted-foreground mb-6">
                                        Authorize Prometix to read your repositories for security analysis. We only request read access.
                                    </p>
                                    <Button
                                        onClick={() => connectMutation.mutate()}
                                        disabled={connectMutation.isPending || !ghStatus?.configured}
                                        className="w-full bg-gray-900 hover:bg-gray-800 text-white gap-2 py-6 text-lg"
                                    >
                                        {connectMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Github className="w-5 h-5" />}
                                        Connect GitHub
                                    </Button>
                                    {!ghStatus?.configured && (
                                        <p className="text-xs text-red-400 mt-3">GitHub OAuth is not configured. Set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET.</p>
                                    )}
                                    <p className="text-xs text-muted-foreground mt-4">
                                        Each scan costs <span className="text-primary font-medium">2 credits</span>. You have <span className="text-primary font-medium">{user?.credits || 0}</span> credits.
                                    </p>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}

                    {/* ── Step: Select Repo ── */}
                    {step === "select" && (
                        <motion.div key="select" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                            <div className="mb-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search repositories..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 bg-card border-border"
                                    />
                                </div>
                            </div>

                            {reposLoading ? (
                                <div className="flex items-center justify-center py-20">
                                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                    <span className="ml-3 text-muted-foreground">Loading repositories...</span>
                                </div>
                            ) : (
                                <div className="grid gap-3">
                                    {filteredRepos.map((repo) => (
                                        <motion.div key={repo.id} whileHover={{ scale: 1.01 }} transition={{ duration: 0.15 }}>
                                            <Card className="border-border bg-card hover:border-primary/30 transition-all cursor-pointer group" onClick={() => handleScan(repo)}>
                                                <CardContent className="p-4 flex items-center gap-4">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <h3 className="font-semibold text-foreground truncate">{repo.name}</h3>
                                                            {repo.private ? (
                                                                <Lock className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
                                                            ) : (
                                                                <Unlock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                                            )}
                                                        </div>
                                                        {repo.description && (
                                                            <p className="text-sm text-muted-foreground truncate mt-1">{repo.description}</p>
                                                        )}
                                                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                                            {repo.language && (
                                                                <span className="flex items-center gap-1">
                                                                    <span className={`w-2.5 h-2.5 rounded-full ${langColors[repo.language] || "bg-gray-400"}`} />
                                                                    {repo.language}
                                                                </span>
                                                            )}
                                                            <span className="flex items-center gap-1">
                                                                <Star className="w-3 h-3" /> {repo.stargazersCount}
                                                            </span>
                                                            <span className="flex items-center gap-1">
                                                                <GitBranch className="w-3 h-3" /> {repo.forksCount}
                                                            </span>
                                                            <span>{new Date(repo.updatedAt).toLocaleDateString()}</span>
                                                        </div>
                                                    </div>
                                                    <Button size="sm" className="shrink-0 gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        Scan <ChevronRight className="w-4 h-4" />
                                                    </Button>
                                                </CardContent>
                                            </Card>
                                        </motion.div>
                                    ))}
                                    {filteredRepos.length === 0 && !reposLoading && (
                                        <div className="text-center py-12 text-muted-foreground">
                                            <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                            <p>No repositories found</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* ── Step: Scanning ── */}
                    {step === "scanning" && (
                        <motion.div key="scanning" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <Card className="max-w-lg mx-auto border-border bg-card">
                                <CardContent className="p-10 text-center">
                                    <div className="relative inline-flex items-center justify-center mb-6">
                                        <div className="w-20 h-20 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                                        <Shield className="w-8 h-8 text-primary absolute" />
                                    </div>
                                    <h2 className="text-xl font-bold text-foreground mb-2">Scanning {selectedRepo?.name}</h2>
                                    <p className="text-muted-foreground mb-6">
                                        Fetching files and running AI security analysis. This may take 30-60 seconds for large repos.
                                    </p>
                                    <div className="space-y-2 text-left max-w-xs mx-auto">
                                        {["Fetching repository files", "Analyzing code patterns", "Checking for vulnerabilities", "Generating remediation advice"].map((s, i) => (
                                            <motion.div
                                                key={s}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: i * 1.5 }}
                                                className="flex items-center gap-2 text-sm text-muted-foreground"
                                            >
                                                <Loader2 className="w-3 h-3 animate-spin text-primary" />
                                                {s}...
                                            </motion.div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}

                    {/* ── Step: Report ── */}
                    {step === "report" && scanResult && (
                        <motion.div key="report" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                            {renderReport(scanResult, selectedRepo?.fullName || "")}
                        </motion.div>
                    )}

                    {/* ── Step: Report from History ── */}
                    {step === "report" && viewingScan && (
                        <motion.div key="report-history" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                            {renderReport(
                                { score: viewingScan.score || 0, summary: viewingScan.summary || "", findings: viewingScan.findings || [] },
                                viewingScan.repoName
                            )}
                        </motion.div>
                    )}

                    {/* ── Step: History ── */}
                    {step === "history" && (
                        <motion.div key="history" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                            <h2 className="text-xl font-bold text-foreground mb-4">Scan History</h2>
                            {!scanHistory || scanHistory.length === 0 ? (
                                <Card className="border-border bg-card">
                                    <CardContent className="p-8 text-center text-muted-foreground">
                                        <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                        <p>No scans yet. Select a repository to start your first scan.</p>
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="grid gap-3">
                                    {scanHistory.map((scan) => (
                                        <Card
                                            key={scan.id}
                                            className="border-border bg-card hover:border-primary/30 transition-all cursor-pointer"
                                            onClick={() => {
                                                if (scan.status === "complete") {
                                                    setViewingScan(scan);
                                                    setStep("report");
                                                }
                                            }}
                                        >
                                            <CardContent className="p-4 flex items-center gap-4">
                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${scan.score !== null ? `bg-gradient-to-br ${getScoreRing(scan.score)} text-white` : "bg-muted text-muted-foreground"}`}>
                                                    <span className="text-sm font-bold">{scan.score ?? "—"}</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-semibold text-foreground truncate">{scan.repoName}</h3>
                                                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                                                        <Badge variant={scan.status === "complete" ? "default" : scan.status === "failed" ? "destructive" : "secondary"} className="text-[10px]">
                                                            {scan.status}
                                                        </Badge>
                                                        <span>{new Date(scan.createdAt).toLocaleString()}</span>
                                                        {scan.findings && <span>{(scan.findings as any[]).length} findings</span>}
                                                    </div>
                                                </div>
                                                {scan.status === "complete" && (
                                                    <Eye className="w-5 h-5 text-muted-foreground" />
                                                )}
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
