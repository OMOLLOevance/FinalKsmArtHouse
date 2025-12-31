'use client';

import LoginForm from '@/components/features/auth/LoginForm';
import { Sparkles } from 'lucide-react';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-brand-background relative overflow-hidden px-4">
      {/* Abstract Background Accents */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-secondary/5 rounded-full blur-[120px]" />
      </div>

      <div className="mb-6 sm:mb-8 text-center animate-in fade-in zoom-in duration-700">
        <div className="mx-auto w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-r from-brand-primary to-brand-secondary rounded-2xl flex items-center justify-center shadow-2xl shadow-brand-primary/20 mb-4 rotate-3 hover:rotate-0 transition-transform duration-500">
          <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-brand-text mb-2">
          KSM.ART HOUSE
        </h1>
        <p className="text-brand-muted font-medium text-sm sm:text-base">Enterprise Management Suite</p>
      </div>

      <div className="w-full max-w-md">
        <LoginForm />
      </div>

      <p className="mt-6 sm:mt-8 text-xs sm:text-sm text-brand-muted text-center">
        &copy; {new Date().getFullYear()} KSM.ART HOUSE. All rights reserved.
      </p>
    </div>
  );
}