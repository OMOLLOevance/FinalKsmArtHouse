'use client';

import dynamic from 'next/dynamic';
import { useAuth } from '@/contexts/AuthContext';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

const GymManagement = dynamic(() => import('@/components/features/GymManagement'), {
  loading: () => <PageLoader text="Loading Gym Management..." />,
  ssr: false,
});

export default function GymPage() {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return <PageLoader text="Loading Gym Management..." />;
  }

  if (!isAuthenticated) {
    return <PageLoader text="Verifying access..." />;
  }

  return (
    <ErrorBoundary>
      <GymManagement />
    </ErrorBoundary>
  );
}