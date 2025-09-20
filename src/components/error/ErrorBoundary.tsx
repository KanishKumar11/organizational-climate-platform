'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
  retryCount: number;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  async componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorId = await this.logError(error, errorInfo);

    this.setState({
      errorInfo,
      errorId,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  private async logError(error: Error, errorInfo: ErrorInfo): Promise<string> {
    try {
      // Log error to console for client-side debugging
      console.error('Client-side error caught by ErrorBoundary:', {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
      });

      // Generate a simple error ID
      const errorId = `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      return errorId;
    } catch (logError) {
      console.error('Failed to log error:', logError);
      return 'UNKNOWN_ERROR';
    }
  }

  private handleRetry = () => {
    this.setState((prevState) => ({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: prevState.retryCount + 1,
    }));
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  private handleReportBug = () => {
    const { error, errorId } = this.state;
    const subject = encodeURIComponent(
      `Bug Report: ${error?.name || 'Application Error'}`
    );
    const body = encodeURIComponent(`
Error ID: ${errorId}
Error Message: ${error?.message}
URL: ${window.location.href}
User Agent: ${navigator.userAgent}
Timestamp: ${new Date().toISOString()}

Please describe what you were doing when this error occurred:

    `);

    window.open(`mailto:support@example.com?subject=${subject}&body=${body}`);
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error, errorInfo, errorId, retryCount } = this.state;
      const showDetails =
        this.props.showDetails || process.env.NODE_ENV === 'development';

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                Something went wrong
              </CardTitle>
              <CardDescription className="text-lg">
                We apologize for the inconvenience. An unexpected error has
                occurred.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {errorId && (
                <Alert>
                  <AlertDescription>
                    <strong>Error ID:</strong> {errorId}
                    <br />
                    Please reference this ID when contacting support.
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex flex-wrap gap-3 justify-center">
                <Button
                  onClick={this.handleRetry}
                  variant="default"
                  className="flex items-center gap-2"
                  disabled={retryCount >= 3}
                >
                  <RefreshCw className="w-4 h-4" />
                  {retryCount >= 3 ? 'Max retries reached' : 'Try Again'}
                </Button>

                <Button
                  onClick={this.handleReload}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reload Page
                </Button>

                <Button
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Home className="w-4 h-4" />
                  Go to Dashboard
                </Button>

                <Button
                  onClick={this.handleReportBug}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Bug className="w-4 h-4" />
                  Report Bug
                </Button>
              </div>

              {showDetails && error && (
                <details className="mt-6">
                  <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                    Technical Details (Click to expand)
                  </summary>
                  <div className="mt-4 p-4 bg-gray-100 rounded-lg">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-gray-900">
                          Error Message:
                        </h4>
                        <p className="text-sm text-gray-700 font-mono bg-white p-2 rounded border">
                          {error.message}
                        </p>
                      </div>

                      {error.stack && (
                        <div>
                          <h4 className="font-medium text-gray-900">
                            Stack Trace:
                          </h4>
                          <pre className="text-xs text-gray-700 font-mono bg-white p-2 rounded border overflow-auto max-h-40">
                            {error.stack}
                          </pre>
                        </div>
                      )}

                      {errorInfo?.componentStack && (
                        <div>
                          <h4 className="font-medium text-gray-900">
                            Component Stack:
                          </h4>
                          <pre className="text-xs text-gray-700 font-mono bg-white p-2 rounded border overflow-auto max-h-40">
                            {errorInfo.componentStack}
                          </pre>
                        </div>
                      )}

                      <div>
                        <h4 className="font-medium text-gray-900">
                          Environment:
                        </h4>
                        <div className="text-sm text-gray-700 space-y-1">
                          <p>
                            <strong>URL:</strong> {window.location.href}
                          </p>
                          <p>
                            <strong>User Agent:</strong> {navigator.userAgent}
                          </p>
                          <p>
                            <strong>Timestamp:</strong>{' '}
                            {new Date().toISOString()}
                          </p>
                          <p>
                            <strong>Retry Count:</strong> {retryCount}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </details>
              )}

              <div className="text-center text-sm text-gray-500">
                If this problem persists, please contact our support team with
                the error ID above.
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}

// Specialized error boundaries for different parts of the application
export const DashboardErrorBoundary: React.FC<{ children: ReactNode }> = ({
  children,
}) => (
  <ErrorBoundary
    fallback={
      <div className="p-8 text-center">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Dashboard Error
        </h3>
        <p className="text-gray-600 mb-4">
          There was an error loading the dashboard. Please refresh the page.
        </p>
        <Button onClick={() => window.location.reload()}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh Dashboard
        </Button>
      </div>
    }
  >
    {children}
  </ErrorBoundary>
);

export const SurveyErrorBoundary: React.FC<{ children: ReactNode }> = ({
  children,
}) => (
  <ErrorBoundary
    fallback={
      <div className="p-8 text-center">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Survey Error
        </h3>
        <p className="text-gray-600 mb-4">
          There was an error with the survey. Your progress has been saved.
        </p>
        <div className="space-x-2">
          <Button onClick={() => window.location.reload()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
          <Button variant="outline" onClick={() => window.history.back()}>
            Go Back
          </Button>
        </div>
      </div>
    }
  >
    {children}
  </ErrorBoundary>
);

export const MicroclimateErrorBoundary: React.FC<{ children: ReactNode }> = ({
  children,
}) => (
  <ErrorBoundary
    fallback={
      <div className="p-8 text-center">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Microclimate Error
        </h3>
        <p className="text-gray-600 mb-4">
          There was an error with the real-time session. Please try
          reconnecting.
        </p>
        <Button onClick={() => window.location.reload()}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Reconnect
        </Button>
      </div>
    }
  >
    {children}
  </ErrorBoundary>
);

export default ErrorBoundary;
