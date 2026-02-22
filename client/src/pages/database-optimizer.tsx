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
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useFeatures } from "@/hooks/use-features";
import { FeatureDisabledOverlay } from "@/components/feature-disabled-overlay";
import {
  Database,
  Zap,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Copy,
  TrendingUp,
  Clock,
  Server,
  Search,
  Shield,
  BarChart3,
  ArrowRight,
  Settings
} from "lucide-react";
import { motion } from "framer-motion";
import { useUpgradeModal, UpgradeModal } from "@/components/upgrade-modal";

interface OptimizationResult {
  summary: string;
  overallScore: number;
  slowQueries: {
    query: string;
    executionTime: string;
    issue: string;
    optimizedQuery: string;
    improvement: string;
  }[];
  indexRecommendations: {
    table: string;
    columns: string[];
    type: string;
    createStatement: string;
    reason: string;
    estimatedImprovement: string;
  }[];
  configOptimizations: {
    parameter: string;
    currentValue: string;
    recommendedValue: string;
    reason: string;
    impact: "high" | "medium" | "low";
  }[];
  antiPatterns: {
    pattern: string;
    location: string;
    severity: "critical" | "high" | "medium" | "low";
    fix: string;
  }[];
  queryBottlenecks: {
    query: string;
    bottleneck: string;
    prediction: string;
    mitigation: string;
  }[];
}

