import * as CryptoJS from 'crypto-js';
import { createHash, randomBytes } from 'crypto';

// Environment variables for encryption keys
const ENCRYPTION_KEY =
  process.env.ENCRYPTION_KEY || 'default-key-change-in-production';
const FIELD_ENCRYPTION_KEY =
  process.env.FIELD_ENCRYPTION_KEY || 'field-key-change-in-production';

// Encryption configuration
const ENCRYPTION_CONFIG = {
  algorithm: 'AES',
  keySize: 256 / 32, // 256 bits
  ivSize: 128 / 32, // 128 bits
  iterations: 1000,
};

/**
 * Generate a secure random salt
 */
export function generateSalt(): string {
  return randomBytes(16).toString('hex');
}

/**
 * Generate a secure hash of data
 */
export function generateHash(data: string, salt?: string): string {
  const saltToUse = salt || generateSalt();
  return createHash('sha256')
    .update(data + saltToUse)
    .digest('hex');
}

/**
 * Encrypt sensitive data using AES-256
 */
export function encryptData(data: string, key?: string): string {
  try {
    const keyToUse = key || ENCRYPTION_KEY;
    const encrypted = CryptoJS.AES.encrypt(data, keyToUse).toString();
    return encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt sensitive data
 */
export function decryptData(encryptedData: string, key?: string): string {
  try {
    const keyToUse = key || ENCRYPTION_KEY;
    const decrypted = CryptoJS.AES.decrypt(encryptedData, keyToUse);
    return decrypted.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Encrypt field-level data with additional security
 */
export function encryptField(data: string, fieldName: string): string {
  try {
    // Create field-specific key by combining base key with field name
    const fieldKey = createHash('sha256')
      .update(FIELD_ENCRYPTION_KEY + fieldName)
      .digest('hex');

    // Generate random IV for each encryption
    const iv = CryptoJS.lib.WordArray.random(ENCRYPTION_CONFIG.ivSize);

    // Encrypt with field-specific key and IV
    const encrypted = CryptoJS.AES.encrypt(data, fieldKey, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });

    // Combine IV and encrypted data
    const combined = iv.concat(encrypted.ciphertext);
    return combined.toString(CryptoJS.enc.Base64);
  } catch (error) {
    console.error('Field encryption error:', error);
    throw new Error(`Failed to encrypt field: ${fieldName}`);
  }
}

/**
 * Decrypt field-level data
 */
export function decryptField(encryptedData: string, fieldName: string): string {
  try {
    // Create field-specific key
    const fieldKey = createHash('sha256')
      .update(FIELD_ENCRYPTION_KEY + fieldName)
      .digest('hex');

    // Parse combined data
    const combined = CryptoJS.enc.Base64.parse(encryptedData);

    // Extract IV and ciphertext
    const iv = CryptoJS.lib.WordArray.create(
      combined.words.slice(0, ENCRYPTION_CONFIG.ivSize)
    );
    const ciphertext = CryptoJS.lib.WordArray.create(
      combined.words.slice(ENCRYPTION_CONFIG.ivSize)
    );

    // Decrypt
    const decrypted = CryptoJS.AES.decrypt(
      { ciphertext: ciphertext } as any,
      fieldKey,
      {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      }
    );

    return decrypted.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error('Field decryption error:', error);
    throw new Error(`Failed to decrypt field: ${fieldName}`);
  }
}

/**
 * Mask sensitive data for non-production environments
 */
export function maskData(
  data: string,
  maskChar: string = '*',
  visibleChars: number = 4
): string {
  if (!data || data.length <= visibleChars) {
    return maskChar.repeat(8); // Return fixed-length mask for short data
  }

  const visibleStart = Math.floor(visibleChars / 2);
  const visibleEnd = visibleChars - visibleStart;

  return (
    data.substring(0, visibleStart) +
    maskChar.repeat(data.length - visibleChars) +
    data.substring(data.length - visibleEnd)
  );
}

/**
 * Mask email addresses
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) {
    return '****@****.***';
  }

  const [localPart, domain] = email.split('@');
  const maskedLocal =
    localPart.length > 2
      ? localPart[0] +
        '*'.repeat(localPart.length - 2) +
        localPart[localPart.length - 1]
      : '**';

  const domainParts = domain.split('.');
  const maskedDomain = domainParts
    .map((part, index) => {
      if (index === domainParts.length - 1) return part; // Keep TLD
      return part.length > 2
        ? part[0] + '*'.repeat(part.length - 2) + part[part.length - 1]
        : '**';
    })
    .join('.');

  return `${maskedLocal}@${maskedDomain}`;
}

/**
 * Anonymize user data for analytics
 */
export function anonymizeUserData(userData: any): any {
  const anonymized = { ...userData };

  // Remove or hash PII fields
  if (anonymized.name) {
    anonymized.name = generateHash(anonymized.name).substring(0, 8);
  }

  if (anonymized.email) {
    anonymized.email =
      generateHash(anonymized.email).substring(0, 8) + '@anonymous.local';
  }

  // Keep only necessary fields for analytics
  const allowedFields = [
    'role',
    'company_id',
    'department_id',
    'created_at',
    'last_login',
    'preferences.language',
    'preferences.timezone',
  ];

  const result: any = {};
  allowedFields.forEach((field) => {
    const value = getNestedValue(anonymized, field);
    if (value !== undefined) {
      setNestedValue(result, field, value);
    }
  });

  return result;
}

/**
 * Helper function to get nested object values
 */
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

/**
 * Helper function to set nested object values
 */
function setNestedValue(obj: any, path: string, value: any): void {
  const keys = path.split('.');
  const lastKey = keys.pop()!;
  const target = keys.reduce((current, key) => {
    if (!current[key]) current[key] = {};
    return current[key];
  }, obj);
  target[lastKey] = value;
}

/**
 * Validate encryption keys are properly configured
 */
export function validateEncryptionConfig(): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (
    !ENCRYPTION_KEY ||
    ENCRYPTION_KEY === 'default-key-change-in-production'
  ) {
    errors.push(
      'ENCRYPTION_KEY environment variable must be set with a secure key'
    );
  }

  if (
    !FIELD_ENCRYPTION_KEY ||
    FIELD_ENCRYPTION_KEY === 'field-key-change-in-production'
  ) {
    errors.push(
      'FIELD_ENCRYPTION_KEY environment variable must be set with a secure key'
    );
  }

  if (ENCRYPTION_KEY.length < 32) {
    errors.push('ENCRYPTION_KEY must be at least 32 characters long');
  }

  if (FIELD_ENCRYPTION_KEY.length < 32) {
    errors.push('FIELD_ENCRYPTION_KEY must be at least 32 characters long');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Generate secure encryption keys for production use
 */
export function generateSecureKeys(): {
  encryptionKey: string;
  fieldEncryptionKey: string;
} {
  return {
    encryptionKey: randomBytes(32).toString('hex'),
    fieldEncryptionKey: randomBytes(32).toString('hex'),
  };
}


