/**
 * Comprehensive error recovery and retry mechanisms
 * Provides graceful failure handling with user feedback
 */

import React from 'react';
import { announceToScreenReader } from '@/lib/accessibility';

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryCondition?: (error: Error) => boolean;
}

export interface ErrorContext {
  operation: string;
  userId?: string;
  timestamp: Date;
  userAgent?: string;
  url?: string;
  additionalData?: Record<string, any>;
}

export interface RecoveryAction {
  label: string;
  action: () => Promise<void> | void;
  primary?: boolean;
}

export interface ErrorRecoveryOptions {
  showToUser: boolean;
  logToConsole: boolean;
  reportToService: boolean;
  retryConfig?: RetryConfig;
  recoveryActions?: RecoveryAction[];
  fallbackComponent?: React.ComponentType<any>;
  announceToScreenReader?: boolean;
}

/**
 * Default retry configuration
 */
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  retryCondition: (error) => {
    // Retry on network errors, timeouts, and 5xx server errors
    if (error.name === 'NetworkError' || error.name === 'TimeoutError') {
      return true;
    }
    if (error.message.includes('fetch')) {
      return true;
    }
    return false;
  },
};

/**
 * Error classification utilities
 */
export class ErrorClassifier {
  static isNetworkError(error: Error): boolean {
    return (
      error.name === 'NetworkError' ||
      error.name === 'TimeoutError' ||
      error.message.includes('fetch') ||
      error.message.includes('network') ||
      error.message.includes('connection')
    );
  }

  static isValidationError(error: Error): boolean {
    return (
      error.name === 'ValidationError' ||
      error.message.includes('validation') ||
      error.message.includes('invalid')
    );
  }

  static isAuthenticationError(error: Error): boolean {
    return (
      error.name === 'AuthenticationError' ||
      error.message.includes('unauthorized') ||
      error.message.includes('authentication') ||
      error.message.includes('401')
    );
  }

  static isPermissionError(error: Error): boolean {
    return (
      error.name === 'PermissionError' ||
      error.message.includes('forbidden') ||
      error.message.includes('permission') ||
      error.message.includes('403')
    );
  }

  static isServerError(error: Error): boolean {
    return (
      error.message.includes('500') ||
      error.message.includes('502') ||
      error.message.includes('503') ||
      error.message.includes('504')
    );
  }

  static getUserFriendlyMessage(error: Error): string {
    if (this.isNetworkError(error)) {
      return 'Unable to connect to the server. Please check your internet connection and try again.';
    }

    if (this.isValidationError(error)) {
      return 'Please check your input and try again.';
    }

    if (this.isAuthenticationError(error)) {
      return 'Your session has expired. Please log in again.';
    }

    if (this.isPermissionError(error)) {
      return 'You do not have permission to perform this action.';
    }

    if (this.isServerError(error)) {
      return 'The server is temporarily unavailable. Please try again in a few moments.';
    }

    return 'An unexpected error occurred. Please try again.';
  }
}

/**
 * Retry mechanism with exponential backoff
 */
export class RetryManager {
  static async withRetry<T>(
    operation: () => Promise<T>,
    config: Partial<RetryConfig> = {}
  ): Promise<T> {
    const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
    let lastError: Error;

    for (let attempt = 1; attempt <= finalConfig.maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        // Check if we should retry
        if (
          attempt === finalConfig.maxAttempts ||
          !finalConfig.retryCondition?.(lastError)
        ) {
          throw lastError;
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(
          finalConfig.baseDelay *
            Math.pow(finalConfig.backoffMultiplier, attempt - 1),
          finalConfig.maxDelay
        );

        // Add jitter to prevent thundering herd
        const jitteredDelay = delay + Math.random() * 1000;

        await new Promise((resolve) => setTimeout(resolve, jitteredDelay));
      }
    }

    throw lastError!;
  }
}

/**
 * Error logging and reporting
 */
export class ErrorReporter {
  static log(error: Error, context: ErrorContext) {
    const errorReport = {
      message: error.message,
      stack: error.stack,
      name: error.name,
      context,
      timestamp: new Date().toISOString(),
    };

    console.error('Error Report:', errorReport);

    // In production, send to error reporting service
    if (process.env.NODE_ENV === 'production') {
      this.sendToErrorService(errorReport);
    }
  }

