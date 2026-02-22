import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/use-auth';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useFeatures } from "@/hooks/use-features";
import { FeatureDisabledOverlay } from "@/components/feature-disabled-overlay";
import { AdminGuard } from '@/lib/admin-guard';
import {
  Activity,
  AlertTriangle,
  Database,
  Server,
  Users,
  Zap,
  RefreshCw,
  Download,
  Eye,
  TrendingUp,
  Clock,
  AlertCircle
} from 'lucide-react';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  message: string;
  userId?: string;
  route?: string;
  duration?: number;
  metadata?: any;
}

interface MetricData {
  name: string;
  value: number;
  unit?: string;
  change?: number;
  status: 'good' | 'warning' | 'error';
}

interface SystemHealth {
  cpu: number;
  memory: number;
  disk: number;
  database: 'healthy' | 'warning' | 'error';
  redis: 'healthy' | 'warning' | 'error';
  status: 'healthy' | 'degraded' | 'down';
}

export default function LogsDashboard() {
  const { isEnabled } = useFeatures();
  const isFeatureEnabled = isEnabled('logs_dashboard');

  return (
    <AdminGuard>
      <div className="relative">
        {!isFeatureEnabled && <FeatureDisabledOverlay featureName="Logs Dashboard" />}
        <LogsDashboardContent />
      </div>
    </AdminGuard>
  );
}

