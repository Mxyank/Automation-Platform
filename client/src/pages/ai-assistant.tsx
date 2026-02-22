import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useFeatures } from "@/hooks/use-features";
import { FeatureDisabledOverlay } from "@/components/feature-disabled-overlay";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Send,
  Sparkles,
  Bot,
  User,
  Copy,
  Check,
  Loader2,
  Cloud,
  Server,
  Container,
  GitBranch,
  Shield,
  Zap,
  Terminal,
  BookOpen,
  Lightbulb,
  Code,
  Database,
  Crown,
  Star,
  CreditCard,
  Rocket,
  X,
  ExternalLink,
  Globe,
  Search
} from "lucide-react";

interface WebSource {
  title: string;
  url: string;
  description: string;
  source: string;
  favicon?: string;
}

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isTyping?: boolean;
  webSources?: WebSource[];
}

const suggestedQuestions = [
  {
    icon: Cloud,
    question: "How to set up a multi-region AWS deployment?",
    category: "AWS"
  },
  {
    icon: Container,
    question: "Best practices for Docker container optimization",
    category: "Docker"
  },
  {
    icon: GitBranch,
    question: "Create a CI/CD pipeline with GitHub Actions",
    category: "CI/CD"
  },
  {
    icon: Database,
    question: "Database scaling strategies for high traffic",
    category: "Database"
  },
  {
    icon: Shield,
    question: "Kubernetes security best practices",
    category: "Security"
  },
  {
    icon: Server,
    question: "Infrastructure as Code with Terraform",
    category: "IaC"
  }
];

const categories = [
  { name: "All", icon: Sparkles, color: "from-purple-500 to-blue-500" },
  { name: "AWS", icon: Cloud, color: "from-orange-500 to-red-500" },
  { name: "Docker", icon: Container, color: "from-blue-500 to-cyan-500" },
  { name: "Kubernetes", icon: Shield, color: "from-green-500 to-emerald-500" },
  { name: "CI/CD", icon: GitBranch, color: "from-yellow-500 to-orange-500" },
  { name: "Security", icon: Shield, color: "from-red-500 to-pink-500" },
  { name: "Database", icon: Database, color: "from-indigo-500 to-purple-500" }
];

interface SubscriptionData {
  hasActiveSubscription: boolean;
  subscription: {
    planType: string;
    endDate: string;
  } | null;
  isPremium: boolean;
}

