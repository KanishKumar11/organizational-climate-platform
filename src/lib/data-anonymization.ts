import { createHash, randomBytes } from 'crypto';

/**
 * Anonymization strategies
 */
export enum AnonymizationStrategy {
  HASH = 'hash', // Hash the data
  MASK = 'mask', // Mask with asterisks
  GENERALIZE = 'generalize', // Generalize to broader category
  SUPPRESS = 'suppress', // Remove completely
  PSEUDONYMIZE = 'pseudonymize', // Replace with consistent fake data
  NOISE = 'noise', // Add statistical noise
}

/**
 * Anonymization configuration for different field types
 */
export interface AnonymizationConfig {
  strategy: AnonymizationStrategy;
  options?: {
    hashSalt?: string;
    maskChar?: string;
    visibleChars?: number;
    categories?: string[];
    noiseRange?: number;
  };
}

/**
 * Default anonymization configurations
 */
export const DEFAULT_ANONYMIZATION_CONFIGS: Record<
  string,
  AnonymizationConfig
> = {
  // Personal identifiers
  name: { strategy: AnonymizationStrategy.PSEUDONYMIZE },
  email: { strategy: AnonymizationStrategy.HASH },
  phone: { strategy: AnonymizationStrategy.MASK, options: { visibleChars: 4 } },
  address: {
    strategy: AnonymizationStrategy.GENERALIZE,
    options: { categories: ['Urban', 'Suburban', 'Rural'] },
  },

  // Sensitive data
  ip_address: { strategy: AnonymizationStrategy.HASH },
  user_agent: { strategy: AnonymizationStrategy.SUPPRESS },
  response_text: {
    strategy: AnonymizationStrategy.MASK,
    options: { visibleChars: 10 },
  },

  // Demographic data
  age: {
    strategy: AnonymizationStrategy.GENERALIZE,
    options: { categories: ['18-25', '26-35', '36-45', '46-55', '55+'] },
  },
  salary: {
    strategy: AnonymizationStrategy.GENERALIZE,
    options: { categories: ['<50k', '50k-75k', '75k-100k', '100k+'] },
  },

  // Identifiers that should be consistent
  user_id: { strategy: AnonymizationStrategy.PSEUDONYMIZE },
  company_id: { strategy: AnonymizationStrategy.PSEUDONYMIZE },
  department_id: { strategy: AnonymizationStrategy.PSEUDONYMIZE },
};

/**
 * Data Anonymization Service
 */
export class DataAnonymizationService {
  private static instance: DataAnonymizationService;
  private pseudonymCache: Map<string, string> = new Map();
  private saltCache: Map<string, string> = new Map();

  static getInstance(): DataAnonymizationService {
    if (!DataAnonymizationService.instance) {
      DataAnonymizationService.instance = new DataAnonymizationService();
    }
    return DataAnonymizationService.instance;
  }

  /**
   * Anonymize a single field value
   */
  anonymizeField(
    value: any,
    fieldName: string,
    config?: AnonymizationConfig
  ): any {
    if (value === null || value === undefined) return value;

    const anonymizationConfig = config ||
      DEFAULT_ANONYMIZATION_CONFIGS[fieldName] || {
        strategy: AnonymizationStrategy.MASK,
      };

    switch (anonymizationConfig.strategy) {
      case AnonymizationStrategy.HASH:
        return this.hashValue(
          value,
          fieldName,
          anonymizationConfig.options?.hashSalt
        );

      case AnonymizationStrategy.MASK:
        return this.maskValue(value, anonymizationConfig.options);

      case AnonymizationStrategy.GENERALIZE:
        return this.generalizeValue(
          value,
          fieldName,
          anonymizationConfig.options?.categories
        );

      case AnonymizationStrategy.SUPPRESS:
        return null;

      case AnonymizationStrategy.PSEUDONYMIZE:
        return this.pseudonymizeValue(value, fieldName);

      case AnonymizationStrategy.NOISE:
        return this.addNoise(value, anonymizationConfig.options?.noiseRange);

      default:
        return this.maskValue(value, anonymizationConfig.options);
    }
  }

