/**
 * Comprehensive unit tests for error recovery system
 * Tests error handling, retry mechanisms, and graceful failure recovery
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  ErrorClassifier,
  RetryManager,
  ErrorReporter,
  ErrorRecoveryManager,
  useErrorRecovery,
  withErrorRecovery,
} from '@/lib/error-recovery';
import { errorTestHelpers, performanceHelpers } from '../utils/test-helpers';

// Mock the accessibility utilities
jest.mock('@/lib/accessibility', () => ({
  announceToScreenReader: jest.fn(),
}));

import { announceToScreenReader } from '@/lib/accessibility';

// Mock fetch for error reporting
global.fetch = jest.fn();

describe('Error Recovery System', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('ErrorClassifier', () => {
    describe('Error Type Detection', () => {
      test('should identify network errors', () => {
        const networkErrors = [
          new Error('NetworkError'),
          new Error('TimeoutError'),
          new Error('fetch failed'),
          new Error('network connection lost'),
        ];

        networkErrors.forEach(error => {
          expect(ErrorClassifier.isNetworkError(error)).toBe(true);
        });
      });

      test('should identify validation errors', () => {
        const validationErrors = [
          new Error('ValidationError'),
          new Error('validation failed'),
          new Error('invalid input'),
        ];

        validationErrors.forEach(error => {
          expect(ErrorClassifier.isValidationError(error)).toBe(true);
        });
      });

      test('should identify authentication errors', () => {
        const authErrors = [
          new Error('AuthenticationError'),
          new Error('unauthorized access'),
          new Error('authentication failed'),
          new Error('401 Unauthorized'),
        ];

        authErrors.forEach(error => {
          expect(ErrorClassifier.isAuthenticationError(error)).toBe(true);
        });
      });

      test('should identify permission errors', () => {
        const permissionErrors = [
          new Error('PermissionError'),
          new Error('forbidden access'),
          new Error('permission denied'),
          new Error('403 Forbidden'),
        ];

        permissionErrors.forEach(error => {
          expect(ErrorClassifier.isPermissionError(error)).toBe(true);
        });
      });

      test('should identify server errors', () => {
        const serverErrors = [
          new Error('500 Internal Server Error'),
          new Error('502 Bad Gateway'),
          new Error('503 Service Unavailable'),
          new Error('504 Gateway Timeout'),
        ];

        serverErrors.forEach(error => {
          expect(ErrorClassifier.isServerError(error)).toBe(true);
        });
      });
    });

    describe('User-Friendly Messages', () => {
      test('should provide user-friendly message for network errors', () => {
        const networkError = new Error('NetworkError');
        const message = ErrorClassifier.getUserFriendlyMessage(networkError);
        
        expect(message).toBe('Unable to connect to the server. Please check your internet connection and try again.');
      });

      test('should provide user-friendly message for validation errors', () => {
        const validationError = new Error('ValidationError');
        const message = ErrorClassifier.getUserFriendlyMessage(validationError);
        
        expect(message).toBe('Please check your input and try again.');
      });

      test('should provide user-friendly message for authentication errors', () => {
        const authError = new Error('AuthenticationError');
        const message = ErrorClassifier.getUserFriendlyMessage(authError);
        
        expect(message).toBe('Your session has expired. Please log in again.');
      });

      test('should provide user-friendly message for permission errors', () => {
        const permissionError = new Error('PermissionError');
        const message = ErrorClassifier.getUserFriendlyMessage(permissionError);
        
        expect(message).toBe('You do not have permission to perform this action.');
      });

      test('should provide user-friendly message for server errors', () => {
        const serverError = new Error('500 Internal Server Error');
        const message = ErrorClassifier.getUserFriendlyMessage(serverError);
        
        expect(message).toBe('The server is temporarily unavailable. Please try again in a few moments.');
      });

      test('should provide generic message for unknown errors', () => {
        const unknownError = new Error('Unknown error type');
        const message = ErrorClassifier.getUserFriendlyMessage(unknownError);
        
        expect(message).toBe('An unexpected error occurred. Please try again.');
      });
    });
  });

  describe('RetryManager', () => {
    test('should retry failed operations', async () => {
      let attempts = 0;
      const operation = jest.fn().mockImplementation(() => {
        attempts++;
        if (attempts < 3) {
          throw new Error('NetworkError');
        }
        return 'success';
      });

      const result = await RetryManager.withRetry(operation, {
        maxAttempts: 3,
        baseDelay: 100,
        maxDelay: 1000,
        backoffMultiplier: 2,
        retryCondition: (error) => error.message === 'NetworkError',
      });

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(3);
    });

    test('should respect retry condition', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('ValidationError'));

      await expect(
        RetryManager.withRetry(operation, {
          maxAttempts: 3,
          retryCondition: (error) => error.message === 'NetworkError',
        })
      ).rejects.toThrow('ValidationError');

      expect(operation).toHaveBeenCalledTimes(1);
    });

    test('should implement exponential backoff', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('NetworkError'));
      const delays: number[] = [];
      
      const originalSetTimeout = global.setTimeout;
      global.setTimeout = jest.fn((callback, delay) => {
        delays.push(delay);
        return originalSetTimeout(callback, 0);
      }) as any;

      try {
        await RetryManager.withRetry(operation, {
          maxAttempts: 3,
          baseDelay: 100,
          backoffMultiplier: 2,
          retryCondition: () => true,
        });
      } catch (error) {
        // Expected to fail
      }

      expect(delays).toHaveLength(2); // 2 retries
      expect(delays[0]).toBeGreaterThanOrEqual(100); // First retry
      expect(delays[1]).toBeGreaterThanOrEqual(200); // Second retry with backoff

      global.setTimeout = originalSetTimeout;
    });

    test('should add jitter to prevent thundering herd', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('NetworkError'));
      const delays: number[] = [];
      
      const originalSetTimeout = global.setTimeout;
      global.setTimeout = jest.fn((callback, delay) => {
        delays.push(delay);
        return originalSetTimeout(callback, 0);
      }) as any;

      try {
        await RetryManager.withRetry(operation, {
          maxAttempts: 2,
          baseDelay: 100,
          retryCondition: () => true,
        });
      } catch (error) {
        // Expected to fail
      }

      // Jitter should make delays slightly different from exact base delay
      expect(delays[0]).toBeGreaterThan(100);
      expect(delays[0]).toBeLessThan(1100); // Base delay + max jitter

      global.setTimeout = originalSetTimeout;
    });

    test('should respect max delay', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('NetworkError'));
      const delays: number[] = [];
      
      const originalSetTimeout = global.setTimeout;
      global.setTimeout = jest.fn((callback, delay) => {
        delays.push(delay);
        return originalSetTimeout(callback, 0);
      }) as any;

      try {
        await RetryManager.withRetry(operation, {
          maxAttempts: 5,
          baseDelay: 1000,
          maxDelay: 2000,
          backoffMultiplier: 3,
          retryCondition: () => true,
        });
      } catch (error) {
        // Expected to fail
      }

      // All delays should be capped at maxDelay + jitter
      delays.forEach(delay => {
        expect(delay).toBeLessThan(3000); // maxDelay + max jitter
      });

      global.setTimeout = originalSetTimeout;
    });
  });

  describe('ErrorReporter', () => {
    test('should log errors with context', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const error = new Error('Test error');
      const context = {
        operation: 'test-operation',
        userId: 'user-123',
        timestamp: new Date(),
      };

      ErrorReporter.log(error, context);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error Report:',
        expect.objectContaining({
          message: 'Test error',
          name: 'Error',
          context,
          timestamp: expect.any(String),
        })
      );

      consoleSpy.mockRestore();
    });

    test('should send errors to service in production', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      (global.fetch as jest.Mock).mockResolvedValue({ ok: true });

      const error = new Error('Production error');
      const context = { operation: 'prod-test' };

      ErrorReporter.log(error, context);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/errors',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: expect.stringContaining('Production error'),
          })
        );
      });

      process.env.NODE_ENV = originalEnv;
    });

    test('should handle reporting service failures', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Service unavailable'));

      const error = new Error('Test error');
      const context = { operation: 'test' };

      ErrorReporter.log(error, context);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Failed to report error:',
          expect.any(Error)
        );
      });

      consoleSpy.mockRestore();
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('ErrorRecoveryManager', () => {
    test('should handle errors with all options', async () => {
      const error = new Error('Test error');
      const context = {
        operation: 'test-operation',
        timestamp: new Date(),
      };

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const dispatchEventSpy = jest.spyOn(window, 'dispatchEvent').mockImplementation();

      await ErrorRecoveryManager.handleError(error, context);

      expect(consoleSpy).toHaveBeenCalled();
      expect(announceToScreenReader).toHaveBeenCalledWith(
        'Error: An unexpected error occurred. Please try again.',
        'assertive'
      );
      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'show-error',
          detail: expect.objectContaining({
            message: 'An unexpected error occurred. Please try again.',
            type: 'error',
          }),
        })
      );

      consoleSpy.mockRestore();
      dispatchEventSpy.mockRestore();
    });

    test('should create recovery actions', () => {
      const onRetry = jest.fn();
      const onRefresh = jest.fn();
      const onGoBack = jest.fn();

      const actions = ErrorRecoveryManager.createRecoveryActions(onRetry, onRefresh, onGoBack);

      expect(actions).toHaveLength(3);
      expect(actions[0]).toEqual({
        label: 'Try Again',
        action: onRetry,
        primary: true,
      });
      expect(actions[1]).toEqual({
        label: 'Refresh Page',
        action: onRefresh,
      });
      expect(actions[2]).toEqual({
        label: 'Go Back',
        action: onGoBack,
      });
    });

    test('should handle partial recovery actions', () => {
      const onRetry = jest.fn();

      const actions = ErrorRecoveryManager.createRecoveryActions(onRetry);

      expect(actions).toHaveLength(1);
      expect(actions[0].label).toBe('Try Again');
    });
  });

  describe('useErrorRecovery Hook', () => {
    function TestComponent() {
      const { handleError, withRetry } = useErrorRecovery();

      const handleClick = async () => {
        try {
          await withRetry(
            () => Promise.reject(new Error('Test error')),
            'test-operation'
          );
        } catch (error) {
          // Error handled by withRetry
        }
      };

      return <button onClick={handleClick}>Test Error</button>;
    }

    test('should provide error handling functionality', async () => {
      const user = userEvent.setup();
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      render(<TestComponent />);

      const button = screen.getByText('Test Error');
      await user.click(button);

      expect(consoleSpy).toHaveBeenCalled();
      expect(announceToScreenReader).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('withErrorRecovery HOC', () => {
    function TestComponent({ shouldError }: { shouldError?: boolean }) {
      if (shouldError) {
        throw new Error('Component error');
      }
      return <div>Component rendered successfully</div>;
    }

    function FallbackComponent({ error, retry }: { error: Error; retry: () => void }) {
      return (
        <div>
          <p>Error: {error.message}</p>
          <button onClick={retry}>Retry</button>
        </div>
      );
    }

    test('should render component normally when no error', () => {
      const WrappedComponent = withErrorRecovery(TestComponent);
      render(<WrappedComponent shouldError={false} />);

      expect(screen.getByText('Component rendered successfully')).toBeInTheDocument();
    });

    test('should show fallback component on error', () => {
      const WrappedComponent = withErrorRecovery(TestComponent, FallbackComponent);
      
      // Suppress error boundary console errors for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      render(<WrappedComponent shouldError={true} />);

      expect(screen.getByText('Error: Component error')).toBeInTheDocument();
      expect(screen.getByText('Retry')).toBeInTheDocument();

      consoleSpy.mockRestore();
    });

    test('should show default error UI when no fallback provided', () => {
      const WrappedComponent = withErrorRecovery(TestComponent);
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      render(<WrappedComponent shouldError={true} />);

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.getByText('Try Again')).toBeInTheDocument();

      consoleSpy.mockRestore();
    });

    test('should handle retry functionality', async () => {
      const WrappedComponent = withErrorRecovery(TestComponent, FallbackComponent);
      const user = userEvent.setup();
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const { rerender } = render(<WrappedComponent shouldError={true} />);

      expect(screen.getByText('Error: Component error')).toBeInTheDocument();

      const retryButton = screen.getByText('Retry');
      await user.click(retryButton);

      // Simulate successful retry
      rerender(<WrappedComponent shouldError={false} />);

      expect(screen.getByText('Component rendered successfully')).toBeInTheDocument();

      consoleSpy.mockRestore();
    });
  });

  describe('Performance', () => {
    test('should handle error processing efficiently', async () => {
      const error = new Error('Performance test error');
      const context = { operation: 'performance-test', timestamp: new Date() };

      const { executionTime } = await performanceHelpers.measureExecutionTime(async () => {
        await ErrorRecoveryManager.handleError(error, context, {
          logToConsole: false,
          showToUser: false,
          announceToScreenReader: false,
        });
      });

      expect(executionTime).toBeLessThan(10); // Should be very fast
    });

    test('should handle multiple concurrent errors', async () => {
      const errors = Array.from({ length: 100 }, (_, i) => new Error(`Error ${i}`));
      const contexts = errors.map((_, i) => ({
        operation: `operation-${i}`,
        timestamp: new Date(),
      }));

      const startTime = performance.now();

      await Promise.all(
        errors.map((error, i) =>
          ErrorRecoveryManager.handleError(error, contexts[i], {
            logToConsole: false,
            showToUser: false,
            announceToScreenReader: false,
          })
        )
      );

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      expect(totalTime).toBeLessThan(100); // Should handle 100 errors quickly
    });
  });

  describe('Integration', () => {
    test('should work with retry manager', async () => {
      let attempts = 0;
      const operation = jest.fn().mockImplementation(() => {
        attempts++;
        if (attempts < 2) {
          throw new Error('NetworkError');
        }
        return 'success';
      });

      const result = await RetryManager.withRetry(operation, {
        maxAttempts: 3,
        baseDelay: 10,
        retryCondition: (error) => ErrorClassifier.isNetworkError(error),
      });

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(2);
    });

    test('should integrate with error classification', () => {
      const networkError = new Error('fetch failed');
      const validationError = new Error('invalid input');

      expect(ErrorClassifier.isNetworkError(networkError)).toBe(true);
      expect(ErrorClassifier.isValidationError(validationError)).toBe(true);

      const networkMessage = ErrorClassifier.getUserFriendlyMessage(networkError);
      const validationMessage = ErrorClassifier.getUserFriendlyMessage(validationError);

      expect(networkMessage).toContain('connection');
      expect(validationMessage).toContain('input');
    });
  });
});
