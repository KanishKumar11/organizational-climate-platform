'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { SuccessDialog } from '@/components/ui/success-dialog';
import { Loading } from '@/components/ui/Loading';
import {
  Building,
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Users,
  ChevronRight,
  ChevronDown,
  Eye,
  Settings,
  Download,
  Upload,
  Grid3X3,
  List,
  TreePine,
  BarChart3,
  UserPlus,
  Move,
  Copy,
  Archive,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Department {
  _id: string;
  name: string;
  description?: string;
  company_id: string;
  is_active: boolean;
  hierarchy: {
    level: number;
    parent_department_id?: string;
  };
  manager_id?: string;
  manager_name?: string;
  user_count?: number;
  children?: Department[];
  created_at?: string;
  updated_at?: string;
}

interface DepartmentFormData {
  name: string;
  description: string;
  parent_department_id?: string;
  manager_id?: string;
}

type ViewMode = 'tree' | 'grid' | 'list';
type SortField = 'name' | 'user_count' | 'created_at' | 'level';
type SortOrder = 'asc' | 'desc';

export default function ModernDepartmentManagement() {
  // State Management
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('tree');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [selectedDepartments, setSelectedDepartments] = useState<Set<string>>(
    new Set()
  );
  const [expandedDepartments, setExpandedDepartments] = useState<Set<string>>(
    new Set()
  );
  const [showInactive, setShowInactive] = useState(false);

  // Dialog States
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(
    null
  );
  const [deletingDepartment, setDeletingDepartment] =
    useState<Department | null>(null);

  // Form States
  const [formData, setFormData] = useState<DepartmentFormData>({
    name: '',
    description: '',
    parent_department_id: 'root', // Use 'root' instead of empty string
    manager_id: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Success/Error States
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Data Fetching
  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/departments');
      if (response.ok) {
        const data = await response.json();
        const hierarchicalDepartments = buildDepartmentHierarchy(
          data.departments || []
        );
        setDepartments(hierarchicalDepartments);
        // Auto-expand first level
        const firstLevelIds = hierarchicalDepartments.map((d) => d._id);
        setExpandedDepartments(new Set(firstLevelIds));
      } else {
        setErrorMessage('Failed to load departments. Please try again.');
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
      setErrorMessage('An error occurred while loading departments.');
    } finally {
      setLoading(false);
    }
  };

  const buildDepartmentHierarchy = (
    flatDepartments: Department[]
  ): Department[] => {
    const departmentMap = new Map<string, Department>();
    const rootDepartments: Department[] = [];

    // Create a map of all departments
    flatDepartments.forEach((dept) => {
      departmentMap.set(dept._id, { ...dept, children: [] });
    });

    // Build the hierarchy
    flatDepartments.forEach((dept) => {
      const department = departmentMap.get(dept._id)!;

      if (dept.hierarchy.parent_department_id) {
        const parent = departmentMap.get(dept.hierarchy.parent_department_id);
        if (parent) {
          parent.children!.push(department);
        } else {
          rootDepartments.push(department);
        }
      } else {
        rootDepartments.push(department);
      }
    });

    return rootDepartments;
  };

  // Filtered and Sorted Data
  const filteredDepartments = useMemo(() => {
    const filterDepartments = (depts: Department[]): Department[] => {
      return depts
        .filter((dept) => {
          const matchesSearch =
            dept.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            dept.description?.toLowerCase().includes(searchQuery.toLowerCase());
          const matchesActive = showInactive || dept.is_active;

          return matchesSearch && matchesActive;
        })
        .map((dept) => ({
          ...dept,
          children: dept.children ? filterDepartments(dept.children) : [],
        }));
    };

    return filterDepartments(departments);
  }, [departments, searchQuery, showInactive]);

  // Helper function to flatten department hierarchy
  const flattenDepartments = (depts: Department[]): Department[] => {
    const result: Department[] = [];
    const traverse = (departments: Department[]) => {
      departments.forEach((dept) => {
        result.push(dept);
        if (dept.children) {
          traverse(dept.children);
        }
      });
    };
    traverse(depts);
    return result;
  };

  // Statistics
  const stats = useMemo(() => {
    const flatDepartments = flattenDepartments(departments);
    return {
      total: flatDepartments.length,
      active: flatDepartments.filter((d) => d.is_active).length,
      inactive: flatDepartments.filter((d) => !d.is_active).length,
      totalUsers: flatDepartments.reduce(
        (sum, d) => sum + (d.user_count || 0),
        0
      ),
      maxLevel: Math.max(...flatDepartments.map((d) => d.hierarchy.level), 0),
      withManagers: flatDepartments.filter((d) => d.manager_id).length,
    };
  }, [departments]);

  // Event Handlers
  const handleCreateDepartment = async () => {
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);

      // Convert 'root' back to undefined for API
      const apiData = {
        ...formData,
        parent_department_id:
          formData.parent_department_id === 'root'
            ? undefined
            : formData.parent_department_id,
      };

      const response = await fetch('/api/admin/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiData),
      });

      if (response.ok) {
        setSuccessMessage('Department created successfully!');
        setShowCreateDialog(false);
        resetForm();
        fetchDepartments();
      } else {
        const error = await response.json();
        setErrorMessage(error.message || 'Failed to create department');
      }
    } catch (error) {
      console.error('Error creating department:', error);
      setErrorMessage('An error occurred while creating the department');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditDepartment = async () => {
    if (!editingDepartment || !validateForm()) return;

    try {
      setIsSubmitting(true);

      // Convert 'root' back to undefined for API
      const apiData = {
        ...formData,
        parent_department_id:
          formData.parent_department_id === 'root'
            ? undefined
            : formData.parent_department_id,
      };

      const response = await fetch(
        `/api/admin/departments/${editingDepartment._id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(apiData),
        }
      );

      if (response.ok) {
        setSuccessMessage('Department updated successfully!');
        setShowEditDialog(false);
        setEditingDepartment(null);
        resetForm();
        fetchDepartments();
      } else {
        const error = await response.json();
        setErrorMessage(error.message || 'Failed to update department');
      }
    } catch (error) {
      console.error('Error updating department:', error);
      setErrorMessage('An error occurred while updating the department');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDepartment = async () => {
    if (!deletingDepartment) return;

    try {
      setIsSubmitting(true);
      const response = await fetch(
        `/api/admin/departments/${deletingDepartment._id}`,
        {
          method: 'DELETE',
        }
      );

      if (response.ok) {
        setSuccessMessage('Department deleted successfully!');
        setShowDeleteDialog(false);
        setDeletingDepartment(null);
        fetchDepartments();
      } else {
        const error = await response.json();
        setErrorMessage(error.message || 'Failed to delete department');
      }
    } catch (error) {
      console.error('Error deleting department:', error);
      setErrorMessage('An error occurred while deleting the department');
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'Department name is required';
    } else if (formData.name.length < 2) {
      errors.name = 'Department name must be at least 2 characters';
    } else if (formData.name.length > 100) {
      errors.name = 'Department name must be less than 100 characters';
    }

    if (formData.description && formData.description.length > 500) {
      errors.description = 'Description must be less than 500 characters';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      parent_department_id: 'root', // Use 'root' instead of empty string
      manager_id: '',
    });
    setFormErrors({});
  };

  const openEditDialog = (department: Department) => {
    setEditingDepartment(department);
    setFormData({
      name: department.name,
      description: department.description || '',
      parent_department_id: department.hierarchy.parent_department_id || 'root', // Use 'root' instead of empty string
      manager_id: department.manager_id || '',
    });
    setShowEditDialog(true);
  };

  const openDeleteDialog = (department: Department) => {
    setDeletingDepartment(department);
    setShowDeleteDialog(true);
  };

  const toggleExpanded = (departmentId: string) => {
    const newExpanded = new Set(expandedDepartments);
    if (newExpanded.has(departmentId)) {
      newExpanded.delete(departmentId);
    } else {
      newExpanded.add(departmentId);
    }
    setExpandedDepartments(newExpanded);
  };

  const toggleDepartmentSelection = (departmentId: string) => {
    const newSelected = new Set(selectedDepartments);
    if (newSelected.has(departmentId)) {
      newSelected.delete(departmentId);
    } else {
      newSelected.add(departmentId);
    }
    setSelectedDepartments(newSelected);
  };

  const selectAllDepartments = () => {
    const allIds = flattenDepartments(filteredDepartments).map((d) => d._id);
    setSelectedDepartments(new Set(allIds));
  };

  const clearSelection = () => {
    setSelectedDepartments(new Set());
  };

  // Rendering Functions
  const renderDepartmentTree = (
    department: Department,
    level: number
  ): React.ReactNode => {
    const isExpanded = expandedDepartments.has(department._id);
    const hasChildren = department.children && department.children.length > 0;
    const isSelected = selectedDepartments.has(department._id);

    return (
      <div key={department._id} className="select-none">
        <div
          className={`flex items-center gap-2 p-3 rounded-lg border transition-colors hover:bg-gray-50 ${
            isSelected ? 'bg-blue-50 border-blue-200' : 'border-gray-200'
          }`}
          style={{ marginLeft: `${level * 24}px` }}
        >
          {/* Expand/Collapse Button */}
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => toggleExpanded(department._id)}
            disabled={!hasChildren}
          >
            {hasChildren ? (
              isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )
            ) : (
              <div className="h-4 w-4" />
            )}
          </Button>

          {/* Selection Checkbox */}
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => toggleDepartmentSelection(department._id)}
            className="h-4 w-4 cursor-pointer"
          />

          {/* Department Icon */}
          <div
            className={`p-1.5 rounded-lg ${
              department.is_active ? 'bg-blue-100' : 'bg-gray-100'
            }`}
          >
            <Building
              className={`h-4 w-4 ${
                department.is_active ? 'text-blue-600' : 'text-gray-400'
              }`}
            />
          </div>

          {/* Department Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4
                className={`font-medium truncate ${
                  department.is_active ? 'text-gray-900' : 'text-gray-500'
                }`}
              >
                {department.name}
              </h4>
              {!department.is_active && (
                <Badge variant="secondary" className="text-xs">
                  Inactive
                </Badge>
              )}
              {department.manager_name && (
                <Badge variant="outline" className="text-xs">
                  Manager: {department.manager_name}
                </Badge>
              )}
            </div>
            {department.description && (
              <p className="text-sm text-gray-600 truncate mt-1">
                {department.description}
              </p>
            )}
          </div>

          {/* User Count */}
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <Users className="h-4 w-4" />
            <span>{department.user_count || 0}</span>
          </div>

          {/* Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 cursor-pointer"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => openEditDialog(department)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem>
                <UserPlus className="h-4 w-4 mr-2" />
                Assign Users
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Copy className="h-4 w-4 mr-2" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Move className="h-4 w-4 mr-2" />
                Move
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => openDeleteDialog(department)}
                className="text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div className="mt-1">
            {department.children!.map((child) =>
              renderDepartmentTree(child, level + 1)
            )}
          </div>
        )}
      </div>
    );
  };

  const renderDepartmentCard = (department: Department): React.ReactNode => {
    const isSelected = selectedDepartments.has(department._id);

    return (
      <Card
        key={department._id}
        className={`group relative overflow-hidden transition-all duration-200 hover:shadow-lg hover:shadow-blue-100/50 hover:-translate-y-1 border-0 bg-gradient-to-br from-white to-gray-50/30 cursor-pointer ${
          isSelected
            ? 'ring-2 ring-blue-500 shadow-lg shadow-blue-100/50 bg-gradient-to-br from-blue-50/50 to-white'
            : 'hover:border-blue-200'
        } ${!department.is_active ? 'opacity-75' : ''}`}
      >
        {/* Status Indicator Strip */}
        <div
          className={`absolute top-0 left-0 right-0 h-1 ${
            department.is_active
              ? 'bg-gradient-to-r from-green-400 to-emerald-500'
              : 'bg-gradient-to-r from-gray-300 to-gray-400'
          }`}
        />

        <CardContent className="p-6">
          {/* Header Section */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <Checkbox
                checked={isSelected}
                onCheckedChange={() =>
                  toggleDepartmentSelection(department._id)
                }
                className="h-4 w-4 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 cursor-pointer"
              />
              <div
                className={`relative p-3 rounded-xl shadow-sm transition-all duration-200 ${
                  department.is_active
                    ? 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-blue-200/50'
                    : 'bg-gradient-to-br from-gray-400 to-gray-500 shadow-gray-200/50'
                }`}
              >
                <Building className="h-6 w-6 text-white" />
                {department.is_active && (
                  <div className="absolute -top-1 -right-1 h-3 w-3 bg-green-400 rounded-full border-2 border-white shadow-sm" />
                )}
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-gray-100 cursor-pointer"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={() => openEditDialog(department)}
                  className="cursor-pointer"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Department
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => openDeleteDialog(department)}
                  className="cursor-pointer text-red-600 focus:text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Department
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Department Info Section */}
          <div className="space-y-4">
            {/* Title and Status */}
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <h3
                  className={`text-lg font-bold leading-tight ${
                    department.is_active ? 'text-gray-900' : 'text-gray-600'
                  }`}
                >
                  {department.name}
                </h3>
                {!department.is_active && (
                  <Badge
                    variant="secondary"
                    className="text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200"
                  >
                    Inactive
                  </Badge>
                )}
              </div>

              {department.description && (
                <p className="text-sm text-gray-600 leading-relaxed line-clamp-2 pr-2">
                  {department.description}
                </p>
              )}
            </div>

            {/* Metrics Section */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 p-2 bg-gray-50/50 rounded-lg border border-gray-100">
                <div className="p-1.5 bg-purple-100 rounded-md">
                  <Users className="h-3.5 w-3.5 text-purple-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-500 font-medium">Users</p>
                  <p className="text-sm font-bold text-gray-900">
                    {department.user_count || 0}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2 bg-gray-50/50 rounded-lg border border-gray-100">
                <div className="p-1.5 bg-orange-100 rounded-md">
                  <BarChart3 className="h-3.5 w-3.5 text-orange-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-500 font-medium">Level</p>
                  <p className="text-sm font-bold text-gray-900">
                    {department.hierarchy.level}
                  </p>
                </div>
              </div>
            </div>

            {/* Manager Section */}
            {department.manager_name && (
              <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg border border-indigo-100">
                <div className="p-1.5 bg-indigo-100 rounded-md">
                  <Target className="h-3.5 w-3.5 text-indigo-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-indigo-600 font-medium uppercase tracking-wide">
                    Manager
                  </p>
                  <p className="text-sm font-semibold text-indigo-900 truncate">
                    {department.manager_name}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderDepartmentListItem = (
    department: Department
  ): React.ReactNode => {
    const isSelected = selectedDepartments.has(department._id);

    return (
      <div
        key={department._id}
        className={`group relative flex items-center gap-4 p-4 rounded-xl border-0 transition-all duration-200 hover:shadow-md hover:shadow-blue-100/30 bg-gradient-to-r from-white to-gray-50/30 cursor-pointer ${
          isSelected
            ? 'bg-gradient-to-r from-blue-50/50 to-white shadow-md shadow-blue-100/50 ring-1 ring-blue-200'
            : 'hover:bg-gradient-to-r hover:from-gray-50/50 hover:to-white'
        } ${!department.is_active ? 'opacity-75' : ''}`}
      >
        {/* Status Indicator */}
        <div
          className={`absolute left-0 top-2 bottom-2 w-1 rounded-r-full ${
            department.is_active
              ? 'bg-gradient-to-b from-green-400 to-emerald-500'
              : 'bg-gradient-to-b from-gray-300 to-gray-400'
          }`}
        />

        <div className="flex items-center gap-4 flex-1 min-w-0 pl-2">
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => toggleDepartmentSelection(department._id)}
            className="h-4 w-4 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 cursor-pointer"
          />

          <div
            className={`relative p-2.5 rounded-xl shadow-sm transition-all duration-200 ${
              department.is_active
                ? 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-blue-200/50'
                : 'bg-gradient-to-br from-gray-400 to-gray-500 shadow-gray-200/50'
            }`}
          >
            <Building className="h-5 w-5 text-white" />
            {department.is_active && (
              <div className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 bg-green-400 rounded-full border border-white shadow-sm" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <h3
                className={`font-bold text-base truncate ${
                  department.is_active ? 'text-gray-900' : 'text-gray-600'
                }`}
              >
                {department.name}
              </h3>
              {!department.is_active && (
                <Badge
                  variant="secondary"
                  className="text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200"
                >
                  Inactive
                </Badge>
              )}
              <Badge
                variant="outline"
                className="text-xs font-medium bg-orange-50 text-orange-700 border-orange-200"
              >
                Level {department.hierarchy.level}
              </Badge>
            </div>
            {department.description && (
              <p className="text-sm text-gray-600 truncate leading-relaxed">
                {department.description}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-6">
          {/* User Count */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 rounded-lg border border-purple-100">
            <div className="p-1 bg-purple-100 rounded-md">
              <Users className="h-3.5 w-3.5 text-purple-600" />
            </div>
            <div className="text-sm">
              <span className="font-bold text-gray-900">
                {department.user_count || 0}
              </span>
              <span className="text-gray-500 ml-1">users</span>
            </div>
          </div>

          {/* Manager Info */}
          {department.manager_name && (
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-indigo-50 rounded-lg border border-indigo-100">
              <div className="p-1 bg-indigo-100 rounded-md">
                <Target className="h-3.5 w-3.5 text-indigo-600" />
              </div>
              <div className="text-sm">
                <span className="text-indigo-600 font-medium">Manager:</span>
                <span className="text-indigo-900 font-semibold ml-1">
                  {department.manager_name}
                </span>
              </div>
            </div>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-gray-100 cursor-pointer"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                onClick={() => openEditDialog(department)}
                className="cursor-pointer"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Department
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => openDeleteDialog(department)}
                className="cursor-pointer text-red-600 focus:text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Department
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loading />
          <p className="text-sm text-muted-foreground">
            Loading departments...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Building className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold">{stats.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Clock className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Inactive</p>
                <p className="text-2xl font-bold">{stats.inactive}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Employees</p>
                <p className="text-2xl font-bold">{stats.totalUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <BarChart3 className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Max Level</p>
                <p className="text-2xl font-bold">{stats.maxLevel}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Target className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Managed</p>
                <p className="text-2xl font-bold">{stats.withManagers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Card */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <CardTitle className="text-2xl">Department Structure</CardTitle>
              <p className="text-muted-foreground mt-1">
                Manage your organizational hierarchy and department settings
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setShowCreateDialog(true)}
                className="bg-blue-600 hover:bg-blue-700 cursor-pointer"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Department
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="cursor-pointer">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Download className="h-4 w-4 mr-2" />
                    Export Structure
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Upload className="h-4 w-4 mr-2" />
                    Import Departments
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Search and Filters */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search departments..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* View Mode Toggle */}
              <div className="flex items-center border rounded-lg p-1">
                <Button
                  variant={viewMode === 'tree' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('tree')}
                  className="h-8 px-3 cursor-pointer"
                >
                  <TreePine className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="h-8 px-3 cursor-pointer"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="h-8 px-3 cursor-pointer"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2">
                <Checkbox
                  id="show-inactive"
                  checked={showInactive}
                  onCheckedChange={(checked) =>
                    setShowInactive(checked === true)
                  }
                  className="cursor-pointer"
                />
                <Label htmlFor="show-inactive" className="text-sm">
                  Show inactive
                </Label>
              </div>

              <Select
                value={sortField}
                onValueChange={(value: SortField) => setSortField(value)}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="user_count">Users</SelectItem>
                  <SelectItem value="created_at">Created</SelectItem>
                  <SelectItem value="level">Level</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedDepartments.size > 0 && (
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  {selectedDepartments.size} department
                  {selectedDepartments.size !== 1 ? 's' : ''} selected
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearSelection}
                  className="cursor-pointer"
                >
                  Clear
                </Button>
                <Button variant="outline" size="sm" className="cursor-pointer">
                  <Archive className="h-4 w-4 mr-2" />
                  Archive
                </Button>
                <Button variant="outline" size="sm" className="cursor-pointer">
                  <Move className="h-4 w-4 mr-2" />
                  Move
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="cursor-pointer"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          )}

          {/* Department Content */}
          <div className="min-h-[400px]">
            {filteredDepartments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="p-4 bg-gray-100 rounded-full mb-4">
                  <Building className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No departments found
                </h3>
                <p className="text-gray-600 mb-6 max-w-md">
                  {searchQuery
                    ? 'No departments match your search criteria. Try adjusting your filters.'
                    : 'Get started by creating your first department to organize your company structure.'}
                </p>
                {!searchQuery && (
                  <Button
                    onClick={() => setShowCreateDialog(true)}
                    className="cursor-pointer"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Department
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {viewMode === 'tree' && (
                  <div className="space-y-1">
                    {filteredDepartments.map((department) =>
                      renderDepartmentTree(department, 0)
                    )}
                  </div>
                )}

                {viewMode === 'grid' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {flattenDepartments(filteredDepartments).map((department) =>
                      renderDepartmentCard(department)
                    )}
                  </div>
                )}

                {viewMode === 'list' && (
                  <div className="space-y-2">
                    {flattenDepartments(filteredDepartments).map((department) =>
                      renderDepartmentListItem(department)
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Success Dialog */}
      <SuccessDialog
        open={!!successMessage}
        onOpenChange={() => setSuccessMessage('')}
        title="Success"
        description={successMessage}
      />

      {/* Error Dialog */}
      <ConfirmationDialog
        open={!!errorMessage}
        onOpenChange={() => setErrorMessage('')}
        title="Error"
        description={errorMessage}
        confirmText="OK"
        onConfirm={() => setErrorMessage('')}
        variant="destructive"
      />

      {/* Create Department Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Department</DialogTitle>
            <DialogDescription>
              Add a new department to your organizational structure.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Department Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Enter department name"
                className={formErrors.name ? 'border-red-500' : ''}
              />
              {formErrors.name && (
                <p className="text-sm text-red-600">{formErrors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Enter department description (optional)"
                rows={3}
                className={formErrors.description ? 'border-red-500' : ''}
              />
              {formErrors.description && (
                <p className="text-sm text-red-600">{formErrors.description}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="parent">Parent Department</Label>
              <Select
                value={formData.parent_department_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, parent_department_id: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select parent department (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="root">No Parent (Root Level)</SelectItem>
                  {flattenDepartments(departments).map((dept) => (
                    <SelectItem key={dept._id} value={dept._id}>
                      {'  '.repeat(dept.hierarchy.level)}
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateDialog(false);
                resetForm();
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateDepartment}
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Department
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Department Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Department</DialogTitle>
            <DialogDescription>
              Update department information and settings.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Department Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Enter department name"
                className={formErrors.name ? 'border-red-500' : ''}
              />
              {formErrors.name && (
                <p className="text-sm text-red-600">{formErrors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Enter department description (optional)"
                rows={3}
                className={formErrors.description ? 'border-red-500' : ''}
              />
              {formErrors.description && (
                <p className="text-sm text-red-600">{formErrors.description}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-parent">Parent Department</Label>
              <Select
                value={formData.parent_department_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, parent_department_id: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select parent department (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="root">No Parent (Root Level)</SelectItem>
                  {flattenDepartments(departments)
                    .filter((dept) => dept._id !== editingDepartment?._id) // Prevent self-parent
                    .map((dept) => (
                      <SelectItem key={dept._id} value={dept._id}>
                        {'  '.repeat(dept.hierarchy.level)}
                        {dept.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowEditDialog(false);
                setEditingDepartment(null);
                resetForm();
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditDepartment}
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Updating...
                </>
              ) : (
                <>
                  <Edit className="h-4 w-4 mr-2" />
                  Update Department
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Delete Department
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingDepartment?.name}"? This
              action cannot be undone.
              {deletingDepartment?.children &&
                deletingDepartment.children.length > 0 && (
                  <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-amber-800 text-sm font-medium">
                      ⚠️ This department has{' '}
                      {deletingDepartment.children.length} sub-department(s).
                      They will be moved to the parent level.
                    </p>
                  </div>
                )}
              {(deletingDepartment?.user_count || 0) > 0 && (
                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-blue-800 text-sm font-medium">
                    👥 This department has {deletingDepartment?.user_count}{' '}
                    employee(s) assigned. They will need to be reassigned.
                  </p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteDepartment}
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Department
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
