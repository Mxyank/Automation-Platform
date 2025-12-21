import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, X, Send, Bot, User, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hello! I'm your DevOps AI assistant. How can I help you today? Ask me about Docker, Kubernetes, CI/CD, cloud infrastructure, or any DevOps topic!",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest("POST", "/api/chatbot", { message });
      return response.json();
    },
    onSuccess: (data) => {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: data.response || "I apologize, but I couldn't generate a response. Please try again.",
          timestamp: new Date(),
        },
      ]);
    },
    onError: () => {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again later.",
          timestamp: new Date(),
        },
      ]);
    },
  });

  const handleSend = () => {
    if (!input.trim() || chatMutation.isPending) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    chatMutation.mutate(input.trim());
    setInput("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 z-50 w-96"
          >
            <Card className="bg-dark-card border-gray-700 shadow-2xl">
              <CardHeader className="pb-3 border-b border-gray-700">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white flex items-center gap-2 text-lg">
                    <Bot className="w-5 h-5 text-neon-cyan" />
                    DevOps AI Assistant
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                    className="text-gray-400 hover:text-white"
                    data-testid="button-close-chat"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-80 p-4" ref={scrollRef}>
                  <div className="space-y-4">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                      >
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                            msg.role === "user"
                              ? "bg-neon-purple/20"
                              : "bg-neon-cyan/20"
                          }`}
                        >
                          {msg.role === "user" ? (
                            <User className="w-4 h-4 text-neon-purple" />
                          ) : (
                            <Bot className="w-4 h-4 text-neon-cyan" />
                          )}
                        </div>
                        <div
                          className={`max-w-[80%] rounded-lg p-3 ${
                            msg.role === "user"
                              ? "bg-neon-purple/20 text-white"
                              : "bg-gray-800 text-gray-200"
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        </div>
                      </div>
                    ))}
                    {chatMutation.isPending && (
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-neon-cyan/20 flex items-center justify-center">
                          <Bot className="w-4 h-4 text-neon-cyan" />
                        </div>
                        <div className="bg-gray-800 rounded-lg p-3">
                          <Loader2 className="w-4 h-4 text-neon-cyan animate-spin" />
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>
                <div className="p-4 border-t border-gray-700">
                  <div className="flex gap-2">
                    <Input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ask about DevOps..."
                      className="bg-dark-bg border-gray-700 text-white"
                      disabled={chatMutation.isPending}
                      data-testid="input-chat-message"
                    />
                    <Button
                      onClick={handleSend}
                      disabled={!input.trim() || chatMutation.isPending}
                      className="bg-neon-cyan text-dark-bg hover:bg-neon-cyan/80"
                      data-testid="button-send-chat"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-r from-neon-cyan to-neon-purple flex items-center justify-center shadow-lg shadow-neon-cyan/30"
        data-testid="button-open-chat"
      >
        {isOpen ? (
          <X className="w-6 h-6 text-dark-bg" />
        ) : (
          <MessageCircle className="w-6 h-6 text-dark-bg" />
        )}
      </motion.button>
    </>
  );
}
