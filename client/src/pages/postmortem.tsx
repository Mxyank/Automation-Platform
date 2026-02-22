import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Navigation } from "@/components/navigation";
import { BackButton } from "@/components/back-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useFeatures } from "@/hooks/use-features";
import { FeatureDisabledOverlay } from "@/components/feature-disabled-overlay";
import {
  FileWarning,
  Clock,
  AlertCircle,
  Lightbulb,
  Loader2,
  Copy,
  Download,
  Users,
  Server,
  Activity,
  CheckCircle,
  XCircle,
  ArrowRight,
  Shield,
  Target,
  TrendingUp,
  Calendar
} from "lucide-react";
import { motion } from "framer-motion";
import { useUpgradeModal, UpgradeModal } from "@/components/upgrade-modal";

interface PostmortemResult {
  incidentTitle: string;
  severity: "critical" | "high" | "medium" | "low";
  summary: string;
  timeline: {
    time: string;
    event: string;
    type: "detection" | "response" | "mitigation" | "resolution";
  }[];
  whatHappened: string;
  rootCause: string;
  impact: {
    users: string;
    duration: string;
    services: string[];
    financial: string;
  };
  teamInvolvement: {
    team: string;
    role: string;
  }[];
  whatWentWell: string[];
  whatWentWrong: string[];
  preventiveMeasures: {
    action: string;
    owner: string;
    priority: "high" | "medium" | "low";
    deadline: string;
  }[];
  lessonsLearned: string[];
  fullReport: string;
}

