'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users,
  UserPlus,
  Edit,
  Trash2,
  Mail,
  Download,
  Upload,
  Search,
  Filter,
  MoreHorizontal,
  CheckCircle,
  Clock,
  AlertCircle,
  Building,
  GraduationCap,
  MapPin,
  Calendar,
  Briefcase,
  Plus,
  FileText,
  Send,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';

interface User {
  _id: string;
  name: string;
  email: string;
  job_title?: string;
  is_active: boolean;
  invitation_status: 'pending' | 'sent' | 'accepted' | 'expired';
  demographics: {
    gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
    education_level?:
      | 'high_school'
      | 'associate'
      | 'bachelor'
      | 'master'
      | 'phd'
      | 'other';
    hierarchy_level?: string;
    work_location?: string;
    tenure_months?: number;
    department_id?: string;
    manager_id?: string;
  };
  created_at: string;
  last_login?: string;
}

interface UserFormData {
  name: string;
  email: string;
  job_title: string;
  gender: string;
  education_level: string;
  hierarchy_level: string;
  work_location: string;
  tenure_months: string;
  department_id: string;
}

interface BulkImportData {
  users: Array<{
    name: string;
    email: string;
    job_title?: string;
    gender?: string;
    education_level?: string;
    hierarchy_level?: string;
    work_location?: string;
    tenure_months?: number;
  }>;
}

