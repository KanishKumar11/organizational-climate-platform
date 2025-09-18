'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loading } from '@/components/ui/Loading';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Users,
  Building,
  Filter,
  Check,
  X,
  ChevronDown,
  ChevronRight,
  Target,
} from 'lucide-react';

interface Department {
  _id: string;
  name: string;
  description?: string;
  employee_count: number;
  hierarchy: {
    parent_department_id?: string;
    level: number;
    path: string;
  };
  manager_id?: string;
  is_active: boolean;
  children?: Department[];
}

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  department_id: string;
}

interface DepartmentTargetingProps {
  selectedDepartmentIds: string[];
  onDepartmentChange: (departmentIds: string[]) => void;
  roleFilters?: string[];
  onRoleFilterChange?: (roles: string[]) => void;
  includeManagers: boolean;
  onIncludeManagersChange: (include: boolean) => void;
  maxParticipants?: number;
  onMaxParticipantsChange?: (max?: number) => void;
  showPreview?: boolean;
}

const ROLE_OPTIONS = [
  {
    value: 'employee',
    label: 'Employees',
    description: 'Regular team members',
  },
  {
    value: 'supervisor',
    label: 'Supervisors',
    description: 'Team leads and supervisors',
  },
  { value: 'leader', label: 'Leaders', description: 'Department leaders' },
  {
    value: 'company_admin',
    label: 'Company Admins',
    description: 'Company administrators',
  },
];

