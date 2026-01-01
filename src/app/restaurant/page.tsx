'use client';

import dynamic from 'next/dynamic';
import { PageLoader } from '@/components/ui/LoadingSpinner';

const RestaurantManagement = dynamic(() => import('@/components/features/RestaurantManagement'), {
  loading: () => <PageLoader text="Loading Restaurant..." />,
  ssr: false,
});

export default function RestaurantPage() {
  return <RestaurantManagement />;
}