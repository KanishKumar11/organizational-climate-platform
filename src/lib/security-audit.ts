/**
 * Comprehensive security audit utilities
 * Identifies and prevents common security vulnerabilities
 */

import { NextRequest } from 'next/server';

/**
 * Security headers configuration
 */
export const SECURITY_HEADERS = {
  // Content Security Policy
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Note: Remove unsafe-* in production
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' https:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; '),
  
  // Prevent clickjacking
  'X-Frame-Options': 'DENY',
  
  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',
  
  // Enable XSS protection
  'X-XSS-Protection': '1; mode=block',
  
  // Referrer policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  
  // Permissions policy
  'Permissions-Policy': [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'payment=()',
  ].join(', '),
  
  // HSTS (only for HTTPS)
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
};

/**
 * Input sanitization utilities
 */
export class InputSanitizer {
  // HTML sanitization patterns
  private static readonly HTML_PATTERNS = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
    /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi,
    /<link\b[^<]*(?:(?!<\/link>)<[^<]*)*<\/link>/gi,
    /<meta\b[^<]*(?:(?!<\/meta>)<[^<]*)*<\/meta>/gi,
    /javascript:/gi,
    /vbscript:/gi,
    /on\w+\s*=/gi,
  ];
  
  // SQL injection patterns
  private static readonly SQL_PATTERNS = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/gi,
    /(\b(OR|AND)\s+\d+\s*=\s*\d+)/gi,
    /(--|\/\*|\*\/)/g,
    /(\bUNION\b.*\bSELECT\b)/gi,
  ];
  
  // NoSQL injection patterns
  private static readonly NOSQL_PATTERNS = [
    /\$where/gi,
    /\$ne/gi,
    /\$gt/gi,
    /\$lt/gi,
    /\$regex/gi,
    /\$or/gi,
    /\$and/gi,
  ];
  
  static sanitizeHtml(input: string): string {
    let sanitized = input;
    
    this.HTML_PATTERNS.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '');
    });
    
    return sanitized;
  }
  
  static detectSqlInjection(input: string): boolean {
    return this.SQL_PATTERNS.some(pattern => pattern.test(input));
  }
  
  static detectNoSqlInjection(input: string): boolean {
    return this.NOSQL_PATTERNS.some(pattern => pattern.test(input));
  }
  
  static sanitizeForDatabase(input: string): string {
    // Remove potential injection patterns
    let sanitized = input;
    
    // Escape special characters
    sanitized = sanitized.replace(/['"\\]/g, '\\$&');
    
    return sanitized;
  }
  
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
  }
  
  static validateUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      return ['http:', 'https:'].includes(parsed.protocol);
    } catch {
      return false;
    }
  }
}

/**
 * RBAC (Role-Based Access Control) utilities
 */
export class RBACValidator {
  private static readonly ROLE_HIERARCHY = {
    super_admin: 100,
    company_admin: 80,
    department_admin: 60,
    leader: 40,
    supervisor: 30,
    employee: 10,
  };
  
  private static readonly PERMISSIONS = {
    // User management
    'users.create': ['super_admin', 'company_admin'],
    'users.read': ['super_admin', 'company_admin', 'department_admin'],
    'users.update': ['super_admin', 'company_admin'],
    'users.delete': ['super_admin', 'company_admin'],
    
    // Survey management
    'surveys.create': ['super_admin', 'company_admin', 'department_admin'],
    'surveys.read': ['super_admin', 'company_admin', 'department_admin', 'leader'],
    'surveys.update': ['super_admin', 'company_admin', 'department_admin'],
    'surveys.delete': ['super_admin', 'company_admin'],
    
    // Report access
    'reports.create': ['super_admin', 'company_admin', 'department_admin'],
    'reports.read': ['super_admin', 'company_admin', 'department_admin', 'leader'],
    'reports.export': ['super_admin', 'company_admin', 'department_admin'],
    
    // System administration
    'system.settings': ['super_admin'],
    'system.logs': ['super_admin', 'company_admin'],
    'system.backup': ['super_admin'],
  };
  
  static hasPermission(userRole: string, permission: string): boolean {
    const allowedRoles = this.PERMISSIONS[permission as keyof typeof this.PERMISSIONS];
    return allowedRoles ? allowedRoles.includes(userRole) : false;
  }
  
  static hasMinimumRole(userRole: string, minimumRole: string): boolean {
    const userLevel = this.ROLE_HIERARCHY[userRole as keyof typeof this.ROLE_HIERARCHY] || 0;
    const minimumLevel = this.ROLE_HIERARCHY[minimumRole as keyof typeof this.ROLE_HIERARCHY] || 0;
    return userLevel >= minimumLevel;
  }
  
