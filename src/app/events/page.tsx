'use client';

import dynamic from 'next/dynamic';
import { useAuth } from '@/contexts/AuthContext';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

const EventManagement = dynamic(() => import('@/components/features/events/EventManagement'), {
  loading: () => <PageLoader text="Loading Event Management..." />,
  ssr: false,
});

export default function EventsPage() {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return <PageLoader text="Loading Event Management..." />;
  }

  if (!isAuthenticated) {
    return <PageLoader text="Verifying access..." />;
  }

  return (
    <ErrorBoundary>
      <EventManagement />
    </ErrorBoundary>
  );
}