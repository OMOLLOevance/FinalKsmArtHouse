'use client';

import dynamic from 'next/dynamic';
import { useAuth } from '@/contexts/AuthContext';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

const RestaurantManagement = dynamic(() => import('@/components/features/RestaurantManagement'), {
  loading: () => <PageLoader text="Loading Restaurant..." />,
  ssr: false,
});

export default function RestaurantPage() {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return <PageLoader text="Loading Restaurant..." />;
  }

  if (!isAuthenticated) {
    return <PageLoader text="Verifying access..." />;
  }

  return (
    <ErrorBoundary>
      <RestaurantManagement />
    </ErrorBoundary>
  );
}