  /**
   * Anonymize an entire object
   */
  anonymizeObject(
    data: Record<string, any>,
    fieldConfigs?: Record<string, AnonymizationConfig>
  ): Record<string, any> {
    const anonymized: Record<string, any> = {};

    Object.keys(data).forEach((key) => {
      const config = fieldConfigs?.[key];
      anonymized[key] = this.anonymizeField(data[key], key, config);
    });

    return anonymized;
  }

  /**
   * Anonymize an array of objects
   */
  anonymizeArray(
    dataArray: Record<string, any>[],
    fieldConfigs?: Record<string, AnonymizationConfig>
  ): Record<string, any>[] {
    return dataArray.map((item) => this.anonymizeObject(item, fieldConfigs));
  }

  /**
   * Hash a value with optional salt
   */
  private hashValue(value: any, fieldName: string, salt?: string): string {
    const valueStr = String(value);
    const saltToUse = salt || this.getSalt(fieldName);
    return createHash('sha256')
      .update(valueStr + saltToUse)
      .digest('hex')
      .substring(0, 16);
  }

  /**
   * Mask a value with asterisks
   */
  private maskValue(
    value: any,
    options?: { maskChar?: string; visibleChars?: number }
  ): string {
    const valueStr = String(value);
    const maskChar = options?.maskChar || '*';
    const visibleChars = options?.visibleChars || 4;

    if (valueStr.length <= visibleChars) {
      return maskChar.repeat(8);
    }

    const visibleStart = Math.floor(visibleChars / 2);
    const visibleEnd = visibleChars - visibleStart;

    return (
      valueStr.substring(0, visibleStart) +
      maskChar.repeat(valueStr.length - visibleChars) +
      valueStr.substring(valueStr.length - visibleEnd)
    );
  }

  /**
   * Generalize a value to a broader category
   */
  private generalizeValue(
    value: any,
    fieldName: string,
    categories?: string[]
  ): string {
    if (!categories) {
      return '[GENERALIZED]';
    }

    // Simple generalization based on field type
    if (fieldName === 'age' && typeof value === 'number') {
      if (value < 26) return '18-25';
      if (value < 36) return '26-35';
      if (value < 46) return '36-45';
      if (value < 56) return '46-55';
      return '55+';
    }

    if (fieldName === 'salary' && typeof value === 'number') {
      if (value < 50000) return '<50k';
      if (value < 75000) return '50k-75k';
      if (value < 100000) return '75k-100k';
      return '100k+';
    }

    // Default: return a random category
    return categories[Math.floor(Math.random() * categories.length)];
  }

  /**
   * Create a consistent pseudonym for a value
   */
  private pseudonymizeValue(value: any, fieldName: string): string {
    const valueStr = String(value);
    const cacheKey = `${fieldName}:${valueStr}`;

    // Return cached pseudonym if exists
    if (this.pseudonymCache.has(cacheKey)) {
      return this.pseudonymCache.get(cacheKey)!;
    }

    // Generate new pseudonym
    let pseudonym: string;

    if (fieldName === 'name') {
      pseudonym = this.generateFakeName();
    } else if (fieldName === 'email') {
      pseudonym = this.generateFakeEmail();
    } else if (fieldName.includes('id')) {
      pseudonym = this.generateFakeId();
    } else {
      pseudonym = this.hashValue(value, fieldName).substring(0, 8);
    }

    // Cache the pseudonym for consistency
    this.pseudonymCache.set(cacheKey, pseudonym);
    return pseudonym;
  }

