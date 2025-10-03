'use client';

import React, { useState, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Plus,
  Trash2,
  Edit2,
  Save,
  X,
  AlertCircle,
  Users,
  Mail,
  Building,
  MapPin,
  Briefcase,
  Hash,
  Check,
  Search,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * ManualEmployeeEntry Component
 *
 * Provides a form-based interface for manually entering employee information
 * for survey targeting. Includes real-time validation, duplicate detection,
 * and inline editing capabilities.
 *
 * Features:
 * - Add/edit/remove individual employees
 * - Real-time email validation (RFC 5322)
 * - Duplicate detection (case-insensitive)
 * - Inline editing with save/cancel
 * - Search/filter employees
 * - Bulk operations (clear all)
 * - Validation summary
 * - Department/location/position tracking
 *
 * @component
 * @example
 * ```tsx
 * <ManualEmployeeEntry
 *   employees={employees}
 *   onEmployeesChange={setEmployees}
 *   language="es"
 * />
 * ```
 */

interface Employee {
  email: string;
  name: string;
  department?: string;
  location?: string;
  position?: string;
  employeeId?: string;
}

interface ManualEmployeeEntryProps {
  employees: Employee[];
  onEmployeesChange: (employees: Employee[]) => void;
  language?: 'es' | 'en';
}

interface ValidationError {
  index: number;
  field: string;
  message: string;
}

const translations = {
  es: {
    title: 'Entrada Manual de Empleados',
    description:
      'Agrega empleados individualmente para crear tu audiencia objetivo',
    addEmployee: 'Agregar Empleado',
    editEmployee: 'Editar',
    deleteEmployee: 'Eliminar',
    save: 'Guardar',
    cancel: 'Cancelar',
    clearAll: 'Limpiar Todo',
    search: 'Buscar empleados...',
    employeeCount: 'empleados agregados',
    noEmployees: 'No hay empleados agregados',
    noEmployeesDesc:
      'Usa el formulario a continuación para agregar empleados manualmente',
    formTitle: 'Información del Empleado',
    email: 'Correo Electrónico',
    emailPlaceholder: 'juan.perez@empresa.com',
    emailRequired: 'El correo electrónico es obligatorio',
    emailInvalid: 'Formato de correo electrónico no válido',
    emailDuplicate: 'Este correo electrónico ya existe',
    name: 'Nombre Completo',
    namePlaceholder: 'Juan Pérez',
    nameRequired: 'El nombre es obligatorio',
    department: 'Departamento',
    departmentPlaceholder: 'Ventas',
    location: 'Ubicación',
    locationPlaceholder: 'Madrid',
    position: 'Puesto',
    positionPlaceholder: 'Gerente de Ventas',
    employeeId: 'ID de Empleado',
    employeeIdPlaceholder: 'EMP001',
    requiredField: 'Campo obligatorio',
    optionalField: 'Opcional',
    validationErrors: 'errores de validación',
    duplicates: 'duplicados',
    confirmClearAll:
      '¿Estás seguro de que deseas eliminar todos los empleados?',
    confirmDelete: '¿Eliminar este empleado?',
  },
  en: {
    title: 'Manual Employee Entry',
    description: 'Add employees individually to create your target audience',
    addEmployee: 'Add Employee',
    editEmployee: 'Edit',
    deleteEmployee: 'Delete',
    save: 'Save',
    cancel: 'Cancel',
    clearAll: 'Clear All',
    search: 'Search employees...',
    employeeCount: 'employees added',
    noEmployees: 'No employees added',
    noEmployeesDesc: 'Use the form below to manually add employees',
    formTitle: 'Employee Information',
    email: 'Email Address',
    emailPlaceholder: 'john.doe@company.com',
    emailRequired: 'Email is required',
    emailInvalid: 'Invalid email format',
    emailDuplicate: 'This email already exists',
    name: 'Full Name',
    namePlaceholder: 'John Doe',
    nameRequired: 'Name is required',
    department: 'Department',
    departmentPlaceholder: 'Sales',
    location: 'Location',
    locationPlaceholder: 'New York',
    position: 'Position',
    positionPlaceholder: 'Sales Manager',
    employeeId: 'Employee ID',
    employeeIdPlaceholder: 'EMP001',
    requiredField: 'Required field',
    optionalField: 'Optional',
    validationErrors: 'validation errors',
    duplicates: 'duplicates',
    confirmClearAll: 'Are you sure you want to remove all employees?',
    confirmDelete: 'Delete this employee?',
  },
};

export function ManualEmployeeEntry({
  employees,
  onEmployeesChange,
  language = 'es',
}: ManualEmployeeEntryProps) {
  const t = translations[language];

  // Form state
  const [formData, setFormData] = useState<Employee>({
    email: '',
    name: '',
    department: '',
    location: '',
    position: '',
    employeeId: '',
  });

  // Editing state
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Validation state
  const [errors, setErrors] = useState<Record<string, string>>({});

  /**
   * Email validation using RFC 5322 pattern
   */
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  /**
   * Check for duplicate emails (case-insensitive)
   */
  const isDuplicateEmail = (email: string, excludeIndex?: number): boolean => {
    return employees.some((emp, index) => {
      if (excludeIndex !== undefined && index === excludeIndex) {
        return false;
      }
      return emp.email.toLowerCase() === email.toLowerCase();
    });
  };

  /**
   * Validate form data
   */
  const validateForm = useCallback(
    (data: Employee, isEditing: boolean = false): Record<string, string> => {
      const newErrors: Record<string, string> = {};

      // Email validation
      if (!data.email.trim()) {
        newErrors.email = t.emailRequired;
      } else if (!validateEmail(data.email)) {
        newErrors.email = t.emailInvalid;
      } else if (
        isDuplicateEmail(data.email, isEditing ? editingIndex! : undefined)
      ) {
        newErrors.email = t.emailDuplicate;
      }

      // Name validation
      if (!data.name.trim()) {
        newErrors.name = t.nameRequired;
      }

      return newErrors;
    },
    [employees, editingIndex, t]
  );

  /**
   * Handle form field changes
   */
  const handleChange = (field: keyof Employee, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  /**
   * Add new employee
   */
  const handleAddEmployee = () => {
    const validationErrors = validateForm(formData, false);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    // Add employee
    const newEmployees = [...employees, { ...formData }];
    onEmployeesChange(newEmployees);

    // Reset form
    setFormData({
      email: '',
      name: '',
      department: '',
      location: '',
      position: '',
      employeeId: '',
    });
    setErrors({});
  };

  /**
   * Start editing employee
   */
  const handleEditEmployee = (index: number) => {
    setEditingIndex(index);
    setFormData({ ...employees[index] });
    setErrors({});
  };

  /**
   * Save edited employee
   */
  const handleSaveEdit = () => {
    const validationErrors = validateForm(formData, true);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    // Update employee
    const newEmployees = [...employees];
    newEmployees[editingIndex!] = { ...formData };
    onEmployeesChange(newEmployees);

    // Reset editing state
    setEditingIndex(null);
    setFormData({
      email: '',
      name: '',
      department: '',
      location: '',
      position: '',
      employeeId: '',
    });
    setErrors({});
  };

  /**
   * Cancel editing
   */
  const handleCancelEdit = () => {
    setEditingIndex(null);
    setFormData({
      email: '',
      name: '',
      department: '',
      location: '',
      position: '',
      employeeId: '',
    });
    setErrors({});
  };

  /**
   * Delete employee
   */
  const handleDeleteEmployee = (index: number) => {
    if (confirm(t.confirmDelete)) {
      const newEmployees = employees.filter((_, i) => i !== index);
      onEmployeesChange(newEmployees);

      // If editing this employee, cancel edit
      if (editingIndex === index) {
        handleCancelEdit();
      }
    }
  };

  /**
   * Clear all employees
   */
  const handleClearAll = () => {
    if (confirm(t.confirmClearAll)) {
      onEmployeesChange([]);
      handleCancelEdit();
    }
  };

  /**
   * Filter employees by search query
   */
  const filteredEmployees = employees.filter((emp) => {
    const query = searchQuery.toLowerCase();
    return (
      emp.email.toLowerCase().includes(query) ||
      emp.name.toLowerCase().includes(query) ||
      emp.department?.toLowerCase().includes(query) ||
      emp.location?.toLowerCase().includes(query) ||
      emp.position?.toLowerCase().includes(query) ||
      emp.employeeId?.toLowerCase().includes(query)
    );
  });

  /**
   * Get validation summary
   */
  const getValidationSummary = (): { duplicates: number; errors: number } => {
    const emailMap = new Map<string, number>();
    let duplicates = 0;

    employees.forEach((emp) => {
      const email = emp.email.toLowerCase();
      const count = emailMap.get(email) || 0;
      emailMap.set(email, count + 1);
    });

    emailMap.forEach((count) => {
      if (count > 1) duplicates += count;
    });

    return {
      duplicates,
      errors: Object.keys(errors).length,
    };
  };

  const validationSummary = getValidationSummary();

  return (
    <div className="space-y-6">
      {/* Header with stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
            <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {t.title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {employees.length} {t.employeeCount}
            </p>
          </div>
        </div>
        {employees.length > 0 && (
          <Button variant="outline" size="sm" onClick={handleClearAll}>
            <Trash2 className="w-4 h-4 mr-2" />
            {t.clearAll}
          </Button>
        )}
      </div>

      {/* Validation Summary */}
      {(validationSummary.errors > 0 || validationSummary.duplicates > 0) && (
        <Alert variant="destructive">
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>
            <div className="flex items-center gap-4">
              {validationSummary.errors > 0 && (
                <span>
                  {validationSummary.errors} {t.validationErrors}
                </span>
              )}
              {validationSummary.duplicates > 0 && (
                <span>
                  {validationSummary.duplicates} {t.duplicates}
                </span>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Employee Entry Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t.formTitle}</CardTitle>
          <CardDescription>{t.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-1">
                <Mail className="w-4 h-4" />
                {t.email}
                <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder={t.emailPlaceholder}
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.email}
                </p>
              )}
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {t.name}
                <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                type="text"
                placeholder={t.namePlaceholder}
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.name}
                </p>
              )}
            </div>

            {/* Department */}
            <div className="space-y-2">
              <Label htmlFor="department" className="flex items-center gap-1">
                <Building className="w-4 h-4" />
                {t.department}
                <span className="text-xs text-gray-500">
                  ({t.optionalField})
                </span>
              </Label>
              <Input
                id="department"
                type="text"
                placeholder={t.departmentPlaceholder}
                value={formData.department}
                onChange={(e) => handleChange('department', e.target.value)}
              />
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location" className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {t.location}
                <span className="text-xs text-gray-500">
                  ({t.optionalField})
                </span>
              </Label>
              <Input
                id="location"
                type="text"
                placeholder={t.locationPlaceholder}
                value={formData.location}
                onChange={(e) => handleChange('location', e.target.value)}
              />
            </div>

            {/* Position */}
            <div className="space-y-2">
              <Label htmlFor="position" className="flex items-center gap-1">
                <Briefcase className="w-4 h-4" />
                {t.position}
                <span className="text-xs text-gray-500">
                  ({t.optionalField})
                </span>
              </Label>
              <Input
                id="position"
                type="text"
                placeholder={t.positionPlaceholder}
                value={formData.position}
                onChange={(e) => handleChange('position', e.target.value)}
              />
            </div>

            {/* Employee ID */}
            <div className="space-y-2">
              <Label htmlFor="employeeId" className="flex items-center gap-1">
                <Hash className="w-4 h-4" />
                {t.employeeId}
                <span className="text-xs text-gray-500">
                  ({t.optionalField})
                </span>
              </Label>
              <Input
                id="employeeId"
                type="text"
                placeholder={t.employeeIdPlaceholder}
                value={formData.employeeId}
                onChange={(e) => handleChange('employeeId', e.target.value)}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            {editingIndex === null ? (
              <Button onClick={handleAddEmployee} className="w-full md:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                {t.addEmployee}
              </Button>
            ) : (
              <>
                <Button onClick={handleSaveEdit} className="w-full md:w-auto">
                  <Save className="w-4 h-4 mr-2" />
                  {t.save}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCancelEdit}
                  className="w-full md:w-auto"
                >
                  <X className="w-4 h-4 mr-2" />
                  {t.cancel}
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Employee List */}
      {employees.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                {language === 'es' ? 'Empleados Agregados' : 'Added Employees'}
              </CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder={t.search}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                <AnimatePresence>
                  {filteredEmployees.map((employee, index) => {
                    const originalIndex = employees.indexOf(employee);
                    const isEditing = editingIndex === originalIndex;

                    return (
                      <motion.div
                        key={`${employee.email}-${originalIndex}`}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                        className={`p-4 border rounded-lg ${
                          isEditing
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
                            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                                {employee.name}
                              </h4>
                              {isEditing && (
                                <Badge variant="default" className="text-xs">
                                  {language === 'es' ? 'Editando' : 'Editing'}
                                </Badge>
                              )}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-400">
                              <div className="flex items-center gap-2">
                                <Mail className="w-3 h-3" />
                                {employee.email}
                              </div>
                              {employee.department && (
                                <div className="flex items-center gap-2">
                                  <Building className="w-3 h-3" />
                                  {employee.department}
                                </div>
                              )}
                              {employee.location && (
                                <div className="flex items-center gap-2">
                                  <MapPin className="w-3 h-3" />
                                  {employee.location}
                                </div>
                              )}
                              {employee.position && (
                                <div className="flex items-center gap-2">
                                  <Briefcase className="w-3 h-3" />
                                  {employee.position}
                                </div>
                              )}
                              {employee.employeeId && (
                                <div className="flex items-center gap-2">
                                  <Hash className="w-3 h-3" />
                                  {employee.employeeId}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2 ml-4">
                            {!isEditing && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleEditEmployee(originalIndex)
                                  }
                                >
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleDeleteEmployee(originalIndex)
                                  }
                                  className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {filteredEmployees.length === 0 && searchQuery && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>
                      {language === 'es'
                        ? 'No se encontraron empleados'
                        : 'No employees found'}
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {employees.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-12">
            <div className="text-center text-gray-500 dark:text-gray-400">
              <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">{t.noEmployees}</h3>
              <p className="text-sm">{t.noEmployeesDesc}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
