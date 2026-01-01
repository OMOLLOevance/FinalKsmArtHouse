'use client';

import dynamic from 'next/dynamic';
import { useAuth } from '@/contexts/AuthContext';
import { PageLoader } from '@/components/ui/LoadingSpinner';

const Dashboard = dynamic(() => import('@/components/features/Dashboard'), {
  loading: () => <PageLoader text="Loading Dashboard..." />,
  ssr: false, 
});

export default function Home() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return <PageLoader text="Loading KSM.ART HOUSE..." />;
  }

  return <Dashboard />;
}
