'use client';

import React, { useState, useEffect } from 'react';
import { Check, Building2, Users, Search, Loader2 } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface Department {
  _id: string;
  name: string;
  description?: string;
  employee_count?: number;
  parent_department?: string;
  is_active?: boolean;
}

interface DepartmentSelectorProps {
  selectedDepartments: string[];
  onChange: (departmentIds: string[]) => void;
  companyId?: string;
  showEmployeeCount?: boolean;
  allowSelectAll?: boolean;
  maxHeight?: string;
  className?: string;
}

export default function DepartmentSelector({
  selectedDepartments = [],
  onChange,
  companyId,
  showEmployeeCount = true,
  allowSelectAll = true,
  maxHeight = '400px',
  className,
}: DepartmentSelectorProps) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDepartments();
  }, [companyId]);

  const fetchDepartments = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (companyId) params.append('company_id', companyId);
      params.append('include_employee_count', 'true');
      params.append('active_only', 'true');

      const response = await fetch(`/api/departments?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch departments');
      }

      const data = await response.json();
      setDepartments(data.data || data.departments || []);
    } catch (err) {
      console.error('Error fetching departments:', err);
      setError('Failed to load departments. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredDepartments = departments.filter((dept) =>
    dept.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleDepartment = (departmentId: string) => {
    if (selectedDepartments.includes(departmentId)) {
      onChange(selectedDepartments.filter((id) => id !== departmentId));
    } else {
      onChange([...selectedDepartments, departmentId]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedDepartments.length === filteredDepartments.length) {
      onChange([]);
    } else {
      onChange(filteredDepartments.map((dept) => dept._id));
    }
  };

  const totalEmployees = filteredDepartments
    .filter((dept) => selectedDepartments.includes(dept._id))
    .reduce((sum, dept) => sum + (dept.employee_count || 0), 0);

  const allSelected =
    filteredDepartments.length > 0 &&
    selectedDepartments.length === filteredDepartments.length;
  const someSelected =
    selectedDepartments.length > 0 &&
    selectedDepartments.length < filteredDepartments.length;

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Loading departments...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-2 text-center">
            <Building2 className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{error}</p>
            <button
              onClick={fetchDepartments}
              className="text-sm text-blue-600 hover:underline"
            >
              Try again
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Select Departments
            </CardTitle>
            <CardDescription className="mt-1">
              Choose which departments will receive this survey
            </CardDescription>
          </div>
          {showEmployeeCount && selectedDepartments.length > 0 && (
            <Badge variant="secondary" className="text-sm">
              <Users className="h-3 w-3 mr-1" />
              {totalEmployees} employee{totalEmployees !== 1 ? 's' : ''}{' '}
              selected
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search departments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Select All */}
        {allowSelectAll && filteredDepartments.length > 0 && (
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              <Checkbox
                id="select-all"
                checked={allSelected}
                onCheckedChange={toggleSelectAll}
                className={cn(
                  someSelected && 'data-[state=checked]:bg-blue-600'
                )}
              />
              <label
                htmlFor="select-all"
                className="text-sm font-medium cursor-pointer"
              >
                Select All Departments
              </label>
            </div>
            <Badge variant="outline" className="text-xs">
              {selectedDepartments.length} of {filteredDepartments.length}
            </Badge>
          </div>
        )}

        {/* Department List */}
        <ScrollArea style={{ maxHeight }}>
          {filteredDepartments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Building2 className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-sm text-muted-foreground">
                {searchQuery
                  ? 'No departments found matching your search'
                  : 'No departments available'}
              </p>
            </div>
          ) : (
            <div className="space-y-2 pr-4">
              {filteredDepartments.map((department) => {
                const isSelected = selectedDepartments.includes(department._id);

                return (
                  <div
                    key={department._id}
                    onClick={() => toggleDepartment(department._id)}
                    className={cn(
                      'flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors',
                      isSelected
                        ? 'bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800'
                        : 'hover:bg-accent border-border'
                    )}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <Checkbox
                        id={`dept-${department._id}`}
                        checked={isSelected}
                        onCheckedChange={() => toggleDepartment(department._id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="flex-1">
                        <label
                          htmlFor={`dept-${department._id}`}
                          className="text-sm font-medium cursor-pointer"
                        >
                          {department.name}
                        </label>
                        {department.description && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {department.description}
                          </p>
                        )}
                      </div>
                    </div>
                    {showEmployeeCount &&
                      department.employee_count !== undefined && (
                        <Badge
                          variant={isSelected ? 'default' : 'secondary'}
                          className="ml-2"
                        >
                          <Users className="h-3 w-3 mr-1" />
                          {department.employee_count}
                        </Badge>
                      )}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* Summary */}
        {selectedDepartments.length > 0 && (
          <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-blue-900 dark:text-blue-100">
                {selectedDepartments.length} department
                {selectedDepartments.length !== 1 ? 's' : ''} selected
              </span>
            </div>
            {showEmployeeCount && (
              <span className="text-sm text-blue-700 dark:text-blue-300">
                {totalEmployees} total employee{totalEmployees !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
