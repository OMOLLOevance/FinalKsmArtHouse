'use client';

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { PageLoader } from '@/components/ui/LoadingSpinner';

const AdvancedCustomerManagement = dynamic(() => import('@/components/features/AdvancedCustomerManagement'), {
  loading: () => <PageLoader text="Loading Advanced Customer Management..." />,
  ssr: false,
});

export default function CustomersPage() {
  const router = useRouter();
  
  return <AdvancedCustomerManagement onBack={() => router.push('/')} />;
}