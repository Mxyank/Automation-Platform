import { useState } from "react";
import { Navigation } from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  BookOpen,
  Rocket,
  Database,
  Container,
  Brain,
  GitBranch,
  Settings,
  Terminal,
  BarChart3,
  CreditCard,
  Zap,
  Check,
  ArrowRight,
  Star,
  Crown,
  Sparkles,
  HelpCircle
} from "lucide-react";

const gettingStartedSteps = [
  {
    step: 1,
    title: "Create Your Account",
    description: "Sign up for free using your email or Google account. New users get 2 free credits to explore the platform.",
    icon: Rocket
  },
  {
    step: 2,
    title: "Choose a Feature",
    description: "Navigate to the Dashboard and select from API Generator, Docker Generator, Jenkins Pipeline, Ansible Playbook, or AI Assistant.",
    icon: Zap
  },
  {
    step: 3,
    title: "Configure Your Project",
    description: "Fill in the required fields like project name, framework, database type, and any other options specific to the feature.",
    icon: Settings
  },
  {
    step: 4,
    title: "Generate & Download",
    description: "Click Generate to create your code. Review the output and copy or download the generated files.",
    icon: Check
  }
];

const featureGuides = [
  {
    id: "api-generator",
    title: "API Generator",
    icon: Database,
    description: "Generate complete REST APIs with authentication and database integration.",
    steps: [
      "Go to Dashboard > Generate API",
      "Enter your project name",
      "Select database type (PostgreSQL, MySQL, MongoDB, SQLite)",
      "Choose framework (Express, FastAPI, NestJS)",
      "Enable/disable JWT authentication",
      "Enable/disable OAuth support",
      "Click 'Generate API' to create your code",
      "Copy the generated code to your project"
    ]
  },
  {
    id: "docker-generator",
    title: "Docker Generator",
    icon: Container,
    description: "Create optimized Dockerfiles and docker-compose configurations.",
    steps: [
      "Go to Dashboard > Container Setup",
      "Select your programming language",
      "Choose the framework (if applicable)",
      "Specify the port your application runs on",
      "Select base image (optional)",
      "Add environment variables",
      "Click 'Generate Dockerfile' to create your configuration",
      "Use 'Generate Docker Compose' for multi-service setups"
    ]
  },
  {
    id: "jenkins-generator",
    title: "Jenkins Pipeline Generator",
    icon: Settings,
    description: "Generate comprehensive Jenkinsfiles for CI/CD automation.",
    steps: [
      "Go to Dashboard > Jenkins Pipeline",
      "Select your project type (Node.js, Java, Python, etc.)",
      "Choose which stages to include (build, test, deploy)",
      "Configure deployment targets",
      "Enable quality gates if needed",
      "Add notification settings",
      "Click 'Generate Pipeline' to create Jenkinsfile",
      "Copy to your repository root as 'Jenkinsfile'"
    ]
  },
  {
    id: "ansible-generator",
    title: "Ansible Playbook Generator",
    icon: Terminal,
    description: "Create automation playbooks for infrastructure management.",
    steps: [
      "Go to Dashboard > Ansible Playbook",
      "Select playbook type (Server Setup, Web Server, Database, etc.)",
      "Choose target operating system",
      "Configure specific options for your playbook type",
      "Add custom variables if needed",
      "Click 'Generate Playbook' to create your automation",
      "Save playbooks to your Ansible project",
      "Run with: ansible-playbook -i inventory playbook.yml"
    ]
  },
  {
    id: "sonarqube-setup",
    title: "SonarQube Setup",
    icon: BarChart3,
    description: "Generate SonarQube installation scripts for code quality analysis.",
    steps: [
      "Go to Dashboard > SonarQube Setup",
      "Select deployment method (Docker, Kubernetes, Manual, etc.)",
      "Choose database configuration",
      "Configure memory and resource limits",
      "Set up scanner properties",
      "Generate installation scripts",
      "Follow the generated instructions",
      "Access SonarQube at configured URL"
    ]
  },
  {
    id: "ai-assistant",
    title: "AI DevOps Assistant",
    icon: Brain,
    description: "Get AI-powered help for debugging and DevOps tasks.",
    steps: [
      "Go to Dashboard > AI Assistant",
      "Choose assistant mode:",
      "  - Log Analysis: Paste error logs for debugging",
      "  - YAML Generator: Describe what you need in plain English",
      "  - Dockerfile Optimizer: Paste your Dockerfile for improvements",
      "  - DevOps Chat: Ask any DevOps-related question",
      "Submit your query",
      "Review AI-generated solutions and recommendations"
    ]
  }
];

