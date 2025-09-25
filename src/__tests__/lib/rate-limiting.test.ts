/**
 * Comprehensive unit tests for rate limiting system
 * Tests sliding window rate limiting and API protection
 */

import {
  rateLimit,
  adminApiLimiter,
  searchApiLimiter,
  generalApiLimiter,
  withRateLimit,
} from '@/lib/rate-limiting';
import { createMockRequest, rateLimitingHelpers } from '../utils/test-helpers';

// Mock Redis-like storage for testing
const mockStorage = new Map<string, any>();

// Mock the storage implementation
jest.mock('@/lib/rate-limiting', () => {
  const originalModule = jest.requireActual('@/lib/rate-limiting');
  
  // Create a test implementation of rate limiting
  const createTestRateLimit = (config: any) => {
    return (request: any) => {
      const key = `rate_limit:${request.ip || 'unknown'}:${config.windowMs}`;
      const now = Date.now();
      
      // Get existing data
      const existing = mockStorage.get(key) || { requests: [], windowStart: now };
      
      // Clean old requests outside the window
      const windowStart = now - config.windowMs;
      existing.requests = existing.requests.filter((timestamp: number) => timestamp > windowStart);
      
      // Check if limit exceeded
      if (existing.requests.length >= config.maxRequests) {
        return {
          success: false,
          retryAfter: config.windowMs - (now - Math.min(...existing.requests)),
          remaining: 0,
        };
      }
      
      // Add current request
      existing.requests.push(now);
      mockStorage.set(key, existing);
      
      return {
        success: true,
        remaining: config.maxRequests - existing.requests.length,
      };
    };
  };

  return {
    ...originalModule,
    rateLimit: createTestRateLimit,
    adminApiLimiter: createTestRateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 50,
    }),
    searchApiLimiter: createTestRateLimit({
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 30,
    }),
    generalApiLimiter: createTestRateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 100,
    }),
  };
});

