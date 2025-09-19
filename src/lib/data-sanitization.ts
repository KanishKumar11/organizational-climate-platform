/**
 * Data sanitization utilities for preventing circular references and ensuring JSON serializability
 */

/**
 * Sanitizes data to ensure it's safe for JSON serialization
 * Removes circular references, converts ObjectIds to strings, and handles dates
 */
export function sanitizeForSerialization(obj: any, seen = new WeakSet()): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  // Handle primitive types
  if (typeof obj !== 'object') {
    return obj;
  }

  // Handle dates
  if (obj instanceof Date) {
    return obj.toISOString();
  }

  // Handle MongoDB ObjectIds
  if (obj.constructor && obj.constructor.name === 'ObjectId') {
    return obj.toString();
  }

  // Check for circular references
  if (seen.has(obj)) {
    return '[Circular Reference]';
  }

  seen.add(obj);

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeForSerialization(item, seen));
  }

  // Handle objects
  const sanitized: any = {};
  
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      try {
        // Skip functions and undefined values
        if (typeof obj[key] === 'function' || obj[key] === undefined) {
          continue;
        }

        // Handle special MongoDB fields
        if (key === '_id' && obj[key]) {
          sanitized.id = obj[key].toString();
          continue;
        }

        // Skip internal MongoDB fields
        if (key.startsWith('_') && key !== '_id') {
          continue;
        }

        // Skip Mongoose internal fields
        if (['$__', '$isNew', '__v', 'isModified', 'isNew'].includes(key)) {
          continue;
        }

        sanitized[key] = sanitizeForSerialization(obj[key], seen);
      } catch (error) {
        console.warn(`Error sanitizing field ${key}:`, error);
        // Skip problematic fields
        continue;
      }
    }
  }

  seen.delete(obj);
  return sanitized;
}

/**
 * Sanitizes Mongoose documents specifically
 */
export function sanitizeMongooseDocument(doc: any): any {
  if (!doc) return null;

  // Convert to plain object if it's a Mongoose document
  const plainObj = doc.toObject ? doc.toObject() : doc;
  
  return sanitizeForSerialization(plainObj);
}

/**
 * Sanitizes an array of Mongoose documents
 */
export function sanitizeMongooseDocuments(docs: any[]): any[] {
  if (!Array.isArray(docs)) return [];
  
  return docs.map(doc => sanitizeMongooseDocument(doc));
}

/**
 * Safe JSON stringify that handles circular references
 */
export function safeStringify(obj: any): string {
  try {
    return JSON.stringify(sanitizeForSerialization(obj));
  } catch (error) {
    console.error('Error stringifying object:', error);
    return JSON.stringify({ error: 'Serialization failed' });
  }
}

/**
 * Validates that an object is JSON serializable
 */
export function isSerializable(obj: any): boolean {
  try {
    JSON.stringify(obj);
    return true;
  } catch {
    return false;
  }
}

/**
 * Deep clones an object while ensuring serializability
 */
export function serializableClone(obj: any): any {
  return sanitizeForSerialization(obj);
}
