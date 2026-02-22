import { Navigation } from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
  Database,
  Container,
  Brain,
  Code,
  GitBranch,
  Zap,
  Check,
  Play,
  ArrowRight,
  Cloud,
  Star,
  Users,
  Shield,
  Rocket,
  Globe,
  Layers,
  Settings,
  Download,
  Copy,
  Terminal,
  Award,
  Timer,
  TrendingUp,
  DollarSign,
  ChevronRight,
  Github,
  Twitter,
  Linkedin,
  BookOpen,
  Sparkles,
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
  Flame,
  Crown,
  CreditCard,
  Clock,
  Tag,
  Gift,
  CheckCircle,
  XCircle,
  AlertTriangle
} from "lucide-react";

interface SiteSetting {
  id: number;
  key: string;
  value: boolean;
  stringValue?: string;
  numberValue?: number;
  label: string;
  description?: string;
}

const pricingPlans = [
  {
    name: "Free",
    price: "₹0",
    period: "forever",
    description: "Perfect for trying out Prometix",
    credits: "2",
    features: [
      "2 free credits on signup",
      "Access to all generators",
      "Basic AI assistance",
      "Community support",
      "Standard processing"
    ],
    cta: "Get Started",
    href: "/auth",
    popular: false,
    icon: Rocket
  },
  {
    name: "Starter",
    price: "₹99",
    period: "one-time",
    description: "Great for small projects",
    credits: "10",
    features: [
      "10 credits",
      "All generator features",
      "Priority AI processing",
      "Email support",
      "7-day history"
    ],
    cta: "Buy Credits",
    href: "/checkout/starter",
    popular: false,
    icon: Zap
  },
  {
    name: "Professional",
    price: "₹249",
    period: "one-time",
    description: "Best value for developers",
    credits: "30",
    features: [
      "30 credits",
      "Advanced AI features",
      "Priority support",
      "Extended history",
      "Bulk generation"
    ],
    cta: "Buy Credits",
    href: "/checkout/professional",
    popular: true,
    icon: Star
  },
  {
    name: "Enterprise",
    price: "₹499",
    period: "one-time",
    description: "For teams and agencies",
    credits: "75",
    features: [
      "75 credits",
      "Premium AI access",
      "Dedicated support",
      "Unlimited history",
      "Custom templates"
    ],
    cta: "Buy Credits",
    href: "/checkout/enterprise",
    popular: false,
    icon: Crown
  }
];

const subscriptionPlans = [
  {
    name: "AI Pro Monthly",
    price: "₹199",
    period: "/month",
    description: "Unlimited AI Assistant access",
    features: [
      "Unlimited AI queries",
      "Advanced DevOps analysis",
      "Priority response time",
      "Log analysis & debugging",
      "YAML generation",
      "Dockerfile optimization",
      "Cancel anytime"
    ],
    cta: "Subscribe Now",
    href: "/checkout/ai-pro-monthly",
    popular: true,
    icon: Sparkles
  },
  {
    name: "AI Pro Annual",
    price: "₹1,999",
    period: "/year",
    description: "Save 17% with annual billing",
    features: [
      "Everything in Monthly",
      "2 months free",
      "Early access to features",
      "Dedicated AI model",
      "Custom fine-tuning",
      "Priority support",
      "Best value"
    ],
    cta: "Subscribe Now",
    href: "/checkout/ai-pro-annual",
    popular: false,
    icon: Crown
  }
];

const faqs = [
  {
    question: "What are credits?",
    answer: "Credits are used to generate code, configurations, and use AI features. Each generation typically costs 1 credit. New users get 2 free credits to start."
  },
  {
    question: "Do credits expire?",
    answer: "No, your credits never expire. Once purchased, they remain in your account until you use them."
  },
  {
    question: "What's included in AI Pro subscription?",
    answer: "AI Pro gives you unlimited access to our AI DevOps Assistant, including log analysis, YAML generation, Dockerfile optimization, and general DevOps consultation."
  },
  {
    question: "Can I cancel my subscription?",
    answer: "Yes, you can cancel your AI Pro subscription at any time. You'll continue to have access until the end of your billing period."
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept all major credit/debit cards, UPI, net banking, and wallet payments through Razorpay."
  },
  {
    question: "Is there a refund policy?",
    answer: "Unused credits can be refunded within 30 days of purchase. Subscription refunds are pro-rated based on usage."
  }
];

