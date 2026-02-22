import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CustomAd } from "@/components/custom-ad";

interface SiteSetting {
  id: number;
  key: string;
  value: boolean;
  stringValue?: string;
  numberValue?: number;
  label: string;
  description?: string;
}
import {
  Database,
  Container,
  Brain,
  Code,
  GitBranch,
  Zap,
  Check,
  Star,
  Crown,
  Sparkles,
  CreditCard,
  ArrowRight,
  Shield,
  Clock,
  Users,
  Rocket,
  Tag,
  Gift,
  Flame,
  Github,
  Twitter,
  Linkedin,
  Copy,
  Play,
  Cloud,
  Globe,
  Layers,
  Settings,
  Download,
  Terminal,
  Award,
  Timer,
  TrendingUp,
  DollarSign,
  ChevronRight,
  BookOpen,
  Cpu,
  Server,
  Lock,
  BarChart3,
  Activity,
  MousePointer,
  Webhook,
  FileCode,
  Box,
  Puzzle,
  CheckCircle,
  XCircle,
  AlertTriangle
} from "lucide-react";

const codeExamples = {
  quickStart: `// Get started in seconds
import { DevOpsCloud } from '@devopscloud/sdk';

const client = new DevOpsCloud({
  apiKey: process.env.DEVOPS_API_KEY
});

// Generate a complete REST API
const api = await client.generateAPI({
  name: 'user-service',
  database: 'postgresql',
  auth: 'jwt',
  endpoints: ['users', 'posts', 'comments']
});

console.log('API generated:', api.url);`,

  apiGeneration: `// API Generation with DevOpsCloud
const apiConfig = {
  name: 'e-commerce-api',
  framework: 'express',
  database: {
    type: 'postgresql',
    schema: {
      users: ['id', 'email', 'password'],
      products: ['id', 'name', 'price', 'stock'],
      orders: ['id', 'userId', 'productId', 'quantity']
    }
  },
  features: {
    authentication: 'jwt',
    validation: 'zod',
    swagger: true,
    rateLimit: true
  }
};

const result = await client.generateAPI(apiConfig);
// Complete API with auth, validation, and docs
// Ready in 30 seconds!`,

  dockerGeneration: `// Container Generation
const containerConfig = {
  language: 'nodejs',
  version: '18',
  database: 'postgres:15',
  redis: true,
  environment: 'production',
  optimization: 'multi-stage'
};

await client.generateContainer(containerConfig);

// Generated files:
// - Dockerfile (optimized)
// - docker-compose.yml
// - .dockerignore
// - nginx.conf`,

  cicdGeneration: `// CI/CD Pipeline Generation
const pipelineConfig = {
  framework: 'github-actions',
  stages: ['test', 'build', 'deploy'],
  deployment: {
    platform: 'aws',
    environment: ['staging', 'production']
  },
  features: {
    caching: true,
    parallel: true,
    notifications: 'slack'
  }
};

await client.generatePipeline(pipelineConfig);
// Complete CI/CD with testing, building, 
// and deployment to AWS`,

  aiAssistant: `// AI-Powered DevOps Assistant
import { AIAssistant } from '@devopscloud/ai';

const assistant = new AIAssistant();

// Analyze error logs
const solution = await assistant.analyzeError(errorLog);
console.log(solution.recommendations);

// Generate infrastructure code
const terraform = await assistant.generateTerraform({
  provider: 'aws',
  services: ['ec2', 'rds', 'elasticache']
});

// Natural language to YAML
const k8s = await assistant.textToYAML(
  "Create a deployment with 3 replicas running nginx"
);`
};

interface CodeBlockProps {
  code: string;
  title: string;
  language?: string;
  className?: string;
  isActive?: boolean;
}

