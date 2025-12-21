import { Link } from "wouter";
import { Navigation } from "@/components/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, 
  Clock, 
  ArrowRight,
  ExternalLink,
  TrendingUp,
  Zap,
  Shield,
  Brain,
  Cloud,
  Code,
  Container,
  GitBranch,
  Database
} from "lucide-react";
import { SiMedium } from "react-icons/si";
import { motion } from "framer-motion";

const featuredArticles = [
  {
    title: "How to Build Faster CI/CD Pipelines in 2024",
    description: "Learn the best practices for optimizing your CI/CD workflows, reducing build times by up to 50%, and implementing parallel testing strategies.",
    category: "DevOps",
    readTime: "12 min read",
    icon: GitBranch,
    mediumLink: "https://medium.com/@devops-cloud/faster-ci-cd-pipelines-2024",
    featured: true,
    tags: ["CI/CD", "Performance", "Best Practices"]
  },
  {
    title: "Best Practices in Kubernetes for Production",
    description: "A comprehensive guide to running Kubernetes in production, covering security, scaling, monitoring, and disaster recovery strategies.",
    category: "Kubernetes",
    readTime: "15 min read",
    icon: Container,
    mediumLink: "https://medium.com/@devops-cloud/kubernetes-production-best-practices",
    featured: true,
    tags: ["Kubernetes", "Production", "Security"]
  },
  {
    title: "AI in DevOps: The Complete Guide",
    description: "Explore how AI is transforming DevOps workflows, from intelligent automation to predictive analytics and self-healing infrastructure.",
    category: "AI & DevOps",
    readTime: "10 min read",
    icon: Brain,
    mediumLink: "https://medium.com/@devops-cloud/ai-in-devops-complete-guide",
    featured: true,
    tags: ["AI", "Automation", "Future of DevOps"]
  }
];

const allArticles = [
  {
    title: "Infrastructure as Code: Terraform vs Pulumi vs CloudFormation",
    description: "A detailed comparison of the top IaC tools, helping you choose the right one for your team.",
    category: "Infrastructure",
    readTime: "8 min read",
    icon: Code,
    mediumLink: "https://medium.com/@devops-cloud/iac-comparison-2024",
    tags: ["Terraform", "Pulumi", "IaC"]
  },
  {
    title: "Multi-Cloud Strategy: Benefits and Challenges",
    description: "Learn when and how to implement a multi-cloud strategy without the complexity overhead.",
    category: "Cloud",
    readTime: "11 min read",
    icon: Cloud,
    mediumLink: "https://medium.com/@devops-cloud/multi-cloud-strategy-guide",
    tags: ["Multi-Cloud", "AWS", "GCP", "Azure"]
  },
  {
    title: "Container Security: A DevSecOps Approach",
    description: "Implement security at every stage of your container lifecycle with these proven practices.",
    category: "Security",
    readTime: "9 min read",
    icon: Shield,
    mediumLink: "https://medium.com/@devops-cloud/container-security-devsecops",
    tags: ["Security", "Containers", "DevSecOps"]
  },
  {
    title: "Optimizing Database Performance in the Cloud",
    description: "Tips and techniques for improving database performance in cloud-native applications.",
    category: "Database",
    readTime: "7 min read",
    icon: Database,
    mediumLink: "https://medium.com/@devops-cloud/cloud-database-optimization",
    tags: ["Database", "Performance", "Cloud"]
  },
  {
    title: "GitOps: The Modern Way to Deploy",
    description: "Understand GitOps principles and implement continuous deployment using Git as the single source of truth.",
    category: "DevOps",
    readTime: "10 min read",
    icon: GitBranch,
    mediumLink: "https://medium.com/@devops-cloud/gitops-modern-deployment",
    tags: ["GitOps", "ArgoCD", "Deployment"]
  },
  {
    title: "Serverless vs Containers: Making the Right Choice",
    description: "Compare serverless and container architectures to determine the best fit for your workloads.",
    category: "Architecture",
    readTime: "8 min read",
    icon: Zap,
    mediumLink: "https://medium.com/@devops-cloud/serverless-vs-containers",
    tags: ["Serverless", "Containers", "Architecture"]
  },
  {
    title: "Implementing Zero Trust Security in DevOps",
    description: "A practical guide to implementing zero trust security principles in your DevOps pipeline.",
    category: "Security",
    readTime: "12 min read",
    icon: Shield,
    mediumLink: "https://medium.com/@devops-cloud/zero-trust-devops",
    tags: ["Zero Trust", "Security", "DevOps"]
  },
  {
    title: "Cost Optimization Strategies for AWS, GCP, and Azure",
    description: "Reduce your cloud bill by up to 40% with these proven cost optimization techniques.",
    category: "Cloud",
    readTime: "14 min read",
    icon: TrendingUp,
    mediumLink: "https://medium.com/@devops-cloud/cloud-cost-optimization",
    tags: ["Cost Optimization", "AWS", "GCP", "Azure"]
  }
];

const categories = [
  { name: "All", count: 11 },
  { name: "DevOps", count: 3 },
  { name: "Kubernetes", count: 2 },
  { name: "Security", count: 2 },
  { name: "Cloud", count: 2 },
  { name: "AI & DevOps", count: 1 },
  { name: "Architecture", count: 1 }
];

