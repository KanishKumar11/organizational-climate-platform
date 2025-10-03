'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Mail,
  User,
  AlertCircle,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

/**
 * Validation Panel Component
 *
 * Displays data validation errors and warnings with actionable feedback.
 *
 * Features:
 * - Email format validation (RFC 5322)
 * - Duplicate detection (by email/ID)
 * - Missing required fields
 * - Invalid data patterns
 * - Severity levels (error, warning, info)
 * - Grouped by type
 *
 * @param data - Mapped employee data
 * @param onValidationComplete - Callback with validation results
 * @param language - Display language
 */

interface ValidationPanelProps {
  data: MappedEmployee[];
  onValidationComplete: (result: ValidationResult) => void;
  language?: 'es' | 'en';
}

export interface MappedEmployee {
  email: string;
  name: string;
  department?: string;
  location?: string;
  position?: string;
  employeeId?: string;
  rowIndex: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  validCount: number;
  invalidCount: number;
  duplicateCount: number;
}

export interface ValidationError {
  type:
    | 'missing_email'
    | 'missing_name'
    | 'invalid_email'
    | 'duplicate_email'
    | 'duplicate_id';
  rowIndex: number;
  field: string;
  value: string;
  message: string;
}

export interface ValidationWarning {
  type: 'missing_optional' | 'suspicious_data';
  rowIndex: number;
  field: string;
  value: string;
  message: string;
}