export default function PostmortemGenerator() {
  const { toast } = useToast();
  const { showUpgradeModal, setShowUpgradeModal, checkForUpgrade } = useUpgradeModal();
  const { isEnabled } = useFeatures();
  const isFeatureEnabled = isEnabled('postmortem');
  const [incidentDescription, setIncidentDescription] = useState("");
  const [incidentUrl, setIncidentUrl] = useState("");
  const [logs, setLogs] = useState("");
  const [severity, setSeverity] = useState("high");
  const [result, setResult] = useState<PostmortemResult | null>(null);

  const generateMutation = useMutation({
    mutationFn: async (data: { description: string; url: string; logs: string; severity: string }) => {
      const response = await apiRequest("POST", "/api/ai/postmortem", data);
      return response.json();
    },
    onSuccess: (data) => {
      setResult(data.result);
      toast({
        title: "Post-Mortem Generated",
        description: "Comprehensive incident analysis is ready.",
      });
    },
    onError: (error: Error) => {
      if (checkForUpgrade(error)) return;
      toast({
        title: "Generation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleGenerate = () => {
    if (!incidentDescription.trim()) {
      toast({
        title: "Description Required",
        description: "Please describe the incident that occurred.",
        variant: "destructive",
      });
      return;
    }
    generateMutation.mutate({
      description: incidentDescription,
      url: incidentUrl,
      logs,
      severity,
    });
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${type} copied to clipboard.`,
    });
  };

  const downloadFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getSeverityColor = (sev: string) => {
    switch (sev) {
      case "critical": return "bg-red-500/20 text-red-500 border-red-500/50";
      case "high": return "bg-orange-500/20 text-orange-500 border-orange-500/50";
      case "medium": return "bg-yellow-500/20 text-yellow-500 border-yellow-500/50";
      case "low": return "bg-blue-500/20 text-blue-500 border-blue-500/50";
      default: return "bg-gray-500/20 text-gray-500";
    }
  };

  const getTimelineColor = (type: string) => {
    switch (type) {
      case "detection": return "bg-red-500";
      case "response": return "bg-yellow-500";
      case "mitigation": return "bg-blue-500";
      case "resolution": return "bg-green-500";
      default: return "bg-gray-500";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "text-red-500";
      case "medium": return "text-yellow-500";
      case "low": return "text-blue-500";
      default: return "text-gray-500";
    }
  };

  return (
    <div className="relative min-h-screen bg-dark-bg">
      {!isFeatureEnabled && <FeatureDisabledOverlay featureName="Post-Mortem Generator" />}
      <UpgradeModal open={showUpgradeModal} onOpenChange={setShowUpgradeModal} />
      <Navigation />

      <div className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <BackButton />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 mt-4"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-pink-500 rounded-xl flex items-center justify-center">
                <FileWarning className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">AI Post-Mortem Generator</h1>
                <p className="text-gray-400">Generate comprehensive incident reports automatically</p>
              </div>
            </div>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <Card className="bg-dark-card border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">Incident Details</CardTitle>
                  <CardDescription>
                    Provide information about the incident for AI to analyze
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-gray-300">Incident URL (Optional)</Label>
                      <Input
                        placeholder="https://status.yourapp.com/incident/123"
                        value={incidentUrl}
                        onChange={(e) => setIncidentUrl(e.target.value)}
                        className="bg-gray-900 border-gray-700 text-white"
                        data-testid="input-incident-url"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-gray-300">Severity</Label>
                      <Select value={severity} onValueChange={setSeverity}>
                        <SelectTrigger className="bg-gray-900 border-gray-700 text-white" data-testid="select-severity">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="critical">Critical (P0)</SelectItem>
                          <SelectItem value="high">High (P1)</SelectItem>
                          <SelectItem value="medium">Medium (P2)</SelectItem>
                          <SelectItem value="low">Low (P3)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-300">Incident Description</Label>
                    <Textarea
                      placeholder={`Describe what happened:

Example:
Our production API started returning 500 errors at 3:45 PM UTC. 
Users reported they couldn't complete checkout. 
The issue was traced to a database connection pool exhaustion 
after a recent deployment increased concurrent requests.
We rolled back the deployment at 4:15 PM and service was restored.`}
                      value={incidentDescription}
                      onChange={(e) => setIncidentDescription(e.target.value)}
                      className="bg-gray-900 border-gray-700 text-white min-h-[180px]"
                      data-testid="textarea-description"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-300">Error Logs / Metrics (Optional)</Label>
                    <Textarea
                      placeholder={`Paste relevant logs or metrics:

[2024-01-15 15:45:23] ERROR Database pool exhausted
[2024-01-15 15:45:24] ERROR Connection timeout after 30s
[2024-01-15 15:46:01] WARN High latency detected: 5000ms`}
                      value={logs}
                      onChange={(e) => setLogs(e.target.value)}
                      className="bg-gray-900 border-gray-700 text-white font-mono min-h-[150px]"
                      data-testid="textarea-logs"
                    />
                  </div>

                  <Button
                    onClick={handleGenerate}
                    disabled={generateMutation.isPending}
                    className="w-full bg-gradient-to-r from-red-500 to-pink-500 text-white"
                    data-testid="button-generate"
                  >
                    {generateMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Analyzing Incident...
                      </>
                    ) : (
                      <>
                        <FileWarning className="w-4 h-4 mr-2" />
                        Generate Post-Mortem
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-dark-card border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white text-lg">What's Included</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2 text-gray-400">
                      <Clock className="w-4 h-4 text-blue-500" />
                      <span className="text-sm">Incident timeline</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                      <Target className="w-4 h-4 text-red-500" />
                      <span className="text-sm">Root cause analysis</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                      <Users className="w-4 h-4 text-purple-500" />
                      <span className="text-sm">Impact assessment</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                      <Lightbulb className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm">Lessons learned</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                      <Shield className="w-4 h-4 text-green-500" />
                      <span className="text-sm">Prevention steps</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                      <TrendingUp className="w-4 h-4 text-cyan-500" />
                      <span className="text-sm">Action items</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              {result ? (
                <>
                  <Card className={`bg-dark-card border-2 ${getSeverityColor(result.severity)}`}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <Badge variant="outline" className={getSeverityColor(result.severity)}>
                            {result.severity.toUpperCase()} SEVERITY
                          </Badge>
                          <h3 className="text-xl font-bold text-white mt-2">{result.incidentTitle}</h3>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(result.fullReport, "Report")}
                            className="border-gray-700"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => downloadFile(result.fullReport, "postmortem.md")}
                            className="border-gray-700"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-gray-300">{result.summary}</p>

                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <div className="bg-gray-800/50 rounded-lg p-3">
                          <p className="text-gray-400 text-xs">Duration</p>
                          <p className="text-white font-medium">{result.impact.duration}</p>
                        </div>
                        <div className="bg-gray-800/50 rounded-lg p-3">
                          <p className="text-gray-400 text-xs">Users Affected</p>
                          <p className="text-white font-medium">{result.impact.users}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Tabs defaultValue="timeline" className="w-full">
                    <TabsList className="w-full bg-gray-800 grid grid-cols-5">
                      <TabsTrigger value="timeline">
                        <Clock className="w-4 h-4" />
                      </TabsTrigger>
                      <TabsTrigger value="analysis">
                        <Target className="w-4 h-4" />
                      </TabsTrigger>
                      <TabsTrigger value="review">
                        <Activity className="w-4 h-4" />
                      </TabsTrigger>
                      <TabsTrigger value="actions">
                        <CheckCircle className="w-4 h-4" />
                      </TabsTrigger>
                      <TabsTrigger value="lessons">
                        <Lightbulb className="w-4 h-4" />
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="timeline" className="mt-4">
                      <Card className="bg-dark-card border-gray-800">
                        <CardHeader>
                          <CardTitle className="text-white text-lg">Incident Timeline</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="relative space-y-4 pl-6">
                            <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-gray-700" />
                            {result.timeline.map((event, index) => (
                              <div key={index} className="relative">
                                <div className={`absolute -left-4 w-3 h-3 rounded-full ${getTimelineColor(event.type)}`} />
                                <div className="bg-gray-800 rounded-lg p-3">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-gray-500 text-xs font-mono">{event.time}</span>
                                    <Badge variant="outline" className="text-xs capitalize border-gray-600">
                                      {event.type}
                                    </Badge>
                                  </div>
                                  <p className="text-white text-sm">{event.event}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="analysis" className="mt-4 space-y-4">
                      <Card className="bg-dark-card border-gray-800">
                        <CardHeader>
                          <CardTitle className="text-white text-lg">What Happened</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-gray-300">{result.whatHappened}</p>
                        </CardContent>
                      </Card>

                      <Card className="bg-red-500/10 border-red-500/30">
                        <CardHeader>
                          <CardTitle className="text-red-400 text-lg flex items-center gap-2">
                            <Target className="w-5 h-5" />
                            Root Cause
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-gray-300">{result.rootCause}</p>
                        </CardContent>
                      </Card>

                      <Card className="bg-dark-card border-gray-800">
                        <CardHeader>
                          <CardTitle className="text-white text-lg">Impact</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-purple-500" />
                              <span className="text-gray-400">Users:</span>
                              <span className="text-white">{result.impact.users}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-blue-500" />
                              <span className="text-gray-400">Duration:</span>
                              <span className="text-white">{result.impact.duration}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Server className="w-4 h-4 text-orange-500" />
                              <span className="text-gray-400">Services:</span>
                              <span className="text-white">{result.impact.services.join(", ")}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="review" className="mt-4 space-y-4">
                      <Card className="bg-green-500/10 border-green-500/30">
                        <CardHeader>
                          <CardTitle className="text-green-400 text-lg flex items-center gap-2">
                            <CheckCircle className="w-5 h-5" />
                            What Went Well
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2">
                            {result.whatWentWell.map((item, index) => (
                              <li key={index} className="flex items-start gap-2 text-gray-300">
                                <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-1" />
                                {item}
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>

                      <Card className="bg-red-500/10 border-red-500/30">
                        <CardHeader>
                          <CardTitle className="text-red-400 text-lg flex items-center gap-2">
                            <XCircle className="w-5 h-5" />
                            What Went Wrong
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2">
                            {result.whatWentWrong.map((item, index) => (
                              <li key={index} className="flex items-start gap-2 text-gray-300">
                                <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-1" />
                                {item}
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="actions" className="mt-4">
                      <Card className="bg-dark-card border-gray-800">
                        <CardHeader>
                          <CardTitle className="text-white text-lg">Preventive Measures</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {result.preventiveMeasures.map((measure, index) => (
                            <div key={index} className="bg-gray-800 rounded-lg p-4">
                              <div className="flex items-start justify-between mb-2">
                                <p className="text-white font-medium">{measure.action}</p>
                                <Badge className={`${getPriorityColor(measure.priority)} bg-transparent`}>
                                  {measure.priority}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-4 text-sm">
                                <div className="flex items-center gap-1 text-gray-400">
                                  <Users className="w-3 h-3" />
                                  {measure.owner}
                                </div>
                                <div className="flex items-center gap-1 text-gray-400">
                                  <Calendar className="w-3 h-3" />
                                  {measure.deadline}
                                </div>
                              </div>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="lessons" className="mt-4">
                      <Card className="bg-dark-card border-gray-800">
                        <CardHeader>
                          <CardTitle className="text-white text-lg flex items-center gap-2">
                            <Lightbulb className="w-5 h-5 text-yellow-500" />
                            Lessons Learned
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-3">
                            {result.lessonsLearned.map((lesson, index) => (
                              <li key={index} className="flex items-start gap-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                                <Lightbulb className="w-5 h-5 text-yellow-500 shrink-0" />
                                <p className="text-gray-300">{lesson}</p>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>
                </>
              ) : (
                <Card className="bg-dark-card border-gray-800">
                  <CardContent className="p-12 text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-red-500/20 to-pink-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FileWarning className="w-8 h-8 text-red-400" />
                    </div>
                    <h3 className="text-lg font-medium text-white mb-2">AI Post-Mortem Analysis</h3>
                    <p className="text-gray-400 max-w-sm mx-auto mb-6">
                      Automatically generate comprehensive incident reports with root cause analysis and prevention steps
                    </p>
                    <div className="grid grid-cols-2 gap-4 text-left max-w-md mx-auto">
                      <div className="flex items-center gap-2 text-gray-400">
                        <Clock className="w-4 h-4 text-blue-500" />
                        <span className="text-sm">Timeline creation</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400">
                        <Target className="w-4 h-4 text-red-500" />
                        <span className="text-sm">Root cause analysis</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400">
                        <Shield className="w-4 h-4 text-green-500" />
                        <span className="text-sm">Prevention steps</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400">
                        <Lightbulb className="w-4 h-4 text-yellow-500" />
                        <span className="text-sm">Lessons learned</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
