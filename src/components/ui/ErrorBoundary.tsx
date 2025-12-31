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
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-gray-50 p-4">
          <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="mb-6">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Something went wrong
              </h1>
              <p className="text-gray-600 mb-4">
                We encountered an unexpected error. Please try refreshing the page.
              </p>
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="text-left bg-gray-100 p-4 rounded-lg mb-4">
                  <summary className="cursor-pointer font-medium text-gray-700 mb-2">
                    Error Details
                  </summary>
                  <pre className="text-xs text-red-600 overflow-auto">
                    {this.state.error.stack}
                  </pre>
                </details>
              )}
            </div>
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Page
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="w-full bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center"
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