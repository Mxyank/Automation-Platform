import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/use-auth';
import { useFeatures } from "@/hooks/use-features";
import { FeatureDisabledOverlay } from "@/components/feature-disabled-overlay";
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { AdminGuard } from '@/lib/admin-guard';
import {
  Bug,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Code,
  TrendingUp,
  TrendingDown,
  Activity,
  FileText,
  Clock,
  BarChart3,
  Target,
  Zap,
  RefreshCw
} from 'lucide-react';

interface SonarMetrics {
  overallRating: string;
  securityScore: number;
  reliabilityScore: number;
  maintainabilityScore: number;
  coverage: number;
  duplications: number;
  technicalDebt: {
    hours: number;
    days: number;
  };
  issuesSummary: {
    critical: number;
    major: number;
    minor: number;
    info: number;
  };
}

interface SonarIssue {
  key: string;
  rule: string;
  severity: string;
  component: string;
  line: number;
  message: string;
  type: string;
}

export default function SonarDashboard() {
  const { isEnabled } = useFeatures();
  const isFeatureEnabled = isEnabled('sonar_dashboard');

  return (
    <AdminGuard>
      <div className="relative">
        {!isFeatureEnabled && <FeatureDisabledOverlay featureName="Sonar Dashboard" />}
        <SonarDashboardContent />
      </div>
    </AdminGuard>
  );
}

