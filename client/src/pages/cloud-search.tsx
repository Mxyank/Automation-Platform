import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Navigation } from "@/components/navigation";
import { BackButton } from "@/components/back-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useFeatures } from "@/hooks/use-features";
import { FeatureDisabledOverlay } from "@/components/feature-disabled-overlay";
import {
    Search,
    Loader2,
    Sparkles,
    ExternalLink,
    Globe,
    Cloud,
    Shield,
    Container,
    GitBranch,
    Server,
    Activity,
    Zap,
    Database,
    Lock,
    Bot,
    ArrowRight,
    Clock,
    TrendingUp,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useUpgradeModal, UpgradeModal } from "@/components/upgrade-modal";

interface SearchResult {
    title: string;
    url: string;
    description: string;
    source: string;
    favicon?: string;
    age?: string;
}

interface SearchResponse {
    results: SearchResult[];
    aiSummary: string;
    query: string;
    totalResults: number;
    timestamp: string;
}

const CATEGORIES = [
    { id: "all", label: "All", icon: Globe, color: "from-gray-500 to-gray-600" },
    { id: "aws", label: "AWS", icon: Cloud, color: "from-orange-500 to-yellow-500" },
    { id: "gcp", label: "GCP", icon: Cloud, color: "from-blue-500 to-green-500" },
    { id: "azure", label: "Azure", icon: Cloud, color: "from-blue-500 to-cyan-500" },
    { id: "kubernetes", label: "K8s", icon: Container, color: "from-blue-600 to-indigo-500" },
    { id: "docker", label: "Docker", icon: Container, color: "from-sky-500 to-blue-600" },
    { id: "terraform", label: "Terraform", icon: Database, color: "from-purple-500 to-violet-600" },
    { id: "cicd", label: "CI/CD", icon: GitBranch, color: "from-green-500 to-emerald-500" },
    { id: "security", label: "Security", icon: Shield, color: "from-red-500 to-rose-500" },
    { id: "monitoring", label: "Monitoring", icon: Activity, color: "from-yellow-500 to-orange-500" },
    { id: "serverless", label: "Serverless", icon: Zap, color: "from-pink-500 to-fuchsia-500" },
];

const SUGGESTED_QUERIES = [
    "AWS Lambda best practices 2025",
    "Kubernetes autoscaling strategies",
    "Terraform multi-cloud setup",
    "Docker security hardening",
    "CI/CD pipeline optimization",
    "Cloud cost optimization techniques",
];

