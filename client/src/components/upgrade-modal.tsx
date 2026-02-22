import { useState } from "react";
import { useLocation } from "wouter";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown, Zap, Sparkles, Shield, Star, Rocket } from "lucide-react";

export function useUpgradeModal() {
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);

    const checkForUpgrade = (error: any): boolean => {
        const msg = error?.message || String(error);
        if (
            error?.status === 402 ||
            error?.isPremiumFeature ||
            msg.includes("402") ||
            msg.includes("Free limit reached") ||
            msg.includes("Insufficient credits") ||
            msg.includes("purchase credits")
        ) {
            setShowUpgradeModal(true);
            return true;
        }
        return false;
    };

    return { showUpgradeModal, setShowUpgradeModal, checkForUpgrade };
}

export function UpgradeModal({
    open,
    onOpenChange,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const [, setLocation] = useLocation();

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-dark-card border-dark-border text-white max-w-md">
                <DialogHeader>
                    <div className="mx-auto w-16 h-16 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mb-4">
                        <Crown className="w-8 h-8 text-white" />
                    </div>
                    <DialogTitle className="text-center text-2xl">
                        Credits Exhausted
                    </DialogTitle>
                    <DialogDescription className="text-center text-gray-400 mt-2">
                        You've used all your free credits! Purchase more credits or upgrade
                        to AI Pro for unlimited access.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 mt-4">
                    <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 rounded-lg p-4 border border-purple-500/30">
                        <h4 className="font-semibold text-white flex items-center gap-2 mb-3">
                            <Rocket className="w-4 h-4 text-yellow-500" />
                            AI Pro Benefits
                        </h4>
                        <ul className="space-y-2 text-sm text-gray-300">
                            <li className="flex items-center gap-2">
                                <Zap className="w-4 h-4 text-yellow-500" />
                                Unlimited AI queries
                            </li>
                            <li className="flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-yellow-500" />
                                Priority response times
                            </li>
                            <li className="flex items-center gap-2">
                                <Shield className="w-4 h-4 text-yellow-500" />
                                Advanced DevOps insights
                            </li>
                            <li className="flex items-center gap-2">
                                <Star className="w-4 h-4 text-yellow-500" />
                                Early access to new features
                            </li>
                        </ul>
                    </div>

                    <div className="flex flex-col gap-3">
                        <Button
                            onClick={() => {
                                onOpenChange(false);
                                setLocation("/pricing");
                            }}
                            className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold"
                        >
                            <Crown className="w-4 h-4 mr-2" />
                            View Pricing Plans
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="w-full border-gray-600 text-gray-400 hover:text-white hover:border-gray-500"
                        >
                            Maybe Later
                        </Button>
                    </div>

                    <p className="text-xs text-center text-gray-500">
                        Starting at just ₹199/month for unlimited access
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}
