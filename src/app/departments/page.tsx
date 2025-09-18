'use client';

import { useAuth } from '@/hooks/useAuth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import DepartmentHierarchy from '@/components/admin/DepartmentHierarchy';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, Building2 } from 'lucide-react';

export default function DepartmentsPage() {
  const { user, isLoading, canManageUsers, isSuperAdmin, isCompanyAdmin } = useAuth();

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
              Please log in to access department management.
            </p>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  // Check if user has permission to manage departments
  // Super admins and company admins can manage departments
  const canManageDepartments = isSuperAdmin || isCompanyAdmin || canManageUsers;

  if (!canManageDepartments) {
    return (
      <DashboardLayout>
        <Card>
          <CardContent className="p-12 text-center">
            <AlertCircle className="h-12 w-12 text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Insufficient Permissions
            </h3>
            <p className="text-gray-600">
              You don't have permission to manage departments. Contact your
              administrator for access.
            </p>
            <div className="mt-4 text-sm text-gray-500">
              Required permissions: Department Management (Super Admin or Company Admin)
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
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-8 border border-green-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-xl">
                <Building2 className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Department Management</h1>
                <p className="text-gray-600 mt-2">
                  Manage organizational structure and department hierarchy
                </p>
                <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
                  <span>Role: {user.role.replace('_', ' ').toUpperCase()}</span>
                  {user.role === 'super_admin' && (
                    <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                      Global Access - All Companies
                    </span>
                  )}
                  {user.role === 'company_admin' && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                      Company Access Only
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Department Hierarchy Component */}
        <DepartmentHierarchy />

        {/* Help Section */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">
              Department Management Tips
            </h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-800">
              <div>
                <h4 className="font-medium mb-2">Creating Departments:</h4>
                <ul className="space-y-1 text-blue-700">
                  <li>• Use clear, descriptive names</li>
                  <li>• Set up proper hierarchy levels</li>
                  <li>• Assign parent departments for sub-departments</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Best Practices:</h4>
                <ul className="space-y-1 text-blue-700">
                  <li>• Keep hierarchy levels reasonable (max 3-4 levels)</li>
                  <li>• Assign users to appropriate departments</li>
                  <li>• Use departments for microclimate targeting</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