// Enhanced Code Preview Component with Typing Animation
const CodeBlock = ({ code, title, language = "javascript", className = "", isActive = false }: CodeBlockProps) => {
  const [copied, setCopied] = useState(false);
  const [displayedCode, setDisplayedCode] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Typing animation effect for Quick Start tab
  useEffect(() => {
    if (title === 'quickStart.js' && isActive) { // Only type if it's the active quickStart tab
      setIsTyping(true);
      setDisplayedCode('');

      const startDelay = setTimeout(() => {
        let currentIndex = 0;
        const typingInterval = setInterval(() => {
          if (currentIndex < code.length) {
            setDisplayedCode(code.substring(0, currentIndex + 1));
            currentIndex++;
          } else {
            setIsTyping(false);
            clearInterval(typingInterval);
          }
        }, 25);

        return () => clearInterval(typingInterval);
      }, 800);

      return () => {
        clearTimeout(startDelay);
      };
    } else {
      setDisplayedCode(code);
      setIsTyping(false);
    }
  }, [code, title, isActive]);

  return (
    <div className={`bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden backdrop-blur-sm ${className}`}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
        <div className="flex items-center space-x-2">
          <div className="flex space-x-1.5">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          </div>
          <span className="text-sm text-gray-400 font-mono">{title}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="text-gray-400 hover:text-white h-8 w-8 p-0"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        </Button>
      </div>
      <div className="p-4 overflow-x-auto">
        <pre className="text-sm text-gray-300">
          <code className={`language-${language}`}>
            {displayedCode}
            {isTyping && <span className="animate-pulse">|</span>}
          </code>
        </pre>
      </div>
    </div>
  );
};

