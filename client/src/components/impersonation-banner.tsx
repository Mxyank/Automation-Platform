import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { AlertCircle, X, ArrowLeft } from "lucide-react";

interface ImpersonationStatus {
  isImpersonating: boolean;
  originalUserEmail: string | null;
}

export function ImpersonationBanner() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: status } = useQuery<ImpersonationStatus>({
    queryKey: ["/api/admin/impersonation-status"],
    refetchInterval: 30000,
  });

  const endImpersonationMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/impersonate/end", {});
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Session Restored",
        description: "You have returned to your original account.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/impersonation-status"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to end impersonation",
        description: error.message || "Could not restore original session",
        variant: "destructive",
      });
    },
  });

  if (!status?.isImpersonating) {
    return null;
  }

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[100] bg-gradient-to-r from-orange-600 to-red-600 text-white py-2 px-4 shadow-lg"
      data-testid="banner-impersonation"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 animate-pulse" />
          <span className="font-medium">
            Impersonation Mode Active
          </span>
          <span className="text-orange-100 text-sm">
            — Original account: <strong>{status.originalUserEmail}</strong>
          </span>
        </div>

        <Button
          onClick={() => endImpersonationMutation.mutate()}
          disabled={endImpersonationMutation.isPending}
          size="sm"
          variant="secondary"
          className="bg-white/20 hover:bg-white/30 text-white border-white/40"
          data-testid="button-end-impersonation"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          {endImpersonationMutation.isPending ? "Restoring..." : "End Impersonation"}
        </Button>
      </div>
    </div>
  );
}
