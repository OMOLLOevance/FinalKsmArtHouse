'use client';

import DecorSystemTest from '@/components/features/DecorSystemTest';
import IntegrationTest from '@/components/features/IntegrationTest';

export default function TestPage() {
  return (
    <div className="min-h-screen bg-background space-y-8">
      <IntegrationTest />
      <DecorSystemTest />
    </div>
  );
}