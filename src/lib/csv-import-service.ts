import Papa from 'papaparse';
import * as XLSX from 'xlsx';

/**
 * CLIMA-003: CSV Import Service
 * 
 * Handles CSV/XLSX file parsing, validation, and deduplication
 * with comprehensive error handling and type safety
 */

export interface ImportedUser {
  email: string;
  name?: string;
  department?: string;
  employee_id?: string;
  phone?: string;
  position?: string;
  [key: string]: any; // Additional custom fields
}

export interface ValidationError {
  row: number;
  column: string;
  value: any;
  message: string;
}

export interface ImportResult {
  success: boolean;
  data: ImportedUser[];
  duplicates: ImportedUser[];
  errors: ValidationError[];
  stats: {
    total: number;
    valid: number;
    duplicates: number;
    errors: number;
  };
}

export interface ColumnMapping {
  [sourceColumn: string]: string; // Maps source column to target field
}

/**
 * Default column mappings (case-insensitive)
 */
const DEFAULT_MAPPINGS: Record<string, string> = {
  'email': 'email',
  'e-mail': 'email',
  'correo': 'email',
  'correo electrónico': 'email',
  'mail': 'email',
  
  'name': 'name',
  'nombre': 'name',
  'full name': 'name',
  'nombre completo': 'name',
  
  'department': 'department',
  'departamento': 'department',
  'dept': 'department',
  
  'employee id': 'employee_id',
  'employee_id': 'employee_id',
  'id': 'employee_id',
  'employee number': 'employee_id',
  'número de empleado': 'employee_id',
  
  'phone': 'phone',
  'teléfono': 'phone',
  'telefono': 'phone',
  'mobile': 'phone',
  
  'position': 'position',
  'cargo': 'position',
  'puesto': 'position',
  'job title': 'position',
  'título': 'position',
};

