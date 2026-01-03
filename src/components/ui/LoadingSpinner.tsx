'use client';

import React from 'react';
import { Sparkles, Loader2, Activity } from 'lucide-react';
import { Card, CardContent } from './Card';

interface LoadingSpinnerProps {
  text?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Premium Suite Standardized Loader
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ text, className, size }) => {
  const sizeMap = {
    sm: 'scale-[0.6]',
    md: 'scale-90',
    lg: 'scale-110'
  };

  return (
    <div className={`flex flex-col items-center justify-center p-12 space-y-8 ${size ? sizeMap[size] : ''} ${className}`}>
      {/* 3D-Like Animated Logo Container */}
      <div className="relative group">
        <div className="w-24 h-24 bg-gradient-to-br from-primary via-indigo-600 to-teal-500 rounded-[2rem] flex items-center justify-center shadow-[0_20px_50px_-12px_rgba(37,99,235,0.4)] transition-all duration-700 hover:rotate-[360deg] hover:scale-110">
          <Sparkles className="w-12 h-12 text-white animate-pulse" />
        </div>
        
        {/* Layered Glowing Atmosphere */}
        <div className="absolute -inset-4 bg-primary/20 rounded-[2.5rem] blur-2xl animate-pulse" />
        <div className="absolute -inset-8 bg-secondary/10 rounded-[3rem] blur-3xl animate-pulse delay-700" />
        
        {/* Dynamic Orbital Rings */}
        <div className="absolute -inset-2 border-2 border-primary/20 rounded-[2.2rem] animate-[spin_3s_linear_infinite]" />
        <div className="absolute -inset-5 border border-secondary/10 rounded-[2.8rem] animate-[spin_5s_linear_infinite_reverse]" />
      </div>

      <div className="w-72 space-y-6 text-center">
        <div className="text-3xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-primary via-indigo-600 to-teal-500 font-serif">
          KSM.ART HOUSE
        </div>

        {/* Sophisticated Liquid Progress Bar */}
        <div className="space-y-3">
          <div className="h-1.5 w-full bg-muted/30 rounded-full overflow-hidden relative border border-primary/5 shadow-inner">
            <div className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-primary via-secondary to-teal-400 w-1/2 rounded-full animate-[progress-slide_2s_ease-in-out_infinite] shadow-[0_0_15px_rgba(37,99,235,0.6)]" />
          </div>
          
          {text && (
            <div className="flex items-center justify-center space-x-2">
              <Activity className="h-3 w-3 text-primary animate-pulse" />
              <p className="text-[10px] text-muted-foreground font-black tracking-[0.4em] uppercase opacity-70 animate-pulse">
                {text}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const PageLoader: React.FC<{ text?: string }> = ({ text = "KSM.ART HOUSE" }) => (
  <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,hsl(var(--primary)/0.05)_0%,transparent_50%)]" />
    <div className="relative z-10">
      <LoadingSpinner text={text} className="scale-110" />
    </div>
    
    {/* Animated background depth layers */}
    <div className="absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none">
      <div className="absolute top-[10%] left-[10%] w-96 h-96 bg-primary/10 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[10%] right-[10%] w-96 h-96 bg-secondary/10 rounded-full blur-[120px] animate-pulse delay-1000" />
    </div>
  </div>
);

/**
 * SkeletonCard for professional content loading states
 */
export const SkeletonCard: React.FC<{ count?: number }> = ({ count = 1 }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 w-full">
    {Array.from({ length: count }).map((_, i) => (
      <Card key={i} className="overflow-hidden border-muted/20 glass-card">
        <div className="p-4 space-y-4">
          <div className="flex justify-between items-start">
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-muted animate-pulse rounded-md w-3/4" />
              <div className="h-3 bg-muted animate-pulse rounded-md w-1/2" />
            </div>
            <div className="h-8 w-8 bg-muted animate-pulse rounded-lg" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="h-12 bg-muted/50 animate-pulse rounded-xl" />
            <div className="h-12 bg-muted/50 animate-pulse rounded-xl" />
          </div>
        </div>
      </Card>
    ))}
  </div>
);