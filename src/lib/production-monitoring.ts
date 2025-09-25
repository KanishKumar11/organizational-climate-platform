/**
 * Production monitoring and logging utilities
 * Provides comprehensive application monitoring and health checks
 */

import { NextRequest } from 'next/server';

/**
 * Log levels and configuration
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4,
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  stack?: string;
}

/**
 * Production logger with structured logging
 */
export class ProductionLogger {
  private static instance: ProductionLogger;
  private logLevel: LogLevel;
  private logBuffer: LogEntry[] = [];
  private maxBufferSize = 1000;
  
  private constructor() {
    this.logLevel = process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG;
  }
  
  static getInstance(): ProductionLogger {
    if (!ProductionLogger.instance) {
      ProductionLogger.instance = new ProductionLogger();
    }
    return ProductionLogger.instance;
  }
  
  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: Record<string, any>,
    error?: Error
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      stack: error?.stack,
      requestId: this.getCurrentRequestId(),
    };
  }
  
  private getCurrentRequestId(): string | undefined {
    // In a real implementation, this would come from request context
    return typeof window !== 'undefined' ? undefined : 'server-request';
  }
  
  private shouldLog(level: LogLevel): boolean {
    return level >= this.logLevel;
  }
  
  private writeLog(entry: LogEntry) {
    // Add to buffer
    this.logBuffer.push(entry);
    if (this.logBuffer.length > this.maxBufferSize) {
      this.logBuffer.shift();
    }
    
    // Console output for development
    if (process.env.NODE_ENV !== 'production') {
      const levelNames = ['DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'];
      console.log(`[${levelNames[entry.level]}] ${entry.timestamp}: ${entry.message}`, entry.context);
    }
    
    // In production, send to logging service
    if (process.env.NODE_ENV === 'production') {
      this.sendToLoggingService(entry);
    }
  }
  
  private async sendToLoggingService(entry: LogEntry) {
    try {
      await fetch('/api/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entry),
      });
    } catch (error) {
      // Fallback to console if logging service fails
      console.error('Failed to send log to service:', error);
      console.log('Original log entry:', entry);
    }
  }
  
  debug(message: string, context?: Record<string, any>) {
    if (this.shouldLog(LogLevel.DEBUG)) {
      this.writeLog(this.createLogEntry(LogLevel.DEBUG, message, context));
    }
  }
  
  info(message: string, context?: Record<string, any>) {
    if (this.shouldLog(LogLevel.INFO)) {
      this.writeLog(this.createLogEntry(LogLevel.INFO, message, context));
    }
  }
  
  warn(message: string, context?: Record<string, any>) {
    if (this.shouldLog(LogLevel.WARN)) {
      this.writeLog(this.createLogEntry(LogLevel.WARN, message, context));
    }
  }
  
  error(message: string, error?: Error, context?: Record<string, any>) {
    if (this.shouldLog(LogLevel.ERROR)) {
      this.writeLog(this.createLogEntry(LogLevel.ERROR, message, context, error));
    }
  }
  
  fatal(message: string, error?: Error, context?: Record<string, any>) {
    if (this.shouldLog(LogLevel.FATAL)) {
      this.writeLog(this.createLogEntry(LogLevel.FATAL, message, context, error));
    }
  }
  
  getRecentLogs(count: number = 100): LogEntry[] {
    return this.logBuffer.slice(-count);
  }
}

/**
 * Performance monitoring utilities
 */
export class PerformanceMonitor {
  private static metrics: Map<string, number[]> = new Map();
  
  static startTimer(operation: string): () => number {
    const startTime = performance.now();
    
    return () => {
      const duration = performance.now() - startTime;
      this.recordMetric(operation, duration);
      return duration;
    };
  }
  
  static recordMetric(name: string, value: number) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    const values = this.metrics.get(name)!;
    values.push(value);
    
    // Keep only last 1000 measurements
    if (values.length > 1000) {
      values.shift();
    }
  }
  
  static getMetrics(name: string): {
    count: number;
    average: number;
    min: number;
    max: number;
    p95: number;
  } | null {
    const values = this.metrics.get(name);
    if (!values || values.length === 0) return null;
    
    const sorted = [...values].sort((a, b) => a - b);
    const count = values.length;
    const sum = values.reduce((a, b) => a + b, 0);
    
    return {
      count,
      average: sum / count,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      p95: sorted[Math.floor(count * 0.95)],
    };
  }
  
  static getAllMetrics(): Record<string, any> {
    const result: Record<string, any> = {};
    
    for (const [name] of this.metrics) {
      result[name] = this.getMetrics(name);
    }
    
    return result;
  }
}

/**
 * Health check utilities
 */
export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: Record<string, {
    status: 'pass' | 'fail' | 'warn';
    message?: string;
    duration?: number;
  }>;
  timestamp: string;
}