export default function Blog() {
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
                Blog & Resources
              </Badge>
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                DevOps{" "}
                <span className="bg-gradient-to-r from-neon-cyan to-neon-purple bg-clip-text text-transparent">
                  Knowledge Hub
                </span>
              </h1>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                Expert insights, tutorials, and best practices for modern DevOps. 
                All articles are published on Medium for easy access.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-12"
            >
              <div className="flex items-center justify-center gap-4 mb-8 flex-wrap">
                {categories.map((category) => (
                  <Button
                    key={category.name}
                    variant={category.name === "All" ? "default" : "outline"}
                    className={category.name === "All" 
                      ? "bg-neon-cyan text-black hover:bg-neon-cyan/90" 
                      : "border-white/20 hover:bg-white/10"
                    }
                    size="sm"
                  >
                    {category.name}
                    <Badge className="ml-2 bg-white/10 text-white">{category.count}</Badge>
                  </Button>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-16"
            >
              <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-neon-cyan" />
                Featured Articles
              </h2>
              <div className="grid md:grid-cols-3 gap-6">
                {featuredArticles.map((article, index) => (
                  <motion.div
                    key={article.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                  >
                    <a href={article.mediumLink} target="_blank" rel="noopener noreferrer">
                      <Card className="bg-dark-card border-dark-border overflow-hidden h-full hover:border-neon-cyan/50 transition-all group cursor-pointer" data-testid={`featured-article-${index}`}>
                        <div className="h-2 bg-gradient-to-r from-neon-cyan to-neon-purple" />
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between mb-4">
                            <Badge className="bg-neon-cyan/20 text-neon-cyan border-neon-cyan/30">
                              {article.category}
                            </Badge>
                            <div className="flex items-center gap-1 text-gray-400 text-sm">
                              <Clock className="w-4 h-4" />
                              {article.readTime}
                            </div>
                          </div>
                          <div className="w-12 h-12 bg-neon-cyan/20 rounded-lg flex items-center justify-center mb-4">
                            <article.icon className="w-6 h-6 text-neon-cyan" />
                          </div>
                          <h3 className="text-xl font-bold text-white mb-3 group-hover:text-neon-cyan transition-colors">
                            {article.title}
                          </h3>
                          <p className="text-gray-400 mb-4 text-sm">{article.description}</p>
                          <div className="flex flex-wrap gap-2 mb-4">
                            {article.tags.map((tag) => (
                              <Badge key={tag} className="bg-gray-700 text-gray-300 text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                          <div className="flex items-center text-neon-cyan group-hover:underline">
                            <SiMedium className="w-5 h-5 mr-2" />
                            Read on Medium
                            <ExternalLink className="w-4 h-4 ml-2" />
                          </div>
                        </CardContent>
                      </Card>
                    </a>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mb-16"
            >
              <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-neon-purple" />
                All Articles
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                {allArticles.map((article, index) => (
                  <motion.div
                    key={article.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + index * 0.05 }}
                  >
                    <a href={article.mediumLink} target="_blank" rel="noopener noreferrer">
                      <Card className="bg-dark-card border-dark-border p-6 hover:border-neon-cyan/50 transition-all group cursor-pointer" data-testid={`article-${index}`}>
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-neon-purple/20 rounded-lg flex items-center justify-center flex-shrink-0">
                            <article.icon className="w-6 h-6 text-neon-purple" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <Badge className="bg-gray-700 text-gray-300 text-xs">
                                {article.category}
                              </Badge>
                              <div className="flex items-center gap-1 text-gray-400 text-xs">
                                <Clock className="w-3 h-3" />
                                {article.readTime}
                              </div>
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2 group-hover:text-neon-cyan transition-colors">
                              {article.title}
                            </h3>
                            <p className="text-gray-400 text-sm mb-3">{article.description}</p>
                            <div className="flex items-center text-sm text-neon-cyan group-hover:underline">
                              <SiMedium className="w-4 h-4 mr-1" />
                              Read on Medium
                              <ExternalLink className="w-3 h-3 ml-1" />
                            </div>
                          </div>
                        </div>
                      </Card>
                    </a>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mb-16"
            >
              <Card className="bg-dark-card border-dark-border p-8">
                <div className="flex flex-col md:flex-row items-center gap-8">
                  <div className="md:w-2/3">
                    <h3 className="text-2xl font-bold text-white mb-4">
                      Subscribe to Our Newsletter
                    </h3>
                    <p className="text-gray-400 mb-4">
                      Get the latest DevOps insights, tutorials, and platform updates 
                      delivered directly to your inbox. No spam, just valuable content.
                    </p>
                    <div className="flex gap-4">
                      <input 
                        type="email" 
                        placeholder="Enter your email"
                        className="flex-1 bg-dark-bg border border-dark-border rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-neon-cyan"
                        data-testid="input-newsletter-email"
                      />
                      <Button className="bg-neon-cyan text-black hover:bg-neon-cyan/90" data-testid="button-subscribe">
                        Subscribe
                      </Button>
                    </div>
                  </div>
                  <div className="md:w-1/3 flex justify-center">
                    <div className="w-32 h-32 bg-gradient-to-r from-neon-cyan to-neon-purple rounded-full flex items-center justify-center">
                      <BookOpen className="w-16 h-16 text-white" />
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="text-center"
            >
              <Card className="bg-gradient-to-r from-neon-cyan/10 to-neon-purple/10 border-neon-cyan/30 p-12">
                <SiMedium className="w-16 h-16 text-white mx-auto mb-6" />
                <h2 className="text-3xl font-bold text-white mb-4">
                  Follow Us on Medium
                </h2>
                <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
                  All our articles are published on Medium for easy reading and sharing. 
                  Follow our publication to stay updated with the latest DevOps content.
                </p>
                <a href="https://medium.com/@devops-cloud" target="_blank" rel="noopener noreferrer">
                  <Button size="lg" className="bg-white text-black hover:bg-gray-100" data-testid="button-follow-medium">
                    <SiMedium className="w-5 h-5 mr-2" />
                    Follow on Medium
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </Button>
                </a>
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
