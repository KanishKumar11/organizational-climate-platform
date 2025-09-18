'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loading } from '@/components/ui/Loading';
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
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

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

  useEffect(() => {
    fetchUsers();
    fetchDepartments();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.department_name &&
        user.department_name.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && user.is_active) ||
      (statusFilter === 'inactive' && !user.is_active);

    return matchesSearch && matchesRole && matchesStatus;
  });

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

  const deleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

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

  const exportUsers = () => {
    const csvContent = [
      ['Name', 'Email', 'Role', 'Department', 'Status', 'Created At'].join(','),
      ...filteredUsers.map((user) =>
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
                <p className="text-2xl font-bold">{users.length}</p>
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
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({filteredUsers.length})</CardTitle>
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
                {filteredUsers.map((user) => (
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
                        <Button variant="ghost" size="sm">
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
                          onClick={() => deleteUser(user._id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredUsers.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No users found matching your criteria.
              </div>
            )}
          </div>
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
    </div>
  );
}
