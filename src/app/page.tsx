'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import InvestorDashboard from '@/components/features/InvestorDashboard';

export default function Home() {
  const { isLoading, isAuthenticated, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      // Directors, investors, and admins see the dashboard
      if (user?.role === 'director' || user?.role === 'investor' || user?.role === 'admin') {
        return; // Stay on dashboard
      }
      // All other roles redirect to events
      router.push('/events');
    }
  }, [isLoading, isAuthenticated, user, router]);

  if (isLoading) {
    return <PageLoader text="Loading KSM.ART HOUSE..." />;
  }

  if (!isAuthenticated) {
    return <PageLoader text="Verifying access..." />;
  }

  // Only directors, investors, and admins see the dashboard
  if (user?.role === 'director' || user?.role === 'investor' || user?.role === 'admin') {
    return (
      <ErrorBoundary>
        <InvestorDashboard />
      </ErrorBoundary>
    );
  }

  return <PageLoader text="Redirecting..." />;
}
