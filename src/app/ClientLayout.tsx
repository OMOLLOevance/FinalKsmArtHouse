'use client';

import React from 'react';
import Sidebar from '@/components/layout/Sidebar';
import AuthGuard from '@/components/auth/AuthGuard';
import { ToastProvider } from '@/components/ui/Toast';
import { Toaster } from '@/components/ui/toaster';

const ClientLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ToastProvider>
      <AuthGuard>
        <Sidebar />
        {children}
        <Toaster />
      </AuthGuard>
    </ToastProvider>
  );
};

export default ClientLayout;