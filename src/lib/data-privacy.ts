import {
  encryptField,
  decryptField,
  maskData,
  maskEmail,
  anonymizeUserData,
} from './encryption';

// Environment check
const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';
const isTest = process.env.NODE_ENV === 'test';

// PII field definitions
export const PII_FIELDS = {
  // High sensitivity - always encrypted
  HIGH: ['password_hash', 'ssn', 'tax_id', 'bank_account'],

  // Medium sensitivity - encrypted in production, masked in non-production
  MEDIUM: ['email', 'phone', 'address', 'ip_address'],

  // Low sensitivity - masked in non-production
  LOW: ['name', 'user_agent', 'response_text'],
} as const;

export type PIILevel = keyof typeof PII_FIELDS;

/**
 * Data privacy configuration
 */
export interface PrivacyConfig {
  encryptInProduction: boolean;
  maskInNonProduction: boolean;
  anonymizeForAnalytics: boolean;
  retentionPeriodDays: number;
}

/**
 * Default privacy configurations by data type
 */
export const PRIVACY_CONFIGS: Record<string, PrivacyConfig> = {
  user_data: {
    encryptInProduction: true,
    maskInNonProduction: true,
    anonymizeForAnalytics: true,
    retentionPeriodDays: 2555, // 7 years
  },
  survey_responses: {
    encryptInProduction: true,
    maskInNonProduction: true,
    anonymizeForAnalytics: true,
    retentionPeriodDays: 1825, // 5 years
  },
  audit_logs: {
    encryptInProduction: false,
    maskInNonProduction: true,
    anonymizeForAnalytics: false,
    retentionPeriodDays: 2555, // 7 years for compliance
  },
  analytics_data: {
    encryptInProduction: false,
    maskInNonProduction: false,
    anonymizeForAnalytics: true,
    retentionPeriodDays: 1095, // 3 years
  },
};

/**
 * Data Privacy Service
 */
export class DataPrivacyService {
  private config: PrivacyConfig;

  constructor(dataType: string = 'user_data') {
    this.config = PRIVACY_CONFIGS[dataType] || PRIVACY_CONFIGS.user_data;
  }

  /**
   * Process sensitive data based on environment and configuration
   */
  processSensitiveData(
    data: any,
    fieldName: string,
    piiLevel: PIILevel = 'MEDIUM'
  ): any {
    if (!data) return data;

    const fieldList = PII_FIELDS[piiLevel];
    const isFieldSensitive =
      (fieldList as readonly string[]).includes(fieldName) ||
      fieldName.toLowerCase().includes('password') ||
      fieldName.toLowerCase().includes('secret');

    if (!isFieldSensitive) return data;

    // Always encrypt high sensitivity fields
    if (
      piiLevel === 'HIGH' ||
      (isProduction && this.config.encryptInProduction)
    ) {
      return this.encryptSensitiveField(data, fieldName);
    }

    // Mask in non-production environments
    if (!isProduction && this.config.maskInNonProduction) {
      return this.maskSensitiveField(data, fieldName);
    }

    return data;
  }

  /**
   * Encrypt sensitive field data
   */
  private encryptSensitiveField(data: string, fieldName: string): string {
    try {
      return encryptField(data, fieldName);
    } catch (error) {
      console.error(`Failed to encrypt field ${fieldName}:`, error);
      // In case of encryption failure, mask the data as fallback
      return this.maskSensitiveField(data, fieldName);
    }
  }

  /**
   * Decrypt sensitive field data
   */
  decryptSensitiveField(encryptedData: string, fieldName: string): string {
    try {
      return decryptField(encryptedData, fieldName);
    } catch (error) {
      console.error(`Failed to decrypt field ${fieldName}:`, error);
      throw new Error(`Unable to decrypt sensitive field: ${fieldName}`);
    }
  }

  /**
   * Mask sensitive field data
   */
  private maskSensitiveField(data: string, fieldName: string): string {
    if (fieldName.toLowerCase().includes('email')) {
      return maskEmail(data);
    }

    if (fieldName.toLowerCase().includes('password')) {
      return '********';
    }

    return maskData(data);
  }

  /**
   * Process user data for storage
   */
  processUserDataForStorage(userData: any): any {
    const processed = { ...userData };

    // Process each field based on sensitivity
    Object.keys(processed).forEach((key) => {
      if (processed[key] && typeof processed[key] === 'string') {
        // Determine PII level
        let piiLevel: PIILevel = 'LOW';
        if (PII_FIELDS.HIGH.includes(key as any)) piiLevel = 'HIGH';
        else if (PII_FIELDS.MEDIUM.includes(key as any)) piiLevel = 'MEDIUM';

        processed[key] = this.processSensitiveData(
          processed[key],
          key,
          piiLevel
        );
      }
    });

    return processed;
  }

