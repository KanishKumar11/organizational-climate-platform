import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import {
  validateSecurityConfig,
  SecurityConfigChecker,
} from '../../../../middleware/security';
import { validateEncryptionConfig } from '../../../../lib/encryption';
import { DataPrivacyService } from '../../../../lib/data-privacy';
import TLSValidationService from '../../../../lib/tls-validation';
import { withSecurity } from '../../../../middleware/security';

/**
 * GET /api/security/config-check - Check security configuration
 */
async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permissions - only super admins can check security config
    const userRole = (session.user as any).role;
    if (userRole !== 'super_admin') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Validate overall security configuration
    const securityValidation = validateSecurityConfig();

    // Validate encryption configuration
    const encryptionValidation = validateEncryptionConfig();

    // Check TLS configuration
    const tlsService = TLSValidationService.getInstance();
    const tlsReport = tlsService.generateTLSReport();
    const tlsValidation = tlsService.validateRequest(request);

    // Get security status
    const securityChecker = SecurityConfigChecker.getInstance();
    const securityStatus = securityChecker.getSecurityStatus();

    // Check data privacy configurations
    const privacyService = new DataPrivacyService();
    const tlsConfigValidation = DataPrivacyService.validateTLSConfig();

    // Compile comprehensive security report
    const report = {
      overall_status: {
        is_secure:
          securityValidation.isValid &&
          encryptionValidation.isValid &&
          tlsConfigValidation.isValid,
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString(),
      },

      security_config: {
        is_valid: securityValidation.isValid,
        errors: securityValidation.errors,
      },

      encryption_config: {
        is_valid: encryptionValidation.isValid,
        errors: encryptionValidation.errors,
      },

      tls_config: {
        is_valid: tlsConfigValidation.isValid,
        errors: tlsConfigValidation.errors,
        current_request: {
          is_secure: tlsValidation.isSecure,
          protocol: tlsValidation.protocol,
          cipher: tlsValidation.cipher,
          warnings: tlsValidation.warnings,
        },
        recommendations: tlsReport.recommendations,
      },

      security_status: securityStatus,

      environment_checks: {
        required_env_vars: this.checkRequiredEnvVars(),
        security_headers: tlsReport.securityHeaders,
        database_connection: await this.checkDatabaseSecurity(),
      },

      recommendations: this.generateSecurityRecommendations({
        securityValidation,
        encryptionValidation,
        tlsConfigValidation,
        securityStatus,
      }),
    };

    return NextResponse.json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error('Failed to check security configuration:', error);
    return NextResponse.json(
      { error: 'Failed to check security configuration' },
      { status: 500 }
    );
  }
}

/**
 * Check required environment variables
 */
function checkRequiredEnvVars(): {
  missing: string[];
  weak: string[];
  configured: string[];
} {
  const required = [
    'NEXTAUTH_SECRET',
    'MONGODB_URI',
    'ENCRYPTION_KEY',
    'FIELD_ENCRYPTION_KEY',
  ];

  const optional = [
    'NEXTAUTH_URL',
    'HSTS_MAX_AGE',
    'CSP_POLICY',
    'X_FRAME_OPTIONS',
  ];

  const missing: string[] = [];
  const weak: string[] = [];
  const configured: string[] = [];

  [...required, ...optional].forEach((envVar) => {
    const value = process.env[envVar];

    if (!value) {
      if (required.includes(envVar)) {
        missing.push(envVar);
      }
    } else {
      configured.push(envVar);

      // Check for weak configurations
      if (envVar.includes('KEY') && value.length < 32) {
        weak.push(`${envVar} (too short)`);
      }

      if (envVar === 'NEXTAUTH_SECRET' && value.length < 32) {
        weak.push(`${envVar} (too short)`);
      }

      if (envVar.includes('KEY') && value.includes('default')) {
        weak.push(`${envVar} (using default value)`);
      }
    }
  });

  return { missing, weak, configured };
}

/**
 * Check database security configuration
 */
async function checkDatabaseSecurity(): Promise<{
  connection_encrypted: boolean;
  auth_enabled: boolean;
  connection_string_secure: boolean;
  recommendations: string[];
}> {
  const mongoUri = process.env.MONGODB_URI || '';
  const recommendations: string[] = [];

  // Check if connection uses SSL/TLS
  const connection_encrypted =
    mongoUri.includes('ssl=true') ||
    mongoUri.includes('tls=true') ||
    mongoUri.includes('mongodb+srv://');

  // Check if authentication is configured
  const auth_enabled =
    mongoUri.includes('@') && !mongoUri.includes('localhost');

  // Check if connection string looks secure
  const connection_string_secure =
    !mongoUri.includes('localhost') &&
    !mongoUri.includes('127.0.0.1') &&
    !mongoUri.includes('password');

  if (!connection_encrypted) {
    recommendations.push('Enable SSL/TLS for database connections');
  }

  if (!auth_enabled) {
    recommendations.push('Configure database authentication');
  }

  if (!connection_string_secure) {
    recommendations.push('Use secure database connection string');
  }

  return {
    connection_encrypted,
    auth_enabled,
    connection_string_secure,
    recommendations,
  };
}

/**
 * Generate security recommendations
 */
function generateSecurityRecommendations(validations: {
  securityValidation: any;
  encryptionValidation: any;
  tlsConfigValidation: any;
  securityStatus: any;
}): string[] {
  const recommendations: string[] = [];

  // Security config recommendations
  if (!validations.securityValidation.isValid) {
    recommendations.push('Fix security configuration errors');
    recommendations.push(...validations.securityValidation.errors);
  }

  // Encryption recommendations
  if (!validations.encryptionValidation.isValid) {
    recommendations.push('Fix encryption configuration errors');
    recommendations.push(...validations.encryptionValidation.errors);
  }

  // TLS recommendations
  if (!validations.tlsConfigValidation.isValid) {
    recommendations.push('Fix TLS configuration errors');
    recommendations.push(...validations.tlsConfigValidation.errors);
  }

  // Environment-specific recommendations
  if (process.env.NODE_ENV === 'production') {
    recommendations.push('Ensure all security headers are configured');
    recommendations.push('Monitor security logs regularly');
    recommendations.push('Perform regular security audits');
    recommendations.push('Keep dependencies updated');
  } else {
    recommendations.push('Test security configurations in development');
    recommendations.push('Use HTTPS in development when possible');
  }

  // General recommendations
  recommendations.push('Implement regular security training for team');
  recommendations.push('Set up automated security scanning');
  recommendations.push('Create incident response procedures');
  recommendations.push('Regular backup and recovery testing');

  return [...new Set(recommendations)]; // Remove duplicates
}

const secureGET = withSecurity(GET);
export { secureGET as GET };
