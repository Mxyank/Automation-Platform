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
  Rocket, 
  AlertTriangle, 
  DollarSign, 
  Scale, 
  Shield, 
  Loader2,
  CheckCircle,
  XCircle,
  Info,
  TrendingUp,
  Server,
  Cloud,
  Zap
} from "lucide-react";
import { motion } from "framer-motion";

interface SimulationResult {
  failures: { risk: string; severity: string; recommendation: string }[];
  costImpact: { current: string; projected: string; change: string; details: string };
  scalingNeeds: { recommendation: string; metrics: string[]; autoscaling: string };
  securityIssues: { issue: string; severity: string; fix: string }[];
  overallScore: number;
  deploymentReady: boolean;
  summary: string;
}

export default function DeploymentSimulator() {
  const { toast } = useToast();
  const [deploymentConfig, setDeploymentConfig] = useState("");
  const [targetEnvironment, setTargetEnvironment] = useState("production");
  const [cloudProvider, setCloudProvider] = useState("aws");
  const [applicationUrl, setApplicationUrl] = useState("");
  const [result, setResult] = useState<SimulationResult | null>(null);

  const simulateMutation = useMutation({
    mutationFn: async (data: { config: string; environment: string; provider: string; url: string }) => {
      const response = await apiRequest("POST", "/api/ai/deployment-simulate", data);
      return response.json();
    },
    onSuccess: (data) => {
      setResult(data.result);
      toast({
        title: "Simulation Complete",
        description: "AI has analyzed your deployment configuration.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Simulation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSimulate = () => {
    if (!deploymentConfig.trim()) {
      toast({
        title: "Configuration Required",
        description: "Please provide your deployment configuration or describe your application.",
        variant: "destructive",
      });
      return;
    }
    simulateMutation.mutate({
      config: deploymentConfig,
      environment: targetEnvironment,
      provider: cloudProvider,
      url: applicationUrl,
    });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "critical": return "text-red-500 bg-red-500/20";
      case "high": return "text-orange-500 bg-orange-500/20";
      case "medium": return "text-yellow-500 bg-yellow-500/20";
      case "low": return "text-blue-500 bg-blue-500/20";
      default: return "text-gray-500 bg-gray-500/20";
    }
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
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <Rocket className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">AI Deployment Simulator</h1>
                <p className="text-gray-400">Predict failures, costs, and security issues before deploying</p>
              </div>
            </div>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <Card className="bg-dark-card border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">Deployment Configuration</CardTitle>
                  <CardDescription>
                    Provide your deployment config, Kubernetes manifests, or describe your application
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-gray-300">Application URL (Optional)</Label>
                    <Input
                      placeholder="https://your-app.com"
                      value={applicationUrl}
                      onChange={(e) => setApplicationUrl(e.target.value)}
                      className="bg-gray-900 border-gray-700 text-white"
                      data-testid="input-app-url"
                    />
                    <p className="text-xs text-gray-500">Enter your app URL for live analysis</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-gray-300">Target Environment</Label>
                      <Select value={targetEnvironment} onValueChange={setTargetEnvironment}>
                        <SelectTrigger className="bg-gray-900 border-gray-700 text-white" data-testid="select-environment">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="development">Development</SelectItem>
                          <SelectItem value="staging">Staging</SelectItem>
                          <SelectItem value="production">Production</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-gray-300">Cloud Provider</Label>
                      <Select value={cloudProvider} onValueChange={setCloudProvider}>
                        <SelectTrigger className="bg-gray-900 border-gray-700 text-white" data-testid="select-provider">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="aws">AWS</SelectItem>
                          <SelectItem value="gcp">Google Cloud</SelectItem>
                          <SelectItem value="azure">Azure</SelectItem>
                          <SelectItem value="kubernetes">Kubernetes</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-300">Deployment Configuration</Label>
                    <Textarea
                      placeholder={`Paste your deployment config (YAML, JSON, Terraform) or describe your application:

Example:
- Node.js Express API with PostgreSQL
- 3 replicas, 512MB memory each
- Redis for caching
- Nginx ingress with SSL
- Expecting 1000 req/sec peak traffic`}
                      value={deploymentConfig}
                      onChange={(e) => setDeploymentConfig(e.target.value)}
                      className="bg-gray-900 border-gray-700 text-white font-mono min-h-[300px]"
                      data-testid="textarea-config"
                    />
                  </div>

                  <Button
                    onClick={handleSimulate}
                    disabled={simulateMutation.isPending}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                    data-testid="button-simulate"
                  >
                    {simulateMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Simulating Deployment...
                      </>
                    ) : (
                      <>
                        <Rocket className="w-4 h-4 mr-2" />
                        Simulate Deployment
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              {result ? (
                <>
                  <Card className={`bg-dark-card border-2 ${result.deploymentReady ? 'border-green-500/50' : 'border-yellow-500/50'}`}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          {result.deploymentReady ? (
                            <CheckCircle className="w-8 h-8 text-green-500" />
                          ) : (
                            <AlertTriangle className="w-8 h-8 text-yellow-500" />
                          )}
                          <div>
                            <h3 className="text-xl font-bold text-white">
                              {result.deploymentReady ? "Ready to Deploy" : "Review Recommended"}
                            </h3>
                            <p className="text-gray-400">Overall deployment score</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-4xl font-bold ${result.overallScore >= 80 ? 'text-green-500' : result.overallScore >= 60 ? 'text-yellow-500' : 'text-red-500'}`}>
                            {result.overallScore}%
                          </div>
                          <p className="text-gray-500 text-sm">Health Score</p>
                        </div>
                      </div>
                      <p className="text-gray-300">{result.summary}</p>
                    </CardContent>
                  </Card>

                  <Tabs defaultValue="failures" className="w-full">
                    <TabsList className="w-full bg-gray-800">
                      <TabsTrigger value="failures" className="flex-1 data-[state=active]:bg-red-500/20">
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        Failures
                      </TabsTrigger>
                      <TabsTrigger value="cost" className="flex-1 data-[state=active]:bg-green-500/20">
                        <DollarSign className="w-4 h-4 mr-2" />
                        Cost
                      </TabsTrigger>
                      <TabsTrigger value="scaling" className="flex-1 data-[state=active]:bg-blue-500/20">
                        <Scale className="w-4 h-4 mr-2" />
                        Scaling
                      </TabsTrigger>
                      <TabsTrigger value="security" className="flex-1 data-[state=active]:bg-purple-500/20">
                        <Shield className="w-4 h-4 mr-2" />
                        Security
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="failures" className="mt-4 space-y-3">
                      {result.failures.length === 0 ? (
                        <Card className="bg-dark-card border-gray-800">
                          <CardContent className="p-4 text-center">
                            <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                            <p className="text-gray-400">No potential failures detected</p>
                          </CardContent>
                        </Card>
                      ) : (
                        result.failures.map((failure, index) => (
                          <Card key={index} className="bg-dark-card border-gray-800">
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                <Badge className={getSeverityColor(failure.severity)}>
                                  {failure.severity}
                                </Badge>
                                <div>
                                  <p className="text-white font-medium">{failure.risk}</p>
                                  <p className="text-gray-400 text-sm mt-1">{failure.recommendation}</p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </TabsContent>

                    <TabsContent value="cost" className="mt-4">
                      <Card className="bg-dark-card border-gray-800">
                        <CardContent className="p-6 space-y-4">
                          <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                              <p className="text-gray-400 text-sm">Current</p>
                              <p className="text-2xl font-bold text-white">{result.costImpact.current}</p>
                            </div>
                            <div>
                              <p className="text-gray-400 text-sm">Projected</p>
                              <p className="text-2xl font-bold text-neon-cyan">{result.costImpact.projected}</p>
                            </div>
                            <div>
                              <p className="text-gray-400 text-sm">Change</p>
                              <p className={`text-2xl font-bold ${result.costImpact.change.startsWith('+') ? 'text-red-500' : 'text-green-500'}`}>
                                {result.costImpact.change}
                              </p>
                            </div>
                          </div>
                          <div className="border-t border-gray-700 pt-4">
                            <p className="text-gray-300">{result.costImpact.details}</p>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="scaling" className="mt-4">
                      <Card className="bg-dark-card border-gray-800">
                        <CardContent className="p-6 space-y-4">
                          <div className="flex items-center gap-2 mb-4">
                            <TrendingUp className="w-5 h-5 text-blue-500" />
                            <h4 className="text-white font-medium">Scaling Recommendations</h4>
                          </div>
                          <p className="text-gray-300">{result.scalingNeeds.recommendation}</p>
                          <div className="space-y-2">
                            <p className="text-gray-400 text-sm font-medium">Key Metrics to Monitor:</p>
                            <div className="flex flex-wrap gap-2">
                              {result.scalingNeeds.metrics.map((metric, index) => (
                                <Badge key={index} variant="outline" className="border-blue-500 text-blue-400">
                                  {metric}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mt-4">
                            <p className="text-blue-400 text-sm">{result.scalingNeeds.autoscaling}</p>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="security" className="mt-4 space-y-3">
                      {result.securityIssues.length === 0 ? (
                        <Card className="bg-dark-card border-gray-800">
                          <CardContent className="p-4 text-center">
                            <Shield className="w-8 h-8 text-green-500 mx-auto mb-2" />
                            <p className="text-gray-400">No security misconfigurations detected</p>
                          </CardContent>
                        </Card>
                      ) : (
                        result.securityIssues.map((issue, index) => (
                          <Card key={index} className="bg-dark-card border-gray-800">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between mb-2">
                                <Badge className={getSeverityColor(issue.severity)}>
                                  {issue.severity}
                                </Badge>
                              </div>
                              <p className="text-white font-medium">{issue.issue}</p>
                              <div className="mt-2 bg-gray-800 rounded p-3">
                                <p className="text-green-400 text-sm font-mono">{issue.fix}</p>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </TabsContent>
                  </Tabs>
                </>
              ) : (
                <Card className="bg-dark-card border-gray-800">
                  <CardContent className="p-12 text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Rocket className="w-8 h-8 text-purple-400" />
                    </div>
                    <h3 className="text-lg font-medium text-white mb-2">Simulate Your Deployment</h3>
                    <p className="text-gray-400 max-w-sm mx-auto">
                      AI will analyze your configuration and predict potential issues before you deploy
                    </p>
                    <div className="grid grid-cols-2 gap-4 mt-6 text-left max-w-md mx-auto">
                      <div className="flex items-center gap-2 text-gray-400">
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                        <span className="text-sm">Failure prediction</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400">
                        <DollarSign className="w-4 h-4 text-green-500" />
                        <span className="text-sm">Cost analysis</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400">
                        <Scale className="w-4 h-4 text-blue-500" />
                        <span className="text-sm">Scaling needs</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400">
                        <Shield className="w-4 h-4 text-purple-500" />
                        <span className="text-sm">Security check</span>
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
