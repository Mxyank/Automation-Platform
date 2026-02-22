import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Navigation } from "@/components/navigation";
import { BackButton } from "@/components/back-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useFeatures } from "@/hooks/use-features";
import { FeatureDisabledOverlay } from "@/components/feature-disabled-overlay";
import {
  Globe,
  Activity,
  Shield,
  Clock,
  Zap,
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  TrendingUp,
  Server,
  Lock,
  Eye,
  BarChart3,
  FileText,
  Gauge,
  RefreshCw
} from "lucide-react";
import { motion } from "framer-motion";
import { useUpgradeModal, UpgradeModal } from "@/components/upgrade-modal";

interface MonitorResult {
  url: string;
  timestamp: string;
  overallScore: number;
  status: "healthy" | "warning" | "critical";
  performance: {
    loadTime: string;
    ttfb: string;
    fcp: string;
    lcp: string;
    score: number;
    recommendations: string[];
  };
  security: {
    score: number;
    https: boolean;
    headers: { name: string; status: "pass" | "fail" | "warn"; value: string }[];
    issues: { severity: "critical" | "high" | "medium" | "low"; issue: string; fix: string }[];
  };
  seo: {
    score: number;
    title: string;
    description: string;
    issues: string[];
    recommendations: string[];
  };
  accessibility: {
    score: number;
    issues: { severity: string; issue: string; element: string }[];
  };
  logs: {
    status: number;
    responseTime: string;
    contentType: string;
    serverInfo: string;
    errors: string[];
  };
  summary: string;
}

