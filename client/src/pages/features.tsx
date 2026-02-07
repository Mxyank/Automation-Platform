import { Navigation } from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  Database,
  Container,
  Brain,
  GitBranch,
  Zap,
  Shield,
  Check,
  Clock,
  Rocket,
  Server,
  FileCode,
  Settings,
  BarChart3,
  Lock,
  Activity,
  Cpu,
  Globe,
  Sparkles,
  Terminal,
  Code,
  Webhook,
  Box,
  Puzzle,
  Cloud,
  Eye,
  Bell,
  Users,
  CreditCard,
  Layers
} from "lucide-react";
import { SiJenkins, SiAnsible, SiSonarqube, SiDocker, SiGithubactions } from "react-icons/si";

const implementedFeatures = [
  {
    title: "CRUD API Generator",
    description: "Generate complete REST APIs with Express, FastAPI, or NestJS. Includes authentication, validation, and Swagger documentation.",
    icon: Database,
    status: "live",
    gradient: "from-neon-cyan to-blue-500",
    highlights: ["Express/FastAPI/NestJS", "JWT Authentication", "Swagger Docs", "Database Integration"]
  },
  {
    title: "Dockerfile Generator",
    description: "Create optimized, production-ready Dockerfiles with multi-stage builds and best practices.",
    icon: Container,
    status: "live",
    gradient: "from-neon-green to-green-500",
    highlights: ["Multi-stage builds", "Production optimization", "Custom base images", "Environment configuration"]
  },
  {
    title: "Docker Compose Generator",
    description: "Generate complete docker-compose.yml files for multi-service applications.",
    icon: Box,
    status: "live",
    gradient: "from-blue-500 to-indigo-600",
    highlights: ["Multi-service setup", "Network configuration", "Volume management", "Environment variables"]
  },
  {
    title: "GitHub Actions CI/CD",
    description: "Create automated CI/CD pipelines for testing, building, and deploying your applications.",
    icon: GitBranch,
    status: "live",
    gradient: "from-purple-500 to-pink-500",
    highlights: ["Automated testing", "Build pipelines", "Deployment workflows", "Multi-environment support"]
  },
  {
    title: "Jenkins Pipeline Generator",
    description: "Generate comprehensive Jenkinsfiles with multi-stage pipelines for Node.js, Java, Python, and more.",
    icon: Settings,
    status: "live",
    gradient: "from-red-500 to-orange-500",
    highlights: ["Multi-stage pipelines", "Node.js/Java/Python", "Quality gates", "Deployment stages"]
  },
  {
    title: "Ansible Playbook Generator",
    description: "Create automation playbooks for server setup, web servers, databases, Docker, and security hardening.",
    icon: Terminal,
    status: "live",
    gradient: "from-orange-500 to-yellow-500",
    highlights: ["Server setup", "Database automation", "Docker setup", "Security hardening"]
  },
  {
    title: "SonarQube Setup Generator",
    description: "Generate installation scripts for Docker, Kubernetes, manual, ZIP, and RPM deployments.",
    icon: BarChart3,
    status: "live",
    gradient: "from-cyan-500 to-teal-500",
    highlights: ["Docker/K8s deployment", "Database integration", "Scanner configuration", "Quality profiles"]
  },
  {
    title: "AI DevOps Assistant",
    description: "Get AI-powered assistance for debugging, log analysis, YAML generation, and Dockerfile optimization.",
    icon: Brain,
    status: "live",
    gradient: "from-neon-purple to-purple-500",
    highlights: ["Log analysis", "YAML generation", "Dockerfile optimization", "DevOps guidance"]
  },
  {
    title: "Google OAuth Authentication",
    description: "Secure authentication with Google OAuth 2.0 integration for seamless sign-in experience.",
    icon: Shield,
    status: "live",
    gradient: "from-green-500 to-emerald-500",
    highlights: ["Google OAuth 2.0", "Session management", "Secure tokens", "Profile sync"]
  },
  {
    title: "Credit-based Billing",
    description: "Pay-per-use model with Razorpay integration for seamless payments in INR.",
    icon: CreditCard,
    status: "live",
    gradient: "from-indigo-500 to-violet-500",
    highlights: ["Pay-per-use", "Razorpay integration", "INR payments", "Usage tracking"]
  },
  {
    title: "Enterprise Security",
    description: "Multi-layer security with rate limiting, input validation, CSRF protection, and comprehensive logging.",
    icon: Lock,
    status: "live",
    gradient: "from-red-500 to-rose-500",
    highlights: ["Rate limiting", "Input validation", "CSRF protection", "Security headers"]
  },
  {
    title: "Prometheus Monitoring",
    description: "Built-in Prometheus metrics for performance monitoring and alerting.",
    icon: Activity,
    status: "live",
    gradient: "from-amber-500 to-orange-500",
    highlights: ["Custom metrics", "Performance tracking", "Alert integration", "Dashboard ready"]
  }
];

