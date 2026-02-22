import { AlertTriangle, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

interface FeatureDisabledOverlayProps {
    featureName: string;
    message?: string;
}

export function FeatureDisabledOverlay({ featureName, message }: FeatureDisabledOverlayProps) {
    return (
        <div className="fixed inset-0 bg-dark-bg/95 backdrop-blur-md z-50 flex items-center justify-center">
            <div className="text-center max-w-md mx-auto p-12 bg-dark-card border border-gray-800 rounded-2xl shadow-2xl">
                <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse border border-red-500/20">
                    <AlertTriangle className="w-12 h-12 text-red-500" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-4">
                    {featureName} Disabled
                </h2>
                <p className="text-gray-400 mb-8 leading-relaxed">
                    {message || `This feature has been temporarily disabled by the administrator. Please check back later or contact support if you believe this is an error.`}
                </p>
                <div className="flex flex-col gap-4">
                    <Link href="/dashboard">
                        <Button
                            className="w-full h-12 bg-gray-800 hover:bg-gray-700 text-white border border-gray-700 transition-all flex items-center justify-center gap-2"
                            data-testid="button-back-to-dashboard"
                        >
                            <Home className="w-4 h-4" />
                            Return to Dashboard
                        </Button>
                    </Link>
                    <p className="text-xs text-gray-500 italic">
                        Reference Code: MOD_DISABLED
                    </p>
                </div>
            </div>
        </div>
    );
}
