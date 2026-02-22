import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Navigation } from "@/components/navigation";
import { BackButton } from "@/components/back-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  FileText, 
  GitCommit, 
  Tag, 
  AlertCircle,
  Loader2,
  Copy,
  Download,
  Sparkles,
  ArrowUp,
  Wrench,
  Bug,
  Zap,
  BookOpen
} from "lucide-react";
import { motion } from "framer-motion";
import { useUpgradeModal, UpgradeModal } from "@/components/upgrade-modal";

interface ReleaseNotesResult {
  version: string;
  versionType: "major" | "minor" | "patch";
  releaseNotes: string;
  changelog: string;
  impactSummary: string;
  breakingChanges: string[];
  newFeatures: string[];
  bugFixes: string[];
  improvements: string[];
}

export default function ReleaseNotesGenerator() {
  const { toast } = useToast();
  const { showUpgradeModal, setShowUpgradeModal, checkForUpgrade } = useUpgradeModal();
  const [commits, setCommits] = useState("");
  const [currentVersion, setCurrentVersion] = useState("1.0.0");
  const [projectName, setProjectName] = useState("");
  const [format, setFormat] = useState("markdown");
  const [result, setResult] = useState<ReleaseNotesResult | null>(null);

  const generateMutation = useMutation({
    mutationFn: async (data: { commits: string; currentVersion: string; projectName: string; format: string }) => {
      const response = await apiRequest("POST", "/api/ai/release-notes", data);
      return response.json();
    },
    onSuccess: (data) => {
      setResult(data.result);
      toast({
        title: "Release Notes Generated",
        description: `Suggested version: ${data.result.version}`,
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

  const handleGenerate = () => {
    if (!commits.trim()) {
      toast({
        title: "Commits Required",
        description: "Please paste your git commit history or changelog.",
        variant: "destructive",
      });
      return;
    }
    generateMutation.mutate({
      commits,
      currentVersion,
      projectName,
      format,
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
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getVersionBadgeColor = (type: string) => {
    switch (type) {
      case "major": return "bg-red-500/20 text-red-500 border-red-500/50";
      case "minor": return "bg-blue-500/20 text-blue-500 border-blue-500/50";
      case "patch": return "bg-green-500/20 text-green-500 border-green-500/50";
      default: return "bg-gray-500/20 text-gray-500";
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg">
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
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">AI Release Notes Generator</h1>
                <p className="text-gray-400">Auto-generate release notes, changelogs, and version suggestions</p>
              </div>
            </div>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <Card className="bg-dark-card border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">Git Commits</CardTitle>
                  <CardDescription>
                    Paste your git log or commit messages to generate release notes
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-gray-300">Project Name</Label>
                      <Input
                        placeholder="MyAwesomeApp"
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        className="bg-gray-900 border-gray-700 text-white"
                        data-testid="input-project-name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-gray-300">Current Version</Label>
                      <Input
                        placeholder="1.0.0"
                        value={currentVersion}
                        onChange={(e) => setCurrentVersion(e.target.value)}
                        className="bg-gray-900 border-gray-700 text-white"
                        data-testid="input-current-version"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-300">Output Format</Label>
                    <Select value={format} onValueChange={setFormat}>
                      <SelectTrigger className="bg-gray-900 border-gray-700 text-white" data-testid="select-format">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="markdown">Markdown</SelectItem>
                        <SelectItem value="html">HTML</SelectItem>
                        <SelectItem value="plain">Plain Text</SelectItem>
                        <SelectItem value="json">JSON</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-300">Commit History</Label>
                    <Textarea
                      placeholder={`Paste your git log output or commit messages:

feat: add user authentication
fix: resolve memory leak in cache
chore: update dependencies
feat: implement dark mode
fix: correct API response format
docs: update README
refactor: optimize database queries
BREAKING CHANGE: change API endpoint structure`}
                      value={commits}
                      onChange={(e) => setCommits(e.target.value)}
                      className="bg-gray-900 border-gray-700 text-white font-mono min-h-[300px]"
                      data-testid="textarea-commits"
                    />
                    <p className="text-xs text-gray-500">
                      Tip: Use conventional commits format for best results (feat:, fix:, docs:, etc.)
                    </p>
                  </div>

                  <Button
                    onClick={handleGenerate}
                    disabled={generateMutation.isPending}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white"
                    data-testid="button-generate"
                  >
                    {generateMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating Release Notes...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate Release Notes
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-dark-card border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white text-lg">Semantic Versioning</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <ArrowUp className="w-5 h-5 text-red-500" />
                    <div>
                      <p className="text-white font-medium">Major (X.0.0)</p>
                      <p className="text-gray-400 text-sm">Breaking changes</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                    <Zap className="w-5 h-5 text-blue-500" />
                    <div>
                      <p className="text-white font-medium">Minor (0.X.0)</p>
                      <p className="text-gray-400 text-sm">New features, backward compatible</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                    <Bug className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="text-white font-medium">Patch (0.0.X)</p>
                      <p className="text-gray-400 text-sm">Bug fixes only</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              {result ? (
                <>
                  <Card className="bg-dark-card border-gray-800">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="text-gray-400 text-sm mb-1">Suggested Version</p>
                          <div className="flex items-center gap-3">
                            <span className="text-3xl font-bold text-white">{result.version}</span>
                            <Badge variant="outline" className={getVersionBadgeColor(result.versionType)}>
                              {result.versionType.toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                        <Tag className="w-8 h-8 text-neon-cyan" />
                      </div>
                      <p className="text-gray-300">{result.impactSummary}</p>
                    </CardContent>
                  </Card>

                  <div className="grid grid-cols-2 gap-4">
                    {result.breakingChanges.length > 0 && (
                      <Card className="bg-red-500/10 border-red-500/30">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <AlertCircle className="w-4 h-4 text-red-500" />
                            <span className="text-red-400 font-medium">Breaking Changes</span>
                          </div>
                          <p className="text-2xl font-bold text-white">{result.breakingChanges.length}</p>
                        </CardContent>
                      </Card>
                    )}
                    <Card className="bg-blue-500/10 border-blue-500/30">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles className="w-4 h-4 text-blue-500" />
                          <span className="text-blue-400 font-medium">New Features</span>
                        </div>
                        <p className="text-2xl font-bold text-white">{result.newFeatures.length}</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-green-500/10 border-green-500/30">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Bug className="w-4 h-4 text-green-500" />
                          <span className="text-green-400 font-medium">Bug Fixes</span>
                        </div>
                        <p className="text-2xl font-bold text-white">{result.bugFixes.length}</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-purple-500/10 border-purple-500/30">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Wrench className="w-4 h-4 text-purple-500" />
                          <span className="text-purple-400 font-medium">Improvements</span>
                        </div>
                        <p className="text-2xl font-bold text-white">{result.improvements.length}</p>
                      </CardContent>
                    </Card>
                  </div>

                  <Tabs defaultValue="release" className="w-full">
                    <TabsList className="w-full bg-gray-800">
                      <TabsTrigger value="release" className="flex-1">
                        <FileText className="w-4 h-4 mr-2" />
                        Release Notes
                      </TabsTrigger>
                      <TabsTrigger value="changelog" className="flex-1">
                        <BookOpen className="w-4 h-4 mr-2" />
                        Changelog
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="release" className="mt-4">
                      <Card className="bg-dark-card border-gray-800">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                          <CardTitle className="text-white text-lg">Release Notes</CardTitle>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyToClipboard(result.releaseNotes, "Release notes")}
                              className="border-gray-700"
                            >
                              <Copy className="w-4 h-4 mr-1" />
                              Copy
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => downloadFile(result.releaseNotes, `RELEASE_${result.version}.md`)}
                              className="border-gray-700"
                            >
                              <Download className="w-4 h-4 mr-1" />
                              Download
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <pre className="bg-gray-900 rounded-lg p-4 overflow-x-auto max-h-[400px] overflow-y-auto">
                            <code className="text-gray-300 text-sm font-mono whitespace-pre-wrap">
                              {result.releaseNotes}
                            </code>
                          </pre>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="changelog" className="mt-4">
                      <Card className="bg-dark-card border-gray-800">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                          <CardTitle className="text-white text-lg">Changelog Entry</CardTitle>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyToClipboard(result.changelog, "Changelog")}
                              className="border-gray-700"
                            >
                              <Copy className="w-4 h-4 mr-1" />
                              Copy
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => downloadFile(result.changelog, "CHANGELOG.md")}
                              className="border-gray-700"
                            >
                              <Download className="w-4 h-4 mr-1" />
                              Download
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <pre className="bg-gray-900 rounded-lg p-4 overflow-x-auto max-h-[400px] overflow-y-auto">
                            <code className="text-gray-300 text-sm font-mono whitespace-pre-wrap">
                              {result.changelog}
                            </code>
                          </pre>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>
                </>
              ) : (
                <Card className="bg-dark-card border-gray-800">
                  <CardContent className="p-12 text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FileText className="w-8 h-8 text-blue-400" />
                    </div>
                    <h3 className="text-lg font-medium text-white mb-2">Generate Professional Release Notes</h3>
                    <p className="text-gray-400 max-w-sm mx-auto mb-6">
                      AI reads your commits and creates release notes, changelogs, and suggests the right version number
                    </p>
                    <div className="grid grid-cols-2 gap-4 text-left max-w-md mx-auto">
                      <div className="flex items-center gap-2 text-gray-400">
                        <GitCommit className="w-4 h-4 text-blue-500" />
                        <span className="text-sm">Parse commits</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400">
                        <Tag className="w-4 h-4 text-purple-500" />
                        <span className="text-sm">Version suggestion</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400">
                        <FileText className="w-4 h-4 text-green-500" />
                        <span className="text-sm">Release notes</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400">
                        <BookOpen className="w-4 h-4 text-yellow-500" />
                        <span className="text-sm">Changelog format</span>
                      </div>
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