  /**
   * Add statistical noise to numeric values
   */
  private addNoise(value: any, noiseRange: number = 0.1): any {
    if (typeof value !== 'number') return value;

    const noise = (Math.random() - 0.5) * 2 * noiseRange * value;
    return Math.round((value + noise) * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Get or generate salt for a field
   */
  private getSalt(fieldName: string): string {
    if (this.saltCache.has(fieldName)) {
      return this.saltCache.get(fieldName)!;
    }

    const salt = randomBytes(16).toString('hex');
    this.saltCache.set(fieldName, salt);
    return salt;
  }

  /**
   * Generate a fake name
   */
  private generateFakeName(): string {
    const firstNames = [
      'Alex',
      'Jordan',
      'Taylor',
      'Casey',
      'Morgan',
      'Riley',
      'Avery',
      'Quinn',
    ];
    const lastNames = [
      'Smith',
      'Johnson',
      'Brown',
      'Davis',
      'Miller',
      'Wilson',
      'Moore',
      'Taylor',
    ];

    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];

    return `${firstName} ${lastName}`;
  }

  /**
   * Generate a fake email
   */
  private generateFakeEmail(): string {
    const domains = ['example.com', 'test.org', 'sample.net', 'demo.co'];
    const username = randomBytes(4).toString('hex');
    const domain = domains[Math.floor(Math.random() * domains.length)];

    return `${username}@${domain}`;
  }

  /**
   * Generate a fake ID
   */
  private generateFakeId(): string {
    return randomBytes(8).toString('hex');
  }

  /**
   * Validate anonymization quality
   */
  validateAnonymization(
    original: Record<string, any>,
    anonymized: Record<string, any>
  ): {
    isValid: boolean;
    risks: string[];
    score: number;
  } {
    const risks: string[] = [];
    let riskScore = 0;

    // Check for potential re-identification risks
    Object.keys(original).forEach((key) => {
      const originalValue = original[key];
      const anonymizedValue = anonymized[key];

      // Check if sensitive data is still identifiable
      if (
        typeof originalValue === 'string' &&
        typeof anonymizedValue === 'string'
      ) {
        // Check for partial matches that might allow re-identification
        if (
          originalValue.length > 10 &&
          anonymizedValue.includes(originalValue.substring(0, 5))
        ) {
          risks.push(`Field '${key}' may still be identifiable`);
          riskScore += 10;
        }

        // Check for common patterns
        if (originalValue.includes('@') && anonymizedValue.includes('@')) {
          const originalDomain = originalValue.split('@')[1];
          const anonymizedDomain = anonymizedValue.split('@')[1];
          if (originalDomain === anonymizedDomain) {
            risks.push(`Email domain preserved in field '${key}'`);
            riskScore += 5;
          }
        }
      }

      // Check for unchanged sensitive values
      if (originalValue === anonymizedValue && this.isSensitiveField(key)) {
        risks.push(`Sensitive field '${key}' was not anonymized`);
        riskScore += 20;
      }
    });

    const score = Math.max(0, 100 - riskScore);
    const isValid = score >= 70; // Threshold for acceptable anonymization

    return {
      isValid,
      risks,
      score,
    };
  }

  /**
   * Check if a field is considered sensitive
   */
  private isSensitiveField(fieldName: string): boolean {
    const sensitiveFields = [
      'name',
      'email',
      'phone',
      'address',
      'ssn',
      'tax_id',
      'ip_address',
      'user_agent',
      'response_text',
    ];

    return sensitiveFields.some((sensitive) =>
      fieldName.toLowerCase().includes(sensitive.toLowerCase())
    );
  }

  /**
   * Clear caches (useful for testing or memory management)
   */
  clearCaches(): void {
    this.pseudonymCache.clear();
    this.saltCache.clear();
  }

  /**
   * Export anonymization statistics
   */
  getStatistics(): {
    pseudonymCacheSize: number;
    saltCacheSize: number;
    supportedStrategies: AnonymizationStrategy[];
  } {
    return {
      pseudonymCacheSize: this.pseudonymCache.size,
      saltCacheSize: this.saltCache.size,
      supportedStrategies: Object.values(AnonymizationStrategy),
    };
  }
}

export default DataAnonymizationService;
