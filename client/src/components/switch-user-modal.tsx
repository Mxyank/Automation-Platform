import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { UserCog, AlertTriangle } from "lucide-react";

interface SwitchUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SwitchUserModal({ open, onOpenChange }: SwitchUserModalProps) {
  const [email, setEmail] = useState("");
  const [reason, setReason] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const impersonateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/impersonate/start", {
        email,
        reason,
      });
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Switched User",
        description: `Now acting as ${email}. A banner will remind you.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/impersonation-status"] });
      onOpenChange(false);
      setEmail("");
      setReason("");
      setLocation("/dashboard");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to switch user",
        description: error.message || "Could not switch to the specified user",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast({
        title: "Email required",
        description: "Please enter the email of the user to switch to",
        variant: "destructive",
      });
      return;
    }
    impersonateMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-dark-card border-dark-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <UserCog className="w-5 h-5 text-neon-cyan" />
            Switch User (Impersonation)
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Temporarily switch to another user's account to troubleshoot issues or provide support.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-start gap-3 p-3 bg-yellow-900/20 border border-yellow-600/30 rounded-lg">
          <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
          <div className="text-sm text-yellow-200">
            <strong>Security Notice:</strong> All actions during impersonation are logged for audit purposes.
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-gray-300">
              User Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-dark-bg border-dark-border text-white"
              data-testid="input-impersonate-email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason" className="text-gray-300">
              Reason (Optional)
            </Label>
            <Textarea
              id="reason"
              placeholder="e.g., Investigating billing issue #123"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="bg-dark-bg border-dark-border text-white resize-none"
              rows={2}
              data-testid="input-impersonate-reason"
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-dark-border text-gray-300 hover:bg-dark-bg"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={impersonateMutation.isPending}
              className="bg-gradient-to-r from-neon-cyan to-neon-purple text-white"
              data-testid="button-switch-user"
            >
              {impersonateMutation.isPending ? "Switching..." : "Switch User"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
