'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { logger } from '@/lib/logger';

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
      else if (isAuthenticated && pathname === '/login') {
        logger.info('Authenticated user on login page, redirecting to dashboard');
        router.push('/');
      }
    }
  }, [isAuthenticated, isLoading, pathname, router]);


  // Show loading spinner while auth status is being determined
  if (isLoading) {
    return (
        <div className="flex items-center justify-center min-h-screen">
            <LoadingSpinner />
        </div>
    );
  }

  // If on login page, render children (login form)
  // If authenticated and not on login page, render children (protected content)
  if (pathname === '/login' || isAuthenticated) {
    return <>{children}</>;
  }

  // Fallback, should ideally be covered by redirects or loading state
  return null;
}