export default function DepartmentTargeting({
  selectedDepartmentIds,
  onDepartmentChange,
  roleFilters = [],
  onRoleFilterChange,
  includeManagers,
  onIncludeManagersChange,
  maxParticipants,
  onMaxParticipantsChange,
  showPreview = true,
}: DepartmentTargetingProps) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [expandedDepartments, setExpandedDepartments] = useState<Set<string>>(
    new Set()
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [previewUsers, setPreviewUsers] = useState<User[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [showRoleFilters, setShowRoleFilters] = useState(false);

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    if (showPreview && selectedDepartmentIds.length > 0) {
      fetchPreviewUsers();
    }
  }, [selectedDepartmentIds, roleFilters, includeManagers, showPreview]);

  const fetchDepartments = async () => {
    try {
      // Use the targeting-specific endpoint for broader department access
      const response = await fetch('/api/departments/for-targeting');
      if (response.ok) {
        const data = await response.json();
        const hierarchicalDepartments = buildDepartmentHierarchy(
          data.departments || []
        );
        setDepartments(hierarchicalDepartments);

        // Log helpful information for debugging
        console.log('Departments loaded for targeting:', {
          count: data.departments?.length || 0,
          userContext: data.user_context,
          canTargetAllCompanyDepartments:
            data.user_context?.can_target_all_company_departments,
        });
      } else {
        // Fallback to regular departments endpoint if targeting endpoint fails
        console.warn(
          'Targeting endpoint failed, falling back to regular departments'
        );
        const fallbackResponse = await fetch('/api/departments');
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          const hierarchicalDepartments = buildDepartmentHierarchy(
            fallbackData.departments || []
          );
          setDepartments(hierarchicalDepartments);
        }
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
      // Try fallback endpoint
      try {
        const fallbackResponse = await fetch('/api/departments');
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          const hierarchicalDepartments = buildDepartmentHierarchy(
            fallbackData.departments || []
          );
          setDepartments(hierarchicalDepartments);
        }
      } catch (fallbackError) {
        console.error('Fallback departments fetch also failed:', fallbackError);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchPreviewUsers = async () => {
    if (selectedDepartmentIds.length === 0) {
      setPreviewUsers([]);
      return;
    }

    setPreviewLoading(true);
    try {
      const params = new URLSearchParams();
      selectedDepartmentIds.forEach((id) =>
        params.append('department_ids', id)
      );
      if (roleFilters.length > 0) {
        roleFilters.forEach((role) => params.append('role_filters', role));
      }
      params.append('include_managers', includeManagers.toString());
      if (maxParticipants) {
        params.append('max_participants', maxParticipants.toString());
      }

      const response = await fetch(`/api/users/preview?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setPreviewUsers(data.users || []);
      }
    } catch (error) {
      console.error('Error fetching preview users:', error);
    } finally {
      setPreviewLoading(false);
    }
  };

  const buildDepartmentHierarchy = (
    flatDepartments: Department[]
  ): Department[] => {
    const departmentMap = new Map<string, Department>();
    const rootDepartments: Department[] = [];

    // Create map and initialize children arrays
    flatDepartments.forEach((dept) => {
      departmentMap.set(dept._id, { ...dept, children: [] });
    });

    // Build hierarchy
    flatDepartments.forEach((dept) => {
      const department = departmentMap.get(dept._id)!;
      if (dept.hierarchy.parent_department_id) {
        const parent = departmentMap.get(dept.hierarchy.parent_department_id);
        if (parent) {
          parent.children!.push(department);
        }
      } else {
        rootDepartments.push(department);
      }
    });

    return rootDepartments;
  };

  const toggleDepartmentExpansion = (departmentId: string) => {
    const newExpanded = new Set(expandedDepartments);
    if (newExpanded.has(departmentId)) {
      newExpanded.delete(departmentId);
    } else {
      newExpanded.add(departmentId);
    }
    setExpandedDepartments(newExpanded);
  };

  const handleDepartmentToggle = (departmentId: string, checked: boolean) => {
    let newSelectedIds = [...selectedDepartmentIds];

    if (checked) {
      if (!newSelectedIds.includes(departmentId)) {
        newSelectedIds.push(departmentId);
      }
    } else {
      newSelectedIds = newSelectedIds.filter((id) => id !== departmentId);
    }

    onDepartmentChange(newSelectedIds);
  };

  const handleRoleFilterToggle = (role: string, checked: boolean) => {
    if (!onRoleFilterChange) return;

    let newRoleFilters = [...roleFilters];

    if (checked) {
      if (!newRoleFilters.includes(role)) {
        newRoleFilters.push(role);
      }
    } else {
      newRoleFilters = newRoleFilters.filter((r) => r !== role);
    }

    onRoleFilterChange(newRoleFilters);
  };

  const renderDepartment = (department: Department, level: number = 0) => {
    const isSelected = selectedDepartmentIds.includes(department._id);
    const hasChildren = department.children && department.children.length > 0;
    const isExpanded = expandedDepartments.has(department._id);
    const matchesSearch = department.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    if (
      searchTerm &&
      !matchesSearch &&
      !hasChildrenMatchingSearch(department)
    ) {
      return null;
    }

    return (
      <div key={department._id} className="space-y-1">
        <div
          className={`flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50 ${
            level > 0 ? `ml-${level * 4}` : ''
          }`}
        >
          {hasChildren && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleDepartmentExpansion(department._id)}
              className="p-1 h-6 w-6"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </Button>
          )}

          {!hasChildren && <div className="w-6" />}

          <label className="flex items-center space-x-3 flex-1 cursor-pointer">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) =>
                handleDepartmentToggle(department._id, e.target.checked)
              }
              className="rounded border-gray-300 text-green-600 focus:ring-green-500"
            />
            <div className="flex items-center space-x-2 flex-1">
              <Building className="w-4 h-4 text-gray-400" />
              <div className="flex-1">
                <div className="font-medium text-gray-900">
                  {department.name}
                </div>
                {department.description && (
                  <div className="text-sm text-gray-500">
                    {department.description}
                  </div>
                )}
                <div className="text-xs text-gray-400">
                  {department.employee_count} employees •{' '}
                  {department.hierarchy.path}
                </div>
              </div>
            </div>
            <Badge variant="outline" className="text-xs">
              {department.employee_count}
            </Badge>
          </label>
        </div>

        <AnimatePresence>
          {hasChildren && isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              {department.children!.map((child) =>
                renderDepartment(child, level + 1)
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const hasChildrenMatchingSearch = (department: Department): boolean => {
    if (!department.children) return false;

    return department.children.some(
      (child) =>
        child.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        hasChildrenMatchingSearch(child)
    );
  };

  const getTotalSelectedEmployees = () => {
    const selectedDepartments = departments.filter((dept) =>
      selectedDepartmentIds.includes(dept._id)
    );
    return selectedDepartments.reduce(
      (total, dept) => total + dept.employee_count,
      0
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loading size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Department Selection */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Select Departments
          </h3>
          <Badge variant="outline">
            {selectedDepartmentIds.length} selected
          </Badge>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search departments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Department Tree */}
        <div className="max-h-64 overflow-y-auto space-y-1">
          {departments.map((department) => renderDepartment(department))}
        </div>

        {departments.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Building className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No departments found</p>
          </div>
        )}
      </Card>

      {/* Role Filters */}
      {onRoleFilterChange && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Role Filters
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowRoleFilters(!showRoleFilters)}
            >
              <Filter className="w-4 h-4 mr-2" />
              {showRoleFilters ? 'Hide' : 'Show'} Filters
            </Button>
          </div>

          <AnimatePresence>
            {showRoleFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3"
              >
                {ROLE_OPTIONS.map((role) => (
                  <label
                    key={role.value}
                    className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded"
                  >
                    <input
                      type="checkbox"
                      checked={roleFilters.includes(role.value)}
                      onChange={(e) =>
                        handleRoleFilterToggle(role.value, e.target.checked)
                      }
                      className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {role.label}
                      </div>
                      <div className="text-sm text-gray-500">
                        {role.description}
                      </div>
                    </div>
                  </label>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      )}

      {/* Additional Settings */}
      <Card className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Additional Settings
        </h3>

        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="include_managers"
              checked={includeManagers}
              onChange={(e) => onIncludeManagersChange(e.target.checked)}
              className="rounded border-gray-300 text-green-600 focus:ring-green-500"
            />
            <label
              htmlFor="include_managers"
              className="text-sm font-medium text-gray-700"
            >
              Include managers and supervisors
            </label>
          </div>

          {onMaxParticipantsChange && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Maximum Participants (optional)
              </label>
              <Input
                type="number"
                min="1"
                value={maxParticipants || ''}
                onChange={(e) =>
                  onMaxParticipantsChange(
                    e.target.value ? parseInt(e.target.value) : undefined
                  )
                }
                placeholder="Leave empty for no limit"
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                If specified, participants will be randomly selected from the
                target audience
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Preview */}
      {showPreview && selectedDepartmentIds.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Target Audience Preview
            </h3>
            {previewLoading ? (
              <Loading size="sm" />
            ) : (
              <Badge variant="outline">
                {previewUsers.length} participants
              </Badge>
            )}
          </div>

          {previewLoading ? (
            <div className="flex items-center justify-center h-16">
              <Loading size="md" />
            </div>
          ) : previewUsers.length > 0 ? (
            <div className="space-y-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Total Participants:</span>{' '}
                  {previewUsers.length}
                </div>
                <div>
                  <span className="font-medium">Departments:</span>{' '}
                  {selectedDepartmentIds.length}
                </div>
              </div>

              {maxParticipants && previewUsers.length > maxParticipants && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> {maxParticipants} participants will
                    be randomly selected from {previewUsers.length} eligible
                    users.
                  </p>
                </div>
              )}

              <div className="max-h-32 overflow-y-auto">
                <div className="text-xs text-gray-500 space-y-1">
                  {previewUsers.slice(0, 10).map((user) => (
                    <div
                      key={user._id}
                      className="flex items-center justify-between"
                    >
                      <span>{user.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {user.role}
                      </Badge>
                    </div>
                  ))}
                  {previewUsers.length > 10 && (
                    <div className="text-center py-2 text-gray-400">
                      ... and {previewUsers.length - 10} more
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Target className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No users match the current targeting criteria</p>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
