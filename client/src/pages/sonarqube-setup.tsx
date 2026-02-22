import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/use-auth';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useFeatures } from "@/hooks/use-features";
import { FeatureDisabledOverlay } from "@/components/feature-disabled-overlay";
import { useToast } from '@/hooks/use-toast';
import {
  Shield,
  Download,
  Copy,
  CheckCircle,
  AlertTriangle,
  Play,
  Server,
  Database,
  Package,
  Code2,
  Network,
  Users,
  FileText,
  Terminal,
  Globe,
  Lock,
  ArrowLeft
} from 'lucide-react';
import { useUpgradeModal, UpgradeModal } from "@/components/upgrade-modal";
import { Navigation } from "@/components/navigation";
import { BackButton } from "@/components/back-button";
import { motion } from "framer-motion";

interface SonarQubeConfig {
  setupType: string;
  version: string;
  database: string;
  javaVersion: string;
  serverPort: string;
  serverHost: string;
  webContext: string;
  elasticsearch: boolean;
  authentication: string;
  plugins: string[];
  environment: string;
}

export default function SonarQubeSetup() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { showUpgradeModal, setShowUpgradeModal, checkForUpgrade } = useUpgradeModal();
  const { isEnabled } = useFeatures();
  const isFeatureEnabled = isEnabled('sonarqube_setup');
  const queryClient = useQueryClient();
  const [config, setConfig] = useState<SonarQubeConfig>({
    setupType: 'docker',
    version: '9.9-community',
    database: 'postgresql',
    javaVersion: '17',
    serverPort: '9000',
    serverHost: 'localhost',
    webContext: '/',
    elasticsearch: true,
    authentication: 'ldap',
    plugins: [],
    environment: 'development'
  });
  const [generatedScript, setGeneratedScript] = useState<string>('');
  const [activeTab, setActiveTab] = useState('config');

  const generateMutation = useMutation({
    mutationFn: async (config: SonarQubeConfig) => {
      const response = await apiRequest('POST', '/api/sonarqube/setup', config);
      return response.json();
    },
    onSuccess: (data) => {
      setGeneratedScript(data.script);
      setActiveTab('script');
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/usage"] });
      toast({
        title: "SonarQube Setup Generated",
        description: "Your SonarQube setup script has been generated successfully.",
      });
    },
    onError: (error: any) => {
      if (checkForUpgrade(error)) return;
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate SonarQube setup",
        variant: "destructive",
      });
    },
  });

  const handleGenerateSetup = () => {
    generateMutation.mutate(config);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedScript);
    toast({
      title: "Copied to Clipboard",
      description: "SonarQube setup script copied to clipboard.",
    });
  };

  const downloadScript = () => {
    const blob = new Blob([generatedScript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sonarqube-setup-${config.setupType}.sh`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const togglePlugin = (plugin: string) => {
    setConfig(prev => ({
      ...prev,
      plugins: prev.plugins.includes(plugin)
        ? prev.plugins.filter(p => p !== plugin)
        : [...prev.plugins, plugin]
    }));
  };

  return (
    <div className="relative min-h-screen bg-dark-bg">
      {!isFeatureEnabled && <FeatureDisabledOverlay featureName="SonarQube Setup" />}
      <UpgradeModal open={showUpgradeModal} onOpenChange={setShowUpgradeModal} />
      <Navigation />
      <div className="pt-16 p-6">
        <div className="max-w-7xl mx-auto">
          <BackButton />
          <div className="mb-8 mt-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-lg">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  SonarQube Setup Generator
                </h1>
                <p className="text-gray-400">Complete SonarQube installation and configuration guide</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card className="bg-dark-card border-dark-border">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Code2 className="h-5 w-5 text-blue-400" />
                    <div>
                      <p className="text-sm text-gray-400">Setup Types</p>
                      <p className="text-lg font-semibold">5+</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-dark-card border-dark-border">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-green-400" />
                    <div>
                      <p className="text-sm text-gray-400">Databases</p>
                      <p className="text-lg font-semibold">3</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-dark-card border-dark-border">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-purple-400" />
                    <div>
                      <p className="text-sm text-gray-400">Plugins</p>
                      <p className="text-lg font-semibold">50+</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-dark-card border-dark-border">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Lock className="h-5 w-5 text-orange-400" />
                    <div>
                      <p className="text-sm text-gray-400">Security</p>
                      <p className="text-lg font-semibold">Enterprise</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="bg-dark-card border border-dark-border">
              <TabsTrigger value="config" className="data-[state=active]:bg-blue-600">
                Configuration
              </TabsTrigger>
              <TabsTrigger value="script" className="data-[state=active]:bg-blue-600">
                Generated Script
              </TabsTrigger>
              <TabsTrigger value="guide" className="data-[state=active]:bg-blue-600">
                Setup Guide
              </TabsTrigger>
              <TabsTrigger value="troubleshooting" className="data-[state=active]:bg-blue-600">
                Troubleshooting
              </TabsTrigger>
            </TabsList>

            <TabsContent value="config">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Basic Configuration */}
                <Card className="bg-dark-card border-dark-border">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Server className="h-5 w-5" />
                      Basic Configuration
                    </CardTitle>
                    <CardDescription>
                      Configure your SonarQube server settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="setupType">Setup Type</Label>
                      <Select value={config.setupType} onValueChange={(value) => setConfig(prev => ({ ...prev, setupType: value }))}>
                        <SelectTrigger className="bg-dark-input border-dark-border text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-dark-card border-dark-border">
                          <SelectItem value="docker">Docker Compose</SelectItem>
                          <SelectItem value="kubernetes">Kubernetes</SelectItem>
                          <SelectItem value="manual">Manual Installation</SelectItem>
                          <SelectItem value="zip">ZIP Distribution</SelectItem>
                          <SelectItem value="rpm">RPM Package</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="version">SonarQube Version</Label>
                      <Select value={config.version} onValueChange={(value) => setConfig(prev => ({ ...prev, version: value }))}>
                        <SelectTrigger className="bg-dark-input border-dark-border text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-dark-card border-dark-border">
                          <SelectItem value="9.9-community">9.9 Community</SelectItem>
                          <SelectItem value="9.9-developer">9.9 Developer</SelectItem>
                          <SelectItem value="9.9-enterprise">9.9 Enterprise</SelectItem>
                          <SelectItem value="10.0-community">10.0 Community</SelectItem>
                          <SelectItem value="10.0-developer">10.0 Developer</SelectItem>
                          <SelectItem value="10.0-enterprise">10.0 Enterprise</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="environment">Environment</Label>
                      <Select value={config.environment} onValueChange={(value) => setConfig(prev => ({ ...prev, environment: value }))}>
                        <SelectTrigger className="bg-dark-input border-dark-border text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-dark-card border-dark-border">
                          <SelectItem value="development">Development</SelectItem>
                          <SelectItem value="staging">Staging</SelectItem>
                          <SelectItem value="production">Production</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="serverHost">Server Host</Label>
                        <Input
                          id="serverHost"
                          value={config.serverHost}
                          onChange={(e) => setConfig(prev => ({ ...prev, serverHost: e.target.value }))}
                          className="bg-dark-input border-dark-border text-white"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="serverPort">Server Port</Label>
                        <Input
                          id="serverPort"
                          value={config.serverPort}
                          onChange={(e) => setConfig(prev => ({ ...prev, serverPort: e.target.value }))}
                          className="bg-dark-input border-dark-border text-white"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="webContext">Web Context</Label>
                      <Input
                        id="webContext"
                        value={config.webContext}
                        onChange={(e) => setConfig(prev => ({ ...prev, webContext: e.target.value }))}
                        placeholder="/sonarqube"
                        className="bg-dark-input border-dark-border text-white"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Database Configuration */}
                <Card className="bg-dark-card border-dark-border">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Database className="h-5 w-5" />
                      Database Configuration
                    </CardTitle>
                    <CardDescription>
                      Configure your database backend
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="database">Database Type</Label>
                      <Select value={config.database} onValueChange={(value) => setConfig(prev => ({ ...prev, database: value }))}>
                        <SelectTrigger className="bg-dark-input border-dark-border text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-dark-card border-dark-border">
                          <SelectItem value="postgresql">PostgreSQL</SelectItem>
                          <SelectItem value="mssql">Microsoft SQL Server</SelectItem>
                          <SelectItem value="oracle">Oracle Database</SelectItem>
                          <SelectItem value="h2">H2 (Development only)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="javaVersion">Java Version</Label>
                      <Select value={config.javaVersion} onValueChange={(value) => setConfig(prev => ({ ...prev, javaVersion: value }))}>
                        <SelectTrigger className="bg-dark-input border-dark-border text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-dark-card border-dark-border">
                          <SelectItem value="11">Java 11</SelectItem>
                          <SelectItem value="17">Java 17 LTS</SelectItem>
                          <SelectItem value="21">Java 21 LTS</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="authentication">Authentication</Label>
                      <Select value={config.authentication} onValueChange={(value) => setConfig(prev => ({ ...prev, authentication: value }))}>
                        <SelectTrigger className="bg-dark-input border-dark-border text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-dark-card border-dark-border">
                          <SelectItem value="local">Local Users</SelectItem>
                          <SelectItem value="ldap">LDAP</SelectItem>
                          <SelectItem value="saml">SAML</SelectItem>
                          <SelectItem value="oauth">OAuth 2.0</SelectItem>
                          <SelectItem value="github">GitHub</SelectItem>
                          <SelectItem value="gitlab">GitLab</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="elasticsearch"
                        checked={config.elasticsearch}
                        onCheckedChange={(checked) => setConfig(prev => ({ ...prev, elasticsearch: !!checked }))}
                      />
                      <Label htmlFor="elasticsearch" className="text-sm">Enable Elasticsearch</Label>
                    </div>
                  </CardContent>
                </Card>

                {/* Plugins Configuration */}
                <Card className="bg-dark-card border-dark-border lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Plugin Selection
                    </CardTitle>
                    <CardDescription>
                      Select plugins to install with your SonarQube instance
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {[
                        'sonar-javascript-plugin',
                        'sonar-typescript-plugin',
                        'sonar-python-plugin',
                        'sonar-java-plugin',
                        'sonar-csharp-plugin',
                        'sonar-php-plugin',
                        'sonar-go-plugin',
                        'sonar-kotlin-plugin',
                        'sonar-ruby-plugin',
                        'sonar-scala-plugin',
                        'sonar-swift-plugin',
                        'sonar-css-plugin',
                        'sonar-html-plugin',
                        'sonar-xml-plugin',
                        'sonar-yaml-plugin',
                        'sonar-docker-plugin',
                        'sonar-terraform-plugin',
                        'sonar-ansible-plugin',
                        'sonar-secrets-plugin',
                        'sonar-security-plugin'
                      ].map((plugin) => (
                        <div key={plugin} className="flex items-center space-x-2">
                          <Checkbox
                            id={plugin}
                            checked={config.plugins.includes(plugin)}
                            onCheckedChange={() => togglePlugin(plugin)}
                          />
                          <Label htmlFor={plugin} className="text-xs">
                            {plugin.replace('sonar-', '').replace('-plugin', '').toUpperCase()}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="mt-6 flex justify-center">
                <Button
                  onClick={handleGenerateSetup}
                  disabled={generateMutation.isPending}
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-8 py-3 text-lg"
                >
                  {generateMutation.isPending ? 'Generating...' : 'Generate SonarQube Setup'}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="script">
              <Card className="bg-dark-card border-dark-border">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-white">Generated Setup Script</CardTitle>
                      <CardDescription>
                        Your production-ready SonarQube setup script
                      </CardDescription>
                    </div>
                    {generatedScript && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={copyToClipboard}
                          className="border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white"
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copy
                        </Button>
                        <Button
                          variant="outline"
                          onClick={downloadScript}
                          className="border-green-500 text-green-500 hover:bg-green-500 hover:text-white"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {generatedScript ? (
                    <ScrollArea className="h-96 w-full">
                      <pre className="bg-gray-900 p-4 rounded-lg text-sm text-gray-300 whitespace-pre-wrap">
                        {generatedScript}
                      </pre>
                    </ScrollArea>
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      <Shield className="h-12 w-12 mx-auto mb-4 text-gray-600" />
                      <p>Configure your setup and click "Generate" to see the installation script</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="guide">
              <div className="space-y-6">
                <Card className="bg-dark-card border-dark-border">
                  <CardHeader>
                    <CardTitle className="text-white">Complete Setup Guide</CardTitle>
                    <CardDescription>
                      Step-by-step instructions for setting up SonarQube
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-400" />
                        Prerequisites
                      </h3>
                      <ul className="list-disc list-inside text-gray-300 space-y-2 ml-6">
                        <li>Java 11 or 17 (recommended) installed</li>
                        <li>PostgreSQL 12+ (for production)</li>
                        <li>At least 2GB RAM available</li>
                        <li>Docker and Docker Compose (for containerized setup)</li>
                        <li>Appropriate firewall rules configured</li>
                      </ul>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Terminal className="h-5 w-5 text-blue-400" />
                        Installation Steps
                      </h3>
                      <div className="space-y-3">
                        <div className="bg-gray-800 p-4 rounded-lg">
                          <h4 className="font-medium text-white mb-2">1. Database Setup</h4>
                          <pre className="text-sm text-gray-300">
                            {`# Create PostgreSQL database
sudo -u postgres createdb sonarqube
sudo -u postgres createuser sonaruser
sudo -u postgres psql -c "ALTER USER sonaruser WITH ENCRYPTED PASSWORD 'sonarpass';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE sonarqube TO sonaruser;"`}
                          </pre>
                        </div>

                        <div className="bg-gray-800 p-4 rounded-lg">
                          <h4 className="font-medium text-white mb-2">2. System Configuration</h4>
                          <pre className="text-sm text-gray-300">
                            {`# Configure system limits
echo 'sonarqube   -   nofile   131072' >> /etc/security/limits.conf
echo 'sonarqube   -   nproc    8192' >> /etc/security/limits.conf
echo 'vm.max_map_count=524288' >> /etc/sysctl.conf
sysctl -p`}
                          </pre>
                        </div>

                        <div className="bg-gray-800 p-4 rounded-lg">
                          <h4 className="font-medium text-white mb-2">3. SonarQube Installation</h4>
                          <pre className="text-sm text-gray-300">
                            {`# Download and extract SonarQube
wget https://binaries.sonarsource.com/Distribution/sonarqube/sonarqube-9.9.zip
unzip sonarqube-9.9.zip
sudo mv sonarqube-9.9 /opt/sonarqube
sudo chown -R sonarqube:sonarqube /opt/sonarqube`}
                          </pre>
                        </div>

                        <div className="bg-gray-800 p-4 rounded-lg">
                          <h4 className="font-medium text-white mb-2">4. Configuration</h4>
                          <pre className="text-sm text-gray-300">
                            {`# Edit sonar.properties
sudo vim /opt/sonarqube/conf/sonar.properties

# Add database configuration:
sonar.jdbc.username=sonaruser
sonar.jdbc.password=sonarpass
sonar.jdbc.url=jdbc:postgresql://localhost/sonarqube`}
                          </pre>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Play className="h-5 w-5 text-green-400" />
                        Starting SonarQube
                      </h3>
                      <div className="bg-gray-800 p-4 rounded-lg">
                        <pre className="text-sm text-gray-300">
                          {`# Start SonarQube
sudo systemctl start sonarqube
sudo systemctl enable sonarqube

# Check status
sudo systemctl status sonarqube

# View logs
tail -f /opt/sonarqube/logs/sonar.log`}
                        </pre>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="troubleshooting">
              <div className="space-y-6">
                <Card className="bg-dark-card border-dark-border">
                  <CardHeader>
                    <CardTitle className="text-white">Common Issues & Solutions</CardTitle>
                    <CardDescription>
                      Troubleshooting guide for SonarQube setup
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <Alert className="border-orange-500 bg-orange-500/10">
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                        <AlertDescription className="text-orange-200">
                          <strong>Memory Issues:</strong> SonarQube requires at least 2GB RAM. Increase heap size in wrapper.conf if needed.
                        </AlertDescription>
                      </Alert>

                      <Alert className="border-red-500 bg-red-500/10">
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                        <AlertDescription className="text-red-200">
                          <strong>Database Connection:</strong> Ensure PostgreSQL is running and credentials are correct in sonar.properties.
                        </AlertDescription>
                      </Alert>

                      <Alert className="border-blue-500 bg-blue-500/10">
                        <AlertTriangle className="h-4 w-4 text-blue-500" />
                        <AlertDescription className="text-blue-200">
                          <strong>Port Conflicts:</strong> Default port 9000 might be in use. Change sonar.web.port in configuration.
                        </AlertDescription>
                      </Alert>

                      <Alert className="border-purple-500 bg-purple-500/10">
                        <AlertTriangle className="h-4 w-4 text-purple-500" />
                        <AlertDescription className="text-purple-200">
                          <strong>Elasticsearch Issues:</strong> Check vm.max_map_count system setting. Should be at least 524288.
                        </AlertDescription>
                      </Alert>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-white">Diagnostic Commands</h3>
                      <div className="bg-gray-800 p-4 rounded-lg">
                        <pre className="text-sm text-gray-300">
                          {`# Check SonarQube status
curl -u admin:admin http://localhost:9000/api/system/status

# View application logs
tail -f /opt/sonarqube/logs/sonar.log

# Check database connectivity
psql -h localhost -U sonaruser -d sonarqube -c "SELECT version();"

# Monitor resource usage
htop
df -h
free -h`}
                        </pre>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-white">Performance Tuning</h3>
                      <div className="bg-gray-800 p-4 rounded-lg">
                        <pre className="text-sm text-gray-300">
                          {`# Increase heap size (wrapper.conf)
wrapper.java.additional.2=-Xmx4g
wrapper.java.additional.3=-Xms2g

# Database tuning (postgresql.conf)
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 4MB

# System tuning
echo 'vm.max_map_count=524288' >> /etc/sysctl.conf
echo 'fs.file-max=131072' >> /etc/sysctl.conf`}
                        </pre>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}