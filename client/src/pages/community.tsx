import { Link } from "wouter";
import { Navigation } from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  MessageCircle, 
  Users, 
  BookOpen, 
  Github, 
  Lightbulb,
  Code,
  Video,
  FileText,
  ArrowRight,
  ExternalLink,
  Star,
  GitFork,
  Heart,
  Zap,
  Globe,
  Trophy
} from "lucide-react";
import { SiDiscord, SiSlack, SiYoutube, SiReddit } from "react-icons/si";
import { Twitter } from "lucide-react";
import { motion } from "framer-motion";

const communityLinks = [
  {
    name: "Discord Community",
    description: "Join 10,000+ developers discussing DevOps, sharing tips, and getting help in real-time.",
    icon: SiDiscord,
    color: "from-indigo-500 to-purple-600",
    members: "10,000+",
    link: "https://discord.gg/prometix",
    cta: "Join Discord"
  },
  {
    name: "Slack Workspace",
    description: "Connect with enterprise teams and get dedicated support from our engineering team.",
    icon: SiSlack,
    color: "from-purple-500 to-pink-500",
    members: "5,000+",
    link: "https://prometix.slack.com",
    cta: "Join Slack"
  },
  {
    name: "GitHub Discussions",
    description: "Participate in technical discussions, report issues, and contribute to open-source tools.",
    icon: Github,
    color: "from-gray-600 to-gray-800",
    members: "8,000+",
    link: "https://github.com/prometix/discussions",
    cta: "Visit GitHub"
  }
];

const openSourceTools = [
  {
    name: "Prometix CLI",
    description: "Command-line tool for managing infrastructure and deployments from your terminal.",
    stars: "2.4k",
    forks: "340",
    language: "Go",
    link: "https://github.com/prometix/cli"
  },
  {
    name: "Pipeline Validator",
    description: "Open-source CI/CD pipeline validator supporting GitHub Actions, GitLab CI, and Jenkins.",
    stars: "1.8k",
    forks: "210",
    language: "TypeScript",
    link: "https://github.com/prometix/pipeline-validator"
  },
  {
    name: "IaC Linter",
    description: "Static analysis tool for Terraform, Pulumi, and CloudFormation templates.",
    stars: "1.2k",
    forks: "150",
    language: "Python",
    link: "https://github.com/prometix/iac-linter"
  },
  {
    name: "Secret Detector",
    description: "Pre-commit hooks and GitHub Actions for detecting exposed secrets in code.",
    stars: "980",
    forks: "120",
    language: "Rust",
    link: "https://github.com/prometix/secret-detector"
  }
];

const tutorials = [
  {
    title: "Getting Started with Prometix",
    duration: "15 min read",
    type: "Guide",
    icon: BookOpen
  },
  {
    title: "Building CI/CD Pipelines from Scratch",
    duration: "30 min video",
    type: "Video",
    icon: Video
  },
  {
    title: "Kubernetes Deployment Best Practices",
    duration: "20 min read",
    type: "Tutorial",
    icon: FileText
  },
  {
    title: "AI-Powered Infrastructure Management",
    duration: "25 min video",
    type: "Webinar",
    icon: Video
  },
  {
    title: "Multi-Cloud Cost Optimization",
    duration: "18 min read",
    type: "Guide",
    icon: BookOpen
  },
  {
    title: "Security Scanning for DevOps Teams",
    duration: "22 min read",
    type: "Tutorial",
    icon: FileText
  }
];

const featureRequests = [
  { title: "GitLab CI Integration", votes: 342, status: "In Progress" },
  { title: "Azure DevOps Support", votes: 289, status: "Planned" },
  { title: "Pulumi Native Support", votes: 256, status: "Under Review" },
  { title: "ArgoCD Integration", votes: 198, status: "Planned" },
  { title: "Custom AI Model Training", votes: 167, status: "Under Review" }
];

const stats = [
  { value: "25K+", label: "Community Members", icon: Users },
  { value: "500+", label: "Contributors", icon: Heart },
  { value: "1M+", label: "Deployments", icon: Zap },
  { value: "50+", label: "Countries", icon: Globe }
];