export default function DatabaseOptimizer() {
  const { toast } = useToast();
  const { showUpgradeModal, setShowUpgradeModal, checkForUpgrade } = useUpgradeModal();
  const { isEnabled } = useFeatures();
  const isFeatureEnabled = isEnabled('database_optimizer');
  const [slowQueries, setSlowQueries] = useState("");
  const [schemaDDL, setSchemaDDL] = useState("");
  const [engine, setEngine] = useState("postgresql");
  const [result, setResult] = useState<OptimizationResult | null>(null);

  const optimizeMutation = useMutation({
    mutationFn: async (data: { slowQueries: string; schemaDDL: string; engine: string }) => {
      const response = await apiRequest("POST", "/api/ai/db-optimize", data);
      return response.json();
    },
    onSuccess: (data) => {
      setResult(data.result);
      toast({
        title: "Analysis Complete",
        description: `Found ${data.result.indexRecommendations.length} optimization opportunities.`,
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

  const handleOptimize = () => {
    if (!slowQueries.trim() && !schemaDDL.trim()) {
      toast({
        title: "Input Required",
        description: "Please provide slow queries or schema DDL to analyze.",
        variant: "destructive",
      });
      return;
    }
    optimizeMutation.mutate({ slowQueries, schemaDDL, engine });
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: `${type} copied to clipboard.` });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "bg-red-500/20 text-red-500 border-red-500/50";
      case "high": return "bg-orange-500/20 text-orange-500 border-orange-500/50";
      case "medium": return "bg-yellow-500/20 text-yellow-500 border-yellow-500/50";
      case "low": return "bg-blue-500/20 text-blue-500 border-blue-500/50";
      default: return "bg-gray-500/20 text-gray-500";
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "high": return "text-green-500";
      case "medium": return "text-yellow-500";
      case "low": return "text-blue-500";
      default: return "text-gray-500";
    }
  };

  return (
    <div className="relative min-h-screen bg-dark-bg">
      {!isFeatureEnabled && <FeatureDisabledOverlay featureName="Database Optimizer" />}
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
              <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center">
                <Database className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">AI DBA - Database Optimizer</h1>
                <p className="text-gray-400">Enterprise-grade query analysis and optimization</p>
              </div>
            </div>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <Card className="bg-dark-card border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">Database Analysis</CardTitle>
                  <CardDescription>
                    Paste your slow queries or schema for AI-powered optimization
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-gray-300">Database Engine</Label>
                    <Select value={engine} onValueChange={setEngine}>
                      <SelectTrigger className="bg-gray-900 border-gray-700 text-white" data-testid="select-engine">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="postgresql">PostgreSQL</SelectItem>
                        <SelectItem value="mysql">MySQL</SelectItem>
                        <SelectItem value="mariadb">MariaDB</SelectItem>
                        <SelectItem value="mssql">SQL Server</SelectItem>
                        <SelectItem value="oracle">Oracle</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-300">Slow Queries (with EXPLAIN output if available)</Label>
                    <Textarea
                      placeholder={`Paste slow queries here, e.g.:

-- Query 1 (takes 5s)
SELECT * FROM orders o
JOIN customers c ON o.customer_id = c.id
WHERE o.created_at > '2024-01-01'
ORDER BY o.total DESC;

-- EXPLAIN ANALYZE output:
Seq Scan on orders...`}
                      value={slowQueries}
                      onChange={(e) => setSlowQueries(e.target.value)}
                      className="bg-gray-900 border-gray-700 text-white font-mono min-h-[180px]"
                      data-testid="textarea-queries"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-300">Schema DDL (optional)</Label>
                    <Textarea
                      placeholder={`CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  customer_id INT,
  total DECIMAL(10,2),
  created_at TIMESTAMP
);`}
                      value={schemaDDL}
                      onChange={(e) => setSchemaDDL(e.target.value)}
                      className="bg-gray-900 border-gray-700 text-white font-mono min-h-[120px]"
                      data-testid="textarea-schema"
                    />
                  </div>

                  <Button
                    onClick={handleOptimize}
                    disabled={optimizeMutation.isPending}
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white"
                    data-testid="button-optimize"
                  >
                    {optimizeMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Analyzing Database...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 mr-2" />
                        Optimize Database
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-dark-card border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white text-lg">AI DBA Capabilities</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 text-gray-400">
                      <Search className="w-4 h-4 text-blue-500" />
                      <span className="text-sm">Query analysis</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                      <TrendingUp className="w-4 h-4 text-green-500" />
                      <span className="text-sm">Index suggestions</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                      <Settings className="w-4 h-4 text-purple-500" />
                      <span className="text-sm">Config tuning</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                      <AlertTriangle className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm">Anti-pattern detection</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                      <Clock className="w-4 h-4 text-orange-500" />
                      <span className="text-sm">Bottleneck prediction</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                      <Shield className="w-4 h-4 text-red-500" />
                      <span className="text-sm">Query rewriting</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              {result ? (
                <>
                  <Card className="bg-gradient-to-br from-emerald-900/30 to-teal-900/30 border-emerald-500/30">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-white">Database Health Score</h3>
                          <p className="text-gray-400">{result.summary}</p>
                        </div>
                        <div className={`text-4xl font-bold ${result.overallScore >= 80 ? 'text-green-500' : result.overallScore >= 60 ? 'text-yellow-500' : 'text-red-500'}`}>
                          {result.overallScore}%
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-3">
                        <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                          <p className="text-gray-400 text-xs">Slow Queries</p>
                          <p className="text-xl font-bold text-red-500">{result.slowQueries.length}</p>
                        </div>
                        <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                          <p className="text-gray-400 text-xs">Indexes</p>
                          <p className="text-xl font-bold text-blue-500">{result.indexRecommendations.length}</p>
                        </div>
                        <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                          <p className="text-gray-400 text-xs">Config</p>
                          <p className="text-xl font-bold text-purple-500">{result.configOptimizations.length}</p>
                        </div>
                        <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                          <p className="text-gray-400 text-xs">Issues</p>
                          <p className="text-xl font-bold text-orange-500">{result.antiPatterns.length}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Tabs defaultValue="queries" className="w-full">
                    <TabsList className="w-full bg-gray-800 grid grid-cols-5">
                      <TabsTrigger value="queries">
                        <Search className="w-4 h-4" />
                      </TabsTrigger>
                      <TabsTrigger value="indexes">
                        <TrendingUp className="w-4 h-4" />
                      </TabsTrigger>
                      <TabsTrigger value="config">
                        <Settings className="w-4 h-4" />
                      </TabsTrigger>
                      <TabsTrigger value="patterns">
                        <AlertTriangle className="w-4 h-4" />
                      </TabsTrigger>
                      <TabsTrigger value="bottlenecks">
                        <Clock className="w-4 h-4" />
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="queries" className="mt-4 space-y-3">
                      {result.slowQueries.map((q, i) => (
                        <Card key={i} className="bg-dark-card border-gray-800">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <Badge className="bg-red-500/20 text-red-500">{q.executionTime}</Badge>
                              <Button size="sm" variant="ghost" onClick={() => copyToClipboard(q.optimizedQuery, "Optimized Query")}>
                                <Copy className="w-4 h-4" />
                              </Button>
                            </div>
                            <p className="text-gray-400 text-sm mb-2">{q.issue}</p>
                            <div className="space-y-2">
                              <div className="bg-red-500/10 rounded p-2">
                                <p className="text-xs text-red-400 mb-1">Original:</p>
                                <code className="text-xs text-gray-300 font-mono">{q.query}</code>
                              </div>
                              <ArrowRight className="w-4 h-4 text-green-500 mx-auto" />
                              <div className="bg-green-500/10 rounded p-2">
                                <p className="text-xs text-green-400 mb-1">Optimized ({q.improvement}):</p>
                                <code className="text-xs text-gray-300 font-mono">{q.optimizedQuery}</code>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </TabsContent>

                    <TabsContent value="indexes" className="mt-4 space-y-3">
                      {result.indexRecommendations.map((idx, i) => (
                        <Card key={i} className="bg-dark-card border-gray-800">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Badge className="bg-blue-500/20 text-blue-500">{idx.table}</Badge>
                                <Badge variant="outline" className="border-gray-600">{idx.type}</Badge>
                              </div>
                              <span className="text-green-500 text-sm">{idx.estimatedImprovement}</span>
                            </div>
                            <p className="text-gray-400 text-sm mb-2">{idx.reason}</p>
                            <div className="bg-blue-500/10 rounded p-2 flex items-center justify-between">
                              <code className="text-xs text-blue-400 font-mono">{idx.createStatement}</code>
                              <Button size="sm" variant="ghost" onClick={() => copyToClipboard(idx.createStatement, "Index")}>
                                <Copy className="w-4 h-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </TabsContent>

                    <TabsContent value="config" className="mt-4 space-y-3">
                      {result.configOptimizations.map((cfg, i) => (
                        <Card key={i} className="bg-dark-card border-gray-800">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-white font-mono">{cfg.parameter}</span>
                              <Badge className={getImpactColor(cfg.impact) + " bg-transparent"}>
                                {cfg.impact} impact
                              </Badge>
                            </div>
                            <p className="text-gray-400 text-sm mb-3">{cfg.reason}</p>
                            <div className="flex items-center gap-2">
                              <div className="bg-red-500/10 rounded px-3 py-1">
                                <span className="text-red-400 text-sm">{cfg.currentValue}</span>
                              </div>
                              <ArrowRight className="w-4 h-4 text-gray-500" />
                              <div className="bg-green-500/10 rounded px-3 py-1">
                                <span className="text-green-400 text-sm">{cfg.recommendedValue}</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </TabsContent>

                    <TabsContent value="patterns" className="mt-4 space-y-3">
                      {result.antiPatterns.map((ap, i) => (
                        <Card key={i} className={`bg-dark-card border ${getSeverityColor(ap.severity)}`}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-white font-medium">{ap.pattern}</span>
                              <Badge className={getSeverityColor(ap.severity)}>{ap.severity}</Badge>
                            </div>
                            <p className="text-gray-400 text-sm mb-2">Location: {ap.location}</p>
                            <div className="bg-green-500/10 border border-green-500/30 rounded p-2">
                              <p className="text-green-400 text-sm">{ap.fix}</p>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </TabsContent>

                    <TabsContent value="bottlenecks" className="mt-4 space-y-3">
                      {result.queryBottlenecks.map((bn, i) => (
                        <Card key={i} className="bg-dark-card border-gray-800">
                          <CardContent className="p-4">
                            <code className="text-xs text-gray-400 font-mono block mb-2">{bn.query}</code>
                            <div className="space-y-2">
                              <div className="flex items-start gap-2">
                                <AlertTriangle className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                                <p className="text-orange-400 text-sm">{bn.bottleneck}</p>
                              </div>
                              <div className="flex items-start gap-2">
                                <Clock className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
                                <p className="text-yellow-400 text-sm">{bn.prediction}</p>
                              </div>
                              <div className="flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                                <p className="text-green-400 text-sm">{bn.mitigation}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </TabsContent>
                  </Tabs>
                </>
              ) : (
                <Card className="bg-dark-card border-gray-800">
                  <CardContent className="p-12 text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Database className="w-8 h-8 text-emerald-400" />
                    </div>
                    <h3 className="text-lg font-medium text-white mb-2">AI DBA Assistant</h3>
                    <p className="text-gray-400 max-w-sm mx-auto mb-6">
                      Enterprise-grade database optimization powered by AI
                    </p>
                    <div className="grid grid-cols-2 gap-3 text-left max-w-sm mx-auto">
                      <div className="flex items-center gap-2 text-gray-400">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm">Query optimization</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm">Index analysis</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm">Config tuning</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm">Pattern detection</span>
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
