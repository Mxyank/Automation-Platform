import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Navigation } from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useFeatures } from "@/hooks/use-features";
import { FeatureDisabledOverlay } from "@/components/feature-disabled-overlay";
import {
  HelpCircle,
  Plus,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  Send,
  RefreshCw,
  ArrowLeft,
  User,
  Shield
} from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

interface Incident {
  id: number;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  resolution?: string;
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
}

interface IncidentMessage {
  id: number;
  incidentId: number;
  authorId: number;
  authorRole: string;
  message: string;
  createdAt: string;
}

const createTicketSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(20, "Please provide more details (at least 20 characters)"),
  category: z.string().min(1, "Please select a category"),
  priority: z.string().min(1, "Please select a priority"),
});

type CreateTicketForm = z.infer<typeof createTicketSchema>;

export default function Helpdesk() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { isEnabled } = useFeatures();
  const isFeatureEnabled = isEnabled('helpdesk');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [newMessage, setNewMessage] = useState("");

  const form = useForm<CreateTicketForm>({
    resolver: zodResolver(createTicketSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      priority: "medium",
    },
  });

  const { data: incidents = [], isLoading, refetch } = useQuery<Incident[]>({
    queryKey: ["/api/incidents"],
  });

  const { data: incidentDetail, refetch: refetchDetail } = useQuery<{ incident: Incident; messages: IncidentMessage[] }>({
    queryKey: ["/api/incidents", selectedIncident?.id],
    enabled: !!selectedIncident,
  });

  const createIncidentMutation = useMutation({
    mutationFn: async (data: CreateTicketForm) => {
      return apiRequest("POST", "/api/incidents", data);
    },
    onSuccess: () => {
      toast({ title: "Ticket Created", description: "Your support ticket has been submitted" });
      form.reset();
      setShowCreateDialog(false);
      queryClient.invalidateQueries({ queryKey: ["/api/incidents"] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to create ticket", variant: "destructive" });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ incidentId, message }: { incidentId: number; message: string }) => {
      return apiRequest("POST", `/api/incidents/${incidentId}/message`, { message });
    },
    onSuccess: () => {
      setNewMessage("");
      refetchDetail();
      toast({ title: "Message Sent", description: "Your reply has been submitted" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to send message", variant: "destructive" });
    },
  });

  const reopenMutation = useMutation({
    mutationFn: async (incidentId: number) => {
      return apiRequest("POST", `/api/incidents/${incidentId}/reopen`);
    },
    onSuccess: () => {
      refetch();
      refetchDetail();
      toast({ title: "Ticket Reopened", description: "Your ticket has been reopened" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to reopen ticket", variant: "destructive" });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50">Open</Badge>;
      case "in_progress":
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50">In Progress</Badge>;
      case "resolved":
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/50">Resolved</Badge>;
      case "closed":
        return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/50">Closed</Badge>;
      case "reopened":
        return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/50">Reopened</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "low":
        return <Badge variant="outline" className="border-gray-500 text-gray-400">Low</Badge>;
      case "medium":
        return <Badge variant="outline" className="border-blue-500 text-blue-400">Medium</Badge>;
      case "high":
        return <Badge variant="outline" className="border-orange-500 text-orange-400">High</Badge>;
      case "critical":
        return <Badge variant="outline" className="border-red-500 text-red-400">Critical</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const onSubmit = (data: CreateTicketForm) => {
    createIncidentMutation.mutate(data);
  };

  return (
    <div className="relative min-h-screen bg-dark-bg">
      {!isFeatureEnabled && <FeatureDisabledOverlay featureName="Help Center" />}
      <Navigation />

      <div className="pt-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <HelpCircle className="w-8 h-8 text-neon-cyan" />
                <h1 className="text-3xl font-bold text-white">Help Center</h1>
              </div>
              <p className="text-gray-400 mt-1">Submit and track your support tickets</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="border-gray-700 text-gray-300"
                onClick={() => refetch()}
                data-testid="button-refresh-tickets"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button
                className="bg-gradient-to-r from-neon-cyan to-neon-purple text-dark-bg"
                onClick={() => setShowCreateDialog(true)}
                data-testid="button-create-ticket"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Ticket
              </Button>
            </div>
          </div>

          {selectedIncident ? (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Button
                variant="ghost"
                className="text-gray-400 mb-4"
                onClick={() => setSelectedIncident(null)}
                data-testid="button-back-to-list"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to tickets
              </Button>

              <Card className="bg-dark-card border-gray-800 mb-4">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-white text-xl">{selectedIncident.title}</CardTitle>
                      <CardDescription className="mt-2 flex items-center gap-2">
                        <span className="text-gray-500">#{selectedIncident.id}</span>
                        <span className="text-gray-600">•</span>
                        <span className="text-gray-500">{selectedIncident.category}</span>
                        <span className="text-gray-600">•</span>
                        {getPriorityBadge(selectedIncident.priority)}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(selectedIncident.status)}
                      {(selectedIncident.status === "resolved" || selectedIncident.status === "closed") && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-gray-700 text-gray-300"
                          onClick={() => reopenMutation.mutate(selectedIncident.id)}
                          data-testid="button-reopen-ticket"
                        >
                          Reopen
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300">{selectedIncident.description}</p>
                  <p className="text-sm text-gray-500 mt-4">
                    Created on {format(new Date(selectedIncident.createdAt), "PPP 'at' p")}
                  </p>
                  {selectedIncident.resolution && (
                    <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                      <p className="text-sm font-medium text-green-400 mb-1">Resolution:</p>
                      <p className="text-gray-300">{selectedIncident.resolution}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-dark-card border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white text-lg flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-neon-cyan" />
                    Conversation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px] pr-4">
                    {incidentDetail?.messages.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">No messages yet</p>
                    ) : (
                      <div className="space-y-4">
                        {incidentDetail?.messages.map((msg) => (
                          <div
                            key={msg.id}
                            className={`flex ${msg.authorRole === "user" ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-[80%] rounded-lg p-3 ${msg.authorRole === "user"
                                  ? "bg-neon-cyan/20 border border-neon-cyan/30"
                                  : "bg-gray-800 border border-gray-700"
                                }`}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                {msg.authorRole === "admin" ? (
                                  <Shield className="w-4 h-4 text-yellow-500" />
                                ) : (
                                  <User className="w-4 h-4 text-neon-cyan" />
                                )}
                                <span className="text-xs text-gray-400">
                                  {msg.authorRole === "admin" ? "Support Team" : "You"}
                                </span>
                                <span className="text-xs text-gray-600">
                                  {format(new Date(msg.createdAt), "MMM d, p")}
                                </span>
                              </div>
                              <p className="text-gray-300 text-sm">{msg.message}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>

                  {selectedIncident.status !== "closed" && (
                    <div className="mt-4 flex gap-2">
                      <Input
                        placeholder="Type your message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        className="bg-gray-800 border-gray-700 text-white"
                        data-testid="input-message"
                      />
                      <Button
                        onClick={() => sendMessageMutation.mutate({ incidentId: selectedIncident.id, message: newMessage })}
                        disabled={!newMessage.trim() || sendMessageMutation.isPending}
                        className="bg-neon-cyan text-dark-bg"
                        data-testid="button-send-message"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Card key={i} className="bg-dark-card border-gray-800">
                      <CardContent className="p-6">
                        <div className="animate-pulse">
                          <div className="h-4 bg-gray-700 rounded w-1/2 mb-2"></div>
                          <div className="h-3 bg-gray-700 rounded w-3/4"></div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : incidents.length === 0 ? (
                <Card className="bg-dark-card border-gray-800">
                  <CardContent className="p-12 text-center">
                    <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MessageSquare className="w-8 h-8 text-gray-600" />
                    </div>
                    <h3 className="text-lg font-medium text-white mb-2">No Tickets Yet</h3>
                    <p className="text-gray-400 mb-6 max-w-sm mx-auto">
                      Need help? Create a support ticket and our team will assist you.
                    </p>
                    <Button
                      className="bg-gradient-to-r from-neon-cyan to-neon-purple text-dark-bg"
                      onClick={() => setShowCreateDialog(true)}
                      data-testid="button-create-first-ticket"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Your First Ticket
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {incidents.map((incident) => (
                    <Card
                      key={incident.id}
                      className="bg-dark-card border-gray-800 hover:border-gray-700 transition-colors cursor-pointer"
                      onClick={() => setSelectedIncident(incident)}
                      data-testid={`card-incident-${incident.id}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-medium text-white">{incident.title}</h3>
                              {getStatusBadge(incident.status)}
                            </div>
                            <p className="text-sm text-gray-400 line-clamp-1">{incident.description}</p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                              <span>#{incident.id}</span>
                              <span className="capitalize">{incident.category}</span>
                              {getPriorityBadge(incident.priority)}
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {format(new Date(incident.createdAt), "MMM d, yyyy")}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="bg-dark-card border-gray-800 sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">Create Support Ticket</DialogTitle>
            <DialogDescription className="text-gray-400">
              Describe your issue and we'll get back to you as soon as possible.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-300">Title</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Brief summary of your issue"
                        className="bg-gray-800 border-gray-700 text-white"
                        data-testid="input-ticket-title"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-300">Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-gray-800 border-gray-700 text-white" data-testid="select-category">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-dark-card border-gray-700">
                        <SelectItem value="bug">Bug Report</SelectItem>
                        <SelectItem value="feature">Feature Request</SelectItem>
                        <SelectItem value="billing">Billing Issue</SelectItem>
                        <SelectItem value="abuse">Report Abuse</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-300">Priority</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-gray-800 border-gray-700 text-white" data-testid="select-priority">
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-dark-card border-gray-700">
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-300">Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Provide detailed information about your issue..."
                        className="bg-gray-800 border-gray-700 text-white min-h-[120px]"
                        data-testid="input-ticket-description"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  className="border-gray-700 text-gray-300"
                  onClick={() => setShowCreateDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-neon-cyan to-neon-purple text-dark-bg"
                  disabled={createIncidentMutation.isPending}
                  data-testid="button-submit-ticket"
                >
                  {createIncidentMutation.isPending ? "Creating..." : "Create Ticket"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
