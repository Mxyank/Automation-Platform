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
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Shield, 
  Key, 
  AlertTriangle, 
  Lock, 
  Unlock, 
  Loader2,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  Wand2,
  Copy,
  UserX,
  FileWarning,
  ShieldAlert,
  ShieldCheck
} from "lucide-react";
import { motion } from "framer-motion";

interface SecretFinding {
  type: "aws_key" | "api_key" | "password" | "token" | "certificate" | "iam_issue" | "over_permission";
  severity: "critical" | "high" | "medium" | "low";
  location: string;
  line?: number;
  description: string;
  exposed: string;
  remediation: string;
  autoFixed?: boolean;
}

interface ScanResult {
  findings: SecretFinding[];
  fixedCode?: string;
  summary: string;
  stats: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    autoFixed: number;
  };
  securityScore: number;
}

export default function SecretScanner() {
  const { toast } = useToast();
  const [code, setCode] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [autoRemediate, setAutoRemediate] = useState(true);
  const [scanType, setScanType] = useState<"code" | "repo">("code");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [showSecrets, setShowSecrets] = useState(false);

  const scanMutation = useMutation({
    mutationFn: async (data: { code?: string; repoUrl?: string; autoRemediate: boolean }) => {
      const response = await apiRequest("POST", "/api/ai/secret-scan", data);
      return response.json();
    },
    onSuccess: (data) => {
      setResult(data.result);
      const criticalCount = data.result.stats.critical;
      toast({
        title: "Scan Complete",
        description: criticalCount > 0 
          ? `Found ${criticalCount} critical security issues!` 
          : "No critical issues found.",
        variant: criticalCount > 0 ? "destructive" : "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Scan Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleScan = () => {
    if (scanType === "code" && !code.trim()) {
      toast({
        title: "Code Required",
        description: "Please paste your code to scan for secrets.",
        variant: "destructive",
      });
      return;
    }
    if (scanType === "repo" && !repoUrl.trim()) {
      toast({
        title: "Repository URL Required",
        description: "Please enter a GitHub repository URL.",
        variant: "destructive",
      });
      return;
    }
    scanMutation.mutate({
      code: scanType === "code" ? code : undefined,
      repoUrl: scanType === "repo" ? repoUrl : undefined,
      autoRemediate,
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "aws_key": return <Key className="w-4 h-4" />;
      case "api_key": return <Key className="w-4 h-4" />;
      case "password": return <Lock className="w-4 h-4" />;
      case "token": return <Shield className="w-4 h-4" />;
      case "iam_issue": return <UserX className="w-4 h-4" />;
      case "over_permission": return <ShieldAlert className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "text-red-500 bg-red-500/20 border-red-500/50";
      case "high": return "text-orange-500 bg-orange-500/20 border-orange-500/50";
      case "medium": return "text-yellow-500 bg-yellow-500/20 border-yellow-500/50";
      case "low": return "text-blue-500 bg-blue-500/20 border-blue-500/50";
      default: return "text-gray-500 bg-gray-500/20";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    if (score >= 40) return "text-orange-500";
    return "text-red-500";
  };

  const maskSecret = (secret: string) => {
    if (!showSecrets) {
      return secret.substring(0, 4) + "****" + secret.substring(secret.length - 4);
    }
    return secret;
  };

  return (
    <div className="min-h-screen bg-dark-bg">
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
              <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-orange-500 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Secret Scanner</h1>
                <p className="text-gray-400">Detect exposed secrets and auto-remediate security issues</p>
              </div>
            </div>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <Card className="bg-dark-card border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">Security Scan</CardTitle>
                  <CardDescription>
                    Scan code for exposed secrets, misconfigured IAM, and security vulnerabilities
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Tabs value={scanType} onValueChange={(v) => setScanType(v as "code" | "repo")}>
                    <TabsList className="w-full bg-gray-800">
                      <TabsTrigger value="code" className="flex-1">
                        <FileWarning className="w-4 h-4 mr-2" />
                        Paste Code
                      </TabsTrigger>
                      <TabsTrigger value="repo" className="flex-1">
                        <Shield className="w-4 h-4 mr-2" />
                        Scan Repository
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="code" className="mt-4 space-y-4">
                      <div className="space-y-2">
                        <Label className="text-gray-300">Your Code</Label>
                        <Textarea
                          placeholder={`Paste your code to scan for secrets:

# Example (these would be flagged):
AWS_ACCESS_KEY_ID = "AKIA..."
DB_PASSWORD = "super_secret_123"
API_TOKEN = "ghp_xxxxxxxxxxxx"
PRIVATE_KEY = "-----BEGIN RSA PRIVATE KEY-----"`}
                          value={code}
                          onChange={(e) => setCode(e.target.value)}
                          className="bg-gray-900 border-gray-700 text-white font-mono min-h-[300px]"
                          data-testid="textarea-code"
                        />
                      </div>
                    </TabsContent>

                    <TabsContent value="repo" className="mt-4 space-y-4">
                      <div className="space-y-2">
                        <Label className="text-gray-300">Repository URL</Label>
                        <Input
                          placeholder="https://github.com/username/repo"
                          value={repoUrl}
                          onChange={(e) => setRepoUrl(e.target.value)}
                          className="bg-gray-900 border-gray-700 text-white"
                          data-testid="input-repo-url"
                        />
                        <p className="text-xs text-gray-500">
                          We'll scan for exposed secrets in your repository
                        </p>
                      </div>
                    </TabsContent>
                  </Tabs>

                  <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Wand2 className="w-5 h-5 text-green-500" />
                      <div>
                        <p className="text-white font-medium">Auto-Remediation</p>
                        <p className="text-gray-400 text-sm">Automatically fix detected issues</p>
                      </div>
                    </div>
                    <Switch
                      checked={autoRemediate}
                      onCheckedChange={setAutoRemediate}
                    />
                  </div>

                  <Button
                    onClick={handleScan}
                    disabled={scanMutation.isPending}
                    className="w-full bg-gradient-to-r from-red-500 to-orange-500 text-white"
                    data-testid="button-scan"
                  >
                    {scanMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Scanning for Secrets...
                      </>
                    ) : (
                      <>
                        <Shield className="w-4 h-4 mr-2" />
                        Scan for Secrets
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
                      <Key className="w-4 h-4 text-red-500" />
                      <span className="text-sm">AWS Keys & Tokens</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                      <Lock className="w-4 h-4 text-orange-500" />
                      <span className="text-sm">Hardcoded Passwords</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                      <Shield className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm">API Keys & Tokens</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                      <UserX className="w-4 h-4 text-purple-500" />
                      <span className="text-sm">Misconfigured IAM</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                      <ShieldAlert className="w-4 h-4 text-pink-500" />
                      <span className="text-sm">Over-Permissioned Roles</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                      <FileWarning className="w-4 h-4 text-blue-500" />
                      <span className="text-sm">Certificates & Keys</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              {result ? (
                <>
                  <Card className={`bg-dark-card border-2 ${result.securityScore >= 80 ? 'border-green-500/50' : result.securityScore >= 60 ? 'border-yellow-500/50' : 'border-red-500/50'}`}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          {result.securityScore >= 80 ? (
                            <ShieldCheck className="w-8 h-8 text-green-500" />
                          ) : (
                            <ShieldAlert className="w-8 h-8 text-red-500" />
                          )}
                          <div>
                            <h3 className="text-xl font-bold text-white">Security Score</h3>
                            <p className="text-gray-400 text-sm">{result.summary}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-4xl font-bold ${getScoreColor(result.securityScore)}`}>
                            {result.securityScore}%
                          </div>
                        </div>
                      </div>
                      <Progress 
                        value={result.securityScore} 
                        className={`h-2 ${result.securityScore >= 80 ? '[&>div]:bg-green-500' : result.securityScore >= 60 ? '[&>div]:bg-yellow-500' : '[&>div]:bg-red-500'}`}
                      />
                      <div className="grid grid-cols-4 gap-4 mt-4 text-center">
                        <div>
                          <p className="text-red-500 font-bold text-xl">{result.stats.critical}</p>
                          <p className="text-gray-500 text-xs">Critical</p>
                        </div>
                        <div>
                          <p className="text-orange-500 font-bold text-xl">{result.stats.high}</p>
                          <p className="text-gray-500 text-xs">High</p>
                        </div>
                        <div>
                          <p className="text-yellow-500 font-bold text-xl">{result.stats.medium}</p>
                          <p className="text-gray-500 text-xs">Medium</p>
                        </div>
                        <div>
                          <p className="text-blue-500 font-bold text-xl">{result.stats.low}</p>
                          <p className="text-gray-500 text-xs">Low</p>
                        </div>
                      </div>
                      {result.stats.autoFixed > 0 && (
                        <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-green-500" />
                          <span className="text-green-400">{result.stats.autoFixed} issues auto-remediated</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-white">Findings</h3>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowSecrets(!showSecrets)}
                      className="text-gray-400"
                    >
                      {showSecrets ? (
                        <>
                          <EyeOff className="w-4 h-4 mr-1" />
                          Hide Secrets
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4 mr-1" />
                          Show Secrets
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="space-y-3 max-h-[500px] overflow-y-auto">
                    {result.findings.length === 0 ? (
                      <Card className="bg-dark-card border-gray-800">
                        <CardContent className="p-6 text-center">
                          <ShieldCheck className="w-12 h-12 text-green-500 mx-auto mb-3" />
                          <h4 className="text-white font-medium">No Secrets Found!</h4>
                          <p className="text-gray-400 text-sm">Your code looks secure.</p>
                        </CardContent>
                      </Card>
                    ) : (
                      result.findings.map((finding, index) => (
                        <Card key={index} className={`bg-dark-card border ${getSeverityColor(finding.severity)}`}>
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <div className={`p-2 rounded-lg ${getSeverityColor(finding.severity)}`}>
                                {getTypeIcon(finding.type)}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge className={getSeverityColor(finding.severity)} variant="outline">
                                    {finding.severity}
                                  </Badge>
                                  <span className="text-gray-500 text-xs uppercase">
                                    {finding.type.replace("_", " ")}
                                  </span>
                                  {finding.line && (
                                    <span className="text-gray-600 text-xs">Line {finding.line}</span>
                                  )}
                                  {finding.autoFixed && (
                                    <Badge className="bg-green-500/20 text-green-500">Auto-fixed</Badge>
                                  )}
                                </div>
                                <p className="text-white font-medium">{finding.description}</p>
                                <p className="text-gray-500 text-sm mt-1">{finding.location}</p>
                                
                                {finding.exposed && (
                                  <div className="mt-2 bg-red-500/10 border border-red-500/30 rounded p-2">
                                    <code className="text-red-400 text-xs font-mono break-all">
                                      {maskSecret(finding.exposed)}
                                    </code>
                                  </div>
                                )}
                                
                                <div className="mt-2 bg-green-500/10 border border-green-500/30 rounded p-2">
                                  <p className="text-green-400 text-xs">{finding.remediation}</p>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </>
              ) : (
                <Card className="bg-dark-card border-gray-800">
                  <CardContent className="p-12 text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-red-500/20 to-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Shield className="w-8 h-8 text-red-400" />
                    </div>
                    <h3 className="text-lg font-medium text-white mb-2">Secure Secret Scanner</h3>
                    <p className="text-gray-400 max-w-sm mx-auto mb-6">
                      AI detects exposed secrets, misconfigured IAM, and over-permissioned roles, then auto-remediates
                    </p>
                    <div className="grid grid-cols-2 gap-4 text-left max-w-md mx-auto">
                      <div className="flex items-center gap-2 text-gray-400">
                        <Key className="w-4 h-4 text-red-500" />
                        <span className="text-sm">Detect AWS keys</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400">
                        <Lock className="w-4 h-4 text-orange-500" />
                        <span className="text-sm">Find passwords</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400">
                        <UserX className="w-4 h-4 text-purple-500" />
                        <span className="text-sm">IAM analysis</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400">
                        <Wand2 className="w-4 h-4 text-green-500" />
                        <span className="text-sm">Auto-fix issues</span>
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
