/**
 * Rate limiting utilities for API endpoints
 * Implements sliding window rate limiting with Redis-like functionality
 */

import { NextRequest } from 'next/server';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyGenerator?: (request: NextRequest) => string; // Custom key generator
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  skipFailedRequests?: boolean; // Don't count failed requests
}

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

// In-memory store for rate limiting (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Cleanup every minute

/**
 * Default key generator using IP address and user agent
 */
function defaultKeyGenerator(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';
  return `${ip}:${userAgent}`;
}

/**
 * Rate limiting function
 */
export function rateLimit(config: RateLimitConfig) {
  return (request: NextRequest): RateLimitResult => {
    const keyGenerator = config.keyGenerator || defaultKeyGenerator;
    const key = keyGenerator(request);
    const now = Date.now();
    const windowStart = now - config.windowMs;

    // Get or create rate limit entry
    let entry = rateLimitStore.get(key);

    if (!entry || now > entry.resetTime) {
      // Create new entry or reset expired entry
      entry = {
        count: 0,
        resetTime: now + config.windowMs,
      };
      rateLimitStore.set(key, entry);
    }

    // Check if limit exceeded
    if (entry.count >= config.maxRequests) {
      return {
        success: false,
        limit: config.maxRequests,
        remaining: 0,
        resetTime: entry.resetTime,
        retryAfter: Math.ceil((entry.resetTime - now) / 1000),
      };
    }

    // Increment counter
    entry.count++;
    rateLimitStore.set(key, entry);

    return {
      success: true,
      limit: config.maxRequests,
      remaining: config.maxRequests - entry.count,
      resetTime: entry.resetTime,
    };
  };
}

/**
 * Predefined rate limiters for different endpoints
 */

// General API rate limiter - 100 requests per 15 minutes
export const generalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100,
});

// Search API rate limiter - 30 requests per minute (more restrictive for search)
export const searchApiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 30,
});

// Authentication rate limiter - 5 attempts per 15 minutes
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5,
});

// Admin operations rate limiter - 50 requests per 15 minutes
export const adminApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 50,
});

// File upload rate limiter - 10 uploads per hour
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 10,
});

// Notification API rate limiter - 50 requests per 15 minutes
export const notificationApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 50,
});

// Notification creation rate limiter - 10 notifications per hour per user
export const notificationCreateLimiter = userSpecificLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 10,
});

// Notification bulk operations rate limiter - 5 bulk operations per hour
export const notificationBulkLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 5,
});

/**
 * Middleware helper to apply rate limiting to API routes
 */
export function withRateLimit(
  limiter: (request: NextRequest) => RateLimitResult,
  handler: (request: NextRequest) => Promise<Response>
) {
  return async (request: NextRequest): Promise<Response> => {
    const result = limiter(request);

    if (!result.success) {
      return new Response(
        JSON.stringify({
          error: 'Too many requests',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: result.retryAfter,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': result.limit.toString(),
            'X-RateLimit-Remaining': result.remaining.toString(),
            'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
            'Retry-After': result.retryAfter?.toString() || '60',
          },
        }
      );
    }

    // Add rate limit headers to successful responses
    const response = await handler(request);

    // Clone response to add headers
    const newResponse = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });

    newResponse.headers.set('X-RateLimit-Limit', result.limit.toString());
    newResponse.headers.set(
      'X-RateLimit-Remaining',
      result.remaining.toString()
    );
    newResponse.headers.set(
      'X-RateLimit-Reset',
      new Date(result.resetTime).toISOString()
    );

    return newResponse;
  };
}

/**
 * User-specific rate limiter (requires authentication)
 */
export function userSpecificLimiter(config: RateLimitConfig) {
  return rateLimit({
    ...config,
    keyGenerator: (request: NextRequest) => {
      // Extract user ID from session/token if available
      // For now, fall back to IP-based limiting
      return defaultKeyGenerator(request);
    },
  });
}

/**
 * IP-based rate limiter with whitelist support
 */
export function ipBasedLimiter(
  config: RateLimitConfig & { whitelist?: string[] }
) {
  return rateLimit({
    ...config,
    keyGenerator: (request: NextRequest) => {
      const forwarded = request.headers.get('x-forwarded-for');
      const ip = forwarded ? forwarded.split(',')[0] : 'unknown';

      // Check whitelist
      if (config.whitelist && config.whitelist.includes(ip)) {
        return `whitelisted:${ip}`;
      }

      return `ip:${ip}`;
    },
  });
}

/**
 * Endpoint-specific rate limiter
 */
export function endpointLimiter(endpoint: string, config: RateLimitConfig) {
  return rateLimit({
    ...config,
    keyGenerator: (request: NextRequest) => {
      const baseKey = defaultKeyGenerator(request);
      return `${endpoint}:${baseKey}`;
    },
  });
}