export default function PricingPage() {
  const { data: settings } = useQuery<SiteSetting[]>({
    queryKey: ['/api/site-settings'],
  });

  const getSetting = (key: string) => settings?.find(s => s.key === key);
  const isSaleActive = getSetting('sale_active')?.value || false;
  const salePercentage = getSetting('sale_percentage')?.numberValue || 0;
  const saleDescription = getSetting('sale_description')?.stringValue || 'Special Offer';

  const calculateDiscountedPrice = (priceStr: string) => {
    if (!isSaleActive || salePercentage === 0) return priceStr;
    const price = parseInt(priceStr.replace('₹', ''));
    if (isNaN(price)) return priceStr;
    const discountedPrice = Math.round(price * (1 - salePercentage / 100));
    return `₹${discountedPrice}`;
  };

  return (
    <div className="min-h-screen bg-dark-bg">
      <Navigation />

      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Active Sale Banner */}
          {isSaleActive && salePercentage > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <div
                className={`p-4 rounded-xl border bg-gradient-to-r from-purple-900 to-blue-900 border-purple-500 flex items-center justify-center gap-3`}
                data-testid={`banner-sale`}
              >
                <Sparkles className={`w-6 h-6 text-purple-400 animate-pulse`} />
                <span className={`text-lg font-bold text-white`}>
                  {saleDescription} - Get {salePercentage}% OFF!
                </span>
                <Sparkles className={`w-6 h-6 text-purple-400 animate-pulse`} />
              </div>
            </motion.div>
          )}

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <Badge className="bg-neon-cyan/20 text-neon-cyan border-neon-cyan/30 mb-4">
              <CreditCard className="w-3 h-3 mr-1" />
              Flexible Pricing
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Simple, Transparent Pricing
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Pay only for what you use with credits, or subscribe for unlimited AI access. No hidden fees.
            </p>
          </motion.div>

          {/* Credit Packages */}
          <div className="mb-20">
            <h2 className="text-2xl font-bold text-white text-center mb-8">
              Credit Packages
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {pricingPlans.map((plan, index) => {
                const Icon = plan.icon;
                const originalPrice = plan.price;
                const discountedPrice = calculateDiscountedPrice(originalPrice);
                const isDiscounted = originalPrice !== discountedPrice;

                return (
                  <motion.div
                    key={plan.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className={`relative h-full bg-dark-card border-dark-border hover:border-neon-cyan/50 transition-all duration-300 ${plan.popular ? 'ring-2 ring-neon-cyan' : ''}`}>
                      {plan.popular && (
                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                          <Badge className="bg-neon-cyan text-dark-bg font-medium">
                            Most Popular
                          </Badge>
                        </div>
                      )}
                      <CardHeader className="text-center pb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-neon-cyan to-neon-purple rounded-xl flex items-center justify-center mx-auto mb-4">
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <CardTitle className="text-white text-xl">{plan.name}</CardTitle>
                        <div className="mt-4">
                          {isDiscounted ? (
                            <>
                              <span className="text-xl text-gray-500 line-through mr-2">{originalPrice}</span>
                              <span className="text-4xl font-bold text-white">{discountedPrice}</span>
                            </>
                          ) : (
                            <span className="text-4xl font-bold text-white">{plan.price}</span>
                          )}
                          <span className="text-gray-400 ml-1">{plan.period}</span>
                        </div>
                        <p className="text-gray-400 text-sm mt-2">{plan.description}</p>
                        <Badge variant="outline" className="mt-3 border-neon-cyan text-neon-cyan">
                          {plan.credits} Credits
                        </Badge>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-3 mb-6">
                          {plan.features.map((feature, idx) => (
                            <li key={idx} className="flex items-center text-gray-300 text-sm">
                              <Check className="w-4 h-4 text-neon-cyan mr-2 flex-shrink-0" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                        <Link href={plan.href}>
                          <Button
                            className={`w-full ${plan.popular ? 'bg-neon-cyan text-dark-bg hover:bg-neon-cyan/90' : 'bg-dark-border text-white hover:bg-gray-700'}`}
                            data-testid={`btn-${plan.name.toLowerCase()}-plan`}
                          >
                            {plan.cta}
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* AI Pro Subscription */}
          <div className="mb-20">
            <div className="text-center mb-8">
              <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 mb-4">
                <Sparkles className="w-3 h-3 mr-1" />
                AI Subscription
              </Badge>
              <h2 className="text-2xl font-bold text-white">
                AI Pro - Unlimited AI Access
              </h2>
              <p className="text-gray-400 mt-2">
                Subscribe for unlimited AI DevOps Assistant queries
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {subscriptionPlans.map((plan, index) => {
                const Icon = plan.icon;
                return (
                  <motion.div
                    key={plan.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className={`relative h-full bg-gradient-to-br from-purple-900/30 to-blue-900/30 border-purple-500/30 hover:border-purple-500/50 transition-all duration-300 ${plan.popular ? 'ring-2 ring-purple-500' : ''}`}>
                      {plan.popular && (
                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                          <Badge className="bg-purple-500 text-white font-medium">
                            Recommended
                          </Badge>
                        </div>
                      )}
                      <CardHeader className="text-center pb-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                          <Icon className="w-7 h-7 text-white" />
                        </div>
                        <CardTitle className="text-white text-xl">{plan.name}</CardTitle>
                        <div className="mt-4">
                          <span className="text-4xl font-bold text-white">{plan.price}</span>
                          <span className="text-gray-400 ml-1">{plan.period}</span>
                        </div>
                        <p className="text-gray-400 text-sm mt-2">{plan.description}</p>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-3 mb-6">
                          {plan.features.map((feature, idx) => (
                            <li key={idx} className="flex items-center text-gray-300 text-sm">
                              <Check className="w-4 h-4 text-purple-400 mr-2 flex-shrink-0" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                        <Link href={plan.href}>
                          <Button
                            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                            data-testid={`btn-${plan.name.toLowerCase().replace(/\s+/g, '-')}`}
                          >
                            {plan.cta}
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Features Comparison */}
          <div className="mb-20">
            <h2 className="text-2xl font-bold text-white text-center mb-8">
              Why Choose Prometix?
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  icon: Shield,
                  title: "Secure & Private",
                  description: "Your code and data never leave our secure servers. Enterprise-grade security."
                },
                {
                  icon: Clock,
                  title: "Instant Generation",
                  description: "Generate production-ready code in seconds, not hours."
                },
                {
                  icon: Users,
                  title: "Built for DevOps",
                  description: "Designed by DevOps engineers, for DevOps engineers."
                }
              ].map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <Card key={index} className="bg-dark-card border-dark-border text-center p-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-neon-cyan/20 to-neon-purple/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <Icon className="w-6 h-6 text-neon-cyan" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                    <p className="text-gray-400 text-sm">{feature.description}</p>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* FAQ */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-white text-center mb-8">
              Frequently Asked Questions
            </h2>
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {faqs.map((faq, index) => (
                <Card key={index} className="bg-dark-card border-dark-border p-6">
                  <h3 className="text-white font-semibold mb-2">{faq.question}</h3>
                  <p className="text-gray-400 text-sm">{faq.answer}</p>
                </Card>
              ))}
            </div>
          </div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center bg-gradient-to-r from-neon-cyan/20 to-neon-purple/20 rounded-2xl p-8 border border-neon-cyan/30"
          >
            <h2 className="text-2xl font-bold text-white mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-gray-400 mb-6">
              Join thousands of developers using Prometix to automate their DevOps workflows.
            </p>
            <Link href="/auth">
              <Button className="bg-neon-cyan text-dark-bg hover:bg-neon-cyan/90 px-8 py-3 text-lg" data-testid="btn-cta-signup">
                Start Free Today
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
