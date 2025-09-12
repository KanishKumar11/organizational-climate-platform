/**
 * Comprehensive Error Handling and Resilience System
 * Provides global error boundaries, API error handling, and fallback mechanisms
 */

import { NextResponse } from 'next/server';
import AuditService from './audit-service';

export interface ErrorContext {
  user_id?: string;
  company_id?: string;
  request_id?: string;
  url?: string;
  method?: string;
  user_agent?: string;
  ip_address?: string;
  timestamp: Date;
}

export interface ErrorDetails {
  error_code: string;
  error_type:
    | 'validation'
    | 'permission'
    | 'network'
    | 'database'
    | 'ai_service'
    | 'system'
    | 'business_logic';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  user_message: string;
  stack_trace?: string;
  context: ErrorContext;
  metadata?: Record<string, any>;
  retry_count?: number;
  max_retries?: number;
}

export interface RetryConfig {
  max_attempts: number;
  base_delay_ms: number;
  max_delay_ms: number;
  exponential_backoff: boolean;
  retry_conditions: ((error: Error) => boolean)[];
}

export interface FallbackConfig {
  enabled: boolean;
  fallback_data?: any;
  fallback_message?: string;
  degraded_functionality?: boolean;
}

export class ErrorHandler {
  private static instance: ErrorHandler;
  private auditService: AuditService;
  private errorCounts: Map<string, number> = new Map();
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();

