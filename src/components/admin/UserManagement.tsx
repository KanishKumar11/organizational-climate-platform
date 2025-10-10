'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslations } from '@/contexts/TranslationContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loading } from '@/components/ui/Loading';
import { Pagination } from '@/components/ui/pagination';
import { useConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { useToast } from '@/hooks/use-toast';
import { UsersExportButton } from '@/components/exports/export-buttons';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Users,
  Search,
  Plus,
  Edit,
  Trash2,
  Mail,
  Building,
  Download,
  MoreHorizontal,
  Grid3X3,
  List,
  Eye,
  Settings,
  CheckCircle,
  Clock,
  Target,
  Crown,
  Shield,
  User,
  Table as TableIcon,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';

export interface UserStats {
  total: number;
  active: number;
  inactive: number;
  departments: number;
  roleDistribution: Record<string, number>;
}

interface UserManagementProps {
  onStatsChange?: (stats: UserStats) => void;
}

interface User {
  _id: string;
  name: string;
  email: string;
  role:
    | 'employee'
    | 'supervisor'
    | 'leader'
    | 'department_admin'
    | 'company_admin'
    | 'super_admin';
  department_id: string;
  department_name?: string;
  company_id: string;
  is_active: boolean;
  created_at: string;
  last_login?: string;
}

interface Department {
  _id: string;
  name: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

const ROLE_LABELS = {
  employee: 'Employee',
  supervisor: 'Supervisor',
  leader: 'Leader',
  department_admin: 'Department Admin',
  company_admin: 'Company Admin',
  super_admin: 'Super Admin',
};

const ROLE_COLORS = {
  employee: 'bg-gray-100 text-gray-800',
  supervisor: 'bg-blue-100 text-blue-800',
  leader: 'bg-green-100 text-green-800',
  department_admin: 'bg-purple-100 text-purple-800',
  company_admin: 'bg-orange-100 text-orange-800',
  super_admin: 'bg-red-100 text-red-800',
};

export default function UserManagement({ onStatsChange }: UserManagementProps) {
  const { showConfirmation, ConfirmationDialog } = useConfirmationDialog();
  const { success, error } = useToast();
  const t = useTranslations('users');
  const common = useTranslations('common');
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'table'>('table');
  const [showInactive, setShowInactive] = useState(true);
  const [sortField, setSortField] = useState<keyof User>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [isExporting, setIsExporting] = useState(false);

  const numberFormatter = useMemo(() => new Intl.NumberFormat('en-US'), []);
  const formatNumber = (value: number) => numberFormatter.format(value);

  // Add User Modal State
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'employee' as User['role'],
    department_id: '',
    password: '',
  });

  // Edit User Modal State
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [isUpdatingUser, setIsUpdatingUser] = useState(false);
  const [editingUser, setEditingUser] = useState<{
    id: string;
    name: string;
    email: string;
    role: User['role'];
    department_id: string;
    is_active: boolean;
  } | null>(null);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, [debouncedSearchTerm, roleFilter, statusFilter, departmentFilter]);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (debouncedSearchTerm) params.append('search', debouncedSearchTerm);
      if (roleFilter !== 'all') params.append('role', roleFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (departmentFilter !== 'all')
        params.append('department', departmentFilter);

      const response = await fetch(`/api/admin/users?${params}`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
        setPagination((prev) => ({
          ...prev,
          total: data.pagination.total,
          totalPages: data.pagination.totalPages,
          hasNext: data.pagination.hasNext,
          hasPrev: data.pagination.hasPrev,
        }));
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  }, [
    pagination.page,
    pagination.limit,
    debouncedSearchTerm,
    roleFilter,
    statusFilter,
    departmentFilter,
  ]);

  // Fetch users when pagination or filters change
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Fetch departments on mount
  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const response = await fetch('/api/departments');
      if (response.ok) {
        const data = await response.json();
        setDepartments(data.departments || []);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  };

  const handleLimitChange = (limit: number) => {
    setPagination((prev) => ({ ...prev, limit, page: 1 }));
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentStatus }),
      });

      if (response.ok) {
        fetchUsers(); // Refresh the list
      }
    } catch (error) {
      console.error('Error toggling user status:', error);
    }
  };

  // Sorting functionality
  const handleSort = (field: keyof User) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const getSortedUsers = (users: User[]) => {
    return [...users].sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      // Handle different data types
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const getSortIcon = (field: keyof User) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4" />;
    return sortOrder === 'asc' ? (
      <ArrowUp className="h-4 w-4" />
    ) : (
      <ArrowDown className="h-4 w-4" />
    );
  };

  const deleteUser = (userId: string, userName: string) => {
    showConfirmation({
      title: 'Delete User',
      description: `Are you sure you want to delete ${userName}? This action cannot be undone.`,
      confirmText: 'Delete',
      variant: 'destructive',
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/admin/users/${userId}`, {
            method: 'DELETE',
          });

          if (response.ok) {
            fetchUsers(); // Refresh the list
            success(
              'User deleted successfully',
              `${userName} has been removed from the system.`
            );
          } else {
            const errorData = await response.json();
            error(
              'Error deleting user',
              errorData.error || 'Failed to delete user'
            );
          }
        } catch (err) {
          console.error('Error deleting user:', err);
          error('Error deleting user', 'Please try again.');
        }
      },
    });
  };

  const createUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.department_id) {
      error('Please fill in all required fields');
      return;
    }

    setIsCreatingUser(true);
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          department_id: newUser.department_id,
          password: newUser.password || 'password123', // Default password if not provided
          is_active: true,
        }),
      });

      if (response.ok) {
        fetchUsers(); // Refresh the list
        setShowAddUserModal(false);
        setNewUser({
          name: '',
          email: '',
          role: 'employee',
          department_id: '',
          password: '',
        });
        success(
          'User created successfully!',
          `${newUser.name} has been added to the system.`
        );
      } else {
        const errorData = await response.json();
        error(
          'Error creating user',
          errorData.error || 'Unknown error occurred'
        );
      }
    } catch (err) {
      console.error('Error creating user:', err);
      error('Error creating user', 'Please try again.');
    } finally {
      setIsCreatingUser(false);
    }
  };

  const startEditingUser = (user: User) => {
    setEditingUser({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department_id: user.department_id,
      is_active: user.is_active,
    });
    setShowEditUserModal(true);
  };

  const updateUser = async () => {
    if (
      !editingUser ||
      !editingUser.name ||
      !editingUser.email ||
      !editingUser.department_id
    ) {
      error('Please fill in all required fields');
      return;
    }

    setIsUpdatingUser(true);
    try {
      const response = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingUser.name,
          email: editingUser.email,
          role: editingUser.role,
          department_id: editingUser.department_id,
          is_active: editingUser.is_active,
        }),
      });

      if (response.ok) {
        fetchUsers(); // Refresh the list
        setShowEditUserModal(false);
        setEditingUser(null);
        success(
          'User updated successfully!',
          `${editingUser.name}'s information has been updated.`
        );
      } else {
        const errorData = await response.json();
        error(
          'Error updating user',
          errorData.error || 'Unknown error occurred'
        );
      }
    } catch (err) {
      console.error('Error updating user:', err);
      error('Failed to update user', 'Please try again.');
    } finally {
      setIsUpdatingUser(false);
    }
  };

  const cancelEditUser = () => {
    setShowEditUserModal(false);
    setEditingUser(null);
  };

  // User selection functions
  const toggleUserSelection = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const selectAllUsers = () => {
    setSelectedUsers(users.map((user) => user._id));
  };

  const clearSelection = () => {
    setSelectedUsers([]);
  };

  // Statistics calculation
  const stats = useMemo<UserStats>(() => {
    const activeUsers = users.filter((u) => u.is_active).length;
    const inactiveUsers = users.filter((u) => !u.is_active).length;
    const roleDistribution = users.reduce(
      (acc, user) => {
        acc[user.role] = (acc[user.role] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      total: pagination.total,
      active: activeUsers,
      inactive: inactiveUsers,
      departments: departments.length,
      roleDistribution,
    };
  }, [users, pagination.total, departments.length]);

  useEffect(() => {
    if (onStatsChange) {
      onStatsChange(stats);
    }
  }, [stats, onStatsChange]);

  const activePercent =
    stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0;
  const inactivePercent =
    stats.total > 0 ? Math.round((stats.inactive / stats.total) * 100) : 0;
  const topRoleEntry = useMemo(() => {
    return Object.entries(stats.roleDistribution)
      .sort((a, b) => b[1] - a[1])
      .find((entry) => entry[1] > 0);
  }, [stats.roleDistribution]);

  const topRoleLabel = topRoleEntry
    ? ROLE_LABELS[topRoleEntry[0] as keyof typeof ROLE_LABELS]
    : null;

  const statCards = [
    {
      key: 'total',
      label: 'Total Users',
      value: stats.total,
      icon: Users,
      iconBg: 'bg-blue-500/10',
      iconColor: 'text-blue-600',
      accent: 'from-blue-500 via-sky-500 to-transparent',
      badge: 'All accounts',
      badgeClass: 'bg-blue-50 text-blue-600',
      description: `${formatNumber(stats.departments)} departments represented`,
      progress: null as number | null,
      progressLabel: null as string | null,
      progressColor: '',
    },
    {
      key: 'active',
      label: 'Active Users',
      value: stats.active,
      icon: CheckCircle,
      iconBg: 'bg-emerald-500/10',
      iconColor: 'text-emerald-600',
      accent: 'from-emerald-500 via-green-500 to-transparent',
      badge: `${activePercent}% active`,
      badgeClass: 'bg-emerald-50 text-emerald-600',
      description: `${formatNumber(stats.inactive)} inactive`,
      progress: activePercent,
      progressLabel: 'Active coverage',
      progressColor: 'bg-emerald-500',
    },
    {
      key: 'inactive',
      label: 'Inactive Users',
      value: stats.inactive,
      icon: Clock,
      iconBg: 'bg-amber-500/10',
      iconColor: 'text-amber-600',
      accent: 'from-amber-500 via-orange-500 to-transparent',
      badge: inactivePercent > 0 ? 'Re-engage' : 'All active',
      badgeClass: 'bg-amber-50 text-amber-600',
      description: `${inactivePercent}% of total accounts`,
      progress: inactivePercent,
      progressLabel: 'Inactive share',
      progressColor: 'bg-amber-500',
    },
    {
      key: 'roles',
      label: 'Role Coverage',
      value: topRoleEntry ? topRoleEntry[1] : 0,
      icon: Shield,
      iconBg: 'bg-purple-500/10',
      iconColor: 'text-purple-600',
      accent: 'from-purple-500 via-indigo-500 to-transparent',
      badge: topRoleLabel || 'Role mix',
      badgeClass: 'bg-purple-50 text-purple-600',
      description:
        topRoleEntry && stats.total > 0
          ? `${Math.round((topRoleEntry[1] / stats.total) * 100)}% of users`
          : 'No role data yet',
      progress: null,
      progressLabel: null,
      progressColor: '',
    },
  ];

  const exportUsers = async () => {
    if (isExporting) return;

    try {
      setIsExporting(true);
      const allUsers: User[] = [];
      let page = 1;
      const limit = 100;
      let hasNext = true;

      while (hasNext) {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
        });

        if (debouncedSearchTerm) params.append('search', debouncedSearchTerm);
        if (roleFilter !== 'all') params.append('role', roleFilter);
        if (statusFilter !== 'all') params.append('status', statusFilter);
        if (departmentFilter !== 'all')
          params.append('department', departmentFilter);

        const response = await fetch(`/api/admin/users?${params.toString()}`);
        if (!response.ok) {
          throw new Error('Failed to fetch users for export');
        }

        const data = await response.json();
        const pageUsers: User[] = data.users || [];
        allUsers.push(...pageUsers);

        const paginationData = data.pagination;
        const shouldContinue = Boolean(
          paginationData &&
            paginationData.hasNext &&
            pageUsers.length > 0 &&
            page < (paginationData.totalPages ?? Number.MAX_SAFE_INTEGER)
        );

        if (shouldContinue) {
          page += 1;
        }

        hasNext = shouldContinue;
      }

      const csvContent = [
        ['Name', 'Email', 'Role', 'Department', 'Status', 'Created At'].join(
          ','
        ),
        ...allUsers.map((user) =>
          [
            user.name,
            user.email,
            ROLE_LABELS[user.role],
            user.department_name || '',
            user.is_active ? 'Active' : 'Inactive',
            new Date(user.created_at).toLocaleDateString(),
          ].join(',')
        ),
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'users.csv';
      a.click();
      window.URL.revokeObjectURL(url);

      success(
        'User export ready',
        allUsers.length
          ? `${allUsers.length} users exported to CSV`
          : 'No users matched the current filters'
      );
    } catch (err) {
      console.error('Error exporting users:', err);
      error(
        'Failed to export users',
        err instanceof Error ? err.message : 'Unexpected error occurred'
      );
    } finally {
      setIsExporting(false);
    }
  };

  // Render user card
  const renderUserCard = (user: User): React.ReactNode => {
    const isSelected = selectedUsers.includes(user._id);
    const roleIcon = getRoleIcon(user.role);

    return (
      <Card
        key={user._id}
        className={`group relative overflow-hidden transition-all duration-200 hover:shadow-lg hover:shadow-blue-100/50 hover:-translate-y-1 border-0 bg-gradient-to-br from-white to-gray-50/30 cursor-pointer ${
          isSelected
            ? 'ring-2 ring-blue-500 shadow-lg shadow-blue-100/50 bg-gradient-to-br from-blue-50/50 to-white'
            : 'hover:border-blue-200'
        } ${!user.is_active ? 'opacity-75' : ''}`}
      >
        {/* Status Indicator Strip */}
        <div
          className={`absolute top-0 left-0 right-0 h-1 ${
            user.is_active
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
                onCheckedChange={() => toggleUserSelection(user._id)}
                className="h-4 w-4 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 cursor-pointer"
              />
              <div
                className={`relative p-3 rounded-xl shadow-sm transition-all duration-200 ${
                  user.is_active
                    ? 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-blue-200/50'
                    : 'bg-gradient-to-br from-gray-400 to-gray-500 shadow-gray-200/50'
                }`}
              >
                {roleIcon}
                {user.is_active && (
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
                  onClick={() => startEditingUser(user)}
                  className="cursor-pointer"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit User
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">
                  <Eye className="h-4 w-4 mr-2" />
                  View Profile
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">
                  <Mail className="h-4 w-4 mr-2" />
                  Send Email
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => deleteUser(user._id, user.name)}
                  className="cursor-pointer text-red-600 focus:text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete User
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* User Info Section */}
          <div className="space-y-4">
            {/* Name and Status */}
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <h3
                  className={`text-lg font-bold leading-tight ${
                    user.is_active ? 'text-gray-900' : 'text-gray-600'
                  }`}
                >
                  {user.name}
                </h3>
                {!user.is_active && (
                  <Badge
                    variant="secondary"
                    className="text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200"
                  >
                    Inactive
                  </Badge>
                )}
              </div>

              <p className="text-sm text-gray-600 leading-relaxed">
                {user.email}
              </p>
            </div>

            {/* Role and Department */}
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center gap-2 p-2 bg-gray-50/50 rounded-lg border border-gray-100">
                <div
                  className={`p-1.5 rounded-md ${getRoleColorClass(user.role)}`}
                >
                  {roleIcon}
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-500 font-medium">Role</p>
                  <p className="text-sm font-bold text-gray-900">
                    {ROLE_LABELS[user.role]}
                  </p>
                </div>
              </div>

              {user.department_name && (
                <div className="flex items-center gap-2 p-2 bg-gray-50/50 rounded-lg border border-gray-100">
                  <div className="p-1.5 bg-purple-100 rounded-md">
                    <Building className="h-3.5 w-3.5 text-purple-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500 font-medium">
                      Department
                    </p>
                    <p className="text-sm font-bold text-gray-900 truncate">
                      {user.department_name}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Last Login */}
            {user.last_login && (
              <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg border border-indigo-100">
                <div className="p-1.5 bg-indigo-100 rounded-md">
                  <Clock className="h-3.5 w-3.5 text-indigo-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-indigo-600 font-medium uppercase tracking-wide">
                    Last Login
                  </p>
                  <p className="text-sm font-semibold text-indigo-900">
                    {new Date(user.last_login).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  // Helper functions for role icons and colors
  const getRoleIcon = (role: User['role']) => {
    const iconClass = 'h-6 w-6 text-white';
    switch (role) {
      case 'super_admin':
        return <Crown className={iconClass} />;
      case 'company_admin':
        return <Shield className={iconClass} />;
      case 'department_admin':
        return <Settings className={iconClass} />;
      case 'leader':
        return <Target className={iconClass} />;
      case 'supervisor':
        return <Users className={iconClass} />;
      default:
        return <User className={iconClass} />;
    }
  };

  const getRoleColorClass = (role: User['role']) => {
    switch (role) {
      case 'super_admin':
        return 'bg-red-100';
      case 'company_admin':
        return 'bg-orange-100';
      case 'department_admin':
        return 'bg-purple-100';
      case 'leader':
        return 'bg-green-100';
      case 'supervisor':
        return 'bg-blue-100';
      default:
        return 'bg-gray-100';
    }
  };

  // Render user list item
  const renderUserListItem = (user: User): React.ReactNode => {
    const isSelected = selectedUsers.includes(user._id);
    const roleIcon = getRoleIcon(user.role);

    return (
      <div
        key={user._id}
        className={`group relative flex items-center gap-4 p-4 rounded-xl border-0 transition-all duration-200 hover:shadow-md hover:shadow-blue-100/30 bg-gradient-to-r from-white to-gray-50/30 cursor-pointer ${
          isSelected
            ? 'bg-gradient-to-r from-blue-50/50 to-white shadow-md shadow-blue-100/50 ring-1 ring-blue-200'
            : 'hover:bg-gradient-to-r hover:from-gray-50/50 hover:to-white'
        } ${!user.is_active ? 'opacity-75' : ''}`}
      >
        {/* Status Indicator */}
        <div
          className={`absolute left-0 top-2 bottom-2 w-1 rounded-r-full ${
            user.is_active
              ? 'bg-gradient-to-b from-green-400 to-emerald-500'
              : 'bg-gradient-to-b from-gray-300 to-gray-400'
          }`}
        />

        <div className="flex items-center gap-4 flex-1 min-w-0 pl-2">
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => toggleUserSelection(user._id)}
            className="h-4 w-4 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 cursor-pointer"
          />

          <div
            className={`relative p-2.5 rounded-xl shadow-sm transition-all duration-200 ${
              user.is_active
                ? 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-blue-200/50'
                : 'bg-gradient-to-br from-gray-400 to-gray-500 shadow-gray-200/50'
            }`}
          >
            {roleIcon}
            {user.is_active && (
              <div className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 bg-green-400 rounded-full border border-white shadow-sm" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <h3
                className={`font-bold text-base truncate ${
                  user.is_active ? 'text-gray-900' : 'text-gray-600'
                }`}
              >
                {user.name}
              </h3>
              {!user.is_active && (
                <Badge
                  variant="secondary"
                  className="text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200"
                >
                  Inactive
                </Badge>
              )}
            </div>
            <p className="text-sm text-gray-600 truncate">{user.email}</p>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-xs text-gray-500 font-medium">Role</p>
              <Badge className={`text-xs ${ROLE_COLORS[user.role]}`}>
                {ROLE_LABELS[user.role]}
              </Badge>
            </div>

            {user.department_name && (
              <div className="text-center">
                <p className="text-xs text-gray-500 font-medium">Department</p>
                <p className="text-sm font-semibold text-gray-900 truncate max-w-32">
                  {user.department_name}
                </p>
              </div>
            )}

            {user.last_login && (
              <div className="text-center">
                <p className="text-xs text-gray-500 font-medium">Last Login</p>
                <p className="text-sm font-semibold text-gray-900">
                  {new Date(user.last_login).toLocaleDateString()}
                </p>
              </div>
            )}
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
                onClick={() => startEditingUser(user)}
                className="cursor-pointer"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit User
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <Eye className="h-4 w-4 mr-2" />
                View Profile
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <Mail className="h-4 w-4 mr-2" />
                Send Email
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => deleteUser(user._id, user.name)}
                className="cursor-pointer text-red-600 focus:text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete User
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    );
  };

  // Render users table
  const renderUsersTable = () => {
    const sortedUsers = getSortedUsers(users);

    return (
      <div className="border rounded-lg bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={
                    selectedUsers.length === users.length && users.length > 0
                  }
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedUsers(users.map((u) => u._id));
                    } else {
                      setSelectedUsers([]);
                    }
                  }}
                  className="cursor-pointer"
                />
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center gap-2">
                  {t('name')}
                  {getSortIcon('name')}
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => handleSort('email')}
              >
                <div className="flex items-center gap-2">
                  {t('email')}
                  {getSortIcon('email')}
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => handleSort('role')}
              >
                <div className="flex items-center gap-2">
                  {t('role')}
                  {getSortIcon('role')}
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => handleSort('department_name')}
              >
                <div className="flex items-center gap-2">
                  {t('department')}
                  {getSortIcon('department_name')}
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => handleSort('is_active')}
              >
                <div className="flex items-center gap-2">
                  {t('status')}
                  {getSortIcon('is_active')}
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => handleSort('created_at')}
              >
                <div className="flex items-center gap-2">
                  {common('created')}
                  {getSortIcon('created_at')}
                </div>
              </TableHead>
              <TableHead className="w-12">{common('actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedUsers.map((user) => {
              const isSelected = selectedUsers.includes(user._id);
              const roleIcon = getRoleIcon(user.role);

              return (
                <TableRow
                  key={user._id}
                  className={`hover:bg-gray-50/50 transition-colors ${
                    isSelected ? 'bg-blue-50/30' : ''
                  } ${!user.is_active ? 'opacity-75' : ''}`}
                >
                  <TableCell>
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleUserSelection(user._id)}
                      className="cursor-pointer"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg ${getRoleColorClass(user.role)}`}
                      >
                        {roleIcon}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {user.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {user._id.slice(-6)}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-gray-900">{user.email}</div>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[user.role]}`}
                    >
                      {user.role
                        .replace('_', ' ')
                        .replace(/\b\w/g, (l) => l.toUpperCase())}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="text-gray-900">
                      {user.department_name || 'No Department'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-gray-100 cursor-pointer"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem
                          onClick={() => startEditingUser(user)}
                          className="cursor-pointer"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit User
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer">
                          <Eye className="h-4 w-4 mr-2" />
                          View Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer">
                          <Mail className="h-4 w-4 mr-2" />
                          Send Email
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => deleteUser(user._id, user.name)}
                          className="cursor-pointer text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loading size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
          <p className="text-gray-600">{t('manageUsersDescription')}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => {
              void exportUsers();
            }}
            disabled={isExporting}
            className={isExporting ? 'cursor-wait' : ''}
          >
            {isExporting ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                {common('exporting')}
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                {common('export')}
              </>
            )}
          </Button>
          <UsersExportButton />
          <Button onClick={() => setShowAddUserModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            {t('addUser')}
          </Button>
        </div>
      </div>

      {/* Statistics Dashboard */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card
              key={card.key}
              className="relative overflow-hidden border border-slate-200/60 bg-white/95 backdrop-blur transition-all duration-150 hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div
                className={`pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${card.accent}`}
              />
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-2xl ${card.iconBg}`}
                  >
                    <Icon className={`h-4 w-4 ${card.iconColor}`} />
                  </div>
                  {card.badge && (
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${card.badgeClass}`}
                    >
                      {card.badge}
                    </span>
                  )}
                </div>
                <p className="mt-4 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  {card.label}
                </p>
                <div className="mt-1.5 flex items-baseline gap-2">
                  <span className="text-2xl font-semibold text-slate-900">
                    {formatNumber(card.value)}
                  </span>
                </div>
                {card.description && (
                  <p className="mt-2 text-xs text-slate-500">
                    {card.description}
                  </p>
                )}
                {card.progress !== null && card.progressLabel && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-[10px] uppercase tracking-wide text-slate-400">
                      <span>{card.progressLabel}</span>
                      <span>{card.progress}%</span>
                    </div>
                    <div className="mt-1.5 h-1.5 w-full rounded-full bg-slate-200/70">
                      <div
                        className={`h-full rounded-full ${card.progressColor}`}
                        style={{ width: `${Math.min(card.progress, 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Content Card */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <CardTitle className="text-2xl">{t('title')}</CardTitle>
              <p className="text-muted-foreground mt-1">
                {t('manageUsersDescription')}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setShowAddUserModal(true)}
                className="bg-blue-600 hover:bg-blue-700 cursor-pointer"
              >
                <Plus className="h-4 w-4 mr-2" />
                {t('addUser')}
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="cursor-pointer">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => {
                      void exportUsers();
                    }}
                    className="cursor-pointer"
                    disabled={isExporting}
                  >
                    {isExporting ? (
                      <>
                        <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        {common('exporting')}
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        {t('exportUsers')}
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer">
                    <Settings className="h-4 w-4 mr-2" />
                    {common('settings')}
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
                  placeholder="Search users by name, email, or department..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* View Mode Toggle */}
              <div className="flex items-center border rounded-lg p-1">
                <Button
                  variant={viewMode === 'table' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('table')}
                  className="h-8 px-3 cursor-pointer"
                >
                  <TableIcon className="h-4 w-4" />
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

              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  {Object.entries(ROLE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={departmentFilter}
                onValueChange={setDepartmentFilter}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept._id} value={dept._id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedUsers.length > 0 && (
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-blue-900">
                  {selectedUsers.length} user
                  {selectedUsers.length > 1 ? 's' : ''} selected
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
                  <Mail className="h-4 w-4 mr-2" />
                  Send Email
                </Button>
                <Button variant="outline" size="sm" className="cursor-pointer">
                  Export Selected
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Users Display */}
      <div className="space-y-4">
        {/* View Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {users.length} of {pagination.total} users
            </span>
            {selectedUsers.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={selectAllUsers}
                className="cursor-pointer"
              >
                Select All ({users.length})
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Show:</span>
            <Select
              value={pagination.limit.toString()}
              onValueChange={(value) => handleLimitChange(parseInt(value))}
            >
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">per page</span>
          </div>
        </div>

        {/* Users Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loading size="lg" />
          </div>
        ) : users.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No users found
              </h3>
              <p className="text-gray-600 text-center mb-4">
                {searchTerm ||
                roleFilter !== 'all' ||
                departmentFilter !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Get started by adding your first user'}
              </p>
              <Button
                onClick={() => setShowAddUserModal(true)}
                className="cursor-pointer"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </CardContent>
          </Card>
        ) : viewMode === 'table' ? (
          renderUsersTable()
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {users.map((user) => renderUserCard(user))}
          </div>
        ) : (
          <div className="space-y-3">
            {users.map((user) => renderUserListItem(user))}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="mt-6">
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={handlePageChange}
              loading={loading}
              totalItems={pagination.total}
              itemsPerPage={pagination.limit}
            />
          </div>
        )}
      </div>

      {/* Add User Modal */}
      <Dialog open={showAddUserModal} onOpenChange={setShowAddUserModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Create a new user account. They will receive login credentials via
              email.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name *
              </Label>
              <Input
                id="name"
                value={newUser.name}
                onChange={(e) =>
                  setNewUser({ ...newUser, name: e.target.value })
                }
                className="col-span-3"
                placeholder="Full name"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email *
              </Label>
              <Input
                id="email"
                type="email"
                value={newUser.email}
                onChange={(e) =>
                  setNewUser({ ...newUser, email: e.target.value })
                }
                className="col-span-3"
                placeholder="user@company.com"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">
                Role *
              </Label>
              <Select
                value={newUser.role}
                onValueChange={(value: User['role']) =>
                  setNewUser({ ...newUser, role: value })
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="employee">Employee</SelectItem>
                  <SelectItem value="supervisor">Supervisor</SelectItem>
                  <SelectItem value="leader">Leader</SelectItem>
                  <SelectItem value="department_admin">
                    Department Admin
                  </SelectItem>
                  <SelectItem value="company_admin">Company Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="department" className="text-right">
                Department *
              </Label>
              <Select
                value={newUser.department_id}
                onValueChange={(value) =>
                  setNewUser({ ...newUser, department_id: value })
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept._id} value={dept._id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="password" className="text-right">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={newUser.password}
                onChange={(e) =>
                  setNewUser({ ...newUser, password: e.target.value })
                }
                className="col-span-3"
                placeholder="Leave empty for default (password123)"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowAddUserModal(false)}
              disabled={isCreatingUser}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={createUser}
              disabled={isCreatingUser}
            >
              {isCreatingUser ? 'Creating...' : 'Create User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Modal */}
      <Dialog open={showEditUserModal} onOpenChange={setShowEditUserModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information and settings.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right">
                Name *
              </Label>
              <Input
                id="edit-name"
                value={editingUser?.name || ''}
                onChange={(e) =>
                  setEditingUser(
                    editingUser
                      ? { ...editingUser, name: e.target.value }
                      : null
                  )
                }
                className="col-span-3"
                placeholder="Full name"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-email" className="text-right">
                Email *
              </Label>
              <Input
                id="edit-email"
                type="email"
                value={editingUser?.email || ''}
                onChange={(e) =>
                  setEditingUser(
                    editingUser
                      ? { ...editingUser, email: e.target.value }
                      : null
                  )
                }
                className="col-span-3"
                placeholder="email@company.com"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-role" className="text-right">
                Role *
              </Label>
              <Select
                value={editingUser?.role || 'employee'}
                onValueChange={(value: User['role']) =>
                  setEditingUser(
                    editingUser ? { ...editingUser, role: value } : null
                  )
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="employee">Employee</SelectItem>
                  <SelectItem value="supervisor">Supervisor</SelectItem>
                  <SelectItem value="leader">Leader</SelectItem>
                  <SelectItem value="department_admin">
                    Department Admin
                  </SelectItem>
                  <SelectItem value="company_admin">Company Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-department" className="text-right">
                Department *
              </Label>
              <Select
                value={editingUser?.department_id || ''}
                onValueChange={(value) =>
                  setEditingUser(
                    editingUser
                      ? { ...editingUser, department_id: value }
                      : null
                  )
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept._id} value={dept._id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-status" className="text-right">
                Status
              </Label>
              <Select
                value={editingUser?.is_active ? 'active' : 'inactive'}
                onValueChange={(value) =>
                  setEditingUser(
                    editingUser
                      ? { ...editingUser, is_active: value === 'active' }
                      : null
                  )
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={cancelEditUser}
              disabled={isUpdatingUser}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={updateUser}
              disabled={isUpdatingUser}
            >
              {isUpdatingUser ? 'Updating...' : 'Update User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <ConfirmationDialog />
    </div>
  );
}