export class CSVImportService {
  /**
   * Parse CSV file
   */
  static async parseCSV(file: File): Promise<{ headers: string[]; data: any[] }> {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim(),
        complete: (results) => {
          const headers = results.meta.fields || [];
          resolve({ headers, data: results.data });
        },
        error: (error) => {
          reject(new Error(`CSV parsing error: ${error.message}`));
        },
      });
    });
  }

  /**
   * Parse XLSX file
   */
  static async parseXLSX(file: File): Promise<{ headers: string[]; data: any[] }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          
          // Get first sheet
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          
          // Convert to JSON with header row
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
            header: 1,
            defval: '',
          }) as any[][];
          
          if (jsonData.length === 0) {
            reject(new Error('Excel file is empty'));
            return;
          }
          
          // First row as headers
          const headers = jsonData[0].map((h: any) => String(h).trim());
          
          // Rest as data
          const rows = jsonData.slice(1).map((row) => {
            const obj: any = {};
            headers.forEach((header, index) => {
              obj[header] = row[index] !== undefined ? String(row[index]).trim() : '';
            });
            return obj;
          });
          
          resolve({ headers, data: rows });
        } catch (error) {
          reject(new Error(`Excel parsing error: ${(error as Error).message}`));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Auto-detect column mappings based on common patterns
   */
  static autoDetectMapping(headers: string[]): ColumnMapping {
    const mapping: ColumnMapping = {};
    
    headers.forEach((header) => {
      const normalizedHeader = header.toLowerCase().trim();
      
      // Check against default mappings
      const targetField = DEFAULT_MAPPINGS[normalizedHeader];
      if (targetField) {
        mapping[header] = targetField;
      } else {
        // Keep original if no mapping found
        mapping[header] = normalizedHeader.replace(/\s+/g, '_');
      }
    });
    
    return mapping;
  }

  /**
   * Validate email format
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate imported data
   */
  static validateData(
    data: any[],
    mapping: ColumnMapping,
    options: {
      requireEmail?: boolean;
      requireName?: boolean;
      customValidators?: Record<string, (value: any) => boolean>;
    } = {}
  ): ValidationError[] {
    const errors: ValidationError[] = [];
    const { requireEmail = true, requireName = false, customValidators = {} } = options;
    
    data.forEach((row, index) => {
      // Find email field
      const emailField = Object.entries(mapping).find(([_, target]) => target === 'email')?.[0];
      
      if (emailField) {
        const email = row[emailField];
        
        // Check if email is required
        if (requireEmail && (!email || email.trim() === '')) {
          errors.push({
            row: index + 2, // +2 because: +1 for header, +1 for 1-indexed
            column: emailField,
            value: email,
            message: 'Email is required',
          });
        } else if (email && !this.isValidEmail(email.trim())) {
          errors.push({
            row: index + 2,
            column: emailField,
            value: email,
            message: 'Invalid email format',
          });
        }
      } else if (requireEmail) {
        errors.push({
          row: index + 2,
          column: 'N/A',
          value: null,
          message: 'Email column not found',
        });
      }
      
      // Check name if required
      if (requireName) {
        const nameField = Object.entries(mapping).find(([_, target]) => target === 'name')?.[0];
        if (nameField) {
          const name = row[nameField];
          if (!name || name.trim() === '') {
            errors.push({
              row: index + 2,
              column: nameField,
              value: name,
              message: 'Name is required',
            });
          }
        }
      }
      
      // Custom validators
      Object.entries(customValidators).forEach(([field, validator]) => {
        const sourceField = Object.entries(mapping).find(([_, target]) => target === field)?.[0];
        if (sourceField) {
          const value = row[sourceField];
          if (!validator(value)) {
            errors.push({
              row: index + 2,
              column: sourceField,
              value,
              message: `Invalid value for ${field}`,
            });
          }
        }
      });
    });
    
    return errors;
  }

  /**
   * Deduplicate users by email or employee ID
   */
  static deduplicateUsers(
    users: ImportedUser[],
    dedupeBy: 'email' | 'employee_id' | 'both' = 'email'
  ): { unique: ImportedUser[]; duplicates: ImportedUser[] } {
    const seen = new Set<string>();
    const unique: ImportedUser[] = [];
    const duplicates: ImportedUser[] = [];
    
    users.forEach((user) => {
      let key: string;
      
      switch (dedupeBy) {
        case 'email':
          key = user.email?.toLowerCase().trim() || '';
          break;
        case 'employee_id':
          key = user.employee_id?.toLowerCase().trim() || '';
          break;
        case 'both':
          key = `${user.email?.toLowerCase().trim()}_${user.employee_id?.toLowerCase().trim()}`;
          break;
      }
      
      if (!key || seen.has(key)) {
        duplicates.push(user);
      } else {
        seen.add(key);
        unique.push(user);
      }
    });
    
    return { unique, duplicates };
  }

  /**
   * Transform raw data to ImportedUser format
   */
  static transformData(data: any[], mapping: ColumnMapping): ImportedUser[] {
    return data.map((row) => {
      const user: ImportedUser = { email: '' };
      
      Object.entries(mapping).forEach(([sourceColumn, targetField]) => {
        const value = row[sourceColumn];
        
        // Trim strings and handle empty values
        if (value !== undefined && value !== null) {
          const trimmedValue = String(value).trim();
          if (trimmedValue !== '') {
            user[targetField] = trimmedValue;
          }
        }
      });
      
      return user;
    });
  }

  /**
   * Full import process with validation and deduplication
   */
  static async importUsers(
    file: File,
    mapping?: ColumnMapping,
    options: {
      requireEmail?: boolean;
      requireName?: boolean;
      deduplicateBy?: 'email' | 'employee_id' | 'both';
      customValidators?: Record<string, (value: any) => boolean>;
    } = {}
  ): Promise<ImportResult> {
    try {
      // Determine file type and parse
      const fileType = file.name.split('.').pop()?.toLowerCase();
      let parseResult: { headers: string[]; data: any[] };
      
      if (fileType === 'csv') {
        parseResult = await this.parseCSV(file);
      } else if (fileType === 'xlsx' || fileType === 'xls') {
        parseResult = await this.parseXLSX(file);
      } else {
        throw new Error('Unsupported file type. Please use CSV or XLSX files.');
      }
      
      const { headers, data } = parseResult;
      
      // Auto-detect mapping if not provided
      const finalMapping = mapping || this.autoDetectMapping(headers);
      
      // Validate data
      const validationErrors = this.validateData(data, finalMapping, options);
      
      // Transform data
      const transformedData = this.transformData(data, finalMapping);
      
      // Deduplicate
      const { unique, duplicates } = this.deduplicateUsers(
        transformedData,
        options.deduplicateBy || 'email'
      );
      
      return {
        success: validationErrors.length === 0,
        data: unique,
        duplicates,
        errors: validationErrors,
        stats: {
          total: data.length,
          valid: unique.length,
          duplicates: duplicates.length,
          errors: validationErrors.length,
        },
      };
    } catch (error) {
      return {
        success: false,
        data: [],
        duplicates: [],
        errors: [{
          row: 0,
          column: 'file',
          value: file.name,
          message: (error as Error).message,
        }],
        stats: {
          total: 0,
          valid: 0,
          duplicates: 0,
          errors: 1,
        },
      };
    }
  }

  /**
   * Generate sample CSV template
   */
  static generateTemplate(includeExamples: boolean = true): string {
    const headers = ['email', 'name', 'department', 'employee_id', 'phone', 'position'];
    
    if (!includeExamples) {
      return headers.join(',');
    }
    
    const examples = [
      ['john.doe@example.com', 'John Doe', 'Engineering', 'EMP001', '+1234567890', 'Software Engineer'],
      ['jane.smith@example.com', 'Jane Smith', 'Marketing', 'EMP002', '+1234567891', 'Marketing Manager'],
      ['bob.johnson@example.com', 'Bob Johnson', 'HR', 'EMP003', '+1234567892', 'HR Specialist'],
    ];
    
    const rows = [headers, ...examples];
    return rows.map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
  }

  /**
   * Export users to CSV
   */
  static exportToCSV(users: ImportedUser[], filename: string = 'users.csv'): void {
    if (users.length === 0) {
      return;
    }
    
    // Get all unique keys from users
    const allKeys = Array.from(
      new Set(users.flatMap((user) => Object.keys(user)))
    );
    
    // Create CSV content
    const csv = Papa.unparse({
      fields: allKeys,
      data: users,
    });
    
    // Download file
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  /**
   * Merge imported users with existing users (avoiding duplicates)
   */
  static mergeWithExisting(
    importedUsers: ImportedUser[],
    existingUsers: ImportedUser[],
    mergeBy: 'email' | 'employee_id' = 'email'
  ): {
    toAdd: ImportedUser[];
    toUpdate: ImportedUser[];
    duplicates: ImportedUser[];
  } {
    const existingMap = new Map<string, ImportedUser>();
    
    // Build map of existing users
    existingUsers.forEach((user) => {
      const key = mergeBy === 'email' 
        ? user.email?.toLowerCase().trim() 
        : user.employee_id?.toLowerCase().trim();
      
      if (key) {
        existingMap.set(key, user);
      }
    });
    
    const toAdd: ImportedUser[] = [];
    const toUpdate: ImportedUser[] = [];
    const duplicates: ImportedUser[] = [];
    
    importedUsers.forEach((user) => {
      const key = mergeBy === 'email'
        ? user.email?.toLowerCase().trim()
        : user.employee_id?.toLowerCase().trim();
      
      if (!key) {
        duplicates.push(user);
        return;
      }
      
      if (existingMap.has(key)) {
        toUpdate.push(user);
      } else {
        toAdd.push(user);
      }
    });
    
    return { toAdd, toUpdate, duplicates };
  }
}
