'use client';

import dynamic from 'next/dynamic';
import { PageLoader } from '@/components/ui/LoadingSpinner';

const EventManagement = dynamic(() => import('@/components/features/events/EventManagement'), {
  loading: () => <PageLoader text="Loading Event Management..." />,
  ssr: false,
});

export default function EventsPage() {
  return <EventManagement />;
}