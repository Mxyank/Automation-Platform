import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/use-auth';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { 
  Settings, 
  Download, 
  Copy, 
  Server,
  Database,
  Shield,
  FileText,
  Monitor,
  Package
} from 'lucide-react';

interface AnsibleConfig {
  playbookName: string;
  targetHosts: string;
  user: string;
  becomeUser: string;
  playbookType: string;
  variables: { key: string; value: string }[];
  tasks: { name: string; module: string; parameters: { [key: string]: string } }[];
}

export default function AnsibleGenerator() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [config, setConfig] = useState<AnsibleConfig>({
    playbookName: '',
    targetHosts: 'all',
    user: 'ubuntu',
    becomeUser: 'root',
    playbookType: 'server-setup',
    variables: [],
    tasks: []
  });
  const [generatedPlaybook, setGeneratedPlaybook] = useState<string>('');
  const [activeTab, setActiveTab] = useState('config');

  const generateMutation = useMutation({
    mutationFn: async (config: AnsibleConfig) => {
      const response = await apiRequest('POST', '/api/ansible/generate', config);
      return response.json();
    },
    onSuccess: (data) => {
      setGeneratedPlaybook(data.playbook);
      setActiveTab('playbook');
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/usage"] });
      toast({
        title: "Ansible Playbook Generated",
        description: "Your Ansible playbook has been generated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate Ansible playbook",
        variant: "destructive",
      });
    },
  });

  const handleGeneratePlaybook = () => {
    if (!config.playbookName || !config.targetHosts) {
      toast({
        title: "Missing Configuration",
        description: "Please provide playbook name and target hosts.",
        variant: "destructive",
      });
      return;
    }
    generateMutation.mutate(config);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedPlaybook);
    toast({
      title: "Copied to Clipboard",
      description: "Ansible playbook copied to clipboard.",
    });
  };

  const downloadPlaybook = () => {
    const blob = new Blob([generatedPlaybook], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${config.playbookName || 'playbook'}.yml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const addVariable = () => {
    setConfig(prev => ({
      ...prev,
      variables: [...prev.variables, { key: '', value: '' }]
    }));
  };

  const updateVariable = (index: number, field: 'key' | 'value', value: string) => {
    setConfig(prev => ({
      ...prev,
      variables: prev.variables.map((variable, i) => 
        i === index ? { ...variable, [field]: value } : variable
      )
    }));
  };

  const removeVariable = (index: number) => {
    setConfig(prev => ({
      ...prev,
      variables: prev.variables.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="min-h-screen bg-dark-bg text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-red-500 to-orange-600 rounded-lg">
              <Settings className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
                Ansible Playbook Generator
              </h1>
              <p className="text-gray-400">Create automation playbooks for infrastructure management</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-dark-card border-dark-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Server className="h-5 w-5 text-blue-400" />
                  <div>
                    <p className="text-sm text-gray-400">Server Types</p>
                    <p className="text-lg font-semibold">10+</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-dark-card border-dark-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-green-400" />
                  <div>
                    <p className="text-sm text-gray-400">Modules</p>
                    <p className="text-lg font-semibold">200+</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-dark-card border-dark-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-purple-400" />
                  <div>
                    <p className="text-sm text-gray-400">Security</p>
                    <p className="text-lg font-semibold">Built-in</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-dark-card border-dark-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Monitor className="h-5 w-5 text-orange-400" />
                  <div>
                    <p className="text-sm text-gray-400">Monitoring</p>
                    <p className="text-lg font-semibold">Full Stack</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-dark-card border border-dark-border">
            <TabsTrigger value="config" className="data-[state=active]:bg-red-600">
              Configuration
            </TabsTrigger>
            <TabsTrigger value="playbook" className="data-[state=active]:bg-red-600">
              Generated Playbook
            </TabsTrigger>
            <TabsTrigger value="examples" className="data-[state=active]:bg-red-600">
              Examples
            </TabsTrigger>
          </TabsList>

          <TabsContent value="config">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Basic Configuration */}
              <Card className="bg-dark-card border-dark-border">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Basic Configuration
                  </CardTitle>
                  <CardDescription>
                    Configure your playbook basics and target settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="playbookName">Playbook Name</Label>
                    <Input
                      id="playbookName"
                      value={config.playbookName}
                      onChange={(e) => setConfig(prev => ({ ...prev, playbookName: e.target.value }))}
                      placeholder="my-server-setup"
                      className="bg-dark-input border-dark-border text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="targetHosts">Target Hosts</Label>
                    <Input
                      id="targetHosts"
                      value={config.targetHosts}
                      onChange={(e) => setConfig(prev => ({ ...prev, targetHosts: e.target.value }))}
                      placeholder="all, webservers, or specific IP"
                      className="bg-dark-input border-dark-border text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="user">Remote User</Label>
                      <Input
                        id="user"
                        value={config.user}
                        onChange={(e) => setConfig(prev => ({ ...prev, user: e.target.value }))}
                        className="bg-dark-input border-dark-border text-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="becomeUser">Become User</Label>
                      <Input
                        id="becomeUser"
                        value={config.becomeUser}
                        onChange={(e) => setConfig(prev => ({ ...prev, becomeUser: e.target.value }))}
                        className="bg-dark-input border-dark-border text-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="playbookType">Playbook Type</Label>
                    <Select value={config.playbookType} onValueChange={(value) => setConfig(prev => ({ ...prev, playbookType: value }))}>
                      <SelectTrigger className="bg-dark-input border-dark-border text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-dark-card border-dark-border">
                        <SelectItem value="server-setup">Server Setup</SelectItem>
                        <SelectItem value="web-server">Web Server (Nginx)</SelectItem>
                        <SelectItem value="database">Database (PostgreSQL)</SelectItem>
                        <SelectItem value="docker">Docker Installation</SelectItem>
                        <SelectItem value="security">Security Hardening</SelectItem>
                        <SelectItem value="monitoring">Monitoring Setup</SelectItem>
                        <SelectItem value="backup">Backup Configuration</SelectItem>
                        <SelectItem value="custom">Custom Playbook</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Variables Configuration */}
              <Card className="bg-dark-card border-dark-border">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Variables
                  </CardTitle>
                  <CardDescription>
                    Define variables for your playbook
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {config.variables.map((variable, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        placeholder="variable_name"
                        value={variable.key}
                        onChange={(e) => updateVariable(index, 'key', e.target.value)}
                        className="bg-dark-input border-dark-border text-white flex-1"
                      />
                      <Input
                        placeholder="value"
                        value={variable.value}
                        onChange={(e) => updateVariable(index, 'value', e.target.value)}
                        className="bg-dark-input border-dark-border text-white flex-1"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeVariable(index)}
                        className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    onClick={addVariable}
                    className="w-full border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                  >
                    Add Variable
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="mt-6 flex justify-center">
              <Button
                onClick={handleGeneratePlaybook}
                disabled={generateMutation.isPending}
                className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white px-8 py-3 text-lg"
              >
                {generateMutation.isPending ? 'Generating...' : 'Generate Ansible Playbook'}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="playbook">
            <Card className="bg-dark-card border-dark-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white">Generated Ansible Playbook</CardTitle>
                    <CardDescription>
                      Your production-ready playbook is ready for deployment
                    </CardDescription>
                  </div>
                  {generatedPlaybook && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={copyToClipboard}
                        className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                      </Button>
                      <Button
                        variant="outline"
                        onClick={downloadPlaybook}
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
                {generatedPlaybook ? (
                  <ScrollArea className="h-96 w-full">
                    <pre className="bg-gray-900 p-4 rounded-lg text-sm text-gray-300 whitespace-pre-wrap">
                      {generatedPlaybook}
                    </pre>
                  </ScrollArea>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <Settings className="h-12 w-12 mx-auto mb-4 text-gray-600" />
                    <p>Configure your playbook and click "Generate" to see the YAML</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="examples">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-dark-card border-dark-border">
                <CardHeader>
                  <CardTitle className="text-white">Web Server Setup</CardTitle>
                  <CardDescription>
                    Complete Nginx web server installation and configuration
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-64 w-full">
                    <pre className="bg-gray-900 p-4 rounded-lg text-xs text-gray-300 whitespace-pre-wrap">
{`---
- name: Web Server Setup
  hosts: webservers
  remote_user: ubuntu
  become: yes
  become_user: root
  
  tasks:
    - name: Update apt package cache
      apt:
        update_cache: yes
        
    - name: Install Nginx
      apt:
        name: nginx
        state: present
        
    - name: Start and enable Nginx
      systemd:
        name: nginx
        state: started
        enabled: yes`}
                    </pre>
                  </ScrollArea>
                </CardContent>
              </Card>

              <Card className="bg-dark-card border-dark-border">
                <CardHeader>
                  <CardTitle className="text-white">Security Hardening</CardTitle>
                  <CardDescription>
                    Security hardening playbook with firewall and fail2ban
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-64 w-full">
                    <pre className="bg-gray-900 p-4 rounded-lg text-xs text-gray-300 whitespace-pre-wrap">
{`---
- name: Security Hardening
  hosts: all
  remote_user: ubuntu
  become: yes
  become_user: root
  
  tasks:
    - name: Install security packages
      apt:
        name:
          - fail2ban
          - ufw
        state: present
        
    - name: Enable UFW firewall
      ufw:
        state: enabled
        policy: deny
        direction: incoming`}
                    </pre>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}