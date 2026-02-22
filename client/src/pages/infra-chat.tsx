import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Navigation } from "@/components/navigation";
import { BackButton } from "@/components/back-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useFeatures } from "@/hooks/use-features";
import { FeatureDisabledOverlay } from "@/components/feature-disabled-overlay";
import {
  MessageSquare,
  Send,
  Loader2,
  Terminal,
  Server,
  Cloud,
  AlertCircle,
  CheckCircle,
  Copy,
  Cpu,
  HardDrive,
  Activity,
  Scale,
  RefreshCw,
  Zap,
  Bot,
  User
} from "lucide-react";
import { motion } from "framer-motion";
import { useUpgradeModal, UpgradeModal } from "@/components/upgrade-modal";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  action?: {
    type: string;
    command?: string;
    result?: string;
  };
}

const exampleQueries = [
  "Why is pod xyz-abc failing?",
  "Scale my backend to 4 replicas",
  "Show CPU spikes in the last hour",
  "List all unhealthy services",
  "Restart the nginx deployment",
  "Show memory usage across nodes",
  "What's the status of my deployments?",
  "Rollback frontend to previous version",
];

export default function InfraChat() {
  const { toast } = useToast();
  const { showUpgradeModal, setShowUpgradeModal, checkForUpgrade } = useUpgradeModal();
  const { isEnabled } = useFeatures();
  const isFeatureEnabled = isEnabled('infra_chat');
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "Hi! I'm your infrastructure assistant. I can help you manage and troubleshoot your cloud infrastructure. Ask me about pods, deployments, scaling, metrics, or any infrastructure-related questions.",
      timestamp: new Date(),
    },
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const chatMutation = useMutation({
    mutationFn: async (query: string) => {
      const response = await apiRequest("POST", "/api/ai/infra-chat", { query });
      return response.json();
    },
    onSuccess: (data) => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.result.response,
          timestamp: new Date(),
          action: data.result.action,
        },
      ]);
    },
    onError: (error: Error) => {
      if (checkForUpgrade(error)) return;
      toast({
        title: "Chat Error",
        description: error.message,
        variant: "destructive",
      });
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I encountered an error processing your request. Please try again.",
          timestamp: new Date(),
        },
      ]);
    },
  });

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    chatMutation.mutate(input);
    setInput("");
  };

  const handleExampleClick = (query: string) => {
    setInput(query);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Command copied to clipboard.",
    });
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case "scale": return <Scale className="w-4 h-4" />;
      case "restart": return <RefreshCw className="w-4 h-4" />;
      case "status": return <Activity className="w-4 h-4" />;
      case "logs": return <Terminal className="w-4 h-4" />;
      case "metrics": return <Cpu className="w-4 h-4" />;
      default: return <Zap className="w-4 h-4" />;
    }
  };

  return (
    <div className="relative min-h-screen bg-dark-bg">
      {!isFeatureEnabled && <FeatureDisabledOverlay featureName="Infra Chat" />}
      <UpgradeModal open={showUpgradeModal} onOpenChange={setShowUpgradeModal} />
      <Navigation />

      <div className="pt-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <BackButton />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 mt-4"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Chat with Your Infrastructure</h1>
                <p className="text-gray-400">Natural language interface to manage and monitor your cloud</p>
              </div>
            </div>
          </motion.div>

          <div className="grid lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3">
              <Card className="bg-dark-card border-gray-800 h-[600px] flex flex-col">
                <CardHeader className="border-b border-gray-800 pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-white font-medium">Infrastructure Assistant</span>
                    </div>
                    <Badge variant="outline" className="border-cyan-500 text-cyan-400">
                      <Terminal className="w-3 h-3 mr-1" />
                      Connected
                    </Badge>
                  </div>
                </CardHeader>

                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messages.map((message, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div className={`flex items-start gap-3 max-w-[80%] ${message.role === "user" ? "flex-row-reverse" : ""}`}>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${message.role === "user"
                              ? "bg-neon-purple"
                              : "bg-gradient-to-r from-cyan-500 to-blue-500"
                            }`}>
                            {message.role === "user" ? (
                              <User className="w-4 h-4 text-white" />
                            ) : (
                              <Bot className="w-4 h-4 text-white" />
                            )}
                          </div>
                          <div className={`rounded-2xl p-4 ${message.role === "user"
                              ? "bg-neon-purple/20 border border-neon-purple/30"
                              : "bg-gray-800 border border-gray-700"
                            }`}>
                            <p className="text-white text-sm whitespace-pre-wrap">{message.content}</p>

                            {message.action && (
                              <div className="mt-3 space-y-2">
                                {message.action.command && (
                                  <div className="bg-gray-900 rounded-lg p-3 flex items-center justify-between">
                                    <code className="text-cyan-400 text-xs font-mono">
                                      {message.action.command}
                                    </code>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => copyToClipboard(message.action!.command!)}
                                      className="h-6 w-6 p-0"
                                    >
                                      <Copy className="w-3 h-3" />
                                    </Button>
                                  </div>
                                )}
                                {message.action.result && (
                                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                                    <div className="flex items-center gap-2 mb-1">
                                      {getActionIcon(message.action.type)}
                                      <span className="text-green-400 text-xs font-medium uppercase">
                                        {message.action.type}
                                      </span>
                                    </div>
                                    <p className="text-gray-300 text-xs">{message.action.result}</p>
                                  </div>
                                )}
                              </div>
                            )}

                            <p className="text-gray-500 text-xs mt-2">
                              {message.timestamp.toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}

                    {chatMutation.isPending && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex justify-start"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center">
                            <Bot className="w-4 h-4 text-white" />
                          </div>
                          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-4">
                            <div className="flex items-center gap-2">
                              <Loader2 className="w-4 h-4 animate-spin text-cyan-500" />
                              <span className="text-gray-400 text-sm">Analyzing your infrastructure...</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                <div className="border-t border-gray-800 p-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Ask about your infrastructure..."
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleSend()}
                      className="bg-gray-900 border-gray-700 text-white"
                      disabled={chatMutation.isPending}
                      data-testid="input-chat"
                    />
                    <Button
                      onClick={handleSend}
                      disabled={chatMutation.isPending || !input.trim()}
                      className="bg-gradient-to-r from-cyan-500 to-blue-500"
                      data-testid="button-send"
                    >
                      {chatMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="bg-dark-card border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white text-lg flex items-center gap-2">
                    <Zap className="w-4 h-4 text-yellow-500" />
                    Quick Commands
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {exampleQueries.map((query, index) => (
                    <Button
                      key={index}
                      variant="ghost"
                      className="w-full justify-start text-left text-sm text-gray-400 hover:text-white hover:bg-gray-800 h-auto py-2"
                      onClick={() => handleExampleClick(query)}
                    >
                      {query}
                    </Button>
                  ))}
                </CardContent>
              </Card>

              <Card className="bg-dark-card border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white text-lg flex items-center gap-2">
                    <Activity className="w-4 h-4 text-green-500" />
                    Capabilities
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Server className="w-4 h-4 text-blue-500" />
                    <span className="text-sm">Manage pods & deployments</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400">
                    <Scale className="w-4 h-4 text-purple-500" />
                    <span className="text-sm">Scale resources up/down</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400">
                    <Cpu className="w-4 h-4 text-orange-500" />
                    <span className="text-sm">View metrics & usage</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <span className="text-sm">Troubleshoot issues</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400">
                    <RefreshCw className="w-4 h-4 text-cyan-500" />
                    <span className="text-sm">Restart services</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400">
                    <Terminal className="w-4 h-4 text-green-500" />
                    <span className="text-sm">Execute kubectl commands</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
