import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Navigation } from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Users,
  Shield,
  Database,
  Activity,
  CreditCard,
  BarChart3,
  AlertTriangle,
  UserPlus,
  UserMinus,
  Eye,
  Server,
  Code,
  ChevronRight,
  Crown,
  Clock,
  ExternalLink,
  Search,
  RefreshCw,
  Bell,
  Send,
  Download,
  FileText,
  Zap,
  MessageSquare,
  Rabbit,
  HardDrive,
  Target,
  Monitor,
  ArrowRight,
  Copy,
  Check,
  FileCode,
  Inbox,
  Ban,
  Coins,
  MessageCircle,
  Globe,
  Bug,
  CheckCircle,
  XCircle,
  Star,
  Tag,
  Sparkles
} from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";

const PRIMARY_ADMIN_EMAIL = "agrawalmayank200228@gmail.com";

interface PlatformStats {
  totalUsers: number;
  totalProjects: number;
  totalPayments: number;
  premiumUsers: number;
  adminCount: number;
  totalSubscriptions: number;
  totalPaymentAmount: number;
}

interface AdminUser {
  id: number;
  username: string;
  email: string;
  credits: number;
  isPremium: boolean;
  isAdmin: boolean;
  provider: string;
  createdAt: string;
  adminGrantedBy?: string;
  adminGrantedAt?: string;
}

interface SecurityLog {
  id: number;
  userId: number | null;
  action: string;
  ipAddress: string | null;
  userAgent: string | null;
  details: any;
  severity: string;
  createdAt: string;
}

interface ApiEndpointDoc {
  name: string;
  method: string;
  path: string;
  description: string;
  category: string;
  auth: string;
  requestBody?: any;
  queryParams?: any[];
  pathParams?: any[];
  responses: any[];
}

interface DatabaseTable {
  name: string;
  columnCount: number;
}

interface NotificationTemplate {
  id: string;
  name: string;
  title: string;
  body: string;
  url: string;
}

interface Incident {
  id: number;
  userId: number;
  userEmail: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
  messages?: IncidentMessage[];
}

interface IncidentMessage {
  id: number;
  incidentId: number;
  senderId: number;
  senderRole: string;
  message: string;
  createdAt: string;
}

