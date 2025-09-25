'use client';

import React from 'react';
import { useAuth } from '../../../hooks/useAuth';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import ModernCompanyManagement from '../../../components/admin/ModernCompanyManagement';
import { Shield } from 'lucide-react';

export default function CompaniesPage() {
  const { user, isLoading: authLoading } = useAuth();

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  // Check if user has permission to access this page
  if (!user || (user.role !== 'super_admin' && user.role !== 'company_admin')) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Shield className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Access Denied
            </h3>
            <p className="text-gray-600">
              You don't have permission to access this page.
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6">
        <ModernCompanyManagement userRole={user.role} />
      </div>
    </DashboardLayout>
  );
}
