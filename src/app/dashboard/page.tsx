'use client';

import { useAuth } from '../../hooks/useAuth';
import DashboardLayout from '../../components/layout/DashboardLayout';
import SuperAdminDashboard from '../../components/dashboard/SuperAdminDashboard';
import CompanyAdminDashboard from '../../components/dashboard/CompanyAdminDashboard';
import DepartmentAdminDashboard from '../../components/dashboard/DepartmentAdminDashboard';
import EvaluatedUserDashboard from '../../components/dashboard/EvaluatedUserDashboard';

export default function Dashboard() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Access Denied
          </h1>
          <p className="text-gray-600">
            Please sign in to access the dashboard.
          </p>
        </div>
      </div>
    );
  }

  // Render role-based dashboard
  const renderDashboard = () => {
    switch (user.role) {
      case 'super_admin':
        return <SuperAdminDashboard />;
      case 'company_admin':
        return <CompanyAdminDashboard />;
      case 'leader':
      case 'supervisor':
        return <DepartmentAdminDashboard />;
      case 'employee':
        return <EvaluatedUserDashboard />;
      default:
        return (
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Unknown Role
            </h3>
            <p className="text-gray-600">
              Your role "{user.role}" is not recognized. Please contact your
              administrator.
            </p>
          </div>
        );
    }
  };

  return <DashboardLayout>{renderDashboard()}</DashboardLayout>;
}
