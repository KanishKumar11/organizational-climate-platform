'use client';

import { useAuth } from '@/hooks/useAuth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ModernDepartmentManagement from '@/components/admin/ModernDepartmentManagement';
import { Card, CardContent } from '@/components/ui/card';
import {
  AlertCircle,
  Building2,
  Users,
  TrendingUp,
  Settings,
} from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

export default function DepartmentsPage() {
  const { user, isLoading, canManageUsers, isSuperAdmin, isCompanyAdmin } =
    useAuth();

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="text-sm text-muted-foreground">
              Loading department management...
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!user) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto">
            <CardContent className="p-12 text-center">
              <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
              <h3 className="text-xl font-semibold text-foreground mb-3">
                Authentication Required
              </h3>
              <p className="text-muted-foreground mb-6">
                Please log in to access department management features.
              </p>
              <div className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                Secure access ensures proper authorization for organizational
                data.
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  // Check if user has permission to manage departments
  // Super admins and company admins can manage departments
  const canManageDepartments = isSuperAdmin || isCompanyAdmin || canManageUsers;

  if (!canManageDepartments) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-lg mx-auto">
            <CardContent className="p-12 text-center">
              <div className="p-4 bg-amber-50 rounded-full w-fit mx-auto mb-6">
                <AlertCircle className="h-16 w-16 text-amber-600" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">
                Access Restricted
              </h3>
              <p className="text-muted-foreground mb-6">
                You don't have the necessary permissions to manage departments.
                Contact your system administrator to request access.
              </p>
              <div className="bg-muted p-4 rounded-lg text-left">
                <h4 className="font-medium text-sm mb-2">
                  Required Permissions:
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Super Administrator</li>
                  <li>• Company Administrator</li>
                  <li>• Department Management Rights</li>
                </ul>
              </div>
              <div className="mt-6 text-xs text-muted-foreground">
                Current Role:{' '}
                <span className="font-medium capitalize">
                  {user.role.replace('_', ' ')}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-6 space-y-8">
        {/* Breadcrumb Navigation */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Department Management</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        {/* Modern Page Header */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-3xl"></div>
          <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
          <div className="relative p-8 lg:p-12">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex items-start gap-6">
                <div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
                  <Building2 className="h-10 w-10 text-white" />
                </div>
                <div className="space-y-2">
                  <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
                    Department Management
                  </h1>
                  <p className="text-lg text-gray-600 max-w-2xl">
                    Organize your company structure, manage hierarchies, and
                    oversee departmental operations with powerful tools and
                    insights.
                  </p>
                  <div className="flex items-center gap-4 pt-2">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Users className="h-4 w-4" />
                      <span>
                        Role:{' '}
                        <span className="font-medium capitalize">
                          {user.role.replace('_', ' ')}
                        </span>
                      </span>
                    </div>
                    {user.role === 'super_admin' && (
                      <div className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                        Global Access
                      </div>
                    )}
                    {user.role === 'company_admin' && (
                      <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                        Company Scope
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-4 lg:gap-6">
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 text-center border border-white/20">
                  <div className="p-2 bg-green-100 rounded-lg w-fit mx-auto mb-2">
                    <Building2 className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">--</div>
                  <div className="text-xs text-gray-600">Departments</div>
                </div>
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 text-center border border-white/20">
                  <div className="p-2 bg-blue-100 rounded-lg w-fit mx-auto mb-2">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">--</div>
                  <div className="text-xs text-gray-600">Employees</div>
                </div>
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 text-center border border-white/20">
                  <div className="p-2 bg-purple-100 rounded-lg w-fit mx-auto mb-2">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">--</div>
                  <div className="text-xs text-gray-600">Levels</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Department Management Component */}
        <ModernDepartmentManagement />

        {/* Help & Guidelines Section */}
        <Card className="bg-gradient-to-r from-slate-50 to-gray-50 border-slate-200">
          <CardContent className="p-8">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Settings className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Department Management Guidelines
                </h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-800">
                      Structure Best Practices
                    </h4>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                        Keep hierarchy levels reasonable (3-4 max)
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                        Use clear, descriptive department names
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                        Assign managers to maintain accountability
                      </li>
                    </ul>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-800">
                      User Management
                    </h4>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                        Regularly review department assignments
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                        Use bulk operations for efficiency
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                        Monitor department size and balance
                      </li>
                    </ul>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-800">
                      Security & Compliance
                    </h4>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                        Maintain proper access controls
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                        Document organizational changes
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                        Regular structure audits recommended
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
