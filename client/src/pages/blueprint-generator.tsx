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
import { useFeatures } from "@/hooks/use-features";
import { FeatureDisabledOverlay } from "@/components/feature-disabled-overlay";
import {
  Layers,
  Cloud,
  GitBranch,
  Shield,
  Loader2,
  Copy,
  Download,
  Sparkles,
  Server,
  Database,
  Lock,
  Rocket,
  FileCode,
  Network,
  CheckCircle
} from "lucide-react";
import { motion } from "framer-motion";
import { useUpgradeModal, UpgradeModal } from "@/components/upgrade-modal";

interface BlueprintResult {
  projectName: string;
  architecture: {
    overview: string;
    diagram: string;
    components: { name: string; type: string; description: string }[];
  };
  infrastructure: {
    resources: string;
    terraform: string;
    estimatedCost: string;
  };
  cicd: {
    pipeline: string;
    stages: string[];
  };
  security: {
    recommendations: string[];
    implementation: string;
  };
  deployment: {
    steps: string[];
    timeline: string;
  };
  summary: string;
}

export default function BlueprintGenerator() {
  const { toast } = useToast();
  const { showUpgradeModal, setShowUpgradeModal, checkForUpgrade } = useUpgradeModal();
  const { isEnabled } = useFeatures();
  const isFeatureEnabled = isEnabled('blueprint_generator');
  const [requirements, setRequirements] = useState("");
  const [projectType, setProjectType] = useState("web-app");
  const [cloudProvider, setCloudProvider] = useState("aws");
  const [scale, setScale] = useState("medium");
  const [result, setResult] = useState<BlueprintResult | null>(null);

  const generateMutation = useMutation({
    mutationFn: async (data: { requirements: string; projectType: string; cloudProvider: string; scale: string }) => {
      const response = await apiRequest("POST", "/api/ai/blueprint", data);
      return response.json();
    },
    onSuccess: (data) => {
      setResult(data.result);
      toast({
        title: "Blueprint Generated",
        description: `Complete architecture for ${data.result.projectName} is ready!`,
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
    if (!requirements.trim()) {
      toast({
        title: "Requirements Needed",
        description: "Please describe what you want to build.",
        variant: "destructive",
      });
      return;
    }
    generateMutation.mutate({
      requirements,
      projectType,
      cloudProvider,
      scale,
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

  return (
    <div className="relative min-h-screen bg-dark-bg">
      {!isFeatureEnabled && <FeatureDisabledOverlay featureName="Blueprint Generator" />}
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
              <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                <Layers className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">AI Blueprint Generator</h1>
                <p className="text-gray-400">Generate complete architecture from your requirements</p>
              </div>
            </div>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <Card className="bg-dark-card border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">Project Requirements</CardTitle>
                  <CardDescription>
                    Describe what you want to build and AI will generate a complete architecture
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-gray-300">Project Type</Label>
                      <Select value={projectType} onValueChange={setProjectType}>
                        <SelectTrigger className="bg-gray-900 border-gray-700 text-white" data-testid="select-project-type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="web-app">Web Application</SelectItem>
                          <SelectItem value="api">API Service</SelectItem>
                          <SelectItem value="ecommerce">E-commerce</SelectItem>
                          <SelectItem value="saas">SaaS Platform</SelectItem>
                          <SelectItem value="mobile-backend">Mobile Backend</SelectItem>
                          <SelectItem value="data-pipeline">Data Pipeline</SelectItem>
                          <SelectItem value="ml-platform">ML Platform</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-gray-300">Cloud Provider</Label>
                      <Select value={cloudProvider} onValueChange={setCloudProvider}>
                        <SelectTrigger className="bg-gray-900 border-gray-700 text-white" data-testid="select-cloud">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="aws">AWS</SelectItem>
                          <SelectItem value="gcp">Google Cloud</SelectItem>
                          <SelectItem value="azure">Azure</SelectItem>
                          <SelectItem value="multi-cloud">Multi-Cloud</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-gray-300">Scale</Label>
                      <Select value={scale} onValueChange={setScale}>
                        <SelectTrigger className="bg-gray-900 border-gray-700 text-white" data-testid="select-scale">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="small">Small ({"<"}1K users)</SelectItem>
                          <SelectItem value="medium">Medium (1K-100K)</SelectItem>
                          <SelectItem value="large">Large (100K-1M)</SelectItem>
                          <SelectItem value="enterprise">Enterprise (1M+)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-300">Describe Your Project</Label>
                    <Textarea
                      placeholder={`Example:
I want to build a scalable e-commerce platform in AWS with:
- User authentication and authorization
- Product catalog with search
- Shopping cart and checkout
- Payment processing with Stripe
- Order management
- Real-time inventory tracking
- Mobile app support
- Admin dashboard`}
                      value={requirements}
                      onChange={(e) => setRequirements(e.target.value)}
                      className="bg-gray-900 border-gray-700 text-white min-h-[250px]"
                      data-testid="textarea-requirements"
                    />
                  </div>

                  <Button
                    onClick={handleGenerate}
                    disabled={generateMutation.isPending}
                    className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white"
                    data-testid="button-generate"
                  >
                    {generateMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating Architecture...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate Blueprint
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-dark-card border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white text-lg">What You Get</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2 text-gray-400">
                      <Network className="w-4 h-4 text-indigo-500" />
                      <span className="text-sm">Architecture diagram</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                      <Server className="w-4 h-4 text-blue-500" />
                      <span className="text-sm">Infrastructure code</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                      <GitBranch className="w-4 h-4 text-green-500" />
                      <span className="text-sm">CI/CD pipeline</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                      <Shield className="w-4 h-4 text-red-500" />
                      <span className="text-sm">Security best practices</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                      <Rocket className="w-4 h-4 text-purple-500" />
                      <span className="text-sm">Deployment steps</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                      <Database className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm">Cost estimation</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              {result ? (
                <>
                  <Card className="bg-gradient-to-br from-indigo-900/30 to-purple-900/30 border-indigo-500/30">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-2xl font-bold text-white">{result.projectName}</h3>
                          <p className="text-gray-400">{result.summary}</p>
                        </div>
                        <Layers className="w-10 h-10 text-indigo-400" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                          <p className="text-gray-400 text-sm">Components</p>
                          <p className="text-2xl font-bold text-white">
                            {result.architecture.components.length}
                          </p>
                        </div>
                        <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                          <p className="text-gray-400 text-sm">Est. Cost</p>
                          <p className="text-2xl font-bold text-green-500">
                            {result.infrastructure.estimatedCost}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Tabs defaultValue="architecture" className="w-full">
                    <TabsList className="w-full bg-gray-800 grid grid-cols-5">
                      <TabsTrigger value="architecture">
                        <Network className="w-4 h-4" />
                      </TabsTrigger>
                      <TabsTrigger value="infra">
                        <Server className="w-4 h-4" />
                      </TabsTrigger>
                      <TabsTrigger value="cicd">
                        <GitBranch className="w-4 h-4" />
                      </TabsTrigger>
                      <TabsTrigger value="security">
                        <Shield className="w-4 h-4" />
                      </TabsTrigger>
                      <TabsTrigger value="deploy">
                        <Rocket className="w-4 h-4" />
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="architecture" className="mt-4 space-y-4">
                      <Card className="bg-dark-card border-gray-800">
                        <CardHeader>
                          <CardTitle className="text-white text-lg">Architecture Overview</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-gray-300 mb-4">{result.architecture.overview}</p>
                          <pre className="bg-gray-900 rounded-lg p-4 overflow-x-auto text-xs text-cyan-400 font-mono whitespace-pre">
                            {result.architecture.diagram}
                          </pre>
                        </CardContent>
                      </Card>

                      <div className="space-y-2">
                        <h4 className="text-white font-medium">Components</h4>
                        {result.architecture.components.map((comp, index) => (
                          <Card key={index} className="bg-dark-card border-gray-800">
                            <CardContent className="p-3">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className="border-indigo-500 text-indigo-400">
                                  {comp.type}
                                </Badge>
                                <span className="text-white font-medium">{comp.name}</span>
                              </div>
                              <p className="text-gray-400 text-sm">{comp.description}</p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </TabsContent>

                    <TabsContent value="infra" className="mt-4">
                      <Card className="bg-dark-card border-gray-800">
                        <CardHeader className="flex flex-row items-center justify-between">
                          <CardTitle className="text-white text-lg">Terraform/Infrastructure</CardTitle>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyToClipboard(result.infrastructure.terraform, "Terraform")}
                              className="border-gray-700"
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => downloadFile(result.infrastructure.terraform, "main.tf")}
                              className="border-gray-700"
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-gray-400 text-sm mb-4">{result.infrastructure.resources}</p>
                          <pre className="bg-gray-900 rounded-lg p-4 overflow-x-auto max-h-[300px] overflow-y-auto">
                            <code className="text-green-400 text-sm font-mono">
                              {result.infrastructure.terraform}
                            </code>
                          </pre>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="cicd" className="mt-4">
                      <Card className="bg-dark-card border-gray-800">
                        <CardHeader className="flex flex-row items-center justify-between">
                          <CardTitle className="text-white text-lg">CI/CD Pipeline</CardTitle>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyToClipboard(result.cicd.pipeline, "Pipeline")}
                              className="border-gray-700"
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-wrap gap-2 mb-4">
                            {result.cicd.stages.map((stage, index) => (
                              <Badge key={index} className="bg-blue-500/20 text-blue-400">
                                {index + 1}. {stage}
                              </Badge>
                            ))}
                          </div>
                          <pre className="bg-gray-900 rounded-lg p-4 overflow-x-auto max-h-[300px] overflow-y-auto">
                            <code className="text-yellow-400 text-sm font-mono">
                              {result.cicd.pipeline}
                            </code>
                          </pre>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="security" className="mt-4">
                      <Card className="bg-dark-card border-gray-800">
                        <CardHeader>
                          <CardTitle className="text-white text-lg">Security Best Practices</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-2">
                            {result.security.recommendations.map((rec, index) => (
                              <div key={index} className="flex items-start gap-2 p-3 bg-gray-800 rounded-lg">
                                <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                                <p className="text-gray-300 text-sm">{rec}</p>
                              </div>
                            ))}
                          </div>
                          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                            <h5 className="text-red-400 font-medium mb-2 flex items-center gap-2">
                              <Lock className="w-4 h-4" />
                              Security Implementation
                            </h5>
                            <pre className="text-gray-300 text-xs font-mono whitespace-pre-wrap">
                              {result.security.implementation}
                            </pre>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="deploy" className="mt-4">
                      <Card className="bg-dark-card border-gray-800">
                        <CardHeader>
                          <CardTitle className="text-white text-lg">Deployment Steps</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <p className="text-gray-400 text-sm">{result.deployment.timeline}</p>
                          <div className="space-y-3">
                            {result.deployment.steps.map((step, index) => (
                              <div key={index} className="flex items-start gap-3 p-3 bg-gray-800 rounded-lg">
                                <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0">
                                  {index + 1}
                                </div>
                                <p className="text-gray-300">{step}</p>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>
                </>
              ) : (
                <Card className="bg-dark-card border-gray-800">
                  <CardContent className="p-12 text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Layers className="w-8 h-8 text-indigo-400" />
                    </div>
                    <h3 className="text-lg font-medium text-white mb-2">Complete Architecture Blueprint</h3>
                    <p className="text-gray-400 max-w-sm mx-auto mb-6">
                      Describe your project and AI will generate a complete production-ready architecture
                    </p>
                    <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/30 rounded-lg p-4 text-left max-w-sm mx-auto">
                      <p className="text-indigo-400 font-medium mb-2">Perfect for:</p>
                      <ul className="text-gray-400 text-sm space-y-1">
                        <li>• Startups building MVPs</li>
                        <li>• Teams starting new projects</li>
                        <li>• Architects needing quick designs</li>
                        <li>• DevOps teams setting up infra</li>
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
