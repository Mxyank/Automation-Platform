import { Link } from "wouter";
import { Navigation } from "@/components/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Rocket, 
  Target, 
  Heart, 
  Users, 
  Globe, 
  Award,
  Linkedin,
  Twitter,
  Github,
  ArrowRight,
  Zap,
  Shield,
  Brain,
  Code
} from "lucide-react";
import { motion } from "framer-motion";

const team = [
  {
    name: "Mayank Agrawal",
    role: "Founder & CEO",
    bio: "Former DevOps Lead at top tech companies. 10+ years experience in cloud infrastructure and automation.",
    avatar: "MA",
    linkedin: "#",
    twitter: "#",
    github: "#"
  },
  {
    name: "Priya Sharma",
    role: "CTO",
    bio: "Ex-Google engineer specializing in AI/ML systems. Built scalable platforms serving millions of users.",
    avatar: "PS",
    linkedin: "#",
    twitter: "#",
    github: "#"
  },
  {
    name: "Alex Chen",
    role: "VP of Engineering",
    bio: "15+ years in enterprise software. Previously led infrastructure teams at AWS and Microsoft.",
    avatar: "AC",
    linkedin: "#",
    twitter: "#",
    github: "#"
  },
  {
    name: "Sarah Johnson",
    role: "Head of Product",
    bio: "Product leader with experience at Kubernetes, Docker, and HashiCorp. Passionate about developer experience.",
    avatar: "SJ",
    linkedin: "#",
    twitter: "#",
    github: "#"
  }
];

const values = [
  {
    icon: Zap,
    title: "Speed Matters",
    description: "We believe developers shouldn't wait. Every feature we build is optimized for instant results."
  },
  {
    icon: Shield,
    title: "Security First",
    description: "Enterprise-grade security isn't optional. It's built into every layer of our platform."
  },
  {
    icon: Brain,
    title: "AI-Powered",
    description: "We leverage cutting-edge AI to automate repetitive tasks and provide intelligent insights."
  },
  {
    icon: Heart,
    title: "Developer Love",
    description: "Built by developers, for developers. We understand your pain points because we've lived them."
  }
];

const milestones = [
  { year: "2022", event: "CloudForge founded with a vision to democratize DevOps" },
  { year: "2023", event: "Launched AI-powered code generation and raised Series A" },
  { year: "2023", event: "Reached 10,000 developers on the platform" },
  { year: "2024", event: "Expanded to enterprise with 500+ companies onboard" },
  { year: "2024", event: "Launched 10 advanced AI features including Blueprint Generator" }
];

const press = [
  { outlet: "TechCrunch", quote: "CloudForge is revolutionizing how teams approach DevOps automation." },
  { outlet: "Forbes", quote: "One of the most promising AI-powered developer tools of 2024." },
  { outlet: "The Verge", quote: "Making enterprise DevOps accessible to teams of all sizes." }
];

