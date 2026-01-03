'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { logger } from '@/lib/logger';
import { toast } from 'sonner';

const RESTRICTED_ROUTES: Record<string, string[]> = {
  '/customers': ['admin', 'director', 'manager'],
};

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated && pathname !== '/login') {
        logger.info(`Unauthorized access attempt to ${pathname}, redirecting to /login`);
        router.push('/login');
      } 
      else if (isAuthenticated) {
        if (pathname === '/login') {
          logger.info('Authenticated user on login page, redirecting to dashboard');
          router.push('/');
        } else {
          // Check role-based clearance
          const allowedRoles = RESTRICTED_ROUTES[pathname];
          if (allowedRoles && user && !allowedRoles.includes(user.role)) {
            toast.error('Access Restricted: Insufficient professional clearance for this module.');
            router.push('/');
          }
        }
      }
    }
  }, [isAuthenticated, isLoading, pathname, router, user]);


  // Show professional PageLoader while auth status is being determined
  if (isLoading) {
    return <PageLoader text="Verifying Credentials..." />;
  }

  // If on login page, render children (login form)
  // If authenticated and not on login page, render children (protected content)
  if (pathname === '/login' || isAuthenticated) {
    return <>{children}</>;
  }

  // Fallback, should ideally be covered by redirects or loading state
  return null;
}