export default function AIAssistant() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { isEnabled } = useFeatures();

  if (!isEnabled("ai_assistance")) {
    return <FeatureDisabledOverlay featureName="AI DevOps Assistant" />;
  }
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: subscriptionData } = useQuery<SubscriptionData>({
    queryKey: ["/api/subscription"],
    enabled: !!user,
  });

  const isPremiumUser = subscriptionData?.hasActiveSubscription || subscriptionData?.isPremium;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const aiQueryMutation = useMutation({
    mutationFn: async (query: string) => {
      const response = await apiRequest("POST", "/api/ai/devops-query", { query });
      if (!response.ok) {
        const errorData = await response.json();
        throw { status: response.status, ...errorData };
      }
      return response.json();
    },
    onSuccess: (data) => {
      setMessages(prev => prev.map(msg =>
        msg.isTyping ? { ...msg, content: data.answer, isTyping: false, webSources: data.webSources || [] } : msg
      ));
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/usage"] });
    },
    onError: (error: any) => {
      if (error.status === 402 || error.isPremiumFeature) {
        setShowUpgradeModal(true);
        setMessages(prev => prev.filter(msg => !msg.isTyping));
      } else {
        // Build a specific, actionable error message based on the error type
        let errorContent = '';
        const errorType = error.errorType || '';
        const errorMsg = error.message || '';

        switch (errorType) {
          case 'AI_NOT_CONFIGURED':
            errorContent = `⚠️ **AI Service Not Configured**\n\nThe AI service is not set up yet. The administrator needs to configure the Gemini API key.\n\n**What you can do:**\n- Contact the administrator to set up the \`GOOGLE_API_KEY\` environment variable\n- Check the deployment documentation for setup instructions`;
            break;
          case 'QUOTA_EXCEEDED':
            errorContent = `⏳ **API Quota Exceeded**\n\n${errorMsg}\n\n**What you can do:**\n- Wait a few minutes and try again\n- Contact the administrator to upgrade the API plan`;
            break;
          case 'INVALID_API_KEY':
            errorContent = `🔑 **API Key Issue**\n\n${errorMsg}\n\n**What you can do:**\n- Contact the administrator to verify the API key configuration`;
            break;
          case 'MODEL_NOT_FOUND':
            errorContent = `🔄 **Temporary Issue**\n\n${errorMsg}\n\n**What you can do:**\n- Try again in a moment — this is usually a temporary issue`;
            break;
          case 'PERMISSION_DENIED':
            errorContent = `🚫 **Permission Denied**\n\n${errorMsg}\n\n**What you can do:**\n- Contact the administrator to enable the Generative Language API`;
            break;
          case 'EMPTY_RESPONSE':
            errorContent = `💬 **Empty Response**\n\nThe AI couldn't generate a response for your query. Please try:\n- Rephrasing your question with more detail\n- Being more specific about what you need help with`;
            break;
          default:
            errorContent = `❌ **Error**\n\n${errorMsg || 'An unexpected error occurred.'}\n\nPlease try again or rephrase your question.`;
            break;
        }

        setMessages(prev => prev.map(msg =>
          msg.isTyping ? {
            ...msg,
            content: errorContent,
            isTyping: false
          } : msg
        ));
      }
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || aiQueryMutation.isPending) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      type: 'assistant',
      content: '',
      timestamp: new Date(),
      isTyping: true
    };

    setMessages(prev => [...prev, userMessage, assistantMessage]);
    aiQueryMutation.mutate(input.trim());
    setInput("");
  };

  const handleSuggestedQuestion = (question: string) => {
    setInput(question);
    inputRef.current?.focus();
  };

  const handleCopy = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredSuggestions = selectedCategory === "All"
    ? suggestedQuestions
    : suggestedQuestions.filter(q => q.category === selectedCategory);

  if (!user) {
    return (
      <div className="min-h-screen bg-dark-bg text-white flex items-center justify-center">
        <Card className="p-8 text-center bg-dark-card border-dark-border">
          <Bot className="w-16 h-16 mx-auto mb-4 text-neon-purple" />
          <h2 className="text-2xl font-bold mb-4">AI Assistant Access Required</h2>
          <p className="text-gray-400 mb-6">Please sign in to access the AI DevOps assistant.</p>
          <Link href="/auth">
            <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
              Sign In to Continue
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg text-white">
      {/* Upgrade Modal */}
      <Dialog open={showUpgradeModal} onOpenChange={setShowUpgradeModal}>
        <DialogContent className="bg-dark-card border-dark-border text-white max-w-md">
          <DialogHeader>
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mb-4">
              <Crown className="w-8 h-8 text-white" />
            </div>
            <DialogTitle className="text-center text-2xl">Upgrade to AI Pro</DialogTitle>
            <DialogDescription className="text-center text-gray-400 mt-2">
              You've used all your free credits! Upgrade to AI Pro for unlimited AI-powered DevOps assistance.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 rounded-lg p-4 border border-purple-500/30">
              <h4 className="font-semibold text-white flex items-center gap-2 mb-3">
                <Rocket className="w-4 h-4 text-yellow-500" />
                AI Pro Benefits
              </h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-500" />
                  Unlimited AI queries
                </li>
                <li className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-yellow-500" />
                  Priority response times
                </li>
                <li className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-yellow-500" />
                  Advanced DevOps insights
                </li>
                <li className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-500" />
                  Early access to new features
                </li>
              </ul>
            </div>

            <div className="flex flex-col gap-3">
              <Button
                onClick={() => {
                  setShowUpgradeModal(false);
                  setLocation("/pricing");
                }}
                className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold"
                data-testid="button-modal-upgrade"
              >
                <Crown className="w-4 h-4 mr-2" />
                View Pricing Plans
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowUpgradeModal(false)}
                className="w-full border-gray-600 text-gray-400 hover:text-white hover:border-gray-500"
                data-testid="button-modal-close"
              >
                Maybe Later
              </Button>
            </div>

            <p className="text-xs text-center text-gray-500">
              Starting at just ₹199/month for unlimited access
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Header */}
      <div className="sticky top-0 z-10 bg-dark-bg/80 backdrop-blur-md border-b border-dark-border">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">AI for Cloud</h1>
                  <p className="text-sm text-gray-400">DevOps & Cloud Intelligence</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {isPremiumUser ? (
                <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0" data-testid="badge-premium">
                  <Crown className="w-3 h-3 mr-1" />
                  AI Pro
                </Badge>
              ) : (
                <Link href="/pricing">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-yellow-500/50 text-yellow-500 hover:bg-yellow-500/10 hover:text-yellow-400"
                    data-testid="button-upgrade-pro"
                  >
                    <Star className="w-3 h-3 mr-1" />
                    Upgrade to Pro
                  </Button>
                </Link>
              )}
              <div className="flex items-center gap-2 text-sm text-gray-400">
                {isPremiumUser ? (
                  <>
                    <Zap className="w-4 h-4 text-yellow-500" />
                    <span className="text-yellow-500">Unlimited</span>
                  </>
                ) : (
                  <>
                    <span className="text-neon-cyan">{user.credits || 0}</span>
                    <span>credits</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar - Categories and Suggestions */}
          <div className="lg:col-span-1 space-y-6">
            {/* Categories */}
            <Card className="p-4 bg-dark-card border-dark-border">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Categories
              </h3>
              <div className="space-y-2">
                {categories.map((category) => (
                  <button
                    key={category.name}
                    onClick={() => setSelectedCategory(category.name)}
                    className={`w-full flex items-center gap-3 p-2 rounded-lg transition-all ${selectedCategory === category.name
                      ? 'bg-gradient-to-r ' + category.color + ' text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                      }`}
                  >
                    <category.icon className="w-4 h-4" />
                    <span className="text-sm">{category.name}</span>
                  </button>
                ))}
              </div>
            </Card>

            {/* Suggested Questions */}
            <Card className="p-4 bg-dark-card border-dark-border">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Lightbulb className="w-4 h-4" />
                Suggested Questions
              </h3>
              <div className="space-y-2">
                {filteredSuggestions.slice(0, 6).map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestedQuestion(suggestion.question)}
                    className="w-full text-left p-3 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-colors group"
                  >
                    <div className="flex items-start gap-3">
                      <suggestion.icon className="w-4 h-4 text-neon-cyan mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-gray-300 group-hover:text-white transition-colors">
                          {suggestion.question}
                        </p>
                        <Badge variant="secondary" className="mt-1 text-xs">
                          {suggestion.category}
                        </Badge>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </Card>
          </div>

          {/* Main Chat Area */}
          <div className="lg:col-span-3">
            <Card className="h-[calc(100vh-200px)] bg-dark-card border-dark-border flex flex-col">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="w-20 h-20 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center mb-6">
                      <Bot className="w-10 h-10 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Welcome to AI for Cloud</h2>
                    <p className="text-gray-400 mb-6 max-w-md">
                      Ask me anything about DevOps, cloud infrastructure, containerization, CI/CD, and more.
                      I'm here to help you optimize your development workflow.
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {suggestedQuestions.slice(0, 3).map((suggestion, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          onClick={() => handleSuggestedQuestion(suggestion.question)}
                          className="text-sm border-gray-700 hover:border-neon-cyan hover:text-neon-cyan"
                        >
                          {suggestion.question}
                        </Button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <AnimatePresence>
                    {messages.map((message) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex gap-4 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        {message.type === 'assistant' && (
                          <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                            <Bot className="w-4 h-4 text-white" />
                          </div>
                        )}

                        <div className={`max-w-3xl ${message.type === 'user' ? 'ml-12' : 'mr-12'}`}>
                          <div className={`p-4 rounded-2xl ${message.type === 'user'
                            ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white ml-auto'
                            : 'bg-gray-800/50 text-gray-100'
                            }`}>
                            {message.isTyping ? (
                              <div className="flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span className="text-sm">Thinking...</span>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <div className="prose prose-invert max-w-none">
                                  <p className="whitespace-pre-wrap">{message.content}</p>
                                </div>
                                {message.type === 'assistant' && (
                                  <>
                                    <div className="flex items-center gap-2 pt-2">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleCopy(message.content, message.id)}
                                        className="h-6 px-2 text-xs text-gray-400 hover:text-white"
                                      >
                                        {copiedId === message.id ? (
                                          <Check className="w-3 h-3" />
                                        ) : (
                                          <Copy className="w-3 h-3" />
                                        )}
                                      </Button>
                                    </div>

                                    {/* Web Sources */}
                                    {message.webSources && message.webSources.length > 0 && (
                                      <div className="mt-3 pt-3 border-t border-gray-700/50">
                                        <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                                          <Search className="w-3 h-3" />
                                          Web Sources
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                          {message.webSources.map((src, idx) => (
                                            <a
                                              key={idx}
                                              href={src.url}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-700/50 hover:bg-gray-600/50 rounded-lg text-xs text-gray-300 hover:text-white transition-colors group max-w-[200px]"
                                              title={src.title}
                                            >
                                              {src.favicon && (
                                                <img
                                                  src={src.favicon}
                                                  alt=""
                                                  className="w-3.5 h-3.5 rounded-sm flex-shrink-0"
                                                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                                />
                                              )}
                                              <span className="truncate">{src.source}</span>
                                              <ExternalLink className="w-3 h-3 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </a>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {message.type === 'user' && (
                          <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                            <User className="w-4 h-4 text-gray-300" />
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-6 border-t border-gray-700">
                <form onSubmit={handleSubmit} className="flex gap-3">
                  <div className="flex-1 relative">
                    <Input
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Ask about DevOps, cloud architecture, containerization, CI/CD..."
                      className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 pr-12"
                      disabled={aiQueryMutation.isPending}
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={!input.trim() || aiQueryMutation.isPending}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 px-6"
                  >
                    {aiQueryMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </form>
                <p className="text-xs text-gray-500 mt-2">
                  {isPremiumUser ? (
                    <>Powered by Google Gemini. <span className="text-yellow-500">Unlimited queries as AI Pro subscriber.</span></>
                  ) : (
                    <>Powered by Google Gemini. Each query costs 1 credit. <Link href="/pricing" className="text-neon-cyan hover:underline">Upgrade to Pro for unlimited.</Link></>
                  )}
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}