const pricingPlans = [
  {
    name: "Free",
    price: "₹0",
    period: "forever",
    description: "Perfect for trying out CloudForge",
    credits: "2",
    features: [
      "2 free credits on signup",
      "Access to all features",
      "Basic support",
      "Community access"
    ],
    cta: "Get Started",
    href: "/auth",
    popular: false
  },
  {
    name: "Starter",
    price: "₹99",
    period: "one-time",
    description: "Great for individual developers",
    credits: "10",
    features: [
      "10 credits",
      "All generation features",
      "AI assistance",
      "Email support",
      "No expiration"
    ],
    cta: "Buy Starter",
    href: "/checkout/starter",
    popular: false
  },
  {
    name: "Pro",
    price: "₹499",
    period: "one-time",
    description: "Best value for active developers",
    credits: "60",
    features: [
      "60 credits (20% bonus)",
      "All generation features",
      "Priority AI assistance",
      "Priority support",
      "No expiration"
    ],
    cta: "Buy Pro",
    href: "/checkout/pro",
    popular: true
  },
  {
    name: "Enterprise",
    price: "₹999",
    period: "one-time",
    description: "For teams and power users",
    credits: "150",
    features: [
      "150 credits (50% bonus)",
      "All generation features",
      "Dedicated AI priority",
      "Priority support",
      "Team features (coming soon)",
      "No expiration"
    ],
    cta: "Buy Enterprise",
    href: "/checkout/enterprise",
    popular: false
  }
];

const faqItems = [
  {
    question: "How do credits work?",
    answer: "Each feature usage costs 1 credit. For example, generating an API costs 1 credit, generating a Dockerfile costs 1 credit, and each AI assistant query costs 1 credit. Credits never expire."
  },
  {
    question: "What happens if I run out of credits?",
    answer: "You'll need to purchase more credits to continue using the generation features. You can always view your existing projects and generated code without credits."
  },
  {
    question: "Can I get a refund?",
    answer: "We offer refunds within 7 days of purchase for unused credits. Please contact support with your order details."
  },
  {
    question: "Is my data secure?",
    answer: "Yes! We use enterprise-grade security including encryption, secure authentication, and never store your generated code on our servers after download."
  },
  {
    question: "Do you support team accounts?",
    answer: "Team features are coming soon! Currently, each user has their own account with separate credits and projects."
  },
  {
    question: "What AI model powers the assistant?",
    answer: "Our AI assistant is powered by Google's Gemini model, providing accurate and contextual DevOps guidance."
  }
];