  private constructor() {
    this.auditService = AuditService.getInstance();
    this.setupGlobalErrorHandlers();
  }

  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  private setupGlobalErrorHandlers(): void {
    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
      this.handleSystemError(
        new Error(`Unhandled Promise Rejection: ${reason}`),
        {
          timestamp: new Date(),
        },
        'critical'
      );
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      this.handleSystemError(error, { timestamp: new Date() }, 'critical');
      // Don't exit the process in production, but log it
      if (process.env.NODE_ENV !== 'production') {
        process.exit(1);
      }
    });
  }

  public async handleError(
    error: Error,
    context: ErrorContext,
    errorType: ErrorDetails['error_type'] = 'system',
    severity: ErrorDetails['severity'] = 'medium'
  ): Promise<ErrorDetails> {
    const errorCode = this.generateErrorCode(error, errorType);

    const errorDetails: ErrorDetails = {
      error_code: errorCode,
      error_type: errorType,
      severity,
      message: error.message,
      user_message: this.getUserFriendlyMessage(error, errorType),
      stack_trace: error.stack,
      context,
      metadata: {
        error_name: error.name,
        error_constructor: error.constructor.name,
      },
    };

    // Log error for audit
    await this.auditService.logEvent({
      action: 'create',
      resource: 'audit_log',
      resource_id: errorCode,
      success: false,
      error_message: error.message,
      context: {
        user_id: context.user_id || 'unknown',
        company_id: context.company_id || 'unknown',
        ip_address: context.ip_address || '',
      },
      details: {
        error_type: errorType,
        severity,
        stack_trace: error.stack,
        metadata: errorDetails.metadata,
      },
    });

    // Track error frequency
    this.trackErrorFrequency(errorCode);

    // Handle circuit breaker logic
    if (
      errorType === 'ai_service' ||
      errorType === 'database' ||
      errorType === 'network'
    ) {
      this.updateCircuitBreaker(errorType, false);
    }

    return errorDetails;
  }

  public async handleSystemError(
    error: Error,
    context: ErrorContext,
    severity: ErrorDetails['severity'] = 'high'
  ): Promise<void> {
    await this.handleError(error, context, 'system', severity);
  }

  public createApiErrorResponse(
    error: Error,
    context: ErrorContext,
    errorType: ErrorDetails['error_type'] = 'system',
    statusCode: number = 500
  ): NextResponse {
    const errorDetails = {
      error_code: this.generateErrorCode(error, errorType),
      error_type: errorType,
      message: this.getUserFriendlyMessage(error, errorType),
      timestamp: new Date().toISOString(),
      request_id: context.request_id,
    };

    // Log error asynchronously
    this.handleError(error, context, errorType).catch(console.error);

    return NextResponse.json(
      {
        success: false,
        data: null,
        error: errorDetails,
      },
      { status: statusCode }
    );
  }

  public async withRetry<T>(
    operation: () => Promise<T>,
    config: RetryConfig,
    context: ErrorContext
  ): Promise<T> {
    let lastError: Error;
    let attempt = 0;

    while (attempt < config.max_attempts) {
      try {
        const result = await operation();

        // Reset circuit breaker on success
        if (attempt > 0) {
          this.updateCircuitBreaker('retry_operation', true);
        }

        return result;
      } catch (error) {
        lastError = error as Error;
        attempt++;

        // Check if error is retryable
        const shouldRetry = config.retry_conditions.some((condition) =>
          condition(lastError)
        );

        if (!shouldRetry || attempt >= config.max_attempts) {
          break;
        }

        // Calculate delay with exponential backoff
        const delay = config.exponential_backoff
          ? Math.min(
              config.base_delay_ms * Math.pow(2, attempt - 1),
              config.max_delay_ms
            )
          : config.base_delay_ms;

        await new Promise((resolve) => setTimeout(resolve, delay));

        // Log retry attempt
        await this.auditService.logEvent({
          action: 'create',
          resource: 'audit_log',
          resource_id: context.request_id || 'unknown',
          success: false,
          context: {
            user_id: context.user_id || 'unknown',
            company_id: context.company_id || 'unknown',
            ip_address: context.ip_address || '',
          },
          details: {
            attempt_number: attempt,
            delay_ms: delay,
            error_message: lastError.message,
          },
        });
      }
    }

    // All retries failed
    await this.handleError(
      lastError!,
      context,
      'network',
      'high'
    );

    throw lastError!;
  }

  public async withFallback<T>(
    operation: () => Promise<T>,
    fallbackConfig: FallbackConfig,
    context: ErrorContext
  ): Promise<T | any> {
    try {
      return await operation();
    } catch (error) {
      if (!fallbackConfig.enabled) {
        throw error;
      }

      // Log fallback usage
      await this.auditService.logEvent({
        action: 'create',
        resource: 'audit_log',
        resource_id: context.request_id || 'unknown',
        success: true,
        context: {
          user_id: context.user_id || 'unknown',
          company_id: context.company_id || 'unknown',
          ip_address: context.ip_address || '',
        },
        details: {
          original_error: (error as Error).message,
          fallback_data_provided: !!fallbackConfig.fallback_data,
          degraded_functionality: fallbackConfig.degraded_functionality,
        },
      });

      // Handle error but don't throw
      await this.handleError(error as Error, context, 'system', 'medium');

      return fallbackConfig.fallback_data;
    }
  }

  public isCircuitBreakerOpen(service: string): boolean {
    const breaker = this.circuitBreakers.get(service);
    return breaker ? breaker.isOpen() : false;
  }

  public async executeWithCircuitBreaker<T>(
    service: string,
    operation: () => Promise<T>,
    context: ErrorContext
  ): Promise<T> {
    const breaker = this.getOrCreateCircuitBreaker(service);

    if (breaker.isOpen()) {
      throw new Error(`Circuit breaker is open for service: ${service}`);
    }

    try {
      const result = await operation();
      breaker.recordSuccess();
      return result;
    } catch (error) {
      breaker.recordFailure();

      await this.handleError(
        error as Error,
        context,
        service as ErrorDetails['error_type'],
        'high'
      );

      throw error;
    }
  }

  private generateErrorCode(error: Error, errorType: string): string {
    const timestamp = Date.now().toString(36);
    const errorHash = this.hashString(error.message + error.stack);
    return `${errorType.toUpperCase()}_${timestamp}_${errorHash}`;
  }

  private getUserFriendlyMessage(
    error: Error,
    errorType: ErrorDetails['error_type']
  ): string {
    const friendlyMessages: Record<string, string> = {
      validation: 'Please check your input and try again.',
      permission: 'You do not have permission to perform this action.',
      network:
        'Network connection issue. Please check your connection and try again.',
      database:
        'We are experiencing technical difficulties. Please try again later.',
      ai_service:
        'AI analysis is temporarily unavailable. Please try again later.',
      system: 'An unexpected error occurred. Please try again later.',
      business_logic:
        'Unable to complete the requested operation. Please review your request.',
    };

    // Check for specific error patterns
    if (error.message.includes('timeout')) {
      return 'The operation timed out. Please try again.';
    }

    if (error.message.includes('not found')) {
      return 'The requested resource was not found.';
    }

    if (
      error.message.includes('unauthorized') ||
      error.message.includes('forbidden')
    ) {
      return 'You are not authorized to access this resource.';
    }

    return friendlyMessages[errorType] || friendlyMessages.system;
  }

  private trackErrorFrequency(errorCode: string): void {
    const count = this.errorCounts.get(errorCode) || 0;
    this.errorCounts.set(errorCode, count + 1);

    // Alert if error frequency is high
    if (count > 10) {
      console.warn(
        `High frequency error detected: ${errorCode} (${count} occurrences)`
      );
    }
  }

  private updateCircuitBreaker(service: string, success: boolean): void {
    const breaker = this.getOrCreateCircuitBreaker(service);

    if (success) {
      breaker.recordSuccess();
    } else {
      breaker.recordFailure();
    }
  }

  private getOrCreateCircuitBreaker(service: string): CircuitBreaker {
    if (!this.circuitBreakers.has(service)) {
      this.circuitBreakers.set(
        service,
        new CircuitBreaker({
          failureThreshold: 5,
          recoveryTimeout: 60000, // 1 minute
          monitoringPeriod: 300000, // 5 minutes
        })
      );
    }
    return this.circuitBreakers.get(service)!;
  }

  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36).substr(0, 8);
  }
}

