import { Clock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

interface ComingSoonOverlayProps {
  domainName: string;
  message?: string;
}

export function ComingSoonOverlay({ domainName, message }: ComingSoonOverlayProps) {
  return (
    <div className="fixed inset-0 bg-dark-bg/95 backdrop-blur-sm z-40 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-8">
        <div className="w-20 h-20 bg-gradient-to-r from-neon-cyan to-neon-purple rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
          <Clock className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-4">
          {domainName} Coming Soon
        </h2>
        <p className="text-gray-400 mb-6">
          {message || `We're working hard to bring you amazing ${domainName} tools. Stay tuned for updates!`}
        </p>
        <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-8">
          <Sparkles className="w-4 h-4 text-yellow-500" />
          <span>Exciting features in development</span>
        </div>
        <Link href="/dashboard">
          <Button 
            className="bg-gradient-to-r from-neon-cyan to-neon-purple text-dark-bg"
            data-testid="button-back-to-dashboard"
          >
            Back to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
