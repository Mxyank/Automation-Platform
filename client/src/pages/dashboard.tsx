import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Navigation } from "@/components/navigation";
import { ProjectCard } from "@/components/project-card";
import { UsageMeter } from "@/components/usage-meter";
import { DomainSwitcher } from "@/components/domain-switcher";
import { ComingSoonOverlay } from "@/components/coming-soon-overlay";
import { SearchBar } from "@/components/search-bar";
import { Chatbot } from "@/components/chatbot";
import { IncidentForm } from "@/components/incident-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CustomAd } from "@/components/custom-ad";
import { ProductTour, TourWelcomeModal } from "@/components/product-tour";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Database,
  Container,
  Brain,
  Plus,
  Zap,
  TrendingUp,
  Clock,
  Star,
  DollarSign,
  RefreshCw,
  GitBranch,
  Shield,
  Rocket,
  Activity,
  BarChart3,
  Layers,
  Server,
  Cloud,
  ArrowRight,
  Crown,
  Sparkles,
  Terminal,
  FileCode,
  Snowflake,
  Wind,
  Workflow,
  Table2,
  Lock,
  Bug,
  Search,
  Network,
  Fingerprint,
  Eye
} from "lucide-react";
import type { Project } from "@shared/schema";
import { motion } from "framer-motion";
import {
  getQuickActionsByDomain,
  getAdvancedFeaturesByDomain,
  getMonitoringToolsByDomain,
  type Domain,
  type Feature
} from "@shared/feature-registry";

interface UsageData {
  feature: string;
  usage: {
    usedCount: number;
    lastUsed: string;
  } | null;
}

const iconMap: Record<string, any> = {
  Database, Container, Brain, Zap, DollarSign, RefreshCw, GitBranch, Shield,
  Rocket, Activity, BarChart3, Layers, Server, Cloud, Sparkles, Terminal,
  FileCode, Snowflake, Wind, Workflow, Table2, Lock, Bug, Search, Network, Fingerprint, Eye
};