export default function Community() {
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
                Community
              </Badge>
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Join Our{" "}
                <span className="bg-gradient-to-r from-neon-cyan to-neon-purple bg-clip-text text-transparent">
                  Developer Community
                </span>
              </h1>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                Connect with thousands of DevOps engineers, share knowledge, 
                and help shape the future of Prometix.
              </p>
            </motion.div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
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

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-16"
            >
              <h2 className="text-3xl font-bold text-center text-white mb-8">
                Join the <span className="text-neon-cyan">Conversation</span>
              </h2>
              <div className="grid md:grid-cols-3 gap-6">
                {communityLinks.map((community, index) => (
                  <motion.div
                    key={community.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                  >
                    <Card className="bg-dark-card border-dark-border overflow-hidden h-full hover:border-neon-cyan/50 transition-all" data-testid={`community-card-${index}`}>
                      <div className={`h-2 bg-gradient-to-r ${community.color}`} />
                      <CardContent className="p-6">
                        <community.icon className="w-12 h-12 text-white mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">{community.name}</h3>
                        <p className="text-gray-400 mb-4">{community.description}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm text-gray-400">
                            <Users className="w-4 h-4" />
                            <span>{community.members} members</span>
                          </div>
                          <a href={community.link} target="_blank" rel="noopener noreferrer">
                            <Button size="sm" className={`bg-gradient-to-r ${community.color} text-white`}>
                              {community.cta}
                              <ExternalLink className="w-3 h-3 ml-2" />
                            </Button>
                          </a>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-16"
            >
              <h2 className="text-3xl font-bold text-center text-white mb-8">
                Open Source <span className="text-neon-purple">Tools</span>
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                {openSourceTools.map((tool, index) => (
                  <motion.div
                    key={tool.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                  >
                    <Card className="bg-dark-card border-dark-border p-6 hover:border-neon-cyan/50 transition-all">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-bold text-white">{tool.name}</h3>
                          <Badge className="bg-gray-700 text-gray-300 mt-1">{tool.language}</Badge>
                        </div>
                        <a href={tool.link} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" variant="outline" className="border-white/20">
                            <Github className="w-4 h-4 mr-2" />
                            View
                          </Button>
                        </a>
                      </div>
                      <p className="text-gray-400 mb-4">{tool.description}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500" />
                          <span>{tool.stars}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <GitFork className="w-4 h-4" />
                          <span>{tool.forks}</span>
                        </div>
                      </div>
                    </Card>
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
              <h2 className="text-3xl font-bold text-center text-white mb-8">
                Tutorials & <span className="text-neon-cyan">Resources</span>
              </h2>
              <div className="grid md:grid-cols-3 gap-6">
                {tutorials.map((tutorial, index) => (
                  <motion.div
                    key={tutorial.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + index * 0.05 }}
                  >
                    <Card className="bg-dark-card border-dark-border p-6 hover:border-neon-cyan/50 transition-all cursor-pointer">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-neon-cyan/20 rounded-lg flex items-center justify-center">
                          <tutorial.icon className="w-6 h-6 text-neon-cyan" />
                        </div>
                        <div>
                          <h3 className="text-white font-medium mb-1">{tutorial.title}</h3>
                          <div className="flex items-center gap-2 text-sm text-gray-400">
                            <Badge className="bg-gray-700 text-gray-300 text-xs">{tutorial.type}</Badge>
                            <span>{tutorial.duration}</span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
              <div className="text-center mt-8">
                <Link href="/docs">
                  <Button variant="outline" className="border-white/20 hover:bg-white/10">
                    View All Resources
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mb-16"
            >
              <h2 className="text-3xl font-bold text-center text-white mb-8">
                Feature <span className="text-neon-purple">Requests</span>
              </h2>
              <Card className="bg-dark-card border-dark-border">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-neon-cyan" />
                    Top Requested Features
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {featureRequests.map((request, index) => (
                      <div key={request.title} className="flex items-center justify-between p-4 bg-dark-bg/50 rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="text-2xl font-bold text-neon-cyan">#{index + 1}</div>
                          <div>
                            <h4 className="text-white font-medium">{request.title}</h4>
                            <div className="flex items-center gap-2 text-sm text-gray-400">
                              <Trophy className="w-4 h-4" />
                              <span>{request.votes} votes</span>
                            </div>
                          </div>
                        </div>
                        <Badge className={`
                          ${request.status === 'In Progress' ? 'bg-green-500/20 text-green-400 border-green-500/30' : ''}
                          ${request.status === 'Planned' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : ''}
                          ${request.status === 'Under Review' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' : ''}
                        `}>
                          {request.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 text-center">
                    <Button className="bg-neon-cyan text-black hover:bg-neon-cyan/90">
                      Submit Feature Request
                      <Lightbulb className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mb-16"
            >
              <h2 className="text-3xl font-bold text-center text-white mb-8">
                Follow Us <span className="text-neon-cyan">Everywhere</span>
              </h2>
              <div className="flex flex-wrap justify-center gap-4">
                {[
                  { icon: Twitter, name: "Twitter", link: "https://twitter.com/prometix", color: "hover:bg-blue-500" },
                  { icon: SiYoutube, name: "YouTube", link: "https://youtube.com/@prometix", color: "hover:bg-red-500" },
                  { icon: SiReddit, name: "Reddit", link: "https://reddit.com/r/prometix", color: "hover:bg-orange-500" },
                  { icon: Github, name: "GitHub", link: "https://github.com/prometix", color: "hover:bg-gray-600" },
                ].map((social) => (
                  <a key={social.name} href={social.link} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" className={`border-white/20 ${social.color} hover:text-white transition-all`}>
                      <social.icon className="w-5 h-5 mr-2" />
                      {social.name}
                    </Button>
                  </a>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="text-center"
            >
              <Card className="bg-gradient-to-r from-neon-cyan/10 to-neon-purple/10 border-neon-cyan/30 p-12">
                <h2 className="text-3xl font-bold text-white mb-4">
                  Ready to Get Involved?
                </h2>
                <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
                  Whether you're looking for help, want to contribute, or just want to 
                  connect with like-minded developers, we'd love to have you.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <a href="https://discord.gg/prometix" target="_blank" rel="noopener noreferrer">
                    <Button size="lg" className="bg-indigo-600 text-white hover:bg-indigo-700" data-testid="button-join-discord">
                      <SiDiscord className="w-5 h-5 mr-2" />
                      Join Discord
                    </Button>
                  </a>
                  <Link href="/auth">
                    <Button size="lg" className="bg-neon-cyan text-black hover:bg-neon-cyan/90" data-testid="button-start-free">
                      Start Free
                      <ArrowRight className="w-4 h-4 ml-2" />
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
              © 2024 Prometix. All rights reserved.
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}
