'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { logger } from '@/lib/logger';
import { toast } from 'sonner';

const RESTRICTED_ROUTES: Record<string, string[]> = {
  '/customers': ['director', 'investor', 'operations_manager'],
};

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Only redirect after loading is complete and we have definitive auth status
    if (!isLoading) {
      const isPublicRoute = pathname === '/login' || pathname === '/signup';
      
      if (!isAuthenticated && !isPublicRoute) {
        logger.info(`Unauthorized access attempt to ${pathname}, redirecting to /login`);
        router.replace('/login'); // Use replace instead of push to avoid back button issues
      } 
      else if (isAuthenticated && isPublicRoute) {
        logger.info('Authenticated user on public page, redirecting to dashboard');
        router.replace('/'); // Use replace instead of push
      } else if (isAuthenticated) {
        // Check role-based clearance only for authenticated users
        const allowedRoles = RESTRICTED_ROUTES[pathname];
        if (allowedRoles && user && !allowedRoles.includes(user.role)) {
          toast.error('Access Restricted: Insufficient professional clearance for this module.');
          router.replace('/'); // Use replace instead of push
        }
      }
    }
  }, [isAuthenticated, isLoading, pathname, router, user]);

  // Show loading while auth status is being determined
  if (isLoading) {
    return <PageLoader text="Verifying Credentials..." />;
  }

  // If not authenticated and not on a public page, don't render anything (redirect will happen)
  const isPublicRoute = pathname === '/login' || pathname === '/signup';
  if (!isAuthenticated && !isPublicRoute) {
    return <PageLoader text="Redirecting to login..." />;
  }

  // If authenticated or on login page, render children
  return <>{children}</>;
}