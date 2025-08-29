import { IncomingMessage } from 'http';
import { NextRequest } from 'next/server';

/**
 * TLS Configuration and Validation Service
 */

// Security headers configuration
export const SECURITY_HEADERS = {
  // HTTP Strict Transport Security
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',

  // Content Security Policy
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' wss: ws:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; '),

  // Prevent clickjacking
  'X-Frame-Options': 'DENY',

  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',

  // XSS Protection
  'X-XSS-Protection': '1; mode=block',

  // Referrer Policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',

  // Permissions Policy
  'Permissions-Policy': [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'payment=()',
    'usb=()',
  ].join(', '),
};

/**
 * TLS Certificate information
 */
export interface TLSCertInfo {
  subject: string;
  issuer: string;
  validFrom: Date;
  validTo: Date;
  fingerprint: string;
  serialNumber: string;
  isValid: boolean;
  daysUntilExpiry: number;
}

/**
 * TLS Validation result
 */
export interface TLSValidationResult {
  isSecure: boolean;
  protocol?: string;
  cipher?: string;
  errors: string[];
  warnings: string[];
  certificateInfo?: TLSCertInfo;
}

/**
 * TLS Validation Service
 */
export class TLSValidationService {
  private static instance: TLSValidationService;
  private isProduction: boolean;

  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';
  }

  static getInstance(): TLSValidationService {
    if (!TLSValidationService.instance) {
      TLSValidationService.instance = new TLSValidationService();
    }
    return TLSValidationService.instance;
  }

  /**
   * Validate TLS configuration for incoming requests
   */
  validateRequest(req: NextRequest | IncomingMessage): TLSValidationResult {
    const result: TLSValidationResult = {
      isSecure: false,
      errors: [],
      warnings: [],
    };

    // Check if connection is secure
    const isHTTPS = this.isConnectionSecure(req);

    if (!isHTTPS) {
      if (this.isProduction) {
        result.errors.push('HTTPS is required in production environment');
      } else {
        result.warnings.push('Connection is not using HTTPS');
      }
    } else {
      result.isSecure = true;
    }

    // Validate TLS version and cipher
    const tlsInfo = this.extractTLSInfo(req);
    if (tlsInfo.protocol) {
      result.protocol = tlsInfo.protocol;

      // Check for minimum TLS version
      if (!this.isMinimumTLSVersion(tlsInfo.protocol)) {
        result.errors.push(
          `TLS version ${tlsInfo.protocol} is below minimum required (TLS 1.2)`
        );
      }
    }

    if (tlsInfo.cipher) {
      result.cipher = tlsInfo.cipher;

      // Check for weak ciphers
      if (this.isWeakCipher(tlsInfo.cipher)) {
        result.warnings.push(`Cipher ${tlsInfo.cipher} may be weak`);
      }
    }

    // Validate security headers
    this.validateSecurityHeaders(req, result);

    return result;
  }

  /**
   * Check if connection is secure (HTTPS)
   */
  private isConnectionSecure(req: NextRequest | IncomingMessage): boolean {
    // Check various indicators of HTTPS
    if ('url' in req && req.url) {
      return req.url.startsWith('https://');
    }

    // Check headers for proxy forwarding
    const headers = 'headers' in req ? req.headers : (req as any).headers;

    if (headers) {
      // Check X-Forwarded-Proto header (common with load balancers)
      const forwardedProto =
        headers['x-forwarded-proto'] || headers['X-Forwarded-Proto'];
      if (forwardedProto === 'https') return true;

      // Check X-Forwarded-SSL header
      const forwardedSSL =
        headers['x-forwarded-ssl'] || headers['X-Forwarded-SSL'];
      if (forwardedSSL === 'on') return true;

      // Check Cloudflare headers
      const cfVisitor = headers['cf-visitor'] || headers['CF-Visitor'];
      if (cfVisitor && typeof cfVisitor === 'string') {
        try {
          const visitor = JSON.parse(cfVisitor);
          if (visitor.scheme === 'https') return true;
        } catch (e) {
          // Ignore JSON parse errors
        }
      }
    }

    // Check if running on secure port
    const connection = (req as any).connection;
    if (connection && connection.encrypted) return true;

    return false;
  }

  /**
   * Extract TLS information from request
   */
  private extractTLSInfo(req: NextRequest | IncomingMessage): {
    protocol?: string;
    cipher?: string;
  } {
    const connection = (req as any).connection;
    const socket = (req as any).socket;

    let protocol: string | undefined;
    let cipher: string | undefined;

    // Try to get TLS info from connection
    if (connection && connection.getProtocol) {
      protocol = connection.getProtocol();
    } else if (socket && socket.getProtocol) {
      protocol = socket.getProtocol();
    }

    // Try to get cipher info
    if (connection && connection.getCipher) {
      const cipherInfo = connection.getCipher();
      cipher = cipherInfo ? cipherInfo.name : undefined;
    } else if (socket && socket.getCipher) {
      const cipherInfo = socket.getCipher();
      cipher = cipherInfo ? cipherInfo.name : undefined;
    }

    return { protocol, cipher };
  }

  /**
   * Check if TLS version meets minimum requirements
   */
  private isMinimumTLSVersion(protocol: string): boolean {
    // Require TLS 1.2 or higher
    const minVersions = ['TLSv1.2', 'TLSv1.3'];
    return minVersions.some((version) => protocol.includes(version));
  }

  /**
   * Check if cipher is considered weak
   */
  private isWeakCipher(cipher: string): boolean {
    const weakCiphers = [
      'RC4',
      'DES',
      '3DES',
      'MD5',
      'SHA1',
      'NULL',
      'EXPORT',
      'ADH',
      'AECDH',
    ];

    return weakCiphers.some((weak) => cipher.toUpperCase().includes(weak));
  }

  /**
   * Validate security headers
   */
  private validateSecurityHeaders(
    req: NextRequest | IncomingMessage,
    result: TLSValidationResult
  ): void {
    const headers = 'headers' in req ? req.headers : (req as any).headers;

    if (!headers) return;

    // Check for required security headers in response (this would be set by middleware)
    const requiredHeaders = [
      'strict-transport-security',
      'x-frame-options',
      'x-content-type-options',
      'x-xss-protection',
    ];

    requiredHeaders.forEach((header) => {
      if (!headers[header] && !headers[header.toLowerCase()]) {
        result.warnings.push(`Missing security header: ${header}`);
      }
    });
  }

  /**
   * Get recommended security headers for responses
   */
  getSecurityHeaders(): Record<string, string> {
    const headers = { ...SECURITY_HEADERS };

    // Adjust CSP for development
    if (!this.isProduction) {
      headers['Content-Security-Policy'] = headers['Content-Security-Policy']
        .replace("'unsafe-inline'", "'unsafe-inline' 'unsafe-eval'")
        .replace(
          "connect-src 'self' wss: ws:",
          "connect-src 'self' wss: ws: http://localhost:* ws://localhost:*"
        );
    }

    return headers;
  }

  /**
   * Validate certificate information
   */
  validateCertificate(cert: any): TLSCertInfo {
    const now = new Date();
    const validFrom = new Date(cert.valid_from);
    const validTo = new Date(cert.valid_to);
    const daysUntilExpiry = Math.floor(
      (validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      subject: cert.subject?.CN || 'Unknown',
      issuer: cert.issuer?.CN || 'Unknown',
      validFrom,
      validTo,
      fingerprint: cert.fingerprint || '',
      serialNumber: cert.serialNumber || '',
      isValid: now >= validFrom && now <= validTo,
      daysUntilExpiry,
    };
  }

  /**
   * Check if certificate is expiring soon
   */
  isCertificateExpiringSoon(
    cert: TLSCertInfo,
    warningDays: number = 30
  ): boolean {
    return cert.daysUntilExpiry <= warningDays && cert.daysUntilExpiry > 0;
  }

  /**
   * Generate TLS configuration report
   */
  generateTLSReport(): {
    environment: string;
    isProduction: boolean;
    securityHeaders: Record<string, string>;
    recommendations: string[];
  } {
    const recommendations: string[] = [];

    if (this.isProduction) {
      recommendations.push('Ensure HTTPS is enforced for all connections');
      recommendations.push('Use TLS 1.2 or higher');
      recommendations.push('Implement HSTS with long max-age');
      recommendations.push('Use strong cipher suites only');
      recommendations.push('Monitor certificate expiration dates');
    } else {
      recommendations.push('Consider using HTTPS in development for testing');
      recommendations.push('Test security headers in development environment');
    }

    return {
      environment: process.env.NODE_ENV || 'unknown',
      isProduction: this.isProduction,
      securityHeaders: this.getSecurityHeaders(),
      recommendations,
    };
  }
}

