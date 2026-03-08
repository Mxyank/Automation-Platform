import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
    Card, CardContent, CardHeader, CardTitle, CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
    Loader2, User, Briefcase, Code, Link as LinkIcon,
    Rocket, ChevronRight, ChevronLeft, CheckCircle2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type ProfileFormData = {
    username: string;
    headline: string;
    bio: string;
    company: string;
    role: string;
    skills: string; // Will be split into array
};

export default function ProfileSetup() {
    const { user } = useAuth();
    const [, setLocation] = useLocation();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [step, setStep] = useState(1);

    const form = useForm<ProfileFormData>({
        defaultValues: {
            username: user?.username || "",
            headline: "",
            bio: "",
            company: "",
            role: "",
            skills: "",
        }
    });

    const updateProfileMutation = useMutation({
        mutationFn: async (data: any) => {
            const res = await apiRequest("PUT", "/api/profile/me", {
                ...data,
                skills: data.skills.split(",").map((s: string) => s.trim()).filter(Boolean),
            });
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/user"] });
            toast({
                title: "Profile setup complete!",
                description: "Welcome to the Prometix community.",
            });
            setLocation("/dashboard");
        },
        onError: (error: Error) => {
            toast({
                title: "Failed to update profile",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const nextStep = () => setStep(s => s + 1);
    const prevStep = () => setStep(s => s - 1);

    const onSubmit = (data: ProfileFormData) => {
        updateProfileMutation.mutate(data);
    };

    return (
        <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
            <div className="absolute top-0 left-0 w-full h-1 bg-gray-800">
                <motion.div
                    className="h-full bg-neon-cyan shadow-[0_0_10px_#00f3ff]"
                    initial={{ width: "0%" }}
                    animate={{ width: `${(step / 3) * 100}%` }}
                />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-xl"
            >
                <Card className="bg-dark-card border-gray-800 backdrop-blur-md shadow-2xl relative overflow-hidden">
                    {/* Decorative Background */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-neon-cyan/5 rounded-full blur-3xl -mr-16 -mt-16" />

                    <CardHeader className="text-center pb-2">
                        <div className="w-16 h-16 bg-gradient-to-br from-neon-cyan to-neon-purple rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                            <User className="w-8 h-8 text-white" />
                        </div>
                        <CardTitle className="text-3xl font-bold text-white">Complete Your Profile</CardTitle>
                        <CardDescription className="text-gray-400">
                            Tell us a bit about yourself to get started with networking.
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="pt-6">
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <AnimatePresence mode="wait">
                                {step === 1 && (
                                    <motion.div
                                        key="step1"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="space-y-4"
                                    >
                                        <div className="space-y-2">
                                            <Label className="text-gray-300">Choose a Username</Label>
                                            <Input
                                                {...form.register("username")}
                                                className="bg-gray-900/50 border-gray-700 text-white"
                                                placeholder="john_doe"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-gray-300">Headline</Label>
                                            <Input
                                                {...form.register("headline")}
                                                className="bg-gray-900/50 border-gray-700 text-white"
                                                placeholder="DevOps Engineer | Cloud Enthusiast"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-gray-300">Short Bio</Label>
                                            <Textarea
                                                {...form.register("bio")}
                                                className="bg-gray-900/50 border-gray-700 text-white min-h-[100px]"
                                                placeholder="Tell the community what you're passionate about..."
                                            />
                                        </div>
                                        <Button
                                            type="button"
                                            onClick={nextStep}
                                            className="w-full bg-neon-cyan text-black hover:bg-neon-cyan/90 font-bold"
                                        >
                                            Next: Career Details <ChevronRight className="ml-2 w-4 h-4" />
                                        </Button>
                                    </motion.div>
                                )}

                                {step === 2 && (
                                    <motion.div
                                        key="step2"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="space-y-4"
                                    >
                                        <div className="space-y-2">
                                            <Label className="text-gray-300">Current Company</Label>
                                            <Input
                                                {...form.register("company")}
                                                className="bg-gray-900/50 border-gray-700 text-white"
                                                placeholder="Tech Corp Inc."
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-gray-300">Your Role</Label>
                                            <Input
                                                {...form.register("role")}
                                                className="bg-gray-900/50 border-gray-700 text-white"
                                                placeholder="Senior SRE"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-gray-300">Skills (comma separated)</Label>
                                            <Input
                                                {...form.register("skills")}
                                                className="bg-gray-900/50 border-gray-700 text-white"
                                                placeholder="Docker, Kubernetes, AWS, Terraform"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={prevStep}
                                                className="border-gray-700 text-gray-300 hover:bg-gray-800"
                                            >
                                                <ChevronLeft className="mr-2 w-4 h-4" /> Back
                                            </Button>
                                            <Button
                                                type="button"
                                                onClick={nextStep}
                                                className="bg-neon-purple text-white hover:bg-neon-purple/90 font-bold"
                                            >
                                                Last Step <ChevronRight className="ml-2 w-4 h-4" />
                                            </Button>
                                        </div>
                                    </motion.div>
                                )}

                                {step === 3 && (
                                    <motion.div
                                        key="step3"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="space-y-6 text-center"
                                    >
                                        <div className="py-8">
                                            <div className="w-20 h-20 bg-neon-cyan/20 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-neon-cyan">
                                                <CheckCircle2 className="w-10 h-10 text-neon-cyan" />
                                            </div>
                                            <h3 className="text-xl font-bold text-white mb-2">Ready to Launch!</h3>
                                            <p className="text-gray-400">
                                                Your profile is almost ready. Once you finish, you can start connecting with other engineers.
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={prevStep}
                                                className="border-gray-700 text-gray-300 hover:bg-gray-800"
                                            >
                                                <ChevronLeft className="mr-2 w-4 h-4" /> Back
                                            </Button>
                                            <Button
                                                type="submit"
                                                disabled={updateProfileMutation.isPending}
                                                className="bg-white text-black hover:bg-gray-100 font-bold"
                                            >
                                                {updateProfileMutation.isPending ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <>Complete Setup <Rocket className="ml-2 w-4 h-4" /></>
                                                )}
                                            </Button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </form>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
