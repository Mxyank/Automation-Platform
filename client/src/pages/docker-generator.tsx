import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Navigation } from "@/components/navigation";
import { CodePreview } from "@/components/code-preview";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, Container, ArrowLeft, Plus, X } from "lucide-react";
import { useUpgradeModal, UpgradeModal } from "@/components/upgrade-modal";
import { useFeatures } from "@/hooks/use-features";
import { FeatureDisabledOverlay } from "@/components/feature-disabled-overlay";

interface DockerConfig {
  language: string;
  framework: string;
  port: number;
  baseImage?: string;
  envVars?: string[];
}

interface ComposeService {
  name: string;
  port: number;
  envFile?: string;
}

export default function DockerGenerator() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { showUpgradeModal, setShowUpgradeModal, checkForUpgrade } = useUpgradeModal();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const { isEnabled } = useFeatures();

  if (!isEnabled("docker_generation")) {
    return <FeatureDisabledOverlay featureName="Docker Setup" />;
  }

  const [dockerConfig, setDockerConfig] = useState<DockerConfig>({
    language: "javascript",
    framework: "express",
    port: 3000,
    baseImage: "",
    envVars: [],
  });

  const [composeServices, setComposeServices] = useState<ComposeService[]>([
    { name: "app", port: 3000 }
  ]);

  const [newEnvVar, setNewEnvVar] = useState("");
  const [generatedDockerfile, setGeneratedDockerfile] = useState("");
  const [generatedCompose, setGeneratedCompose] = useState("");

  const dockerfileMutation = useMutation({
    mutationFn: async (config: DockerConfig) => {
      const response = await apiRequest("POST", "/api/generate/dockerfile", config);
      return response.json();
    },
    onSuccess: (data) => {
      setGeneratedDockerfile(data.dockerfile);
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Dockerfile Generated!",
        description: "Your optimized Dockerfile has been created.",
      });
    },
    onError: (error: any) => {
      if (checkForUpgrade(error)) return;
      toast({
        title: "Generation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const composeMutation = useMutation({
    mutationFn: async (services: ComposeService[]) => {
      const response = await apiRequest("POST", "/api/generate/docker-compose", { services });
      return response.json();
    },
    onSuccess: (data) => {
      setGeneratedCompose(data.dockerCompose);
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Container Compose Generated!",
        description: "Your docker-compose.yml has been created.",
      });
    },
    onError: (error: any) => {
      if (checkForUpgrade(error)) return;
      toast({
        title: "Generation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateDockerConfig = (key: keyof DockerConfig, value: any) => {
    setDockerConfig(prev => ({ ...prev, [key]: value }));
  };

  const addEnvVar = () => {
    if (newEnvVar.trim() && !dockerConfig.envVars?.includes(newEnvVar.trim())) {
      updateDockerConfig("envVars", [...(dockerConfig.envVars || []), newEnvVar.trim()]);
      setNewEnvVar("");
    }
  };

  const removeEnvVar = (index: number) => {
    updateDockerConfig("envVars", dockerConfig.envVars?.filter((_, i) => i !== index) || []);
  };

  const addService = () => {
    setComposeServices(prev => [...prev, { name: `service-${prev.length + 1}`, port: 3000 + prev.length }]);
  };

  const updateService = (index: number, field: keyof ComposeService, value: any) => {
    setComposeServices(prev => prev.map((service, i) =>
      i === index ? { ...service, [field]: value } : service
    ));
  };

  const removeService = (index: number) => {
    setComposeServices(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen bg-dark-bg">
      <UpgradeModal open={showUpgradeModal} onOpenChange={setShowUpgradeModal} />
      <Navigation />

      <div className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <Button
              onClick={() => setLocation("/dashboard")}
              variant="ghost"
              className="text-gray-400 hover:text-white mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>

            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-neon-green to-green-500 rounded-lg flex items-center justify-center">
                <Container className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Container Generator</h1>
                <p className="text-gray-400">Generate Dockerfiles and docker-compose configurations</p>
              </div>
            </div>

            <div className="bg-blue-500/20 border border-blue-500/50 rounded-lg p-4">
              <p className="text-blue-400 text-sm">
                <strong>Credits:</strong> {user?.credits || 0} remaining • Each generation costs 1 credit
              </p>
            </div>
          </div>

          <Tabs defaultValue="dockerfile" className="space-y-6">
            <TabsList className="bg-dark-card border border-dark-border">
              <TabsTrigger
                value="dockerfile"
                className="data-[state=active]:bg-neon-green data-[state=active]:text-dark-bg"
              >
                Dockerfile
              </TabsTrigger>
              <TabsTrigger
                value="compose"
                className="data-[state=active]:bg-neon-green data-[state=active]:text-dark-bg"
              >
                Container Compose
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dockerfile">
              <div className="grid lg:grid-cols-2 gap-8">
                {/* Dockerfile Configuration */}
                <div className="space-y-6">
                  <Card className="bg-dark-card border-gray-800">
                    <CardHeader>
                      <CardTitle className="text-white">Dockerfile Configuration</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Language */}
                      <div className="space-y-2">
                        <Label className="text-gray-300">Language</Label>
                        <Select value={dockerConfig.language} onValueChange={(value) => updateDockerConfig("language", value)}>
                          <SelectTrigger className="bg-dark-bg border-gray-700 text-white focus:border-neon-cyan">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-dark-card border-gray-700">
                            <SelectItem value="javascript">JavaScript/Node.js</SelectItem>
                            <SelectItem value="python">Python</SelectItem>
                            <SelectItem value="java">Java</SelectItem>
                            <SelectItem value="go">Go</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Framework */}
                      <div className="space-y-2">
                        <Label className="text-gray-300">Framework</Label>
                        <Input
                          value={dockerConfig.framework}
                          onChange={(e) => updateDockerConfig("framework", e.target.value)}
                          placeholder="express, fastapi, spring-boot..."
                          className="bg-dark-bg border-gray-700 text-white focus:border-neon-cyan focus:ring-neon-cyan"
                        />
                      </div>

                      {/* Port */}
                      <div className="space-y-2">
                        <Label className="text-gray-300">Port</Label>
                        <Input
                          type="number"
                          value={dockerConfig.port}
                          onChange={(e) => updateDockerConfig("port", parseInt(e.target.value) || 3000)}
                          className="bg-dark-bg border-gray-700 text-white focus:border-neon-cyan focus:ring-neon-cyan"
                        />
                      </div>

                      {/* Base Image */}
                      <div className="space-y-2">
                        <Label className="text-gray-300">Base Image (Optional)</Label>
                        <Input
                          value={dockerConfig.baseImage || ""}
                          onChange={(e) => updateDockerConfig("baseImage", e.target.value)}
                          placeholder="node:18-alpine, python:3.11-slim..."
                          className="bg-dark-bg border-gray-700 text-white focus:border-neon-cyan focus:ring-neon-cyan"
                        />
                      </div>

                      {/* Environment Variables */}
                      <div className="space-y-2">
                        <Label className="text-gray-300">Environment Variables</Label>
                        <div className="flex space-x-2">
                          <Input
                            value={newEnvVar}
                            onChange={(e) => setNewEnvVar(e.target.value)}
                            placeholder="NODE_ENV=production"
                            className="bg-dark-bg border-gray-700 text-white focus:border-neon-cyan focus:ring-neon-cyan"
                            onKeyPress={(e) => e.key === 'Enter' && addEnvVar()}
                          />
                          <Button onClick={addEnvVar} size="sm" className="bg-neon-green text-dark-bg">
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>

                        {dockerConfig.envVars && dockerConfig.envVars.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {dockerConfig.envVars.map((envVar, index) => (
                              <Badge key={index} variant="secondary" className="bg-gray-700 text-gray-300">
                                {envVar}
                                <Button
                                  onClick={() => removeEnvVar(index)}
                                  size="sm"
                                  variant="ghost"
                                  className="ml-1 h-auto p-0 text-gray-400 hover:text-white"
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>

                      <Button
                        onClick={() => dockerfileMutation.mutate(dockerConfig)}
                        disabled={dockerfileMutation.isPending}
                        className="w-full bg-gradient-to-r from-neon-green to-green-500 text-white font-semibold hover:opacity-90 transition-opacity duration-200"
                      >
                        {dockerfileMutation.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Generating Dockerfile...
                          </>
                        ) : (
                          <>
                            <Container className="w-4 h-4 mr-2" />
                            Generate Dockerfile
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                {/* Dockerfile Preview */}
                <div>
                  {generatedDockerfile ? (
                    <CodePreview
                      code={generatedDockerfile}
                      filename="Dockerfile"
                      language="dockerfile"
                      copyable={true}
                    />
                  ) : (
                    <Card className="bg-dark-card border-gray-800 h-96">
                      <CardContent className="flex items-center justify-center h-full">
                        <div className="text-center space-y-4">
                          <Container className="w-12 h-12 text-gray-600 mx-auto" />
                          <p className="text-gray-400">
                            Configure your settings and generate a Dockerfile
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="compose">
              <div className="grid lg:grid-cols-2 gap-8">
                {/* Container Compose Configuration */}
                <div className="space-y-6">
                  <Card className="bg-dark-card border-gray-800">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center justify-between">
                        Container Compose Services
                        <Button onClick={addService} size="sm" className="bg-neon-green text-dark-bg">
                          <Plus className="w-4 h-4 mr-1" />
                          Add Service
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {composeServices.map((service, index) => (
                        <div key={index} className="border border-gray-700 rounded-lg p-4 space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="text-white font-medium">Service {index + 1}</h4>
                            {composeServices.length > 1 && (
                              <Button
                                onClick={() => removeService(index)}
                                size="sm"
                                variant="ghost"
                                className="text-red-400 hover:text-red-300"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-gray-300">Service Name</Label>
                              <Input
                                value={service.name}
                                onChange={(e) => updateService(index, "name", e.target.value)}
                                className="bg-dark-bg border-gray-700 text-white focus:border-neon-cyan"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label className="text-gray-300">Port</Label>
                              <Input
                                type="number"
                                value={service.port}
                                onChange={(e) => updateService(index, "port", parseInt(e.target.value) || 3000)}
                                className="bg-dark-bg border-gray-700 text-white focus:border-neon-cyan"
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-gray-300">Environment File (Optional)</Label>
                            <Input
                              value={service.envFile || ""}
                              onChange={(e) => updateService(index, "envFile", e.target.value)}
                              placeholder=".env"
                              className="bg-dark-bg border-gray-700 text-white focus:border-neon-cyan"
                            />
                          </div>
                        </div>
                      ))}

                      <Button
                        onClick={() => composeMutation.mutate(composeServices)}
                        disabled={composeMutation.isPending}
                        className="w-full bg-gradient-to-r from-neon-green to-green-500 text-white font-semibold hover:opacity-90 transition-opacity duration-200"
                      >
                        {composeMutation.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Generating Compose...
                          </>
                        ) : (
                          <>
                            <Container className="w-4 h-4 mr-2" />
                            Generate Container Compose
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                {/* Container Compose Preview */}
                <div>
                  {generatedCompose ? (
                    <CodePreview
                      code={generatedCompose}
                      filename="docker-compose.yml"
                      language="yaml"
                      copyable={true}
                    />
                  ) : (
                    <Card className="bg-dark-card border-gray-800 h-96">
                      <CardContent className="flex items-center justify-center h-full">
                        <div className="text-center space-y-4">
                          <Container className="w-12 h-12 text-gray-600 mx-auto" />
                          <p className="text-gray-400">
                            Configure your services and generate docker-compose.yml
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
