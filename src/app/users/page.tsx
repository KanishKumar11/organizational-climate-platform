'use client';

import { useAuth } from '@/hooks/useAuth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import UserManagement from '@/components/admin/UserManagement';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

export default function UsersPage() {
  const { user, isLoading, canManageUsers } = useAuth();

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!user) {
    return (
      <DashboardLayout>
        <Card>
          <CardContent className="p-12 text-center">
            <AlertCircle className="h-12 w-12 text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Access Denied
            </h3>
            <p className="text-gray-600">
              Please log in to access user management.
            </p>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  // Check if user has permission to manage users
  if (!canManageUsers) {
    return (
      <DashboardLayout>
        <Card>
          <CardContent className="p-12 text-center">
            <AlertCircle className="h-12 w-12 text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Insufficient Permissions
            </h3>
            <p className="text-gray-600">
              You don't have permission to manage users. Contact your
              administrator for access.
            </p>
            <div className="mt-4 text-sm text-gray-500">
              Required permissions: User Management
            </div>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
              <p className="text-gray-600 mt-2">
                Manage users, roles, and permissions across your organization
              </p>
              <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
                <span>Role: {user.role.replace('_', ' ').toUpperCase()}</span>
                {user.role === 'super_admin' && (
                  <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                    Global Access
                  </span>
                )}
                {user.role === 'company_admin' && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                    Company Access
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* User Management Component */}
        <UserManagement />
      </div>
    </DashboardLayout>
  );
}
