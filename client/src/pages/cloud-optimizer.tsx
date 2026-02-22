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
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useFeatures } from "@/hooks/use-features";
import { FeatureDisabledOverlay } from "@/components/feature-disabled-overlay";
import {
  DollarSign,
  TrendingDown,
  Cloud,
  Server,
  Loader2,
  ArrowDown,
  ArrowUp,
  Zap,
  Clock,
  PieChart,
  BarChart3,
  Lightbulb,
  Target,
  Scale,
  Sparkles
} from "lucide-react";
import { motion } from "framer-motion";
import { SiAmazonwebservices, SiGooglecloud } from "react-icons/si";
import { useUpgradeModal, UpgradeModal } from "@/components/upgrade-modal";

interface CostRecommendation {
  category: string;
  currentCost: string;
  projectedSaving: string;
  savingPercentage: number;
  recommendation: string;
  implementation: string;
  priority: "high" | "medium" | "low";
  effort: "easy" | "medium" | "hard";
}

interface OptimizationResult {
  currentMonthlySpend: string;
  projectedMonthlySpend: string;
  totalSavings: string;
  savingsPercentage: number;
  recommendations: CostRecommendation[];
  instanceOptimizations: {
    current: string;
    recommended: string;
    monthlySaving: string;
    reason: string;
  }[];
  spotInstanceOpportunities: {
    workload: string;
    currentCost: string;
    spotCost: string;
    saving: string;
  }[];
  autoscalingRules: {
    resource: string;
    rule: string;
    expectedImpact: string;
  }[];
  summary: string;
}

