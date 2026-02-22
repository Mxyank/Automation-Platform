import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/use-auth';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useFeatures } from "@/hooks/use-features";
import { FeatureDisabledOverlay } from "@/components/feature-disabled-overlay";
import { useToast } from '@/hooks/use-toast';
import { Navigation } from '@/components/navigation';
import {
  Snowflake,
  Download,
  Copy,
  Database,
  Shield,
  Users,
  Settings,
  Warehouse,
  Table2,
  Key,
  Zap
} from 'lucide-react';
import { useUpgradeModal, UpgradeModal } from "@/components/upgrade-modal";

interface SnowflakeConfig {
  accountName: string;
  region: string;
  cloudProvider: string;
  warehouseName: string;
  warehouseSize: string;
  databaseName: string;
  schemaName: string;
  roleName: string;
  userName: string;
  enableMultiCluster: boolean;
  autoSuspend: number;
  minClusters: number;
  maxClusters: number;
  enableDataSharing: boolean;
  enableTimeTravel: number;
  enableFailsafe: boolean;
  networkPolicy: string;
}

export default function SnowflakeSetup() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { showUpgradeModal, setShowUpgradeModal, checkForUpgrade } = useUpgradeModal();
  const { isEnabled } = useFeatures();
  const isFeatureEnabled = isEnabled('snowflake_setup');
  const queryClient = useQueryClient();
  const [config, setConfig] = useState<SnowflakeConfig>({
    accountName: '',
    region: 'us-east-1',
    cloudProvider: 'aws',
    warehouseName: 'COMPUTE_WH',
    warehouseSize: 'XSMALL',
    databaseName: 'ANALYTICS_DB',
    schemaName: 'PUBLIC',
    roleName: 'ANALYST_ROLE',
    userName: '',
    enableMultiCluster: false,
    autoSuspend: 300,
    minClusters: 1,
    maxClusters: 3,
    enableDataSharing: false,
    enableTimeTravel: 1,
    enableFailsafe: true,
    networkPolicy: ''
  });
  const [generatedScript, setGeneratedScript] = useState<string>('');
  const [activeTab, setActiveTab] = useState('config');

  const generateMutation = useMutation({
    mutationFn: async (config: SnowflakeConfig) => {
      const response = await apiRequest('POST', '/api/snowflake/generate', config);
      return response.json();
    },
    onSuccess: (data) => {
      setGeneratedScript(data.script);
      setActiveTab('script');
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/usage"] });
      toast({
        title: "Snowflake Setup Generated",
        description: "Your Snowflake configuration scripts have been generated successfully.",
      });
    },
    onError: (error: any) => {
      if (checkForUpgrade(error)) return;
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate Snowflake setup",
        variant: "destructive",
      });
    },
  });

  const handleGenerate = () => {
    if (!config.accountName || !config.warehouseName || !config.databaseName) {
      toast({
        title: "Missing Configuration",
        description: "Please provide account name, warehouse name, and database name.",
        variant: "destructive",
      });
      return;
    }
    generateMutation.mutate(config);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedScript);
    toast({
      title: "Copied to Clipboard",
      description: "Snowflake setup script copied to clipboard.",
    });
  };

  const downloadScript = () => {
    const blob = new Blob([generatedScript], { type: 'text/sql' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `snowflake-setup-${config.databaseName || 'config'}.sql`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const warehouseSizes = [
    { value: 'XSMALL', label: 'X-Small (1 credit/hour)', credits: 1 },
    { value: 'SMALL', label: 'Small (2 credits/hour)', credits: 2 },
    { value: 'MEDIUM', label: 'Medium (4 credits/hour)', credits: 4 },
    { value: 'LARGE', label: 'Large (8 credits/hour)', credits: 8 },
    { value: 'XLARGE', label: 'X-Large (16 credits/hour)', credits: 16 },
    { value: '2XLARGE', label: '2X-Large (32 credits/hour)', credits: 32 },
    { value: '3XLARGE', label: '3X-Large (64 credits/hour)', credits: 64 },
    { value: '4XLARGE', label: '4X-Large (128 credits/hour)', credits: 128 },
  ];

  const regions = {
    aws: [
      { value: 'us-east-1', label: 'US East (N. Virginia)' },
      { value: 'us-west-2', label: 'US West (Oregon)' },
      { value: 'eu-west-1', label: 'EU (Ireland)' },
      { value: 'eu-central-1', label: 'EU (Frankfurt)' },
      { value: 'ap-southeast-1', label: 'Asia Pacific (Singapore)' },
      { value: 'ap-northeast-1', label: 'Asia Pacific (Tokyo)' },
    ],
    azure: [
      { value: 'east-us-2', label: 'East US 2' },
      { value: 'west-us-2', label: 'West US 2' },
      { value: 'west-europe', label: 'West Europe' },
      { value: 'australia-east', label: 'Australia East' },
    ],
    gcp: [
      { value: 'us-central1', label: 'US Central (Iowa)' },
      { value: 'us-east4', label: 'US East (N. Virginia)' },
      { value: 'europe-west4', label: 'Europe West (Netherlands)' },
    ],
  };

  return (
    <div className="relative min-h-screen bg-dark-bg text-white">
      {!isFeatureEnabled && <FeatureDisabledOverlay featureName="Snowflake Setup" />}
      <UpgradeModal open={showUpgradeModal} onOpenChange={setShowUpgradeModal} />
      <Navigation />
      <div className="pt-16 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-lg">
                <Snowflake className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  Snowflake Setup Generator
                </h1>
                <p className="text-gray-400">Configure and generate Snowflake data warehouse setup scripts</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card className="bg-dark-card border-dark-border">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Warehouse className="h-5 w-5 text-blue-400" />
                    <div>
                      <p className="text-sm text-gray-400">Warehouse Sizes</p>
                      <p className="text-lg font-semibold">8 Options</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-dark-card border-dark-border">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-green-400" />
                    <div>
                      <p className="text-sm text-gray-400">Cloud Providers</p>
                      <p className="text-lg font-semibold">AWS, Azure, GCP</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-dark-card border-dark-border">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-purple-400" />
                    <div>
                      <p className="text-sm text-gray-400">Security Features</p>
                      <p className="text-lg font-semibold">Built-in</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-dark-card border-dark-border">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-yellow-400" />
                    <div>
                      <p className="text-sm text-gray-400">Auto-Scaling</p>
                      <p className="text-lg font-semibold">Multi-Cluster</p>
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
              <TabsTrigger value="best-practices" className="data-[state=active]:bg-blue-600">
                Best Practices
              </TabsTrigger>
            </TabsList>

            <TabsContent value="config">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Account Configuration */}
                <Card className="bg-dark-card border-dark-border">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Account Configuration
                    </CardTitle>
                    <CardDescription>
                      Configure your Snowflake account settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="accountName">Account Name</Label>
                      <Input
                        id="accountName"
                        value={config.accountName}
                        onChange={(e) => setConfig(prev => ({ ...prev, accountName: e.target.value }))}
                        placeholder="your-account-id"
                        className="bg-dark-input border-dark-border text-white"
                        data-testid="input-account-name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cloudProvider">Cloud Provider</Label>
                      <Select
                        value={config.cloudProvider}
                        onValueChange={(value) => setConfig(prev => ({ ...prev, cloudProvider: value, region: '' }))}
                      >
                        <SelectTrigger className="bg-dark-input border-dark-border text-white" data-testid="select-cloud-provider">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-dark-card border-dark-border">
                          <SelectItem value="aws">Amazon Web Services (AWS)</SelectItem>
                          <SelectItem value="azure">Microsoft Azure</SelectItem>
                          <SelectItem value="gcp">Google Cloud Platform (GCP)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="region">Region</Label>
                      <Select
                        value={config.region}
                        onValueChange={(value) => setConfig(prev => ({ ...prev, region: value }))}
                      >
                        <SelectTrigger className="bg-dark-input border-dark-border text-white" data-testid="select-region">
                          <SelectValue placeholder="Select region" />
                        </SelectTrigger>
                        <SelectContent className="bg-dark-card border-dark-border">
                          {regions[config.cloudProvider as keyof typeof regions]?.map((region) => (
                            <SelectItem key={region.value} value={region.value}>
                              {region.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="userName">Admin User Name</Label>
                      <Input
                        id="userName"
                        value={config.userName}
                        onChange={(e) => setConfig(prev => ({ ...prev, userName: e.target.value }))}
                        placeholder="ADMIN_USER"
                        className="bg-dark-input border-dark-border text-white"
                        data-testid="input-user-name"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Warehouse Configuration */}
                <Card className="bg-dark-card border-dark-border">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Warehouse className="h-5 w-5" />
                      Warehouse Configuration
                    </CardTitle>
                    <CardDescription>
                      Configure your compute warehouse settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="warehouseName">Warehouse Name</Label>
                      <Input
                        id="warehouseName"
                        value={config.warehouseName}
                        onChange={(e) => setConfig(prev => ({ ...prev, warehouseName: e.target.value.toUpperCase() }))}
                        placeholder="COMPUTE_WH"
                        className="bg-dark-input border-dark-border text-white"
                        data-testid="input-warehouse-name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="warehouseSize">Warehouse Size</Label>
                      <Select
                        value={config.warehouseSize}
                        onValueChange={(value) => setConfig(prev => ({ ...prev, warehouseSize: value }))}
                      >
                        <SelectTrigger className="bg-dark-input border-dark-border text-white" data-testid="select-warehouse-size">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-dark-card border-dark-border">
                          {warehouseSizes.map((size) => (
                            <SelectItem key={size.value} value={size.value}>
                              {size.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="autoSuspend">Auto-Suspend (seconds)</Label>
                      <Input
                        id="autoSuspend"
                        type="number"
                        value={config.autoSuspend}
                        onChange={(e) => setConfig(prev => ({ ...prev, autoSuspend: parseInt(e.target.value) || 0 }))}
                        className="bg-dark-input border-dark-border text-white"
                        data-testid="input-auto-suspend"
                      />
                      <p className="text-xs text-gray-500">Warehouse suspends after this idle time (0 = never)</p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="enableMultiCluster"
                        checked={config.enableMultiCluster}
                        onCheckedChange={(checked) => setConfig(prev => ({ ...prev, enableMultiCluster: !!checked }))}
                        data-testid="checkbox-multi-cluster"
                      />
                      <Label htmlFor="enableMultiCluster" className="text-sm">Enable Multi-Cluster Warehouse</Label>
                    </div>

                    {config.enableMultiCluster && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="minClusters">Min Clusters</Label>
                          <Input
                            id="minClusters"
                            type="number"
                            min={1}
                            max={10}
                            value={config.minClusters}
                            onChange={(e) => setConfig(prev => ({ ...prev, minClusters: parseInt(e.target.value) || 1 }))}
                            className="bg-dark-input border-dark-border text-white"
                            data-testid="input-min-clusters"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="maxClusters">Max Clusters</Label>
                          <Input
                            id="maxClusters"
                            type="number"
                            min={1}
                            max={10}
                            value={config.maxClusters}
                            onChange={(e) => setConfig(prev => ({ ...prev, maxClusters: parseInt(e.target.value) || 3 }))}
                            className="bg-dark-input border-dark-border text-white"
                            data-testid="input-max-clusters"
                          />
                        </div>
                      </div>
                    )}
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
                      Configure your database and schema settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="databaseName">Database Name</Label>
                      <Input
                        id="databaseName"
                        value={config.databaseName}
                        onChange={(e) => setConfig(prev => ({ ...prev, databaseName: e.target.value.toUpperCase() }))}
                        placeholder="ANALYTICS_DB"
                        className="bg-dark-input border-dark-border text-white"
                        data-testid="input-database-name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="schemaName">Schema Name</Label>
                      <Input
                        id="schemaName"
                        value={config.schemaName}
                        onChange={(e) => setConfig(prev => ({ ...prev, schemaName: e.target.value.toUpperCase() }))}
                        placeholder="PUBLIC"
                        className="bg-dark-input border-dark-border text-white"
                        data-testid="input-schema-name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="enableTimeTravel">Time Travel Retention (days)</Label>
                      <Select
                        value={config.enableTimeTravel.toString()}
                        onValueChange={(value) => setConfig(prev => ({ ...prev, enableTimeTravel: parseInt(value) }))}
                      >
                        <SelectTrigger className="bg-dark-input border-dark-border text-white" data-testid="select-time-travel">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-dark-card border-dark-border">
                          <SelectItem value="0">Disabled</SelectItem>
                          <SelectItem value="1">1 day (default)</SelectItem>
                          <SelectItem value="7">7 days</SelectItem>
                          <SelectItem value="14">14 days</SelectItem>
                          <SelectItem value="30">30 days</SelectItem>
                          <SelectItem value="90">90 days (Enterprise)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="enableFailsafe"
                        checked={config.enableFailsafe}
                        onCheckedChange={(checked) => setConfig(prev => ({ ...prev, enableFailsafe: !!checked }))}
                        data-testid="checkbox-failsafe"
                      />
                      <Label htmlFor="enableFailsafe" className="text-sm">Enable Fail-safe (7-day recovery)</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="enableDataSharing"
                        checked={config.enableDataSharing}
                        onCheckedChange={(checked) => setConfig(prev => ({ ...prev, enableDataSharing: !!checked }))}
                        data-testid="checkbox-data-sharing"
                      />
                      <Label htmlFor="enableDataSharing" className="text-sm">Enable Secure Data Sharing</Label>
                    </div>
                  </CardContent>
                </Card>

                {/* Role & Security Configuration */}
                <Card className="bg-dark-card border-dark-border">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Role & Security Configuration
                    </CardTitle>
                    <CardDescription>
                      Configure role-based access control and security
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="roleName">Role Name</Label>
                      <Input
                        id="roleName"
                        value={config.roleName}
                        onChange={(e) => setConfig(prev => ({ ...prev, roleName: e.target.value.toUpperCase() }))}
                        placeholder="ANALYST_ROLE"
                        className="bg-dark-input border-dark-border text-white"
                        data-testid="input-role-name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="networkPolicy">Network Policy Name (optional)</Label>
                      <Input
                        id="networkPolicy"
                        value={config.networkPolicy}
                        onChange={(e) => setConfig(prev => ({ ...prev, networkPolicy: e.target.value }))}
                        placeholder="CORPORATE_NETWORK"
                        className="bg-dark-input border-dark-border text-white"
                        data-testid="input-network-policy"
                      />
                      <p className="text-xs text-gray-500">Leave empty to skip network policy setup</p>
                    </div>

                    <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                      <div className="flex items-start gap-2">
                        <Key className="h-5 w-5 text-yellow-500 mt-0.5" />
                        <div>
                          <p className="text-sm text-yellow-400 font-medium">Security Recommendation</p>
                          <p className="text-xs text-gray-400 mt-1">
                            Always use strong password policies, enable MFA, and follow the principle of least privilege when assigning roles.
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="mt-6 flex justify-center">
                <Button
                  onClick={handleGenerate}
                  disabled={generateMutation.isPending}
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-8 py-6 text-lg"
                  data-testid="button-generate-snowflake"
                >
                  {generateMutation.isPending ? (
                    <>
                      <Snowflake className="h-5 w-5 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Snowflake className="h-5 w-5 mr-2" />
                      Generate Snowflake Setup
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="script">
              <Card className="bg-dark-card border-dark-border">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white flex items-center gap-2">
                      <Table2 className="h-5 w-5" />
                      Generated SQL Script
                    </CardTitle>
                    {generatedScript && (
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={copyToClipboard} data-testid="button-copy-script">
                          <Copy className="h-4 w-4 mr-1" />
                          Copy
                        </Button>
                        <Button variant="outline" size="sm" onClick={downloadScript} data-testid="button-download-script">
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {generatedScript ? (
                    <ScrollArea className="h-[600px]">
                      <pre className="bg-gray-900 p-4 rounded-lg text-sm text-gray-300 overflow-x-auto">
                        {generatedScript}
                      </pre>
                    </ScrollArea>
                  ) : (
                    <div className="text-center py-12">
                      <Snowflake className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-400">No script generated yet</p>
                      <p className="text-sm text-gray-500 mt-2">
                        Configure your settings and click "Generate Snowflake Setup" to create your script
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="best-practices">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-dark-card border-dark-border">
                  <CardHeader>
                    <CardTitle className="text-white">Warehouse Best Practices</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-start gap-2">
                      <Badge className="bg-blue-500/20 text-blue-400">1</Badge>
                      <p className="text-sm text-gray-300">Start small and scale up - begin with X-Small or Small warehouses</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <Badge className="bg-blue-500/20 text-blue-400">2</Badge>
                      <p className="text-sm text-gray-300">Use auto-suspend (300s recommended) to minimize costs</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <Badge className="bg-blue-500/20 text-blue-400">3</Badge>
                      <p className="text-sm text-gray-300">Create separate warehouses for different workloads (ETL, BI, Ad-hoc)</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <Badge className="bg-blue-500/20 text-blue-400">4</Badge>
                      <p className="text-sm text-gray-300">Enable multi-cluster for concurrent users and peak loads</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-dark-card border-dark-border">
                  <CardHeader>
                    <CardTitle className="text-white">Security Best Practices</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-start gap-2">
                      <Badge className="bg-purple-500/20 text-purple-400">1</Badge>
                      <p className="text-sm text-gray-300">Implement role-based access control (RBAC) from day one</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <Badge className="bg-purple-500/20 text-purple-400">2</Badge>
                      <p className="text-sm text-gray-300">Use network policies to restrict access to trusted IPs</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <Badge className="bg-purple-500/20 text-purple-400">3</Badge>
                      <p className="text-sm text-gray-300">Enable multi-factor authentication for all users</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <Badge className="bg-purple-500/20 text-purple-400">4</Badge>
                      <p className="text-sm text-gray-300">Regularly audit user access and permissions</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-dark-card border-dark-border">
                  <CardHeader>
                    <CardTitle className="text-white">Cost Optimization</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-start gap-2">
                      <Badge className="bg-green-500/20 text-green-400">1</Badge>
                      <p className="text-sm text-gray-300">Monitor credit usage with Resource Monitors</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <Badge className="bg-green-500/20 text-green-400">2</Badge>
                      <p className="text-sm text-gray-300">Use clustering keys for frequently filtered columns</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <Badge className="bg-green-500/20 text-green-400">3</Badge>
                      <p className="text-sm text-gray-300">Leverage materialized views for expensive queries</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <Badge className="bg-green-500/20 text-green-400">4</Badge>
                      <p className="text-sm text-gray-300">Schedule heavy workloads during off-peak hours</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-dark-card border-dark-border">
                  <CardHeader>
                    <CardTitle className="text-white">Data Management</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-start gap-2">
                      <Badge className="bg-yellow-500/20 text-yellow-400">1</Badge>
                      <p className="text-sm text-gray-300">Use Time Travel for point-in-time data recovery</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <Badge className="bg-yellow-500/20 text-yellow-400">2</Badge>
                      <p className="text-sm text-gray-300">Enable Fail-safe for disaster recovery scenarios</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <Badge className="bg-yellow-500/20 text-yellow-400">3</Badge>
                      <p className="text-sm text-gray-300">Implement data retention policies for compliance</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <Badge className="bg-yellow-500/20 text-yellow-400">4</Badge>
                      <p className="text-sm text-gray-300">Use Secure Data Sharing for controlled external access</p>
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
