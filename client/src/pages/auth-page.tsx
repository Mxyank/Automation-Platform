import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema } from "@shared/schema";
import { z } from "zod";
import { Loader2, Rocket, Zap, Shield, Code, ArrowLeft, Mail, CheckCircle, KeyRound, Lock, Github, Linkedin, Twitter, Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Mini CodeBlock component for Auth Showcase
const MiniCodeBlock = ({ code, filename }: { code: string; filename: string }) => {
  const [displayedCode, setDisplayedCode] = useState("");

  useEffect(() => {
    let currentIndex = 0;
    setDisplayedCode("");
    const interval = setInterval(() => {
      if (currentIndex < code.length) {
        setDisplayedCode(code.substring(0, currentIndex + 1));
        currentIndex++;
      } else {
        clearInterval(interval);
      }
    }, 30);
    return () => clearInterval(interval);
  }, [code]);

  return (
    <div className="bg-[#0D1117] border border-gray-800 rounded-xl overflow-hidden shadow-2xl">
      <div className="flex items-center justify-between px-4 py-2 bg-[#161B22] border-b border-gray-800">
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
          </div>
          <span className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">{filename}</span>
        </div>
      </div>
      <div className="p-4 font-mono text-xs text-gray-400 space-y-1">
        <pre className="whitespace-pre-wrap">
          {displayedCode}
          <span className="inline-block w-1.5 h-4 bg-neon-cyan animate-pulse ml-1" />
        </pre>
      </div>
    </div>
  );
};

const loginSchema = insertUserSchema.pick({ email: true, password: true });
const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain at least one uppercase letter")
    .regex(/[0-9]/, "Must contain at least one number"),
  confirmPassword: z.string().min(8, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Multi-step registration state
  const [registrationStep, setRegistrationStep] = useState<"form" | "otp">("form");
  const [otpCode, setOtpCode] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [pendingRegistration, setPendingRegistration] = useState<RegisterFormData | null>(null);

  // Forgot password state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotStep, setForgotStep] = useState<"email" | "otp" | "newpassword" | "done">("email");
  const [forgotOtp, setForgotOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotCountdown, setForgotCountdown] = useState(0);

  // Handle reset token in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("resetToken");
    if (token) {
      setShowForgotPassword(true);
      setForgotStep("newpassword");
      // Optionally clear the token from URL to avoid re-triggering
    }
  }, []);

  // Redirect if already logged in
  useEffect(() => {
    if (user && !window.location.search.includes("resetToken")) {
      setLocation("/dashboard");
    }
  }, [user, setLocation]);

  // OTP resend countdown timer
  useEffect(() => {
    if (otpCountdown > 0) {
      const timer = setTimeout(() => setOtpCountdown(otpCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpCountdown]);

  useEffect(() => {
    if (forgotCountdown > 0) {
      const timer = setTimeout(() => setForgotCountdown(forgotCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [forgotCountdown]);

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { username: "", email: "", password: "", confirmPassword: "" },
  });

  const onLogin = (data: LoginFormData) => {
    loginMutation.mutate(data);
  };

  // Helper: safe JSON fetch that handles HTML responses
  async function safeFetch(url: string, body: any): Promise<{ ok: boolean; data: any; status: number }> {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "include",
      });
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        // Server returned HTML (e.g. Vite fallback or 500 page)
        data = { message: "Server error. Please try again in a moment." };
      }
      return { ok: res.ok, data, status: res.status };
    } catch (error) {
      return { ok: false, data: { message: "Network error. Please check your connection." }, status: 0 };
    }
  }

  const onRegisterSubmit = async (data: RegisterFormData) => {
    setPendingRegistration(data);
    setOtpLoading(true);
    try {
      toast({
        title: "Sending code...",
        description: "Please wait while we send your verification code.",
      });

      const { ok, data: result } = await safeFetch("/api/auth/send-otp", { email: data.email });
      if (ok) {
        setRegistrationStep("otp");
        setOtpCountdown(60);
        toast({
          title: "Verification Code Sent",
          description: `We've sent a 6-digit code to ${data.email}. Please check your inbox (and spam folder).`,
        });
      } else {
        toast({
          title: "Registration Error",
          description: result.message || "Failed to send verification code. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setOtpLoading(false);
    }
  };

  const onVerifyOTP = () => {
    if (!pendingRegistration || !otpCode || otpCode.length !== 6) {
      toast({
        title: "Invalid Code",
        description: "Please enter the 6-digit verification code",
        variant: "destructive",
      });
      return;
    }

    const { confirmPassword, ...userData } = pendingRegistration;
    registerMutation.mutate({ ...userData, otpCode } as any);
  };

  const resendOTP = async () => {
    if (!pendingRegistration || otpCountdown > 0) return;
    setOtpLoading(true);
    try {
      const { ok, data } = await safeFetch("/api/auth/send-otp", { email: pendingRegistration.email });
      if (ok) {
        setOtpCountdown(60);
        toast({ title: "Code Resent", description: "A new verification code has been sent." });
      } else {
        toast({ title: "Failed", description: data.message, variant: "destructive" });
      }
    } finally {
      setOtpLoading(false);
    }
  };

  const sendForgotOTP = async () => {
    if (!forgotEmail.trim()) {
      toast({ title: "Email Required", description: "Enter your email address", variant: "destructive" });
      return;
    }
    setForgotLoading(true);
    try {
      const { ok, data } = await safeFetch("/api/auth/forgot-password", { email: forgotEmail });
      if (ok) {
        setForgotStep("otp");
        setForgotCountdown(60);
        toast({ title: "Code Sent", description: data.message });
      } else {
        toast({ title: "Error", description: data.message, variant: "destructive" });
      }
    } finally {
      setForgotLoading(false);
    }
  };

  const verifyForgotOTP = () => {
    if (forgotOtp.length !== 6) {
      toast({ title: "Invalid Code", description: "Enter the 6-digit code", variant: "destructive" });
      return;
    }
    setForgotStep("newpassword");
  };

  const resetPassword = async () => {
    if (newPassword.length < 8) {
      toast({ title: "Error", description: "Password must be at least 8 characters", variant: "destructive" });
      return;
    }
    if (newPassword !== newPasswordConfirm) {
      toast({ title: "Error", description: "Passwords don't match", variant: "destructive" });
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const token = params.get("resetToken") || forgotOtp; // Support both link and manual code if they copy/paste

    setForgotLoading(true);
    try {
      const { ok, data } = await safeFetch("/api/auth/reset-password", {
        token,
        newPassword,
      });
      if (ok) {
        setForgotStep("done");
        toast({ title: "Password Reset", description: data.message });
        // Clear URL params
        window.history.replaceState({}, "", window.location.pathname);
      } else {
        toast({ title: "Error", description: data.message, variant: "destructive" });
      }
    } finally {
      setForgotLoading(true); // Keep loading state until we transition or they retry
      setForgotLoading(false);
    }
  };

  if (user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-dark-bg">
        <Loader2 className="h-8 w-8 animate-spin text-neon-cyan" />
      </div>
    );
  }

  // Forgot Password View
  if (showForgotPassword) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-6">
          <Button
            onClick={() => { setShowForgotPassword(false); setForgotStep("email"); }}
            variant="ghost"
            className="text-gray-400 hover:text-white -ml-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Sign In
          </Button>

          <Card className="bg-gray-900/30 border border-gray-800 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-white text-xl flex items-center gap-2">
                <Lock className="w-5 h-5 text-neon-cyan" />
                {forgotStep === "done" ? "Password Reset!" : "Reset Password"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {forgotStep === "email" && (
                <div className="space-y-4">
                  <p className="text-gray-400 text-sm">Enter your email address and we'll send you a password reset link.</p>
                  <div className="space-y-2">
                    <Label className="text-gray-300">Email Address</Label>
                    <Input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="bg-dark-bg border-gray-700 text-white focus:border-neon-cyan"
                      placeholder="Enter your email"
                    />
                  </div>
                  <Button
                    onClick={sendForgotOTP}
                    disabled={forgotLoading || !forgotEmail.trim()}
                    className="w-full bg-white text-black font-medium hover:bg-gray-100"
                  >
                    {forgotLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Mail className="w-4 h-4 mr-2" />}
                    Send Reset Link
                  </Button>
                </div>
              )}

              {forgotStep === "otp" && (
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-gray-400 text-sm">Code sent to</p>
                    <p className="text-white font-medium">{forgotEmail}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-300">Verification Code</Label>
                    <Input
                      value={forgotOtp}
                      onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      className="bg-dark-bg border-gray-700 text-white text-center text-2xl font-mono"
                      placeholder="000000"
                      maxLength={6}
                    />
                  </div>
                  <Button onClick={verifyForgotOTP} disabled={forgotOtp.length !== 6} className="w-full bg-white text-black font-medium">
                    Verify Code
                  </Button>
                </div>
              )}

              {forgotStep === "newpassword" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-gray-300">New Password</Label>
                    <Input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="bg-dark-bg border-gray-700 text-white"
                      placeholder="New password"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-300">Confirm New Password</Label>
                    <Input
                      type="password"
                      value={newPasswordConfirm}
                      onChange={(e) => setNewPasswordConfirm(e.target.value)}
                      className="bg-dark-bg border-gray-700 text-white"
                      placeholder="Confirm password"
                    />
                  </div>
                  <Button onClick={resetPassword} disabled={forgotLoading} className="w-full bg-white text-black font-medium">
                    {forgotLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Reset Password"}
                  </Button>
                </div>
              )}

              {forgotStep === "done" && (
                <div className="space-y-4 text-center">
                  <p className="text-gray-300">Your password has been reset successfully!</p>
                  <Button onClick={() => setShowForgotPassword(false)} className="w-full bg-white text-black font-medium">
                    Sign In
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg flex flex-col md:flex-row overflow-hidden">
      {/* Left Panel: Premium Showcase */}
      <div className="hidden md:flex flex-1 relative items-center justify-center p-12 bg-[#0A0D12] overflow-hidden border-r border-gray-800">
        {/* Decorative Background Elements */}
        <div className="absolute top-[-10%] right-[-10%] w-[400px] h-[400px] bg-neon-purple/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-neon-cyan/20 rounded-full blur-[120px] animate-pulse" />

        <div className="relative z-10 w-full max-w-lg space-y-12">
          {/* Brand Header */}
          <div className="flex items-center space-x-4 mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-neon-cyan via-blue-500 to-neon-purple rounded-2xl flex items-center justify-center shadow-lg shadow-neon-cyan/20">
              <Rocket className="w-9 h-9 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-extrabold text-white tracking-tight">Prometix</h1>
              <p className="text-neon-cyan font-semibold tracking-widest text-xs uppercase">Enterprise AI DevOps</p>
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-5xl font-bold leading-tight text-white">
              The Future of <span className="bg-gradient-to-r from-neon-cyan to-neon-purple bg-clip-text text-transparent">Infrastructure</span> is Here.
            </h2>
            <p className="text-gray-400 text-lg leading-relaxed">
              Accelerate your engineering workflow with our next-generation AI platform.
              Deploy faster, scale smarter, and secure everything.
            </p>
          </div>

          {/* Dynamic Code Showcase */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-neon-cyan to-neon-purple rounded-xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
            <MiniCodeBlock
              filename="ci-pipeline.yml"
              code={`name: AI Production Deploy\non: [push]\njobs:\n  deploy:\n    runs-on: ubuntu-latest_v2\n    steps:\n      - uses: prometix/ai-deploy@v1\n        with:\n          cloud: multi-cloud\n          strategy: zero-downtime`}
            />
          </div>

          {/* Feature Highlights */}
          <div className="grid grid-cols-1 gap-6 pt-4">
            <div className="flex items-start space-x-4 group p-4 rounded-xl border border-white/5 bg-white/5 backdrop-blur-sm hover:border-neon-cyan/30 transition-all duration-300">
              <div className="w-10 h-10 rounded-lg bg-neon-cyan/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <Code className="w-5 h-5 text-neon-cyan" />
              </div>
              <div>
                <h3 className="text-white font-semibold">AI Code Generation</h3>
                <p className="text-sm text-gray-500">Generate Dockerfiles, CI/CD pipelines, and IaC in seconds.</p>
              </div>
            </div>

            <div className="flex items-start space-x-4 group p-4 rounded-xl border border-white/5 bg-white/5 backdrop-blur-sm hover:border-neon-purple/30 transition-all duration-300">
              <div className="w-10 h-10 rounded-lg bg-neon-purple/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <Zap className="w-5 h-5 text-neon-purple" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Multi-Cloud Orchestration</h3>
                <p className="text-sm text-gray-500">Deploy effortlessly to AWS, Azure, GCP, and Kubernetes.</p>
              </div>
            </div>

            <div className="flex items-start space-x-4 group p-4 rounded-xl border border-white/5 bg-white/5 backdrop-blur-sm hover:border-neon-cyan/30 transition-all duration-300">
              <div className="w-10 h-10 rounded-lg bg-neon-cyan/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <Shield className="w-5 h-5 text-neon-cyan" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Enterprise-Grade Security</h3>
                <p className="text-sm text-gray-500">Built-in vulnerability scanning and compliance management.</p>
              </div>
            </div>
          </div>

          {/* Created By Section */}
          <div className="pt-8 border-t border-gray-800/50">
            <p className="text-[10px] text-gray-500 font-mono uppercase tracking-[0.2em] mb-4">Developed & Maintained by</p>
            <div className="flex items-center justify-between bg-white/5 border border-white/5 p-4 rounded-2xl backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-neon-cyan to-neon-purple p-[1px]">
                  <div className="w-full h-full rounded-full bg-[#0A0D12] flex items-center justify-center">
                    <span className="text-white font-bold text-xs">MA</span>
                  </div>
                </div>
                <div>
                  <p className="text-white font-bold text-sm">Mayank Agrawal</p>
                  <p className="text-[10px] text-neon-cyan font-mono uppercase">Full Stack Engineer</p>
                </div>
              </div>
              <div className="flex gap-2">
                <a
                  href="https://github.com/Mxyank/Automation-Platform"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-xl bg-gray-900 border border-gray-800 flex items-center justify-center text-gray-400 hover:text-white hover:border-neon-cyan transition-all"
                >
                  <Github className="w-5 h-5" />
                </a>
                <a
                  href="https://www.linkedin.com/in/mayank-agrawal-bb04901b7/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-xl bg-gray-900 border border-gray-800 flex items-center justify-center text-gray-400 hover:text-white hover:border-blue-500 transition-all"
                >
                  <Linkedin className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel: Auth Forms */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-dark-bg relative overflow-y-auto">
        {/* Back to Home */}
        <a
          href="/"
          className="absolute top-4 left-4 z-20 flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors duration-200"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </a>
        <div className="w-full max-w-md space-y-8 relative z-10 py-12">
          {/* Mobile Header (Hidden on Desktop) */}
          <div className="md:hidden text-center mb-8">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-neon-cyan to-neon-purple rounded-xl flex items-center justify-center">
                <Rocket className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-bold text-white">Prometix</span>
            </div>
            <h2 className="text-2xl font-bold text-white">Welcome Back</h2>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-[#161B22] border border-gray-800 rounded-xl p-1 mb-8 shadow-inner">
              <TabsTrigger value="login" className="data-[state=active]:bg-white data-[state=active]:text-black rounded-lg transition-all duration-300 py-3 font-semibold">Sign In</TabsTrigger>
              <TabsTrigger value="register" className="data-[state=active]:bg-white data-[state=active]:text-black rounded-lg transition-all duration-300 py-3 font-semibold">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="mt-0">
              <Card className="bg-[#161B22]/40 border border-gray-800 backdrop-blur-md shadow-2xl rounded-2xl">
                <CardHeader className="pb-6">
                  <CardTitle className="text-white text-2xl font-bold flex items-center gap-3">
                    <CheckCircle className="w-6 h-6 text-neon-cyan" />
                    Account Login
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <button
                    type="button"
                    onClick={() => window.location.href = '/api/auth/google'}
                    className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white hover:bg-gray-100 text-gray-900 font-bold rounded-xl transition-all shadow-lg active:scale-95"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Continue with Google
                  </button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-800"></div></div>
                    <div className="relative flex justify-center text-xs uppercase tracking-widest font-bold"><span className="px-4 bg-[#161B22] text-gray-500">Secure Direct Access</span></div>
                  </div>

                  <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email" className="text-gray-400 font-semibold px-1">Institutional Email</Label>
                      <Input id="login-email" type="email" {...loginForm.register("email")} className="bg-[#0D1117]/80 border-gray-800 text-white h-12 rounded-xl focus:ring-2 focus:ring-neon-cyan/20 focus:border-neon-cyan transition-all" placeholder="name@company.com" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password" className="text-gray-400 font-semibold px-1">Secure Password</Label>
                      <Input id="login-password" type="password" {...loginForm.register("password")} className="bg-[#0D1117]/80 border-gray-800 text-white h-12 rounded-xl focus:ring-2 focus:ring-neon-cyan/20 focus:border-neon-cyan transition-all" placeholder="••••••••" />
                    </div>
                    <div className="flex justify-end">
                      <button type="button" onClick={() => setShowForgotPassword(true)} className="text-sm font-bold text-neon-cyan hover:text-neon-cyan/80 transition-colors">Forgot Credentials?</button>
                    </div>
                    <Button type="submit" disabled={loginMutation.isPending} className="w-full h-12 bg-white text-black font-extrabold rounded-xl hover:bg-gray-100 transition-all shadow-lg active:scale-[0.98]">
                      {loginMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Access System"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="register" className="mt-0">
              <Card className="bg-[#161B22]/40 border border-gray-800 backdrop-blur-md shadow-2xl rounded-2xl">
                <CardHeader className="pb-6">
                  <CardTitle className="text-white text-2xl font-bold flex items-center gap-3">
                    <Rocket className="w-6 h-6 text-neon-purple" />
                    {registrationStep === "form" ? "Provision Account" : "Identity Verification"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {registrationStep === "form" ? (
                    <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="register-username" className="text-gray-400 font-semibold px-1">Display Identity</Label>
                        <Input id="register-username" {...registerForm.register("username")} className="bg-[#0D1117]/80 border-gray-800 text-white h-11 rounded-xl focus:border-neon-purple transition-all" placeholder="Agent Name" />
                        {registerForm.formState.errors.username && <p className="text-red-400 text-xs font-bold px-1">{registerForm.formState.errors.username.message}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="register-email" className="text-gray-400 font-semibold px-1">Access Email</Label>
                        <Input id="register-email" type="email" {...registerForm.register("email")} className="bg-[#0D1117]/80 border-gray-800 text-white h-11 rounded-xl focus:border-neon-purple transition-all" placeholder="user@domain.com" />
                        {registerForm.formState.errors.email && <p className="text-red-400 text-xs font-bold px-1">{registerForm.formState.errors.email.message}</p>}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="register-password" className="text-gray-400 font-semibold px-1">Root Pass</Label>
                          <Input id="register-password" type="password" {...registerForm.register("password")} className="bg-[#0D1117]/80 border-gray-800 text-white h-11 rounded-xl focus:border-neon-purple transition-all" placeholder="••••••••" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="register-confirm-password" className="text-gray-400 font-semibold px-1">Repeat</Label>
                          <Input id="register-confirm-password" type="password" {...registerForm.register("confirmPassword")} className="bg-[#0D1117]/80 border-gray-800 text-white h-11 rounded-xl focus:border-neon-purple transition-all" placeholder="••••••••" />
                        </div>
                      </div>
                      {(registerForm.formState.errors.password || registerForm.formState.errors.confirmPassword) && (
                        <p className="text-red-400 text-xs font-bold px-1">
                          {registerForm.formState.errors.password?.message || registerForm.formState.errors.confirmPassword?.message}
                        </p>
                      )}

                      <div className="flex items-start space-x-3 pt-2 bg-[#0D1117]/40 p-3 rounded-lg border border-gray-800">
                        <Checkbox id="terms" checked={agreedToTerms} onCheckedChange={(checked) => setAgreedToTerms(!!checked)} className="mt-1 border-gray-600 data-[state=checked]:bg-neon-purple" />
                        <label htmlFor="terms" className="text-xs text-gray-500 leading-tight">
                          I agree to the <span className="text-gray-300 font-bold underline cursor-pointer">Protocol Encryption Standards</span> and <span className="text-gray-300 font-bold underline cursor-pointer">User Agreement</span>.
                        </label>
                      </div>

                      <Button type="submit" disabled={otpLoading || !agreedToTerms} className="w-full h-12 bg-white text-black font-extrabold rounded-xl hover:bg-gray-100 shadow-neon-purple/5 transition-all active:scale-[0.98]">
                        {otpLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Mail className="w-4 h-4 mr-2" /> Verify Account Link</>}
                      </Button>
                    </form>
                  ) : (
                    <div className="space-y-8 py-4">
                      <div className="text-center space-y-2">
                        <div className="mx-auto w-12 h-12 rounded-full bg-neon-cyan/10 flex items-center justify-center mb-4">
                          <Lock className="w-6 h-6 text-neon-cyan animate-bounce" />
                        </div>
                        <p className="text-gray-300 font-bold">Encrypted Token Sent</p>
                        <p className="text-xs text-gray-500">6-digit burst sequence transmitted to:<br /><span className="text-neon-cyan font-mono mt-1 inline-block">{pendingRegistration?.email}</span></p>
                      </div>
                      <div className="space-y-4">
                        <Input
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                          className="bg-[#0D1117] border-2 border-gray-800 text-white text-center h-16 text-3xl tracking-[0.4em] font-mono focus:border-neon-cyan transition-all rounded-xl"
                          placeholder="000000"
                        />
                        <Button onClick={onVerifyOTP} disabled={registerMutation.isPending || otpCode.length !== 6} className="w-full h-14 bg-neon-cyan text-black font-bold text-lg rounded-xl shadow-lg shadow-neon-cyan/20 active:scale-[0.98] transition-all">
                          Establish Connection
                        </Button>
                      </div>
                      <div className="flex justify-between items-center text-[10px] scroll-mt-2 font-bold uppercase tracking-tighter">
                        <button onClick={() => setRegistrationStep("form")} className="text-gray-500 hover:text-white flex items-center gap-1 transition-colors">
                          <ArrowLeft className="w-3 h-3" /> Reconfigure
                        </button>
                        <button onClick={resendOTP} disabled={otpCountdown > 0} className="text-neon-cyan hover:text-white transition-colors">
                          {otpCountdown > 0 ? `Retry in ${otpCountdown}S` : "Retransmit Burst"}
                        </button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <p className="text-center text-[10px] text-gray-600 font-mono tracking-widest uppercase">
            System uptime 99.99% • AES-256 Encrypted • Secure Shell Access
          </p>
        </div>
      </div>
    </div>
  );
}
