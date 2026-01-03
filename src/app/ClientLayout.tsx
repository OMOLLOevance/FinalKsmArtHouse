'use client';

import React from 'react';
import Sidebar from '@/components/layout/Sidebar';
import AuthGuard from '@/components/auth/AuthGuard';
import { ToastProvider } from '@/components/ui/Toast';
import { Toaster } from '@/components/ui/toaster';
import { useRealtimeInvalidation } from '@/hooks/use-realtime-invalidation';

const ClientLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useRealtimeInvalidation();

  return (
    <ToastProvider>
      <AuthGuard>
        <div className="flex h-screen bg-background">
          <Sidebar />
          <div className="flex-1 overflow-hidden print:overflow-visible">
            <div className="h-full overflow-y-auto bg-background print:bg-white">
              <div className="p-4 sm:p-6 pt-16 md:pt-6 print:p-0 print:pt-0">
                {children}
              </div>
            </div>
          </div>
        </div>
        <Toaster />
      </AuthGuard>
    </ToastProvider>
  );
};

export default ClientLayout;