'use client';

import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { useAuth } from '@/contexts/AuthContext';
import { ChangePasswordForm } from './ChangePasswordForm';

const ForceChangePasswordDialog: React.FC = () => {
  const { user, forcePasswordChange } = useAuth();

  if (!forcePasswordChange || !user) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-md flex items-center justify-center z-[100] p-4">
      <Card className="w-full max-w-md border-primary/20 shadow-2xl glass-card glow-primary animate-in zoom-in-95 duration-300">
        <div className="h-1.5 w-full bg-gradient-to-r from-primary via-indigo-600 to-teal-500 rounded-t-xl" />
        
        <CardHeader className="text-center pt-8">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
            <ShieldCheck className="w-6 h-6 text-primary animate-pulse" />
          </div>
          <CardTitle className="text-xl font-bold uppercase tracking-tight">Security Update Required</CardTitle>
          <CardDescription className="text-xs font-medium uppercase tracking-widest opacity-70">
            For your protection, you must update your temporary passphrase.
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-4">
          <ChangePasswordForm showTitle={false} />
        </CardContent>

        <CardFooter className="pb-8 flex flex-col gap-4">
          <p className="text-[9px] uppercase font-bold tracking-[0.3em] text-muted-foreground opacity-40 text-center">
            Secured Enterprise Protocol
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ForceChangePasswordDialog;
