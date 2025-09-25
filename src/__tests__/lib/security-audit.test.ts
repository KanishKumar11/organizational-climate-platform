/**
 * Comprehensive unit tests for security audit system
 * Tests security vulnerabilities detection and prevention
 */

import {
  InputSanitizer,
  RBACValidator,
  RequestValidator,
  SecurityAuditor,
  createSecurityMiddleware,
  SECURITY_HEADERS,
} from '@/lib/security-audit';
import { createMockRequest, securityTestCases } from '../utils/test-helpers';

describe('Security Audit System', () => {
  describe('InputSanitizer', () => {
    describe('HTML Sanitization', () => {
      test('should remove script tags', () => {
        const maliciousInput = '<script>alert("xss")</script>Hello World';
        const sanitized = InputSanitizer.sanitizeHtml(maliciousInput);
        expect(sanitized).toBe('Hello World');
        expect(sanitized).not.toContain('<script>');
      });

      test('should remove iframe tags', () => {
        const maliciousInput = '<iframe src="evil.com"></iframe>Content';
        const sanitized = InputSanitizer.sanitizeHtml(maliciousInput);
        expect(sanitized).toBe('Content');
        expect(sanitized).not.toContain('<iframe>');
      });

      test('should remove javascript: protocols', () => {
        const maliciousInput = '<a href="javascript:alert(1)">Click me</a>';
        const sanitized = InputSanitizer.sanitizeHtml(maliciousInput);
        expect(sanitized).not.toContain('javascript:');
      });

      test('should remove event handlers', () => {
        const maliciousInput = '<div onclick="alert(1)">Content</div>';
        const sanitized = InputSanitizer.sanitizeHtml(maliciousInput);
        expect(sanitized).not.toContain('onclick');
      });

      test('should handle multiple XSS payloads', () => {
        securityTestCases.xssPayloads.forEach(payload => {
          const sanitized = InputSanitizer.sanitizeHtml(payload);
          expect(sanitized).not.toContain('<script>');
          expect(sanitized).not.toContain('javascript:');
          expect(sanitized).not.toContain('onerror');
        });
      });
    });

    describe('SQL Injection Detection', () => {
      test('should detect SQL injection patterns', () => {
        securityTestCases.sqlInjection.forEach(payload => {
          const isInjection = InputSanitizer.detectSqlInjection(payload);
          expect(isInjection).toBe(true);
        });
      });

      test('should not flag legitimate queries', () => {
        const legitimateQueries = [
          'SELECT * FROM users WHERE id = ?',
          'user@example.com',
          'John Doe',
          'search term',
        ];

        legitimateQueries.forEach(query => {
          const isInjection = InputSanitizer.detectSqlInjection(query);
          expect(isInjection).toBe(false);
        });
      });
    });

    describe('NoSQL Injection Detection', () => {
      test('should detect NoSQL injection patterns', () => {
        const noSqlPayloads = [
          '{"$where": "this.username == this.password"}',
          '{"$ne": null}',
          '{"$gt": ""}',
          '{"$regex": ".*"}',
        ];

        noSqlPayloads.forEach(payload => {
          const isInjection = InputSanitizer.detectNoSqlInjection(payload);
          expect(isInjection).toBe(true);
        });
      });
    });

    describe('Email Validation', () => {
      test('should validate legitimate emails', () => {
        const validEmails = [
          'user@example.com',
          'test.email+tag@domain.co.uk',
          'user123@test-domain.org',
        ];

        validEmails.forEach(email => {
          expect(InputSanitizer.validateEmail(email)).toBe(true);
        });
      });

      test('should reject invalid emails', () => {
        const invalidEmails = [
          'invalid-email',
          '@domain.com',
          'user@',
          'user..double.dot@domain.com',
          'a'.repeat(255) + '@domain.com', // Too long
        ];

        invalidEmails.forEach(email => {
          expect(InputSanitizer.validateEmail(email)).toBe(false);
        });
      });
    });

    describe('URL Validation', () => {
      test('should validate legitimate URLs', () => {
        const validUrls = [
          'https://example.com',
          'http://localhost:3000',
          'https://sub.domain.com/path?query=value',
        ];

        validUrls.forEach(url => {
          expect(InputSanitizer.validateUrl(url)).toBe(true);
        });
      });

      test('should reject invalid URLs', () => {
        const invalidUrls = [
          'javascript:alert(1)',
          'ftp://example.com',
          'not-a-url',
          'file:///etc/passwd',
        ];

        invalidUrls.forEach(url => {
          expect(InputSanitizer.validateUrl(url)).toBe(false);
        });
      });
    });

    describe('Database Sanitization', () => {
      test('should escape special characters', () => {
        const input = `It's a "test" with \\ backslash`;
        const sanitized = InputSanitizer.sanitizeForDatabase(input);
        expect(sanitized).toBe(`It\\'s a \\"test\\" with \\\\ backslash`);
      });
    });
  });

  describe('RBACValidator', () => {
    describe('Permission Validation', () => {
      test('should grant permissions to authorized roles', () => {
        expect(RBACValidator.hasPermission('super_admin', 'users.create')).toBe(true);
        expect(RBACValidator.hasPermission('company_admin', 'users.create')).toBe(true);
        expect(RBACValidator.hasPermission('company_admin', 'surveys.create')).toBe(true);
      });

      test('should deny permissions to unauthorized roles', () => {
        expect(RBACValidator.hasPermission('employee', 'users.create')).toBe(false);
        expect(RBACValidator.hasPermission('supervisor', 'system.settings')).toBe(false);
        expect(RBACValidator.hasPermission('leader', 'users.delete')).toBe(false);
      });

      test('should handle unknown permissions', () => {
        expect(RBACValidator.hasPermission('super_admin', 'unknown.permission')).toBe(false);
      });
    });

    describe('Role Hierarchy', () => {
      test('should validate minimum role requirements', () => {
        expect(RBACValidator.hasMinimumRole('super_admin', 'company_admin')).toBe(true);
        expect(RBACValidator.hasMinimumRole('company_admin', 'department_admin')).toBe(true);
        expect(RBACValidator.hasMinimumRole('employee', 'supervisor')).toBe(false);
      });
    });

    describe('Resource Access Control', () => {
      test('should allow super admin access to all resources', () => {
        expect(RBACValidator.canAccessResource('super_admin', 'other-user', 'current-user')).toBe(true);
      });

      test('should allow users to access their own resources', () => {
        expect(RBACValidator.canAccessResource('employee', 'user-123', 'user-123')).toBe(true);
      });

      test('should allow company admins to access company resources', () => {
        expect(RBACValidator.canAccessResource('company_admin', 'other-user', 'current-user')).toBe(true);
      });

      test('should deny unauthorized resource access', () => {
        expect(RBACValidator.canAccessResource('employee', 'other-user', 'current-user')).toBe(false);
      });
    });
  });

  describe('RequestValidator', () => {
    describe('Content Type Validation', () => {
      test('should validate correct content types', () => {
        const request = createMockRequest('POST', 'http://localhost:3000/api/test', {
          headers: { 'content-type': 'application/json' },
        });

        expect(RequestValidator.validateContentType(request, ['application/json'])).toBe(true);
      });

      test('should reject incorrect content types', () => {
        const request = createMockRequest('POST', 'http://localhost:3000/api/test', {
          headers: { 'content-type': 'text/plain' },
        });

        expect(RequestValidator.validateContentType(request, ['application/json'])).toBe(false);
      });
    });

    describe('Origin Validation', () => {
      test('should validate allowed origins', () => {
        const request = createMockRequest('POST', 'http://localhost:3000/api/test', {
          headers: { origin: 'https://example.com' },
        });

        expect(RequestValidator.validateOrigin(request, ['https://example.com'])).toBe(true);
      });

      test('should reject disallowed origins', () => {
        const request = createMockRequest('POST', 'http://localhost:3000/api/test', {
          headers: { origin: 'https://evil.com' },
        });

        expect(RequestValidator.validateOrigin(request, ['https://example.com'])).toBe(false);
      });

      test('should allow same-origin requests without origin header', () => {
        const request = createMockRequest('POST', 'http://localhost:3000/api/test');
        expect(RequestValidator.validateOrigin(request, ['https://example.com'])).toBe(true);
      });
    });

    describe('User Agent Validation', () => {
      test('should validate legitimate user agents', () => {
        const request = createMockRequest('GET', 'http://localhost:3000/api/test', {
          headers: { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        });

        expect(RequestValidator.validateUserAgent(request)).toBe(true);
      });

      test('should block suspicious user agents', () => {
        const suspiciousAgents = ['bot', 'crawler', 'spider', 'scraper'];

        suspiciousAgents.forEach(agent => {
          const request = createMockRequest('GET', 'http://localhost:3000/api/test', {
            headers: { 'user-agent': agent },
          });

          expect(RequestValidator.validateUserAgent(request)).toBe(false);
        });
      });
    });

    describe('Request Size Validation', () => {
      test('should validate request size within limits', () => {
        const request = createMockRequest('POST', 'http://localhost:3000/api/test', {
          headers: { 'content-length': '1000' },
        });

        expect(RequestValidator.validateRequestSize(request, 2000)).toBe(true);
      });

      test('should reject oversized requests', () => {
        const request = createMockRequest('POST', 'http://localhost:3000/api/test', {
          headers: { 'content-length': '3000' },
        });

        expect(RequestValidator.validateRequestSize(request, 2000)).toBe(false);
      });
    });
  });

  describe('SecurityAuditor', () => {
    describe('Request Auditing', () => {
      test('should pass clean requests', () => {
        const request = createMockRequest('GET', 'http://localhost:3000/api/users');
        const audit = SecurityAuditor.auditRequest(request);

        expect(audit.passed).toBe(true);
        expect(audit.issues).toHaveLength(0);
      });

      test('should detect suspicious URL patterns', () => {
        const suspiciousUrls = [
          'http://localhost:3000/api/../../../etc/passwd',
          'http://localhost:3000/api/users?id=<script>alert(1)</script>',
          'http://localhost:3000/api/users?search=\' OR 1=1--',
        ];

        suspiciousUrls.forEach(url => {
          const request = createMockRequest('GET', url);
          const audit = SecurityAuditor.auditRequest(request);

          expect(audit.passed).toBe(false);
          expect(audit.issues.length).toBeGreaterThan(0);
        });
      });

      test('should flag unusual HTTP methods', () => {
        const request = createMockRequest('TRACE', 'http://localhost:3000/api/test');
        const audit = SecurityAuditor.auditRequest(request);

        expect(audit.passed).toBe(false);
        expect(audit.issues).toContain('Unusual HTTP method: TRACE');
      });
    });

    describe('API Endpoint Auditing', () => {
      test('should flag sensitive endpoints without authentication', () => {
        const audit = SecurityAuditor.auditApiEndpoint('/api/admin/users', 'GET');

        expect(audit.passed).toBe(false);
        expect(audit.issues).toContain('Sensitive endpoint accessed without authentication');
      });

      test('should flag insufficient permissions', () => {
        const audit = SecurityAuditor.auditApiEndpoint('/api/admin/users', 'GET', 'employee');

        expect(audit.passed).toBe(false);
        expect(audit.issues).toContain('Insufficient permissions for sensitive endpoint');
      });

      test('should warn about destructive operations', () => {
        const audit = SecurityAuditor.auditApiEndpoint('/api/admin/users', 'DELETE', 'company_admin');

        expect(audit.passed).toBe(true);
        expect(audit.warnings).toContain('Destructive operation on sensitive endpoint');
      });
    });
  });

  describe('Security Headers', () => {
    test('should include all required security headers', () => {
      const requiredHeaders = [
        'Content-Security-Policy',
        'X-Frame-Options',
        'X-Content-Type-Options',
        'X-XSS-Protection',
        'Referrer-Policy',
        'Permissions-Policy',
        'Strict-Transport-Security',
      ];

      requiredHeaders.forEach(header => {
        expect(SECURITY_HEADERS).toHaveProperty(header);
        expect(SECURITY_HEADERS[header]).toBeDefined();
      });
    });

    test('should have secure CSP configuration', () => {
      const csp = SECURITY_HEADERS['Content-Security-Policy'];
      expect(csp).toContain("default-src 'self'");
      expect(csp).toContain("frame-ancestors 'none'");
      expect(csp).toContain("base-uri 'self'");
    });
  });

  describe('Security Middleware', () => {
    test('should create security middleware with default options', () => {
      const middleware = createSecurityMiddleware({});
      expect(middleware).toBeInstanceOf(Function);
    });

    test('should block requests that fail security audit', async () => {
      const middleware = createSecurityMiddleware({});
      const maliciousRequest = createMockRequest('GET', 'http://localhost:3000/api/../../../etc/passwd');

      const result = await middleware(maliciousRequest);

      expect(result).toBeInstanceOf(Response);
      expect(result?.status).toBe(400);
    });
  });
});