  /**
   * Process survey response data for storage
   */
  processSurveyResponseForStorage(responseData: any): any {
    const processed = { ...responseData };

    // Encrypt response text in production
    if (processed.response_text && isProduction) {
      processed.response_text = this.encryptSensitiveField(
        processed.response_text,
        'response_text'
      );
    } else if (processed.response_text && !isProduction) {
      // Mask in non-production
      processed.response_text = maskData(processed.response_text, '*', 10);
    }

    // Process IP address
    if (processed.ip_address) {
      processed.ip_address = this.processSensitiveData(
        processed.ip_address,
        'ip_address',
        'MEDIUM'
      );
    }

    // Process user agent
    if (processed.user_agent) {
      processed.user_agent = this.processSensitiveData(
        processed.user_agent,
        'user_agent',
        'LOW'
      );
    }

    return processed;
  }

  /**
   * Anonymize data for analytics
   */
  anonymizeForAnalytics(data: any): any {
    if (!this.config.anonymizeForAnalytics) return data;

    return anonymizeUserData(data);
  }

  /**
   * Check if data should be retained based on retention policy
   */
  shouldRetainData(createdAt: Date): boolean {
    const retentionPeriodMs =
      this.config.retentionPeriodDays * 24 * 60 * 60 * 1000;
    const dataAge = Date.now() - createdAt.getTime();
    return dataAge < retentionPeriodMs;
  }

  /**
   * Get data retention cutoff date
   */
  getRetentionCutoffDate(): Date {
    const cutoffMs =
      Date.now() - this.config.retentionPeriodDays * 24 * 60 * 60 * 1000;
    return new Date(cutoffMs);
  }

  /**
   * Prepare data for export (GDPR compliance)
   */
  prepareDataForExport(data: any, includeEncrypted: boolean = false): any {
    const exported = { ...data };

    // If not including encrypted data, decrypt for export
    if (!includeEncrypted && isProduction) {
      Object.keys(exported).forEach((key) => {
        if (this.isFieldEncrypted(exported[key], key)) {
          try {
            exported[key] = this.decryptSensitiveField(exported[key], key);
          } catch (error) {
            // If decryption fails, mark as encrypted
            exported[key] = '[ENCRYPTED_DATA]';
          }
        }
      });
    }

    return exported;
  }

  /**
   * Check if a field value appears to be encrypted
   */
  private isFieldEncrypted(value: any, fieldName: string): boolean {
    if (typeof value !== 'string') return false;

    // Simple heuristic: encrypted data is typically base64 and longer than original
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    return base64Regex.test(value) && value.length > 20;
  }

  /**
   * Validate TLS configuration for secure transmission
   */
  static validateTLSConfig(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check if running in production with HTTPS
    if (isProduction) {
      const protocol = process.env.PROTOCOL || 'http';
      if (protocol !== 'https') {
        errors.push(
          'Production environment must use HTTPS for secure data transmission'
        );
      }

      // Check for secure headers configuration
      const secureHeaders = ['HSTS_MAX_AGE', 'CSP_POLICY', 'X_FRAME_OPTIONS'];

      secureHeaders.forEach((header) => {
        if (!process.env[header]) {
          errors.push(
            `Security header ${header} should be configured in production`
          );
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

/**
 * Middleware for automatic data privacy processing
 */
export function createPrivacyMiddleware(dataType: string = 'user_data') {
  const privacyService = new DataPrivacyService(dataType);

  return {
    /**
     * Process data before saving to database
     */
    beforeSave: (data: any) => {
      if (dataType === 'user_data') {
        return privacyService.processUserDataForStorage(data);
      } else if (dataType === 'survey_responses') {
        return privacyService.processSurveyResponseForStorage(data);
      }
      return data;
    },

    /**
     * Process data after retrieving from database
     */
    afterRetrieve: (data: any, forAnalytics: boolean = false) => {
      if (forAnalytics) {
        return privacyService.anonymizeForAnalytics(data);
      }
      return data;
    },

    /**
     * Prepare data for export
     */
    prepareForExport: (data: any, includeEncrypted: boolean = false) => {
      return privacyService.prepareDataForExport(data, includeEncrypted);
    },
  };
}

/**
 * Data masking utilities for different environments
 */
export const DataMasking = {
  /**
   * Mask data for development environment
   */
  forDevelopment: (data: any): any => {
    if (!isDevelopment) return data;

    const masked = { ...data };

    // Mask common PII fields
    if (masked.email) masked.email = maskEmail(masked.email);
    if (masked.name) masked.name = maskData(masked.name);
    if (masked.phone) masked.phone = maskData(masked.phone);
    if (masked.address) masked.address = maskData(masked.address);

    return masked;
  },

  /**
   * Mask data for testing environment
   */
  forTesting: (data: any): any => {
    if (!isTest) return data;

    // In test environment, use consistent fake data
    const masked = { ...data };

    if (masked.email) masked.email = 'test@example.com';
    if (masked.name) masked.name = 'Test User';
    if (masked.phone) masked.phone = '555-0123';
    if (masked.address) masked.address = '123 Test St';

    return masked;
  },
};

export default DataPrivacyService;
