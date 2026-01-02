'use client';

import dynamic from 'next/dynamic';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

const GymManagement = dynamic(() => import('@/components/features/GymManagement'), {
  loading: () => <PageLoader text="Loading Gym Management..." />,
  ssr: false,
});

export default function GymPage() {
  return (
    <ErrorBoundary>
      <GymManagement />
    </ErrorBoundary>
  );
}