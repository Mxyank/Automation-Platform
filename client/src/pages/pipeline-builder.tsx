import { useState, useCallback } from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  ArrowRight,
  GitBranch,
  Play,
  Package,
  TestTube,
  Rocket,
  Shield,
  Bell,
  Trash2,
  Plus,
  GripVertical,
  Copy,
  Check,
  Download,
  Loader2,
  Code,
  Container,
  Cloud,
  FileCode
} from "lucide-react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { useFeatures } from "@/hooks/use-features";
import { FeatureDisabledOverlay } from "@/components/feature-disabled-overlay";

interface PipelineStage {
  id: string;
  name: string;
  type: string;
  icon: any;
  color: string;
  config: Record<string, string>;
}

const availableStages = [
  { type: "checkout", name: "Checkout Code", icon: GitBranch, color: "bg-blue-500", description: "Clone repository" },
  { type: "install", name: "Install Dependencies", icon: Package, color: "bg-purple-500", description: "npm/yarn install" },
  { type: "lint", name: "Lint Code", icon: Code, color: "bg-yellow-500", description: "ESLint/Prettier" },
  { type: "test", name: "Run Tests", icon: TestTube, color: "bg-green-500", description: "Unit & integration tests" },
  { type: "build", name: "Build Application", icon: FileCode, color: "bg-orange-500", description: "Compile & bundle" },
  { type: "security", name: "Security Scan", icon: Shield, color: "bg-red-500", description: "Vulnerability check" },
  { type: "docker", name: "Build Docker Image", icon: Container, color: "bg-cyan-500", description: "Containerize app" },
  { type: "deploy", name: "Deploy", icon: Rocket, color: "bg-pink-500", description: "Deploy to cloud" },
  { type: "notify", name: "Notification", icon: Bell, color: "bg-indigo-500", description: "Slack/Email alerts" },
];

