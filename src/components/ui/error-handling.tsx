'use client';

import React, { useId } from 'react';
import { AlertCircle, RefreshCw, X, CheckCircle, Info, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * Error Display Component
 * Shows user-friendly error messages with retry functionality
 */
interface ErrorDisplayProps {
  error: string | Error;
  onRetry?: () => void;
  onDismiss?: () => void;
  variant?: 'error' | 'warning' | 'info';
  className?: string;
  showIcon?: boolean;
}

export function ErrorDisplay({ 
  error, 
  onRetry, 
  onDismiss, 
  variant = 'error',
  className,
  showIcon = true
}: ErrorDisplayProps) {
  const errorId = useId();
  const errorMessage = typeof error === 'string' ? error : error.message;
  
  const variantStyles = {
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800'
  };
  
  const iconMap = {
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info
  };
  
  const Icon = iconMap[variant];

  return (
    <div 
      className={cn(
        'border rounded-md p-4 mb-4',
        variantStyles[variant],
        className
      )}
      role="alert"
      aria-labelledby={`${errorId}-title`}
      aria-describedby={`${errorId}-message`}
    >
      <div className="flex items-start">
        {showIcon && (
          <Icon className="h-5 w-5 mt-0.5 mr-3 flex-shrink-0" />
        )}
        <div className="flex-1">
          <h3 
            id={`${errorId}-title`}
            className="text-sm font-medium"
          >
            {variant === 'error' ? 'Error' : variant === 'warning' ? 'Warning' : 'Information'}
          </h3>
          <p 
            id={`${errorId}-message`}
            className="text-sm mt-1"
          >
            {errorMessage}
          </p>
          {(onRetry || onDismiss) && (
            <div className="mt-3 flex space-x-2">
              {onRetry && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={onRetry}
                  className="bg-white/60 hover:bg-white"
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Try Again
                </Button>
              )}
              {onDismiss && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={onDismiss}
                  className="text-current hover:bg-white/60"
                >
                  Dismiss
                </Button>
              )}
            </div>
          )}
        </div>
        {onDismiss && (
          <button 
            onClick={onDismiss} 
            className="text-current hover:text-current/80 ml-2"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Success Display Component
 * Shows success messages with optional dismiss functionality
 */
interface SuccessDisplayProps {
  message: string;
  onDismiss?: () => void;
  className?: string;
  autoHide?: boolean;
  autoHideDelay?: number;
}

export function SuccessDisplay({ 
  message, 
  onDismiss, 
  className,
  autoHide = false,
  autoHideDelay = 5000
}: SuccessDisplayProps) {
  const successId = useId();
  
  React.useEffect(() => {
    if (autoHide && onDismiss) {
      const timer = setTimeout(onDismiss, autoHideDelay);
      return () => clearTimeout(timer);
    }
  }, [autoHide, autoHideDelay, onDismiss]);

  return (
    <div 
      className={cn(
        'bg-green-50 border border-green-200 rounded-md p-4 mb-4',
        className
      )}
      role="status"
      aria-labelledby={`${successId}-message`}
    >
      <div className="flex items-start">
        <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 mr-3 flex-shrink-0" />
        <div className="flex-1">
          <p 
            id={`${successId}-message`}
            className="text-sm text-green-700"
          >
            {message}
          </p>
        </div>
        {onDismiss && (
          <button 
            onClick={onDismiss} 
            className="text-green-400 hover:text-green-600 ml-2"
            aria-label="Dismiss success message"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Loading Error Boundary Component
 * Wraps components that might fail during loading
 */
interface LoadingErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error) => void;
}

interface LoadingErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class LoadingErrorBoundary extends React.Component<
  LoadingErrorBoundaryProps,
  LoadingErrorBoundaryState
> {
  constructor(props: LoadingErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): LoadingErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('LoadingErrorBoundary caught an error:', error, errorInfo);
    this.props.onError?.(error);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorDisplay
          error={this.state.error || 'Something went wrong'}
          onRetry={() => this.setState({ hasError: false, error: undefined })}
          variant="error"
        />
      );
    }

    return this.props.children;
  }
}

/**
 * Network Error Component
 * Specialized error display for network-related errors
 */
interface NetworkErrorProps {
  onRetry?: () => void;
  isOffline?: boolean;
  className?: string;
}

export function NetworkError({ onRetry, isOffline, className }: NetworkErrorProps) {
  const message = isOffline 
    ? 'You appear to be offline. Please check your internet connection and try again.'
    : 'Unable to connect to the server. Please check your internet connection and try again.';

  return (
    <ErrorDisplay
      error={message}
      onRetry={onRetry}
      variant="warning"
      className={className}
    />
  );
}

/**
 * Validation Error Component
 * Shows form validation errors in a user-friendly way
 */
interface ValidationErrorProps {
  errors: string[];
  onDismiss?: () => void;
  className?: string;
}

export function ValidationError({ errors, onDismiss, className }: ValidationErrorProps) {
  if (errors.length === 0) return null;

  return (
    <div 
      className={cn(
        'bg-red-50 border border-red-200 rounded-md p-4 mb-4',
        className
      )}
      role="alert"
    >
      <div className="flex items-start">
        <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-red-800">
            Please correct the following errors:
          </h3>
          <ul className="text-sm text-red-700 mt-2 list-disc list-inside space-y-1">
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
        {onDismiss && (
          <button 
            onClick={onDismiss} 
            className="text-red-400 hover:text-red-600 ml-2"
            aria-label="Dismiss validation errors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Empty State Component
 * Shows when no data is available
 */
interface EmptyStateProps {
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  icon?: React.ReactNode;
  className?: string;
}

export function EmptyState({ 
  title, 
  description, 
  action, 
  icon,
  className 
}: EmptyStateProps) {
  return (
    <div className={cn('text-center py-12', className)}>
      {icon && (
        <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-gray-600 mb-8 max-w-md mx-auto">
          {description}
        </p>
      )}
      {action && (
        <Button onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
