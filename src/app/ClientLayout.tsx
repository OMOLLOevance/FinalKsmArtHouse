'use client';

import React from 'react';
import Sidebar from '@/components/layout/Sidebar';
import AuthGuard from '@/components/auth/AuthGuard';
import { ToastProvider } from '@/components/ui/Toast';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as SonnerToaster } from 'sonner';
import { useRealtimeInvalidation } from '@/hooks/use-realtime-invalidation';

const ClientLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useRealtimeInvalidation();

  return (
    <ToastProvider>
      <AuthGuard>
        <div className="flex h-screen bg-background overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-y-auto bg-background print:bg-white custom-scrollbar">
            <div className="responsive-container py-20 md:py-8 lg:py-10 print:p-0">
              {children}
            </div>
          </main>
        </div>
        <Toaster />
        <SonnerToaster richColors closeButton position="top-right" />
      </AuthGuard>
    </ToastProvider>
  );
};

export default ClientLayout;