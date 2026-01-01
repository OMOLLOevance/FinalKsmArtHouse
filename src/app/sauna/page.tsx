'use client';

import dynamic from 'next/dynamic';
import { PageLoader } from '@/components/ui/LoadingSpinner';

const SaunaManagement = dynamic(() => import('@/components/features/SaunaManagement'), {
  loading: () => <PageLoader text="Loading Sauna & Spa..." />,
  ssr: false,
});

export default function SaunaPage() {
  return <SaunaManagement />;
}