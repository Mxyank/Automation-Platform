import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Navigation } from "@/components/navigation";
import { BackButton } from "@/components/back-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CodePreview } from "@/components/code-preview";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
    ArrowLeft,
    Container,
    Database,
    GitBranch,
    Calendar,
    Copy,
    Download,
    Loader2,
    Settings,
} from "lucide-react";
import { motion } from "framer-motion";

export default function ProjectDetail() {
    const { toast } = useToast();
    const [, params] = useRoute("/projects/:id");
    const [, setLocation] = useLocation();
    const projectId = params?.id;

    const { data: project, isLoading, error } = useQuery({
        queryKey: [`/api/projects/${projectId}`],
        queryFn: async () => {
            const res = await apiRequest("GET", `/api/projects/${projectId}`);
            return res.json();
        },
        enabled: !!projectId,
    });

    const getTypeIcon = (type: string) => {
        switch (type) {
            case "api": return Database;
            case "docker": return Container;
            case "ci-cd": return GitBranch;
            default: return Database;
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case "api": return "from-neon-cyan to-blue-500";
            case "docker": return "from-neon-green to-green-500";
            case "ci-cd": return "from-neon-purple to-purple-500";
            default: return "from-gray-600 to-gray-500";
        }
    };

    const getLanguageForType = (type: string, config: any) => {
        if (type === "docker") return "dockerfile";
        if (type === "ci-cd") return "yaml";
        if (config?.framework === "fastapi") return "python";
        return "javascript";
    };

    const getFilenameForType = (type: string, name: string, config: any) => {
        if (type === "docker") return "Dockerfile";
        if (type === "ci-cd") return ".github/workflows/ci.yml";
        if (config?.framework === "fastapi") return `${name}.py`;
        return `${name}.js`;
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: "Copied!", description: "Code copied to clipboard." });
    };

    const downloadFile = (content: string, filename: string) => {
        const blob = new Blob([content], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-dark-bg">
                <Navigation />
                <div className="pt-16 flex items-center justify-center h-[60vh]">
                    <Loader2 className="w-8 h-8 animate-spin text-neon-cyan" />
                </div>
            </div>
        );
    }

    if (error || !project) {
        return (
            <div className="min-h-screen bg-dark-bg">
                <Navigation />
                <div className="pt-16">
                    <div className="max-w-4xl mx-auto px-4 py-12 text-center">
                        <h1 className="text-2xl font-bold text-white mb-4">Project Not Found</h1>
                        <p className="text-gray-400 mb-6">This project doesn't exist or you don't have access.</p>
                        <Button onClick={() => setLocation("/dashboard")} className="bg-neon-cyan text-dark-bg">
                            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    const TypeIcon = getTypeIcon(project.type);
    const config = project.config as any;

    return (
        <div className="min-h-screen bg-dark-bg">
            <Navigation />

            <div className="pt-16">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <BackButton />

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8 mt-4"
                    >
                        {/* Project Header */}
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-4">
                                <div className={`w-14 h-14 bg-gradient-to-br ${getTypeColor(project.type)} rounded-xl flex items-center justify-center`}>
                                    <TypeIcon className="w-7 h-7 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-bold text-white">{project.name}</h1>
                                    <div className="flex items-center gap-3 mt-1">
                                        <Badge className="bg-gray-700 text-gray-300 capitalize">
                                            {project.type === "ci-cd" ? "CI/CD Pipeline" : project.type}
                                        </Badge>
                                        {config?.framework && (
                                            <Badge variant="outline" className="border-gray-600 text-gray-400">
                                                {config.framework}
                                            </Badge>
                                        )}
                                        <Badge className={`${project.status === "active" ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-gray-500/20 text-gray-400 border-gray-500/30"} border`}>
                                            {project.status}
                                        </Badge>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => copyToClipboard(project.generatedCode || "")}
                                    className="border-gray-700 text-gray-300 hover:text-white"
                                >
                                    <Copy className="w-4 h-4 mr-2" /> Copy
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() =>
                                        downloadFile(
                                            project.generatedCode || "",
                                            getFilenameForType(project.type, project.name, config)
                                        )
                                    }
                                    className="border-gray-700 text-gray-300 hover:text-white"
                                >
                                    <Download className="w-4 h-4 mr-2" /> Download
                                </Button>
                            </div>
                        </div>

                        {/* Project Metadata */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                            <Card className="bg-dark-card border-gray-800">
                                <CardContent className="p-4">
                                    <p className="text-gray-500 text-xs mb-1">Type</p>
                                    <p className="text-white font-medium capitalize">{project.type}</p>
                                </CardContent>
                            </Card>
                            {config?.language && (
                                <Card className="bg-dark-card border-gray-800">
                                    <CardContent className="p-4">
                                        <p className="text-gray-500 text-xs mb-1">Language</p>
                                        <p className="text-white font-medium capitalize">{config.language}</p>
                                    </CardContent>
                                </Card>
                            )}
                            {config?.port && (
                                <Card className="bg-dark-card border-gray-800">
                                    <CardContent className="p-4">
                                        <p className="text-gray-500 text-xs mb-1">Port</p>
                                        <p className="text-white font-medium">{config.port}</p>
                                    </CardContent>
                                </Card>
                            )}
                            <Card className="bg-dark-card border-gray-800">
                                <CardContent className="p-4">
                                    <p className="text-gray-500 text-xs mb-1 flex items-center gap-1">
                                        <Calendar className="w-3 h-3" /> Created
                                    </p>
                                    <p className="text-white font-medium">
                                        {new Date(project.createdAt).toLocaleDateString()}
                                    </p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Config Details */}
                        {config && Object.keys(config).length > 0 && (
                            <Card className="bg-dark-card border-gray-800 mb-6">
                                <CardHeader>
                                    <CardTitle className="text-white text-lg flex items-center gap-2">
                                        <Settings className="w-5 h-5 text-gray-400" />
                                        Configuration
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        {Object.entries(config).map(([key, value]) => (
                                            <div key={key} className="bg-gray-800/50 rounded-lg p-3">
                                                <p className="text-gray-500 text-xs mb-1 capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
                                                <p className="text-white text-sm font-medium">
                                                    {Array.isArray(value) ? (value as string[]).join(", ") || "—" : String(value)}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Generated Code */}
                        {project.generatedCode && (
                            <CodePreview
                                code={project.generatedCode}
                                filename={getFilenameForType(project.type, project.name, config)}
                                language={getLanguageForType(project.type, config)}
                                copyable={true}
                            />
                        )}
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
