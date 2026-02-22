import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Navigation } from "@/components/navigation";
import { BackButton } from "@/components/back-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useFeatures } from "@/hooks/use-features";
import { FeatureDisabledOverlay } from "@/components/feature-disabled-overlay";
import {
  GitBranch,
  Package,
  Database,
  Container,
  FileCode,
  Loader2,
  Copy,
  Download,
  Sparkles,
  CheckCircle,
  Server,
  Layers,
  Terminal,
  Play,
  Zap
} from "lucide-react";
import { motion } from "framer-motion";
import { useUpgradeModal, UpgradeModal } from "@/components/upgrade-modal";

interface EnvResult {
  projectName: string;
  techStack: { language: string; framework: string; version: string }[];
  osPackages: string[];
  dockerCompose: string;
  dockerfile: string;
  envFile: string;
  migrations: string;
  seedData: string;
  setupScript: string;
  readme: string;
  summary: string;
}

export default function EnvReplicator() {
  const { toast } = useToast();
  const { showUpgradeModal, setShowUpgradeModal, checkForUpgrade } = useUpgradeModal();
  const { isEnabled } = useFeatures();
  const isFeatureEnabled = isEnabled('env_replicator');
  const [repoUrl, setRepoUrl] = useState("");
  const [branch, setBranch] = useState("main");
  const [includeTests, setIncludeTests] = useState(true);
  const [includeSeedData, setIncludeSeedData] = useState(true);
  const [result, setResult] = useState<EnvResult | null>(null);

  const replicateMutation = useMutation({
    mutationFn: async (data: { repoUrl: string; branch: string; includeTests: boolean; includeSeedData: boolean }) => {
      const response = await apiRequest("POST", "/api/ai/env-replicate", data);
      return response.json();
    },
    onSuccess: (data) => {
      setResult(data.result);
      toast({
        title: "Environment Generated!",
        description: `Dev environment for ${data.result.projectName} is ready.`,
      });
    },
    onError: (error: Error) => {
      if (checkForUpgrade(error)) return;
      toast({
        title: "Generation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleReplicate = () => {
    if (!repoUrl.trim()) {
      toast({
        title: "Repository URL Required",
        description: "Please enter a GitHub repository URL.",
        variant: "destructive",
      });
      return;
    }
    replicateMutation.mutate({
      repoUrl,
      branch,
      includeTests,
      includeSeedData,
    });
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${type} copied to clipboard.`,
    });
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

  const downloadAll = () => {
    if (!result) return;
    const files = [
      { content: result.dockerCompose, name: "docker-compose.yml" },
      { content: result.dockerfile, name: "Dockerfile" },
      { content: result.envFile, name: ".env.example" },
      { content: result.setupScript, name: "setup.sh" },
      { content: result.readme, name: "DEV_SETUP.md" },
    ];
    if (result.migrations) files.push({ content: result.migrations, name: "migrations.sql" });
    if (result.seedData) files.push({ content: result.seedData, name: "seed.sql" });

    files.forEach(f => downloadFile(f.content, f.name));
    toast({ title: "Downloaded!", description: "All files have been downloaded." });
  };

  return (
    <div className="relative min-h-screen bg-dark-bg">
      {!isFeatureEnabled && <FeatureDisabledOverlay featureName="AI Environment Replicator" />}
      <UpgradeModal open={showUpgradeModal} onOpenChange={setShowUpgradeModal} />
      <Navigation />

      <div className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <BackButton />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 mt-4"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-gradient-to-r from-violet-500 to-purple-500 rounded-xl flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">AI Environment Replicator</h1>
                <p className="text-gray-400">Magic Sandbox - Spin up any dev env in 1 click</p>
              </div>
            </div>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <Card className="bg-dark-card border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">GitHub Repository</CardTitle>
                  <CardDescription>
                    Paste a repo URL and AI will auto-generate your complete dev environment
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-gray-300">Repository URL</Label>
                    <Input
                      placeholder="https://github.com/username/repository"
                      value={repoUrl}
                      onChange={(e) => setRepoUrl(e.target.value)}
                      className="bg-gray-900 border-gray-700 text-white"
                      data-testid="input-repo-url"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-300">Branch (optional)</Label>
                    <Input
                      placeholder="main"
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                      className="bg-gray-900 border-gray-700 text-white"
                      data-testid="input-branch"
                    />
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="tests"
                        checked={includeTests}
                        onCheckedChange={(c) => setIncludeTests(c as boolean)}
                        data-testid="checkbox-tests"
                      />
                      <Label htmlFor="tests" className="text-gray-300">Include test setup</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="seed"
                        checked={includeSeedData}
                        onCheckedChange={(c) => setIncludeSeedData(c as boolean)}
                        data-testid="checkbox-seed"
                      />
                      <Label htmlFor="seed" className="text-gray-300">Generate seed data</Label>
                    </div>
                  </div>

                  <Button
                    onClick={handleReplicate}
                    disabled={replicateMutation.isPending}
                    className="w-full bg-gradient-to-r from-violet-500 to-purple-500 text-white"
                    data-testid="button-replicate"
                  >
                    {replicateMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Analyzing Repository...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate Environment
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-dark-card border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white text-lg">What Gets Generated</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 text-gray-400">
                      <Container className="w-4 h-4 text-blue-500" />
                      <span className="text-sm">Docker Compose</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                      <Package className="w-4 h-4 text-green-500" />
                      <span className="text-sm">OS Packages</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                      <Database className="w-4 h-4 text-purple-500" />
                      <span className="text-sm">DB Migrations</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                      <FileCode className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm">Seed Data</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                      <Terminal className="w-4 h-4 text-cyan-500" />
                      <span className="text-sm">Setup Script</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                      <Server className="w-4 h-4 text-red-500" />
                      <span className="text-sm">Env Variables</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              {result ? (
                <>
                  <Card className="bg-gradient-to-br from-violet-900/30 to-purple-900/30 border-violet-500/30">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-2xl font-bold text-white">{result.projectName}</h3>
                          <p className="text-gray-400">{result.summary}</p>
                        </div>
                        <Button onClick={downloadAll} className="bg-violet-600 hover:bg-violet-700">
                          <Download className="w-4 h-4 mr-2" />
                          Download All
                        </Button>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-4">
                        {result.techStack.map((tech, i) => (
                          <Badge key={i} className="bg-violet-500/20 text-violet-400 border-violet-500/50">
                            {tech.language} {tech.framework && `/ ${tech.framework}`} {tech.version}
                          </Badge>
                        ))}
                      </div>

                      <div className="bg-gray-800/50 rounded-lg p-4">
                        <p className="text-gray-400 text-sm mb-2">Quick Start:</p>
                        <code className="text-green-400 text-sm font-mono">
                          docker-compose up -d && ./setup.sh
                        </code>
                      </div>
                    </CardContent>
                  </Card>

                  <Tabs defaultValue="docker" className="w-full">
                    <TabsList className="w-full bg-gray-800 grid grid-cols-5">
                      <TabsTrigger value="docker">
                        <Container className="w-4 h-4" />
                      </TabsTrigger>
                      <TabsTrigger value="packages">
                        <Package className="w-4 h-4" />
                      </TabsTrigger>
                      <TabsTrigger value="db">
                        <Database className="w-4 h-4" />
                      </TabsTrigger>
                      <TabsTrigger value="env">
                        <Server className="w-4 h-4" />
                      </TabsTrigger>
                      <TabsTrigger value="setup">
                        <Terminal className="w-4 h-4" />
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="docker" className="mt-4 space-y-4">
                      <Card className="bg-dark-card border-gray-800">
                        <CardHeader className="flex flex-row items-center justify-between">
                          <CardTitle className="text-white text-lg">docker-compose.yml</CardTitle>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => copyToClipboard(result.dockerCompose, "Docker Compose")} className="border-gray-700">
                              <Copy className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => downloadFile(result.dockerCompose, "docker-compose.yml")} className="border-gray-700">
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <pre className="bg-gray-900 rounded-lg p-4 overflow-x-auto max-h-[300px] overflow-y-auto">
                            <code className="text-blue-400 text-sm font-mono">{result.dockerCompose}</code>
                          </pre>
                        </CardContent>
                      </Card>

                      <Card className="bg-dark-card border-gray-800">
                        <CardHeader className="flex flex-row items-center justify-between">
                          <CardTitle className="text-white text-lg">Dockerfile</CardTitle>
                          <Button size="sm" variant="outline" onClick={() => copyToClipboard(result.dockerfile, "Dockerfile")} className="border-gray-700">
                            <Copy className="w-4 h-4" />
                          </Button>
                        </CardHeader>
                        <CardContent>
                          <pre className="bg-gray-900 rounded-lg p-4 overflow-x-auto max-h-[200px] overflow-y-auto">
                            <code className="text-green-400 text-sm font-mono">{result.dockerfile}</code>
                          </pre>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="packages" className="mt-4">
                      <Card className="bg-dark-card border-gray-800">
                        <CardHeader>
                          <CardTitle className="text-white text-lg">Required Packages</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-wrap gap-2">
                            {result.osPackages.map((pkg, i) => (
                              <Badge key={i} variant="outline" className="border-green-500 text-green-400">
                                {pkg}
                              </Badge>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="db" className="mt-4 space-y-4">
                      {result.migrations && (
                        <Card className="bg-dark-card border-gray-800">
                          <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-white text-lg">Migrations</CardTitle>
                            <Button size="sm" variant="outline" onClick={() => copyToClipboard(result.migrations, "Migrations")} className="border-gray-700">
                              <Copy className="w-4 h-4" />
                            </Button>
                          </CardHeader>
                          <CardContent>
                            <pre className="bg-gray-900 rounded-lg p-4 overflow-x-auto max-h-[200px] overflow-y-auto">
                              <code className="text-purple-400 text-sm font-mono">{result.migrations}</code>
                            </pre>
                          </CardContent>
                        </Card>
                      )}
                      {result.seedData && (
                        <Card className="bg-dark-card border-gray-800">
                          <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-white text-lg">Seed Data</CardTitle>
                            <Button size="sm" variant="outline" onClick={() => copyToClipboard(result.seedData, "Seed Data")} className="border-gray-700">
                              <Copy className="w-4 h-4" />
                            </Button>
                          </CardHeader>
                          <CardContent>
                            <pre className="bg-gray-900 rounded-lg p-4 overflow-x-auto max-h-[200px] overflow-y-auto">
                              <code className="text-yellow-400 text-sm font-mono">{result.seedData}</code>
                            </pre>
                          </CardContent>
                        </Card>
                      )}
                    </TabsContent>

                    <TabsContent value="env" className="mt-4">
                      <Card className="bg-dark-card border-gray-800">
                        <CardHeader className="flex flex-row items-center justify-between">
                          <CardTitle className="text-white text-lg">.env.example</CardTitle>
                          <Button size="sm" variant="outline" onClick={() => copyToClipboard(result.envFile, "Env File")} className="border-gray-700">
                            <Copy className="w-4 h-4" />
                          </Button>
                        </CardHeader>
                        <CardContent>
                          <pre className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                            <code className="text-cyan-400 text-sm font-mono">{result.envFile}</code>
                          </pre>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="setup" className="mt-4">
                      <Card className="bg-dark-card border-gray-800">
                        <CardHeader className="flex flex-row items-center justify-between">
                          <CardTitle className="text-white text-lg">setup.sh</CardTitle>
                          <Button size="sm" variant="outline" onClick={() => copyToClipboard(result.setupScript, "Setup Script")} className="border-gray-700">
                            <Copy className="w-4 h-4" />
                          </Button>
                        </CardHeader>
                        <CardContent>
                          <pre className="bg-gray-900 rounded-lg p-4 overflow-x-auto max-h-[300px] overflow-y-auto">
                            <code className="text-orange-400 text-sm font-mono">{result.setupScript}</code>
                          </pre>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>
                </>
              ) : (
                <Card className="bg-dark-card border-gray-800">
                  <CardContent className="p-12 text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-violet-500/20 to-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Zap className="w-8 h-8 text-violet-400" />
                    </div>
                    <h3 className="text-lg font-medium text-white mb-2">Magic Sandbox</h3>
                    <p className="text-gray-400 max-w-sm mx-auto mb-6">
                      Paste any GitHub repo URL and get a complete, ready-to-run development environment
                    </p>
                    <div className="bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/30 rounded-lg p-4 text-left max-w-sm mx-auto">
                      <p className="text-violet-400 font-medium mb-2">Supports:</p>
                      <ul className="text-gray-400 text-sm space-y-1">
                        <li>• Node.js, Python, Go, Rust, Java</li>
                        <li>• React, Vue, Django, FastAPI, Spring</li>
                        <li>• PostgreSQL, MySQL, MongoDB, Redis</li>
                        <li>• Docker & Docker Compose</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