class CircuitBreaker {
  private failureCount = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  constructor(
    private config: {
      failureThreshold: number;
      recoveryTimeout: number;
      monitoringPeriod: number;
    }
  ) {}

  public isOpen(): boolean {
    if (this.state === 'open') {
      // Check if recovery timeout has passed
      if (Date.now() - this.lastFailureTime > this.config.recoveryTimeout) {
        this.state = 'half-open';
        return false;
      }
      return true;
    }
    return false;
  }

  public recordSuccess(): void {
    this.failureCount = 0;
    this.state = 'closed';
  }

  public recordFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.config.failureThreshold) {
      this.state = 'open';
    }
  }
}

// React Error Boundary Component
export class ErrorBoundary extends Error {
  constructor(
    message: string,
    public componentStack?: string,
    public errorBoundary?: string
  ) {
    super(message);
    this.name = 'ErrorBoundary';
  }
}

// Utility functions for common retry conditions
export const RetryConditions = {
  networkError: (error: Error): boolean => {
    return (
      error.message.includes('network') ||
      error.message.includes('timeout') ||
      error.message.includes('ECONNRESET') ||
      error.message.includes('ENOTFOUND')
    );
  },

  serverError: (error: Error): boolean => {
    return (
      error.message.includes('500') ||
      error.message.includes('502') ||
      error.message.includes('503') ||
      error.message.includes('504')
    );
  },

  databaseError: (error: Error): boolean => {
    return (
      error.message.includes('connection') ||
      error.message.includes('timeout') ||
      error.message.includes('lock')
    );
  },

  aiServiceError: (error: Error): boolean => {
    return (
      error.message.includes('AI service') ||
      error.message.includes('analysis failed') ||
      error.message.includes('model unavailable')
    );
  },
};

// Default retry configurations
export const DefaultRetryConfigs = {
  network: {
    max_attempts: 3,
    base_delay_ms: 1000,
    max_delay_ms: 10000,
    exponential_backoff: true,
    retry_conditions: [
      RetryConditions.networkError,
      RetryConditions.serverError,
    ],
  },

  database: {
    max_attempts: 2,
    base_delay_ms: 500,
    max_delay_ms: 2000,
    exponential_backoff: true,
    retry_conditions: [RetryConditions.databaseError],
  },

  aiService: {
    max_attempts: 2,
    base_delay_ms: 2000,
    max_delay_ms: 8000,
    exponential_backoff: true,
    retry_conditions: [RetryConditions.aiServiceError],
  },
};

// Default fallback configurations
export const DefaultFallbackConfigs = {
  aiInsights: {
    enabled: true,
    fallback_data: {
      insights: [],
      message:
        'AI analysis is temporarily unavailable. Basic results are shown.',
      degraded: true,
    },
    degraded_functionality: true,
  },

  dashboard: {
    enabled: true,
    fallback_data: {
      kpis: [],
      charts: [],
      message: 'Some dashboard features are temporarily unavailable.',
      degraded: true,
    },
    degraded_functionality: true,
  },

  reports: {
    enabled: true,
    fallback_data: {
      report: null,
      message:
        'Report generation is temporarily unavailable. Please try again later.',
    },
    degraded_functionality: true,
  },
};

export default ErrorHandler;
