import { Link } from "wouter";
import { Navigation } from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  DollarSign, 
  Clock, 
  Rocket, 
  Building2, 
  Users, 
  ArrowRight,
  Quote,
  CheckCircle2,
  BarChart3,
  Zap,
  Shield,
  Globe
} from "lucide-react";
import { motion } from "framer-motion";

const caseStudies = [
  {
    company: "TechScale Solutions",
    logo: "TS",
    industry: "SaaS / Cloud Services",
    size: "500+ employees",
    challenge: "Manual CI/CD pipelines took 45+ minutes, causing delayed releases and frustrated developers.",
    solution: "Implemented CloudForge's Visual Pipeline Builder and AI-powered optimization to automate their entire deployment workflow.",
    results: [
      { metric: "50%", label: "Faster Deployments", icon: Rocket },
      { metric: "$2.1M", label: "Annual Savings", icon: DollarSign },
      { metric: "99.9%", label: "Uptime Achieved", icon: CheckCircle2 },
      { metric: "10x", label: "More Releases/Month", icon: TrendingUp }
    ],
    quote: "CloudForge transformed our DevOps workflow. What used to take our team hours now happens in minutes. The AI suggestions alone saved us countless debugging sessions.",
    author: "Sarah Chen",
    role: "VP of Engineering",
    color: "from-cyan-500 to-blue-500"
  },
  {
    company: "FinServe Global",
    logo: "FG",
    industry: "Financial Services",
    size: "2000+ employees",
    challenge: "Complex multi-cloud infrastructure with security compliance requirements and high operational costs.",
    solution: "Deployed CloudForge's Multi-Cloud Cost Optimizer and Secret Scanner across AWS, GCP, and Azure environments.",
    results: [
      { metric: "40%", label: "Cost Reduction", icon: DollarSign },
      { metric: "Zero", label: "Security Breaches", icon: Shield },
      { metric: "3hrs", label: "Saved Daily", icon: Clock },
      { metric: "100%", label: "Compliance Score", icon: CheckCircle2 }
    ],
    quote: "The Secret Scanner caught exposed credentials we didn't even know existed. CloudForge paid for itself in the first month.",
    author: "Michael Rodriguez",
    role: "CISO",
    color: "from-purple-500 to-pink-500"
  },
  {
    company: "HealthTech Innovations",
    logo: "HI",
    industry: "Healthcare Technology",
    size: "150+ employees",
    challenge: "Scaling infrastructure to handle 10x patient data growth while maintaining HIPAA compliance.",
    solution: "Used CloudForge's Blueprint Generator and IaC Autofix to create compliant, auto-scaling infrastructure.",
    results: [
      { metric: "10x", label: "Scale Achieved", icon: TrendingUp },
      { metric: "75%", label: "Less Downtime", icon: Zap },
      { metric: "HIPAA", label: "Fully Compliant", icon: Shield },
      { metric: "2 weeks", label: "Setup Time", icon: Clock }
    ],
    quote: "We went from struggling with infrastructure to having a fully automated, compliant system in just two weeks. The AI assistant understood our HIPAA requirements perfectly.",
    author: "Dr. Amanda Foster",
    role: "CTO",
    color: "from-green-500 to-emerald-500"
  },
  {
    company: "E-Commerce Plus",
    logo: "E+",
    industry: "Retail / E-Commerce",
    size: "300+ employees",
    challenge: "Black Friday traffic spikes caused outages, losing millions in potential revenue.",
    solution: "Implemented CloudForge's Deployment Simulator and Auto Infra Cost Estimator for predictive scaling.",
    results: [
      { metric: "Zero", label: "Black Friday Outages", icon: CheckCircle2 },
      { metric: "$4.5M", label: "Revenue Protected", icon: DollarSign },
      { metric: "500%", label: "Traffic Handled", icon: Globe },
      { metric: "60%", label: "Infra Cost Savings", icon: TrendingUp }
    ],
    quote: "The Deployment Simulator predicted exactly where our bottlenecks would be. We handled 5x our normal traffic without a single hiccup.",
    author: "James Park",
    role: "Director of Platform Engineering",
    color: "from-orange-500 to-red-500"
  }
];

const stats = [
  { value: "500+", label: "Enterprise Customers", icon: Building2 },
  { value: "$50M+", label: "Customer Savings", icon: DollarSign },
  { value: "99.95%", label: "Average Uptime", icon: CheckCircle2 },
  { value: "50%", label: "Faster Deployments", icon: Rocket }
];