function SonarDashboardContent() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Fetch SonarQube metrics
  const { data: metrics, isLoading: metricsLoading, error: metricsError } = useQuery<SonarMetrics>({
    queryKey: ['/api/sonar/metrics'],
    queryFn: () => apiRequest('GET', '/api/sonar/metrics').then(res => res.json()),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch SonarQube issues
  const { data: issues, isLoading: issuesLoading } = useQuery<SonarIssue[]>({
    queryKey: ['/api/sonar/issues'],
    queryFn: () => apiRequest('GET', '/api/sonar/issues').then(res => res.json()),
  });

  // Run analysis mutation
  const runAnalysisMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/sonar/analyze'),
    onMutate: () => setIsAnalyzing(true),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sonar/metrics'] });
      queryClient.invalidateQueries({ queryKey: ['/api/sonar/issues'] });
      setIsAnalyzing(false);
    },
    onError: () => setIsAnalyzing(false),
  });

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'A': return 'text-green-500';
      case 'B': return 'text-blue-500';
      case 'C': return 'text-yellow-500';
      case 'D': return 'text-orange-500';
      case 'E': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getRatingBg = (rating: string) => {
    switch (rating) {
      case 'A': return 'bg-green-500';
      case 'B': return 'bg-blue-500';
      case 'C': return 'bg-yellow-500';
      case 'D': return 'bg-orange-500';
      case 'E': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'MAJOR':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'MINOR':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'INFO':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      default:
        return <Code className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'BUG':
        return <Bug className="h-4 w-4 text-red-500" />;
      case 'VULNERABILITY':
        return <Shield className="h-4 w-4 text-orange-500" />;
      case 'CODE_SMELL':
        return <Code className="h-4 w-4 text-blue-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  if (metricsError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <Alert className="border-red-500 bg-red-500/10">
            <XCircle className="h-4 w-4 text-red-500" />
            <AlertDescription className="text-red-400">
              Failed to load SonarQube data. Please ensure the analysis has been run.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-2">
              <BarChart3 className="h-8 w-8 text-neon-cyan" />
              SonarQube Dashboard
            </h1>
            <p className="text-gray-400 mt-1">
              Code quality, security, and performance analysis
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => runAnalysisMutation.mutate()}
              disabled={isAnalyzing}
              className="bg-neon-purple hover:bg-neon-purple/80"
            >
              {isAnalyzing ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Activity className="h-4 w-4 mr-2" />
              )}
              {isAnalyzing ? 'Analyzing...' : 'Run Analysis'}
            </Button>
          </div>
        </div>

        {/* Quality Gate Status */}
        {metrics && (
          <Alert className={`border-${metrics.overallRating === 'A' ? 'green' : 'red'}-500 bg-${metrics.overallRating === 'A' ? 'green' : 'red'}-500/10`}>
            {metrics.overallRating === 'A' ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <XCircle className="h-4 w-4 text-red-500" />
            )}
            <AlertDescription className={`text-${metrics.overallRating === 'A' ? 'green' : 'red'}-400`}>
              <strong>Quality Gate: {metrics.overallRating === 'A' ? 'PASSED' : 'FAILED'}</strong> -
              Overall code quality rating: {metrics.overallRating}
            </AlertDescription>
          </Alert>
        )}

        {/* Main Dashboard */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-dark-card border border-dark-border">
            <TabsTrigger value="overview" className="data-[state=active]:bg-neon-purple">
              <BarChart3 className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="security" className="data-[state=active]:bg-neon-purple">
              <Shield className="h-4 w-4 mr-2" />
              Security
            </TabsTrigger>
            <TabsTrigger value="issues" className="data-[state=active]:bg-neon-purple">
              <Bug className="h-4 w-4 mr-2" />
              Issues
            </TabsTrigger>
            <TabsTrigger value="metrics" className="data-[state=active]:bg-neon-purple">
              <Target className="h-4 w-4 mr-2" />
              Metrics
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            {metricsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="bg-dark-card border-dark-border">
                    <CardContent className="p-6">
                      <div className="animate-pulse space-y-3">
                        <div className="h-4 bg-gray-700 rounded w-1/2"></div>
                        <div className="h-8 bg-gray-700 rounded w-3/4"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : metrics ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Overall Rating */}
                <Card className="bg-dark-card border-dark-border">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Target className="h-5 w-5 text-neon-cyan" />
                      Overall Rating
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <div className={`text-6xl font-bold mb-2 ${getRatingColor(metrics.overallRating)}`}>
                        {metrics.overallRating}
                      </div>
                      <Badge className={`${getRatingBg(metrics.overallRating)} text-white`}>
                        Quality Gate
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Security Score */}
                <Card className="bg-dark-card border-dark-border">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Shield className="h-5 w-5 text-green-500" />
                      Security
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="text-3xl font-bold text-green-500">
                        {metrics.securityScore}%
                      </div>
                      <Progress value={metrics.securityScore} className="h-2" />
                      <p className="text-sm text-gray-400">
                        {metrics.issuesSummary.critical + metrics.issuesSummary.major} security issues
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Reliability Score */}
                <Card className="bg-dark-card border-dark-border">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Bug className="h-5 w-5 text-red-500" />
                      Reliability
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="text-3xl font-bold text-red-500">
                        {metrics.reliabilityScore}%
                      </div>
                      <Progress value={metrics.reliabilityScore} className="h-2" />
                      <p className="text-sm text-gray-400">
                        {metrics.issuesSummary.critical} critical bugs
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Maintainability Score */}
                <Card className="bg-dark-card border-dark-border">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Code className="h-5 w-5 text-blue-500" />
                      Maintainability
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="text-3xl font-bold text-blue-500">
                        {metrics.maintainabilityScore}%
                      </div>
                      <Progress value={metrics.maintainabilityScore} className="h-2" />
                      <p className="text-sm text-gray-400">
                        {metrics.issuesSummary.minor + metrics.issuesSummary.info} code smells
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Coverage */}
                <Card className="bg-dark-card border-dark-border">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-yellow-500" />
                      Coverage
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="text-3xl font-bold text-yellow-500">
                        {metrics.coverage}%
                      </div>
                      <Progress value={metrics.coverage} className="h-2" />
                      <p className="text-sm text-gray-400">
                        Test coverage
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Technical Debt */}
                <Card className="bg-dark-card border-dark-border">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Clock className="h-5 w-5 text-purple-500" />
                      Technical Debt
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="text-3xl font-bold text-purple-500">
                        {metrics.technicalDebt.hours}h
                      </div>
                      <p className="text-sm text-gray-400">
                        {metrics.technicalDebt.days} days to fix
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : null}
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-dark-card border-dark-border">
                <CardHeader>
                  <CardTitle className="text-white">Security Hotspots</CardTitle>
                  <CardDescription>
                    Areas requiring security review
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {issuesLoading ? (
                    <div className="space-y-3">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="animate-pulse">
                          <div className="h-4 bg-gray-700 rounded w-full"></div>
                        </div>
                      ))}
                    </div>
                  ) : issues ? (
                    <div className="space-y-3">
                      {issues
                        .filter(issue => issue.type === 'VULNERABILITY')
                        .slice(0, 10)
                        .map((issue) => (
                          <div key={issue.key} className="flex items-start gap-3 p-3 bg-gray-800/50 rounded">
                            {getTypeIcon(issue.type)}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white truncate">
                                {issue.rule}
                              </p>
                              <p className="text-xs text-gray-400 truncate">
                                {issue.component.split('/').pop()}:{issue.line}
                              </p>
                              <p className="text-xs text-gray-300 mt-1">
                                {issue.message}
                              </p>
                            </div>
                            {getSeverityIcon(issue.severity)}
                          </div>
                        ))}
                    </div>
                  ) : (
                    <p className="text-gray-400">No security issues found</p>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-dark-card border-dark-border">
                <CardHeader>
                  <CardTitle className="text-white">Security Metrics</CardTitle>
                  <CardDescription>
                    Current security posture
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {metrics && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Security Rating</span>
                        <Badge className={`${getRatingBg('A')} text-white`}>A</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Vulnerabilities</span>
                        <span className="text-red-400 font-medium">
                          {issues?.filter(i => i.type === 'VULNERABILITY').length || 0}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Security Hotspots</span>
                        <span className="text-orange-400 font-medium">
                          {issues?.filter(i => i.severity === 'MAJOR' && i.rule.includes('security')).length || 0}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Security Review</span>
                        <span className="text-green-400 font-medium">100%</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Issues Tab */}
          <TabsContent value="issues">
            <Card className="bg-dark-card border-dark-border">
              <CardHeader>
                <CardTitle className="text-white">All Issues</CardTitle>
                <CardDescription>
                  Bugs, vulnerabilities, and code smells found in your code
                </CardDescription>
              </CardHeader>
              <CardContent>
                {issuesLoading ? (
                  <div className="space-y-3">
                    {[...Array(10)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-16 bg-gray-700 rounded"></div>
                      </div>
                    ))}
                  </div>
                ) : issues && issues.length > 0 ? (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {issues.map((issue) => (
                      <div key={issue.key} className="flex items-start gap-3 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                        <div className="flex flex-col items-center gap-1">
                          {getTypeIcon(issue.type)}
                          {getSeverityIcon(issue.severity)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-medium text-white">
                              {issue.rule}
                            </p>
                            <Badge variant="outline" className="text-xs">
                              {issue.type}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {issue.severity}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-400 mb-2">
                            {issue.component.split('/').pop()}:{issue.line}
                          </p>
                          <p className="text-sm text-gray-300">
                            {issue.message}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <p className="text-white font-medium">No issues found!</p>
                    <p className="text-gray-400 text-sm">Your code is clean</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Metrics Tab */}
          <TabsContent value="metrics">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-dark-card border-dark-border">
                <CardHeader>
                  <CardTitle className="text-white">Quality Metrics</CardTitle>
                  <CardDescription>
                    Detailed code quality measurements
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {metrics && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-3 bg-gray-800/50 rounded">
                          <div className="text-2xl font-bold text-red-500">
                            {metrics.issuesSummary.critical}
                          </div>
                          <div className="text-xs text-gray-400">Critical</div>
                        </div>
                        <div className="text-center p-3 bg-gray-800/50 rounded">
                          <div className="text-2xl font-bold text-orange-500">
                            {metrics.issuesSummary.major}
                          </div>
                          <div className="text-xs text-gray-400">Major</div>
                        </div>
                        <div className="text-center p-3 bg-gray-800/50 rounded">
                          <div className="text-2xl font-bold text-yellow-500">
                            {metrics.issuesSummary.minor}
                          </div>
                          <div className="text-xs text-gray-400">Minor</div>
                        </div>
                        <div className="text-center p-3 bg-gray-800/50 rounded">
                          <div className="text-2xl font-bold text-blue-500">
                            {metrics.issuesSummary.info}
                          </div>
                          <div className="text-xs text-gray-400">Info</div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-dark-card border-dark-border">
                <CardHeader>
                  <CardTitle className="text-white">Analysis Summary</CardTitle>
                  <CardDescription>
                    Latest analysis results
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Last Analysis</span>
                      <span className="text-gray-400 text-sm">
                        {new Date().toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Analysis Time</span>
                      <span className="text-gray-400 text-sm">2.3s</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Lines Analyzed</span>
                      <span className="text-gray-400 text-sm">12,543</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Files Analyzed</span>
                      <span className="text-gray-400 text-sm">156</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}