export default function CloudOptimizer() {
  const { toast } = useToast();
  const { showUpgradeModal, setShowUpgradeModal, checkForUpgrade } = useUpgradeModal();
  const { isEnabled } = useFeatures();
  const isFeatureEnabled = isEnabled('cloud_optimizer');
  const [cloudConfig, setCloudConfig] = useState("");
  const [currentSpend, setCurrentSpend] = useState("");
  const [provider, setProvider] = useState<"aws" | "gcp" | "azure" | "multi">("aws");
  const [result, setResult] = useState<OptimizationResult | null>(null);

  const optimizeMutation = useMutation({
    mutationFn: async (data: { config: string; currentSpend: string; provider: string }) => {
      const response = await apiRequest("POST", "/api/ai/cloud-optimize", data);
      return response.json();
    },
    onSuccess: (data) => {
      setResult(data.result);
      toast({
        title: "Optimization Complete",
        description: `Found potential savings of ${data.result.totalSavings}/month!`,
      });
    },
    onError: (error: Error) => {
      if (checkForUpgrade(error)) return;
      toast({
        title: "Optimization Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleOptimize = () => {
    if (!cloudConfig.trim()) {
      toast({
        title: "Configuration Required",
        description: "Please describe your cloud infrastructure or paste your config.",
        variant: "destructive",
      });
      return;
    }
    optimizeMutation.mutate({
      config: cloudConfig,
      currentSpend,
      provider,
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-500/20 text-red-500 border-red-500/50";
      case "medium": return "bg-yellow-500/20 text-yellow-500 border-yellow-500/50";
      case "low": return "bg-blue-500/20 text-blue-500 border-blue-500/50";
      default: return "bg-gray-500/20 text-gray-500";
    }
  };

  const getEffortBadge = (effort: string) => {
    switch (effort) {
      case "easy": return <Badge className="bg-green-500/20 text-green-500">Easy</Badge>;
      case "medium": return <Badge className="bg-yellow-500/20 text-yellow-500">Medium</Badge>;
      case "hard": return <Badge className="bg-red-500/20 text-red-500">Complex</Badge>;
      default: return null;
    }
  };

  const getProviderIcon = (p: string) => {
    switch (p) {
      case "aws": return <SiAmazonwebservices className="w-5 h-5" />;
      case "gcp": return <SiGooglecloud className="w-5 h-5" />;
      case "azure": return <Cloud className="w-5 h-5 text-blue-500" />;
      default: return <Cloud className="w-5 h-5" />;
    }
  };

  return (
    <div className="relative min-h-screen bg-dark-bg">
      {!isFeatureEnabled && <FeatureDisabledOverlay featureName="Cloud Cost Optimizer" />}
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
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Multi-Cloud Cost Optimizer</h1>
                <p className="text-gray-400">AI-powered cost reduction across AWS, GCP, and Azure</p>
              </div>
            </div>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <Card className="bg-dark-card border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">Cloud Configuration</CardTitle>
                  <CardDescription>
                    Describe your infrastructure or paste your cloud config for cost analysis
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-gray-300">Cloud Provider</Label>
                    <div className="grid grid-cols-4 gap-2">
                      {(["aws", "gcp", "azure", "multi"] as const).map((p) => (
                        <Button
                          key={p}
                          variant={provider === p ? "default" : "outline"}
                          onClick={() => setProvider(p)}
                          className={`flex items-center gap-2 ${provider === p ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'border-gray-700'}`}
                        >
                          {getProviderIcon(p)}
                          <span className="capitalize text-xs">{p === "multi" ? "All" : p.toUpperCase()}</span>
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-300">Current Monthly Spend (Optional)</Label>
                    <Input
                      placeholder="$5,000"
                      value={currentSpend}
                      onChange={(e) => setCurrentSpend(e.target.value)}
                      className="bg-gray-900 border-gray-700 text-white"
                      data-testid="input-current-spend"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-300">Infrastructure Details</Label>
                    <Textarea
                      placeholder={`Describe your cloud infrastructure:

Example:
- 10 x t3.large EC2 instances (always running)
- 2 x RDS db.r5.xlarge (Multi-AZ)
- 500GB S3 storage with 1M requests/month
- 3 x Lambda functions (10M invocations/month)
- CloudFront distribution (100GB/month)
- 5 x EKS worker nodes

Or paste your AWS Cost Explorer data, Terraform, etc.`}
                      value={cloudConfig}
                      onChange={(e) => setCloudConfig(e.target.value)}
                      className="bg-gray-900 border-gray-700 text-white font-mono min-h-[300px]"
                      data-testid="textarea-cloud-config"
                    />
                  </div>

                  <Button
                    onClick={handleOptimize}
                    disabled={optimizeMutation.isPending}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white"
                    data-testid="button-optimize"
                  >
                    {optimizeMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Analyzing Costs...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Optimize Costs
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-dark-card border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white text-lg">Optimization Categories</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2 text-gray-400">
                      <Server className="w-4 h-4 text-blue-500" />
                      <span className="text-sm">Right-sizing instances</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                      <Zap className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm">Spot instances</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                      <Scale className="w-4 h-4 text-purple-500" />
                      <span className="text-sm">Autoscaling rules</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                      <Clock className="w-4 h-4 text-orange-500" />
                      <span className="text-sm">Reserved capacity</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                      <TrendingDown className="w-4 h-4 text-green-500" />
                      <span className="text-sm">Unused resources</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                      <Target className="w-4 h-4 text-red-500" />
                      <span className="text-sm">Storage optimization</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              {result ? (
                <>
                  <Card className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 border-green-500/30">
                    <CardContent className="p-6">
                      <div className="grid grid-cols-3 gap-4 text-center mb-6">
                        <div>
                          <p className="text-gray-400 text-sm">Current Spend</p>
                          <p className="text-2xl font-bold text-white">{result.currentMonthlySpend}</p>
                          <p className="text-gray-500 text-xs">/month</p>
                        </div>
                        <div className="flex flex-col items-center justify-center">
                          <ArrowDown className="w-8 h-8 text-green-500 animate-bounce" />
                          <Badge className="bg-green-500/20 text-green-500 mt-1">
                            -{result.savingsPercentage}%
                          </Badge>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm">Projected</p>
                          <p className="text-2xl font-bold text-green-500">{result.projectedMonthlySpend}</p>
                          <p className="text-gray-500 text-xs">/month</p>
                        </div>
                      </div>
                      <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 text-center">
                        <p className="text-gray-400 text-sm mb-1">Potential Monthly Savings</p>
                        <p className="text-4xl font-bold text-green-500">{result.totalSavings}</p>
                      </div>
                      <p className="text-gray-400 text-sm mt-4 text-center">{result.summary}</p>
                    </CardContent>
                  </Card>

                  <Tabs defaultValue="recommendations" className="w-full">
                    <TabsList className="w-full bg-gray-800">
                      <TabsTrigger value="recommendations" className="flex-1">
                        <Lightbulb className="w-4 h-4 mr-2" />
                        Tips
                      </TabsTrigger>
                      <TabsTrigger value="instances" className="flex-1">
                        <Server className="w-4 h-4 mr-2" />
                        Instances
                      </TabsTrigger>
                      <TabsTrigger value="spot" className="flex-1">
                        <Zap className="w-4 h-4 mr-2" />
                        Spot
                      </TabsTrigger>
                      <TabsTrigger value="scaling" className="flex-1">
                        <Scale className="w-4 h-4 mr-2" />
                        Scaling
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="recommendations" className="mt-4 space-y-3 max-h-[400px] overflow-y-auto">
                      {result.recommendations.map((rec, index) => (
                        <Card key={index} className="bg-dark-card border-gray-800">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className={getPriorityColor(rec.priority)}>
                                  {rec.priority} priority
                                </Badge>
                                {getEffortBadge(rec.effort)}
                              </div>
                              <div className="text-right">
                                <p className="text-green-500 font-bold">{rec.projectedSaving}</p>
                                <p className="text-gray-500 text-xs">-{rec.savingPercentage}%</p>
                              </div>
                            </div>
                            <p className="text-white font-medium">{rec.category}</p>
                            <p className="text-gray-400 text-sm mt-1">{rec.recommendation}</p>
                            <div className="mt-2 bg-gray-800 rounded p-2">
                              <p className="text-neon-cyan text-xs font-mono">{rec.implementation}</p>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </TabsContent>

                    <TabsContent value="instances" className="mt-4 space-y-3 max-h-[400px] overflow-y-auto">
                      {result.instanceOptimizations.map((opt, index) => (
                        <Card key={index} className="bg-dark-card border-gray-800">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="border-gray-600 text-gray-400">
                                  {opt.current}
                                </Badge>
                                <ArrowDown className="w-4 h-4 text-green-500" />
                                <Badge className="bg-green-500/20 text-green-500">
                                  {opt.recommended}
                                </Badge>
                              </div>
                              <span className="text-green-500 font-bold">{opt.monthlySaving}/mo</span>
                            </div>
                            <p className="text-gray-400 text-sm">{opt.reason}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </TabsContent>

                    <TabsContent value="spot" className="mt-4 space-y-3 max-h-[400px] overflow-y-auto">
                      {result.spotInstanceOpportunities.map((spot, index) => (
                        <Card key={index} className="bg-dark-card border-gray-800">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-white font-medium">{spot.workload}</span>
                              <Badge className="bg-yellow-500/20 text-yellow-500">
                                Save {spot.saving}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-center mt-3">
                              <div className="bg-gray-800 rounded p-2">
                                <p className="text-gray-400 text-xs">On-Demand</p>
                                <p className="text-white font-medium">{spot.currentCost}</p>
                              </div>
                              <div className="bg-green-500/10 border border-green-500/30 rounded p-2">
                                <p className="text-green-400 text-xs">Spot Price</p>
                                <p className="text-green-500 font-medium">{spot.spotCost}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </TabsContent>

                    <TabsContent value="scaling" className="mt-4 space-y-3 max-h-[400px] overflow-y-auto">
                      {result.autoscalingRules.map((rule, index) => (
                        <Card key={index} className="bg-dark-card border-gray-800">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <Scale className="w-4 h-4 text-purple-500" />
                              <span className="text-white font-medium">{rule.resource}</span>
                            </div>
                            <div className="bg-gray-800 rounded p-3 mb-2">
                              <code className="text-purple-400 text-sm">{rule.rule}</code>
                            </div>
                            <p className="text-gray-400 text-sm">{rule.expectedImpact}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </TabsContent>
                  </Tabs>
                </>
              ) : (
                <Card className="bg-dark-card border-gray-800">
                  <CardContent className="p-12 text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <DollarSign className="w-8 h-8 text-green-400" />
                    </div>
                    <h3 className="text-lg font-medium text-white mb-2">Optimize Your Cloud Costs</h3>
                    <p className="text-gray-400 max-w-sm mx-auto mb-6">
                      AI analyzes your cloud usage and suggests ways to reduce costs across all providers
                    </p>
                    <div className="grid grid-cols-2 gap-4 text-left max-w-md mx-auto">
                      <div className="flex items-center gap-2 text-gray-400">
                        <Server className="w-4 h-4 text-blue-500" />
                        <span className="text-sm">Instance sizing</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400">
                        <Zap className="w-4 h-4 text-yellow-500" />
                        <span className="text-sm">Spot opportunities</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400">
                        <Scale className="w-4 h-4 text-purple-500" />
                        <span className="text-sm">Auto-scaling rules</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400">
                        <PieChart className="w-4 h-4 text-green-500" />
                        <span className="text-sm">Multi-cloud view</span>
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