export default function DocsPage() {
  const [activeGuide, setActiveGuide] = useState("api-generator");

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
            <Badge className="bg-neon-purple/20 text-neon-purple border-neon-purple/50 mb-4">
              <BookOpen className="w-3 h-3 mr-1" />
              Documentation
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              How to Use CloudForge
            </h1>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Learn how to get the most out of CloudForge's powerful DevOps automation tools.
            </p>
          </motion.div>

          <Tabs defaultValue="getting-started" className="space-y-8">
            <TabsList className="bg-dark-card border border-gray-800 p-1 w-full max-w-2xl mx-auto grid grid-cols-4">
              <TabsTrigger value="getting-started" className="data-[state=active]:bg-neon-cyan data-[state=active]:text-black">
                Getting Started
              </TabsTrigger>
              <TabsTrigger value="features" className="data-[state=active]:bg-neon-cyan data-[state=active]:text-black">
                Features
              </TabsTrigger>
              <TabsTrigger value="pricing" className="data-[state=active]:bg-neon-cyan data-[state=active]:text-black">
                Pricing
              </TabsTrigger>
              <TabsTrigger value="faq" className="data-[state=active]:bg-neon-cyan data-[state=active]:text-black">
                FAQ
              </TabsTrigger>
            </TabsList>

            <TabsContent value="getting-started">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Card className="bg-dark-card border-gray-800 mb-8">
                  <CardHeader>
                    <CardTitle className="text-white text-2xl flex items-center gap-2">
                      <Rocket className="w-6 h-6 text-neon-cyan" />
                      Quick Start Guide
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                      {gettingStartedSteps.map((step, index) => (
                        <div key={step.step} className="relative">
                          {index < gettingStartedSteps.length - 1 && (
                            <div className="hidden lg:block absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-neon-cyan to-transparent z-0" />
                          )}
                          <div className="relative z-10 bg-dark-bg border border-gray-800 rounded-xl p-6 h-full">
                            <div className="flex items-center gap-3 mb-4">
                              <div className="w-10 h-10 bg-gradient-to-br from-neon-cyan to-neon-purple rounded-lg flex items-center justify-center text-white font-bold">
                                {step.step}
                              </div>
                              <step.icon className="w-5 h-5 text-neon-cyan" />
                            </div>
                            <h3 className="text-white font-semibold mb-2">{step.title}</h3>
                            <p className="text-gray-400 text-sm">{step.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <div className="text-center">
                  <Link href="/auth">
                    <Button className="bg-white text-black hover:bg-gray-100 px-8 py-3" data-testid="button-create-account">
                      <Rocket className="w-4 h-4 mr-2" />
                      Create Your Account
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </motion.div>
            </TabsContent>

            <TabsContent value="features">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="grid lg:grid-cols-4 gap-6">
                  <Card className="bg-dark-card border-gray-800 lg:col-span-1">
                    <CardHeader>
                      <CardTitle className="text-white text-lg">Feature Guides</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {featureGuides.map((guide) => (
                        <Button
                          key={guide.id}
                          variant={activeGuide === guide.id ? "default" : "ghost"}
                          className={`w-full justify-start ${
                            activeGuide === guide.id 
                              ? "bg-neon-cyan text-black" 
                              : "text-gray-400 hover:text-white"
                          }`}
                          onClick={() => setActiveGuide(guide.id)}
                          data-testid={`guide-button-${guide.id}`}
                        >
                          <guide.icon className="w-4 h-4 mr-2" />
                          {guide.title}
                        </Button>
                      ))}
                    </CardContent>
                  </Card>

                  <Card className="bg-dark-card border-gray-800 lg:col-span-3">
                    {featureGuides.filter(g => g.id === activeGuide).map((guide) => (
                      <div key={guide.id}>
                        <CardHeader>
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-neon-cyan to-neon-purple rounded-xl flex items-center justify-center">
                              <guide.icon className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <CardTitle className="text-white text-xl">{guide.title}</CardTitle>
                              <p className="text-gray-400 text-sm mt-1">{guide.description}</p>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <h4 className="text-white font-semibold mb-4">Step-by-Step Instructions</h4>
                          <div className="space-y-3">
                            {guide.steps.map((step, index) => (
                              <div key={index} className="flex items-start gap-3">
                                <div className="w-6 h-6 bg-neon-cyan/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                  <span className="text-neon-cyan text-xs font-bold">{index + 1}</span>
                                </div>
                                <p className={`text-gray-300 ${step.startsWith("  -") ? "ml-4 text-gray-400" : ""}`}>
                                  {step}
                                </p>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </div>
                    ))}
                  </Card>
                </div>
              </motion.div>
            </TabsContent>

            <TabsContent value="pricing" id="pricing">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="text-center mb-12">
                  <h2 className="text-3xl font-bold text-white mb-4">Simple, Transparent Pricing</h2>
                  <p className="text-gray-400 max-w-2xl mx-auto">
                    Pay only for what you use. No subscriptions, no hidden fees. Credits never expire.
                  </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                  {pricingPlans.map((plan, index) => (
                    <motion.div
                      key={plan.name}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                    >
                      <Card 
                        className={`bg-dark-card border-gray-800 h-full relative ${
                          plan.popular ? "border-neon-cyan" : ""
                        }`}
                        data-testid={`pricing-card-${plan.name.toLowerCase()}`}
                      >
                        {plan.popular && (
                          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                            <Badge className="bg-neon-cyan text-black">
                              <Star className="w-3 h-3 mr-1" />
                              Most Popular
                            </Badge>
                          </div>
                        )}
                        <CardHeader className="text-center pb-2">
                          <CardTitle className="text-white text-xl">{plan.name}</CardTitle>
                          <div className="mt-4">
                            <span className="text-4xl font-bold text-white">{plan.price}</span>
                            <span className="text-gray-400 ml-2">/{plan.period}</span>
                          </div>
                          <p className="text-gray-400 text-sm mt-2">{plan.description}</p>
                        </CardHeader>
                        <CardContent>
                          <div className="bg-neon-cyan/10 border border-neon-cyan/30 rounded-lg p-3 text-center mb-6">
                            <span className="text-2xl font-bold text-neon-cyan">{plan.credits}</span>
                            <span className="text-gray-400 ml-2">credits</span>
                          </div>
                          <ul className="space-y-3 mb-6">
                            {plan.features.map((feature, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <Check className="w-4 h-4 text-neon-green flex-shrink-0 mt-0.5" />
                                <span className="text-gray-300 text-sm">{feature}</span>
                              </li>
                            ))}
                          </ul>
                          <Link href={plan.href}>
                            <Button 
                              className={`w-full ${
                                plan.popular 
                                  ? "bg-neon-cyan text-black hover:bg-neon-cyan/90" 
                                  : "bg-gray-800 text-white hover:bg-gray-700"
                              }`}
                              data-testid={`button-${plan.name.toLowerCase()}-plan`}
                            >
                              {plan.cta}
                            </Button>
                          </Link>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>

                <Card className="bg-gradient-to-r from-neon-purple/10 to-neon-cyan/10 border-gray-800">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <Crown className="w-8 h-8 text-neon-purple" />
                        <div>
                          <h3 className="text-white font-semibold">AI Premium Subscription</h3>
                          <p className="text-gray-400 text-sm">Unlimited AI assistant queries with priority processing</p>
                        </div>
                      </div>
                      <Badge className="bg-neon-purple/20 text-neon-purple border-neon-purple/50">
                        Coming Soon
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            <TabsContent value="faq">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Card className="bg-dark-card border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-white text-2xl flex items-center gap-2">
                      <HelpCircle className="w-6 h-6 text-neon-cyan" />
                      Frequently Asked Questions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {faqItems.map((item, index) => (
                        <div key={index} className="border-b border-gray-800 pb-6 last:border-0 last:pb-0">
                          <h3 className="text-white font-semibold mb-2">{item.question}</h3>
                          <p className="text-gray-400">{item.answer}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <div className="text-center mt-8">
                  <p className="text-gray-400 mb-4">Still have questions?</p>
                  <Button variant="outline" className="border-gray-700 text-white hover:bg-gray-800">
                    Contact Support
                  </Button>
                </div>
              </motion.div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
