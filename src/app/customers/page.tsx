'use client';

import dynamic from 'next/dynamic';
import { PageLoader } from '@/components/ui/LoadingSpinner';

const CustomerManagement = dynamic(() => import('@/components/features/CustomerManagement'), {
  loading: () => <PageLoader text="Loading Customer Management..." />,
  ssr: false,
});

export default function CustomersPage() {
  return <CustomerManagement />;
}