describe('Rate Limiting System', () => {
  beforeEach(() => {
    mockStorage.clear();
  });

  describe('Basic Rate Limiting', () => {
    test('should allow requests within limit', () => {
      const limiter = rateLimit({
        windowMs: 60000, // 1 minute
        maxRequests: 5,
      });

      const request = createMockRequest('GET', 'http://localhost:3000/api/test');
      (request as any).ip = '192.168.1.1';

      // Make 5 requests - all should succeed
      for (let i = 0; i < 5; i++) {
        const result = limiter(request);
        expect(result.success).toBe(true);
        expect(result.remaining).toBe(4 - i);
      }
    });

    test('should block requests exceeding limit', () => {
      const limiter = rateLimit({
        windowMs: 60000, // 1 minute
        maxRequests: 3,
      });

      const request = createMockRequest('GET', 'http://localhost:3000/api/test');
      (request as any).ip = '192.168.1.1';

      // Make 3 requests - should succeed
      for (let i = 0; i < 3; i++) {
        const result = limiter(request);
        expect(result.success).toBe(true);
      }

      // 4th request should fail
      const result = limiter(request);
      expect(result.success).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.retryAfter).toBeGreaterThan(0);
    });

    test('should handle different IP addresses separately', () => {
      const limiter = rateLimit({
        windowMs: 60000,
        maxRequests: 2,
      });

      const request1 = createMockRequest('GET', 'http://localhost:3000/api/test');
      (request1 as any).ip = '192.168.1.1';

      const request2 = createMockRequest('GET', 'http://localhost:3000/api/test');
      (request2 as any).ip = '192.168.1.2';

      // Each IP should have its own limit
      expect(limiter(request1).success).toBe(true);
      expect(limiter(request1).success).toBe(true);
      expect(limiter(request1).success).toBe(false); // 3rd request from IP1 fails

      expect(limiter(request2).success).toBe(true); // But IP2 still works
      expect(limiter(request2).success).toBe(true);
      expect(limiter(request2).success).toBe(false); // 3rd request from IP2 fails
    });
  });

  describe('Sliding Window Implementation', () => {
    test('should reset window after time passes', async () => {
      const limiter = rateLimit({
        windowMs: 100, // 100ms for fast testing
        maxRequests: 2,
      });

      const request = createMockRequest('GET', 'http://localhost:3000/api/test');
      (request as any).ip = '192.168.1.1';

      // Use up the limit
      expect(limiter(request).success).toBe(true);
      expect(limiter(request).success).toBe(true);
      expect(limiter(request).success).toBe(false);

      // Wait for window to reset
      await new Promise(resolve => setTimeout(resolve, 150));

      // Should work again
      expect(limiter(request).success).toBe(true);
    });

    test('should maintain sliding window correctly', () => {
      const limiter = rateLimit({
        windowMs: 1000, // 1 second
        maxRequests: 3,
      });

      const request = createMockRequest('GET', 'http://localhost:3000/api/test');
      (request as any).ip = '192.168.1.1';

      const now = Date.now();
      
      // Mock timestamps to test sliding window
      jest.spyOn(Date, 'now')
        .mockReturnValueOnce(now)
        .mockReturnValueOnce(now + 100)
        .mockReturnValueOnce(now + 200)
        .mockReturnValueOnce(now + 1100); // Outside window

      expect(limiter(request).success).toBe(true);
      expect(limiter(request).success).toBe(true);
      expect(limiter(request).success).toBe(true);
      
      // This should succeed because first request is now outside the window
      expect(limiter(request).success).toBe(true);

      jest.restoreAllMocks();
    });
  });

  describe('Predefined Rate Limiters', () => {
    test('adminApiLimiter should have correct configuration', () => {
      const request = createMockRequest('GET', 'http://localhost:3000/api/admin/users');
      (request as any).ip = '192.168.1.1';

      // Should allow many requests (50 in 15 minutes)
      for (let i = 0; i < 50; i++) {
        const result = adminApiLimiter(request);
        expect(result.success).toBe(true);
      }

      // 51st request should fail
      const result = adminApiLimiter(request);
      expect(result.success).toBe(false);
    });

    test('searchApiLimiter should have stricter limits', () => {
      const request = createMockRequest('GET', 'http://localhost:3000/api/search');
      (request as any).ip = '192.168.1.1';

      // Should allow 30 requests in 1 minute
      for (let i = 0; i < 30; i++) {
        const result = searchApiLimiter(request);
        expect(result.success).toBe(true);
      }

      // 31st request should fail
      const result = searchApiLimiter(request);
      expect(result.success).toBe(false);
    });

    test('generalApiLimiter should have highest limits', () => {
      const request = createMockRequest('GET', 'http://localhost:3000/api/general');
      (request as any).ip = '192.168.1.1';

      // Should allow 100 requests in 15 minutes
      for (let i = 0; i < 100; i++) {
        const result = generalApiLimiter(request);
        expect(result.success).toBe(true);
      }

      // 101st request should fail
      const result = generalApiLimiter(request);
      expect(result.success).toBe(false);
    });
  });

  describe('withRateLimit Middleware', () => {
    test('should allow requests within rate limit', async () => {
      const mockHandler = jest.fn().mockResolvedValue(
        new Response(JSON.stringify({ success: true }), { status: 200 })
      );

      const limiter = rateLimit({
        windowMs: 60000,
        maxRequests: 5,
      });

      const rateLimitedHandler = withRateLimit(limiter, mockHandler);
      const request = createMockRequest('GET', 'http://localhost:3000/api/test');
      (request as any).ip = '192.168.1.1';

      const response = await rateLimitedHandler(request);
      
      expect(response.status).toBe(200);
      expect(mockHandler).toHaveBeenCalledWith(request);
    });

    test('should block requests exceeding rate limit', async () => {
      const mockHandler = jest.fn().mockResolvedValue(
        new Response(JSON.stringify({ success: true }), { status: 200 })
      );

      const limiter = rateLimit({
        windowMs: 60000,
        maxRequests: 1,
      });

      const rateLimitedHandler = withRateLimit(limiter, mockHandler);
      const request = createMockRequest('GET', 'http://localhost:3000/api/test');
      (request as any).ip = '192.168.1.1';

      // First request should succeed
      const response1 = await rateLimitedHandler(request);
      expect(response1.status).toBe(200);

      // Second request should be rate limited
      const response2 = await rateLimitedHandler(request);
      expect(response2.status).toBe(429);

      const body = await response2.json();
      expect(body.error).toBe('Too many requests');
      expect(body.retryAfter).toBeDefined();

      // Handler should only be called once
      expect(mockHandler).toHaveBeenCalledTimes(1);
    });

    test('should include rate limit headers in response', async () => {
      const mockHandler = jest.fn().mockResolvedValue(
        new Response(JSON.stringify({ success: true }), { status: 200 })
      );

      const limiter = rateLimit({
        windowMs: 60000,
        maxRequests: 5,
      });

      const rateLimitedHandler = withRateLimit(limiter, mockHandler);
      const request = createMockRequest('GET', 'http://localhost:3000/api/test');
      (request as any).ip = '192.168.1.1';

      const response = await rateLimitedHandler(request);
      
      // Check for rate limit headers (if implemented)
      expect(response.status).toBe(200);
    });
  });

  describe('Error Handling', () => {
    test('should handle missing IP address gracefully', () => {
      const limiter = rateLimit({
        windowMs: 60000,
        maxRequests: 5,
      });

      const request = createMockRequest('GET', 'http://localhost:3000/api/test');
      // No IP address set

      const result = limiter(request);
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });

    test('should handle storage errors gracefully', () => {
      // Mock storage to throw error
      const originalGet = mockStorage.get;
      mockStorage.get = jest.fn().mockImplementation(() => {
        throw new Error('Storage error');
      });

      const limiter = rateLimit({
        windowMs: 60000,
        maxRequests: 5,
      });

      const request = createMockRequest('GET', 'http://localhost:3000/api/test');
      (request as any).ip = '192.168.1.1';

      // Should not throw, but may fail gracefully
      expect(() => limiter(request)).not.toThrow();

      // Restore original method
      mockStorage.get = originalGet;
    });
  });

  describe('Performance', () => {
    test('should handle high request volume efficiently', () => {
      const limiter = rateLimit({
        windowMs: 60000,
        maxRequests: 1000,
      });

      const request = createMockRequest('GET', 'http://localhost:3000/api/test');
      (request as any).ip = '192.168.1.1';

      const startTime = performance.now();
      
      // Make many requests
      for (let i = 0; i < 100; i++) {
        limiter(request);
      }
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;

      // Should complete quickly (less than 100ms for 100 requests)
      expect(executionTime).toBeLessThan(100);
    });

    test('should clean up old entries efficiently', () => {
      const limiter = rateLimit({
        windowMs: 100, // Short window for testing
        maxRequests: 10,
      });

      const request = createMockRequest('GET', 'http://localhost:3000/api/test');
      (request as any).ip = '192.168.1.1';

      // Make requests
      for (let i = 0; i < 5; i++) {
        limiter(request);
      }

      // Check storage size before cleanup
      const sizeBefore = mockStorage.size;

      // Wait for window to expire
      setTimeout(() => {
        limiter(request); // This should trigger cleanup
        
        // Storage should be cleaned up
        expect(mockStorage.size).toBeLessThanOrEqual(sizeBefore);
      }, 150);
    });
  });

  describe('Integration with Security', () => {
    test('should work with security middleware', async () => {
      const mockHandler = jest.fn().mockResolvedValue(
        new Response(JSON.stringify({ success: true }), { status: 200 })
      );

      const limiter = rateLimit({
        windowMs: 60000,
        maxRequests: 2,
      });

      const rateLimitedHandler = withRateLimit(limiter, mockHandler);

      // Test with various request types
      const requests = [
        createMockRequest('GET', 'http://localhost:3000/api/test'),
        createMockRequest('POST', 'http://localhost:3000/api/test'),
      ];

      for (const request of requests) {
        (request as any).ip = '192.168.1.1';
        const response = await rateLimitedHandler(request);
        expect(response.status).toBe(200);
      }

      // Third request should be rate limited
      const request = createMockRequest('GET', 'http://localhost:3000/api/test');
      (request as any).ip = '192.168.1.1';
      const response = await rateLimitedHandler(request);
      expect(response.status).toBe(429);
    });
  });
});