/**
 * Middleware function to validate TLS and add security headers
 */
export function createTLSMiddleware() {
  const tlsService = TLSValidationService.getInstance();

  return {
    /**
     * Validate incoming request TLS
     */
    validateRequest: (req: NextRequest | IncomingMessage) => {
      return tlsService.validateRequest(req);
    },

    /**
     * Get security headers for response
     */
    getSecurityHeaders: () => {
      return tlsService.getSecurityHeaders();
    },

    /**
     * Add security headers to response
     */
    addSecurityHeaders: (headers: Headers | Record<string, string>) => {
      const securityHeaders = tlsService.getSecurityHeaders();

      Object.entries(securityHeaders).forEach(([key, value]) => {
        if ('set' in headers) {
          (headers as Headers).set(key, value);
        } else {
          (headers as Record<string, string>)[key] = value;
        }
      });
    },
  };
}

/**
 * Utility function to check if request is secure
 */
export function isSecureRequest(req: NextRequest | IncomingMessage): boolean {
  const tlsService = TLSValidationService.getInstance();
  const validation = tlsService.validateRequest(req);
  return validation.isSecure && validation.errors.length === 0;
}

/**
 * Utility function to enforce HTTPS in production
 */
export function enforceHTTPS(req: NextRequest): Response | null {
  if (process.env.NODE_ENV !== 'production') return null;

  const tlsService = TLSValidationService.getInstance();
  const validation = tlsService.validateRequest(req);

  if (!validation.isSecure) {
    // Redirect to HTTPS
    const url = new URL(req.url);
    url.protocol = 'https:';

    return Response.redirect(url.toString(), 301);
  }

  return null;
}

export default TLSValidationService;