export default function UserManagementDashboard() {
  // State Management
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());

  // Dialog States
  const [showAddUserDialog, setShowAddUserDialog] = useState(false);
  const [showEditUserDialog, setShowEditUserDialog] = useState(false);
  const [showBulkImportDialog, setShowBulkImportDialog] = useState(false);
  const [showSendInvitationsDialog, setShowSendInvitationsDialog] =
    useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form States
  const [formData, setFormData] = useState<UserFormData>({
    name: '',
    email: '',
    job_title: '',
    gender: '',
    education_level: '',
    hierarchy_level: '',
    work_location: '',
    tenure_months: '',
    department_id: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Bulk Import States
  const [bulkImportData, setBulkImportData] = useState<BulkImportData>({
    users: [],
  });
  const [importPreview, setImportPreview] = useState<User[]>([]);

  // Success/Error States
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Mock data for demonstration
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setUsers([
        {
          _id: '1',
          name: 'John Smith',
          email: 'john.smith@company.com',
          job_title: 'Senior Developer',
          is_active: true,
          invitation_status: 'accepted',
          demographics: {
            gender: 'male',
            education_level: 'bachelor',
            hierarchy_level: 'Senior',
            work_location: 'New York Office',
            tenure_months: 24,
            department_id: 'engineering',
          },
          created_at: '2024-01-15T10:00:00Z',
          last_login: '2024-09-28T09:00:00Z',
        },
        {
          _id: '2',
          name: 'Sarah Johnson',
          email: 'sarah.johnson@company.com',
          job_title: 'HR Manager',
          is_active: true,
          invitation_status: 'sent',
          demographics: {
            gender: 'female',
            education_level: 'master',
            hierarchy_level: 'Manager',
            work_location: 'Chicago Office',
            tenure_months: 36,
            department_id: 'hr',
          },
          created_at: '2024-02-01T14:30:00Z',
        },
        {
          _id: '3',
          name: 'Mike Davis',
          email: 'mike.davis@company.com',
          job_title: 'Marketing Coordinator',
          is_active: false,
          invitation_status: 'pending',
          demographics: {
            gender: 'male',
            education_level: 'associate',
            hierarchy_level: 'Coordinator',
            work_location: 'Remote',
            tenure_months: 12,
            department_id: 'marketing',
          },
          created_at: '2024-03-10T11:15:00Z',
        },
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  // Statistics
  const stats = useMemo(() => {
    const total = users.length;
    const active = users.filter((u) => u.is_active).length;
    const invited = users.filter(
      (u) =>
        u.invitation_status === 'sent' || u.invitation_status === 'accepted'
    ).length;
    const completed = users.filter(
      (u) => u.invitation_status === 'accepted'
    ).length;

    return { total, active, invited, completed };
  }, [users]);

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.job_title?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' || user.invitation_status === statusFilter;
      const matchesDepartment =
        departmentFilter === 'all' ||
        user.demographics.department_id === departmentFilter;

      return matchesSearch && matchesStatus && matchesDepartment;
    });
  }, [users, searchQuery, statusFilter, departmentFilter]);

  // Form Handlers
  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      job_title: '',
      gender: '',
      education_level: '',
      hierarchy_level: '',
      work_location: '',
      tenure_months: '',
      department_id: '',
    });
    setFormErrors({});
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) errors.name = 'Name is required';
    if (!formData.email.trim()) errors.email = 'Email is required';
    if (!formData.email.includes('@')) errors.email = 'Valid email is required';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddUser = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const newUser: User = {
        _id: Date.now().toString(),
        name: formData.name,
        email: formData.email,
        job_title: formData.job_title || undefined,
        is_active: true,
        invitation_status: 'pending',
        demographics: {
          gender: (formData.gender as any) || undefined,
          education_level: (formData.education_level as any) || undefined,
          hierarchy_level: formData.hierarchy_level || undefined,
          work_location: formData.work_location || undefined,
          tenure_months: formData.tenure_months
            ? parseInt(formData.tenure_months)
            : undefined,
          department_id: formData.department_id || undefined,
        },
        created_at: new Date().toISOString(),
      };

      setUsers((prev) => [...prev, newUser]);
      setSuccessMessage('User added successfully!');
      setShowAddUserDialog(false);
      resetForm();
    } catch (error) {
      setErrorMessage('Failed to add user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditUser = async () => {
    if (!editingUser || !validateForm()) return;

    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setUsers((prev) =>
        prev.map((user) =>
          user._id === editingUser._id
            ? {
                ...user,
                name: formData.name,
                email: formData.email,
                job_title: formData.job_title || undefined,
                demographics: {
                  ...user.demographics,
                  gender: (formData.gender as any) || undefined,
                  education_level:
                    (formData.education_level as any) || undefined,
                  hierarchy_level: formData.hierarchy_level || undefined,
                  work_location: formData.work_location || undefined,
                  tenure_months: formData.tenure_months
                    ? parseInt(formData.tenure_months)
                    : undefined,
                  department_id: formData.department_id || undefined,
                },
              }
            : user
        )
      );

      setSuccessMessage('User updated successfully!');
      setShowEditUserDialog(false);
      setEditingUser(null);
      resetForm();
    } catch (error) {
      setErrorMessage('Failed to update user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDialog = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      job_title: user.job_title || '',
      gender: user.demographics.gender || '',
      education_level: user.demographics.education_level || '',
      hierarchy_level: user.demographics.hierarchy_level || '',
      work_location: user.demographics.work_location || '',
      tenure_months: user.demographics.tenure_months?.toString() || '',
      department_id: user.demographics.department_id || '',
    });
    setShowEditUserDialog(true);
  };

  const handleSendInvitations = async () => {
    const usersToInvite = users.filter(
      (u) => selectedUsers.has(u._id) && u.invitation_status === 'pending'
    );

    if (usersToInvite.length === 0) {
      setErrorMessage('No users selected for invitation');
      return;
    }

    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setUsers((prev) =>
        prev.map((user) =>
          selectedUsers.has(user._id) && user.invitation_status === 'pending'
            ? { ...user, invitation_status: 'sent' as const }
            : user
        )
      );

      setSuccessMessage(`Invitations sent to ${usersToInvite.length} users!`);
      setShowSendInvitationsDialog(false);
      setSelectedUsers(new Set());
    } catch (error) {
      setErrorMessage('Failed to send invitations');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: User['invitation_status']) => {
    switch (status) {
      case 'accepted':
        return (
          <Badge className="bg-green-50 text-green-700 border-green-200">
            Active
          </Badge>
        );
      case 'sent':
        return (
          <Badge className="bg-blue-50 text-blue-700 border-blue-200">
            Invited
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200">
            Pending
          </Badge>
        );
      case 'expired':
        return (
          <Badge className="bg-red-50 text-red-700 border-red-200">
            Expired
          </Badge>
        );
    }
  };

  const formatTenure = (months?: number) => {
    if (!months) return 'N/A';
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    if (years === 0) return `${remainingMonths} months`;
    if (remainingMonths === 0) return `${years} years`;
    return `${years}y ${remainingMonths}m`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-sm text-muted-foreground">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border border-slate-200/60 bg-white/95 backdrop-blur shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Total Users
                </p>
                <p className="text-2xl font-bold text-slate-900">
                  {stats.total}
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200/60 bg-white/95 backdrop-blur shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Active Users
                </p>
                <p className="text-2xl font-bold text-slate-900">
                  {stats.active}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200/60 bg-white/95 backdrop-blur shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Invitations Sent
                </p>
                <p className="text-2xl font-bold text-slate-900">
                  {stats.invited}
                </p>
              </div>
              <Mail className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200/60 bg-white/95 backdrop-blur shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Completed Setup
                </p>
                <p className="text-2xl font-bold text-slate-900">
                  {stats.completed}
                </p>
              </div>
              <Clock className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Card */}
      <Card className="border border-slate-200/60 bg-white/95 backdrop-blur shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <CardTitle className="text-2xl">User Management</CardTitle>
              <p className="text-muted-foreground mt-1">
                Manage company users, demographics, and survey invitations
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={() => setShowBulkImportDialog(true)}
                variant="outline"
                className="border-slate-200"
              >
                <Upload className="h-4 w-4 mr-2" />
                Bulk Import
              </Button>

              <Button
                onClick={() => setShowAddUserDialog(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add User
              </Button>
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
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="sent">Invited</SelectItem>
                  <SelectItem value="accepted">Active</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={departmentFilter}
                onValueChange={setDepartmentFilter}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  <SelectItem value="engineering">Engineering</SelectItem>
                  <SelectItem value="hr">HR</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="sales">Sales</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedUsers.size > 0 && (
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-blue-900">
                  {selectedUsers.size} user{selectedUsers.size !== 1 ? 's' : ''}{' '}
                  selected
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setShowSendInvitationsDialog(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Send Invitations
                </Button>
              </div>
            </div>
          )}

          {/* Users Table */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/50">
                  <TableHead className="w-12">
                    <Checkbox
                      checked={
                        filteredUsers.length > 0 &&
                        selectedUsers.size === filteredUsers.length
                      }
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedUsers(
                            new Set(filteredUsers.map((u) => u._id))
                          );
                        } else {
                          setSelectedUsers(new Set());
                        }
                      }}
                    />
                  </TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Job Title</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tenure</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user._id} className="hover:bg-slate-50/50">
                    <TableCell>
                      <Checkbox
                        checked={selectedUsers.has(user._id)}
                        onCheckedChange={(checked) => {
                          const newSelected = new Set(selectedUsers);
                          if (checked) {
                            newSelected.add(user._id);
                          } else {
                            newSelected.delete(user._id);
                          }
                          setSelectedUsers(newSelected);
                        }}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.job_title || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {user.demographics.department_id || 'Unassigned'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(user.invitation_status)}
                    </TableCell>
                    <TableCell>
                      {formatTenure(user.demographics.tenure_months)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => openEditDialog(user)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit User
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">
                No users found
              </h3>
              <p className="text-slate-500 mb-4">
                {searchQuery
                  ? 'Try adjusting your search criteria'
                  : 'Get started by adding your first user'}
              </p>
              <Button
                onClick={() => setShowAddUserDialog(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add User Dialog */}
      <Dialog open={showAddUserDialog} onOpenChange={setShowAddUserDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="demographics">Demographics</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Enter full name"
                    className={formErrors.name ? 'border-red-500' : ''}
                  />
                  {formErrors.name && (
                    <p className="text-sm text-red-600">{formErrors.name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="Enter email address"
                    className={formErrors.email ? 'border-red-500' : ''}
                  />
                  {formErrors.email && (
                    <p className="text-sm text-red-600">{formErrors.email}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="job_title">Job Title</Label>
                <Input
                  id="job_title"
                  value={formData.job_title}
                  onChange={(e) =>
                    setFormData({ ...formData, job_title: e.target.value })
                  }
                  placeholder="Enter job title"
                />
              </div>
            </TabsContent>

            <TabsContent value="demographics" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(value) =>
                      setFormData({ ...formData, gender: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                      <SelectItem value="prefer_not_to_say">
                        Prefer not to say
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="education">Education Level</Label>
                  <Select
                    value={formData.education_level}
                    onValueChange={(value) =>
                      setFormData({ ...formData, education_level: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select education level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high_school">High School</SelectItem>
                      <SelectItem value="associate">
                        Associate Degree
                      </SelectItem>
                      <SelectItem value="bachelor">
                        Bachelor's Degree
                      </SelectItem>
                      <SelectItem value="master">Master's Degree</SelectItem>
                      <SelectItem value="phd">PhD</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hierarchy">Hierarchy Level</Label>
                  <Input
                    id="hierarchy"
                    value={formData.hierarchy_level}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        hierarchy_level: e.target.value,
                      })
                    }
                    placeholder="e.g., Senior, Manager, Director"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Work Location</Label>
                  <Input
                    id="location"
                    value={formData.work_location}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        work_location: e.target.value,
                      })
                    }
                    placeholder="e.g., New York Office, Remote"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tenure">Time with Company (months)</Label>
                  <Input
                    id="tenure"
                    type="number"
                    value={formData.tenure_months}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        tenure_months: e.target.value,
                      })
                    }
                    placeholder="e.g., 24"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Select
                    value={formData.department_id}
                    onValueChange={(value) =>
                      setFormData({ ...formData, department_id: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="engineering">Engineering</SelectItem>
                      <SelectItem value="hr">Human Resources</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="sales">Sales</SelectItem>
                      <SelectItem value="finance">Finance</SelectItem>
                      <SelectItem value="operations">Operations</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowAddUserDialog(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddUser}
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? 'Adding...' : 'Add User'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog - Similar to Add User */}
      <Dialog open={showEditUserDialog} onOpenChange={setShowEditUserDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="demographics">Demographics</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Full Name *</Label>
                  <Input
                    id="edit-name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Enter full name"
                    className={formErrors.name ? 'border-red-500' : ''}
                  />
                  {formErrors.name && (
                    <p className="text-sm text-red-600">{formErrors.name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-email">Email Address *</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="Enter email address"
                    className={formErrors.email ? 'border-red-500' : ''}
                  />
                  {formErrors.email && (
                    <p className="text-sm text-red-600">{formErrors.email}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-job_title">Job Title</Label>
                <Input
                  id="edit-job_title"
                  value={formData.job_title}
                  onChange={(e) =>
                    setFormData({ ...formData, job_title: e.target.value })
                  }
                  placeholder="Enter job title"
                />
              </div>
            </TabsContent>

            <TabsContent value="demographics" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-gender">Gender</Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(value) =>
                      setFormData({ ...formData, gender: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                      <SelectItem value="prefer_not_to_say">
                        Prefer not to say
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-education">Education Level</Label>
                  <Select
                    value={formData.education_level}
                    onValueChange={(value) =>
                      setFormData({ ...formData, education_level: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select education level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high_school">High School</SelectItem>
                      <SelectItem value="associate">
                        Associate Degree
                      </SelectItem>
                      <SelectItem value="bachelor">
                        Bachelor's Degree
                      </SelectItem>
                      <SelectItem value="master">Master's Degree</SelectItem>
                      <SelectItem value="phd">PhD</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-hierarchy">Hierarchy Level</Label>
                  <Input
                    id="edit-hierarchy"
                    value={formData.hierarchy_level}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        hierarchy_level: e.target.value,
                      })
                    }
                    placeholder="e.g., Senior, Manager, Director"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-location">Work Location</Label>
                  <Input
                    id="edit-location"
                    value={formData.work_location}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        work_location: e.target.value,
                      })
                    }
                    placeholder="e.g., New York Office, Remote"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-tenure">
                    Time with Company (months)
                  </Label>
                  <Input
                    id="edit-tenure"
                    type="number"
                    value={formData.tenure_months}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        tenure_months: e.target.value,
                      })
                    }
                    placeholder="e.g., 24"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-department">Department</Label>
                  <Select
                    value={formData.department_id}
                    onValueChange={(value) =>
                      setFormData({ ...formData, department_id: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="engineering">Engineering</SelectItem>
                      <SelectItem value="hr">Human Resources</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="sales">Sales</SelectItem>
                      <SelectItem value="finance">Finance</SelectItem>
                      <SelectItem value="operations">Operations</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowEditUserDialog(false);
                setEditingUser(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditUser}
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? 'Updating...' : 'Update User'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Send Invitations Dialog */}
      <AlertDialog
        open={showSendInvitationsDialog}
        onOpenChange={setShowSendInvitationsDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-blue-600" />
              Send Invitations
            </AlertDialogTitle>
            <AlertDialogDescription>
              Send registration invitations to {selectedUsers.size} selected
              user{selectedUsers.size !== 1 ? 's' : ''}. Each user will receive
              an email with login credentials and instructions to complete their
              profile.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSendInvitations}
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? 'Sending...' : 'Send Invitations'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="fixed bottom-4 right-4 bg-green-50 border border-green-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <p className="text-green-800">{successMessage}</p>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="fixed bottom-4 right-4 bg-red-50 border border-red-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-red-800">{errorMessage}</p>
          </div>
        </div>
      )}
    </div>
  );
}
