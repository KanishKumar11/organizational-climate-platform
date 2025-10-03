'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, AlertCircle, CheckCircle, Sparkles } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

/**
 * Column Mapper Component
 * 
 * Maps CSV columns to required employee fields with auto-detection.
 * 
 * Features:
 * - Auto-detection of email, name, department columns
 * - Manual override with dropdowns
 * - Required field validation
 * - Preview mapping result
 * - Confidence scores for auto-detection
 * 
 * @param headers - CSV column headers
 * @param rows - Sample CSV rows for preview
 * @param onMappingChange - Callback when mapping changes
 * @param language - Display language
 */

interface ColumnMapperProps {
  headers: string[];
  rows: any[];
  onMappingChange: (mapping: ColumnMapping) => void;
  language?: 'es' | 'en';
}

export interface ColumnMapping {
  email: string | null;
  name: string | null;
  department: string | null;
  location: string | null;
  position: string | null;
  employeeId: string | null;
}

export function ColumnMapper({
  headers,
  rows,
  onMappingChange,
  language = 'es',
}: ColumnMapperProps) {
  const [mapping, setMapping] = useState<ColumnMapping>({
    email: null,
    name: null,
    department: null,
    location: null,
    position: null,
    employeeId: null,
  });

  const [autoDetected, setAutoDetected] = useState<Set<string>>(new Set());

  const t = language === 'es' ? {
    title: 'Mapeo de Columnas',
    description: 'Asocia las columnas del CSV con los campos de empleado',
    required: 'Requerido',
    optional: 'Opcional',
    autoDetected: 'Detectado automáticamente',
    selectColumn: 'Seleccionar columna',
    none: 'Ninguna',
    preview: 'Vista previa del mapeo',
    fields: {
      email: 'Email',
      name: 'Nombre',
      department: 'Departamento',
      location: 'Ubicación',
      position: 'Puesto',
      employeeId: 'ID Empleado',
    },
    validation: {
      emailRequired: 'El campo email es requerido',
      nameRequired: 'El campo nombre es requerido',
      allSet: 'Todos los campos requeridos están configurados',
    },
  } : {
    title: 'Column Mapping',
    description: 'Map CSV columns to employee fields',
    required: 'Required',
    optional: 'Optional',
    autoDetected: 'Auto-detected',
    selectColumn: 'Select column',
    none: 'None',
    preview: 'Mapping preview',
    fields: {
      email: 'Email',
      name: 'Name',
      department: 'Department',
      location: 'Location',
      position: 'Position',
      employeeId: 'Employee ID',
    },
    validation: {
      emailRequired: 'Email field is required',
      nameRequired: 'Name field is required',
      allSet: 'All required fields are set',
    },
  };

  // Auto-detect columns on mount
  useEffect(() => {
    const detected = autoDetectColumns(headers);
    setMapping(detected.mapping);
    setAutoDetected(detected.autoDetected);
    onMappingChange(detected.mapping);
  }, [headers]);

  const autoDetectColumns = (headers: string[]): { mapping: ColumnMapping; autoDetected: Set<string> } => {
    const lowercaseHeaders = headers.map(h => h.toLowerCase());
    const detected = new Set<string>();
    const mapping: ColumnMapping = {
      email: null,
      name: null,
      department: null,
      location: null,
      position: null,
      employeeId: null,
    };

    // Email detection
    const emailPatterns = ['email', 'correo', 'e-mail', 'mail'];
    const emailIdx = lowercaseHeaders.findIndex(h =>
      emailPatterns.some(pattern => h.includes(pattern))
    );
    if (emailIdx !== -1) {
      mapping.email = headers[emailIdx];
      detected.add('email');
    }

    // Name detection
    const namePatterns = ['name', 'nombre', 'full name', 'fullname', 'employee name'];
    const nameIdx = lowercaseHeaders.findIndex(h =>
      namePatterns.some(pattern => h.includes(pattern))
    );
    if (nameIdx !== -1) {
      mapping.name = headers[nameIdx];
      detected.add('name');
    }

    // Department detection
    const deptPatterns = ['department', 'departamento', 'dept', 'area'];
    const deptIdx = lowercaseHeaders.findIndex(h =>
      deptPatterns.some(pattern => h.includes(pattern))
    );
    if (deptIdx !== -1) {
      mapping.department = headers[deptIdx];
      detected.add('department');
    }

    // Location detection
    const locationPatterns = ['location', 'ubicación', 'ubicacion', 'office', 'oficina', 'city', 'ciudad'];
    const locationIdx = lowercaseHeaders.findIndex(h =>
      locationPatterns.some(pattern => h.includes(pattern))
    );
    if (locationIdx !== -1) {
      mapping.location = headers[locationIdx];
      detected.add('location');
    }

    // Position detection
    const positionPatterns = ['position', 'puesto', 'cargo', 'role', 'rol', 'job title', 'title'];
    const positionIdx = lowercaseHeaders.findIndex(h =>
      positionPatterns.some(pattern => h.includes(pattern))
    );
    if (positionIdx !== -1) {
      mapping.position = headers[positionIdx];
      detected.add('position');
    }

    // Employee ID detection
    const idPatterns = ['id', 'employee id', 'employeeid', 'emp id', 'staff id', 'número', 'numero'];
    const idIdx = lowercaseHeaders.findIndex(h =>
      idPatterns.some(pattern => h.includes(pattern))
    );
    if (idIdx !== -1) {
      mapping.employeeId = headers[idIdx];
      detected.add('employeeId');
    }

    return { mapping, autoDetected: detected };
  };

  const handleMappingChange = (field: keyof ColumnMapping, value: string | null) => {
    const newMapping = { ...mapping, [field]: value };
    setMapping(newMapping);
    onMappingChange(newMapping);
  };

  const isValid = mapping.email && mapping.name;

  const renderFieldSelector = (
    field: keyof ColumnMapping,
    label: string,
    required: boolean
  ) => {
    const isAutoDetected = autoDetected.has(field);
    const currentValue = mapping[field];

    return (
      <div key={field} className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor={field} className="flex items-center gap-2">
            {label}
            {required && <Badge variant="destructive" className="text-xs">*</Badge>}
          </Label>
          {isAutoDetected && (
            <Badge variant="outline" className="text-xs bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300">
              <Sparkles className="w-3 h-3 mr-1" />
              {t.autoDetected}
            </Badge>
          )}
        </div>

        <Select
          value={currentValue || 'none'}
          onValueChange={(value) => handleMappingChange(field, value === 'none' ? null : value)}
        >
          <SelectTrigger
            id={field}
            className={cn(
              isAutoDetected && 'border-green-500 bg-green-50/50 dark:bg-green-900/10'
            )}
          >
            <SelectValue placeholder={t.selectColumn} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">{t.none}</SelectItem>
            {headers.map((header) => (
              <SelectItem key={header} value={header}>
                {header}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Preview value */}
        {currentValue && rows.length > 0 && (
          <p className="text-xs text-gray-500 truncate">
            {t.preview}: "{rows[0][currentValue] || '-'}"
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRight className="w-5 h-5" />
            {t.title}
          </CardTitle>
          <CardDescription>{t.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Required Fields */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
              {t.required}
              <Badge variant="destructive">*</Badge>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderFieldSelector('email', t.fields.email, true)}
              {renderFieldSelector('name', t.fields.name, true)}
            </div>
          </div>

          {/* Optional Fields */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {t.optional}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderFieldSelector('department', t.fields.department, false)}
              {renderFieldSelector('location', t.fields.location, false)}
              {renderFieldSelector('position', t.fields.position, false)}
              {renderFieldSelector('employeeId', t.fields.employeeId, false)}
            </div>
          </div>

          {/* Validation */}
          {isValid ? (
            <Alert className="bg-green-50 dark:bg-green-900/20 border-green-500">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                {t.validation.allSet}
              </AlertDescription>
            </Alert>
          ) : (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {!mapping.email && t.validation.emailRequired}
                {!mapping.name && !mapping.email && ' • '}
                {!mapping.name && t.validation.nameRequired}
              </AlertDescription>
            </Alert>
          )}

          {/* Preview Mapping */}
          {rows.length > 0 && (
            <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-900/50">
              <h4 className="text-sm font-semibold mb-3">{t.preview}</h4>
              <div className="space-y-2 text-sm">
                {Object.entries(mapping).map(([field, column]) => {
                  if (!column) return null;
                  const value = rows[0][column];
                  return (
                    <div key={field} className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        {t.fields[field as keyof typeof t.fields]}:
                      </span>
                      <span className="font-mono text-xs bg-white dark:bg-gray-800 px-2 py-1 rounded">
                        {value || '-'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