export function ValidationPanel({
  data,
  onValidationComplete,
  language = 'es',
}: ValidationPanelProps) {
  const t =
    language === 'es'
      ? {
          title: 'Validación de Datos',
          description: 'Revisa los errores y advertencias antes de continuar',
          tabs: {
            errors: 'Errores',
            warnings: 'Advertencias',
            valid: 'Válidos',
          },
          summary: {
            valid: 'Registros válidos',
            invalid: 'Errores',
            duplicates: 'Duplicados',
            warnings: 'Advertencias',
          },
          errorTypes: {
            missing_email: 'Email faltante',
            missing_name: 'Nombre faltante',
            invalid_email: 'Email inválido',
            duplicate_email: 'Email duplicado',
            duplicate_id: 'ID duplicado',
          },
          warningTypes: {
            missing_optional: 'Campo opcional vacío',
            suspicious_data: 'Datos sospechosos',
          },
          noErrors: 'No se encontraron errores',
          noWarnings: 'No se encontraron advertencias',
          row: 'Fila',
        }
      : {
          title: 'Data Validation',
          description: 'Review errors and warnings before proceeding',
          tabs: {
            errors: 'Errors',
            warnings: 'Warnings',
            valid: 'Valid',
          },
          summary: {
            valid: 'Valid records',
            invalid: 'Errors',
            duplicates: 'Duplicates',
            warnings: 'Warnings',
          },
          errorTypes: {
            missing_email: 'Missing email',
            missing_name: 'Missing name',
            invalid_email: 'Invalid email',
            duplicate_email: 'Duplicate email',
            duplicate_id: 'Duplicate ID',
          },
          warningTypes: {
            missing_optional: 'Empty optional field',
            suspicious_data: 'Suspicious data',
          },
          noErrors: 'No errors found',
          noWarnings: 'No warnings found',
          row: 'Row',
        };

  const validationResult = useMemo(() => {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const emailSet = new Set<string>();
    const idSet = new Set<string>();

    // Email validation regex (RFC 5322 simplified)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    data.forEach((employee, index) => {
      const rowIndex = employee.rowIndex || index;

      // Required field validation
      if (!employee.email || employee.email.trim() === '') {
        errors.push({
          type: 'missing_email',
          rowIndex,
          field: 'email',
          value: '',
          message: t.errorTypes.missing_email,
        });
      } else {
        // Email format validation
        if (!emailRegex.test(employee.email)) {
          errors.push({
            type: 'invalid_email',
            rowIndex,
            field: 'email',
            value: employee.email,
            message: `${t.errorTypes.invalid_email}: ${employee.email}`,
          });
        }

        // Duplicate email detection
        const emailLower = employee.email.toLowerCase();
        if (emailSet.has(emailLower)) {
          errors.push({
            type: 'duplicate_email',
            rowIndex,
            field: 'email',
            value: employee.email,
            message: `${t.errorTypes.duplicate_email}: ${employee.email}`,
          });
        } else {
          emailSet.add(emailLower);
        }
      }

      if (!employee.name || employee.name.trim() === '') {
        errors.push({
          type: 'missing_name',
          rowIndex,
          field: 'name',
          value: '',
          message: t.errorTypes.missing_name,
        });
      }

      // Duplicate ID detection
      if (employee.employeeId) {
        if (idSet.has(employee.employeeId)) {
          errors.push({
            type: 'duplicate_id',
            rowIndex,
            field: 'employeeId',
            value: employee.employeeId,
            message: `${t.errorTypes.duplicate_id}: ${employee.employeeId}`,
          });
        } else {
          idSet.add(employee.employeeId);
        }
      }

      // Optional field warnings
      if (!employee.department) {
        warnings.push({
          type: 'missing_optional',
          rowIndex,
          field: 'department',
          value: '',
          message: `${t.warningTypes.missing_optional}: department`,
        });
      }
    });

    const validCount =
      data.length - new Set(errors.map((e) => e.rowIndex)).size;
    const duplicateCount = errors.filter((e) =>
      e.type.includes('duplicate')
    ).length;

    const result: ValidationResult = {
      isValid: errors.length === 0,
      errors,
      warnings,
      validCount,
      invalidCount: errors.length,
      duplicateCount,
    };

    onValidationComplete(result);
    return result;
  }, [data]);

  const renderErrorItem = (error: ValidationError, index: number) => (
    <motion.div
      key={index}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.02 }}
      className="p-3 border border-red-200 dark:border-red-800 rounded-lg bg-red-50 dark:bg-red-900/20"
    >
      <div className="flex items-start gap-3">
        <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="destructive" className="text-xs">
              {t.row} {error.rowIndex + 1}
            </Badge>
            <span className="text-sm font-medium text-red-900 dark:text-red-100">
              {error.message}
            </span>
          </div>
          {error.value && (
            <p className="text-xs text-red-700 dark:text-red-300 font-mono">
              "{error.value}"
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );

  const renderWarningItem = (warning: ValidationWarning, index: number) => (
    <motion.div
      key={index}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.02 }}
      className="p-3 border border-yellow-200 dark:border-yellow-800 rounded-lg bg-yellow-50 dark:bg-yellow-900/20"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="text-xs bg-yellow-100 dark:bg-yellow-900/30"
            >
              {t.row} {warning.rowIndex + 1}
            </Badge>
            <span className="text-sm text-yellow-900 dark:text-yellow-100">
              {warning.message}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );

  const renderValidItem = (employee: MappedEmployee, index: number) => {
    // Only show if no errors for this row
    const hasError = validationResult.errors.some(
      (e) => e.rowIndex === employee.rowIndex
    );
    if (hasError) return null;

    return (
      <motion.div
        key={index}
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.02 }}
        className="p-3 border border-green-200 dark:border-green-800 rounded-lg bg-green-50 dark:bg-green-900/20"
      >
        <div className="flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Mail className="w-3 h-3 text-gray-500" />
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {employee.email}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <User className="w-3 h-3 text-gray-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {employee.name}
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {t.title}
        </CardTitle>
        <CardDescription>{t.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <div className="text-2xl font-bold text-green-700 dark:text-green-300">
              {validationResult.validCount}
            </div>
            <div className="text-xs text-green-600 dark:text-green-400">
              {t.summary.valid}
            </div>
          </div>

          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <div className="text-2xl font-bold text-red-700 dark:text-red-300">
              {validationResult.invalidCount}
            </div>
            <div className="text-xs text-red-600 dark:text-red-400">
              {t.summary.invalid}
            </div>
          </div>

          <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
            <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">
              {validationResult.duplicateCount}
            </div>
            <div className="text-xs text-orange-600 dark:text-orange-400">
              {t.summary.duplicates}
            </div>
          </div>

          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
              {validationResult.warnings.length}
            </div>
            <div className="text-xs text-yellow-600 dark:text-yellow-400">
              {t.summary.warnings}
            </div>
          </div>
        </div>

        {/* Validation Status Alert */}
        {validationResult.isValid ? (
          <Alert className="bg-green-50 dark:bg-green-900/20 border-green-500">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              {t.noErrors} - All {data.length} records are valid!
            </AlertDescription>
          </Alert>
        ) : (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              Found {validationResult.invalidCount} errors in {data.length}{' '}
              records
            </AlertDescription>
          </Alert>
        )}

        {/* Tabs for Errors/Warnings/Valid */}
        <Tabs defaultValue="errors" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="errors" className="relative">
              {t.tabs.errors}
              {validationResult.errors.length > 0 && (
                <Badge variant="destructive" className="ml-2 text-xs">
                  {validationResult.errors.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="warnings" className="relative">
              {t.tabs.warnings}
              {validationResult.warnings.length > 0 && (
                <Badge variant="outline" className="ml-2 text-xs bg-yellow-100">
                  {validationResult.warnings.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="valid">
              {t.tabs.valid}
              <Badge variant="outline" className="ml-2 text-xs bg-green-100">
                {validationResult.validCount}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="errors"
            className="mt-4 space-y-2 max-h-96 overflow-y-auto"
          >
            {validationResult.errors.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
                <p>{t.noErrors}</p>
              </div>
            ) : (
              validationResult.errors.map(renderErrorItem)
            )}
          </TabsContent>

          <TabsContent
            value="warnings"
            className="mt-4 space-y-2 max-h-96 overflow-y-auto"
          >
            {validationResult.warnings.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
                <p>{t.noWarnings}</p>
              </div>
            ) : (
              validationResult.warnings.map(renderWarningItem)
            )}
          </TabsContent>

          <TabsContent
            value="valid"
            className="mt-4 space-y-2 max-h-96 overflow-y-auto"
          >
            {data.map(renderValidItem)}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
