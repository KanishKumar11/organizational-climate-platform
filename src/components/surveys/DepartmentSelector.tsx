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
import { Button } from '@/components/ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { cn } from '../ui';

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
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-600" />
            Department Targeting
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Select departments to include in this survey
          </p>
        </div>
        {selectedDepartments.length > 0 && (
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">
              {selectedDepartments.length}
            </div>
            <div className="text-xs text-gray-500">
              department{selectedDepartments.length !== 1 ? 's' : ''} selected
            </div>
          </div>
        )}
      </div>

      {/* Search and Filters */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search departments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        {/* Quick Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {allowSelectAll && filteredDepartments.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={toggleSelectAll}
                className="text-xs"
              >
                {selectedDepartments.length === filteredDepartments.length
                  ? 'Deselect All'
                  : 'Select All'}
              </Button>
            )}
            {selectedDepartments.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onChange([])}
                className="text-xs text-gray-600 hover:text-gray-900"
              >
                Clear Selection
              </Button>
            )}
          </div>

          {/* Selection Summary */}
          <div className="flex items-center gap-4 text-sm">
            <span className="text-gray-600">
              {selectedDepartments.length} of {filteredDepartments.length}{' '}
              selected
            </span>
            {showEmployeeCount && (
              <Badge
                variant="secondary"
                className="bg-blue-50 text-blue-700 border-blue-200"
              >
                <Users className="h-3 w-3 mr-1" />
                {totalEmployees} employees
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Department List */}
      <div className="border rounded-lg overflow-hidden bg-white">
        <ScrollArea style={{ height: maxHeight }}>
          {filteredDepartments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Building2 className="h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchQuery
                  ? 'No departments found'
                  : 'No departments available'}
              </h3>
              <p className="text-gray-500 text-sm">
                {searchQuery
                  ? 'Try adjusting your search terms'
                  : 'Departments will appear here once created'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredDepartments.map((department) => {
                const isSelected = selectedDepartments.includes(department._id);

                return (
                  <div
                    key={department._id}
                    onClick={() => toggleDepartment(department._id)}
                    className={cn(
                      'p-4 cursor-pointer transition-all duration-200 hover:bg-gray-50',
                      isSelected && 'bg-blue-50 border-l-4 border-l-blue-500'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <Checkbox
                          id={`dept-${department._id}`}
                          checked={isSelected}
                          onCheckedChange={() =>
                            toggleDepartment(department._id)
                          }
                          onClick={(e) => e.stopPropagation()}
                          className="mt-0.5"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-gray-900">
                              {department.name}
                            </h4>
                            {isSelected && (
                              <Check className="h-4 w-4 text-blue-600" />
                            )}
                          </div>
                          {department.description && (
                            <p className="text-sm text-gray-600 mt-1">
                              {department.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {showEmployeeCount &&
                        department.employee_count !== undefined && (
                          <div className="text-right">
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4 text-gray-400" />
                              <span className="font-medium text-gray-900">
                                {department.employee_count}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              employee
                              {department.employee_count !== 1 ? 's' : ''}
                            </div>
                          </div>
                        )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Selection Summary Footer */}
      {selectedDepartments.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Check className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium text-blue-900">
                  {selectedDepartments.length} department
                  {selectedDepartments.length !== 1 ? 's' : ''} selected
                </h4>
                <p className="text-sm text-blue-700">
                  Survey will be sent to employees in these departments
                </p>
              </div>
            </div>
            {showEmployeeCount && (
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-900">
                  {totalEmployees}
                </div>
                <div className="text-sm text-blue-700">total recipients</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
