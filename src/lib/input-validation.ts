/**
 * Comprehensive input validation and sanitization utilities
 * Provides security-focused validation for user inputs
 */

import { z } from 'zod';

/**
 * Security-focused string validation
 */
export const secureString = (
  options: {
    minLength?: number;
    maxLength?: number;
    allowSpecialChars?: boolean;
    allowHtml?: boolean;
    pattern?: RegExp;
  } = {}
) => {
  const {
    minLength = 1,
    maxLength = 1000,
    allowSpecialChars = false,
    allowHtml = false,
    pattern,
  } = options;

  return z
    .string()
    .min(minLength, `Must be at least ${minLength} characters`)
    .max(maxLength, `Must be at most ${maxLength} characters`)
    .refine((val) => {
      // Check for HTML injection if not allowed
      if (!allowHtml && /<[^>]*>/g.test(val)) {
        return false;
      }
      return true;
    }, 'HTML tags are not allowed')
    .refine((val) => {
      // Check for dangerous special characters if not allowed
      if (!allowSpecialChars && /[<>'"&;(){}[\]\\]/.test(val)) {
        return false;
      }
      return true;
    }, 'Special characters are not allowed')
    .refine((val) => {
      // Apply custom pattern if provided
      if (pattern && !pattern.test(val)) {
        return false;
      }
      return true;
    }, 'Invalid format')
    .transform((val) => val.trim()); // Always trim whitespace
};

/**
 * Email validation with additional security checks
 */
export const secureEmail = z
  .string()
  .email('Invalid email format')
  .max(254, 'Email too long') // RFC 5321 limit
  .refine((email) => {
    // Check for suspicious patterns
    const suspiciousPatterns = [
      /\.\./, // Double dots
      /^\./, // Starting with dot
      /\.$/, // Ending with dot
      /@.*@/, // Multiple @ symbols
    ];
    return !suspiciousPatterns.some((pattern) => pattern.test(email));
  }, 'Invalid email format')
  .transform((email) => email.toLowerCase().trim());

/**
 * Password validation with security requirements
 */
export const securePassword = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password too long')
  .refine((password) => {
    // Check for at least one uppercase letter
    return /[A-Z]/.test(password);
  }, 'Password must contain at least one uppercase letter')
  .refine((password) => {
    // Check for at least one lowercase letter
    return /[a-z]/.test(password);
  }, 'Password must contain at least one lowercase letter')
  .refine((password) => {
    // Check for at least one number
    return /\d/.test(password);
  }, 'Password must contain at least one number')
  .refine((password) => {
    // Check for at least one special character
    return /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>?]/.test(password);
  }, 'Password must contain at least one special character')
  .refine((password) => {
    // Check for common weak passwords
    const weakPasswords = [
      'password',
      'password123',
      '123456789',
      'qwerty123',
      'admin123',
      'welcome123',
      'letmein123',
    ];
    return !weakPasswords.includes(password.toLowerCase());
  }, 'Password is too common');

/**
 * Search query validation to prevent injection
 */