  private static async sendToErrorService(errorReport: any) {
    try {
      await fetch('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorReport),
      });
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }
  }
}

/**
 * Main error recovery manager
 */
export class ErrorRecoveryManager {
  static async handleError(
    error: Error,
    context: ErrorContext,
    options: Partial<ErrorRecoveryOptions> = {}
  ): Promise<void> {
    const finalOptions: ErrorRecoveryOptions = {
      showToUser: true,
      logToConsole: true,
      reportToService: true,
      announceToScreenReader: true,
      ...options,
    };

    // Log error
    if (finalOptions.logToConsole) {
      ErrorReporter.log(error, context);
    }

    // Announce to screen reader
    if (finalOptions.announceToScreenReader) {
      const message = ErrorClassifier.getUserFriendlyMessage(error);
      announceToScreenReader(`Error: ${message}`, 'assertive');
    }

    // Show user-friendly error message
    if (finalOptions.showToUser) {
      this.showErrorToUser(error, finalOptions.recoveryActions);
    }
  }

  private static showErrorToUser(
    error: Error,
    recoveryActions?: RecoveryAction[]
  ) {
    const message = ErrorClassifier.getUserFriendlyMessage(error);

    // Create error notification
    const errorEvent = new CustomEvent('show-error', {
      detail: {
        message,
        type: 'error',
        recoveryActions,
      },
    });

    window.dispatchEvent(errorEvent);
  }

  static createRecoveryActions(
    onRetry?: () => Promise<void>,
    onRefresh?: () => void,
    onGoBack?: () => void
  ): RecoveryAction[] {
    const actions: RecoveryAction[] = [];

    if (onRetry) {
      actions.push({
        label: 'Try Again',
        action: onRetry,
        primary: true,
      });
    }

    if (onRefresh) {
      actions.push({
        label: 'Refresh Page',
        action: onRefresh,
      });
    }

    if (onGoBack) {
      actions.push({
        label: 'Go Back',
        action: onGoBack,
      });
    }

    return actions;
  }
}

/**
 * React hook for error handling
 */
export function useErrorRecovery() {
  const handleError = async (
    error: Error,
    operation: string,
    options?: Partial<ErrorRecoveryOptions>
  ) => {
    const context: ErrorContext = {
      operation,
      timestamp: new Date(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    };

    await ErrorRecoveryManager.handleError(error, context, options);
  };

  const withRetry = async <T,>(
    operation: () => Promise<T>,
    operationName: string,
    retryConfig?: Partial<RetryConfig>
  ): Promise<T> => {
    try {
      return await RetryManager.withRetry(operation, retryConfig);
    } catch (error) {
      await handleError(error as Error, operationName);
      throw error;
    }
  };

  return {
    handleError,
    withRetry,
  };
}

/**
 * Higher-order component for error boundaries
 */
export function withErrorRecovery<P extends object = object>(
  Component: React.ComponentType<P>,
  fallbackComponent?: React.ComponentType<{ error: Error; retry: () => void }>
) {
  return function ErrorRecoveryWrapper(props: P) {
    const [error, setError] = React.useState<Error | null>(null);
    const { handleError } = useErrorRecovery();

    const retry = () => {
      setError(null);
    };

    React.useEffect(() => {
      if (error) {
        handleError(error, `${Component.name} render`);
      }
    }, [error, handleError]);

    if (error) {
      if (fallbackComponent) {
        const FallbackComponent = fallbackComponent;
        return <FallbackComponent error={error} retry={retry} />;
      }

      return (
        <div className="p-4 border border-red-200 rounded-md bg-red-50">
          <h3 className="text-red-800 font-medium">Something went wrong</h3>
          <p className="text-red-600 text-sm mt-1">
            {ErrorClassifier.getUserFriendlyMessage(error)}
          </p>
          <button
            onClick={retry}
            className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      );
    }

    try {
      return <Component {...props} />;
    } catch (renderError) {
      setError(renderError as Error);
      return null;
    }
  };
}
