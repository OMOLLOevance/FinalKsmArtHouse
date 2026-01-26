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
    // TEMPORARILY DISABLED FOR DEBUGGING AUTH REFRESH LOOP
    // if (!isLoading) {
    //   if (!isAuthenticated && pathname !== '/login') {
    //     logger.info(`Unauthorized access attempt to ${pathname}, redirecting to /login`);
    //     router.replace('/login'); // Use replace instead of push to avoid back button issues
    //   }
    //   else if (isAuthenticated && pathname === '/login') {
    //     logger.info('Authenticated user on login page, redirecting to dashboard');
    //     router.replace('/'); // Use replace instead of push
    //   } else if (isAuthenticated) {
    //     // Check role-based clearance only for authenticated users
    //     const allowedRoles = RESTRICTED_ROUTES[pathname];
    //     if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    //       toast.error('Access Restricted: Insufficient professional clearance for this module.');
    //       router.replace('/'); // Use replace instead of push
    //     }
    //   }
    // }
  }, [isAuthenticated, isLoading, pathname, router, user]);

  // Show loading while auth status is being determined
  if (isLoading) {
    return <PageLoader text="Verifying Credentials..." />;
  }

  // TEMPORARILY DISABLED: Always render children for debugging purposes
  // if (!isAuthenticated && pathname !== '/login') {
  //   return <PageLoader text="Redirecting to login..." />;
  // }
  
  // If authenticated or on login page, render children
  return (
    <>
      {/* For debugging: show status directly */}
      {!isAuthenticated && pathname !== '/login' && (
        <div style={{ padding: '20px', backgroundColor: 'red', color: 'white' }}>
          DEBUG: Unauthorized (AuthGuard redirection disabled). Please log in.
        </div>
      )}
      {children}
    </>
  );
}