const upcomingFeatures = [
  {
    title: "Kubernetes Manifest Generator",
    description: "Generate complete Kubernetes deployments, services, ingress, and ConfigMaps.",
    icon: Cloud,
    eta: "Q1 2025",
    gradient: "from-blue-600 to-cyan-500"
  },
  {
    title: "Terraform Templates",
    description: "Infrastructure as Code templates for AWS, GCP, and Azure.",
    icon: Layers,
    eta: "Q1 2025",
    gradient: "from-purple-600 to-indigo-500"
  },
  {
    title: "Real-time Collaboration",
    description: "Work together with your team on DevOps configurations in real-time.",
    icon: Users,
    eta: "Q2 2025",
    gradient: "from-green-600 to-teal-500"
  },
  {
    title: "Webhook Integrations",
    description: "Connect with Slack, Discord, and other services for notifications.",
    icon: Webhook,
    eta: "Q2 2025",
    gradient: "from-pink-600 to-rose-500"
  },
  {
    title: "Custom Templates",
    description: "Create and save your own templates for reuse across projects.",
    icon: Puzzle,
    eta: "Q2 2025",
    gradient: "from-orange-600 to-amber-500"
  },
  {
    title: "GitLab CI/CD Generator",
    description: "Generate .gitlab-ci.yml pipelines for GitLab repositories.",
    icon: GitBranch,
    eta: "Q3 2025",
    gradient: "from-indigo-600 to-purple-500"
  },
  {
    title: "ArgoCD Integration",
    description: "GitOps continuous delivery for Kubernetes clusters.",
    icon: Rocket,
    eta: "Q3 2025",
    gradient: "from-teal-600 to-green-500"
  },
  {
    title: "AI Code Review",
    description: "Automated code review with AI-powered suggestions and security analysis.",
    icon: Eye,
    eta: "Q4 2025",
    gradient: "from-violet-600 to-purple-500"
  }
];

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-dark-bg">
      <Navigation />
      
      <div className="pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Badge className="bg-neon-cyan/20 text-neon-cyan border-neon-cyan/50 mb-4">
              <Sparkles className="w-3 h-3 mr-1" />
              Platform Features
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Everything You Need to Build & Deploy
            </h1>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Prometix provides a complete suite of DevOps tools powered by AI to accelerate your development workflow.
            </p>
          </motion.div>

          <section className="mb-20">
            <motion.div 
              className="flex items-center justify-between mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">Implemented Features</h2>
                <p className="text-gray-400">Currently available and ready to use</p>
              </div>
              <Badge className="bg-neon-green/20 text-neon-green border-neon-green/50">
                <Check className="w-3 h-3 mr-1" />
                {implementedFeatures.length} Features Live
              </Badge>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {implementedFeatures.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                >
                  <Card 
                    className="bg-dark-card border-gray-800 hover:border-gray-700 transition-all duration-300 h-full group"
                    data-testid={`feature-card-${feature.title.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className={`w-12 h-12 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                          <feature.icon className="w-6 h-6 text-white" />
                        </div>
                        <Badge className="bg-neon-green/20 text-neon-green border-neon-green/50 text-xs">
                          <Check className="w-3 h-3 mr-1" />
                          Live
                        </Badge>
                      </div>
                      <CardTitle className="text-white text-lg mt-4 group-hover:text-neon-cyan transition-colors">
                        {feature.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-400 text-sm mb-4">{feature.description}</p>
                      <div className="flex flex-wrap gap-2">
                        {feature.highlights.map((highlight, i) => (
                          <Badge 
                            key={i} 
                            variant="secondary" 
                            className="bg-gray-800 text-gray-300 text-xs"
                          >
                            {highlight}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </section>

          <section className="mb-16">
            <motion.div 
              className="flex items-center justify-between mb-8"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">Upcoming Features</h2>
                <p className="text-gray-400">Coming soon to Prometix</p>
              </div>
              <Badge className="bg-neon-purple/20 text-neon-purple border-neon-purple/50">
                <Clock className="w-3 h-3 mr-1" />
                In Development
              </Badge>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {upcomingFeatures.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                  viewport={{ once: true }}
                >
                  <Card 
                    className="bg-dark-card/50 border-gray-800 border-dashed hover:border-gray-700 transition-all duration-300 h-full group"
                    data-testid={`upcoming-feature-${feature.title.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className={`w-10 h-10 bg-gradient-to-br ${feature.gradient} rounded-lg flex items-center justify-center opacity-60 group-hover:opacity-100 transition-opacity duration-300`}>
                          <feature.icon className="w-5 h-5 text-white" />
                        </div>
                        <Badge className="bg-gray-800 text-gray-400 border-gray-700 text-xs">
                          <Clock className="w-3 h-3 mr-1" />
                          {feature.eta}
                        </Badge>
                      </div>
                      <CardTitle className="text-gray-300 text-base mt-3 group-hover:text-white transition-colors">
                        {feature.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-500 text-sm">{feature.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </section>

          <motion.div 
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <Card className="bg-gradient-to-r from-neon-cyan/10 to-neon-purple/10 border-gray-800 p-8">
              <h3 className="text-2xl font-bold text-white mb-4">Ready to Get Started?</h3>
              <p className="text-gray-400 mb-6 max-w-2xl mx-auto">
                Join thousands of developers using Prometix to automate their DevOps workflows and ship faster.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/auth">
                  <Button 
                    className="bg-white text-black hover:bg-gray-100 px-8 py-3"
                    data-testid="button-get-started"
                  >
                    <Rocket className="w-4 h-4 mr-2" />
                    Get Started Free
                  </Button>
                </Link>
                <Link href="/docs">
                  <Button 
                    variant="outline" 
                    className="border-gray-700 text-white hover:bg-gray-800 px-8 py-3"
                    data-testid="button-view-docs"
                  >
                    View Documentation
                  </Button>
                </Link>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
