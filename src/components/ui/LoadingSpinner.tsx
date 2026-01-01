'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';

interface LoadingSpinnerProps {
  text?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Standardized Professional Loader for KSM.ART HOUSE
 * Features the Logo with cool professional gradients and a smooth indeterminate progress animation
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ text, className, size }) => {
  const sizeMap = {
    sm: 'scale-75',
    md: 'scale-100',
    lg: 'scale-125'
  };

  return (
    <div className={`flex flex-col items-center justify-center p-8 space-y-6 ${size ? sizeMap[size] : ''} ${className}`}>
      {/* Branded Logo Container - Using Cool Colors (Blue/Indigo/Teal) */}
      <div className="relative group">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-600 via-indigo-600 to-teal-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-indigo-500/30 transform transition-transform group-hover:scale-105 duration-500">
          <Sparkles className="w-10 h-10 text-white animate-pulse" />
        </div>
        {/* Cool Glow effect */}
        <div className="absolute -inset-3 bg-indigo-500/20 rounded-[2rem] blur-xl animate-pulse" />
        {/* Orbiting ring */}
        <div className="absolute -inset-1 border-2 border-primary/10 rounded-[1.75rem] animate-spin-slow" />
      </div>

      <div className="w-64 space-y-5 text-center">
        {/* Branded Abbreviation with cool luxury gradient */}
        <div className="text-2xl font-serif font-black tracking-tighter text-logo">
          KSM.ART HOUSE
        </div>

        {/* Indeterminate Progress Bar - Cool Indigo/Teal */}
        <div className="space-y-2">
          <div className="h-1 w-full bg-muted rounded-full overflow-hidden relative shadow-inner">
            <div className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-blue-600 via-indigo-500 to-teal-400 w-1/4 rounded-full animate-progress-slide shadow-[0_0_8px_rgba(79,70,229,0.5)]" />
          </div>
          
          {text && text !== "KSM.ART HOUSE" && (
            <p className="text-[10px] text-muted-foreground font-bold tracking-[0.3em] uppercase opacity-60 animate-pulse">
              {text}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export const PageLoader: React.FC<{ text?: string }> = ({ text = "KSM.ART HOUSE" }) => (
  <div className="min-h-screen flex items-center justify-center bg-background animated-bg overflow-hidden">
    <div className="relative">
      <LoadingSpinner text={text} className="scale-110" />
      {/* Decorative background elements */}
      <div className="absolute -top-20 -left-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl animate-pulse" />
      <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-secondary/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
    </div>
  </div>
);