export default function WebsiteMonitor() {
  const { toast } = useToast();
  const { showUpgradeModal, setShowUpgradeModal, checkForUpgrade } = useUpgradeModal();
  const { isEnabled } = useFeatures();
  const isFeatureEnabled = isEnabled('website_monitor');
  const [siteUrl, setSiteUrl] = useState("");
  const [checkPerformance, setCheckPerformance] = useState(true);
  const [checkSecurity, setCheckSecurity] = useState(true);
  const [checkSEO, setCheckSEO] = useState(true);
  const [checkAccessibility, setCheckAccessibility] = useState(false);
  const [result, setResult] = useState<MonitorResult | null>(null);

  const analyzeMutation = useMutation({
    mutationFn: async (data: { url: string; checks: string[] }) => {
      const response = await apiRequest("POST", "/api/ai/website-analyze", data);
      return response.json();
    },
    onSuccess: (data) => {
      setResult(data.result);
      toast({
        title: "Analysis Complete",
        description: `Website health score: ${data.result.overallScore}%`,
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
    if (!siteUrl.trim()) {
      toast({
        title: "URL Required",
        description: "Please enter your website URL.",
        variant: "destructive",
      });
      return;
    }

    const checks = [];
    if (checkPerformance) checks.push("performance");
    if (checkSecurity) checks.push("security");
    if (checkSEO) checks.push("seo");
    if (checkAccessibility) checks.push("accessibility");

    analyzeMutation.mutate({ url: siteUrl, checks });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy": return "text-green-500";
      case "warning": return "text-yellow-500";
      case "critical": return "text-red-500";
      default: return "text-gray-500";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    return "text-red-500";
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "bg-red-500/20 text-red-500";
      case "high": return "bg-orange-500/20 text-orange-500";
      case "medium": return "bg-yellow-500/20 text-yellow-500";
      case "low": return "bg-blue-500/20 text-blue-500";
      default: return "bg-gray-500/20 text-gray-500";
    }
  };

  return (
    <div className="relative min-h-screen bg-dark-bg">
      {!isFeatureEnabled && <FeatureDisabledOverlay featureName="Website Monitor" />}
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
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                <Globe className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Website Monitor & Analytics</h1>
                <p className="text-gray-400">Analyze your website's performance, security, and SEO</p>
              </div>
            </div>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <Card className="bg-dark-card border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">Website Analysis</CardTitle>
                  <CardDescription>
                    Enter your website URL for comprehensive AI-powered analysis
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-gray-300">Website URL</Label>
                    <Input
                      placeholder="https://yourwebsite.com"
                      value={siteUrl}
                      onChange={(e) => setSiteUrl(e.target.value)}
                      className="bg-gray-900 border-gray-700 text-white"
                      data-testid="input-site-url"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label className="text-gray-300">Analysis Options</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="perf"
                          checked={checkPerformance}
                          onCheckedChange={(c) => setCheckPerformance(c as boolean)}
                        />
                        <Label htmlFor="perf" className="text-gray-300 flex items-center gap-2">
                          <Zap className="w-4 h-4 text-yellow-500" />
                          Performance
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="sec"
                          checked={checkSecurity}
                          onCheckedChange={(c) => setCheckSecurity(c as boolean)}
                        />
                        <Label htmlFor="sec" className="text-gray-300 flex items-center gap-2">
                          <Shield className="w-4 h-4 text-green-500" />
                          Security
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="seo"
                          checked={checkSEO}
                          onCheckedChange={(c) => setCheckSEO(c as boolean)}
                        />
                        <Label htmlFor="seo" className="text-gray-300 flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-blue-500" />
                          SEO
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="a11y"
                          checked={checkAccessibility}
                          onCheckedChange={(c) => setCheckAccessibility(c as boolean)}
                        />
                        <Label htmlFor="a11y" className="text-gray-300 flex items-center gap-2">
                          <Eye className="w-4 h-4 text-purple-500" />
                          Accessibility
                        </Label>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={handleAnalyze}
                    disabled={analyzeMutation.isPending}
                    className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white"
                    data-testid="button-analyze"
                  >
                    {analyzeMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Analyzing Website...
                      </>
                    ) : (
                      <>
                        <Activity className="w-4 h-4 mr-2" />
                        Analyze Website
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-dark-card border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white text-lg">What We Analyze</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 text-gray-400">
                      <Clock className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm">Load time & TTFB</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                      <Lock className="w-4 h-4 text-green-500" />
                      <span className="text-sm">SSL & headers</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                      <BarChart3 className="w-4 h-4 text-blue-500" />
                      <span className="text-sm">Core Web Vitals</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                      <FileText className="w-4 h-4 text-purple-500" />
                      <span className="text-sm">Meta tags & SEO</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                      <Shield className="w-4 h-4 text-red-500" />
                      <span className="text-sm">Security scan</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                      <Server className="w-4 h-4 text-cyan-500" />
                      <span className="text-sm">Server response</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              {result ? (
                <>
                  <Card className={`border-2 ${result.status === 'healthy' ? 'border-green-500/30 bg-green-900/10' : result.status === 'warning' ? 'border-yellow-500/30 bg-yellow-900/10' : 'border-red-500/30 bg-red-900/10'}`}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="text-gray-400 text-sm">{result.url}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {result.status === 'healthy' ? (
                              <CheckCircle className="w-5 h-5 text-green-500" />
                            ) : result.status === 'warning' ? (
                              <AlertTriangle className="w-5 h-5 text-yellow-500" />
                            ) : (
                              <XCircle className="w-5 h-5 text-red-500" />
                            )}
                            <span className={`text-lg font-bold capitalize ${getStatusColor(result.status)}`}>
                              {result.status}
                            </span>
                          </div>
                        </div>
                        <div className="text-center">
                          <div className={`text-4xl font-bold ${getScoreColor(result.overallScore)}`}>
                            {result.overallScore}
                          </div>
                          <p className="text-gray-400 text-xs">Overall Score</p>
                        </div>
                      </div>

                      <p className="text-gray-300 text-sm mb-4">{result.summary}</p>

                      <div className="grid grid-cols-4 gap-3">
                        <div className="text-center">
                          <Gauge className={`w-5 h-5 mx-auto mb-1 ${getScoreColor(result.performance.score)}`} />
                          <p className={`text-lg font-bold ${getScoreColor(result.performance.score)}`}>{result.performance.score}</p>
                          <p className="text-gray-400 text-xs">Performance</p>
                        </div>
                        <div className="text-center">
                          <Shield className={`w-5 h-5 mx-auto mb-1 ${getScoreColor(result.security.score)}`} />
                          <p className={`text-lg font-bold ${getScoreColor(result.security.score)}`}>{result.security.score}</p>
                          <p className="text-gray-400 text-xs">Security</p>
                        </div>
                        <div className="text-center">
                          <TrendingUp className={`w-5 h-5 mx-auto mb-1 ${getScoreColor(result.seo.score)}`} />
                          <p className={`text-lg font-bold ${getScoreColor(result.seo.score)}`}>{result.seo.score}</p>
                          <p className="text-gray-400 text-xs">SEO</p>
                        </div>
                        <div className="text-center">
                          <Eye className={`w-5 h-5 mx-auto mb-1 ${getScoreColor(result.accessibility.score)}`} />
                          <p className={`text-lg font-bold ${getScoreColor(result.accessibility.score)}`}>{result.accessibility.score}</p>
                          <p className="text-gray-400 text-xs">A11y</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Tabs defaultValue="performance" className="w-full">
                    <TabsList className="w-full bg-gray-800 grid grid-cols-5">
                      <TabsTrigger value="performance"><Zap className="w-4 h-4" /></TabsTrigger>
                      <TabsTrigger value="security"><Shield className="w-4 h-4" /></TabsTrigger>
                      <TabsTrigger value="seo"><TrendingUp className="w-4 h-4" /></TabsTrigger>
                      <TabsTrigger value="a11y"><Eye className="w-4 h-4" /></TabsTrigger>
                      <TabsTrigger value="logs"><Activity className="w-4 h-4" /></TabsTrigger>
                    </TabsList>

                    <TabsContent value="performance" className="mt-4">
                      <Card className="bg-dark-card border-gray-800">
                        <CardHeader>
                          <CardTitle className="text-white text-lg">Performance Metrics</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-gray-800 rounded-lg p-3">
                              <p className="text-gray-400 text-xs">Load Time</p>
                              <p className="text-xl font-bold text-white">{result.performance.loadTime}</p>
                            </div>
                            <div className="bg-gray-800 rounded-lg p-3">
                              <p className="text-gray-400 text-xs">TTFB</p>
                              <p className="text-xl font-bold text-white">{result.performance.ttfb}</p>
                            </div>
                            <div className="bg-gray-800 rounded-lg p-3">
                              <p className="text-gray-400 text-xs">First Contentful Paint</p>
                              <p className="text-xl font-bold text-white">{result.performance.fcp}</p>
                            </div>
                            <div className="bg-gray-800 rounded-lg p-3">
                              <p className="text-gray-400 text-xs">Largest Contentful Paint</p>
                              <p className="text-xl font-bold text-white">{result.performance.lcp}</p>
                            </div>
                          </div>
                          {result.performance.recommendations.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-gray-400 text-sm">Recommendations:</p>
                              {result.performance.recommendations.map((rec, i) => (
                                <div key={i} className="flex items-start gap-2 text-gray-300 text-sm">
                                  <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                                  {rec}
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="security" className="mt-4 space-y-4">
                      <Card className="bg-dark-card border-gray-800">
                        <CardHeader>
                          <CardTitle className="text-white text-lg flex items-center gap-2">
                            <Lock className={result.security.https ? "text-green-500" : "text-red-500"} />
                            HTTPS: {result.security.https ? "Enabled" : "Disabled"}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <p className="text-gray-400 text-sm">Security Headers:</p>
                          {result.security.headers.map((h, i) => (
                            <div key={i} className="flex items-center justify-between bg-gray-800 rounded p-2">
                              <span className="text-gray-300 text-sm">{h.name}</span>
                              <Badge className={h.status === 'pass' ? 'bg-green-500/20 text-green-500' : h.status === 'warn' ? 'bg-yellow-500/20 text-yellow-500' : 'bg-red-500/20 text-red-500'}>
                                {h.status}
                              </Badge>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                      {result.security.issues.length > 0 && (
                        <Card className="bg-dark-card border-gray-800">
                          <CardHeader>
                            <CardTitle className="text-white text-lg">Security Issues</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            {result.security.issues.map((issue, i) => (
                              <div key={i} className="bg-gray-800 rounded-lg p-3">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge className={getSeverityColor(issue.severity)}>{issue.severity}</Badge>
                                  <span className="text-white text-sm">{issue.issue}</span>
                                </div>
                                <p className="text-green-400 text-sm">Fix: {issue.fix}</p>
                              </div>
                            ))}
                          </CardContent>
                        </Card>
                      )}
                    </TabsContent>

                    <TabsContent value="seo" className="mt-4">
                      <Card className="bg-dark-card border-gray-800">
                        <CardHeader>
                          <CardTitle className="text-white text-lg">SEO Analysis</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-2">
                            <p className="text-gray-400 text-xs">Title Tag</p>
                            <p className="text-white bg-gray-800 rounded p-2 text-sm">{result.seo.title || "Not found"}</p>
                          </div>
                          <div className="space-y-2">
                            <p className="text-gray-400 text-xs">Meta Description</p>
                            <p className="text-white bg-gray-800 rounded p-2 text-sm">{result.seo.description || "Not found"}</p>
                          </div>
                          {result.seo.issues.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-gray-400 text-sm">Issues:</p>
                              {result.seo.issues.map((issue, i) => (
                                <div key={i} className="flex items-start gap-2 text-red-400 text-sm">
                                  <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                  {issue}
                                </div>
                              ))}
                            </div>
                          )}
                          {result.seo.recommendations.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-gray-400 text-sm">Recommendations:</p>
                              {result.seo.recommendations.map((rec, i) => (
                                <div key={i} className="flex items-start gap-2 text-green-400 text-sm">
                                  <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                  {rec}
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="a11y" className="mt-4">
                      <Card className="bg-dark-card border-gray-800">
                        <CardHeader>
                          <CardTitle className="text-white text-lg">Accessibility</CardTitle>
                        </CardHeader>
                        <CardContent>
                          {result.accessibility.issues.length > 0 ? (
                            <div className="space-y-3">
                              {result.accessibility.issues.map((issue, i) => (
                                <div key={i} className="bg-gray-800 rounded-lg p-3">
                                  <Badge className={getSeverityColor(issue.severity)} >{issue.severity}</Badge>
                                  <p className="text-white text-sm mt-2">{issue.issue}</p>
                                  <p className="text-gray-400 text-xs mt-1">Element: {issue.element}</p>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-green-400 text-center py-4">No accessibility issues found!</p>
                          )}
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="logs" className="mt-4">
                      <Card className="bg-dark-card border-gray-800">
                        <CardHeader>
                          <CardTitle className="text-white text-lg">Server Response</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-gray-800 rounded-lg p-3">
                              <p className="text-gray-400 text-xs">Status Code</p>
                              <p className={`text-xl font-bold ${result.logs.status === 200 ? 'text-green-500' : 'text-red-500'}`}>
                                {result.logs.status}
                              </p>
                            </div>
                            <div className="bg-gray-800 rounded-lg p-3">
                              <p className="text-gray-400 text-xs">Response Time</p>
                              <p className="text-xl font-bold text-white">{result.logs.responseTime}</p>
                            </div>
                          </div>
                          <div className="bg-gray-800 rounded-lg p-3">
                            <p className="text-gray-400 text-xs">Content Type</p>
                            <p className="text-white">{result.logs.contentType}</p>
                          </div>
                          <div className="bg-gray-800 rounded-lg p-3">
                            <p className="text-gray-400 text-xs">Server</p>
                            <p className="text-white">{result.logs.serverInfo}</p>
                          </div>
                          {result.logs.errors.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-red-400 text-sm">Errors:</p>
                              {result.logs.errors.map((err, i) => (
                                <p key={i} className="text-red-400 text-sm bg-red-500/10 rounded p-2">{err}</p>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>
                </>
              ) : (
                <Card className="bg-dark-card border-gray-800">
                  <CardContent className="p-12 text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Globe className="w-8 h-8 text-blue-400" />
                    </div>
                    <h3 className="text-lg font-medium text-white mb-2">Website Monitor</h3>
                    <p className="text-gray-400 max-w-sm mx-auto mb-6">
                      Enter your website URL to get a comprehensive analysis of performance, security, and SEO
                    </p>
                    <div className="grid grid-cols-2 gap-3 text-left max-w-sm mx-auto">
                      <div className="flex items-center gap-2 text-gray-400">
                        <Zap className="w-4 h-4 text-yellow-500" />
                        <span className="text-sm">Core Web Vitals</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400">
                        <Shield className="w-4 h-4 text-green-500" />
                        <span className="text-sm">Security scan</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400">
                        <TrendingUp className="w-4 h-4 text-blue-500" />
                        <span className="text-sm">SEO analysis</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400">
                        <Eye className="w-4 h-4 text-purple-500" />
                        <span className="text-sm">Accessibility</span>
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
