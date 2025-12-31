'use client';

import LoginForm from '@/components/features/auth/LoginForm';
import { Sparkles } from 'lucide-react';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background relative overflow-hidden px-4">
      {/* Abstract Background Accents */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
      </div>

      <div className="mb-8 text-center animate-in fade-in zoom-in duration-700">
        <div className="mx-auto w-16 h-16 bg-gradient-to-r from-primary to-amber-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-primary/20 mb-4 rotate-3 hover:rotate-0 transition-transform duration-500">
          <Sparkles className="w-10 h-10 text-primary-foreground" />
        </div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-amber-200 bg-clip-text text-transparent mb-2">
          KSM.ART HOUSE
        </h1>
        <p className="text-muted-foreground font-medium">Enterprise Management Suite</p>
      </div>

      <div className="w-full max-w-md">
        <LoginForm />
      </div>

      <p className="mt-8 text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} KSM.ART HOUSE. All rights reserved.
      </p>
    </div>
  );
}