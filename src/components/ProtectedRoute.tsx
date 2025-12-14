import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/lib/types';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  console.log('🛡️ ProtectedRoute check:', {
    path: location.pathname,
    isLoading,
    isAuthenticated,
    userRole: user?.role,
    allowedRoles
  });

  // CRITICAL: Show loading state while checking authentication
  // This prevents premature redirects during auth state initialization
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Not authenticated - redirect to login with return URL
  if (!isAuthenticated || !user) {
    console.log('❌ Not authenticated, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Authenticated but not authorized - show access denied
  if (!allowedRoles.includes(user.role)) {
    console.log('❌ Not authorized, role:', user.role, 'allowed:', allowedRoles);
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <AlertTriangle className="h-16 w-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
        <p className="text-muted-foreground mb-6 text-center">
          You don't have permission to access this page.
        </p>
        <p className="text-sm text-muted-foreground">
          Your role: <span className="font-semibold capitalize">{user.role.replace('_', ' ')}</span>
        </p>
        <Button
          onClick={() => window.history.back()}
          className="mt-6"
        >
          Go Back
        </Button>
      </div>
    );
  }

  // Authorized - render children
  console.log('✅ Authorized, rendering:', location.pathname);
  return <>{children}</>;
}