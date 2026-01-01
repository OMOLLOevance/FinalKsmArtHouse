'use client';

import dynamic from 'next/dynamic';
import { PageLoader } from '@/components/ui/LoadingSpinner';

const CustomerManager = dynamic(() => import('@/components/features/events/CustomerManager'), {
  loading: () => <PageLoader text="Loading Customers..." />,
  ssr: false,
});

export default function CustomersPage() {
  return <CustomerManager />;
}