export default function CaseStudies() {
  return (
    <div className="min-h-screen bg-dark-bg text-white">
      <Navigation />
      
      <main className="pt-20">
        <section className="py-20 px-4">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-16"
            >
              <Badge className="bg-neon-cyan/20 text-neon-cyan border-neon-cyan/30 mb-4">
                Success Stories
              </Badge>
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Real Results from{" "}
                <span className="bg-gradient-to-r from-neon-cyan to-neon-purple bg-clip-text text-transparent">
                  Real Companies
                </span>
              </h1>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                See how leading enterprises transformed their DevOps workflows, 
                reduced costs, and accelerated deployments with CloudForge.
              </p>
            </motion.div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="bg-dark-card border-dark-border text-center p-6">
                    <stat.icon className="w-8 h-8 text-neon-cyan mx-auto mb-3" />
                    <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                    <div className="text-sm text-gray-400">{stat.label}</div>
                  </Card>
                </motion.div>
              ))}
            </div>

            <div className="space-y-12">
              {caseStudies.map((study, index) => (
                <motion.div
                  key={study.company}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.15 }}
                >
                  <Card className="bg-dark-card border-dark-border overflow-hidden" data-testid={`case-study-card-${index}`}>
                    <div className={`h-2 bg-gradient-to-r ${study.color}`} />
                    <CardContent className="p-8">
                      <div className="flex flex-col lg:flex-row gap-8">
                        <div className="lg:w-1/3">
                          <div className="flex items-center gap-4 mb-4">
                            <div className={`w-16 h-16 rounded-xl bg-gradient-to-r ${study.color} flex items-center justify-center text-white text-xl font-bold`}>
                              {study.logo}
                            </div>
                            <div>
                              <h3 className="text-2xl font-bold text-white">{study.company}</h3>
                              <p className="text-gray-400">{study.industry}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-gray-400 mb-6">
                            <Users className="w-4 h-4" />
                            <span>{study.size}</span>
                          </div>
                          
                          <div className="space-y-4">
                            <div>
                              <h4 className="text-sm font-semibold text-neon-cyan mb-2">THE CHALLENGE</h4>
                              <p className="text-gray-300">{study.challenge}</p>
                            </div>
                            <div>
                              <h4 className="text-sm font-semibold text-neon-purple mb-2">THE SOLUTION</h4>
                              <p className="text-gray-300">{study.solution}</p>
                            </div>
                          </div>
                        </div>

                        <div className="lg:w-2/3">
                          <h4 className="text-sm font-semibold text-white mb-4">KEY RESULTS</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                            {study.results.map((result, i) => (
                              <div key={i} className="bg-dark-bg/50 rounded-lg p-4 text-center">
                                <result.icon className="w-6 h-6 text-neon-cyan mx-auto mb-2" />
                                <div className="text-2xl font-bold text-white">{result.metric}</div>
                                <div className="text-xs text-gray-400">{result.label}</div>
                              </div>
                            ))}
                          </div>

                          <div className="bg-dark-bg/30 rounded-xl p-6 border border-dark-border">
                            <Quote className="w-8 h-8 text-neon-cyan/30 mb-4" />
                            <p className="text-lg text-gray-300 italic mb-4">"{study.quote}"</p>
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-full bg-gradient-to-r ${study.color} flex items-center justify-center text-white text-sm font-bold`}>
                                {study.author.split(' ').map(n => n[0]).join('')}
                              </div>
                              <div>
                                <div className="text-white font-medium">{study.author}</div>
                                <div className="text-sm text-gray-400">{study.role}, {study.company}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mt-20 text-center"
            >
              <Card className="bg-gradient-to-r from-neon-cyan/10 to-neon-purple/10 border-neon-cyan/30 p-12">
                <h2 className="text-3xl font-bold text-white mb-4">
                  Ready to Write Your Success Story?
                </h2>
                <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
                  Join 500+ enterprises that have transformed their DevOps workflows with CloudForge. 
                  Start your free trial today and see results in minutes.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/auth">
                    <Button size="lg" className="bg-neon-cyan text-black hover:bg-neon-cyan/90" data-testid="button-start-trial">
                      Start Free Trial
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                  <Link href="/pricing">
                    <Button size="lg" variant="outline" className="border-white/20 hover:bg-white/10" data-testid="button-view-pricing">
                      View Pricing
                    </Button>
                  </Link>
                </div>
              </Card>
            </motion.div>
          </div>
        </section>

        <footer className="bg-dark-card border-t border-dark-border py-12">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <p className="text-gray-400">
              © 2024 CloudForge. All rights reserved.
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}
