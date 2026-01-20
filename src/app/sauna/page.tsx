'use client';

import dynamic from 'next/dynamic';
import { useAuth } from '@/contexts/AuthContext';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

const SaunaManagement = dynamic(() => import('@/components/features/SaunaManagement'), {
  loading: () => <PageLoader text="Loading Sauna & Spa..." />,
  ssr: false,
});

export default function SaunaPage() {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return <PageLoader text="Loading Sauna & Spa..." />;
  }

  if (!isAuthenticated) {
    return <PageLoader text="Verifying access..." />;
  }

  return (
    <ErrorBoundary>
      <SaunaManagement />
    </ErrorBoundary>
  );
}