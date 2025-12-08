'use client';

import React, { Component, ReactNode } from 'react';
import { Button } from '@/components/ui';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-[200px] p-8 text-center">
          <h2 className="text-xl font-semibold text-destructive mb-4">
            Something went wrong
          </h2>
          <p className="text-muted-foreground mb-6">
            We encountered an unexpected error. Please try refreshing the page.
          </p>
          <Button onClick={() => window.location.reload()} variant="outline">
            Refresh Page
          </Button>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details className="mt-4 text-left">
              <summary className="cursor-pointer text-sm">
                Error Details
              </summary>
              <pre className="text-xs bg-muted p-2 rounded mt-2 overflow-auto">
                {this.state.error.toString()}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
