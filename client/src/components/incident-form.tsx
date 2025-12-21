import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { LifeBuoy, Send, Loader2 } from "lucide-react";

const incidentSchema = z.object({
  subject: z.string().min(5, "Subject must be at least 5 characters"),
  description: z.string().min(20, "Please provide more details (at least 20 characters)"),
  priority: z.enum(["low", "medium", "high"]),
});

type IncidentFormData = z.infer<typeof incidentSchema>;

export function IncidentForm() {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<IncidentFormData>({
    resolver: zodResolver(incidentSchema),
    defaultValues: {
      subject: "",
      description: "",
      priority: "medium",
    },
  });

  const createIncidentMutation = useMutation({
    mutationFn: async (data: IncidentFormData) => {
      return apiRequest("POST", "/api/incidents", data);
    },
    onSuccess: () => {
      toast({
        title: "Ticket Submitted",
        description: "We've received your support request and will respond soon.",
      });
      form.reset();
      setIsOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/incidents"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit ticket. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: IncidentFormData) => {
    createIncidentMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Card className="bg-dark-card border-gray-800 hover:border-neon-cyan/50 transition-colors cursor-pointer">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-neon-cyan/20 rounded-lg flex items-center justify-center">
                <LifeBuoy className="w-5 h-5 text-neon-cyan" />
              </div>
              <div>
                <h3 className="text-white font-medium text-sm">Need Help?</h3>
                <p className="text-gray-400 text-xs">Report an issue or ask a question</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </DialogTrigger>
      <DialogContent className="bg-dark-card border-gray-700 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <LifeBuoy className="w-5 h-5 text-neon-cyan" />
            Submit Support Ticket
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">Subject</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Brief description of your issue..."
                      className="bg-dark-bg border-gray-700 text-white"
                      data-testid="input-incident-subject"
                      {...field}
                    />
                  </FormControl>
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
                      <SelectTrigger className="bg-dark-bg border-gray-700 text-white" data-testid="select-incident-priority">
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-dark-card border-gray-700">
                      <SelectItem value="low" className="text-white">Low - General inquiry</SelectItem>
                      <SelectItem value="medium" className="text-white">Medium - Issue affecting work</SelectItem>
                      <SelectItem value="high" className="text-white">High - Critical problem</SelectItem>
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
                      placeholder="Please describe your issue in detail..."
                      className="bg-dark-bg border-gray-700 text-white min-h-[120px]"
                      data-testid="input-incident-description"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="w-full bg-neon-cyan text-dark-bg hover:bg-neon-cyan/80"
              disabled={createIncidentMutation.isPending}
              data-testid="button-submit-incident"
            >
              {createIncidentMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Submit Ticket
                </>
              )}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
