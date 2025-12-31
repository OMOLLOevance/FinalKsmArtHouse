'use client';

import { useAuth } from '@/contexts/AuthContext';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import ProfessionalDashboard from '@/components/features/ProfessionalDashboard';

export default function Home() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return <PageLoader text="Loading KSM.ART HOUSE..." />;
  }

  return <ProfessionalDashboard />;
}