export default function LandingPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { scrollYProgress, scrollY } = useScroll();

  const { data: settings } = useQuery<SiteSetting[]>({
    queryKey: ['/api/site-settings'],
  });

  const getSetting = (key: string) => settings?.find(s => s.key === key);
  const isSaleActive = getSetting('sale_active')?.value || false;
  const salePercentage = getSetting('sale_percentage')?.numberValue || 20;
  const saleDescription = `${salePercentage}% DISCOUNT ACTIVE!`;
  const promoBanner = getSetting('promo_banner_text')?.stringValue || '';
  const isPromoActive = getSetting('promo_banner_active')?.value || false;
  const isProductHuntLive = true;

  const [activeCodeExample, setActiveCodeExample] = useState("quickStart");

  // Enhanced parallax effects
  const y1 = useTransform(scrollY, [0, 500], [0, 150]);
  const y2 = useTransform(scrollY, [0, 500], [0, -100]);
  const opacity1 = useTransform(scrollY, [0, 300], [1, 0]);

  const handleGetStarted = () => {
    if (user) {
      setLocation("/dashboard");
    } else {
      setLocation("/auth");
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg text-white">
      <Navigation />

      {/* Dynamic Promotion Banner */}
      <AnimatePresence>
        {isPromoActive && promoBanner && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-center py-2 text-sm font-medium z-[60] relative"
          >
            <div className="flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4" />
              {promoBanner}
              <Sparkles className="w-4 h-4" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sale Notification */}
      <AnimatePresence>
        {isSaleActive && (
          <motion.div
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="fixed bottom-6 right-6 z-50 max-w-sm pointer-events-none"
          >
            <div className="bg-dark-card border-2 border-neon-purple p-4 rounded-xl shadow-2xl pointer-events-auto">
              <div className="flex items-start gap-3">
                <div className="bg-neon-purple/20 p-2 rounded-lg">
                  <Flame className="w-6 h-6 text-neon-purple" />
                </div>
                <div>
                  <h4 className="text-white font-bold">{saleDescription}</h4>
                  <p className="text-gray-400 text-sm mt-1">
                    Get <span className="text-neon-purple font-bold">{salePercentage}% OFF</span> on all credit packs for a limited time!
                  </p>
                  <Button
                    className="mt-3 w-full bg-neon-purple hover:bg-neon-purple/80 text-white text-xs h-8"
                    onClick={() => setLocation('/pricing')}
                  >
                    Claim Discount <ArrowRight className="w-3 h-3 ml-2" />
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Product Hunt Badge - Fixed Position */}
      {isProductHuntLive && (
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          className="fixed right-4 bottom-8 z-50"
          data-testid="producthunt-badge"
        >
          <a
            href="https://www.producthunt.com/products/prometix?embed=true&utm_source=badge-featured&utm_medium=badge&utm_campaign=badge-prometix"
            target="_blank"
            rel="noopener noreferrer"
            className="block hover:scale-105 transition-transform"
          >
            <img
              src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1075871&theme=light&t=1770545577109"
              alt="Prometix - Ship faster. Break nothing. | Product Hunt"
              width="250"
              height="54"
              className="w-[200px] sm:w-[250px]"
            />
          </a>
        </motion.div>
      )}

      {/* Hero Section - Appwrite/Supabase Inspired */}
      <section className="relative min-h-screen flex items-center overflow-hidden pt-[100px]">
        {/* Enhanced Grid Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-dark-bg via-transparent to-dark-bg"></div>
          <motion.div
            className="absolute inset-0"
            style={{ y: y1, opacity: opacity1 }}
          >
            <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-neon-cyan/5 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-neon-purple/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
          </motion.div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid lg:grid-cols-2 gap-16 items-center py-[100px]">
            <motion.div
              className="space-y-8 text-center lg:text-left"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              {/* Status Badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="inline-flex"
              >
                <div className="inline-flex items-center space-x-2 bg-gray-900/50 border border-gray-800 rounded-full px-4 py-2 backdrop-blur-sm">
                  <div className="relative">
                    <div className="w-2 h-2 bg-neon-green rounded-full animate-pulse"></div>
                    <div className="absolute inset-0 w-2 h-2 bg-neon-green rounded-full animate-ping"></div>
                  </div>
                  <span className="text-sm font-medium text-gray-300">Trusted by 10,000+ developers</span>
                </div>
              </motion.div>

              <div className="space-y-6">
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-[0.9] tracking-tight">
                  Build backends and DevOps
                  <br />
                  <span className="bg-gradient-to-r from-neon-cyan via-neon-green to-neon-purple bg-clip-text text-transparent">
                    ship faster
                  </span>
                </h1>
                <p className="text-xl text-gray-400 leading-relaxed max-w-xl">
                  Generate complete REST APIs, Docker containers, and CI/CD pipelines in 30 seconds.
                  AI-powered DevOps platform for modern developers.
                </p>
              </div>

              {/* Stats */}
              <motion.div
                className="grid grid-cols-3 gap-6 py-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <div className="text-center">
                  <div className="text-3xl font-bold text-neon-cyan">99%</div>
                  <div className="text-sm text-gray-400">Time Saved</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-neon-green">5min</div>
                  <div className="text-sm text-gray-400">Setup Time</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-neon-purple">1000+</div>
                  <div className="text-sm text-gray-400">APIs Created</div>
                </div>
              </motion.div>

              <motion.div
                className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Button
                  onClick={handleGetStarted}
                  className="group bg-white text-black hover:bg-gray-100 px-8 py-3 rounded-lg font-medium transition-all duration-200 hover:scale-[1.02]"
                >
                  Get started for free
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Button>

                <Button
                  variant="outline"
                  onClick={() => window.open("https://github.com/Mxyank/Automation-Platform", "_blank")}
                  className="border-gray-700 text-white hover:border-gray-600 px-8 py-3 rounded-lg font-medium transition-all duration-200"
                >
                  <Github className="mr-2 w-4 h-4" />
                  Star on GitHub
                </Button>
              </motion.div>

              <motion.div
                className="flex items-center justify-center lg:justify-start space-x-6 text-sm text-gray-500"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <span>✦ No credit card required</span>
                <span>✦ 5 free credits</span>
                <span>✦ Deploy anywhere</span>
              </motion.div>
            </motion.div>

            {/* Interactive Code Showcase */}
            <motion.div
              className="relative"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              style={{ y: y2 }}
            >
              <div className="space-y-4">
                {/* Tab Navigation */}
                <div className="flex space-x-1 bg-gray-900/50 backdrop-blur-sm rounded-lg p-1 border border-gray-800">
                  <button
                    onClick={() => setActiveCodeExample("quickStart")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeCodeExample === "quickStart"
                      ? "bg-neon-purple text-white shadow-lg shadow-neon-purple/20"
                      : "text-gray-400 hover:text-white hover:bg-gray-800"
                      }`}
                  >
                    Quick Start
                  </button>
                  <button
                    onClick={() => setActiveCodeExample("apiGeneration")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeCodeExample === "apiGeneration"
                      ? "bg-neon-purple text-white shadow-lg shadow-neon-purple/20"
                      : "text-gray-400 hover:text-white hover:bg-gray-800"
                      }`}
                  >
                    API Generation
                  </button>
                  <button
                    onClick={() => setActiveCodeExample("dockerGeneration")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeCodeExample === "dockerGeneration"
                      ? "bg-neon-purple text-white shadow-lg shadow-neon-purple/20"
                      : "text-gray-400 hover:text-white hover:bg-gray-800"
                      }`}
                  >
                    Docker
                  </button>
                  <button
                    onClick={() => setActiveCodeExample("cicdGeneration")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeCodeExample === "cicdGeneration"
                      ? "bg-neon-purple text-white shadow-lg shadow-neon-purple/20"
                      : "text-gray-400 hover:text-white hover:bg-gray-800"
                      }`}
                  >
                    CI/CD
                  </button>
                  <button
                    onClick={() => setActiveCodeExample("aiAssistant")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeCodeExample === "aiAssistant"
                      ? "bg-neon-purple text-white shadow-lg shadow-neon-purple/20"
                      : "text-gray-400 hover:text-white hover:bg-gray-800"
                      }`}
                  >
                    AI Assistant
                  </button>
                </div>

                {/* Code Block with Animation */}
                <div className="relative min-h-[300px]">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeCodeExample}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <CodeBlock
                        code={codeExamples[activeCodeExample as keyof typeof codeExamples]}
                        title={`${activeCodeExample}.js`}
                        language="javascript"
                        isActive={true}
                      />
                    </motion.div>
                  </AnimatePresence>
                </div>
                {/* Feature Tags */}
                <motion.div
                  className="flex flex-wrap gap-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  <Badge variant="secondary" className="bg-gray-800 text-gray-300">
                    <Zap className="w-3 h-3 mr-1" />
                    30s Generation
                  </Badge>
                  <Badge variant="secondary" className="bg-gray-800 text-gray-300">
                    <Shield className="w-3 h-3 mr-1" />
                    Production Ready
                  </Badge>
                  <Badge variant="secondary" className="bg-gray-800 text-gray-300">
                    <Copy className="w-3 h-3 mr-1" />
                    Copy to Deploy
                  </Badge>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
      {/* Custom Ads Section */}
      <section className="py-12 bg-dark-bg/50 px-4">
        <div className="max-w-4xl mx-auto">
          <CustomAd />
        </div>
      </section>

      {/* Modern Features Section */}
      <section id="features" className="py-32 bg-dark-bg relative overflow-hidden mt-[100px]">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-neon-cyan/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-neon-purple/5 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div
            className="text-center mb-20"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-center">
              Ship production-ready apps{" "}
              <span>
                10x faster
              </span>
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto text-center leading-relaxed">
              Everything you need to build, deploy, and scale modern applications with AI-powered code generation, DevOps automation, and enterprise-ready infrastructure.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-8 mb-16">
            {/* Backend-as-a-Service Feature */}
            <motion.div
              className="group relative"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              whileHover={{ y: -8 }}
            >
              <Card className="bg-gradient-to-br from-dark-card to-dark-card/50 border border-gray-800/50 hover:border-neon-cyan/50 transition-all duration-500 h-full">
                <CardHeader className="pb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-neon-cyan to-blue-500 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Database className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl font-bold text-white group-hover:text-neon-cyan transition-colors">
                    Backend-as-a-Service
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-300 text-lg leading-relaxed">
                    Auto-generate production-ready CRUD APIs with authentication, database integration, and API documentation.
                  </p>

                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <Check className="w-5 h-5 text-neon-green" />
                      <span className="text-gray-300">REST & GraphQL APIs</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Check className="w-5 h-5 text-neon-green" />
                      <span className="text-gray-300">JWT Authentication</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Check className="w-5 h-5 text-neon-green" />
                      <span className="text-gray-300">Auto Swagger Docs</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Check className="w-5 h-5 text-neon-green" />
                      <span className="text-gray-300">Database Integration</span>
                    </div>
                  </div>

                  <div className="bg-dark-bg/50 rounded-lg p-4 border border-gray-800">
                    <pre className="text-sm text-gray-300">
                      <code>{`// Generated in 30 seconds
app.post('/api/auth/login', ...)
app.get('/api/users', auth, ...)
app.post('/api/users', auth, ...)
// + JWT middleware included`}</code>
                    </pre>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* DevOps Toolkit Feature */}
            <motion.div
              className="group relative"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              whileHover={{ y: -8 }}
            >
              <Card className="bg-gradient-to-br from-dark-card to-dark-card/50 border border-gray-800/50 hover:border-neon-green/50 transition-all duration-500 h-full">
                <CardHeader className="pb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-neon-green to-green-500 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Container className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl font-bold text-white group-hover:text-neon-green transition-colors">
                    DevOps Automation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-300 text-lg leading-relaxed">
                    Generate optimized Dockerfiles, docker-compose, CI/CD pipelines, and infrastructure as code.
                  </p>

                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <Check className="w-5 h-5 text-neon-green" />
                      <span className="text-gray-300">Docker & Docker Compose</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Check className="w-5 h-5 text-neon-green" />
                      <span className="text-gray-300">GitHub Actions CI/CD</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Check className="w-5 h-5 text-neon-green" />
                      <span className="text-gray-300">Terraform Templates</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Check className="w-5 h-5 text-neon-green" />
                      <span className="text-gray-300">Kubernetes Manifests</span>
                    </div>
                  </div>

                  <div className="bg-dark-bg/50 rounded-lg p-4 border border-gray-800">
                    <pre className="text-sm text-gray-300">
                      <code>{`# Optimized Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production`}</code>
                    </pre>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* AI DevOps Assistant Feature */}
            <motion.div
              className="group relative"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
              whileHover={{ y: -8 }}
            >
              <Card className="bg-gradient-to-br from-dark-card to-dark-card/50 border border-gray-800/50 hover:border-neon-purple/50 transition-all duration-500 h-full">
                <CardHeader className="pb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-neon-purple to-purple-500 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Brain className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl font-bold text-white group-hover:text-neon-purple transition-colors">
                    AI DevOps Copilot
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-300 text-lg leading-relaxed">
                    AI-powered debugging, log analysis, and natural language to infrastructure code conversion.
                  </p>

                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <Check className="w-5 h-5 text-neon-green" />
                      <span className="text-gray-300">Error Log Analysis</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Check className="w-5 h-5 text-neon-green" />
                      <span className="text-gray-300">Natural Language to YAML</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Check className="w-5 h-5 text-neon-green" />
                      <span className="text-gray-300">Dockerfile Optimization</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Check className="w-5 h-5 text-neon-green" />
                      <span className="text-gray-300">Performance Insights</span>
                    </div>
                  </div>

                  <div className="bg-dark-bg/50 rounded-lg p-4 border border-gray-800">
                    <pre className="text-sm text-gray-300">
                      <code>{`> "Create CI for Python app"
# AI generates complete workflow:
name: Python CI
on: [push, pull_request]
jobs: ...`}</code>
                    </pre>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Process Flow */}
          <motion.div
            className="grid md:grid-cols-4 gap-8 mt-20"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-neon-cyan to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Configure</h3>
              <p className="text-gray-400">Choose your tech stack and requirements</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-neon-green to-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Generate</h3>
              <p className="text-gray-400">AI creates production-ready code</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-neon-purple to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Deploy</h3>
              <p className="text-gray-400">One-click deployment to cloud</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-neon-cyan to-neon-purple rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">4</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Scale</h3>
              <p className="text-gray-400">AI-powered monitoring and optimization</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-32 bg-gradient-to-b from-dark-bg to-dark-card/30 mt-[100px]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-5xl font-bold mb-6 text-white">
              Simple,{" "}
              <span>
                Transparent Pricing
              </span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Start free, scale as you grow. No hidden fees, no surprises.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free Plan */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="bg-dark-card border border-gray-800 hover:border-gray-700 transition-all duration-300 h-full">
                <CardHeader className="text-center pb-6">
                  <CardTitle className="text-2xl font-bold text-white mb-2">Free</CardTitle>
                  <div className="text-4xl font-bold text-white mb-4">₹0</div>
                  <p className="text-gray-300">Perfect for getting started</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <Check className="w-5 h-5 text-neon-green" />
                      <span className="text-gray-300">1 use per feature</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Check className="w-5 h-5 text-neon-green" />
                      <span className="text-gray-300">API generation</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Check className="w-5 h-5 text-neon-green" />
                      <span className="text-gray-300">Docker templates</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Check className="w-5 h-5 text-neon-green" />
                      <span className="text-gray-300">AI assistance</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Check className="w-5 h-5 text-neon-green" />
                      <span className="text-gray-300">Community support</span>
                    </div>
                  </div>
                  <Button
                    onClick={handleGetStarted}
                    className="w-full bg-gray-700 hover:bg-gray-600 text-white mt-6"
                  >
                    Start Free
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Starter Plan */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <Card className="bg-gradient-to-br from-neon-cyan/15 to-neon-purple/15 border-2 border-neon-cyan relative h-full hover:shadow-2xl hover:shadow-neon-cyan/20 transition-all duration-500 group">
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-gradient-to-r from-neon-cyan to-neon-purple text-white shadow-lg animate-pulse">
                    <Star className="w-3 h-3 mr-1" />
                    Most Popular
                  </Badge>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-neon-cyan/5 to-neon-purple/5 rounded-lg blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <CardHeader className="text-center pb-6">
                  <CardTitle className="text-2xl font-bold text-white mb-2">Starter Pack</CardTitle>
                  <div className="text-4xl font-bold text-white mb-4">₹99</div>
                  <p className="text-gray-200">5 credits included</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <Check className="w-5 h-5 text-neon-green" />
                      <span className="text-gray-300">5 feature uses</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Check className="w-5 h-5 text-neon-green" />
                      <span className="text-gray-300">Everything in Free</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Check className="w-5 h-5 text-neon-green" />
                      <span className="text-gray-300">Priority generation</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Check className="w-5 h-5 text-neon-green" />
                      <span className="text-gray-300">Advanced templates</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Check className="w-5 h-5 text-neon-green" />
                      <span className="text-gray-300">Email support</span>
                    </div>
                  </div>
                  <Link href="/checkout/starter">
                    <Button className="w-full bg-gradient-to-r from-neon-cyan to-neon-purple text-dark-bg font-semibold mt-6 hover:shadow-lg hover:shadow-neon-cyan/25 hover:scale-105 transition-all duration-300 relative overflow-hidden group">
                      <div className="absolute inset-0 bg-white/10 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                      <span className="relative">Get Started</span>
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>

            {/* Pro Plan */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
            >
              <Card className="bg-dark-card border border-gray-800 hover:border-neon-purple/50 transition-all duration-300 h-full">
                <CardHeader className="text-center pb-6">
                  <CardTitle className="text-2xl font-bold text-white mb-2">Pro Pack</CardTitle>
                  <div className="text-4xl font-bold text-white mb-4">₹149</div>
                  <p className="text-gray-200">10 credits included</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <Check className="w-5 h-5 text-neon-green" />
                      <span className="text-gray-300">10 feature uses</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Check className="w-5 h-5 text-neon-green" />
                      <span className="text-gray-300">Everything in Starter</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Check className="w-5 h-5 text-neon-green" />
                      <span className="text-gray-300">Custom templates</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Check className="w-5 h-5 text-neon-green" />
                      <span className="text-gray-300">Terraform & Helm</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Check className="w-5 h-5 text-neon-green" />
                      <span className="text-gray-300">Priority support</span>
                    </div>
                  </div>
                  <Link href="/checkout/pro">
                    <Button className="w-full bg-gradient-to-r from-neon-purple to-neon-purple/80 hover:from-neon-purple/90 hover:to-neon-purple text-white mt-6 hover:shadow-lg hover:shadow-neon-purple/25 hover:scale-105 transition-all duration-300 relative overflow-hidden group">
                      <div className="absolute inset-0 bg-white/10 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                      <span className="relative">Get Pro</span>
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Founder Section */}
      <section className="py-20 bg-gradient-to-b from-dark-bg to-dark-card relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/2 right-0 w-96 h-96 bg-gradient-to-l from-neon-purple/10 to-transparent rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-r from-neon-cyan/10 to-transparent rounded-full blur-3xl"></div>
        </div>
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-4">
              Meet the <span style={{ background: 'linear-gradient(to right, #00f5d4, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Founder</span>
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              The vision behind Prometix
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="flex flex-col md:flex-row items-center justify-center gap-10"
          >
            {/* Founder Avatar */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-neon-cyan via-neon-green to-neon-purple rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity duration-500"></div>
              <div className="relative w-72 h-72 md:w-80 md:h-80 rounded-2xl overflow-hidden border-2 border-gray-700 group-hover:border-neon-cyan/50 transition-all duration-500">
                <img
                  src="/founder.jpg"
                  alt="Mayank Agrawal - Founder"
                  className="w-full h-full object-cover"
                  data-testid="img-founder"
                />
              </div>
            </div>

            {/* Founder Info */}
            <div className="text-center md:text-left max-w-md">
              <h3 className="text-3xl font-bold text-white mb-2" data-testid="text-founder-name">Mayank Agrawal</h3>
              <p className="text-neon-cyan font-semibold text-lg mb-4">Founder & CEO</p>
              <p className="text-gray-300 leading-relaxed mb-6">
                Passionate about simplifying DevOps for developers worldwide. Prometix was born from the vision of making infrastructure and backend development accessible to everyone through the power of AI.
              </p>
              <div className="flex items-center justify-center md:justify-start gap-4">
                <a
                  href="https://linkedin.com/in/mayank-agrawal"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 bg-gray-800 rounded-xl hover:bg-gray-700 hover:text-neon-cyan transition-all duration-300 group"
                >
                  <Linkedin className="w-5 h-5 text-gray-400 group-hover:text-neon-cyan" />
                </a>
                <a
                  href="https://twitter.com/mayank_agrawal"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 bg-gray-800 rounded-xl hover:bg-gray-700 hover:text-neon-cyan transition-all duration-300 group"
                >
                  <Twitter className="w-5 h-5 text-gray-400 group-hover:text-neon-cyan" />
                </a>
                <a
                  href="https://github.com/mayank-agrawal"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 bg-gray-800 rounded-xl hover:bg-gray-700 hover:text-neon-cyan transition-all duration-300 group"
                >
                  <Github className="w-5 h-5 text-gray-400 group-hover:text-neon-cyan" />
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-dark-bg via-dark-card to-dark-bg relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 w-[40rem] h-[40rem] bg-gradient-to-r from-neon-cyan/15 via-neon-green/10 to-neon-purple/15 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2 animate-pulse"></div>
          <div className="absolute top-10 right-10 w-32 h-32 bg-gradient-to-r from-neon-cyan/20 to-transparent rounded-full blur-2xl animate-pulse delay-1000"></div>
          <div className="absolute bottom-10 left-10 w-40 h-40 bg-gradient-to-r from-neon-purple/20 to-transparent rounded-full blur-2xl animate-pulse delay-500"></div>

          {/* Floating particles */}
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-neon-cyan rounded-full animate-bounce"></div>
          <div className="absolute top-3/4 right-1/4 w-1.5 h-1.5 bg-neon-green rounded-full animate-bounce delay-300"></div>
          <div className="absolute bottom-1/4 left-1/2 w-2.5 h-2.5 bg-neon-purple rounded-full animate-bounce delay-700"></div>
        </div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-5xl lg:text-6xl font-bold mb-6 text-center">
              Ready to{" "}
              <span>
                Ship Faster?
              </span>
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Join thousands of developers building production-ready applications with AI-powered DevOps tools.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={handleGetStarted}
                className="group bg-gradient-to-r from-neon-cyan via-neon-green to-neon-purple text-dark-bg px-10 py-5 rounded-xl font-semibold text-xl hover:shadow-2xl hover:shadow-neon-cyan/40 transition-all duration-500 flex items-center justify-center space-x-3 hover:scale-110 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <span className="relative">Start Building Now</span>
                <ArrowRight className="w-6 h-6 relative group-hover:translate-x-2 transition-transform duration-300" />
              </Button>
              <Button
                variant="outline"
                className="group border-2 border-gray-600 text-white px-10 py-5 rounded-xl font-semibold text-xl hover:border-neon-cyan hover:text-neon-cyan hover:shadow-xl hover:shadow-neon-cyan/20 transition-all duration-500 hover:scale-110 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-neon-cyan/5 to-neon-purple/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <span className="relative">Schedule Demo</span>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-b from-dark-card to-black border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <img src="/logo.png" alt="Prometix" className="w-10 h-10 rounded-xl" />
                <div className="flex flex-col">
                  <span className="text-xl font-bold text-white">Prometix</span>
                  <span className="text-xs text-gray-400 -mt-1">AI DevOps Platform</span>
                </div>
              </div>
              <p className="text-gray-400 text-sm">
                Build backends and DevOps ship faster with AI-powered code generation and automation tools.
              </p>
            </div>

            {/* Product Links */}
            <div>
              <h3 className="text-white font-semibold mb-4">Product</h3>
              <ul className="space-y-2">
                <li><a href="#features" className="text-gray-400 hover:text-neon-cyan transition-colors">Features</a></li>
                <li><a href="/dashboard" className="text-gray-400 hover:text-neon-cyan transition-colors">Dashboard</a></li>
                <li><a href="/api-generator" className="text-gray-400 hover:text-neon-cyan transition-colors">API Generator</a></li>
                <li><a href="/docker-generator" className="text-gray-400 hover:text-neon-cyan transition-colors">Docker Tools</a></li>
                <li><a href="/ai-assistant" className="text-gray-400 hover:text-neon-cyan transition-colors">AI Assistant</a></li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h3 className="text-white font-semibold mb-4">Resources</h3>
              <ul className="space-y-2">
                <li><Link href="/docs" className="text-gray-400 hover:text-neon-cyan transition-colors">Documentation</Link></li>
                <li><Link href="/blog" className="text-gray-400 hover:text-neon-cyan transition-colors">Blog</Link></li>
                <li><Link href="/case-studies" className="text-gray-400 hover:text-neon-cyan transition-colors">Case Studies</Link></li>
                <li><Link href="/community" className="text-gray-400 hover:text-neon-cyan transition-colors">Community</Link></li>
                <li><a href="https://medium.com/@devops-cloud" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-neon-cyan transition-colors">Medium</a></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h3 className="text-white font-semibold mb-4">Company</h3>
              <ul className="space-y-2">
                <li><Link href="/about" className="text-gray-400 hover:text-neon-cyan transition-colors">About Us</Link></li>
                <li><Link href="/pricing" className="text-gray-400 hover:text-neon-cyan transition-colors">Pricing</Link></li>
                <li><a href="#" className="text-gray-400 hover:text-neon-cyan transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="text-gray-400 hover:text-neon-cyan transition-colors">Terms of Service</a></li>
                <li><Link href="/community" className="text-gray-400 hover:text-neon-cyan transition-colors">Support</Link></li>
              </ul>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="border-t border-gray-800 mt-12 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="text-gray-400 text-sm">
                © 2024 Prometix. All rights reserved.
              </div>
              <div className="flex items-center space-x-6 mt-4 md:mt-0">
                <a href="https://github.com/Mxyank/Automation-Platform" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-neon-cyan transition-colors">
                  <Github className="w-5 h-5" />
                </a>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-neon-cyan transition-colors">
                  <Twitter className="w-5 h-5" />
                </a>
                <a href="https://www.linkedin.com/in/mayank-agrawal-bb04901b7/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-neon-cyan transition-colors">
                  <Linkedin className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