interface QueueMetrics {
  kafka: {
    name: string;
    status: string;
    messagesProduced: number;
    messagesConsumed: number;
    queueDepth: number;
    latencyMs: number;
    throughputPerSec: number;
    consumers: number;
    partitions: number;
    topics: string[];
    lastActivity: string;
  };
  rabbitmq: {
    name: string;
    status: string;
    messagesProduced: number;
    messagesConsumed: number;
    queueDepth: number;
    latencyMs: number;
    throughputPerSec: number;
    consumers: number;
    topics: string[];
    lastActivity: string;
  };
  redis: {
    name: string;
    status: string;
    connectedClients: number;
    usedMemoryMB: number;
    usedMemoryPeakMB: number;
    totalCommands: number;
    commandsPerSec: number;
    hitRate: number;
    keyCount: number;
    expiredKeys: number;
    evictedKeys: number;
    uptimeSeconds: number;
    lastActivity: string;
  };
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [notificationTitle, setNotificationTitle] = useState("");
  const [notificationBody, setNotificationBody] = useState("");
  const [notificationUrl, setNotificationUrl] = useState("/dashboard");
  const [notificationTarget, setNotificationTarget] = useState("all");
  const [selectedEndpoint, setSelectedEndpoint] = useState<ApiEndpointDoc | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [apiSearchQuery, setApiSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [creditEmail, setCreditEmail] = useState("");
  const [creditAmount, setCreditAmount] = useState("");

  const isAdmin = user && ((user as any).isAdmin || (user as any).email === PRIMARY_ADMIN_EMAIL);
  const isPrimaryAdmin = user?.email === PRIMARY_ADMIN_EMAIL;

  useEffect(() => {
    if (user && !isAdmin) {
      navigate("/dashboard");
      toast({
        title: "Access Denied",
        description: "You don't have admin privileges",
        variant: "destructive",
      });
    }
  }, [user, isAdmin, navigate, toast]);

  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery<PlatformStats>({
    queryKey: ["/api/admin/stats"],
    enabled: !!isAdmin,
  });

  const { data: users = [], isLoading: usersLoading, refetch: refetchUsers } = useQuery<AdminUser[]>({
    queryKey: ["/api/admin/users"],
    enabled: !!isAdmin,
  });

  const { data: admins = [], refetch: refetchAdmins } = useQuery<AdminUser[]>({
    queryKey: ["/api/admin/admins"],
    enabled: !!isAdmin,
  });

  const { data: securityLogs = [], isLoading: logsLoading, refetch: refetchLogs } = useQuery<SecurityLog[]>({
    queryKey: ["/api/admin/security-logs"],
    enabled: !!isAdmin,
  });

  const { data: apiDocs = [] } = useQuery<ApiEndpointDoc[]>({
    queryKey: ["/api/admin/api-docs"],
    enabled: !!isAdmin,
  });

  const { data: dbTables = [], refetch: refetchTables } = useQuery<DatabaseTable[]>({
    queryKey: ["/api/admin/database-tables"],
    enabled: !!isAdmin,
  });

  const { data: tableSchema = [] } = useQuery({
    queryKey: ["/api/admin/table-schema", selectedTable],
    enabled: !!selectedTable && !!isAdmin,
  });

  const { data: notificationTemplates = [] } = useQuery<NotificationTemplate[]>({
    queryKey: ["/api/admin/notification-templates"],
    enabled: !!isAdmin,
  });

  const { data: queueMetrics, refetch: refetchQueueMetrics } = useQuery<QueueMetrics>({
    queryKey: ["/api/admin/queue-metrics"],
    enabled: !!isAdmin,
    refetchInterval: 10000,
  });

  const { data: incidents = [], refetch: refetchIncidents } = useQuery<Incident[]>({
    queryKey: ["/api/admin/incidents"],
    enabled: !!isAdmin,
  });

  interface DomainConfig {
    domain: string;
    isEnabled: boolean;
    comingSoonMessage?: string;
  }

  interface SiteSetting {
    id: number;
    key: string;
    value: boolean;
    stringValue?: string | null;
    numberValue?: number | null;
    label: string;
    description?: string;
    updatedAt: string;
  }

  const { data: domainConfigs = [], refetch: refetchDomainConfigs } = useQuery<DomainConfig[]>({
    queryKey: ["/api/domain-configs"],
    enabled: !!isAdmin,
  });

  const { data: siteSettings = [], refetch: refetchSiteSettings } = useQuery<SiteSetting[]>({
    queryKey: ["/api/site-settings"],
    enabled: !!isAdmin,
  });

  const getSetting = (key: string) => siteSettings.find(s => s.key === key);

  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [incidentMessage, setIncidentMessage] = useState("");
  const [banReason, setBanReason] = useState("");

  const grantAdminMutation = useMutation({
    mutationFn: async (email: string) => {
      return apiRequest("POST", "/api/admin/grant-admin", { email });
    },
    onSuccess: () => {
      toast({
        title: "Admin Access Granted",
        description: `${newAdminEmail} now has admin privileges`,
      });
      setNewAdminEmail("");
      refetchUsers();
      refetchAdmins();
      refetchStats();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to grant admin access",
        variant: "destructive",
      });
    },
  });

  const revokeAdminMutation = useMutation({
    mutationFn: async (userId: number) => {
      return apiRequest("POST", "/api/admin/revoke-admin", { userId });
    },
    onSuccess: () => {
      toast({
        title: "Admin Access Revoked",
        description: "Admin privileges have been removed",
      });
      refetchUsers();
      refetchAdmins();
      refetchStats();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to revoke admin access",
        variant: "destructive",
      });
    },
  });

  const grantImpersonateMutation = useMutation({
    mutationFn: async (userId: number) => {
      return apiRequest("POST", "/api/admin/grant-impersonate", { userId });
    },
    onSuccess: () => {
      toast({
        title: "Impersonation Access Granted",
        description: "User can now switch to other accounts",
      });
      refetchAdmins();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to grant impersonation access",
        variant: "destructive",
      });
    },
  });

  const revokeImpersonateMutation = useMutation({
    mutationFn: async (userId: number) => {
      return apiRequest("POST", "/api/admin/revoke-impersonate", { userId });
    },
    onSuccess: () => {
      toast({
        title: "Impersonation Access Revoked",
        description: "User can no longer switch to other accounts",
      });
      refetchAdmins();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to revoke impersonation access",
        variant: "destructive",
      });
    },
  });

  const sendNotificationMutation = useMutation({
    mutationFn: async (data: { title: string; body: string; url: string; targetType: string }) => {
      return apiRequest("POST", "/api/admin/send-notification", data);
    },
    onSuccess: () => {
      toast({
        title: "Notification Sent",
        description: "Push notification has been sent successfully",
      });
      setNotificationTitle("");
      setNotificationBody("");
      setNotificationUrl("/dashboard");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send notification",
        variant: "destructive",
      });
    },
  });

  const banUserMutation = useMutation({
    mutationFn: async (data: { userId: number; reason: string }) => {
      return apiRequest("POST", "/api/admin/ban-user", data);
    },
    onSuccess: () => {
      toast({ title: "User Banned", description: "User has been banned successfully" });
      refetchUsers();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to ban user", variant: "destructive" });
    },
  });

  const unbanUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      return apiRequest("POST", "/api/admin/unban-user", { userId });
    },
    onSuccess: () => {
      toast({ title: "User Unbanned", description: "User has been unbanned successfully" });
      refetchUsers();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to unban user", variant: "destructive" });
    },
  });

  const updateCreditsMutation = useMutation({
    mutationFn: async (data: { email: string; credits: number }) => {
      return apiRequest("POST", "/api/admin/update-credits", data);
    },
    onSuccess: () => {
      toast({ title: "Credits Updated", description: "User credits have been updated" });
      setCreditEmail("");
      setCreditAmount("");
      refetchUsers();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update credits", variant: "destructive" });
    },
  });

  const updateIncidentStatusMutation = useMutation({
    mutationFn: async (data: { incidentId: number; status: string }) => {
      return apiRequest("PUT", `/api/admin/incidents/${data.incidentId}/status`, { status: data.status });
    },
    onSuccess: () => {
      toast({ title: "Status Updated", description: "Incident status has been updated" });
      refetchIncidents();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update status", variant: "destructive" });
    },
  });

  const sendIncidentMessageMutation = useMutation({
    mutationFn: async (data: { incidentId: number; message: string }) => {
      return apiRequest("POST", `/api/admin/incidents/${data.incidentId}/message`, { message: data.message });
    },
    onSuccess: () => {
      toast({ title: "Message Sent", description: "Reply has been sent to user" });
      setIncidentMessage("");
      refetchIncidents();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to send message", variant: "destructive" });
    },
  });

  const updateDomainConfigMutation = useMutation({
    mutationFn: async (data: { domain: string; isEnabled: boolean; comingSoonMessage?: string }) => {
      return apiRequest("PUT", `/api/admin/domain-configs/${data.domain}`, { isEnabled: data.isEnabled, comingSoonMessage: data.comingSoonMessage });
    },
    onSuccess: () => {
      toast({ title: "Domain Updated", description: "Domain configuration has been updated" });
      refetchDomainConfigs();
      queryClient.invalidateQueries({ queryKey: ["/api/domain-configs"] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update domain", variant: "destructive" });
    },
  });

  const updateSiteSettingMutation = useMutation({
    mutationFn: async ({ key, value, stringValue, numberValue }: { key: string, value?: boolean, stringValue?: string, numberValue?: number }) => {
      return apiRequest("PATCH", `/api/site-settings/${key}`, { value, stringValue, numberValue });
    },
    onSuccess: () => {
      toast({
        title: "Setting Updated",
        description: "Configuration has been saved successfully",
      });
      refetchSiteSettings();
      queryClient.invalidateQueries({ queryKey: ["/api/site-settings"] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update setting", variant: "destructive" });
    },
  });

  const handleRefreshAll = () => {
    refetchStats();
    refetchUsers();
    refetchAdmins();
    refetchLogs();
    refetchTables();
    refetchQueueMetrics();
    refetchIncidents();
    toast({
      title: "Data Refreshed",
      description: "All admin data has been refreshed",
    });
  };

  const handleApplyTemplate = (template: NotificationTemplate) => {
    setNotificationTitle(template.title);
    setNotificationBody(template.body);
    setNotificationUrl(template.url);
    toast({
      title: "Template Applied",
      description: `"${template.name}" template loaded`,
    });
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
    toast({
      title: "Copied",
      description: `${label} copied to clipboard`,
    });
  };

  const filteredUsers = users.filter(u =>
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categories = Array.from(new Set(apiDocs.map(doc => doc.category)));

  const filteredApiDocs = apiDocs.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(apiSearchQuery.toLowerCase()) ||
      doc.path.toLowerCase().includes(apiSearchQuery.toLowerCase()) ||
      doc.description.toLowerCase().includes(apiSearchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || doc.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "bg-red-500/20 text-red-400 border-red-500/50";
      case "warning": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50";
      default: return "bg-blue-500/20 text-blue-400 border-blue-500/50";
    }
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case "GET": return "bg-green-500/20 text-green-400";
      case "POST": return "bg-blue-500/20 text-blue-400";
      case "PUT": return "bg-yellow-500/20 text-yellow-400";
      case "DELETE": return "bg-red-500/20 text-red-400";
      default: return "bg-gray-500/20 text-gray-400";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "connected": return "text-green-400";
      case "simulated": return "text-blue-400";
      case "disconnected": return "text-red-400";
      default: return "text-gray-400";
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <Card className="bg-dark-card border-gray-800 p-8">
          <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white text-center">Access Denied</h2>
          <p className="text-gray-400 text-center mt-2">You don't have admin privileges</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg">
      <Navigation />

      <div className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <Shield className="w-8 h-8 text-neon-cyan" />
                <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
              </div>
              <p className="text-gray-400 mt-1">Platform management and monitoring</p>
            </div>
            <Button
              onClick={handleRefreshAll}
              variant="outline"
              className="border-gray-700 text-gray-300 hover:text-white"
              data-testid="button-refresh-all"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh All
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card className="bg-dark-card border-gray-800">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Total Users</p>
                      <p className="text-2xl font-bold text-white">{stats?.totalUsers || 0}</p>
                    </div>
                    <Users className="w-8 h-8 text-neon-cyan" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card className="bg-dark-card border-gray-800">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Projects</p>
                      <p className="text-2xl font-bold text-white">{stats?.totalProjects || 0}</p>
                    </div>
                    <Code className="w-8 h-8 text-neon-purple" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card className="bg-dark-card border-gray-800">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Premium Users</p>
                      <p className="text-2xl font-bold text-white">{stats?.premiumUsers || 0}</p>
                    </div>
                    <Crown className="w-8 h-8 text-yellow-500" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <Card className="bg-dark-card border-gray-800">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Payments</p>
                      <p className="text-2xl font-bold text-white">{stats?.totalPayments || 0}</p>
                    </div>
                    <CreditCard className="w-8 h-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
              <Card className="bg-dark-card border-gray-800">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Admins</p>
                      <p className="text-2xl font-bold text-white">{stats?.adminCount || 0}</p>
                    </div>
                    <Shield className="w-8 h-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
              <Card className="bg-dark-card border-gray-800">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Total Subscriptions</p>
                      <p className="text-2xl font-bold text-white" data-testid="text-total-subscriptions">{stats?.totalSubscriptions || 0}</p>
                    </div>
                    <Crown className="w-8 h-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
              <Card className="bg-dark-card border-gray-800">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Total Revenue</p>
                      <p className="text-2xl font-bold text-white" data-testid="text-total-revenue">₹{((stats?.totalPaymentAmount || 0) / 100).toLocaleString()}</p>
                    </div>
                    <CreditCard className="w-8 h-8 text-emerald-500" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <Tabs defaultValue="users" className="space-y-6">
            <TabsList className="bg-dark-card border border-gray-800 flex-wrap h-auto gap-1 p-1">
              <TabsTrigger value="users" className="data-[state=active]:bg-neon-cyan/20" data-testid="tab-users">
                <Users className="w-4 h-4 mr-2" />
                Users
              </TabsTrigger>
              <TabsTrigger value="admins" className="data-[state=active]:bg-neon-cyan/20" data-testid="tab-admins">
                <Shield className="w-4 h-4 mr-2" />
                Admins
              </TabsTrigger>
              <TabsTrigger value="notifications" className="data-[state=active]:bg-neon-cyan/20" data-testid="tab-notifications">
                <Bell className="w-4 h-4 mr-2" />
                Notifications
              </TabsTrigger>
              <TabsTrigger value="security" className="data-[state=active]:bg-neon-cyan/20" data-testid="tab-security">
                <AlertTriangle className="w-4 h-4 mr-2" />
                Security
              </TabsTrigger>
              <TabsTrigger value="queues" className="data-[state=active]:bg-neon-cyan/20" data-testid="tab-queues">
                <MessageSquare className="w-4 h-4 mr-2" />
                Queues
              </TabsTrigger>
              <TabsTrigger value="api" className="data-[state=active]:bg-neon-cyan/20" data-testid="tab-api">
                <Code className="w-4 h-4 mr-2" />
                API Docs
              </TabsTrigger>
              <TabsTrigger value="database" className="data-[state=active]:bg-neon-cyan/20" data-testid="tab-database">
                <Database className="w-4 h-4 mr-2" />
                Database
              </TabsTrigger>
              <TabsTrigger value="docs" className="data-[state=active]:bg-neon-cyan/20" data-testid="tab-docs">
                <FileText className="w-4 h-4 mr-2" />
                Documentation
              </TabsTrigger>
              <TabsTrigger value="monitoring" className="data-[state=active]:bg-neon-cyan/20" data-testid="tab-monitoring">
                <BarChart3 className="w-4 h-4 mr-2" />
                Monitoring
              </TabsTrigger>
              <TabsTrigger value="incidents" className="data-[state=active]:bg-neon-cyan/20" data-testid="tab-incidents">
                <Inbox className="w-4 h-4 mr-2" />
                Incidents
                {incidents.filter(i => i.status === 'open').length > 0 && (
                  <Badge className="ml-2 bg-red-500 text-white text-xs px-1.5 py-0.5">
                    {incidents.filter(i => i.status === 'open').length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="domains" className="data-[state=active]:bg-neon-cyan/20" data-testid="tab-domains">
                <Globe className="w-4 h-4 mr-2" />
                Domains
              </TabsTrigger>
              <TabsTrigger value="credits" className="data-[state=active]:bg-neon-cyan/20" data-testid="tab-credits">
                <Coins className="w-4 h-4 mr-2" />
                Credits
              </TabsTrigger>
              <TabsTrigger value="promotions" className="data-[state=active]:bg-neon-cyan/20" data-testid="tab-promotions">
                <Tag className="w-4 h-4 mr-2" />
                Promotions
              </TabsTrigger>
              <TabsTrigger value="features" className="data-[state=active]:bg-neon-cyan/20" data-testid="tab-features">
                <Zap className="w-4 h-4 mr-2" />
                Features
              </TabsTrigger>
            </TabsList>

            {/* Users Tab */}
            <TabsContent value="users">
              <Card className="bg-dark-card border-gray-800">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white">All Platform Users</CardTitle>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        placeholder="Search users..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 bg-dark-bg border-gray-700 text-white w-64"
                        data-testid="input-search-users"
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[500px]">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-gray-800">
                          <TableHead className="text-gray-400">ID</TableHead>
                          <TableHead className="text-gray-400">Username</TableHead>
                          <TableHead className="text-gray-400">Email</TableHead>
                          <TableHead className="text-gray-400">Provider</TableHead>
                          <TableHead className="text-gray-400">Credits</TableHead>
                          <TableHead className="text-gray-400">Status</TableHead>
                          <TableHead className="text-gray-400">Joined</TableHead>
                          <TableHead className="text-gray-400">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.map((u) => (
                          <TableRow key={u.id} className="border-gray-800">
                            <TableCell className="text-gray-300">{u.id}</TableCell>
                            <TableCell className="text-white font-medium">{u.username}</TableCell>
                            <TableCell className="text-gray-300">{u.email}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="border-gray-600 text-gray-400">
                                {u.provider}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-gray-300">{u.credits}</TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                {u.isPremium && (
                                  <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50">
                                    <Crown className="w-3 h-3 mr-1" />
                                    Premium
                                  </Badge>
                                )}
                                {u.isAdmin && (
                                  <Badge className="bg-red-500/20 text-red-400 border-red-500/50">
                                    <Shield className="w-3 h-3 mr-1" />
                                    Admin
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-gray-400">
                              {format(new Date(u.createdAt), "MMM d, yyyy")}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                {(u as any).isBanned ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-green-500/50 text-green-400 hover:bg-green-500/20"
                                    onClick={() => unbanUserMutation.mutate(u.id)}
                                    disabled={unbanUserMutation.isPending}
                                    data-testid={`button-unban-${u.id}`}
                                  >
                                    Unban
                                  </Button>
                                ) : (
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="border-red-500/50 text-red-400 hover:bg-red-500/20"
                                        data-testid={`button-ban-${u.id}`}
                                      >
                                        <Ban className="w-3 h-3 mr-1" />
                                        Ban
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent className="bg-dark-card border-gray-800">
                                      <DialogHeader>
                                        <DialogTitle className="text-white">Ban User</DialogTitle>
                                        <DialogDescription className="text-gray-400">
                                          Are you sure you want to ban {u.username}?
                                        </DialogDescription>
                                      </DialogHeader>
                                      <div className="space-y-4">
                                        <Textarea
                                          placeholder="Reason for ban..."
                                          value={banReason}
                                          onChange={(e) => setBanReason(e.target.value)}
                                          className="bg-dark-bg border-gray-700 text-white"
                                          data-testid="input-ban-reason"
                                        />
                                        <Button
                                          variant="destructive"
                                          onClick={() => {
                                            banUserMutation.mutate({ userId: u.id, reason: banReason });
                                            setBanReason("");
                                          }}
                                          disabled={banUserMutation.isPending}
                                          data-testid="button-confirm-ban"
                                        >
                                          Confirm Ban
                                        </Button>
                                      </div>
                                    </DialogContent>
                                  </Dialog>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Admin Management Tab */}
            <TabsContent value="admins">
              <div className="grid gap-6">
                <Card className="bg-dark-card border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-white">Add New Admin</CardTitle>
                    <CardDescription className="text-gray-400">
                      Grant admin access to a team member by their email address
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-4">
                      <Input
                        placeholder="Enter email address..."
                        value={newAdminEmail}
                        onChange={(e) => setNewAdminEmail(e.target.value)}
                        className="bg-dark-bg border-gray-700 text-white"
                        data-testid="input-admin-email"
                      />
                      <Button
                        onClick={() => grantAdminMutation.mutate(newAdminEmail)}
                        disabled={!newAdminEmail || grantAdminMutation.isPending}
                        className="bg-neon-cyan text-dark-bg hover:bg-neon-cyan/80"
                        data-testid="button-grant-admin"
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Grant Admin Access
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-dark-card border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-white">Current Admins</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow className="border-gray-800">
                          <TableHead className="text-gray-400">Username</TableHead>
                          <TableHead className="text-gray-400">Email</TableHead>
                          <TableHead className="text-gray-400">Granted By</TableHead>
                          <TableHead className="text-gray-400">Granted At</TableHead>
                          <TableHead className="text-gray-400">Switch User</TableHead>
                          <TableHead className="text-gray-400">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {admins.map((admin) => (
                          <TableRow key={admin.id} className="border-gray-800">
                            <TableCell className="text-white font-medium">{admin.username}</TableCell>
                            <TableCell className="text-gray-300">{admin.email}</TableCell>
                            <TableCell className="text-gray-400">
                              {admin.adminGrantedBy || "System"}
                            </TableCell>
                            <TableCell className="text-gray-400">
                              {admin.adminGrantedAt
                                ? format(new Date(admin.adminGrantedAt), "MMM d, yyyy")
                                : "N/A"
                              }
                            </TableCell>
                            <TableCell>
                              {admin.email === PRIMARY_ADMIN_EMAIL ? (
                                <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
                                  Always
                                </Badge>
                              ) : isPrimaryAdmin ? (
                                <div className="flex items-center gap-2">
                                  <Switch
                                    checked={(admin as any).canImpersonate || false}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        grantImpersonateMutation.mutate(admin.id);
                                      } else {
                                        revokeImpersonateMutation.mutate(admin.id);
                                      }
                                    }}
                                    disabled={grantImpersonateMutation.isPending || revokeImpersonateMutation.isPending}
                                    data-testid={`switch-impersonate-${admin.id}`}
                                  />
                                  <span className="text-xs text-gray-500">
                                    {(admin as any).canImpersonate ? "Enabled" : "Disabled"}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-xs text-gray-500">
                                  {(admin as any).canImpersonate ? "Enabled" : "Disabled"}
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              {admin.email !== PRIMARY_ADMIN_EMAIL && (
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => revokeAdminMutation.mutate(admin.id)}
                                  disabled={revokeAdminMutation.isPending}
                                  data-testid={`button-revoke-admin-${admin.id}`}
                                >
                                  <UserMinus className="w-4 h-4 mr-1" />
                                  Revoke
                                </Button>
                              )}
                              {admin.email === PRIMARY_ADMIN_EMAIL && (
                                <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
                                  Primary Admin
                                </Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notifications">
              <div className="grid gap-6 md:grid-cols-2">
                <Card className="bg-dark-card border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Bell className="w-5 h-5 text-neon-cyan" />
                      Send Push Notification
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                      Send notifications to platform users
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm text-gray-400 mb-1 block">Target Audience</label>
                      <Select value={notificationTarget} onValueChange={setNotificationTarget}>
                        <SelectTrigger className="bg-dark-bg border-gray-700 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-dark-card border-gray-700">
                          <SelectItem value="all">All Users</SelectItem>
                          <SelectItem value="premium">Premium Users Only</SelectItem>
                          <SelectItem value="free">Free Users Only</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400 mb-1 block">Title</label>
                      <Input
                        placeholder="Notification title..."
                        value={notificationTitle}
                        onChange={(e) => setNotificationTitle(e.target.value)}
                        className="bg-dark-bg border-gray-700 text-white"
                        data-testid="input-notification-title"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-400 mb-1 block">Message Body</label>
                      <Textarea
                        placeholder="Notification message..."
                        value={notificationBody}
                        onChange={(e) => setNotificationBody(e.target.value)}
                        className="bg-dark-bg border-gray-700 text-white min-h-[100px]"
                        data-testid="input-notification-body"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-400 mb-1 block">Click URL (optional)</label>
                      <Input
                        placeholder="/dashboard"
                        value={notificationUrl}
                        onChange={(e) => setNotificationUrl(e.target.value)}
                        className="bg-dark-bg border-gray-700 text-white"
                        data-testid="input-notification-url"
                      />
                    </div>
                    <Button
                      onClick={() => sendNotificationMutation.mutate({
                        title: notificationTitle,
                        body: notificationBody,
                        url: notificationUrl,
                        targetType: notificationTarget,
                      })}
                      disabled={!notificationTitle || !notificationBody || sendNotificationMutation.isPending}
                      className="w-full bg-neon-cyan text-dark-bg hover:bg-neon-cyan/80"
                      data-testid="button-send-notification"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      {sendNotificationMutation.isPending ? "Sending..." : "Send Notification"}
                    </Button>
                  </CardContent>
                </Card>

                <Card className="bg-dark-card border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-white">Quick Templates</CardTitle>
                    <CardDescription className="text-gray-400">
                      Use pre-built notification templates
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-3">
                        {notificationTemplates.map((template) => (
                          <div
                            key={template.id}
                            className="bg-dark-bg border border-gray-700 rounded-lg p-4 hover:border-neon-cyan/50 transition-colors"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-white font-medium">{template.name}</h4>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleApplyTemplate(template)}
                                className="border-gray-600 text-gray-300 hover:text-white"
                              >
                                Apply
                              </Button>
                            </div>
                            <p className="text-sm text-neon-cyan font-medium">{template.title}</p>
                            <p className="text-sm text-gray-400 mt-1">{template.body}</p>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Security Logs Tab */}
            <TabsContent value="security">
              <Card className="bg-dark-card border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">Security Logs</CardTitle>
                  <CardDescription className="text-gray-400">
                    Recent security events and authentication logs
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[500px]">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-gray-800">
                          <TableHead className="text-gray-400">Time</TableHead>
                          <TableHead className="text-gray-400">Action</TableHead>
                          <TableHead className="text-gray-400">User ID</TableHead>
                          <TableHead className="text-gray-400">Severity</TableHead>
                          <TableHead className="text-gray-400">IP Address</TableHead>
                          <TableHead className="text-gray-400">Details</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {securityLogs.map((log) => (
                          <TableRow key={log.id} className="border-gray-800">
                            <TableCell className="text-gray-400">
                              {format(new Date(log.createdAt), "MMM d, HH:mm:ss")}
                            </TableCell>
                            <TableCell className="text-white font-medium">{log.action}</TableCell>
                            <TableCell className="text-gray-300">{log.userId || "N/A"}</TableCell>
                            <TableCell>
                              <Badge className={getSeverityColor(log.severity)}>
                                {log.severity}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-gray-400">{log.ipAddress || "N/A"}</TableCell>
                            <TableCell className="text-gray-400 max-w-xs truncate">
                              {JSON.stringify(log.details)}
                            </TableCell>
                          </TableRow>
                        ))}
                        {securityLogs.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center text-gray-400 py-8">
                              No security logs found
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Queue Metrics Tab */}
            <TabsContent value="queues">
              <div className="grid gap-6">
                <div className="grid gap-6 md:grid-cols-3">
                  {/* Kafka Card */}
                  <Card className="bg-dark-card border-gray-800">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-white flex items-center gap-2">
                          <Zap className="w-5 h-5 text-orange-500" />
                          Apache Kafka
                        </CardTitle>
                        <Badge className={`${getStatusColor(queueMetrics?.kafka?.status || 'disconnected')} bg-transparent border`}>
                          {queueMetrics?.kafka?.status || "N/A"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-dark-bg rounded-lg p-3">
                          <p className="text-xs text-gray-400">Messages Produced</p>
                          <p className="text-lg font-bold text-white">{queueMetrics?.kafka?.messagesProduced?.toLocaleString() || 0}</p>
                        </div>
                        <div className="bg-dark-bg rounded-lg p-3">
                          <p className="text-xs text-gray-400">Messages Consumed</p>
                          <p className="text-lg font-bold text-white">{queueMetrics?.kafka?.messagesConsumed?.toLocaleString() || 0}</p>
                        </div>
                        <div className="bg-dark-bg rounded-lg p-3">
                          <p className="text-xs text-gray-400">Queue Depth</p>
                          <p className="text-lg font-bold text-yellow-400">{queueMetrics?.kafka?.queueDepth || 0}</p>
                        </div>
                        <div className="bg-dark-bg rounded-lg p-3">
                          <p className="text-xs text-gray-400">Latency</p>
                          <p className="text-lg font-bold text-green-400">{queueMetrics?.kafka?.latencyMs || 0}ms</p>
                        </div>
                      </div>
                      <div className="text-xs text-gray-400">
                        <p>Partitions: {queueMetrics?.kafka?.partitions || 0} | Consumers: {queueMetrics?.kafka?.consumers || 0}</p>
                        <p className="mt-1">Topics: {queueMetrics?.kafka?.topics?.join(", ") || "N/A"}</p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* RabbitMQ Card */}
                  <Card className="bg-dark-card border-gray-800">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-white flex items-center gap-2">
                          <Rabbit className="w-5 h-5 text-orange-400" />
                          RabbitMQ
                        </CardTitle>
                        <Badge className={`${getStatusColor(queueMetrics?.rabbitmq?.status || 'disconnected')} bg-transparent border`}>
                          {queueMetrics?.rabbitmq?.status || "N/A"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-dark-bg rounded-lg p-3">
                          <p className="text-xs text-gray-400">Messages Published</p>
                          <p className="text-lg font-bold text-white">{queueMetrics?.rabbitmq?.messagesProduced?.toLocaleString() || 0}</p>
                        </div>
                        <div className="bg-dark-bg rounded-lg p-3">
                          <p className="text-xs text-gray-400">Messages Consumed</p>
                          <p className="text-lg font-bold text-white">{queueMetrics?.rabbitmq?.messagesConsumed?.toLocaleString() || 0}</p>
                        </div>
                        <div className="bg-dark-bg rounded-lg p-3">
                          <p className="text-xs text-gray-400">Queue Depth</p>
                          <p className="text-lg font-bold text-yellow-400">{queueMetrics?.rabbitmq?.queueDepth || 0}</p>
                        </div>
                        <div className="bg-dark-bg rounded-lg p-3">
                          <p className="text-xs text-gray-400">Latency</p>
                          <p className="text-lg font-bold text-green-400">{queueMetrics?.rabbitmq?.latencyMs || 0}ms</p>
                        </div>
                      </div>
                      <div className="text-xs text-gray-400">
                        <p>Consumers: {queueMetrics?.rabbitmq?.consumers || 0}</p>
                        <p className="mt-1">Queues: {queueMetrics?.rabbitmq?.topics?.join(", ") || "N/A"}</p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Redis Card */}
                  <Card className="bg-dark-card border-gray-800">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-white flex items-center gap-2">
                          <HardDrive className="w-5 h-5 text-red-500" />
                          Redis
                        </CardTitle>
                        <Badge className={`${getStatusColor(queueMetrics?.redis?.status || 'disconnected')} bg-transparent border`}>
                          {queueMetrics?.redis?.status || "N/A"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-dark-bg rounded-lg p-3">
                          <p className="text-xs text-gray-400">Connected Clients</p>
                          <p className="text-lg font-bold text-white">{queueMetrics?.redis?.connectedClients || 0}</p>
                        </div>
                        <div className="bg-dark-bg rounded-lg p-3">
                          <p className="text-xs text-gray-400">Memory Used</p>
                          <p className="text-lg font-bold text-white">{queueMetrics?.redis?.usedMemoryMB || 0} MB</p>
                        </div>
                        <div className="bg-dark-bg rounded-lg p-3">
                          <p className="text-xs text-gray-400">Commands/sec</p>
                          <p className="text-lg font-bold text-green-400">{queueMetrics?.redis?.commandsPerSec || 0}</p>
                        </div>
                        <div className="bg-dark-bg rounded-lg p-3">
                          <p className="text-xs text-gray-400">Hit Rate</p>
                          <p className="text-lg font-bold text-neon-cyan">{queueMetrics?.redis?.hitRate || 0}%</p>
                        </div>
                      </div>
                      <div className="text-xs text-gray-400">
                        <p>Keys: {queueMetrics?.redis?.keyCount || 0} | Total Commands: {queueMetrics?.redis?.totalCommands?.toLocaleString() || 0}</p>
                        <p className="mt-1">Uptime: {Math.floor((queueMetrics?.redis?.uptimeSeconds || 0) / 60)} min</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* API Documentation Tab */}
            <TabsContent value="api">
              <Card className="bg-dark-card border-gray-800">
                <CardHeader>
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                      <CardTitle className="text-white">API Documentation</CardTitle>
                      <CardDescription className="text-gray-400">
                        Complete endpoint reference for Postman testing
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <a href="/api/admin/postman-collection" download>
                        <Button className="bg-orange-500 hover:bg-orange-600 text-white" data-testid="button-download-postman">
                          <Download className="w-4 h-4 mr-2" />
                          Export Postman Collection
                        </Button>
                      </a>
                    </div>
                  </div>
                  <div className="flex gap-4 mt-4 flex-wrap">
                    <div className="relative flex-1 min-w-[200px]">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        placeholder="Search endpoints..."
                        value={apiSearchQuery}
                        onChange={(e) => setApiSearchQuery(e.target.value)}
                        className="pl-9 bg-dark-bg border-gray-700 text-white"
                        data-testid="input-search-api"
                      />
                    </div>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger className="bg-dark-bg border-gray-700 text-white w-[200px]">
                        <SelectValue placeholder="Filter by category" />
                      </SelectTrigger>
                      <SelectContent className="bg-dark-card border-gray-700">
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-3">
                      {filteredApiDocs.map((endpoint, index) => (
                        <div
                          key={index}
                          className="bg-dark-bg border border-gray-700 rounded-lg p-4 hover:border-neon-cyan/50 transition-colors cursor-pointer"
                          onClick={() => setSelectedEndpoint(endpoint)}
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <Badge className={getMethodColor(endpoint.method)}>
                              {endpoint.method}
                            </Badge>
                            <code className="text-white font-mono text-sm">{endpoint.path}</code>
                            <Badge variant="outline" className="border-gray-600 text-gray-400 ml-auto">
                              {endpoint.category}
                            </Badge>
                          </div>
                          <p className="text-white font-medium">{endpoint.name}</p>
                          <p className="text-sm text-gray-400 mt-1">{endpoint.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className={
                              endpoint.auth === "admin" ? "border-red-500/50 text-red-400" :
                                endpoint.auth === "required" ? "border-yellow-500/50 text-yellow-400" :
                                  "border-green-500/50 text-green-400"
                            }>
                              {endpoint.auth === "admin" ? "Admin Only" :
                                endpoint.auth === "required" ? "Auth Required" : "Public"}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              <Dialog open={!!selectedEndpoint} onOpenChange={() => setSelectedEndpoint(null)}>
                <DialogContent className="bg-dark-card border-gray-800 max-w-2xl max-h-[80vh] overflow-y-auto">
                  {selectedEndpoint && (
                    <>
                      <DialogHeader>
                        <DialogTitle className="text-white flex items-center gap-2">
                          <Badge className={getMethodColor(selectedEndpoint.method)}>
                            {selectedEndpoint.method}
                          </Badge>
                          {selectedEndpoint.name}
                        </DialogTitle>
                        <DialogDescription className="text-gray-400">
                          {selectedEndpoint.description}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div>
                          <label className="text-sm text-gray-400">Endpoint URL</label>
                          <div className="flex items-center gap-2 mt-1">
                            <code className="flex-1 bg-dark-bg border border-gray-700 rounded px-3 py-2 text-white font-mono text-sm">
                              {selectedEndpoint.path}
                            </code>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCopy(selectedEndpoint.path, "Path")}
                              className="border-gray-600"
                            >
                              {copiedText === "Path" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            </Button>
                          </div>
                        </div>

                        {selectedEndpoint.requestBody && (
                          <div>
                            <label className="text-sm text-gray-400">Request Body</label>
                            <div className="relative mt-1">
                              <pre className="bg-dark-bg border border-gray-700 rounded p-3 text-sm text-gray-300 overflow-x-auto">
                                {JSON.stringify(selectedEndpoint.requestBody.example || selectedEndpoint.requestBody.schema, null, 2)}
                              </pre>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCopy(JSON.stringify(selectedEndpoint.requestBody?.example || selectedEndpoint.requestBody?.schema, null, 2), "Body")}
                                className="absolute top-2 right-2 border-gray-600"
                              >
                                {copiedText === "Body" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                              </Button>
                            </div>
                          </div>
                        )}

                        {selectedEndpoint.queryParams && selectedEndpoint.queryParams.length > 0 && (
                          <div>
                            <label className="text-sm text-gray-400">Query Parameters</label>
                            <div className="mt-1 space-y-2">
                              {selectedEndpoint.queryParams.map((param, i) => (
                                <div key={i} className="bg-dark-bg border border-gray-700 rounded p-2">
                                  <code className="text-neon-cyan">{param.name}</code>
                                  <span className="text-gray-400 text-sm ml-2">({param.type})</span>
                                  {param.required && <Badge className="ml-2 bg-red-500/20 text-red-400">Required</Badge>}
                                  <p className="text-sm text-gray-400 mt-1">{param.description}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div>
                          <label className="text-sm text-gray-400">Responses</label>
                          <div className="mt-1 space-y-2">
                            {selectedEndpoint.responses.map((response, i) => (
                              <div key={i} className="bg-dark-bg border border-gray-700 rounded p-2">
                                <Badge className={
                                  response.status < 300 ? "bg-green-500/20 text-green-400" :
                                    response.status < 400 ? "bg-yellow-500/20 text-yellow-400" :
                                      "bg-red-500/20 text-red-400"
                                }>
                                  {response.status}
                                </Badge>
                                <span className="text-gray-300 ml-2">{response.description}</span>
                                {response.example && (
                                  <pre className="mt-2 text-xs text-gray-400 overflow-x-auto">
                                    {JSON.stringify(response.example, null, 2)}
                                  </pre>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </DialogContent>
              </Dialog>
            </TabsContent>

            {/* Database Tab */}
            <TabsContent value="database">
              <div className="grid gap-6 md:grid-cols-2">
                <Card className="bg-dark-card border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-white">Database Tables</CardTitle>
                    <CardDescription className="text-gray-400">
                      All tables in the platform database
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-2">
                        {dbTables.map((table) => (
                          <Button
                            key={table.name}
                            variant={selectedTable === table.name ? "secondary" : "ghost"}
                            className="w-full justify-between text-left"
                            onClick={() => setSelectedTable(table.name)}
                            data-testid={`button-table-${table.name}`}
                          >
                            <div className="flex items-center gap-2">
                              <Database className="w-4 h-4 text-neon-cyan" />
                              <span className="text-white">{table.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-gray-400 border-gray-600">
                                {table.columnCount} columns
                              </Badge>
                              <ChevronRight className="w-4 h-4 text-gray-400" />
                            </div>
                          </Button>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>

                <Card className="bg-dark-card border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-white">
                      {selectedTable ? `Table: ${selectedTable}` : "Select a Table"}
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                      Column details and schema information
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {selectedTable ? (
                      <ScrollArea className="h-[400px]">
                        <Table>
                          <TableHeader>
                            <TableRow className="border-gray-800">
                              <TableHead className="text-gray-400">Column</TableHead>
                              <TableHead className="text-gray-400">Type</TableHead>
                              <TableHead className="text-gray-400">Nullable</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {(tableSchema as any[]).map((col: any, index: number) => (
                              <TableRow key={index} className="border-gray-800">
                                <TableCell className="text-white font-mono text-sm">
                                  {col.column_name}
                                </TableCell>
                                <TableCell className="text-gray-300 font-mono text-sm">
                                  {col.data_type}
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant="outline"
                                    className={col.is_nullable === "YES"
                                      ? "text-yellow-400 border-yellow-500/50"
                                      : "text-green-400 border-green-500/50"
                                    }
                                  >
                                    {col.is_nullable}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    ) : (
                      <div className="h-[400px] flex items-center justify-center text-gray-400">
                        Select a table to view its schema
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Documentation Tab */}
            <TabsContent value="docs">
              <Card className="bg-dark-card border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-neon-cyan" />
                    Technical Documentation
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Download comprehensive platform documentation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="bg-dark-bg border border-gray-700 rounded-lg p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                          <FileCode className="w-6 h-6 text-blue-400" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white">Technical Documentation</h3>
                          <p className="text-sm text-gray-400">Complete platform documentation</p>
                        </div>
                      </div>
                      <p className="text-gray-400 text-sm mb-4">
                        Includes application workflow, tech stack, database diagrams, UML diagrams,
                        system design diagrams, entity relationship diagrams, and Windows setup instructions.
                      </p>
                      <a href="/api/admin/download-docs" download>
                        <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white" data-testid="button-download-docs">
                          <Download className="w-4 h-4 mr-2" />
                          Download Documentation (MD)
                        </Button>
                      </a>
                    </div>

                    <div className="bg-dark-bg border border-gray-700 rounded-lg p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
                          <FileText className="w-6 h-6 text-orange-400" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white">Postman Collection</h3>
                          <p className="text-sm text-gray-400">API testing collection</p>
                        </div>
                      </div>
                      <p className="text-gray-400 text-sm mb-4">
                        Complete Postman collection with all API endpoints, request examples,
                        authentication setup, and environment variables ready for testing.
                      </p>
                      <a href="/api/admin/postman-collection" download>
                        <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white" data-testid="button-download-postman-2">
                          <Download className="w-4 h-4 mr-2" />
                          Download Postman Collection (JSON)
                        </Button>
                      </a>
                    </div>
                  </div>

                  <div className="mt-6 bg-dark-bg border border-gray-700 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Documentation Contents</h3>
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-green-400 mt-1" />
                        <div>
                          <p className="text-white text-sm font-medium">System Architecture</p>
                          <p className="text-gray-400 text-xs">High-level system design</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-green-400 mt-1" />
                        <div>
                          <p className="text-white text-sm font-medium">Technology Stack</p>
                          <p className="text-gray-400 text-xs">All frameworks and tools</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-green-400 mt-1" />
                        <div>
                          <p className="text-white text-sm font-medium">Database Diagrams</p>
                          <p className="text-gray-400 text-xs">ER diagrams and schemas</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-green-400 mt-1" />
                        <div>
                          <p className="text-white text-sm font-medium">API Reference</p>
                          <p className="text-gray-400 text-xs">All endpoints documented</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-green-400 mt-1" />
                        <div>
                          <p className="text-white text-sm font-medium">Security Guide</p>
                          <p className="text-gray-400 text-xs">Auth flow and security</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-green-400 mt-1" />
                        <div>
                          <p className="text-white text-sm font-medium">Setup Instructions</p>
                          <p className="text-gray-400 text-xs">Windows local setup</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Monitoring Tab */}
            <TabsContent value="monitoring">
              <div className="grid gap-6">
                <Card className="bg-dark-card border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-neon-cyan" />
                      Prometheus & Grafana
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                      Access metrics and monitoring dashboards
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                      <Card className="bg-dark-bg border-gray-700">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                                <Activity className="w-5 h-5 text-orange-500" />
                              </div>
                              <div>
                                <h3 className="text-lg font-semibold text-white">Prometheus</h3>
                                <p className="text-sm text-gray-400">Metrics collection</p>
                              </div>
                            </div>
                            <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
                              Active
                            </Badge>
                          </div>
                          <p className="text-gray-400 text-sm mb-4">
                            View raw Prometheus metrics for system monitoring and alerting.
                          </p>
                          <a
                            href="/api/admin/metrics"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white" data-testid="button-prometheus">
                              <ExternalLink className="w-4 h-4 mr-2" />
                              View Metrics
                            </Button>
                          </a>
                        </CardContent>
                      </Card>

                      <Card className="bg-dark-bg border-gray-700">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                                <BarChart3 className="w-5 h-5 text-yellow-500" />
                              </div>
                              <div>
                                <h3 className="text-lg font-semibold text-white">Grafana</h3>
                                <p className="text-sm text-gray-400">Visualization dashboards</p>
                              </div>
                            </div>
                            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50">
                              External
                            </Badge>
                          </div>
                          <p className="text-gray-400 text-sm mb-4">
                            Connect Grafana to visualize metrics with custom dashboards.
                          </p>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button className="w-full bg-yellow-500 hover:bg-yellow-600 text-dark-bg" data-testid="button-grafana-config">
                                <Server className="w-4 h-4 mr-2" />
                                Configuration
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-dark-card border-gray-800">
                              <DialogHeader>
                                <DialogTitle className="text-white">Grafana Configuration</DialogTitle>
                                <DialogDescription className="text-gray-400">
                                  Use these settings to connect Grafana to your Prometheus endpoint
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <div>
                                  <label className="text-sm text-gray-400">Prometheus Data Source URL</label>
                                  <Input
                                    readOnly
                                    value={`${window.location.origin}/api/admin/metrics`}
                                    className="bg-dark-bg border-gray-700 text-white font-mono text-sm mt-1"
                                  />
                                </div>
                                <div>
                                  <label className="text-sm text-gray-400">Recommended Dashboards</label>
                                  <ul className="mt-2 space-y-2">
                                    <li className="text-gray-300 flex items-center gap-2">
                                      <ChevronRight className="w-4 h-4 text-neon-cyan" />
                                      System Overview
                                    </li>
                                    <li className="text-gray-300 flex items-center gap-2">
                                      <ChevronRight className="w-4 h-4 text-neon-cyan" />
                                      API Performance
                                    </li>
                                    <li className="text-gray-300 flex items-center gap-2">
                                      <ChevronRight className="w-4 h-4 text-neon-cyan" />
                                      User Analytics
                                    </li>
                                    <li className="text-gray-300 flex items-center gap-2">
                                      <ChevronRight className="w-4 h-4 text-neon-cyan" />
                                      Security Events
                                    </li>
                                  </ul>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </CardContent>
                      </Card>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-dark-card border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-white">System Health</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-4">
                      <div className="bg-dark-bg border border-gray-700 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Server className="w-4 h-4 text-green-500" />
                          <span className="text-gray-400 text-sm">Database</span>
                        </div>
                        <p className="text-white font-semibold">Connected</p>
                      </div>
                      <div className="bg-dark-bg border border-gray-700 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Activity className="w-4 h-4 text-green-500" />
                          <span className="text-gray-400 text-sm">Redis</span>
                        </div>
                        <p className="text-white font-semibold">Active</p>
                      </div>
                      <div className="bg-dark-bg border border-gray-700 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Shield className="w-4 h-4 text-green-500" />
                          <span className="text-gray-400 text-sm">Auth</span>
                        </div>
                        <p className="text-white font-semibold">Secure</p>
                      </div>
                      <div className="bg-dark-bg border border-gray-700 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <BarChart3 className="w-4 h-4 text-green-500" />
                          <span className="text-gray-400 text-sm">Metrics</span>
                        </div>
                        <p className="text-white font-semibold">Collecting</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Incidents Tab */}
            <TabsContent value="incidents">
              <div className="grid gap-6 lg:grid-cols-3">
                <Card className="bg-dark-card border-gray-800 lg:col-span-1">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Inbox className="w-5 h-5 text-neon-cyan" />
                      Support Tickets
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                      User-submitted incidents and support requests
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[500px]">
                      <div className="space-y-2">
                        {incidents.length === 0 ? (
                          <p className="text-gray-400 text-center py-8">No incidents yet</p>
                        ) : (
                          incidents.map((incident) => (
                            <div
                              key={incident.id}
                              onClick={() => setSelectedIncident(incident)}
                              className={`p-3 rounded-lg border cursor-pointer transition-colors ${selectedIncident?.id === incident.id
                                ? 'bg-neon-cyan/10 border-neon-cyan/50'
                                : 'bg-dark-bg border-gray-700 hover:border-gray-600'
                                }`}
                              data-testid={`incident-${incident.id}`}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <Badge className={
                                  incident.status === 'open' ? 'bg-red-500/20 text-red-400' :
                                    incident.status === 'in_progress' ? 'bg-yellow-500/20 text-yellow-400' :
                                      'bg-green-500/20 text-green-400'
                                }>
                                  {incident.status}
                                </Badge>
                                <Badge variant="outline" className={
                                  incident.priority === 'high' ? 'border-red-500 text-red-400' :
                                    incident.priority === 'medium' ? 'border-yellow-500 text-yellow-400' :
                                      'border-gray-600 text-gray-400'
                                }>
                                  {incident.priority}
                                </Badge>
                              </div>
                              <h4 className="text-white font-medium text-sm truncate">{incident.subject}</h4>
                              <p className="text-gray-400 text-xs mt-1">{incident.userEmail}</p>
                              <p className="text-gray-500 text-xs mt-1">
                                {format(new Date(incident.createdAt), "MMM d, yyyy HH:mm")}
                              </p>
                            </div>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>

                <Card className="bg-dark-card border-gray-800 lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-white">
                      {selectedIncident ? `Ticket #${selectedIncident.id}` : 'Select a Ticket'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedIncident ? (
                      <div className="space-y-4">
                        <div className="bg-dark-bg rounded-lg p-4 border border-gray-700">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="text-white font-semibold">{selectedIncident.subject}</h3>
                            <Select
                              value={selectedIncident.status}
                              onValueChange={(value) => updateIncidentStatusMutation.mutate({
                                incidentId: selectedIncident.id,
                                status: value
                              })}
                            >
                              <SelectTrigger className="w-32 bg-dark-bg border-gray-700 text-white" data-testid="select-status">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-dark-card border-gray-700">
                                <SelectItem value="open">Open</SelectItem>
                                <SelectItem value="in_progress">In Progress</SelectItem>
                                <SelectItem value="resolved">Resolved</SelectItem>
                                <SelectItem value="closed">Closed</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <p className="text-gray-300 text-sm">{selectedIncident.description}</p>
                          <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                            <span>From: {selectedIncident.userEmail}</span>
                            <span>Created: {format(new Date(selectedIncident.createdAt), "MMM d, yyyy HH:mm")}</span>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <h4 className="text-white font-medium flex items-center gap-2">
                            <MessageCircle className="w-4 h-4" />
                            Messages
                          </h4>
                          <ScrollArea className="h-[200px] bg-dark-bg rounded-lg p-3 border border-gray-700">
                            {selectedIncident.messages && selectedIncident.messages.length > 0 ? (
                              selectedIncident.messages.map((msg) => (
                                <div
                                  key={msg.id}
                                  className={`mb-3 p-3 rounded-lg ${msg.senderRole === 'admin'
                                    ? 'bg-neon-cyan/10 border border-neon-cyan/30 ml-8'
                                    : 'bg-gray-800 border border-gray-700 mr-8'
                                    }`}
                                >
                                  <p className="text-gray-300 text-sm">{msg.message}</p>
                                  <p className="text-gray-500 text-xs mt-1">
                                    {msg.senderRole === 'admin' ? 'Admin' : 'User'} • {format(new Date(msg.createdAt), "MMM d HH:mm")}
                                  </p>
                                </div>
                              ))
                            ) : (
                              <p className="text-gray-500 text-center py-4">No messages yet</p>
                            )}
                          </ScrollArea>
                        </div>

                        <div className="flex gap-2">
                          <Textarea
                            value={incidentMessage}
                            onChange={(e) => setIncidentMessage(e.target.value)}
                            placeholder="Type your reply..."
                            className="bg-dark-bg border-gray-700 text-white flex-1"
                            data-testid="input-incident-message"
                          />
                          <Button
                            onClick={() => sendIncidentMessageMutation.mutate({
                              incidentId: selectedIncident.id,
                              message: incidentMessage
                            })}
                            disabled={!incidentMessage.trim() || sendIncidentMessageMutation.isPending}
                            className="bg-neon-cyan text-dark-bg"
                            data-testid="button-send-message"
                          >
                            <Send className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Inbox className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-400">Select a ticket from the list to view details</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Domains Tab */}
            <TabsContent value="domains">
              <Card className="bg-dark-card border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Globe className="w-5 h-5 text-neon-cyan" />
                    Domain Configuration
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Enable or disable feature domains. Disabled domains will show a "Coming Soon" overlay to users.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {['devops', 'data-engineering', 'cybersecurity'].map((domain) => {
                      const config = domainConfigs.find(d => d.domain === domain);
                      const isEnabled = config?.isEnabled ?? true;
                      const domainName = domain === 'data-engineering' ? 'Data Engineering' :
                        domain === 'cybersecurity' ? 'Cybersecurity' : 'DevOps';
                      return (
                        <div key={domain} className="flex items-center justify-between p-4 bg-dark-bg rounded-lg border border-gray-700">
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${isEnabled ? 'bg-neon-cyan/20' : 'bg-gray-700'
                              }`}>
                              <Globe className={`w-6 h-6 ${isEnabled ? 'text-neon-cyan' : 'text-gray-500'}`} />
                            </div>
                            <div>
                              <h3 className="text-white font-medium">{domainName}</h3>
                              <p className="text-sm text-gray-400">
                                {isEnabled ? 'Active - Users can access this domain' : 'Disabled - Shows Coming Soon overlay'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <Badge className={isEnabled ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
                              {isEnabled ? 'Enabled' : 'Disabled'}
                            </Badge>
                            <Switch
                              checked={isEnabled}
                              onCheckedChange={(checked) => {
                                updateDomainConfigMutation.mutate({
                                  domain,
                                  isEnabled: checked,
                                  comingSoonMessage: checked ? undefined : `${domainName} tools are coming soon!`
                                });
                              }}
                              disabled={updateDomainConfigMutation.isPending}
                              data-testid={`switch-domain-${domain}`}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Credits Tab */}
            <TabsContent value="credits">
              <Card className="bg-dark-card border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Coins className="w-5 h-5 text-yellow-500" />
                    Update User Credits
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Add credits to a user's account by entering their email address and the amount to add.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6 max-w-md">
                    <div className="space-y-2">
                      <Label htmlFor="credit-email" className="text-gray-300">User Email</Label>
                      <Input
                        id="credit-email"
                        type="email"
                        placeholder="user@example.com"
                        value={creditEmail}
                        onChange={(e) => setCreditEmail(e.target.value)}
                        className="bg-dark-bg border-gray-700 text-white"
                        data-testid="input-credit-email"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="credit-amount" className="text-gray-300">Credit Amount to Add</Label>
                      <Input
                        id="credit-amount"
                        type="number"
                        placeholder="100"
                        min="1"
                        value={creditAmount}
                        onChange={(e) => setCreditAmount(e.target.value)}
                        className="bg-dark-bg border-gray-700 text-white"
                        data-testid="input-credit-amount"
                      />
                      <p className="text-xs text-gray-500">Enter the number of credits to add to the user's current balance</p>
                    </div>
                    <Button
                      onClick={() => {
                        if (creditEmail && creditAmount) {
                          updateCreditsMutation.mutate({
                            email: creditEmail,
                            credits: parseInt(creditAmount)
                          });
                        }
                      }}
                      disabled={!creditEmail || !creditAmount || updateCreditsMutation.isPending}
                      className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white"
                      data-testid="button-add-credits"
                    >
                      {updateCreditsMutation.isPending ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <Coins className="w-4 h-4 mr-2" />
                          Add Credits
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Promotions Tab */}
            <TabsContent value="promotions">
              <Card className="bg-dark-card border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Tag className="w-5 h-5 text-pink-500" />
                    Promotional Sales & Features
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Toggle promotional sales and special features across the platform. Enabled sales will be displayed on the subscription page.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Sale Toggles */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-yellow-400" />
                      Sales & Discounts
                    </h3>
                    <div className="grid gap-4">
                      {siteSettings.filter(s => s.key.startsWith('sale_')).map((setting) => (
                        <div key={setting.key} className="flex items-center justify-between p-4 bg-dark-bg rounded-lg border border-gray-700">
                          <div className="flex-1">
                            <h4 className="text-white font-medium">{setting.label}</h4>
                            <p className="text-sm text-gray-400">{setting.description}</p>
                          </div>
                          <div className="flex items-center gap-4">
                            <Badge className={setting.value ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}>
                              {setting.value ? 'Active' : 'Inactive'}
                            </Badge>
                            <Switch
                              checked={setting.value}
                              onCheckedChange={(checked) => {
                                updateSiteSettingMutation.mutate({
                                  key: setting.key,
                                  value: checked
                                });
                              }}
                              disabled={updateSiteSettingMutation.isPending}
                              data-testid={`switch-${setting.key}`}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Product Hunt Toggle */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-white flex items-center gap-2">
                      <Crown className="w-4 h-4 text-orange-500" />
                      Product Hunt
                    </h3>
                    <div className="grid gap-4">
                      {siteSettings.filter(s => s.key === 'producthunt_live').map((setting) => (
                        <div key={setting.key} className="flex items-center justify-between p-4 bg-dark-bg rounded-lg border border-gray-700">
                          <div className="flex-1">
                            <h4 className="text-white font-medium">{setting.label}</h4>
                            <p className="text-sm text-gray-400">{setting.description}</p>
                          </div>
                          <div className="flex items-center gap-4">
                            <Badge className={setting.value ? 'bg-orange-500/20 text-orange-400' : 'bg-gray-500/20 text-gray-400'}>
                              {setting.value ? 'Live' : 'Hidden'}
                            </Badge>
                            <Switch
                              checked={setting.value}
                              onCheckedChange={(checked) => {
                                updateSiteSettingMutation.mutate({
                                  key: setting.key,
                                  value: checked
                                });
                              }}
                              disabled={updateSiteSettingMutation.isPending}
                              data-testid={`switch-${setting.key}`}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="promotions">
              <div className="grid gap-6">
                <Card className="bg-dark-card border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <FileCode className="w-5 h-5 text-blue-400" />
                      Custom Platform Ads
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                      Manage the content and visibility of custom advertisements across the platform.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {siteSettings.filter(s => s.key === 'ad_template_primary').map(setting => (
                      <div key={setting.key} className="space-y-4 p-4 bg-dark-bg/50 rounded-xl border border-gray-800">
                        <div className="flex items-center justify-between">
                          <Label className="text-white text-base">Ad Content (Markdown/HTML)</Label>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">Enable Ad</span>
                            <Switch
                              checked={getSetting('promo_banner_active')?.value || false}
                              onCheckedChange={(checked) => updateSiteSettingMutation.mutate({ key: 'promo_banner_active', value: checked })}
                              disabled={updateSiteSettingMutation.isPending}
                            />
                          </div>
                        </div>
                        <Textarea
                          defaultValue={setting.stringValue || ""}
                          className="min-h-[150px] bg-gray-900 border-gray-700 text-white font-mono text-sm focus:border-neon-purple transition-colors"
                          onBlur={(e) => {
                            if (e.target.value !== setting.stringValue) {
                              updateSiteSettingMutation.mutate({ key: setting.key, stringValue: e.target.value });
                            }
                          }}
                        />
                        <p className="text-xs text-gray-500 leading-relaxed italic">{setting.description}</p>
                      </div>
                    ))}

                    <div className="grid md:grid-cols-2 gap-4">
                      {siteSettings.filter(s => ['promo_banner_text', 'promo_banner_active'].includes(s.key)).map(setting => (
                        <div key={setting.key} className="p-4 bg-dark-bg/50 rounded-xl border border-gray-800">
                          <div className="flex items-center justify-between mb-3">
                            <Label className="text-white font-medium">{setting.label}</Label>
                            {setting.key === 'promo_banner_active' && (
                              <Badge className={setting.value ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}>
                                {setting.value ? "Visible" : "Hidden"}
                              </Badge>
                            )}
                          </div>
                          {setting.key === 'promo_banner_active' ? (
                            <Switch
                              checked={setting.value}
                              onCheckedChange={(checked) => updateSiteSettingMutation.mutate({ key: setting.key, value: checked })}
                              disabled={updateSiteSettingMutation.isPending}
                            />
                          ) : (
                            <Input
                              defaultValue={setting.stringValue || ""}
                              className="bg-gray-900 border-gray-700 text-white"
                              onBlur={(e) => {
                                if (e.target.value !== setting.stringValue) {
                                  updateSiteSettingMutation.mutate({ key: setting.key, stringValue: e.target.value });
                                }
                              }}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-dark-card border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-yellow-400" />
                      Platform Sales & Discounts
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                      Enable platform-wide sale mode to automatically discount all credit packages.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {siteSettings.filter(s => s.key.startsWith('sale_')).map(setting => (
                      <div key={setting.key} className="p-4 bg-dark-bg rounded-lg border border-gray-700">
                        <div className="flex items-center justify-between mb-2">
                          <Label className="text-white font-medium">{setting.label}</Label>
                          {setting.key === 'sale_active' && (
                            <Switch
                              checked={setting.value}
                              onCheckedChange={(checked) => updateSiteSettingMutation.mutate({ key: setting.key, value: checked })}
                              disabled={updateSiteSettingMutation.isPending}
                            />
                          )}
                        </div>
                        {setting.key === 'sale_percentage' && (
                          <div className="flex items-center gap-3">
                            <Input
                              type="number"
                              defaultValue={setting.numberValue || 20}
                              className="w-24 bg-gray-900 border-gray-700 text-white"
                              onBlur={(e) => {
                                const val = parseInt(e.target.value);
                                if (!isNaN(val) && val !== setting.numberValue) {
                                  updateSiteSettingMutation.mutate({ key: setting.key, numberValue: val });
                                }
                              }}
                            />
                            <span className="text-gray-400">% Discount</span>
                          </div>
                        )}
                        <p className="text-xs text-gray-500 mt-2">{setting.description}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="features">
              <div className="grid gap-6">
                <Card className="bg-dark-card border-gray-800">
                  <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                    <div>
                      <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
                        <Shield className="w-6 h-6 text-neon-cyan" />
                        Platform Feature Controls
                      </CardTitle>
                      <CardDescription className="text-gray-400 mt-1">
                        Instantly enable or disable any module across the entire platform.
                      </CardDescription>
                    </div>
                    <div className="relative w-72">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <Input
                        placeholder="Search features..."
                        className="pl-9 bg-gray-900 border-gray-700 text-white h-9"
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                      {siteSettings
                        .filter(s => s.key.startsWith('feature_') && (searchQuery === "" || s.label.toLowerCase().includes(searchQuery.toLowerCase())))
                        .map((setting) => (
                          <div
                            key={setting.key}
                            className="flex items-center justify-between p-4 bg-dark-bg rounded-xl border border-gray-800 hover:border-gray-700 transition-all group"
                          >
                            <div className="flex-1 min-w-0 pr-4">
                              <h4 className="text-white text-sm font-semibold truncate group-hover:text-neon-cyan transition-colors">
                                {setting.label}
                              </h4>
                              <p className="text-[10px] text-gray-500 truncate mt-0.5" title={setting.description}>
                                {setting.description}
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-2 shrink-0">
                              <Badge
                                variant="outline"
                                className={`text-[9px] px-2 py-0 h-4 border-none ${setting.value
                                  ? 'bg-green-500/10 text-green-400'
                                  : 'bg-red-500/10 text-red-400'
                                  }`}
                              >
                                {setting.value ? 'ON' : 'OFF'}
                              </Badge>
                              <Switch
                                checked={setting.value}
                                onCheckedChange={(checked) => {
                                  updateSiteSettingMutation.mutate({
                                    key: setting.key,
                                    value: checked
                                  });
                                }}
                                disabled={updateSiteSettingMutation.isPending}
                                className="scale-90"
                              />
                            </div>
                          </div>
                        ))}
                    </div>
                    {siteSettings.filter(s => s.key.startsWith('feature_') && (searchQuery === "" || s.label.toLowerCase().includes(searchQuery.toLowerCase()))).length === 0 && (
                      <div className="py-12 text-center text-gray-500">
                        <Zap className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p>No features matching your search</p>
                      </div>
                    )}
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
