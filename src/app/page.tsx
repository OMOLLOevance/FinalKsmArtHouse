'use client';

import dynamic from 'next/dynamic';
import { useAuth } from '@/contexts/AuthContext';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

const Dashboard = dynamic(() => import('@/components/features/Dashboard'), {
  loading: () => <PageLoader text="Loading Dashboard..." />,
  ssr: false, 
});

export default function Home() {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return <PageLoader text="Loading KSM.ART HOUSE..." />;
  }

  if (!isAuthenticated) {
    return <PageLoader text="Verifying access..." />;
  }

  return (
    <ErrorBoundary>
      <Dashboard />
    </ErrorBoundary>
  );
}
