import { NextRequest, NextResponse } from 'next/server';
import { createTLSMiddleware, enforceHTTPS } from '../lib/tls-validation';
import { validateEncryptionConfig } from '../lib/encryption';

/**
 * Security middleware for data protection and TLS validation
 */

const tlsMiddleware = createTLSMiddleware();

/**
 * Main security middleware function
 */
export function securityMiddleware(request: NextRequest) {
  // Enforce HTTPS in production
  const httpsRedirect = enforceHTTPS(request);
  if (httpsRedirect) {
    return httpsRedirect;
  }

  // Validate TLS configuration
  const tlsValidation = tlsMiddleware.validateRequest(request);

  // Log security warnings in development
  if (
    process.env.NODE_ENV === 'development' &&
    tlsValidation.warnings.length > 0
  ) {
    console.warn('TLS Validation Warnings:', tlsValidation.warnings);
  }

  // Log security errors
  if (tlsValidation.errors.length > 0) {
    console.error('TLS Validation Errors:', tlsValidation.errors);

    // In production, reject requests with TLS errors
    if (process.env.NODE_ENV === 'production') {
      return new NextResponse('Secure connection required', { status: 400 });
    }
  }

  // Create response with security headers
  const response = NextResponse.next();

  // Add security headers
  const securityHeaders = tlsMiddleware.getSecurityHeaders();
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Add custom security headers
  response.headers.set('X-Security-Validated', 'true');
  response.headers.set(
    'X-TLS-Status',
    tlsValidation.isSecure ? 'secure' : 'insecure'
  );

  return response;
}

/**
 * API route security wrapper
 */
export function withSecurity<T extends any[]>(
  handler: (...args: T) => Promise<Response> | Response
) {
  return async (...args: T): Promise<Response> => {
    const request = args[0] as NextRequest;

    // Apply security middleware
    const securityResponse = securityMiddleware(request);
    if (securityResponse && securityResponse.status !== 200) {
      return securityResponse;
    }

    try {
      // Call the original handler
      const response = await handler(...args);

      // Add security headers to API responses
      if (response instanceof Response) {
        const securityHeaders = tlsMiddleware.getSecurityHeaders();
        Object.entries(securityHeaders).forEach(([key, value]) => {
          response.headers.set(key, value);
        });
      }

      return response;
    } catch (error) {
      console.error('API Security Error:', error);
      return new NextResponse('Internal Server Error', { status: 500 });
    }
  };
}

/**
 * Validate encryption configuration on startup
 */
