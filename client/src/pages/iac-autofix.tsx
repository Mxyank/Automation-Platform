import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Navigation } from "@/components/navigation";
import { BackButton } from "@/components/back-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useFeatures } from "@/hooks/use-features";
import { FeatureDisabledOverlay } from "@/components/feature-disabled-overlay";
import {
  FileCode,
  AlertTriangle,
  Shield,
  Tag,
  Trash2,
  Loader2,
  CheckCircle,
  XCircle,
  Wand2,
  Copy,
  Download,
  GitCompare,
  RefreshCw
} from "lucide-react";
import { motion } from "framer-motion";
import { useUpgradeModal, UpgradeModal } from "@/components/upgrade-modal";

interface IaCIssue {
  type: "drift" | "syntax" | "security" | "missing_tags" | "unused";
  severity: "critical" | "high" | "medium" | "low";
  line?: number;
  resource: string;
  description: string;
  fix: string;
}

interface AnalysisResult {
  issues: IaCIssue[];
  fixedCode: string;
  summary: string;
  stats: {
    totalIssues: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

export default function IaCAutofix() {
  const { toast } = useToast();
  const { showUpgradeModal, setShowUpgradeModal, checkForUpgrade } = useUpgradeModal();
  const { isEnabled } = useFeatures();
  const isFeatureEnabled = isEnabled('iac_autofix');
  const [iacCode, setIacCode] = useState("");
  const [iacType, setIacType] = useState("terraform");
  const [autoFix, setAutoFix] = useState(true);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [showDiff, setShowDiff] = useState(false);

  const analyzeMutation = useMutation({
    mutationFn: async (data: { code: string; type: string; autoFix: boolean }) => {
      const response = await apiRequest("POST", "/api/ai/iac-analyze", data);
      return response.json();
    },
    onSuccess: (data) => {
      setResult(data.result);
      toast({
        title: "Analysis Complete",
        description: `Found ${data.result.stats.totalIssues} issues in your ${iacType} code.`,
      });
    },
    onError: (error: Error) => {
      if (checkForUpgrade(error)) return;
      toast({
        title: "Analysis Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAnalyze = () => {
    if (!iacCode.trim()) {
      toast({
        title: "Code Required",
        description: "Please paste your Infrastructure-as-Code to analyze.",
        variant: "destructive",
      });
      return;
    }
    analyzeMutation.mutate({
      code: iacCode,
      type: iacType,
      autoFix,
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Fixed code copied to clipboard.",
    });
  };

  const getIssueIcon = (type: string) => {
    switch (type) {
      case "drift": return <GitCompare className="w-4 h-4" />;
      case "syntax": return <FileCode className="w-4 h-4" />;
      case "security": return <Shield className="w-4 h-4" />;
      case "missing_tags": return <Tag className="w-4 h-4" />;
      case "unused": return <Trash2 className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "text-red-500 bg-red-500/20 border-red-500/50";
      case "high": return "text-orange-500 bg-orange-500/20 border-orange-500/50";
      case "medium": return "text-yellow-500 bg-yellow-500/20 border-yellow-500/50";
      case "low": return "text-blue-500 bg-blue-500/20 border-blue-500/50";
      default: return "text-gray-500 bg-gray-500/20 border-gray-500/50";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "drift": return "text-purple-400";
      case "syntax": return "text-red-400";
      case "security": return "text-orange-400";
      case "missing_tags": return "text-yellow-400";
      case "unused": return "text-gray-400";
      default: return "text-gray-400";
    }
  };

  return (
    <div className="relative min-h-screen bg-dark-bg">
      {!isFeatureEnabled && <FeatureDisabledOverlay featureName="IaC Autofix" />}
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
              <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                <Wand2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">IaC Autofix</h1>
                <p className="text-gray-400">AI-powered Terraform & Pulumi code analyzer and fixer</p>
              </div>
            </div>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <Card className="bg-dark-card border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">Infrastructure Code</CardTitle>
                  <CardDescription>
                    Paste your Terraform, Pulumi, or CloudFormation code for analysis
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2 flex-1 mr-4">
                      <Label className="text-gray-300">IaC Type</Label>
                      <Select value={iacType} onValueChange={setIacType}>
                        <SelectTrigger className="bg-gray-900 border-gray-700 text-white" data-testid="select-iac-type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="terraform">Terraform (HCL)</SelectItem>
                          <SelectItem value="pulumi">Pulumi</SelectItem>
                          <SelectItem value="cloudformation">CloudFormation</SelectItem>
                          <SelectItem value="ansible">Ansible</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center space-x-2 pt-6">
                      <Switch
                        id="autofix"
                        checked={autoFix}
                        onCheckedChange={setAutoFix}
                      />
                      <Label htmlFor="autofix" className="text-gray-300">Auto-fix issues</Label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-300">Your Code</Label>
                    <Textarea
                      placeholder={`# Paste your ${iacType} code here

resource "aws_instance" "web" {
  ami           = "ami-12345678"
  instance_type = "t2.micro"
  
  # Missing tags, security groups, etc.
}`}
                      value={iacCode}
                      onChange={(e) => setIacCode(e.target.value)}
                      className="bg-gray-900 border-gray-700 text-white font-mono min-h-[400px]"
                      data-testid="textarea-iac-code"
                    />
                  </div>

                  <Button
                    onClick={handleAnalyze}
                    disabled={analyzeMutation.isPending}
                    className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white"
                    data-testid="button-analyze"
                  >
                    {analyzeMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Analyzing Code...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-4 h-4 mr-2" />
                        Analyze & Fix
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-dark-card border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white text-lg">What We Detect</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2 text-gray-400">
                      <GitCompare className="w-4 h-4 text-purple-500" />
                      <span className="text-sm">Configuration Drift</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                      <FileCode className="w-4 h-4 text-red-500" />
                      <span className="text-sm">Syntax Errors</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                      <Shield className="w-4 h-4 text-orange-500" />
                      <span className="text-sm">Security Issues</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                      <Tag className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm">Missing Tags/Policies</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                      <Trash2 className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">Unused Resources</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                      <RefreshCw className="w-4 h-4 text-blue-500" />
                      <span className="text-sm">Auto-correction</span>
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
                        <h3 className="text-xl font-bold text-white">Analysis Summary</h3>
                        <div className="flex gap-2">
                          {result.stats.critical > 0 && (
                            <Badge className="bg-red-500/20 text-red-500">{result.stats.critical} Critical</Badge>
                          )}
                          {result.stats.high > 0 && (
                            <Badge className="bg-orange-500/20 text-orange-500">{result.stats.high} High</Badge>
                          )}
                          {result.stats.medium > 0 && (
                            <Badge className="bg-yellow-500/20 text-yellow-500">{result.stats.medium} Medium</Badge>
                          )}
                          {result.stats.low > 0 && (
                            <Badge className="bg-blue-500/20 text-blue-500">{result.stats.low} Low</Badge>
                          )}
                        </div>
                      </div>
                      <p className="text-gray-300">{result.summary}</p>
                    </CardContent>
                  </Card>

                  <Tabs defaultValue="issues" className="w-full">
                    <TabsList className="w-full bg-gray-800">
                      <TabsTrigger value="issues" className="flex-1">
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        Issues ({result.issues.length})
                      </TabsTrigger>
                      <TabsTrigger value="fixed" className="flex-1">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Fixed Code
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="issues" className="mt-4 space-y-3 max-h-[500px] overflow-y-auto">
                      {result.issues.length === 0 ? (
                        <Card className="bg-dark-card border-gray-800">
                          <CardContent className="p-6 text-center">
                            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                            <h4 className="text-white font-medium">No Issues Found!</h4>
                            <p className="text-gray-400 text-sm">Your infrastructure code looks good.</p>
                          </CardContent>
                        </Card>
                      ) : (
                        result.issues.map((issue, index) => (
                          <Card key={index} className={`bg-dark-card border ${getSeverityColor(issue.severity)}`}>
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                <div className={getTypeColor(issue.type)}>
                                  {getIssueIcon(issue.type)}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Badge className={getSeverityColor(issue.severity)} variant="outline">
                                      {issue.severity}
                                    </Badge>
                                    <span className="text-gray-500 text-xs uppercase">{issue.type.replace("_", " ")}</span>
                                    {issue.line && (
                                      <span className="text-gray-600 text-xs">Line {issue.line}</span>
                                    )}
                                  </div>
                                  <p className="text-white font-medium">{issue.resource}</p>
                                  <p className="text-gray-400 text-sm mt-1">{issue.description}</p>
                                  {issue.fix && (
                                    <div className="mt-2 bg-green-500/10 border border-green-500/30 rounded p-2">
                                      <p className="text-green-400 text-xs font-mono">{issue.fix}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </TabsContent>

                    <TabsContent value="fixed" className="mt-4">
                      <Card className="bg-dark-card border-gray-800">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                          <CardTitle className="text-white text-lg">Corrected Code</CardTitle>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyToClipboard(result.fixedCode)}
                              className="border-gray-700"
                            >
                              <Copy className="w-4 h-4 mr-1" />
                              Copy
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <pre className="bg-gray-900 rounded-lg p-4 overflow-x-auto max-h-[400px] overflow-y-auto">
                            <code className="text-green-400 text-sm font-mono whitespace-pre-wrap">
                              {result.fixedCode}
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
                    <div className="w-16 h-16 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Wand2 className="w-8 h-8 text-orange-400" />
                    </div>
                    <h3 className="text-lg font-medium text-white mb-2">Analyze Your Infrastructure Code</h3>
                    <p className="text-gray-400 max-w-sm mx-auto">
                      AI will detect issues, security vulnerabilities, and auto-correct your Terraform or Pulumi code
                    </p>
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