export const secureSearchQuery = z
  .string()
  .max(100, 'Search query too long')
  .refine((query) => {
    // Prevent regex injection patterns
    const dangerousPatterns = [
      /\(\?\=/, // Positive lookahead
      /\(\?\!/, // Negative lookahead
      /\(\?\<\=/, // Positive lookbehind
      /\(\?\<\!/, // Negative lookbehind
      /\(\?\:/, // Non-capturing group
      /\*\+/, // Catastrophic backtracking
      /\+\*/, // Catastrophic backtracking
      /\{\d+,\d*\}\+/, // Nested quantifiers
    ];
    return !dangerousPatterns.some((pattern) => pattern.test(query));
  }, 'Invalid search query')
  .transform((query) => query.trim());

/**
 * URL validation with security checks
 */
export const secureUrl = z
  .string()
  .url('Invalid URL format')
  .max(2048, 'URL too long')
  .refine((url) => {
    try {
      const parsed = new URL(url);
      // Only allow http and https protocols
      return ['http:', 'https:'].includes(parsed.protocol);
    } catch {
      return false;
    }
  }, 'Only HTTP and HTTPS URLs are allowed')
  .refine((url) => {
    try {
      const parsed = new URL(url);
      // Prevent localhost and private IP access
      const hostname = parsed.hostname;
      const privatePatterns = [
        /^localhost$/i,
        /^127\./,
        /^10\./,
        /^172\.(1[6-9]|2\d|3[01])\./,
        /^192\.168\./,
        /^::1$/,
        /^fc00:/,
        /^fe80:/,
      ];
      return !privatePatterns.some((pattern) => pattern.test(hostname));
    } catch {
      return false;
    }
  }, 'Private URLs are not allowed');

/**
 * File name validation
 */
export const secureFileName = z
  .string()
  .min(1, 'File name required')
  .max(255, 'File name too long')
  .refine((name) => {
    // Check for dangerous file name patterns
    const dangerousPatterns = [
      /\.\./, // Directory traversal
      /^\./, // Hidden files
      /[<>:"|?*]/, // Windows reserved characters
      /[\x00-\x1f]/, // Control characters
    ];
    return !dangerousPatterns.some((pattern) => pattern.test(name));
  }, 'Invalid file name')
  .refine((name) => {
    // Check for dangerous extensions
    const dangerousExtensions = [
      '.exe',
      '.bat',
      '.cmd',
      '.com',
      '.pif',
      '.scr',
      '.vbs',
      '.js',
      '.jar',
      '.php',
      '.asp',
      '.aspx',
      '.jsp',
      '.sh',
      '.ps1',
    ];
    const extension = name.toLowerCase().substring(name.lastIndexOf('.'));
    return !dangerousExtensions.includes(extension);
  }, 'File type not allowed');

/**
 * MongoDB ObjectId validation
 */
export const mongoObjectId = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format');

/**
 * Pagination parameters validation
 */
export const paginationParams = z.object({
  page: z.coerce.number().int().min(1).max(10000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  sort: z.string().max(50).optional(),
  order: z.enum(['asc', 'desc']).default('desc'),
});

/**
 * Date range validation
 */
export const dateRange = z
  .object({
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
  })
  .refine((data) => {
    return data.startDate <= data.endDate;
  }, 'Start date must be before end date')
  .refine((data) => {
    // Prevent extremely large date ranges (more than 10 years)
    const maxRange = 10 * 365 * 24 * 60 * 60 * 1000; // 10 years in milliseconds
    return data.endDate.getTime() - data.startDate.getTime() <= maxRange;
  }, 'Date range too large');

/**
 * Role validation
 */
export const userRole = z.enum([
  'employee',
  'supervisor',
  'leader',
  'department_admin',
  'company_admin',
  'super_admin',
]);

/**
 * Survey status validation
 */
export const surveyStatus = z.enum([
  'draft',
  'active',
  'paused',
  'completed',
  'archived',
]);

/**
 * Sanitize HTML content
 */
export function sanitizeHtml(html: string): string {
  // Basic HTML sanitization - in production, use a library like DOMPurify
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
    .replace(/<link\b[^<]*(?:(?!<\/link>)<[^<]*)*<\/link>/gi, '')
    .replace(/<meta\b[^<]*(?:(?!<\/meta>)<[^<]*)*<\/meta>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/vbscript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
}

/**
 * Escape special characters for regex
 */
export function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Validate and sanitize user input
 */
export function validateAndSanitize<T>(
  schema: z.ZodSchema<T>,
  input: unknown
): { success: true; data: T } | { success: false; errors: string[] } {
  try {
    const result = schema.parse(input);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.issues.map(
        (err) => `${err.path.join('.')}: ${err.message}`
      );
      return { success: false, errors };
    }
    return { success: false, errors: ['Validation failed'] };
  }
}

/**
 * Rate limiting key generator with input validation
 */
export function generateRateLimitKey(
  identifier: string,
  endpoint: string
): string {
  // Validate inputs
  const safeIdentifier = identifier.replace(/[^a-zA-Z0-9._-]/g, '');
  const safeEndpoint = endpoint.replace(/[^a-zA-Z0-9/_-]/g, '');

  return `${safeEndpoint}:${safeIdentifier}`;
}
