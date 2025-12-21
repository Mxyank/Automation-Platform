import { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  ArrowRight,
  Container,
  Server,
  Box,
  Layers,
  FileCode,
  Copy,
  Check,
  Loader2,
  Sparkles,
  RefreshCw
} from "lucide-react";
import { motion } from "framer-motion";

type MigrationType = "dockerize" | "vm-to-container" | "compose-to-k8s";

const migrationTypes = [
  {
    id: "dockerize" as MigrationType,
    title: "Dockerize Monolith",
    description: "Convert legacy applications to Docker containers",
    icon: Container,
    color: "from-blue-500 to-cyan-500",
    placeholder: `# Paste your application structure or describe your monolith
# Example:
# - Node.js Express application
# - PostgreSQL database
# - Redis for caching
# - File uploads to /uploads directory
# - Environment variables: DATABASE_URL, REDIS_URL, PORT

app/
├── package.json
├── server.js
├── routes/
├── models/
├── views/
└── public/`
  },
  {
    id: "vm-to-container" as MigrationType,
    title: "VM to Container",
    description: "Migrate virtual machines to containerized workloads",
    icon: Server,
    color: "from-purple-500 to-pink-500",
    placeholder: `# Describe your VM configuration
# Example:
# OS: Ubuntu 20.04 LTS
# Services running:
# - Nginx (port 80, 443)
# - Node.js application (port 3000)
# - MongoDB (port 27017)
# - PM2 process manager
#
# Storage:
# - 50GB root volume
# - 100GB data volume mounted at /data
#
# Network:
# - Public IP with SSL certificate
# - Internal network access to database cluster`
  },
  {
    id: "compose-to-k8s" as MigrationType,
    title: "Compose to Kubernetes",
    description: "Convert Docker Compose files to Kubernetes manifests",
    icon: Layers,
    color: "from-green-500 to-emerald-500",
    placeholder: `version: '3.8'
services:
  web:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgres://user:pass@db:5432/myapp
    depends_on:
      - db
      - redis

  db:
    image: postgres:14
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
      POSTGRES_DB: myapp
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:`
  }
];

export default function MigrationAssistant() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState<MigrationType>("dockerize");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [copied, setCopied] = useState(false);

  const migrationMutation = useMutation({
    mutationFn: async ({ type, content }: { type: MigrationType, content: string }) => {
      const response = await apiRequest("POST", "/api/ai/migration", { type, content });
      if (!response.ok) throw new Error("Migration failed");
      return response.json();
    },
    onSuccess: (data) => {
      setOutput(data.result);
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Migration Complete",
        description: "Your configuration has been converted successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Migration Failed",
        description: "Please check your input and try again.",
        variant: "destructive",
      });
    }
  });

  const handleMigrate = () => {
    if (!input.trim()) {
      toast({
        title: "Input Required",
        description: "Please provide your configuration or description.",
        variant: "destructive",
      });
      return;
    }
    migrationMutation.mutate({ type: activeTab, content: input });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Copied to clipboard!" });
  };

  const getActiveMigration = () => migrationTypes.find(m => m.id === activeTab)!;

  if (!user) {
    return (
      <div className="min-h-screen bg-dark-bg text-white flex items-center justify-center">
        <Card className="p-8 text-center bg-dark-card border-dark-border">
          <RefreshCw className="w-16 h-16 mx-auto mb-4 text-neon-purple" />
          <h2 className="text-2xl font-bold mb-4">Sign In Required</h2>
          <p className="text-gray-400 mb-6">Please sign in to use Migration Assistant.</p>
          <Link href="/auth">
            <Button className="bg-gradient-to-r from-purple-600 to-pink-600">Sign In</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg text-white">
      <div className="sticky top-0 z-10 bg-dark-bg/80 backdrop-blur-md border-b border-dark-border">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
                <RefreshCw className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Migration Assistant</h1>
                <p className="text-sm text-gray-400">Convert and migrate your infrastructure</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as MigrationType); setInput(""); setOutput(""); }}>
          <TabsList className="grid w-full grid-cols-3 bg-dark-card border border-dark-border h-auto p-1">
            {migrationTypes.map((type) => (
              <TabsTrigger 
                key={type.id} 
                value={type.id}
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 py-4"
                data-testid={`tab-${type.id}`}
              >
                <div className="flex items-center gap-2">
                  <type.icon className="w-5 h-5" />
                  <span className="hidden sm:inline">{type.title}</span>
                </div>
              </TabsTrigger>
            ))}
          </TabsList>

          {migrationTypes.map((type) => (
            <TabsContent key={type.id} value={type.id} className="mt-6">
              <div className="grid lg:grid-cols-2 gap-6">
                <Card className="bg-dark-card border-dark-border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <type.icon className={`w-5 h-5 bg-gradient-to-r ${type.color} bg-clip-text text-transparent`} />
                      {type.title}
                    </CardTitle>
                    <CardDescription>{type.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        Input Configuration
                      </label>
                      <Textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={type.placeholder}
                        className="bg-gray-800 border-gray-700 min-h-[400px] font-mono text-sm"
                        data-testid="input-config"
                      />
                    </div>
                    <Button 
                      onClick={handleMigrate}
                      disabled={migrationMutation.isPending || !input.trim()}
                      className={`w-full bg-gradient-to-r ${type.color} hover:opacity-90 h-12`}
                      data-testid="button-migrate"
                    >
                      {migrationMutation.isPending ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Converting...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5 mr-2" />
                          Convert with AI
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                <Card className="bg-dark-card border-dark-border">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <FileCode className="w-5 h-5 text-neon-cyan" />
                        Generated Output
                      </CardTitle>
                      {output && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleCopy}
                          className="text-gray-400 hover:text-white"
                          data-testid="button-copy"
                        >
                          {copied ? (
                            <Check className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {output ? (
                      <div className="bg-gray-900 rounded-lg p-4 min-h-[400px] overflow-auto">
                        <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono">
                          {output}
                        </pre>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
                        <Box className="w-16 h-16 text-gray-600 mb-4" />
                        <h3 className="text-lg font-medium text-white mb-2">
                          Ready to Convert
                        </h3>
                        <p className="text-gray-400 max-w-sm">
                          Paste your configuration on the left and click "Convert with AI" to generate the migrated output.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="mt-8 grid md:grid-cols-3 gap-4">
                <Card className="bg-dark-card border-dark-border p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">AI-Powered</h4>
                      <p className="text-sm text-gray-400">Intelligent conversion using advanced AI models</p>
                    </div>
                  </div>
                </Card>
                <Card className="bg-dark-card border-dark-border p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Check className="w-5 h-5 text-green-500" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">Best Practices</h4>
                      <p className="text-sm text-gray-400">Follows industry standards and security guidelines</p>
                    </div>
                  </div>
                </Card>
                <Card className="bg-dark-card border-dark-border p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <RefreshCw className="w-5 h-5 text-purple-500" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">Iterative</h4>
                      <p className="text-sm text-gray-400">Refine and regenerate until it's perfect</p>
                    </div>
                  </div>
                </Card>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