function getIconComponent(iconName: string) {
  return iconMap[iconName] || Database;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [showTour, setShowTour] = useState(false);

  const currentDomain = ((user as any)?.primaryDomain || 'devops') as Domain;

  const { data: projects = [], isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: usage = [], isLoading: usageLoading } = useQuery<UsageData[]>({
    queryKey: ["/api/usage"],
  });

  const { data: subscriptionData } = useQuery({
    queryKey: ["/api/subscription"],
  });

  interface DomainConfig {
    domain: string;
    isEnabled: boolean;
    comingSoonMessage?: string;
  }

  const { data: domainConfigs = [] } = useQuery<DomainConfig[]>({
    queryKey: ["/api/domain-configs"],
  });

  const currentDomainConfig = domainConfigs.find(d => d.domain === currentDomain);
  const isDomainDisabled = currentDomainConfig && !currentDomainConfig.isEnabled;

  const quickActions = useMemo(() => getQuickActionsByDomain(currentDomain), [currentDomain]);
  const advancedFeatures = useMemo(() => getAdvancedFeaturesByDomain(currentDomain), [currentDomain]);
  const monitoringTools = useMemo(() => getMonitoringToolsByDomain(currentDomain), [currentDomain]);

  useEffect(() => {
    if (user && !(user as any).hasSeenTour) {
      const timer = setTimeout(() => {
        setShowWelcomeModal(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [user]);

  const completeTourMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/user/tour-complete");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    },
  });

  const handleStartTour = () => {
    setShowWelcomeModal(false);
    setShowTour(true);
  };

  const handleSkipTour = () => {
    setShowWelcomeModal(false);
    completeTourMutation.mutate();
  };

  const handleTourComplete = () => {
    setShowTour(false);
  };

  const handleTourClose = () => {
    setShowTour(false);
  };

  const isPremium = (subscriptionData as any)?.hasActiveSubscription || (subscriptionData as any)?.isPremium;

  const stats = {
    totalProjects: projects.length,
    activeProjects: projects.filter(p => p.status === "active").length,
    creditsUsed: usage.reduce((acc: number, u: UsageData) => acc + (u.usage?.usedCount || 0), 0),
    creditsRemaining: user?.credits || 0,
  };

  return (
    <div className="min-h-screen bg-dark-bg">
      <Navigation />

      {/* Product Tour for new users */}
      <TourWelcomeModal
        isOpen={showWelcomeModal}
        onStartTour={handleStartTour}
        onSkip={handleSkipTour}
      />
      <ProductTour
        isOpen={showTour}
        onClose={handleTourClose}
        onComplete={handleTourComplete}
      />

      {/* Coming Soon Overlay for disabled domains */}
      {isDomainDisabled && (
        <ComingSoonOverlay
          domainName={currentDomain === 'data-engineering' ? 'Data Engineering' :
            currentDomain === 'cybersecurity' ? 'Cybersecurity' : currentDomain}
          message={currentDomainConfig?.comingSoonMessage}
        />
      )}

      <div className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold text-white">
                    Welcome back, {user?.username}
                  </h1>
                  {isPremium && (
                    <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0">
                      <Crown className="w-3 h-3 mr-1" />
                      Pro
                    </Badge>
                  )}
                </div>
                <p className="text-gray-400 mt-1">
                  Manage your projects and build amazing applications
                </p>
              </div>
              <Link href="/api-generator">
                <Button className="bg-gradient-to-r from-neon-cyan to-neon-purple text-dark-bg" data-testid="button-new-project">
                  <Plus className="w-4 h-4 mr-2" />
                  New Project
                </Button>
              </Link>
            </div>

            {/* Search Bar */}
            <div className="flex items-center gap-4">
              <SearchBar />
            </div>

            {/* Domain Switcher */}
            <div className="flex items-center justify-between bg-dark-card border border-gray-800 rounded-lg p-4">
              <div className="flex items-center gap-4">
                <DomainSwitcher currentDomain={currentDomain} />
                <span className="text-sm text-gray-500">
                  Switch your domain to see relevant tools
                </span>
              </div>
              <Badge variant="outline" className="text-gray-400 border-gray-600">
                {quickActions.length + advancedFeatures.length} tools available
              </Badge>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card className="bg-dark-card border-gray-800 hover:border-neon-cyan/50 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Total Projects</p>
                      <p className="text-3xl font-bold text-white">{stats.totalProjects}</p>
                    </div>
                    <div className="w-12 h-12 bg-neon-cyan/20 rounded-xl flex items-center justify-center">
                      <Layers className="w-6 h-6 text-neon-cyan" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <Progress value={Math.min((stats.totalProjects / 10) * 100, 100)} className="h-1" />
                    <p className="text-xs text-gray-500 mt-1">{Math.max(10 - stats.totalProjects, 0)} more to next tier</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card className="bg-dark-card border-gray-800 hover:border-neon-green/50 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Active Projects</p>
                      <p className="text-3xl font-bold text-white">{stats.activeProjects}</p>
                    </div>
                    <div className="w-12 h-12 bg-neon-green/20 rounded-xl flex items-center justify-center">
                      <Zap className="w-6 h-6 text-neon-green" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <div className="w-2 h-2 bg-neon-green rounded-full animate-pulse" />
                    <span className="text-xs text-gray-400">All systems operational</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card className="bg-dark-card border-gray-800 hover:border-neon-purple/50 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Credits Used</p>
                      <p className="text-3xl font-bold text-white">{stats.creditsUsed}</p>
                    </div>
                    <div className="w-12 h-12 bg-neon-purple/20 rounded-xl flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-neon-purple" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-xs text-gray-400">This month's usage</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <Card className={`bg-dark-card border-gray-800 ${stats.creditsRemaining < 5 ? 'border-yellow-500/50' : 'hover:border-yellow-500/50'} transition-colors`}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Credits Remaining</p>
                      <p className="text-3xl font-bold text-white">{isPremium ? '∞' : stats.creditsRemaining}</p>
                    </div>
                    <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                      <Star className="w-6 h-6 text-yellow-500" />
                    </div>
                  </div>
                  {!isPremium && stats.creditsRemaining < 5 && (
                    <Link href="/pricing">
                      <Button size="sm" className="mt-4 w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-dark-bg text-xs">
                        Get More Credits
                      </Button>
                    </Link>
                  )}
                  {isPremium && (
                    <p className="text-xs text-yellow-500 mt-4">Unlimited with Pro subscription</p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Custom Ads */}
          <div className="mb-8">
            <CustomAd />
          </div>

          {/* Domain-based Features Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-yellow-500" />
                {currentDomain === 'devops' && 'DevOps Tools'}
                {currentDomain === 'data-engineering' && 'Data Engineering Tools'}
                {currentDomain === 'cybersecurity' && 'Security Tools'}
              </h2>
            </div>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {advancedFeatures.map((feature: Feature, index: number) => {
                const IconComponent = getIconComponent(feature.icon);
                return (
                  <Link key={feature.id} href={feature.href}>
                    <Card className="bg-dark-card border-gray-800 hover:border-gray-600 transition-all hover:scale-[1.02] cursor-pointer group h-full">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className={`w-10 h-10 bg-gradient-to-r ${feature.gradient} rounded-lg flex items-center justify-center`}>
                            <IconComponent className="w-5 h-5 text-white" />
                          </div>
                          {feature.badge && (
                            <Badge variant="secondary" className="text-[10px] bg-gray-800 px-2 py-0.5">
                              {feature.badge}
                            </Badge>
                          )}
                        </div>
                        <h3 className="font-medium text-white text-sm mb-1 group-hover:text-neon-cyan transition-colors">
                          {feature.title}
                        </h3>
                        <p className="text-xs text-gray-400 line-clamp-2">{feature.description}</p>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Projects Section */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">Recent Projects</h2>
                <Link href="/api-generator">
                  <Button variant="ghost" className="text-neon-cyan hover:text-neon-cyan/80">
                    View All <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>

              {projectsLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Card key={i} className="bg-dark-card border-gray-800">
                      <CardContent className="p-6">
                        <div className="animate-pulse">
                          <div className="h-4 bg-gray-700 rounded w-1/2 mb-2"></div>
                          <div className="h-3 bg-gray-700 rounded w-3/4"></div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : projects.length === 0 ? (
                <Card className="bg-dark-card border-gray-800">
                  <CardContent className="p-12 text-center">
                    <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Rocket className="w-8 h-8 text-gray-600" />
                    </div>
                    <h3 className="text-lg font-medium text-white mb-2">Ready to Launch?</h3>
                    <p className="text-gray-400 mb-6 max-w-sm mx-auto">
                      Create your first project and start building with Prometix's powerful DevOps tools
                    </p>
                    <div className="flex flex-wrap gap-3 justify-center">
                      <Link href="/api-generator">
                        <Button className="bg-gradient-to-r from-neon-cyan to-blue-500">
                          <Database className="w-4 h-4 mr-2" />
                          Generate API
                        </Button>
                      </Link>
                      <Link href="/docker-generator">
                        <Button variant="outline" className="border-gray-700 hover:border-cyan-500">
                          <Container className="w-4 h-4 mr-2" />
                          Create Dockerfile
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {projects.slice(0, 5).map((project) => (
                    <ProjectCard key={project.id} project={project} />
                  ))}
                </div>
              )}

              {/* Monitoring Tools */}
              <Card className="bg-dark-card border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white text-lg flex items-center gap-2">
                    <Activity className="w-5 h-5 text-green-500" />
                    Monitoring & Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    {monitoringTools.map((tool) => {
                      const IconComponent = getIconComponent(tool.icon);
                      return (
                        <Link key={tool.id} href={tool.href}>
                          <Button
                            variant="ghost"
                            className="w-full h-auto py-4 flex flex-col items-center gap-2 hover:bg-gray-800 transition-colors"
                            data-testid={`button-${tool.title.toLowerCase().replace(' ', '-')}`}
                          >
                            <IconComponent className={`w-6 h-6 ${tool.color}`} />
                            <span className="text-sm text-gray-300">{tool.title}</span>
                          </Button>
                        </Link>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <Card className="bg-dark-card border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Zap className="w-5 h-5 text-yellow-500" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {quickActions.map((action: Feature) => {
                    const IconComponent = getIconComponent(action.icon);
                    return (
                      <Link key={action.id} href={action.href}>
                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Button
                            variant="ghost"
                            className={`w-full justify-start text-left h-auto p-3 bg-gradient-to-r ${action.gradient} text-white hover:opacity-90 transition-opacity duration-200`}
                            data-testid={`button-${action.title.toLowerCase().replace(' ', '-')}`}
                          >
                            <div className="flex items-center space-x-3">
                              <IconComponent className="w-5 h-5" />
                              <div>
                                <div className="font-medium text-sm">{action.title}</div>
                                <div className="text-xs opacity-80">{action.description}</div>
                              </div>
                            </div>
                          </Button>
                        </motion.div>
                      </Link>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Usage Tracking */}
              <Card className="bg-dark-card border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-blue-500" />
                    Usage This Month
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {usageLoading ? (
                    <div className="space-y-3">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="animate-pulse">
                          <div className="h-3 bg-gray-700 rounded w-full"></div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <UsageMeter usage={usage} />
                  )}
                </CardContent>
              </Card>

              {/* Support Ticket */}
              <IncidentForm />

              {/* Upgrade Card */}
              {!isPremium && (
                <Card className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 border-purple-500/30">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center">
                        <Crown className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">Upgrade to Pro</h3>
                        <p className="text-xs text-gray-400">Unlimited AI access</p>
                      </div>
                    </div>
                    <ul className="space-y-2 mb-4">
                      <li className="flex items-center gap-2 text-sm text-gray-300">
                        <Sparkles className="w-4 h-4 text-yellow-500" />
                        Unlimited AI queries
                      </li>
                      <li className="flex items-center gap-2 text-sm text-gray-300">
                        <Zap className="w-4 h-4 text-yellow-500" />
                        Priority support
                      </li>
                      <li className="flex items-center gap-2 text-sm text-gray-300">
                        <Shield className="w-4 h-4 text-yellow-500" />
                        Advanced features
                      </li>
                    </ul>
                    <Link href="/pricing">
                      <Button className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-dark-bg font-semibold">
                        View Plans
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )}

              {/* Credit Status */}
              <Card className="bg-dark-card border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-500" />
                    Credit Balance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center space-y-4">
                    <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-neon-cyan to-neon-purple">
                      {isPremium ? '∞' : stats.creditsRemaining}
                    </div>
                    <p className="text-gray-400 text-sm">
                      {isPremium ? 'Unlimited credits with Pro' : 'credits remaining'}
                    </p>

                    {!isPremium && stats.creditsRemaining < 5 && (
                      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                        <p className="text-yellow-500 text-sm font-medium">
                          Running low on credits
                        </p>
                        <p className="text-yellow-400/80 text-xs mt-1">
                          Top up to continue using features
                        </p>
                      </div>
                    )}

                    {!isPremium && (
                      <Link href="/pricing">
                        <Button className="w-full bg-gradient-to-r from-neon-cyan to-neon-purple text-dark-bg">
                          Buy Credits
                        </Button>
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* AI Chatbot */}
      <Chatbot />
    </div>
  );
}
