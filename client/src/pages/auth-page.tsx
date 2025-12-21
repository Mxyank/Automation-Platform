import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema, type InsertUser } from "@shared/schema";
import { z } from "zod";
import { Loader2, Rocket, Zap, Shield, Code, ArrowLeft } from "lucide-react";

const loginSchema = insertUserSchema.pick({ email: true, password: true });
const registerSchema = insertUserSchema.extend({
  confirmPassword: z.string().min(6),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      setLocation("/dashboard");
    }
  }, [user, setLocation]);

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onLogin = (data: LoginFormData) => {
    loginMutation.mutate(data);
  };

  const onRegister = (data: RegisterFormData) => {
    const { confirmPassword, ...userData } = data;
    registerMutation.mutate(userData);
  };

  if (user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-dark-bg">
        <Loader2 className="h-8 w-8 animate-spin text-neon-cyan" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg flex">
      {/* Left Side - Authentication Forms */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          {/* Go Back Button */}
          <Button
            onClick={() => setLocation("/")}
            variant="ghost"
            className="text-gray-400 hover:text-white mb-4 -ml-2"
            data-testid="btn-go-back"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>

          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-neon-cyan to-neon-purple rounded-xl flex items-center justify-center">
                <Rocket className="w-6 h-6 text-white" />
              </div>
              <div className="flex flex-col items-start">
                <span className="text-2xl font-bold text-white">
                  CloudForge
                </span>
                <span className="text-xs text-gray-400 -mt-1">
                  AI DevOps Platform
                </span>
              </div>
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">
              Welcome to CloudForge
            </h2>
            <p className="text-gray-400">
              Sign in to your account or create a new one to start building
            </p>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-gray-900 border border-gray-800 rounded-lg p-1">
              <TabsTrigger 
                value="login" 
                className="data-[state=active]:bg-white data-[state=active]:text-black rounded-md transition-all duration-200"
              >
                Sign In
              </TabsTrigger>
              <TabsTrigger 
                value="register"
                className="data-[state=active]:bg-white data-[state=active]:text-black rounded-md transition-all duration-200"
              >
                Sign Up
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Card className="bg-gray-900/30 border border-gray-800 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-white text-xl">Sign in to your account</CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Google OAuth Button */}
                  <button
                    type="button"
                    onClick={() => window.location.href = '/api/auth/google'}
                    className="w-full mb-4 flex items-center justify-center gap-3 px-4 py-3 bg-white hover:bg-gray-100 text-gray-700 font-medium rounded-lg border border-gray-300 shadow-sm transition-all duration-200 hover:shadow-md group"
                    data-testid="btn-google-signin"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    <span>Continue with Google</span>
                  </button>
                  
                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-700"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-4 bg-gray-900/80 text-gray-400">or continue with email</span>
                    </div>
                  </div>

                  <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email" className="text-gray-300">Email</Label>
                      <Input
                        id="login-email"
                        type="email"
                        {...loginForm.register("email")}
                        className="bg-dark-bg border-gray-700 text-white focus:border-neon-cyan focus:ring-neon-cyan"
                        placeholder="Enter your email"
                      />
                      {loginForm.formState.errors.email && (
                        <p className="text-red-400 text-sm">{loginForm.formState.errors.email.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="login-password" className="text-gray-300">Password</Label>
                      <Input
                        id="login-password"
                        type="password"
                        {...loginForm.register("password")}
                        className="bg-dark-bg border-gray-700 text-white focus:border-neon-cyan focus:ring-neon-cyan"
                        placeholder="Enter your password"
                      />
                      {loginForm.formState.errors.password && (
                        <p className="text-red-400 text-sm">{loginForm.formState.errors.password.message}</p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      disabled={loginMutation.isPending}
                      className="w-full bg-white text-black font-medium hover:bg-gray-100 transition-all duration-200"
                    >
                      {loginMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Signing In...
                        </>
                      ) : (
                        "Sign In"
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="register">
              <Card className="bg-gray-900/30 border border-gray-800 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-white text-xl">Create your account</CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Google OAuth Button */}
                  <button
                    type="button"
                    onClick={() => window.location.href = '/api/auth/google'}
                    className="w-full mb-4 flex items-center justify-center gap-3 px-4 py-3 bg-white hover:bg-gray-100 text-gray-700 font-medium rounded-lg border border-gray-300 shadow-sm transition-all duration-200 hover:shadow-md group"
                    data-testid="btn-google-signup"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    <span>Sign up with Google</span>
                  </button>
                  
                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-700"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-4 bg-gray-900/80 text-gray-400">or sign up with email</span>
                    </div>
                  </div>

                  <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="register-username" className="text-gray-300">Username</Label>
                      <Input
                        id="register-username"
                        {...registerForm.register("username")}
                        className="bg-dark-bg border-gray-700 text-white focus:border-neon-cyan focus:ring-neon-cyan"
                        placeholder="Choose a username"
                      />
                      {registerForm.formState.errors.username && (
                        <p className="text-red-400 text-sm">{registerForm.formState.errors.username.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="register-email" className="text-gray-300">Email</Label>
                      <Input
                        id="register-email"
                        type="email"
                        {...registerForm.register("email")}
                        className="bg-dark-bg border-gray-700 text-white focus:border-neon-cyan focus:ring-neon-cyan"
                        placeholder="Enter your email"
                      />
                      {registerForm.formState.errors.email && (
                        <p className="text-red-400 text-sm">{registerForm.formState.errors.email.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="register-password" className="text-gray-300">Password</Label>
                      <Input
                        id="register-password"
                        type="password"
                        {...registerForm.register("password")}
                        className="bg-dark-bg border-gray-700 text-white focus:border-neon-cyan focus:ring-neon-cyan"
                        placeholder="Create a password"
                      />
                      {registerForm.formState.errors.password && (
                        <p className="text-red-400 text-sm">{registerForm.formState.errors.password.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="register-confirm" className="text-gray-300">Confirm Password</Label>
                      <Input
                        id="register-confirm"
                        type="password"
                        {...registerForm.register("confirmPassword")}
                        className="bg-dark-bg border-gray-700 text-white focus:border-neon-cyan focus:ring-neon-cyan"
                        placeholder="Confirm your password"
                      />
                      {registerForm.formState.errors.confirmPassword && (
                        <p className="text-red-400 text-sm">{registerForm.formState.errors.confirmPassword.message}</p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      disabled={registerMutation.isPending}
                      className="w-full bg-white text-black font-medium hover:bg-gray-100 transition-all duration-200"
                    >
                      {registerMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Creating Account...
                        </>
                      ) : (
                        "Create Account"
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="text-center">
            <p className="text-sm text-gray-400">
              By signing up, you agree to our{" "}
              <a href="#" className="text-neon-cyan hover:underline">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="#" className="text-neon-cyan hover:underline">
                Privacy Policy
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Hero Section */}
      <div className="hidden lg:flex lg:flex-1 bg-gradient-to-br from-dark-card to-dark-bg relative overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-10 w-2 h-2 bg-neon-cyan rounded-full animate-pulse"></div>
          <div className="absolute top-40 right-20 w-1 h-1 bg-neon-green rounded-full animate-pulse delay-1000"></div>
          <div className="absolute bottom-20 left-1/4 w-1.5 h-1.5 bg-neon-purple rounded-full animate-pulse delay-500"></div>
        </div>

        <div className="relative flex flex-col justify-center p-12 text-white">
          <div className="space-y-8">
            <h1 className="text-5xl font-bold leading-tight">
              Build backends and DevOps{" "}
              <span className="bg-gradient-to-r from-neon-cyan to-neon-purple bg-clip-text text-transparent">
                ship faster
              </span>
            </h1>
            <p className="text-xl text-gray-300 leading-relaxed max-w-lg">
              Join 10,000+ developers who trust CloudForge for rapid API development, Docker automation, and AI-powered DevOps assistance.
            </p>

            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-neon-cyan/20 rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-neon-cyan" />
                </div>
                <span>Auto-generate scalable CRUD APIs</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-neon-green/20 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-neon-green" />
                </div>
                <span>Built-in JWT authentication & security</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-neon-purple/20 rounded-lg flex items-center justify-center">
                  <Code className="w-5 h-5 text-neon-purple" />
                </div>
                <span>Docker & CI/CD automation tools</span>
              </div>
            </div>

            <div className="bg-dark-card/50 rounded-xl p-6 border border-gray-800">
              <div className="font-mono text-sm space-y-2">
                <div className="text-gray-500">// Start building in seconds</div>
                <div><span className="text-neon-purple">const</span> <span className="text-blue-400">api</span> = <span className="text-neon-cyan">generateCRUD</span>({'{'}</div>
                <div className="ml-4"><span className="text-orange-400">database:</span> <span className="text-green-400">'postgresql'</span>,</div>
                <div className="ml-4"><span className="text-orange-400">auth:</span> <span className="text-green-400">'jwt'</span>,</div>
                <div className="ml-4"><span className="text-orange-400">swagger:</span> <span className="text-blue-400">true</span></div>
                <div>{'}'});</div>
                <div className="text-gray-500">// ✨ Ready to deploy!</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