export default function CloudSearch() {
    const { toast } = useToast();
    const { showUpgradeModal, setShowUpgradeModal, checkForUpgrade } = useUpgradeModal();
    const { isEnabled } = useFeatures();
    const isFeatureEnabled = isEnabled('cloud_search');
    const [query, setQuery] = useState("");
    const [category, setCategory] = useState("all");
    const [result, setResult] = useState<SearchResponse | null>(null);

    const searchMutation = useMutation({
        mutationFn: async (data: { query: string; category: string }) => {
            const response = await apiRequest("POST", "/api/ai/cloud-search", data);
            return response.json();
        },
        onSuccess: (data) => {
            setResult(data);
        },
        onError: (error: Error) => {
            if (checkForUpgrade(error)) return;
            toast({
                title: "Search Failed",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const handleSearch = (searchQuery?: string) => {
        const q = searchQuery || query;
        if (!q.trim()) {
            toast({
                title: "Query Required",
                description: "Please enter a search query.",
                variant: "destructive",
            });
            return;
        }
        setQuery(q);
        searchMutation.mutate({ query: q, category });
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            handleSearch();
        }
    };

    return (
        <div className="relative min-h-screen bg-dark-bg">
            {!isFeatureEnabled && <FeatureDisabledOverlay featureName="AI Cloud Search" />}
            <UpgradeModal open={showUpgradeModal} onOpenChange={setShowUpgradeModal} />
            <Navigation />

            <div className="pt-16">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <BackButton />

                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8 mt-4 text-center"
                    >
                        <div className="flex items-center justify-center gap-3 mb-3">
                            <div className="w-14 h-14 bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/25">
                                <Bot className="w-7 h-7 text-white" />
                            </div>
                        </div>
                        <h1 className="text-4xl font-bold text-white mb-2">
                            AI Cloud Search
                        </h1>
                        <p className="text-gray-400 text-lg max-w-xl mx-auto">
                            Search the web for cloud & DevOps solutions — powered by AI summaries
                        </p>
                    </motion.div>

                    {/* Search Bar */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="mb-6"
                    >
                        <div className="relative max-w-3xl mx-auto">
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 rounded-2xl opacity-50 blur-sm" />
                            <div className="relative flex items-center bg-gray-900 rounded-2xl border border-gray-700/50 overflow-hidden">
                                <Search className="w-5 h-5 text-gray-400 ml-5 flex-shrink-0" />
                                <Input
                                    placeholder="Search cloud & DevOps topics..."
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    className="border-0 bg-transparent text-white text-lg placeholder:text-gray-500 focus-visible:ring-0 px-4 py-6"
                                    data-testid="search-input"
                                />
                                <Button
                                    onClick={() => handleSearch()}
                                    disabled={searchMutation.isPending}
                                    className="m-2 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white rounded-xl px-6 py-5"
                                    data-testid="search-button"
                                >
                                    {searchMutation.isPending ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <>
                                            <Search className="w-4 h-4 mr-2" />
                                            Search
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </motion.div>

                    {/* Category Filters */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="flex flex-wrap justify-center gap-2 mb-8"
                    >
                        {CATEGORIES.map((cat) => {
                            const Icon = cat.icon;
                            const isActive = category === cat.id;
                            return (
                                <button
                                    key={cat.id}
                                    onClick={() => setCategory(cat.id)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${isActive
                                        ? `bg-gradient-to-r ${cat.color} text-white shadow-lg`
                                        : "bg-gray-800/60 text-gray-400 hover:bg-gray-700/60 hover:text-gray-300 border border-gray-700/50"
                                        }`}
                                >
                                    <Icon className="w-3.5 h-3.5" />
                                    {cat.label}
                                </button>
                            );
                        })}
                    </motion.div>

                    <AnimatePresence mode="wait">
                        {searchMutation.isPending ? (
                            /* Loading Skeleton */
                            <motion.div
                                key="loading"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="space-y-6 max-w-4xl mx-auto"
                            >
                                {/* AI Summary Skeleton */}
                                <div className="relative">
                                    <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-500/30 via-purple-500/30 to-fuchsia-500/30 rounded-2xl animate-pulse blur-sm" />
                                    <Card className="relative bg-gray-900/90 border-gray-700/50 rounded-2xl">
                                        <CardContent className="p-6">
                                            <div className="flex items-center gap-2 mb-4">
                                                <div className="w-6 h-6 bg-purple-500/20 rounded-full animate-pulse" />
                                                <div className="h-5 w-40 bg-gray-700 rounded animate-pulse" />
                                            </div>
                                            <div className="space-y-3">
                                                <div className="h-4 bg-gray-700/60 rounded w-full animate-pulse" />
                                                <div className="h-4 bg-gray-700/60 rounded w-11/12 animate-pulse" />
                                                <div className="h-4 bg-gray-700/60 rounded w-4/5 animate-pulse" />
                                                <div className="h-4 bg-gray-700/60 rounded w-full animate-pulse" />
                                                <div className="h-4 bg-gray-700/60 rounded w-3/4 animate-pulse" />
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Results Skeleton */}
                                {[1, 2, 3, 4].map((i) => (
                                    <Card key={i} className="bg-dark-card border-gray-800 rounded-xl">
                                        <CardContent className="p-5">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="w-5 h-5 bg-gray-700 rounded animate-pulse" />
                                                <div className="h-4 w-32 bg-gray-700 rounded animate-pulse" />
                                            </div>
                                            <div className="h-5 w-3/4 bg-gray-700 rounded animate-pulse mb-2" />
                                            <div className="h-4 w-full bg-gray-700/50 rounded animate-pulse" />
                                            <div className="h-4 w-2/3 bg-gray-700/50 rounded animate-pulse mt-1" />
                                        </CardContent>
                                    </Card>
                                ))}
                            </motion.div>
                        ) : result ? (
                            /* Results */
                            <motion.div
                                key="results"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="space-y-6 max-w-4xl mx-auto"
                            >
                                {/* Result Stats */}
                                <div className="flex items-center justify-between text-sm text-gray-500 px-1">
                                    <span>
                                        Found <span className="text-purple-400 font-medium">{result.totalResults}</span> results for "
                                        <span className="text-gray-300">{result.query}</span>"
                                    </span>
                                    {result.timestamp && (
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-3.5 h-3.5" />
                                            {new Date(result.timestamp).toLocaleTimeString()}
                                        </span>
                                    )}
                                </div>

                                {/* AI Summary Card */}
                                <div className="relative">
                                    <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-500/40 via-purple-500/40 to-fuchsia-500/40 rounded-2xl blur-sm" />
                                    <Card className="relative bg-gray-900/95 border-purple-500/30 rounded-2xl overflow-hidden">
                                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500" />
                                        <CardHeader className="pb-2">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-lg flex items-center justify-center">
                                                    <Sparkles className="w-4 h-4 text-white" />
                                                </div>
                                                <CardTitle className="text-white text-lg">AI Summary</CardTitle>
                                                <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-xs">
                                                    Gemini AI
                                                </Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-gray-300 leading-relaxed whitespace-pre-wrap text-sm">
                                                {result.aiSummary}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Search Results */}
                                <div className="space-y-3">
                                    <h3 className="text-white font-semibold text-lg flex items-center gap-2 px-1">
                                        <Globe className="w-5 h-5 text-purple-400" />
                                        Web Results
                                    </h3>
                                    {result.results.map((item, index) => (
                                        <motion.div
                                            key={index}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                        >
                                            <a
                                                href={item.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="block group"
                                            >
                                                <Card className="bg-dark-card border-gray-800 hover:border-purple-500/40 transition-all duration-200 rounded-xl group-hover:shadow-lg group-hover:shadow-purple-500/5">
                                                    <CardContent className="p-5">
                                                        {/* Source */}
                                                        <div className="flex items-center gap-2 mb-2">
                                                            {item.favicon && (
                                                                <img
                                                                    src={item.favicon}
                                                                    alt=""
                                                                    className="w-4 h-4 rounded-sm"
                                                                    onError={(e) => {
                                                                        (e.target as HTMLImageElement).style.display = "none";
                                                                    }}
                                                                />
                                                            )}
                                                            <span className="text-gray-500 text-xs truncate max-w-xs">
                                                                {item.source}
                                                            </span>
                                                            {item.age && (
                                                                <span className="text-gray-600 text-xs">· {item.age}</span>
                                                            )}
                                                            <ExternalLink className="w-3.5 h-3.5 text-gray-600 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                                                        </div>

                                                        {/* Title */}
                                                        <h4 className="text-purple-400 font-medium mb-1.5 group-hover:text-purple-300 transition-colors line-clamp-2">
                                                            {item.title}
                                                        </h4>

                                                        {/* Description */}
                                                        <p className="text-gray-400 text-sm leading-relaxed line-clamp-2">
                                                            {item.description}
                                                        </p>
                                                    </CardContent>
                                                </Card>
                                            </a>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                        ) : (
                            /* Empty State */
                            <motion.div
                                key="empty"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="max-w-3xl mx-auto"
                            >
                                <Card className="bg-dark-card border-gray-800 rounded-2xl">
                                    <CardContent className="p-10 text-center">
                                        <div className="w-20 h-20 bg-gradient-to-r from-violet-500/15 to-fuchsia-500/15 rounded-full flex items-center justify-center mx-auto mb-5">
                                            <Search className="w-9 h-9 text-purple-400" />
                                        </div>
                                        <h3 className="text-xl font-semibold text-white mb-2">
                                            Search the Cloud Universe
                                        </h3>
                                        <p className="text-gray-400 max-w-md mx-auto mb-8">
                                            Get AI-powered search results across AWS, GCP, Azure, Kubernetes, Docker, Terraform, and more. Every result comes with an intelligent AI summary.
                                        </p>

                                        <div className="mb-6">
                                            <p className="text-gray-500 text-sm mb-3">Try searching for:</p>
                                            <div className="flex flex-wrap justify-center gap-2">
                                                {SUGGESTED_QUERIES.map((sq, i) => (
                                                    <button
                                                        key={i}
                                                        onClick={() => handleSearch(sq)}
                                                        className="flex items-center gap-1.5 px-3 py-2 bg-gray-800/60 text-gray-400 rounded-lg text-sm hover:bg-gray-700/60 hover:text-gray-300 transition-all border border-gray-700/50 group"
                                                    >
                                                        <TrendingUp className="w-3.5 h-3.5 text-purple-500 group-hover:text-purple-400" />
                                                        {sq}
                                                        <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto text-left">
                                            <div className="flex items-center gap-2 text-gray-500">
                                                <Globe className="w-4 h-4 text-blue-500" />
                                                <span className="text-xs">Web Search</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-gray-500">
                                                <Sparkles className="w-4 h-4 text-purple-500" />
                                                <span className="text-xs">AI Summary</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-gray-500">
                                                <Lock className="w-4 h-4 text-green-500" />
                                                <span className="text-xs">Privacy-first</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
