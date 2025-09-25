/**
 * Comprehensive unit tests for input validation system
 * Tests security-focused input validation and sanitization
 */

import {
  secureSearchQuery,
  secureEmail,
  securePassword,
  secureUrl,
  secureFileName,
  validateUserInput,
  sanitizeInput,
  escapeRegex,
} from '@/lib/input-validation';
import { securityTestCases } from '../utils/test-helpers';

describe('Input Validation System', () => {
  describe('Secure Search Query Validation', () => {
    test('should accept valid search queries', () => {
      const validQueries = [
        'normal search term',
        'user@example.com',
        'John Doe',
        'product-name',
        'search with spaces',
        '123456',
      ];

      validQueries.forEach(query => {
        const result = secureSearchQuery.safeParse(query);
        expect(result.success).toBe(true);
      });
    });

    test('should reject queries that are too long', () => {
      const longQuery = 'a'.repeat(101);
      const result = secureSearchQuery.safeParse(longQuery);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe('Search query too long');
    });

    test('should reject dangerous regex patterns', () => {
      const dangerousPatterns = [
        '(?=.*)',
        '(?!.*)',
        '(?<=.*)',
        '(?<!.*)',
      ];

      dangerousPatterns.forEach(pattern => {
        const result = secureSearchQuery.safeParse(pattern);
        expect(result.success).toBe(false);
        expect(result.error?.issues[0].message).toBe('Invalid search query');
      });
    });

    test('should accept safe regex-like patterns', () => {
      const safePatterns = [
        'user.*',
        'test[123]',
        'normal+search',
        'email@domain.com',
      ];

      safePatterns.forEach(pattern => {
        const result = secureSearchQuery.safeParse(pattern);
        expect(result.success).toBe(true);
      });
    });
  });

  describe('Secure Email Validation', () => {
    test('should accept valid email addresses', () => {
      const validEmails = [
        'user@example.com',
        'test.email+tag@domain.co.uk',
        'user123@test-domain.org',
        'firstname.lastname@company.com',
        'user+tag@domain.com',
      ];

      validEmails.forEach(email => {
        const result = secureEmail.safeParse(email);
        expect(result.success).toBe(true);
      });
    });

    test('should reject invalid email formats', () => {
      const invalidEmails = [
        'invalid-email',
        '@domain.com',
        'user@',
        'user..double.dot@domain.com',
        'user@domain',
        'user@.domain.com',
        'user@domain..com',
      ];

      invalidEmails.forEach(email => {
        const result = secureEmail.safeParse(email);
        expect(result.success).toBe(false);
      });
    });

    test('should reject emails that are too long', () => {
      const longEmail = 'a'.repeat(250) + '@domain.com';
      const result = secureEmail.safeParse(longEmail);
      expect(result.success).toBe(false);
    });

    test('should reject emails with dangerous characters', () => {
      const dangerousEmails = [
        'user<script>@domain.com',
        'user@domain.com<script>',
        'user"@domain.com',
        "user'@domain.com",
      ];

      dangerousEmails.forEach(email => {
        const result = secureEmail.safeParse(email);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('Secure Password Validation', () => {
    test('should accept strong passwords', () => {
      const strongPasswords = [
        'StrongPass123!',
        'MySecure@Password1',
        'Complex#Pass2024',
        'Secure$123Password',
      ];

      strongPasswords.forEach(password => {
        const result = securePassword.safeParse(password);
        expect(result.success).toBe(true);
      });
    });

    test('should reject passwords that are too short', () => {
      const shortPassword = 'Short1!';
      const result = securePassword.safeParse(shortPassword);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe('Password must be at least 8 characters');
    });

    test('should reject passwords without uppercase letters', () => {
      const password = 'lowercase123!';
      const result = securePassword.safeParse(password);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe('Password must contain at least one uppercase letter');
    });

    test('should reject passwords without lowercase letters', () => {
      const password = 'UPPERCASE123!';
      const result = securePassword.safeParse(password);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe('Password must contain at least one lowercase letter');
    });

    test('should reject passwords without numbers', () => {
      const password = 'NoNumbers!';
      const result = securePassword.safeParse(password);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe('Password must contain at least one number');
    });

    test('should reject passwords without special characters', () => {
      const password = 'NoSpecialChars123';
      const result = securePassword.safeParse(password);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe('Password must contain at least one special character');
    });

    test('should reject common passwords', () => {
      const commonPasswords = [
        'Password123!',
        'Admin123!',
        'Welcome123!',
        'Qwerty123!',
      ];

      commonPasswords.forEach(password => {
        const result = securePassword.safeParse(password);
        expect(result.success).toBe(false);
        expect(result.error?.issues[0].message).toBe('Password is too common');
      });
    });
  });

  describe('Secure URL Validation', () => {
    test('should accept valid HTTPS URLs', () => {
      const validUrls = [
        'https://example.com',
        'https://sub.domain.com/path',
        'https://example.com:8080/path?query=value',
        'https://localhost:3000',
      ];

      validUrls.forEach(url => {
        const result = secureUrl.safeParse(url);
        expect(result.success).toBe(true);
      });
    });

    test('should accept valid HTTP URLs for localhost', () => {
      const localhostUrls = [
        'http://localhost:3000',
        'http://127.0.0.1:8080',
      ];

      localhostUrls.forEach(url => {
        const result = secureUrl.safeParse(url);
        expect(result.success).toBe(true);
      });
    });

    test('should reject dangerous URL schemes', () => {
      const dangerousUrls = [
        'javascript:alert(1)',
        'data:text/html,<script>alert(1)</script>',
        'file:///etc/passwd',
        'ftp://example.com',
      ];

      dangerousUrls.forEach(url => {
        const result = secureUrl.safeParse(url);
        expect(result.success).toBe(false);
      });
    });

    test('should reject URLs with private IP addresses', () => {
      const privateIpUrls = [
        'https://192.168.1.1',
        'https://10.0.0.1',
        'https://172.16.0.1',
        'https://169.254.1.1',
      ];

      privateIpUrls.forEach(url => {
        const result = secureUrl.safeParse(url);
        expect(result.success).toBe(false);
        expect(result.error?.issues[0].message).toBe('Private IP addresses are not allowed');
      });
    });

    test('should reject non-HTTP(S) URLs', () => {
      const nonHttpUrls = [
        'ftp://example.com',
        'ssh://example.com',
        'telnet://example.com',
      ];

      nonHttpUrls.forEach(url => {
        const result = secureUrl.safeParse(url);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('Secure File Name Validation', () => {
    test('should accept valid file names', () => {
      const validFileNames = [
        'document.pdf',
        'image.jpg',
        'data-file.csv',
        'report_2024.xlsx',
        'presentation.pptx',
      ];

      validFileNames.forEach(fileName => {
        const result = secureFileName.safeParse(fileName);
        expect(result.success).toBe(true);
      });
    });

    test('should reject files with dangerous extensions', () => {
      const dangerousFiles = [
        'malware.exe',
        'script.bat',
        'virus.scr',
        'trojan.com',
        'backdoor.pif',
      ];

      dangerousFiles.forEach(fileName => {
        const result = secureFileName.safeParse(fileName);
        expect(result.success).toBe(false);
        expect(result.error?.issues[0].message).toBe('File type not allowed');
      });
    });

    test('should reject files with path traversal attempts', () => {
      const pathTraversalFiles = [
        '../../../etc/passwd',
        '..\\..\\windows\\system32\\config\\sam',
        'normal-file/../../../etc/passwd',
      ];

      pathTraversalFiles.forEach(fileName => {
        const result = secureFileName.safeParse(fileName);
        expect(result.success).toBe(false);
        expect(result.error?.issues[0].message).toBe('Invalid file name');
      });
    });

    test('should reject files that are too large', () => {
      const largeFileName = 'a'.repeat(256) + '.txt';
      const result = secureFileName.safeParse(largeFileName);
      expect(result.success).toBe(false);
    });
  });

  describe('User Input Validation', () => {
    test('should validate user input with custom rules', () => {
      const validInput = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 25,
      };

      const schema = {
        name: secureSearchQuery,
        email: secureEmail,
        age: (value: any) => typeof value === 'number' && value > 0 && value < 150,
      };

      const result = validateUserInput(validInput, schema);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should return errors for invalid input', () => {
      const invalidInput = {
        name: '<script>alert("xss")</script>',
        email: 'invalid-email',
        age: -5,
      };

      const schema = {
        name: secureSearchQuery,
        email: secureEmail,
        age: (value: any) => typeof value === 'number' && value > 0 && value < 150,
      };

      const result = validateUserInput(invalidInput, schema);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Input Sanitization', () => {
    test('should sanitize HTML content', () => {
      const maliciousInput = '<script>alert("xss")</script>Hello World<img src="x" onerror="alert(1)">';
      const sanitized = sanitizeInput(maliciousInput, 'html');
      
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('onerror');
      expect(sanitized).toContain('Hello World');
    });

    test('should sanitize SQL injection attempts', () => {
      const sqlInjection = "'; DROP TABLE users; --";
      const sanitized = sanitizeInput(sqlInjection, 'sql');
      
      expect(sanitized).not.toContain('DROP TABLE');
      expect(sanitized).not.toContain('--');
    });

    test('should sanitize NoSQL injection attempts', () => {
      const noSqlInjection = '{"$where": "this.username == this.password"}';
      const sanitized = sanitizeInput(noSqlInjection, 'nosql');
      
      expect(sanitized).not.toContain('$where');
    });

    test('should handle plain text sanitization', () => {
      const input = 'Normal text with some <tags> and "quotes"';
      const sanitized = sanitizeInput(input, 'text');
      
      expect(sanitized).toBe('Normal text with some  and quotes');
    });
  });

  describe('Regex Escaping', () => {
    test('should escape special regex characters', () => {
      const input = 'user.*+?^${}()|[]\\';
      const escaped = escapeRegex(input);
      
      expect(escaped).toBe('user\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\]\\\\');
    });

    test('should handle empty strings', () => {
      expect(escapeRegex('')).toBe('');
    });

    test('should handle strings without special characters', () => {
      const input = 'normaltext123';
      expect(escapeRegex(input)).toBe(input);
    });

    test('should prevent regex injection attacks', () => {
      securityTestCases.regexInjection.forEach(payload => {
        const escaped = escapeRegex(payload);
        
        // Try to create a regex with the escaped string - should not throw
        expect(() => new RegExp(escaped)).not.toThrow();
        
        // The escaped version should not match everything
        const regex = new RegExp(escaped);
        expect(regex.test('random string')).toBe(false);
      });
    });
  });

  describe('Performance', () => {
    test('should validate input efficiently', () => {
      const startTime = performance.now();
      
      // Validate many inputs
      for (let i = 0; i < 1000; i++) {
        secureEmail.safeParse(`user${i}@example.com`);
        secureSearchQuery.safeParse(`search term ${i}`);
      }
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      // Should complete quickly (less than 100ms for 2000 validations)
      expect(executionTime).toBeLessThan(100);
    });

    test('should sanitize input efficiently', () => {
      const largeInput = 'a'.repeat(10000);
      const startTime = performance.now();
      
      sanitizeInput(largeInput, 'html');
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      // Should handle large inputs quickly
      expect(executionTime).toBeLessThan(50);
    });
  });

  describe('Edge Cases', () => {
    test('should handle null and undefined inputs', () => {
      expect(() => secureEmail.safeParse(null)).not.toThrow();
      expect(() => secureEmail.safeParse(undefined)).not.toThrow();
      expect(() => sanitizeInput(null as any, 'html')).not.toThrow();
    });

    test('should handle empty strings', () => {
      const result = secureSearchQuery.safeParse('');
      expect(result.success).toBe(true);
    });

    test('should handle unicode characters', () => {
      const unicodeInput = 'café résumé naïve 中文 🚀';
      const result = secureSearchQuery.safeParse(unicodeInput);
      expect(result.success).toBe(true);
    });

    test('should handle very long inputs gracefully', () => {
      const veryLongInput = 'a'.repeat(100000);
      expect(() => sanitizeInput(veryLongInput, 'html')).not.toThrow();
    });
  });
});
