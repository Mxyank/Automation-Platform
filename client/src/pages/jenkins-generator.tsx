import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/use-auth';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import {
  Wrench,
  Download,
  Copy,
  CheckCircle,
  AlertTriangle,
  Play,
  GitBranch,
  Package,
  Shield,
  Code2,
  Zap,
  Users,
  FileText
} from 'lucide-react';
import { useUpgradeModal, UpgradeModal } from "@/components/upgrade-modal";
import { useFeatures } from "@/hooks/use-features";
import { FeatureDisabledOverlay } from "@/components/feature-disabled-overlay";

interface JenkinsConfig {
  projectName: string;
  projectType: string;
  gitRepository: string;
  branch: string;
  buildTool: string;
  nodeVersion?: string;
  javaVersion?: string;
  pythonVersion?: string;
  testCommand: string;
  buildCommand: string;
  deploymentTarget: string;
  dockerEnabled: boolean;
  sonarEnabled: boolean;
  slackNotifications: boolean;
  emailNotifications: string;
  stages: string[];
  environmentVariables: { key: string; value: string }[];
}

export default function JenkinsGenerator() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { showUpgradeModal, setShowUpgradeModal, checkForUpgrade } = useUpgradeModal();
  const queryClient = useQueryClient();
  const { isEnabled } = useFeatures();

  if (!isEnabled("cicd_generation")) {
    return <FeatureDisabledOverlay featureName="CI/CD Pipeline" />;
  }
  const [config, setConfig] = useState<JenkinsConfig>({
    projectName: '',
    projectType: 'nodejs',
    gitRepository: '',
    branch: 'main',
    buildTool: 'npm',
    nodeVersion: '18',
    testCommand: 'npm test',
    buildCommand: 'npm run build',
    deploymentTarget: 'staging',
    dockerEnabled: false,
    sonarEnabled: false,
    slackNotifications: false,
    emailNotifications: '',
    stages: ['checkout', 'build', 'test'],
    environmentVariables: []
  });
  const [generatedScript, setGeneratedScript] = useState<string>('');
  const [activeTab, setActiveTab] = useState('config');

  const generateMutation = useMutation({
    mutationFn: async (config: JenkinsConfig) => {
      const response = await apiRequest('POST', '/api/jenkins/generate', config);
      return response.json();
    },
    onSuccess: (data) => {
      setGeneratedScript(data.script);
      setActiveTab('pipeline');
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/usage"] });
      toast({
        title: "Jenkins Pipeline Generated",
        description: "Your Jenkins pipeline has been generated successfully.",
      });
    },
    onError: (error: any) => {
      if (checkForUpgrade(error)) return;
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate Jenkins pipeline",
        variant: "destructive",
      });
    },
  });

  const handleGeneratePipeline = () => {
    if (!config.projectName || !config.gitRepository) {
      toast({
        title: "Missing Configuration",
        description: "Please provide project name and Git repository URL.",
        variant: "destructive",
      });
      return;
    }
    generateMutation.mutate(config);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedScript);
    toast({
      title: "Copied to Clipboard",
      description: "Jenkins pipeline copied to clipboard.",
    });
  };

  const downloadScript = () => {
    const blob = new Blob([generatedScript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Jenkinsfile-${config.projectName || 'pipeline'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const toggleStage = (stage: string) => {
    setConfig(prev => ({
      ...prev,
      stages: prev.stages.includes(stage)
        ? prev.stages.filter(s => s !== stage)
        : [...prev.stages, stage]
    }));
  };

  const addEnvironmentVariable = () => {
    setConfig(prev => ({
      ...prev,
      environmentVariables: [...prev.environmentVariables, { key: '', value: '' }]
    }));
  };

  const updateEnvironmentVariable = (index: number, field: 'key' | 'value', value: string) => {
    setConfig(prev => ({
      ...prev,
      environmentVariables: prev.environmentVariables.map((env, i) =>
        i === index ? { ...env, [field]: value } : env
      )
    }));
  };

  const removeEnvironmentVariable = (index: number) => {
    setConfig(prev => ({
      ...prev,
      environmentVariables: prev.environmentVariables.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="min-h-screen bg-dark-bg text-white p-6">
      <UpgradeModal open={showUpgradeModal} onOpenChange={setShowUpgradeModal} />
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg">
              <Wrench className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                Jenkins Pipeline Generator
              </h1>
              <p className="text-gray-400">Create production-ready CI/CD pipelines for your projects</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-dark-card border-dark-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Code2 className="h-5 w-5 text-blue-400" />
                  <div>
                    <p className="text-sm text-gray-400">Project Types</p>
                    <p className="text-lg font-semibold">8+</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-dark-card border-dark-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <GitBranch className="h-5 w-5 text-green-400" />
                  <div>
                    <p className="text-sm text-gray-400">Pipeline Stages</p>
                    <p className="text-lg font-semibold">15+</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-dark-card border-dark-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-purple-400" />
                  <div>
                    <p className="text-sm text-gray-400">Security Scans</p>
                    <p className="text-lg font-semibold">Built-in</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-dark-card border-dark-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-orange-400" />
                  <div>
                    <p className="text-sm text-gray-400">Docker Support</p>
                    <p className="text-lg font-semibold">Full</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-dark-card border border-dark-border">
            <TabsTrigger value="config" className="data-[state=active]:bg-blue-600">
              Configuration
            </TabsTrigger>
            <TabsTrigger value="pipeline" className="data-[state=active]:bg-blue-600">
              Generated Pipeline
            </TabsTrigger>
            <TabsTrigger value="examples" className="data-[state=active]:bg-blue-600">
              Examples
            </TabsTrigger>
          </TabsList>

          <TabsContent value="config">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Basic Configuration */}
              <Card className="bg-dark-card border-dark-border">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Basic Configuration
                  </CardTitle>
                  <CardDescription>
                    Configure your project basics and repository settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="projectName">Project Name</Label>
                    <Input
                      id="projectName"
                      value={config.projectName}
                      onChange={(e) => setConfig(prev => ({ ...prev, projectName: e.target.value }))}
                      placeholder="my-awesome-project"
                      className="bg-dark-input border-dark-border text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gitRepository">Git Repository URL</Label>
                    <Input
                      id="gitRepository"
                      value={config.gitRepository}
                      onChange={(e) => setConfig(prev => ({ ...prev, gitRepository: e.target.value }))}
                      placeholder="https://github.com/user/repo.git"
                      className="bg-dark-input border-dark-border text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="branch">Branch</Label>
                      <Input
                        id="branch"
                        value={config.branch}
                        onChange={(e) => setConfig(prev => ({ ...prev, branch: e.target.value }))}
                        className="bg-dark-input border-dark-border text-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="projectType">Project Type</Label>
                      <Select value={config.projectType} onValueChange={(value) => setConfig(prev => ({ ...prev, projectType: value }))}>
                        <SelectTrigger className="bg-dark-input border-dark-border text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-dark-card border-dark-border">
                          <SelectItem value="nodejs">Node.js</SelectItem>
                          <SelectItem value="java">Java</SelectItem>
                          <SelectItem value="python">Python</SelectItem>
                          <SelectItem value="dotnet">.NET</SelectItem>
                          <SelectItem value="go">Go</SelectItem>
                          <SelectItem value="php">PHP</SelectItem>
                          <SelectItem value="ruby">Ruby</SelectItem>
                          <SelectItem value="scala">Scala</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="buildTool">Build Tool</Label>
                    <Select value={config.buildTool} onValueChange={(value) => setConfig(prev => ({ ...prev, buildTool: value }))}>
                      <SelectTrigger className="bg-dark-input border-dark-border text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-dark-card border-dark-border">
                        {config.projectType === 'nodejs' && (
                          <>
                            <SelectItem value="npm">NPM</SelectItem>
                            <SelectItem value="yarn">Yarn</SelectItem>
                            <SelectItem value="pnpm">PNPM</SelectItem>
                          </>
                        )}
                        {config.projectType === 'java' && (
                          <>
                            <SelectItem value="maven">Maven</SelectItem>
                            <SelectItem value="gradle">Gradle</SelectItem>
                          </>
                        )}
                        {config.projectType === 'python' && (
                          <>
                            <SelectItem value="pip">Pip</SelectItem>
                            <SelectItem value="poetry">Poetry</SelectItem>
                            <SelectItem value="pipenv">Pipenv</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {config.projectType === 'nodejs' && (
                    <div className="space-y-2">
                      <Label htmlFor="nodeVersion">Node.js Version</Label>
                      <Select value={config.nodeVersion} onValueChange={(value) => setConfig(prev => ({ ...prev, nodeVersion: value }))}>
                        <SelectTrigger className="bg-dark-input border-dark-border text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-dark-card border-dark-border">
                          <SelectItem value="16">Node.js 16</SelectItem>
                          <SelectItem value="18">Node.js 18 LTS</SelectItem>
                          <SelectItem value="20">Node.js 20 LTS</SelectItem>
                          <SelectItem value="21">Node.js 21</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {config.projectType === 'java' && (
                    <div className="space-y-2">
                      <Label htmlFor="javaVersion">Java Version</Label>
                      <Select value={config.javaVersion} onValueChange={(value) => setConfig(prev => ({ ...prev, javaVersion: value }))}>
                        <SelectTrigger className="bg-dark-input border-dark-border text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-dark-card border-dark-border">
                          <SelectItem value="8">Java 8</SelectItem>
                          <SelectItem value="11">Java 11 LTS</SelectItem>
                          <SelectItem value="17">Java 17 LTS</SelectItem>
                          <SelectItem value="21">Java 21 LTS</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Build & Test Configuration */}
              <Card className="bg-dark-card border-dark-border">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Build & Test Configuration
                  </CardTitle>
                  <CardDescription>
                    Configure build and test commands for your project
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="testCommand">Test Command</Label>
                    <Input
                      id="testCommand"
                      value={config.testCommand}
                      onChange={(e) => setConfig(prev => ({ ...prev, testCommand: e.target.value }))}
                      className="bg-dark-input border-dark-border text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="buildCommand">Build Command</Label>
                    <Input
                      id="buildCommand"
                      value={config.buildCommand}
                      onChange={(e) => setConfig(prev => ({ ...prev, buildCommand: e.target.value }))}
                      className="bg-dark-input border-dark-border text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="deploymentTarget">Deployment Target</Label>
                    <Select value={config.deploymentTarget} onValueChange={(value) => setConfig(prev => ({ ...prev, deploymentTarget: value }))}>
                      <SelectTrigger className="bg-dark-input border-dark-border text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-dark-card border-dark-border">
                        <SelectItem value="staging">Staging</SelectItem>
                        <SelectItem value="production">Production</SelectItem>
                        <SelectItem value="both">Both</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label>Integration Options</Label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="dockerEnabled"
                          checked={config.dockerEnabled}
                          onCheckedChange={(checked) => setConfig(prev => ({ ...prev, dockerEnabled: !!checked }))}
                        />
                        <Label htmlFor="dockerEnabled" className="text-sm">Enable Docker build and deployment</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="sonarEnabled"
                          checked={config.sonarEnabled}
                          onCheckedChange={(checked) => setConfig(prev => ({ ...prev, sonarEnabled: !!checked }))}
                        />
                        <Label htmlFor="sonarEnabled" className="text-sm">Enable SonarQube code analysis</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="slackNotifications"
                          checked={config.slackNotifications}
                          onCheckedChange={(checked) => setConfig(prev => ({ ...prev, slackNotifications: !!checked }))}
                        />
                        <Label htmlFor="slackNotifications" className="text-sm">Enable Slack notifications</Label>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="emailNotifications">Email Notifications</Label>
                    <Input
                      id="emailNotifications"
                      value={config.emailNotifications}
                      onChange={(e) => setConfig(prev => ({ ...prev, emailNotifications: e.target.value }))}
                      placeholder="team@example.com"
                      className="bg-dark-input border-dark-border text-white"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Pipeline Stages */}
              <Card className="bg-dark-card border-dark-border">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <GitBranch className="h-5 w-5" />
                    Pipeline Stages
                  </CardTitle>
                  <CardDescription>
                    Select the stages to include in your pipeline
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: 'checkout', label: 'Checkout Code', color: 'bg-blue-500' },
                      { id: 'build', label: 'Build', color: 'bg-green-500' },
                      { id: 'test', label: 'Run Tests', color: 'bg-yellow-500' },
                      { id: 'lint', label: 'Code Linting', color: 'bg-purple-500' },
                      { id: 'security-scan', label: 'Security Scan', color: 'bg-red-500' },
                      { id: 'sonar-analysis', label: 'SonarQube Analysis', color: 'bg-orange-500' },
                      { id: 'docker-build', label: 'Docker Build', color: 'bg-cyan-500' },
                      { id: 'deploy-staging', label: 'Deploy Staging', color: 'bg-indigo-500' },
                      { id: 'integration-tests', label: 'Integration Tests', color: 'bg-pink-500' },
                      { id: 'deploy-production', label: 'Deploy Production', color: 'bg-emerald-500' },
                      { id: 'smoke-tests', label: 'Smoke Tests', color: 'bg-teal-500' },
                      { id: 'cleanup', label: 'Cleanup', color: 'bg-gray-500' }
                    ].map((stage) => (
                      <div key={stage.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={stage.id}
                          checked={config.stages.includes(stage.id)}
                          onCheckedChange={() => toggleStage(stage.id)}
                        />
                        <Label htmlFor={stage.id} className="text-sm flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${stage.color}`}></div>
                          {stage.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Environment Variables */}
              <Card className="bg-dark-card border-dark-border">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Code2 className="h-5 w-5" />
                    Environment Variables
                  </CardTitle>
                  <CardDescription>
                    Define environment variables for your pipeline
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {config.environmentVariables.map((env, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        placeholder="VARIABLE_NAME"
                        value={env.key}
                        onChange={(e) => updateEnvironmentVariable(index, 'key', e.target.value)}
                        className="bg-dark-input border-dark-border text-white flex-1"
                      />
                      <Input
                        placeholder="value"
                        value={env.value}
                        onChange={(e) => updateEnvironmentVariable(index, 'value', e.target.value)}
                        className="bg-dark-input border-dark-border text-white flex-1"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeEnvironmentVariable(index)}
                        className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    onClick={addEnvironmentVariable}
                    className="w-full border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white"
                  >
                    Add Environment Variable
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="mt-6 flex justify-center">
              <Button
                onClick={handleGeneratePipeline}
                disabled={generateMutation.isPending}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3 text-lg"
              >
                {generateMutation.isPending ? 'Generating...' : 'Generate Jenkins Pipeline'}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="pipeline">
            <Card className="bg-dark-card border-dark-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white">Generated Jenkins Pipeline</CardTitle>
                    <CardDescription>
                      Your production-ready Jenkinsfile is ready for deployment
                    </CardDescription>
                  </div>
                  {generatedScript && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={copyToClipboard}
                        className="border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white"
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                      </Button>
                      <Button
                        variant="outline"
                        onClick={downloadScript}
                        className="border-green-500 text-green-500 hover:bg-green-500 hover:text-white"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {generatedScript ? (
                  <ScrollArea className="h-96 w-full">
                    <pre className="bg-gray-900 p-4 rounded-lg text-sm text-gray-300 whitespace-pre-wrap">
                      {generatedScript}
                    </pre>
                  </ScrollArea>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <Wrench className="h-12 w-12 mx-auto mb-4 text-gray-600" />
                    <p>Configure your pipeline and click "Generate" to see the Jenkinsfile</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="examples">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-dark-card border-dark-border">
                <CardHeader>
                  <CardTitle className="text-white">Node.js Pipeline</CardTitle>
                  <CardDescription>
                    Complete CI/CD pipeline for Node.js applications
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-64 w-full">
                    <pre className="bg-gray-900 p-4 rounded-lg text-xs text-gray-300 whitespace-pre-wrap">
                      {`pipeline {
    agent any
    
    tools {
        nodejs '18'
    }
    
    stages {
        stage('Checkout') {
            steps {
                git branch: 'main', url: 'https://github.com/user/app.git'
            }
        }
        
        stage('Install Dependencies') {
            steps {
                sh 'npm ci'
            }
        }
        
        stage('Run Tests') {
            steps {
                sh 'npm test'
            }
        }
        
        stage('Build') {
            steps {
                sh 'npm run build'
            }
        }
        
        stage('Deploy') {
            steps {
                sh 'npm run deploy'
            }
        }
    }
}`}
                    </pre>
                  </ScrollArea>
                </CardContent>
              </Card>

              <Card className="bg-dark-card border-dark-border">
                <CardHeader>
                  <CardTitle className="text-white">Java Maven Pipeline</CardTitle>
                  <CardDescription>
                    Enterprise Java application pipeline with Maven
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-64 w-full">
                    <pre className="bg-gray-900 p-4 rounded-lg text-xs text-gray-300 whitespace-pre-wrap">
                      {`pipeline {
    agent any
    
    tools {
        maven 'Maven-3.8'
        jdk 'JDK-11'
    }
    
    stages {
        stage('Checkout') {
            steps {
                git branch: 'main', url: 'https://github.com/user/java-app.git'
            }
        }
        
        stage('Compile') {
            steps {
                sh 'mvn clean compile'
            }
        }
        
        stage('Test') {
            steps {
                sh 'mvn test'
            }
        }
        
        stage('Package') {
            steps {
                sh 'mvn package'
            }
        }
        
        stage('Deploy') {
            steps {
                sh 'mvn deploy'
            }
        }
    }
}`}
                    </pre>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}