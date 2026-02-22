import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Gift } from "lucide-react";
import { useLocation } from "wouter";

interface SiteSetting {
    id: number;
    key: string;
    value: boolean;
    stringValue?: string;
    numberValue?: number;
}

export function CustomAd() {
    const [, setLocation] = useLocation();
    const { data: settings = [] } = useQuery<SiteSetting[]>({
        queryKey: ["/api/site-settings"],
    });

    const getSetting = (key: string) => settings.find(s => s.key === key);
    const isActive = getSetting('promo_banner_active')?.value || false;
    const content = getSetting('ad_template_primary')?.stringValue || "";

    if (!isActive || !content) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative overflow-hidden group rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-900/40 via-purple-900/40 to-blue-900/40 shadow-2xl p-8"
        >
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-neon-purple/20 rounded-full blur-[100px] group-hover:bg-neon-purple/30 transition-colors"></div>
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-neon-cyan/20 rounded-full blur-[100px] group-hover:bg-neon-cyan/30 transition-colors"></div>

            <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                <div className="flex-1 text-center md:text-left">
                    <Badge className="mb-4 bg-neon-purple/20 text-neon-purple border-neon-purple/30">Limited Offer</Badge>
                    <div className="text-2xl md:text-3xl font-bold text-white mb-4 leading-tight whitespace-pre-wrap">
                        {content}
                    </div>
                    <div className="flex flex-wrap gap-4 justify-center md:justify-start mt-6">
                        <Button
                            onClick={() => setLocation("/auth")}
                            className="bg-white text-black hover:bg-gray-100 px-6 py-4 rounded-xl font-bold"
                        >
                            Get Started <ArrowRight className="ml-2 w-4 h-4" />
                        </Button>
                    </div>
                </div>

                <div className="hidden lg:flex relative w-32 h-32 flex-shrink-0 animate-float items-center justify-center">
                    <div className="absolute inset-0 bg-neon-purple rounded-full blur-xl opacity-20"></div>
                    <div className="relative w-full h-full rounded-full border border-white/10 p-2 bg-white/5 flex items-center justify-center">
                        <Gift className="w-12 h-12 text-white" />
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