  static canAccessResource(userRole: string, resourceOwnerId: string, userId: string): boolean {
    // Super admins can access everything
    if (userRole === 'super_admin') return true;
    
    // Users can access their own resources
    if (resourceOwnerId === userId) return true;
    
    // Company admins can access company resources
    if (userRole === 'company_admin') return true;
    
    return false;
  }
}

/**
 * Request validation utilities
 */
export class RequestValidator {
  static validateContentType(request: NextRequest, expectedTypes: string[]): boolean {
    const contentType = request.headers.get('content-type');
    if (!contentType) return false;
    
    return expectedTypes.some(type => contentType.includes(type));
  }
  
  static validateOrigin(request: NextRequest, allowedOrigins: string[]): boolean {
    const origin = request.headers.get('origin');
    if (!origin) return true; // Same-origin requests don't have origin header
    
    return allowedOrigins.includes(origin);
  }
  
  static validateUserAgent(request: NextRequest): boolean {
    const userAgent = request.headers.get('user-agent');
    if (!userAgent) return false;
    
    // Block suspicious user agents
    const suspiciousPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
    ];
    
    return !suspiciousPatterns.some(pattern => pattern.test(userAgent));
  }
  
  static validateRequestSize(request: NextRequest, maxSize: number): boolean {
    const contentLength = request.headers.get('content-length');
    if (!contentLength) return true;
    
    return parseInt(contentLength) <= maxSize;
  }
}

/**
 * Security audit runner
 */
export class SecurityAuditor {
  static auditRequest(request: NextRequest): SecurityAuditResult {
    const issues: string[] = [];
    const warnings: string[] = [];
    
    // Check for common security headers
    const securityHeaders = ['x-frame-options', 'x-content-type-options', 'x-xss-protection'];
    securityHeaders.forEach(header => {
      if (!request.headers.get(header)) {
        warnings.push(`Missing security header: ${header}`);
      }
    });
    
    // Check for suspicious patterns in URL
    const url = request.url;
    const suspiciousPatterns = [
      /\.\./,  // Directory traversal
      /<script/i,  // XSS attempt
      /union.*select/i,  // SQL injection
      /javascript:/i,  // JavaScript protocol
    ];
    
    suspiciousPatterns.forEach(pattern => {
      if (pattern.test(url)) {
        issues.push(`Suspicious pattern detected in URL: ${pattern.source}`);
      }
    });
    
    // Check request method
    const method = request.method;
    if (!['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'].includes(method)) {
      issues.push(`Unusual HTTP method: ${method}`);
    }
    
    return {
      passed: issues.length === 0,
      issues,
      warnings,
      timestamp: new Date(),
    };
  }
  
  static auditApiEndpoint(endpoint: string, method: string, userRole?: string): SecurityAuditResult {
    const issues: string[] = [];
    const warnings: string[] = [];
    
    // Check for sensitive endpoints
    const sensitiveEndpoints = ['/api/admin', '/api/system', '/api/users'];
    const isSensitive = sensitiveEndpoints.some(sensitive => endpoint.startsWith(sensitive));
    
    if (isSensitive && !userRole) {
      issues.push('Sensitive endpoint accessed without authentication');
    }
    
    if (isSensitive && userRole && !RBACValidator.hasMinimumRole(userRole, 'department_admin')) {
      issues.push('Insufficient permissions for sensitive endpoint');
    }
    
    // Check for dangerous methods on sensitive endpoints
    if (isSensitive && ['DELETE', 'PUT'].includes(method) && userRole !== 'super_admin') {
      warnings.push('Destructive operation on sensitive endpoint');
    }
    
    return {
      passed: issues.length === 0,
      issues,
      warnings,
      timestamp: new Date(),
    };
  }
}

/**
 * Security audit result interface
 */
export interface SecurityAuditResult {
  passed: boolean;
  issues: string[];
  warnings: string[];
  timestamp: Date;
}

/**
 * Security middleware factory
 */
export function createSecurityMiddleware(options: {
  enableCSP?: boolean;
  enableRateLimit?: boolean;
  enableInputValidation?: boolean;
  allowedOrigins?: string[];
  maxRequestSize?: number;
}) {
  return async (request: NextRequest) => {
    const audit = SecurityAuditor.auditRequest(request);
    
    if (!audit.passed) {
      return new Response(
        JSON.stringify({
          error: 'Security violation detected',
          issues: audit.issues,
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }
    
    // Add security headers to response
    const headers = new Headers();
    if (options.enableCSP) {
      Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
        headers.set(key, value);
      });
    }
    
    return null; // Continue to next middleware
  };
}
