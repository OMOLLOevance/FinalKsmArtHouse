'use client';

import dynamic from 'next/dynamic';
import { useAuth } from '@/contexts/AuthContext';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

const EventManagement = dynamic(() => import('@/components/features/events/EventManagement'), {
  loading: () => <PageLoader />,
  ssr: false,
});

export default function EventsPage() {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    return <PageLoader />;
  }

  return (
    <ErrorBoundary>
      <EventManagement />
    </ErrorBoundary>
  );
}