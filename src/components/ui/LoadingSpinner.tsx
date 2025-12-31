'use client';

import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'secondary' | 'white';
  text?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  color = 'primary',
  text 
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  const colorClasses = {
    primary: 'border-primary',
    secondary: 'border-secondary',
    white: 'border-white'
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div 
        className={`animate-spin rounded-full border-2 border-t-transparent ${sizeClasses[size]} ${colorClasses[color]} shadow-[0_0_15px_rgba(var(--primary),0.2)]`}
      />
      {text && (
        <p className="text-sm text-muted-foreground font-medium animate-pulse">{text}</p>
      )}
    </div>
  );
};

export const PageLoader: React.FC<{ text?: string }> = ({ text = "Initializing Premium Suite..." }) => (
  <div className="min-h-screen flex items-center justify-center animated-bg">
    <div className="text-center space-y-8">
      <div className="relative">
        <div className="w-20 h-20 bg-gradient-to-br from-primary via-amber-400 to-amber-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-primary/40 ring-4 ring-primary/20 animate-pulse">
          <div className="w-10 h-10 border-4 border-primary-foreground border-t-transparent rounded-full animate-spin" />
        </div>
        <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-amber-400/20 rounded-3xl blur-xl animate-pulse" />
      </div>
      
      <div className="space-y-3">
        <h2 className="text-4xl font-serif font-bold text-gradient text-luxury">
          KSM.ART HOUSE
        </h2>
        <p className="text-sm text-muted-foreground font-medium tracking-wider uppercase">
          {text}
        </p>
        <div className="flex justify-center space-x-1 mt-4">
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  </div>
);