export function validateSecurityConfig(): {
  isValid: boolean;
  errors: string[];
} {
  const encryptionValidation = validateEncryptionConfig();
  const errors = [...encryptionValidation.errors];

  // Check environment variables
  const requiredEnvVars = ['NEXTAUTH_SECRET', 'MONGODB_URI'];

  if (process.env.NODE_ENV === 'production') {
    requiredEnvVars.push('ENCRYPTION_KEY', 'FIELD_ENCRYPTION_KEY');
  }

  requiredEnvVars.forEach((envVar) => {
    if (!process.env[envVar]) {
      errors.push(`Required environment variable ${envVar} is not set`);
    }
  });

  // Check for secure session configuration
  if (process.env.NODE_ENV === 'production') {
    if (
      !process.env.NEXTAUTH_URL ||
      !process.env.NEXTAUTH_URL.startsWith('https://')
    ) {
      errors.push('NEXTAUTH_URL must use HTTPS in production');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Security configuration checker
 */
export class SecurityConfigChecker {
  private static instance: SecurityConfigChecker;
  private configValid: boolean = false;
  private lastCheck: Date | null = null;
  private checkInterval: number = 5 * 60 * 1000; // 5 minutes

  static getInstance(): SecurityConfigChecker {
    if (!SecurityConfigChecker.instance) {
      SecurityConfigChecker.instance = new SecurityConfigChecker();
    }
    return SecurityConfigChecker.instance;
  }

  /**
   * Check security configuration
   */
  checkConfiguration(): {
    isValid: boolean;
    errors: string[];
    lastCheck: Date;
  } {
    const now = new Date();

    // Only check if enough time has passed or first check
    if (
      !this.lastCheck ||
      now.getTime() - this.lastCheck.getTime() > this.checkInterval
    ) {
      const validation = validateSecurityConfig();
      this.configValid = validation.isValid;
      this.lastCheck = now;

      if (!validation.isValid) {
        console.error('Security Configuration Errors:', validation.errors);
      }

      return {
        isValid: validation.isValid,
        errors: validation.errors,
        lastCheck: now,
      };
    }

    return {
      isValid: this.configValid,
      errors: [],
      lastCheck: this.lastCheck,
    };
  }

  /**
   * Get security status
   */
  getSecurityStatus(): {
    configValid: boolean;
    tlsEnabled: boolean;
    encryptionEnabled: boolean;
    environment: string;
  } {
    const config = this.checkConfiguration();

    return {
      configValid: config.isValid,
      tlsEnabled: process.env.NODE_ENV === 'production',
      encryptionEnabled: !!(
        process.env.ENCRYPTION_KEY && process.env.FIELD_ENCRYPTION_KEY
      ),
      environment: process.env.NODE_ENV || 'unknown',
    };
  }
}

/**
 * Request rate limiting for security
 */
export class SecurityRateLimiter {
  private requests: Map<string, number[]> = new Map();
  private maxRequests: number = 100;
  private windowMs: number = 15 * 60 * 1000; // 15 minutes

  constructor(maxRequests: number = 100, windowMs: number = 15 * 60 * 1000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  /**
   * Check if request should be rate limited
   */
  shouldLimit(identifier: string): boolean {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    // Get existing requests for this identifier
    let requests = this.requests.get(identifier) || [];

    // Filter out old requests
    requests = requests.filter((time) => time > windowStart);

    // Check if limit exceeded
    if (requests.length >= this.maxRequests) {
      return true;
    }

    // Add current request
    requests.push(now);
    this.requests.set(identifier, requests);

    return false;
  }

  /**
   * Get remaining requests for identifier
   */
  getRemainingRequests(identifier: string): number {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    const requests = this.requests.get(identifier) || [];
    const validRequests = requests.filter((time) => time > windowStart);

    return Math.max(0, this.maxRequests - validRequests.length);
  }

  /**
   * Clear old entries periodically
   */
  cleanup(): void {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    for (const [identifier, requests] of this.requests.entries()) {
      const validRequests = requests.filter((time) => time > windowStart);

      if (validRequests.length === 0) {
        this.requests.delete(identifier);
      } else {
        this.requests.set(identifier, validRequests);
      }
    }
  }
}

// Global rate limiter instance
const globalRateLimiter = new SecurityRateLimiter();

/**
 * Rate limiting middleware
 */
export function withRateLimit(
  identifier: (req: NextRequest) => string = (req) => req.ip || 'unknown'
) {
  return function <T extends any[]>(
    handler: (...args: T) => Promise<Response> | Response
  ) {
    return async (...args: T): Promise<Response> => {
      const request = args[0] as NextRequest;
      const id = identifier(request);

      if (globalRateLimiter.shouldLimit(id)) {
        return new NextResponse('Too Many Requests', {
          status: 429,
          headers: {
            'Retry-After': '900', // 15 minutes
            'X-RateLimit-Limit': globalRateLimiter.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': (
              Date.now() + globalRateLimiter.windowMs
            ).toString(),
          },
        });
      }

      const response = await handler(...args);

      // Add rate limit headers
      if (response instanceof Response) {
        response.headers.set(
          'X-RateLimit-Limit',
          globalRateLimiter.maxRequests.toString()
        );
        response.headers.set(
          'X-RateLimit-Remaining',
          globalRateLimiter.getRemainingRequests(id).toString()
        );
      }

      return response;
    };
  };
}

export default securityMiddleware;
