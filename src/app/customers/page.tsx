'use client';

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

const AdvancedCustomerManagement = dynamic(() => import('@/components/features/AdvancedCustomerManagement'), {
  loading: () => <PageLoader text="Loading Advanced Customer Management..." />,
  ssr: false,
});

export default function CustomersPage() {
  const router = useRouter();
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return <PageLoader text="Loading Customer Management..." />;
  }

  if (!isAuthenticated) {
    return <PageLoader text="Verifying access..." />;
  }
  
  return (
    <ErrorBoundary>
      <AdvancedCustomerManagement onBack={() => router.push('/')} />
    </ErrorBoundary>
  );
}