import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Ban, Mail } from "lucide-react";
import { Link } from "wouter";

export function BannedPopup() {
  const { user, logoutMutation } = useAuth();
  
  const isBanned = (user as any)?.isBanned;
  const banReason = (user as any)?.banReason;
  
  if (!isBanned) {
    return null;
  }

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <Dialog open={isBanned} onOpenChange={() => {}}>
      <DialogContent className="bg-dark-card border-red-500/50 sm:max-w-md [&>button]:hidden">
        <DialogHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
            <Ban className="w-8 h-8 text-red-500" />
          </div>
          <DialogTitle className="text-2xl text-white text-center">
            Account Suspended
          </DialogTitle>
          <DialogDescription className="text-center text-gray-400 mt-2">
            Your account has been suspended due to a violation of our terms of service.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {banReason && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-red-400">Reason for suspension:</p>
                  <p className="text-sm text-gray-300 mt-1">{banReason}</p>
                </div>
              </div>
            </div>
          )}
          
          <p className="text-sm text-gray-400 text-center">
            If you believe this is a mistake, please contact our support team.
          </p>
          
          <div className="flex flex-col gap-3">
            <Link href="/helpdesk">
              <Button 
                className="w-full bg-gradient-to-r from-neon-cyan to-neon-purple text-dark-bg"
                data-testid="button-contact-support"
              >
                <Mail className="w-4 h-4 mr-2" />
                Contact Support
              </Button>
            </Link>
            <Button 
              variant="outline" 
              className="w-full border-gray-700 text-gray-300"
              onClick={handleLogout}
              data-testid="button-logout"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
