'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';

export interface ErrorState {
  error: Error | null;
  isError: boolean;
  errorId?: string;
  retryCount: number;
}

export interface ErrorHandlerOptions {
  showToast?: boolean;
  maxRetries?: number;
  onError?: (error: Error) => void;
  onRetry?: () => void;
  fallbackData?: any;
}

export function useErrorHandler(options: ErrorHandlerOptions = {}) {
  const {
    showToast = true,
    maxRetries = 3,
    onError,
    onRetry,
    fallbackData,
  } = options;

  const [errorState, setErrorState] = useState<ErrorState>({
    error: null,
    isError: false,
    retryCount: 0,
  });

  const handleError = useCallback(
    (error: Error | string, context?: Record<string, any>) => {
      const errorObj = typeof error === 'string' ? new Error(error) : error;
      const errorId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      setErrorState((prev) => ({
        error: errorObj,
        isError: true,
        errorId,
        retryCount: prev.retryCount,
      }));

      // Show toast notification
      if (showToast) {
        const userMessage = getUserFriendlyMessage(errorObj);
        toast.error(userMessage, {
          description: `Error ID: ${errorId}`,
          action: {
            label: 'Retry',
            onClick: () => retry(),
          },
        });
      }

      // Call custom error handler
      if (onError) {
        onError(errorObj);
      }

      // Log error to console in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Client Error:', errorObj, context);
      }

      // In production, you might want to send errors to a logging service
      if (process.env.NODE_ENV === 'production') {
        // Example: Send to error tracking service
        // sendErrorToService(errorObj, context, errorId);
      }
    },
    [showToast, onError]
  );

  const retry = useCallback(() => {
    if (errorState.retryCount >= maxRetries) {
      toast.error('Maximum retry attempts reached');
      return;
    }

    setErrorState((prev) => ({
      ...prev,
      retryCount: prev.retryCount + 1,
    }));

    if (onRetry) {
      onRetry();
    }
  }, [errorState.retryCount, maxRetries, onRetry]);

  const clearError = useCallback(() => {
    setErrorState({
      error: null,
      isError: false,
      retryCount: 0,
    });
  }, []);

  const withErrorHandling = useCallback(
    async <T>(
      asyncOperation: () => Promise<T>,
      context?: Record<string, any>
    ): Promise<T | typeof fallbackData> => {
      try {
        clearError();
        const result = await asyncOperation();
        return result;
      } catch (error) {
        handleError(error as Error, context);

        if (fallbackData !== undefined) {
          return fallbackData;
        }

        throw error;
      }
    },
    [handleError, clearError, fallbackData]
  );

  const withRetry = useCallback(
    async <T>(
      asyncOperation: () => Promise<T>,
      retryOptions?: { maxAttempts?: number; delay?: number }
    ): Promise<T> => {
      const { maxAttempts = 3, delay = 1000 } = retryOptions || {};
      let lastError: Error;

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          return await asyncOperation();
        } catch (error) {
          lastError = error as Error;

          if (attempt === maxAttempts) {
            handleError(lastError, { attempt, maxAttempts });
            throw lastError;
          }

          // Wait before retrying
          await new Promise((resolve) => setTimeout(resolve, delay * attempt));
        }
      }

      throw lastError!;
    },
    [handleError]
  );

  return {
    errorState,
    handleError,
    clearError,
    retry,
    withErrorHandling,
    withRetry,
    canRetry: errorState.retryCount < maxRetries,
  };
}

// Utility function to convert technical errors to user-friendly messages
function getUserFriendlyMessage(error: Error): string {
  const message = error.message.toLowerCase();

  if (message.includes('network') || message.includes('fetch')) {
    return 'Network connection issue. Please check your internet connection.';
  }

  if (message.includes('timeout')) {
    return 'The request timed out. Please try again.';
  }

  if (message.includes('unauthorized') || message.includes('401')) {
    return 'Your session has expired. Please log in again.';
  }

  if (message.includes('forbidden') || message.includes('403')) {
    return 'You do not have permission to perform this action.';
  }

  if (message.includes('not found') || message.includes('404')) {
    return 'The requested resource was not found.';
  }

  if (message.includes('server') || message.includes('500')) {
    return 'Server error. Please try again later.';
  }

  if (message.includes('validation') || message.includes('invalid')) {
    return 'Please check your input and try again.';
  }

  // Default message
  return 'An unexpected error occurred. Please try again.';
}

// Hook for API calls with automatic error handling
export function useApiCall() {
  const { withErrorHandling, withRetry } = useErrorHandler({
    showToast: true,
    maxRetries: 2,
  });

  const apiCall = useCallback(
    async <T>(
      url: string,
      options?: RequestInit,
      retryOptions?: { maxAttempts?: number; delay?: number }
    ): Promise<T> => {
      const operation = async () => {
        const response = await fetch(url, {
          headers: {
            'Content-Type': 'application/json',
            ...options?.headers,
          },
          ...options,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.error ||
              errorData.message ||
              `HTTP ${response.status}: ${response.statusText}`
          );
        }

        return response.json();
      };

      if (retryOptions) {
        return withRetry(operation, retryOptions);
      }

      return withErrorHandling(operation, {
        url,
        method: options?.method || 'GET',
      });
    },
    [withErrorHandling, withRetry]
  );

  return { apiCall };
}

// Hook for form submission with error handling
export function useFormSubmission() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { handleError, withErrorHandling } = useErrorHandler({
    showToast: true,
  });

  const submitForm = useCallback(
    async <T>(
      submitFunction: () => Promise<T>,
      options?: {
        onSuccess?: (result: T) => void;
        onError?: (error: Error) => void;
        successMessage?: string;
      }
    ) => {
      if (isSubmitting) return;

      setIsSubmitting(true);

      try {
        const result = await withErrorHandling(submitFunction);

        if (options?.successMessage) {
          toast.success(options.successMessage);
        }

        if (options?.onSuccess) {
          options.onSuccess(result);
        }

        return result;
      } catch (error) {
        if (options?.onError) {
          options.onError(error as Error);
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [isSubmitting, withErrorHandling]
  );

  return {
    isSubmitting,
    submitForm,
    handleError,
  };
}

export default useErrorHandler;