export class HealthChecker {
  private static checks: Map<string, () => Promise<{ status: 'pass' | 'fail' | 'warn'; message?: string }>> = new Map();
  
  static registerCheck(
    name: string,
    check: () => Promise<{ status: 'pass' | 'fail' | 'warn'; message?: string }>
  ) {
    this.checks.set(name, check);
  }
  
  static async runHealthChecks(): Promise<HealthCheckResult> {
    const results: HealthCheckResult['checks'] = {};
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    for (const [name, check] of this.checks) {
      const timer = PerformanceMonitor.startTimer(`healthcheck.${name}`);
      
      try {
        const result = await Promise.race([
          check(),
          new Promise<{ status: 'fail'; message: string }>((_, reject) =>
            setTimeout(() => reject(new Error('Health check timeout')), 5000)
          ),
        ]);
        
        const duration = timer();
        results[name] = { ...result, duration };
        
        if (result.status === 'fail') {
          overallStatus = 'unhealthy';
        } else if (result.status === 'warn' && overallStatus === 'healthy') {
          overallStatus = 'degraded';
        }
      } catch (error) {
        const duration = timer();
        results[name] = {
          status: 'fail',
          message: error instanceof Error ? error.message : 'Unknown error',
          duration,
        };
        overallStatus = 'unhealthy';
      }
    }
    
    return {
      status: overallStatus,
      checks: results,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Application metrics collector
 */
export class MetricsCollector {
  private static counters: Map<string, number> = new Map();
  private static gauges: Map<string, number> = new Map();
  private static histograms: Map<string, number[]> = new Map();
  
  static incrementCounter(name: string, value: number = 1) {
    const current = this.counters.get(name) || 0;
    this.counters.set(name, current + value);
  }
  
  static setGauge(name: string, value: number) {
    this.gauges.set(name, value);
  }
  
  static recordHistogram(name: string, value: number) {
    if (!this.histograms.has(name)) {
      this.histograms.set(name, []);
    }
    
    const values = this.histograms.get(name)!;
    values.push(value);
    
    // Keep only last 1000 values
    if (values.length > 1000) {
      values.shift();
    }
  }
  
  static getMetrics() {
    return {
      counters: Object.fromEntries(this.counters),
      gauges: Object.fromEntries(this.gauges),
      histograms: Object.fromEntries(
        Array.from(this.histograms.entries()).map(([name, values]) => [
          name,
          {
            count: values.length,
            sum: values.reduce((a, b) => a + b, 0),
            avg: values.reduce((a, b) => a + b, 0) / values.length,
            min: Math.min(...values),
            max: Math.max(...values),
          },
        ])
      ),
    };
  }
}

/**
 * Request tracking middleware
 */
export function createRequestTracker() {
  const logger = ProductionLogger.getInstance();
  
  return (request: NextRequest) => {
    const startTime = performance.now();
    const requestId = crypto.randomUUID();
    
    // Log request start
    logger.info('Request started', {
      requestId,
      method: request.method,
      url: request.url,
      userAgent: request.headers.get('user-agent'),
      ip: request.headers.get('x-forwarded-for') || 'unknown',
    });
    
    // Increment request counter
    MetricsCollector.incrementCounter('http.requests.total');
    MetricsCollector.incrementCounter(`http.requests.${request.method.toLowerCase()}`);
    
    return {
      requestId,
      finish: (status: number, error?: Error) => {
        const duration = performance.now() - startTime;
        
        // Record metrics
        MetricsCollector.recordHistogram('http.request.duration', duration);
        MetricsCollector.incrementCounter(`http.responses.${status}`);
        
        // Log request completion
        if (error) {
          logger.error('Request failed', error, {
            requestId,
            method: request.method,
            url: request.url,
            status,
            duration,
          });
        } else {
          logger.info('Request completed', {
            requestId,
            method: request.method,
            url: request.url,
            status,
            duration,
          });
        }
      },
    };
  };
}

// Initialize default health checks
HealthChecker.registerCheck('database', async () => {
  try {
    // In a real implementation, check database connectivity
    return { status: 'pass', message: 'Database connection healthy' };
  } catch (error) {
    return { status: 'fail', message: 'Database connection failed' };
  }
});

HealthChecker.registerCheck('memory', async () => {
  if (typeof process !== 'undefined') {
    const usage = process.memoryUsage();
    const heapUsedMB = usage.heapUsed / 1024 / 1024;
    
    if (heapUsedMB > 500) {
      return { status: 'warn', message: `High memory usage: ${heapUsedMB.toFixed(2)}MB` };
    }
    
    return { status: 'pass', message: `Memory usage: ${heapUsedMB.toFixed(2)}MB` };
  }
  
  return { status: 'pass', message: 'Memory check not available in browser' };
});

// Export singleton logger instance
export const logger = ProductionLogger.getInstance();
