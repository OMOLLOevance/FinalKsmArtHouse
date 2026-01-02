'use client';

import dynamic from 'next/dynamic';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

const RestaurantManagement = dynamic(() => import('@/components/features/RestaurantManagement'), {
  loading: () => <PageLoader text="Loading Restaurant..." />,
  ssr: false,
});

export default function RestaurantPage() {
  return (
    <ErrorBoundary>
      <RestaurantManagement />
    </ErrorBoundary>
  );
}