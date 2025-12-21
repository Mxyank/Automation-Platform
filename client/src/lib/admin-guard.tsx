import { useAuth } from '@/hooks/use-auth';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Lock } from 'lucide-react';
import { ReactNode } from 'react';

// Admin email addresses - must match server-side configuration
const ADMIN_EMAILS = [
  'agrawalmayank200228@gmail.com'
];

interface AdminGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function AdminGuard({ children, fallback }: AdminGuardProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-neon-cyan border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-white">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-6">
        <Alert className="border-red-500 bg-red-500/10 max-w-md">
          <Lock className="h-4 w-4 text-red-500" />
          <AlertDescription className="text-red-400">
            <strong>Authentication Required</strong><br />
            Please log in to access this administrative area.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!user.email || !ADMIN_EMAILS.includes(user.email)) {
    return fallback || (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-6">
        <Alert className="border-orange-500 bg-orange-500/10 max-w-md">
          <Shield className="h-4 w-4 text-orange-500" />
          <AlertDescription className="text-orange-400">
            <strong>Access Denied</strong><br />
            Administrative privileges required to access this area. This incident has been logged.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return <>{children}</>;
}

export function isUserAdmin(userEmail: string | undefined | null): boolean {
  return userEmail ? ADMIN_EMAILS.includes(userEmail) : false;
}

export { ADMIN_EMAILS };