export default function About() {
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
              <Badge className="bg-neon-purple/20 text-neon-purple border-neon-purple/30 mb-4">
                About Us
              </Badge>
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Building the Future of{" "}
                <span className="bg-gradient-to-r from-neon-cyan to-neon-purple bg-clip-text text-transparent">
                  DevOps
                </span>
              </h1>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                We're on a mission to make DevOps automation accessible to every developer, 
                from solo hackers to enterprise teams.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-20"
            >
              <Card className="bg-gradient-to-r from-neon-cyan/10 to-neon-purple/10 border-neon-cyan/30">
                <CardContent className="p-12">
                  <div className="flex flex-col md:flex-row items-center gap-8">
                    <div className="md:w-1/2">
                      <h2 className="text-3xl font-bold text-white mb-4">Our Story</h2>
                      <div className="space-y-4 text-gray-300">
                        <p>
                          CloudForge was born from frustration. As DevOps engineers, we spent countless 
                          hours writing repetitive YAML files, debugging CI/CD pipelines, and managing 
                          infrastructure across multiple clouds.
                        </p>
                        <p>
                          We knew there had to be a better way. What if AI could understand your 
                          infrastructure needs and generate production-ready code in seconds? What if 
                          deploying to the cloud was as simple as describing what you want?
                        </p>
                        <p>
                          That vision became CloudForge - an AI-powered DevOps platform that turns 
                          hours of work into minutes, helping teams focus on building products instead 
                          of fighting infrastructure.
                        </p>
                      </div>
                    </div>
                    <div className="md:w-1/2 flex justify-center">
                      <div className="relative">
                        <div className="w-64 h-64 bg-gradient-to-r from-neon-cyan to-neon-purple rounded-full opacity-20 blur-3xl absolute" />
                        <div className="relative bg-dark-card border border-dark-border rounded-2xl p-8">
                          <Rocket className="w-32 h-32 text-neon-cyan mx-auto" />
                          <p className="text-center text-white font-bold mt-4">Since 2022</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-20"
            >
              <h2 className="text-3xl font-bold text-center text-white mb-12">
                Our <span className="text-neon-cyan">Mission</span> & Values
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="bg-dark-card border-dark-border p-8">
                  <Target className="w-12 h-12 text-neon-cyan mb-4" />
                  <h3 className="text-2xl font-bold text-white mb-4">Our Mission</h3>
                  <p className="text-gray-300">
                    To democratize DevOps by making enterprise-grade automation accessible to 
                    every developer. We believe that infrastructure should be an enabler, not a 
                    barrier, to shipping great software.
                  </p>
                </Card>
                <Card className="bg-dark-card border-dark-border p-8">
                  <Globe className="w-12 h-12 text-neon-purple mb-4" />
                  <h3 className="text-2xl font-bold text-white mb-4">Our Vision</h3>
                  <p className="text-gray-300">
                    A world where any developer can deploy production-ready infrastructure in 
                    minutes, not months. Where AI handles the complexity while humans focus on 
                    creativity and innovation.
                  </p>
                </Card>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-20"
            >
              <h2 className="text-3xl font-bold text-center text-white mb-12">
                What We <span className="text-neon-purple">Believe</span>
              </h2>
              <div className="grid md:grid-cols-4 gap-6">
                {values.map((value, index) => (
                  <motion.div
                    key={value.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                  >
                    <Card className="bg-dark-card border-dark-border p-6 h-full hover:border-neon-cyan/50 transition-colors">
                      <value.icon className="w-10 h-10 text-neon-cyan mb-4" />
                      <h3 className="text-lg font-bold text-white mb-2">{value.title}</h3>
                      <p className="text-sm text-gray-400">{value.description}</p>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mb-20"
            >
              <h2 className="text-3xl font-bold text-center text-white mb-12">
                Meet the <span className="text-neon-cyan">Team</span>
              </h2>
              <div className="grid md:grid-cols-4 gap-6">
                {team.map((member, index) => (
                  <motion.div
                    key={member.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                  >
                    <Card className="bg-dark-card border-dark-border overflow-hidden h-full" data-testid={`team-member-${index}`}>
                      <div className="h-2 bg-gradient-to-r from-neon-cyan to-neon-purple" />
                      <CardContent className="p-6 text-center">
                        <div className="w-20 h-20 bg-gradient-to-r from-neon-cyan to-neon-purple rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                          {member.avatar}
                        </div>
                        <h3 className="text-lg font-bold text-white">{member.name}</h3>
                        <p className="text-sm text-neon-cyan mb-3">{member.role}</p>
                        <p className="text-sm text-gray-400 mb-4">{member.bio}</p>
                        <div className="flex justify-center gap-3">
                          <a href={member.linkedin} className="text-gray-400 hover:text-neon-cyan transition-colors">
                            <Linkedin className="w-5 h-5" />
                          </a>
                          <a href={member.twitter} className="text-gray-400 hover:text-neon-cyan transition-colors">
                            <Twitter className="w-5 h-5" />
                          </a>
                          <a href={member.github} className="text-gray-400 hover:text-neon-cyan transition-colors">
                            <Github className="w-5 h-5" />
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
              transition={{ delay: 0.5 }}
              className="mb-20"
            >
              <h2 className="text-3xl font-bold text-center text-white mb-12">
                Our <span className="text-neon-purple">Journey</span>
              </h2>
              <div className="relative">
                <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-gradient-to-b from-neon-cyan to-neon-purple" />
                <div className="space-y-8">
                  {milestones.map((milestone, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                      className={`flex items-center ${index % 2 === 0 ? 'justify-start' : 'justify-end'}`}
                    >
                      <Card className={`bg-dark-card border-dark-border p-6 max-w-md ${index % 2 === 0 ? 'mr-8' : 'ml-8'}`}>
                        <Badge className="bg-neon-cyan/20 text-neon-cyan border-neon-cyan/30 mb-2">
                          {milestone.year}
                        </Badge>
                        <p className="text-gray-300">{milestone.event}</p>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mb-20"
            >
              <h2 className="text-3xl font-bold text-center text-white mb-12">
                In the <span className="text-neon-cyan">Press</span>
              </h2>
              <div className="grid md:grid-cols-3 gap-6">
                {press.map((item, index) => (
                  <Card key={index} className="bg-dark-card border-dark-border p-6">
                    <Award className="w-8 h-8 text-neon-cyan mb-4" />
                    <p className="text-gray-300 italic mb-4">"{item.quote}"</p>
                    <p className="text-neon-purple font-bold">{item.outlet}</p>
                  </Card>
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
                  Join Us on Our Mission
                </h2>
                <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
                  We're always looking for talented individuals who share our passion for 
                  developer tools and AI. Check out our open positions or get in touch.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/auth">
                    <Button size="lg" className="bg-neon-cyan text-black hover:bg-neon-cyan/90" data-testid="button-get-started">
                      Get Started Free
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                  <Link href="/community">
                    <Button size="lg" variant="outline" className="border-white/20 hover:bg-white/10" data-testid="button-join-community">
                      Join Community
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
