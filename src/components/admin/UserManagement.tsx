'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loading } from '@/components/ui/Loading';
import { Pagination } from '@/components/ui/pagination';
import { useConfirmationDialog } from '@/components/ui/confirmation-dialog';
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
  Users,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Mail,
  Building,
  UserCheck,
  UserX,
  Download,
  Upload,
  X,
} from 'lucide-react';

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

export default function UserManagement() {
  const { showConfirmation, ConfirmationDialog } = useConfirmationDialog();
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });

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

  const toggleUserStatus = async (userId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !isActive }),
      });

      if (response.ok) {
        fetchUsers(); // Refresh the list
      }
    } catch (error) {
      console.error('Error updating user status:', error);
    }
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
          }
        } catch (error) {
          console.error('Error deleting user:', error);
        }
      },
    });
  };

  const createUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.department_id) {
      alert('Please fill in all required fields');
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
        alert('User created successfully!');
      } else {
        const error = await response.json();
        alert(`Error creating user: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Error creating user. Please try again.');
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
      alert('Please fill in all required fields');
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
        alert('User updated successfully!');
      } else {
        const error = await response.json();
        alert(`Error updating user: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Failed to update user. Please try again.');
    } finally {
      setIsUpdatingUser(false);
    }
  };

  const cancelEditUser = () => {
    setShowEditUserModal(false);
    setEditingUser(null);
  };

  const exportUsers = () => {
    const csvContent = [
      ['Name', 'Email', 'Role', 'Department', 'Status', 'Created At'].join(','),
      ...users.map((user) =>
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
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600">Manage users, roles, and permissions</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={exportUsers}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => setShowAddUserModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-2xl font-bold">{pagination.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <UserCheck className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active Users</p>
                <p className="text-2xl font-bold">
                  {users.filter((u) => u.is_active).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <UserX className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Inactive Users</p>
                <p className="text-2xl font-bold">
                  {users.filter((u) => !u.is_active).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Building className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Departments</p>
                <p className="text-2xl font-bold">{departments.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search users by name, email, or department..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Roles</option>
              {Object.entries(ROLE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Departments</option>
              {departments.map((dept) => (
                <option key={dept._id} value={dept._id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Users ({pagination.total})</CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Show:</span>
              <select
                value={pagination.limit}
                onChange={(e) => handleLimitChange(parseInt(e.target.value))}
                className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="text-sm text-gray-600">per page</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">
                    User
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">
                    Role
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">
                    Department
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">
                    Last Login
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center">
                      <Loading size="lg" />
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-500">
                      No users found
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr
                      key={user._id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium text-gray-900">
                            {user.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.email}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={ROLE_COLORS[user.role]}>
                          {ROLE_LABELS[user.role]}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-gray-900">
                          {user.department_name || 'N/A'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          className={
                            user.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }
                        >
                          {user.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-gray-600">
                          {user.last_login
                            ? new Date(user.last_login).toLocaleDateString()
                            : 'Never'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEditingUser(user)}
                            title="Edit user"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              toggleUserStatus(user._id, user.is_active)
                            }
                          >
                            {user.is_active ? (
                              <UserX className="w-4 h-4" />
                            ) : (
                              <UserCheck className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteUser(user._id, user.name)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={handlePageChange}
              loading={loading}
              totalItems={pagination.total}
              itemsPerPage={pagination.limit}
            />
          )}
        </CardContent>
      </Card>

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
