import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/use-auth';
import { AdminGuard } from '@/lib/admin-guard';
import { 
  Shield, 
  Lock, 
  Eye, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Key,
  Users,
  Network,
  FileText,
  Clock,
  Settings
} from 'lucide-react';

export default function SecurityDashboard() {
  return (
    <AdminGuard>
      <SecurityDashboardContent />
    </AdminGuard>
  );
}

function SecurityDashboardContent() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  // Security features overview
  const securityFeatures = [
    {
      name: 'Authentication & Authorization',
      status: 'active',
      description: 'Multi-factor authentication with session management',
      features: [
        'Password-based authentication with secure hashing',
        'Google OAuth integration',
        'Session timeout and validation',
        'Role-based access control (RBAC)',
        'Resource ownership validation'
      ]
    },
    {
      name: 'Rate Limiting',
      status: 'active',
      description: 'Prevents abuse and DDoS attacks',
      features: [
        'Global rate limiting: 100 requests per 15 minutes',
        'Auth rate limiting: 5 attempts per 15 minutes',
        'API rate limiting: 20 requests per minute',
        'IP-based tracking and blocking'
      ]
    },
    {
      name: 'Input Validation & Sanitization',
      status: 'active',
      description: 'Prevents injection attacks and malicious input',
      features: [
        'SQL injection prevention',
        'XSS protection',
        'Path traversal protection',
        'Request validation with express-validator',
        'Content-type validation'
      ]
    },
    {
      name: 'Security Headers',
      status: 'active',
      description: 'Browser security protections',
      features: [
        'Content Security Policy (CSP)',
        'X-Frame-Options (Clickjacking protection)',
        'X-Content-Type-Options (MIME sniffing prevention)',
        'X-XSS-Protection',
        'Strict-Transport-Security (HTTPS enforcement)'
      ]
    },
    {
      name: 'Session Security',
      status: 'active',
      description: 'Secure session management',
      features: [
        'Session hijacking detection',
        'IP address validation',
        'Session timeout (2 hours)',
        'Secure session storage',
        'Session invalidation on security violations'
      ]
    },
    {
      name: 'Data Protection',
      status: 'active',
      description: 'Protects sensitive user data',
      features: [
        'Password encryption with crypto.scrypt',
        'Secure database connections',
        'Environment variable protection',
        'Credit card data handled by Razorpay (PCI compliant)',
        'No sensitive data in logs'
      ]
    }
  ];

  const securityEndpoints = [
    { path: '/api/user', method: 'GET', protection: 'Authentication Required', rateLimit: '20/min' },
    { path: '/api/generate/*', method: 'POST', protection: 'Auth + Credits + Validation', rateLimit: '20/min' },
    { path: '/api/admin/*', method: 'ALL', protection: 'Admin Only (agrawalmayank200228@gmail.com)', rateLimit: '20/min' },
    { path: '/api/payment/*', method: 'POST', protection: 'Auth + Input Validation', rateLimit: '5/min' },
    { path: '/api/projects/*', method: 'ALL', protection: 'Auth + Ownership Validation', rateLimit: '20/min' },
    { path: '/api/ai/*', method: 'POST', protection: 'Auth + Credits + Rate Limiting', rateLimit: '10/min' },
    { path: '/auth/*', method: 'POST', protection: 'Rate Limited + Input Validation', rateLimit: '5/15min' },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Shield className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-2">
              <Shield className="h-8 w-8 text-neon-cyan" />
              Security Dashboard
            </h1>
            <p className="text-gray-400 mt-1">
              Comprehensive security overview and protection status
            </p>
          </div>
          <Badge className="bg-green-500 text-white text-sm px-3 py-1">
            <CheckCircle className="h-4 w-4 mr-1" />
            All Systems Secure
          </Badge>
        </div>

        {/* Security Status Alert */}
        <Alert className="border-green-500 bg-green-500/10">
          <Shield className="h-4 w-4 text-green-500" />
          <AlertDescription className="text-green-400">
            <strong>Security Status: ACTIVE</strong> - All security measures are operational and protecting your application.
          </AlertDescription>
        </Alert>

        {/* Main Dashboard */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-dark-card border border-dark-border">
            <TabsTrigger value="overview" className="data-[state=active]:bg-neon-purple">
              <Eye className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="endpoints" className="data-[state=active]:bg-neon-purple">
              <Lock className="h-4 w-4 mr-2" />
              Protected Endpoints
            </TabsTrigger>
            <TabsTrigger value="testing" className="data-[state=active]:bg-neon-purple">
              <Settings className="h-4 w-4 mr-2" />
              Security Testing
            </TabsTrigger>
            <TabsTrigger value="guides" className="data-[state=active]:bg-neon-purple">
              <FileText className="h-4 w-4 mr-2" />
              Implementation Guide
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {securityFeatures.map((feature) => (
                <Card key={feature.name} className="bg-dark-card border-dark-border">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-white flex items-center gap-2">
                        {getStatusIcon(feature.status)}
                        {feature.name}
                      </CardTitle>
                      <Badge className={`${getStatusColor(feature.status)} text-white`}>
                        {feature.status.toUpperCase()}
                      </Badge>
                    </div>
                    <CardDescription className="text-gray-400">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {feature.features.map((item, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-gray-300">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Endpoints Tab */}
          <TabsContent value="endpoints">
            <Card className="bg-dark-card border-dark-border">
              <CardHeader>
                <CardTitle className="text-white">Protected API Endpoints</CardTitle>
                <CardDescription>
                  All endpoints are secured with multiple layers of protection
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left p-3 text-gray-400">Endpoint</th>
                        <th className="text-left p-3 text-gray-400">Method</th>
                        <th className="text-left p-3 text-gray-400">Protection</th>
                        <th className="text-left p-3 text-gray-400">Rate Limit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {securityEndpoints.map((endpoint, index) => (
                        <tr key={index} className="border-b border-gray-800 hover:bg-gray-800/50">
                          <td className="p-3 text-blue-400 font-mono">{endpoint.path}</td>
                          <td className="p-3">
                            <Badge variant="outline" className="text-xs">
                              {endpoint.method}
                            </Badge>
                          </td>
                          <td className="p-3 text-green-400">{endpoint.protection}</td>
                          <td className="p-3 text-yellow-400">{endpoint.rateLimit}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Testing Tab */}
          <TabsContent value="testing">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-dark-card border-dark-border">
                <CardHeader>
                  <CardTitle className="text-white">Security Tests You Can Perform</CardTitle>
                  <CardDescription>
                    Manual tests to verify security implementations
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-white">1. Rate Limiting Test</h4>
                    <p className="text-xs text-gray-400">
                      Make 6+ login attempts within 15 minutes to trigger rate limiting
                    </p>
                    <code className="block text-xs bg-gray-800 p-2 rounded text-green-400">
                      curl -X POST http://localhost:5000/api/login -d '{}'
                    </code>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-white">2. SQL Injection Test</h4>
                    <p className="text-xs text-gray-400">
                      Try injecting SQL in any input field (should be blocked)
                    </p>
                    <code className="block text-xs bg-gray-800 p-2 rounded text-green-400">
                      username: admin'; DROP TABLE users; --
                    </code>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-white">3. XSS Test</h4>
                    <p className="text-xs text-gray-400">
                      Try injecting scripts (should be sanitized)
                    </p>
                    <code className="block text-xs bg-gray-800 p-2 rounded text-green-400">
                      {`<script>alert('xss')</script>`}
                    </code>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-white">4. Unauthorized Access</h4>
                    <p className="text-xs text-gray-400">
                      Access protected endpoints without authentication
                    </p>
                    <code className="block text-xs bg-gray-800 p-2 rounded text-green-400">
                      curl http://localhost:5000/api/projects
                    </code>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-dark-card border-dark-border">
                <CardHeader>
                  <CardTitle className="text-white">Security Headers Check</CardTitle>
                  <CardDescription>
                    Verify security headers in browser DevTools
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm space-y-2">
                    <p className="text-gray-300">Open DevTools → Network → Check response headers:</p>
                    <ul className="space-y-1 text-xs text-gray-400 ml-4">
                      <li>• X-Frame-Options: DENY</li>
                      <li>• X-Content-Type-Options: nosniff</li>
                      <li>• X-XSS-Protection: 1; mode=block</li>
                      <li>• Content-Security-Policy: (configured)</li>
                      <li>• Strict-Transport-Security: (on HTTPS)</li>
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-white">Admin Access Test</h4>
                    <p className="text-xs text-gray-400">
                      Only agrawalmayank200228@gmail.com can access /logs and /metrics
                    </p>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => window.open('/logs', '_blank')}
                      className="text-xs"
                    >
                      Test Admin Access
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Implementation Guide Tab */}
          <TabsContent value="guides">
            <Card className="bg-dark-card border-dark-border">
              <CardHeader>
                <CardTitle className="text-white">Security Implementation Details</CardTitle>
                <CardDescription>
                  How security is implemented in your application
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white">Middleware Stack</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-gray-300">helmet() - Security headers</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-gray-300">corsMiddleware - CORS protection</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        <span className="text-gray-300">validateInput - SQL/XSS prevention</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <span className="text-gray-300">globalRateLimit - Rate limiting</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        <span className="text-gray-300">sessionSecurity - Session protection</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white">Route Protection</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Key className="h-4 w-4 text-blue-400" />
                        <span className="text-gray-300">enhancedRequireAuth()</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-green-400" />
                        <span className="text-gray-300">requireRole(['admin'])</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Lock className="h-4 w-4 text-yellow-400" />
                        <span className="text-gray-300">requireOwnership()</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-purple-400" />
                        <span className="text-gray-300">requireCredits()</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Network className="h-4 w-4 text-red-400" />
                        <span className="text-gray-300">apiRateLimit</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-700 pt-6">
                  <h3 className="text-lg font-semibold text-white mb-4">File Structure</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <h4 className="font-medium text-gray-300 mb-2">Security Middleware</h4>
                      <ul className="space-y-1 text-gray-400 font-mono text-xs">
                        <li>server/middleware/security.ts</li>
                        <li>server/middleware/auth-guard.ts</li>
                        <li>server/middleware/admin-auth.ts</li>
                        <li>server/middleware/prometheus.ts</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-300 mb-2">Protected Routes</h4>
                      <ul className="space-y-1 text-gray-400 font-mono text-xs">
                        <li>server/routes.ts (main routes)</li>
                        <li>server/auth.ts (authentication)</li>
                        <li>client/src/lib/protected-route.tsx</li>
                      </ul>
                    </div>
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