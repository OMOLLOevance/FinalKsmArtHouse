'use client';

import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<
  React.PropsWithChildren<{}>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const sanitizedError = {
      message: error.message.replace(/[\r\n]/g, ' '),
      stack: error.stack?.replace(/[\r\n]/g, ' ') || 'No stack trace available'
    };
    console.error('ErrorBoundary caught an error:', sanitizedError, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="max-w-md w-full bg-card rounded-xl shadow-lg p-8 text-center border border-border">
            <div className="mb-6">
              <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-2">
                Something went wrong
              </h1>
              <p className="text-muted-foreground mb-4 text-sm">
                We encountered an unexpected error. Please try refreshing the page.
              </p>
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="text-left bg-muted p-4 rounded-lg mb-4">
                  <summary className="cursor-pointer font-medium text-muted-foreground mb-2 text-xs uppercase tracking-widest">
                    Error Details
                  </summary>
                  <pre className="text-[10px] text-destructive overflow-auto max-h-40">
                    {this.state.error.stack}
                  </pre>
                </details>
              )}
            </div>
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center font-bold"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Page
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="w-full bg-muted text-muted-foreground px-6 py-3 rounded-lg hover:bg-muted/80 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center font-bold"
              >
                <Home className="h-4 w-4 mr-2" />
                Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}