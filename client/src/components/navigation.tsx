import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/search-bar";
import { SwitchUserModal } from "@/components/switch-user-modal";
import { Rocket, Menu, X, ChevronDown, Briefcase, UserCog } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const PRIMARY_ADMIN_EMAIL = "agrawalmayank200228@gmail.com";

export function Navigation() {
  const { user, logoutMutation } = useAuth();
  const [, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [switchUserOpen, setSwitchUserOpen] = useState(false);
  
  const canImpersonate = user && (
    user.email === PRIMARY_ADMIN_EMAIL || 
    (user as any).canImpersonate
  );

  const handleAuthAction = () => {
    if (user) {
      setLocation("/dashboard");
    } else {
      setLocation("/auth");
    }
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <nav className="fixed top-0 w-full bg-dark-bg/80 backdrop-blur-md border-b border-dark-border z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-neon-cyan to-neon-purple rounded-xl flex items-center justify-center">
              <Rocket className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-white">
                CloudForge
              </span>
              <span className="text-xs text-gray-400 -mt-1">
                AI DevOps Platform
              </span>
            </div>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link href="/features" className="text-gray-300 hover:text-neon-cyan transition-colors duration-200">
              Features
            </Link>
            <Link href="/pricing" className="text-gray-300 hover:text-neon-cyan transition-colors duration-200">
              Pricing
            </Link>
            <Link href="/jobs" className="flex items-center gap-1 text-gray-300 hover:text-neon-cyan transition-colors duration-200" data-testid="link-jobs">
              <Briefcase className="w-4 h-4" />
              Jobs
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1 text-gray-300 hover:text-neon-cyan transition-colors duration-200">
                Resources <ChevronDown className="w-4 h-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-dark-card border-dark-border">
                <DropdownMenuItem asChild>
                  <Link href="/docs" className="cursor-pointer text-gray-300 hover:text-neon-cyan">
                    Documentation
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/blog" className="cursor-pointer text-gray-300 hover:text-neon-cyan">
                    Blog
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/case-studies" className="cursor-pointer text-gray-300 hover:text-neon-cyan">
                    Case Studies
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/community" className="cursor-pointer text-gray-300 hover:text-neon-cyan">
                    Community
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/about" className="cursor-pointer text-gray-300 hover:text-neon-cyan">
                    About Us
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Link href="/ai-assistant" className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 font-medium flex items-center gap-2">
              AI for Cloud
            </Link>
          </div>
          
          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            {user ? (
              <>
                <div className="bg-dark-card border border-dark-border rounded-lg px-3 py-1.5 flex items-center space-x-2">
                  <div className="w-7 h-7 bg-gradient-to-r from-neon-cyan to-neon-purple rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-medium">
                      {user.username?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-white text-xs font-medium">
                      {user.username}
                    </span>
                    <div className="flex items-center space-x-1 text-xs text-gray-400">
                      <span className="text-neon-cyan font-medium">{user.credits || 0}</span>
                      <span>credits</span>
                    </div>
                  </div>
                </div>
                <Button
                  onClick={() => setLocation("/dashboard")}
                  variant="ghost"
                  className="text-gray-300 hover:text-white transition-colors duration-200"
                >
                  Dashboard
                </Button>
                {((user as any).isAdmin || user.email === "agrawalmayank200228@gmail.com") && (
                  <Button
                    onClick={() => setLocation("/admin")}
                    variant="ghost"
                    className="text-red-400 hover:text-red-300 transition-colors duration-200"
                    data-testid="button-admin"
                  >
                    Admin
                  </Button>
                )}
                {canImpersonate && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={() => setSwitchUserOpen(true)}
                        variant="ghost"
                        size="icon"
                        className="text-orange-400 hover:text-orange-300 transition-colors duration-200"
                        data-testid="button-switch-user"
                      >
                        <UserCog className="w-5 h-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Switch User (Impersonate)</p>
                    </TooltipContent>
                  </Tooltip>
                )}
                <Button
                  onClick={handleLogout}
                  variant="ghost"
                  className="text-gray-300 hover:text-white transition-colors duration-200"
                >
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={() => setLocation("/auth")}
                  variant="ghost"
                  className="text-gray-300 hover:text-white transition-colors duration-200"
                >
                  Sign In
                </Button>
                <Button
                  onClick={handleAuthAction}
                  className="bg-white text-black hover:bg-gray-100 px-4 py-2 rounded-lg font-medium transition-all duration-200"
                >
                  Get Started
                </Button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              variant="ghost"
              size="sm"
              className="text-gray-300"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-dark-border">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <Link 
                href="/features" 
                className="block px-3 py-2 text-gray-300 hover:text-neon-cyan transition-colors duration-200"
                onClick={() => setMobileMenuOpen(false)}
              >
                Features
              </Link>
              <Link 
                href="/pricing" 
                className="block px-3 py-2 text-gray-300 hover:text-neon-cyan transition-colors duration-200"
                onClick={() => setMobileMenuOpen(false)}
              >
                Pricing
              </Link>
              <Link 
                href="/jobs" 
                className="flex items-center gap-2 px-3 py-2 text-gray-300 hover:text-neon-cyan transition-colors duration-200"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Briefcase className="w-4 h-4" />
                Jobs & Interview
              </Link>
              <Link 
                href="/docs" 
                className="block px-3 py-2 text-gray-300 hover:text-neon-cyan transition-colors duration-200"
                onClick={() => setMobileMenuOpen(false)}
              >
                Docs
              </Link>
              <Link 
                href="/blog" 
                className="block px-3 py-2 text-gray-300 hover:text-neon-cyan transition-colors duration-200"
                onClick={() => setMobileMenuOpen(false)}
              >
                Blog
              </Link>
              <Link 
                href="/case-studies" 
                className="block px-3 py-2 text-gray-300 hover:text-neon-cyan transition-colors duration-200"
                onClick={() => setMobileMenuOpen(false)}
              >
                Case Studies
              </Link>
              <Link 
                href="/community" 
                className="block px-3 py-2 text-gray-300 hover:text-neon-cyan transition-colors duration-200"
                onClick={() => setMobileMenuOpen(false)}
              >
                Community
              </Link>
              <Link 
                href="/about" 
                className="block px-3 py-2 text-gray-300 hover:text-neon-cyan transition-colors duration-200"
                onClick={() => setMobileMenuOpen(false)}
              >
                About Us
              </Link>
              <Link 
                href="/ai-assistant" 
                className="block mx-2 px-3 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium transition-all duration-200"
                onClick={() => setMobileMenuOpen(false)}
              >
                AI for Cloud
              </Link>
              
              {user ? (
                <div className="border-t border-dark-border pt-4 mt-4">
                  <div className="mx-2 bg-dark-card border border-dark-border rounded-lg p-3 mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-neon-cyan to-neon-purple rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-medium">
                          {user.username?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="text-white text-sm font-medium">
                          Welcome, {user.username}
                        </div>
                        <div className="flex items-center space-x-1 text-xs text-gray-400">
                          <span className="text-neon-cyan font-medium">{user.credits || 0}</span>
                          <span>credits</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={() => {
                      setLocation("/dashboard");
                      setMobileMenuOpen(false);
                    }}
                    variant="ghost"
                    className="w-full justify-start text-gray-300 hover:text-white"
                  >
                    Dashboard
                  </Button>
                  <Button
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    variant="ghost"
                    className="w-full justify-start text-gray-300 hover:text-white"
                  >
                    Sign Out
                  </Button>
                </div>
              ) : (
                <div className="border-t border-dark-border pt-4 mt-4 space-y-2">
                  <Button
                    onClick={() => {
                      setLocation("/auth");
                      setMobileMenuOpen(false);
                    }}
                    variant="ghost"
                    className="w-full justify-start text-gray-300 hover:text-white"
                  >
                    Sign In
                  </Button>
                  <Button
                    onClick={() => {
                      handleAuthAction();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full bg-white text-black font-medium hover:bg-gray-100 transition-all duration-200"
                  >
                    Get Started
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      <SwitchUserModal open={switchUserOpen} onOpenChange={setSwitchUserOpen} />
    </nav>
  );
}