export default function PipelineBuilder() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { isEnabled } = useFeatures();

  if (!isEnabled("cicd_generation")) {
    return <FeatureDisabledOverlay featureName="CI/CD Pipeline" />;
  }

  const [pipeline, setPipeline] = useState<PipelineStage[]>([
    { id: "1", type: "checkout", name: "Checkout Code", icon: GitBranch, color: "bg-blue-500", config: {} },
    { id: "2", type: "install", name: "Install Dependencies", icon: Package, color: "bg-purple-500", config: {} },
    { id: "3", type: "test", name: "Run Tests", icon: TestTube, color: "bg-green-500", config: {} },
  ]);
  const [generatedYaml, setGeneratedYaml] = useState("");
  const [copied, setCopied] = useState(false);
  const [outputFormat, setOutputFormat] = useState<"github" | "gitlab" | "jenkins">("github");

  const addStage = (stageType: typeof availableStages[0]) => {
    const newStage: PipelineStage = {
      id: Date.now().toString(),
      type: stageType.type,
      name: stageType.name,
      icon: stageType.icon,
      color: stageType.color,
      config: {},
    };
    setPipeline([...pipeline, newStage]);
    toast({ title: `Added ${stageType.name}` });
  };

  const removeStage = (id: string) => {
    setPipeline(pipeline.filter(s => s.id !== id));
  };

  const generatePipeline = () => {
    let yaml = "";

    if (outputFormat === "github") {
      yaml = `name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
${pipeline.map(stage => generateGitHubStep(stage)).join('\n')}
`;
    } else if (outputFormat === "gitlab") {
      yaml = `stages:
${pipeline.map(s => `  - ${s.type}`).join('\n')}

${pipeline.map(stage => generateGitLabJob(stage)).join('\n')}
`;
    } else {
      yaml = `pipeline {
    agent any
    
    stages {
${pipeline.map(stage => generateJenkinsStage(stage)).join('\n')}
    }
    
    post {
        always {
            cleanWs()
        }
        success {
            echo 'Pipeline completed successfully!'
        }
        failure {
            echo 'Pipeline failed!'
        }
    }
}
`;
    }

    setGeneratedYaml(yaml);
    toast({ title: "Pipeline Generated!", description: "Your CI/CD pipeline is ready." });
  };

  const generateGitHubStep = (stage: PipelineStage) => {
    const steps: Record<string, string> = {
      checkout: `      - name: Checkout Code
        uses: actions/checkout@v4`,
      install: `      - name: Install Dependencies
        run: npm ci`,
      lint: `      - name: Lint Code
        run: npm run lint`,
      test: `      - name: Run Tests
        run: npm test`,
      build: `      - name: Build Application
        run: npm run build`,
      security: `      - name: Security Scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: \${{ secrets.SNYK_TOKEN }}`,
      docker: `      - name: Build Docker Image
        run: docker build -t app:\${{ github.sha }} .`,
      deploy: `      - name: Deploy to Production
        run: |
          echo "Deploying application..."
          # Add deployment commands here`,
      notify: `      - name: Send Notification
        uses: 8398a7/action-slack@v3
        with:
          status: \${{ job.status }}
        if: always()`,
    };
    return steps[stage.type] || "";
  };

  const generateGitLabJob = (stage: PipelineStage) => {
    const jobs: Record<string, string> = {
      checkout: `checkout:
  stage: checkout
  script:
    - echo "Code checked out automatically"`,
      install: `install:
  stage: install
  script:
    - npm ci
  cache:
    paths:
      - node_modules/`,
      lint: `lint:
  stage: lint
  script:
    - npm run lint`,
      test: `test:
  stage: test
  script:
    - npm test
  coverage: '/Coverage: \\d+\\.\\d+%/'`,
      build: `build:
  stage: build
  script:
    - npm run build
  artifacts:
    paths:
      - dist/`,
      security: `security:
  stage: security
  script:
    - npm audit --audit-level=high`,
      docker: `docker:
  stage: docker
  script:
    - docker build -t $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA .
    - docker push $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA`,
      deploy: `deploy:
  stage: deploy
  script:
    - echo "Deploying to production..."
  only:
    - main`,
      notify: `notify:
  stage: notify
  script:
    - echo "Sending notification..."
  when: always`,
    };
    return jobs[stage.type] || "";
  };

  const generateJenkinsStage = (stage: PipelineStage) => {
    const stages: Record<string, string> = {
      checkout: `        stage('Checkout') {
            steps {
                checkout scm
            }
        }`,
      install: `        stage('Install Dependencies') {
            steps {
                sh 'npm ci'
            }
        }`,
      lint: `        stage('Lint') {
            steps {
                sh 'npm run lint'
            }
        }`,
      test: `        stage('Test') {
            steps {
                sh 'npm test'
            }
        }`,
      build: `        stage('Build') {
            steps {
                sh 'npm run build'
            }
        }`,
      security: `        stage('Security Scan') {
            steps {
                sh 'npm audit --audit-level=high'
            }
        }`,
      docker: `        stage('Docker Build') {
            steps {
                sh 'docker build -t app:\${BUILD_NUMBER} .'
            }
        }`,
      deploy: `        stage('Deploy') {
            steps {
                echo 'Deploying to production...'
            }
        }`,
      notify: `        stage('Notify') {
            steps {
                echo 'Sending notification...'
            }
        }`,
    };
    return stages[stage.type] || "";
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedYaml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Copied to clipboard!" });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-dark-bg text-white flex items-center justify-center">
        <Card className="p-8 text-center bg-dark-card border-dark-border">
          <GitBranch className="w-16 h-16 mx-auto mb-4 text-neon-cyan" />
          <h2 className="text-2xl font-bold mb-4">Sign In Required</h2>
          <p className="text-gray-400 mb-6">Please sign in to use Pipeline Builder.</p>
          <Link href="/auth">
            <Button className="bg-gradient-to-r from-cyan-600 to-blue-600">Sign In</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg text-white">
      <div className="sticky top-0 z-10 bg-dark-bg/80 backdrop-blur-md border-b border-dark-border">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-xl flex items-center justify-center">
                  <GitBranch className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">Visual Pipeline Builder</h1>
                  <p className="text-sm text-gray-400">Drag and drop to build CI/CD pipelines</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {["github", "gitlab", "jenkins"].map((format) => (
                <Button
                  key={format}
                  variant={outputFormat === format ? "default" : "outline"}
                  size="sm"
                  onClick={() => setOutputFormat(format as any)}
                  className={outputFormat === format ? "bg-neon-cyan text-dark-bg" : "border-gray-700"}
                  data-testid={`button-format-${format}`}
                >
                  {format === "github" ? "GitHub Actions" : format === "gitlab" ? "GitLab CI" : "Jenkins"}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          <Card className="bg-dark-card border-dark-border">
            <CardHeader>
              <CardTitle className="text-lg">Available Stages</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {availableStages.map((stage) => (
                <motion.button
                  key={stage.type}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => addStage(stage)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-colors text-left"
                  data-testid={`button-add-${stage.type}`}
                >
                  <div className={`w-8 h-8 ${stage.color} rounded-lg flex items-center justify-center`}>
                    <stage.icon className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-white text-sm">{stage.name}</div>
                    <div className="text-xs text-gray-400">{stage.description}</div>
                  </div>
                  <Plus className="w-4 h-4 text-gray-400" />
                </motion.button>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-dark-card border-dark-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Pipeline Stages</CardTitle>
                <Badge variant="secondary">{pipeline.length} stages</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {pipeline.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Play className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Add stages from the left panel</p>
                </div>
              ) : (
                <Reorder.Group axis="y" values={pipeline} onReorder={setPipeline} className="space-y-2">
                  {pipeline.map((stage, index) => (
                    <Reorder.Item key={stage.id} value={stage}>
                      <motion.div
                        layout
                        className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/50 border border-gray-700 cursor-move group"
                      >
                        <GripVertical className="w-4 h-4 text-gray-500" />
                        <div className={`w-8 h-8 ${stage.color} rounded-lg flex items-center justify-center`}>
                          <stage.icon className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-white text-sm">{stage.name}</div>
                          <div className="text-xs text-gray-400">Step {index + 1}</div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeStage(stage.id)}
                          className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-400 hover:bg-red-500/10"
                          data-testid={`button-remove-${stage.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </motion.div>
                    </Reorder.Item>
                  ))}
                </Reorder.Group>
              )}

              <Button
                onClick={generatePipeline}
                disabled={pipeline.length === 0}
                className="w-full mt-6 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700"
                data-testid="button-generate"
              >
                <Play className="w-4 h-4 mr-2" />
                Generate Pipeline
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-dark-card border-dark-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Generated YAML</CardTitle>
                {generatedYaml && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopy}
                    className="text-gray-400 hover:text-white"
                    data-testid="button-copy-yaml"
                  >
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {generatedYaml ? (
                <div className="bg-gray-900 rounded-lg p-4 overflow-auto max-h-[500px]">
                  <pre className="text-xs text-gray-300 whitespace-pre font-mono">
                    {generatedYaml}
                  </pre>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <Code className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Configure your pipeline and click "Generate"</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="mt-8 bg-gradient-to-r from-cyan-900/30 to-blue-900/30 border-cyan-500/30">
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-xl flex items-center justify-center">
                  <Rocket className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Ready to Deploy?</h3>
                  <p className="text-sm text-gray-400">Export your pipeline and integrate with your repository</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="border-cyan-500/50 text-cyan-500 hover:bg-cyan-500/10"
                  disabled={!generatedYaml}
                  onClick={handleCopy}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy YAML
                </Button>
                <Button
                  className="bg-gradient-to-r from-cyan-600 to-blue-600"
                  disabled={!generatedYaml}
                  onClick={() => {
                    const blob = new Blob([generatedYaml], { type: 'text/yaml' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = outputFormat === 'github' ? '.github/workflows/ci.yml' : outputFormat === 'gitlab' ? '.gitlab-ci.yml' : 'Jenkinsfile';
                    a.click();
                    toast({ title: "Downloaded!", description: "Pipeline file saved." });
                  }}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
