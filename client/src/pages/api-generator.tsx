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
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, Zap, ArrowLeft } from "lucide-react";

interface ApiConfig {
  name: string;
  database: string;
  authentication: boolean;
  oauth: boolean;
  framework: string;
}

export default function ApiGenerator() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  
  const [config, setConfig] = useState<ApiConfig>({
    name: "",
    database: "postgresql",
    authentication: true,
    oauth: false,
    framework: "express",
  });
  
  const [generatedCode, setGeneratedCode] = useState<string>("");

  const generateMutation = useMutation({
    mutationFn: async (config: ApiConfig) => {
      const response = await apiRequest("POST", "/api/generate/crud-api", config);
      return response.json();
    },
    onSuccess: (data) => {
      setGeneratedCode(data.code);
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "API Generated Successfully!",
        description: "Your CRUD API has been generated and saved to your projects.",
      });
    },
    onError: (error: any) => {
      if (error.message.includes("402")) {
        toast({
          title: "Credits Required",
          description: "You need to purchase credits to use this feature.",
          variant: "destructive",
          action: (
            <Button 
              onClick={() => setLocation("/checkout/starter")}
              className="bg-neon-cyan text-dark-bg"
            >
              Buy Credits
            </Button>
          ),
        });
      } else {
        toast({
          title: "Generation Failed",
          description: error.message,
          variant: "destructive",
        });
      }
    },
  });

  const handleGenerate = () => {
    if (!config.name.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter a name for your API project.",
        variant: "destructive",
      });
      return;
    }
    generateMutation.mutate(config);
  };

  const updateConfig = (key: keyof ApiConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="min-h-screen bg-dark-bg">
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
              <div className="w-10 h-10 bg-gradient-to-br from-neon-cyan to-blue-500 rounded-lg flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">API Generator</h1>
                <p className="text-gray-400">Generate scalable CRUD APIs with authentication</p>
              </div>
            </div>

            <div className="bg-blue-500/20 border border-blue-500/50 rounded-lg p-4">
              <p className="text-blue-400 text-sm">
                <strong>Credits:</strong> {user?.credits || 0} remaining • This action costs 1 credit
              </p>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Configuration Form */}
            <div className="space-y-6">
              <Card className="bg-dark-card border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">API Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Project Name */}
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-gray-300">Project Name</Label>
                    <Input
                      id="name"
                      value={config.name}
                      onChange={(e) => updateConfig("name", e.target.value)}
                      placeholder="my-awesome-api"
                      className="bg-dark-bg border-gray-700 text-white focus:border-neon-cyan focus:ring-neon-cyan"
                    />
                  </div>

                  {/* Framework */}
                  <div className="space-y-2">
                    <Label className="text-gray-300">Framework</Label>
                    <Select value={config.framework} onValueChange={(value) => updateConfig("framework", value)}>
                      <SelectTrigger className="bg-dark-bg border-gray-700 text-white focus:border-neon-cyan">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-dark-card border-gray-700">
                        <SelectItem value="express">Express.js</SelectItem>
                        <SelectItem value="fastapi">FastAPI (Python)</SelectItem>
                        <SelectItem value="nestjs">NestJS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Database */}
                  <div className="space-y-2">
                    <Label className="text-gray-300">Database</Label>
                    <Select value={config.database} onValueChange={(value) => updateConfig("database", value)}>
                      <SelectTrigger className="bg-dark-bg border-gray-700 text-white focus:border-neon-cyan">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-dark-card border-gray-700">
                        <SelectItem value="postgresql">PostgreSQL</SelectItem>
                        <SelectItem value="mongodb">MongoDB</SelectItem>
                        <SelectItem value="mysql">MySQL</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Authentication Options */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="text-gray-300">JWT Authentication</Label>
                        <p className="text-sm text-gray-500">Include user registration and login endpoints</p>
                      </div>
                      <Switch
                        checked={config.authentication}
                        onCheckedChange={(checked) => updateConfig("authentication", checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="text-gray-300">OAuth Integration</Label>
                        <p className="text-sm text-gray-500">Add Google and GitHub OAuth providers</p>
                      </div>
                      <Switch
                        checked={config.oauth}
                        onCheckedChange={(checked) => updateConfig("oauth", checked)}
                      />
                    </div>
                  </div>

                  <Button
                    onClick={handleGenerate}
                    disabled={generateMutation.isPending || !config.name.trim()}
                    className="w-full bg-gradient-to-r from-neon-cyan to-neon-purple text-dark-bg font-semibold hover:opacity-90 transition-opacity duration-200"
                  >
                    {generateMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating API...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 mr-2" />
                        Generate CRUD API
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Features Preview */}
              <Card className="bg-dark-card border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">What You'll Get</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-neon-green rounded-full"></div>
                      <span className="text-gray-300">Complete CRUD endpoints (GET, POST, PUT, DELETE)</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-neon-green rounded-full"></div>
                      <span className="text-gray-300">Database schema and connections</span>
                    </li>
                    {config.authentication && (
                      <li className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-neon-cyan rounded-full"></div>
                        <span className="text-gray-300">JWT authentication middleware</span>
                      </li>
                    )}
                    <li className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-neon-purple rounded-full"></div>
                      <span className="text-gray-300">Error handling and validation</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-neon-purple rounded-full"></div>
                      <span className="text-gray-300">API documentation (Swagger)</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Code Preview */}
            <div>
              {generatedCode ? (
                <CodePreview
                  code={generatedCode}
                  filename={`${config.name || 'api'}.${config.framework === 'fastapi' ? 'py' : 'js'}`}
                  language={config.framework === 'fastapi' ? 'python' : 'javascript'}
                  copyable={true}
                />
              ) : (
                <Card className="bg-dark-card border-gray-800 h-96">
                  <CardContent className="flex items-center justify-center h-full">
                    <div className="text-center space-y-4">
                      <Zap className="w-12 h-12 text-gray-600 mx-auto" />
                      <p className="text-gray-400">
                        Configure your API settings and click "Generate" to see the code
                      </p>
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