function LogsDashboardContent() {
  const { user } = useAuth();
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedLogLevel, setSelectedLogLevel] = useState<string>('all');

  // Check admin access
  const isAdmin = user?.email === 'agrawalmayank200228@gmail.com';

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <Card className="w-full max-w-md mx-auto bg-dark-card border-dark-border">
          <CardHeader className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-white">Access Denied</CardTitle>
            <CardDescription className="text-gray-400">
              You do not have permission to access the monitoring dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 text-center">
              This feature is restricted to administrators only.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fetch logs
  const { data: logs = [], refetch: refetchLogs } = useQuery({
    queryKey: ['/api/admin/logs', selectedLogLevel],
    queryFn: () => apiRequest('GET', `/api/admin/logs?level=${selectedLogLevel}`).then(res => res.json()),
    refetchInterval: autoRefresh ? 5000 : false,
  });

  // Fetch metrics
  const { data: metrics = [], refetch: refetchMetrics } = useQuery({
    queryKey: ['/api/admin/metrics'],
    queryFn: () => apiRequest('GET', '/api/admin/metrics').then(res => res.json()),
    refetchInterval: autoRefresh ? 10000 : false,
  });

  // Fetch system health
  const { data: systemHealth, refetch: refetchHealth } = useQuery({
    queryKey: ['/api/admin/health'],
    queryFn: () => apiRequest('GET', '/api/admin/health').then(res => res.json()),
    refetchInterval: autoRefresh ? 15000 : false,
  });

  const handleRefreshAll = () => {
    refetchLogs();
    refetchMetrics();
    refetchHealth();
  };

  const exportLogs = async () => {
    try {
      const response = await apiRequest('GET', '/api/admin/logs/export');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `logs-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export logs:', error);
    }
  };

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'ERROR':
        return 'bg-red-500';
      case 'WARN':
        return 'bg-yellow-500';
      case 'INFO':
        return 'bg-blue-500';
      case 'DEBUG':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'good':
        return 'text-green-500';
      case 'warning':
        return 'text-yellow-500';
      case 'error':
      case 'degraded':
      case 'down':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-2">
              <Activity className="h-8 w-8 text-neon-cyan" />
              System Monitoring
            </h1>
            <p className="text-gray-400 mt-1">
              Real-time application monitoring and logs
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`${autoRefresh ? 'text-green-400 border-green-400' : 'text-gray-400'}`}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
              Auto Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshAll}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportLogs}
            >
              <Download className="h-4 w-4 mr-2" />
              Export Logs
            </Button>
          </div>
        </div>

        {/* System Health Overview */}
        {systemHealth && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-dark-card border-dark-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">System Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${systemHealth.status === 'healthy' ? 'bg-green-500' :
                      systemHealth.status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
                    }`} />
                  <span className={`capitalize font-medium ${getStatusColor(systemHealth.status)}`}>
                    {systemHealth.status}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-dark-card border-dark-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">CPU Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Server className="h-4 w-4 text-blue-400" />
                  <span className="text-white font-medium">{systemHealth.cpu}%</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-dark-card border-dark-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Memory Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-400" />
                  <span className="text-white font-medium">{systemHealth.memory}%</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-dark-card border-dark-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Database</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-green-400" />
                  <span className={`capitalize font-medium ${getStatusColor(systemHealth.database)}`}>
                    {systemHealth.database}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Dashboard */}
        <Tabs defaultValue="logs" className="space-y-4">
          <TabsList className="bg-dark-card border border-dark-border">
            <TabsTrigger value="logs" className="data-[state=active]:bg-neon-purple">
              <Eye className="h-4 w-4 mr-2" />
              Logs
            </TabsTrigger>
            <TabsTrigger value="metrics" className="data-[state=active]:bg-neon-purple">
              <TrendingUp className="h-4 w-4 mr-2" />
              Metrics
            </TabsTrigger>
            <TabsTrigger value="performance" className="data-[state=active]:bg-neon-purple">
              <Activity className="h-4 w-4 mr-2" />
              Performance
            </TabsTrigger>
          </TabsList>

          {/* Logs Tab */}
          <TabsContent value="logs">
            <Card className="bg-dark-card border-dark-border">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-white">Application Logs</CardTitle>
                    <CardDescription>
                      Real-time application logs and events
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {['all', 'ERROR', 'WARN', 'INFO', 'DEBUG'].map((level) => (
                      <Button
                        key={level}
                        variant={selectedLogLevel === level ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedLogLevel(level)}
                        className={selectedLogLevel === level ? 'bg-neon-purple' : ''}
                      >
                        {level}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-2">
                    {logs.length === 0 ? (
                      <div className="text-center py-8 text-gray-400">
                        No logs available
                      </div>
                    ) : (
                      logs.map((log: LogEntry) => (
                        <div
                          key={log.id}
                          className="flex items-start gap-3 p-3 rounded-lg bg-gray-800/50 border border-gray-700"
                        >
                          <Badge className={`${getLogLevelColor(log.level)} text-white text-xs`}>
                            {log.level}
                          </Badge>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
                              <Clock className="h-3 w-3" />
                              {new Date(log.timestamp).toLocaleString()}
                              {log.userId && (
                                <>
                                  <Users className="h-3 w-3 ml-2" />
                                  User {log.userId}
                                </>
                              )}
                              {log.duration && (
                                <>
                                  <Activity className="h-3 w-3 ml-2" />
                                  {log.duration}ms
                                </>
                              )}
                            </div>
                            <p className="text-white text-sm font-mono">
                              {log.message}
                            </p>
                            {log.route && (
                              <p className="text-xs text-blue-400 mt-1">
                                {log.route}
                              </p>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Metrics Tab */}
          <TabsContent value="metrics">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {metrics.map((metric: MetricData) => (
                <Card key={metric.name} className="bg-dark-card border-dark-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-400">
                      {metric.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-white">
                        {metric.value}
                        {metric.unit && (
                          <span className="text-sm text-gray-400 ml-1">
                            {metric.unit}
                          </span>
                        )}
                      </span>
                      {metric.change && (
                        <Badge
                          className={
                            metric.change > 0
                              ? 'bg-green-500 text-white'
                              : 'bg-red-500 text-white'
                          }
                        >
                          {metric.change > 0 ? '+' : ''}{metric.change}%
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance">
            <Card className="bg-dark-card border-dark-border">
              <CardHeader>
                <CardTitle className="text-white">Performance Metrics</CardTitle>
                <CardDescription>
                  Application performance and resource usage
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center py-8 text-gray-400">
                    Performance charts will be implemented here
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}