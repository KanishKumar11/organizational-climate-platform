'use client';

import { useSession } from 'next-auth/react';
import { UserRole, AuthUser } from '../types/user';
import {
  hasPermission,
  hasFeaturePermission,
  ROLE_PERMISSIONS,
} from '../lib/permissions';

export function useAuth() {
  const { data: session, status } = useSession();

  const user: AuthUser | null = session?.user
    ? {
        id: session.user.id,
        name: session.user.name || '',
        email: session.user.email || '',
        role: session.user.role,
        companyId: session.user.companyId,
        departmentId: session.user.departmentId,
        isActive: session.user.isActive,
        image: session.user.image,
      }
    : null;

  const isLoading = status === 'loading';
  const isAuthenticated = status === 'authenticated' && !!user;

  // Permission checking functions
  const checkPermission = (requiredRole: UserRole): boolean => {
    if (!user) return false;
    return hasPermission(user.role, requiredRole);
  };

  const checkFeaturePermission = (
    feature: keyof typeof ROLE_PERMISSIONS
  ): boolean => {
    if (!user) return false;
    return hasFeaturePermission(user.role, feature);
  };

  const canAccessCompany = (companyId: string): boolean => {
    if (!user) return false;
    return user.role === 'super_admin' || user.companyId === companyId;
  };

  const canAccessDepartment = (departmentId: string): boolean => {
    if (!user) return false;
    if (user.role === 'super_admin' || user.role === 'company_admin') {
      return true;
    }
    return user.departmentId === departmentId;
  };

  // Role-specific checks
  const isSuperAdmin = user?.role === 'super_admin';
  const isCompanyAdmin = user?.role === 'company_admin';
  const isLeader = user?.role === 'leader';
  const isSupervisor = user?.role === 'supervisor';
  const isEmployee = user?.role === 'employee';

  // Feature-specific checks
  const canCreateSurveys = checkFeaturePermission('CREATE_SURVEYS');
  const canLaunchMicroclimates = checkFeaturePermission('LAUNCH_MICROCLIMATES');
  const canCreateActionPlans = checkFeaturePermission('CREATE_ACTION_PLANS');
  const canViewCompanyAnalytics = checkFeaturePermission(
    'VIEW_COMPANY_ANALYTICS'
  );
  const canManageUsers = checkFeaturePermission('CREATE_USERS');
  const canExportReports = checkFeaturePermission('EXPORT_REPORTS');

  return {
    user,
    isLoading,
    isAuthenticated,

    // Permission functions
    checkPermission,
    checkFeaturePermission,
    canAccessCompany,
    canAccessDepartment,

    // Role checks
    isSuperAdmin,
    isCompanyAdmin,
    isLeader,
    isSupervisor,
    isEmployee,

    // Feature checks
    canCreateSurveys,
    canLaunchMicroclimates,
    canCreateActionPlans,
    canViewCompanyAnalytics,
    canManageUsers,
    canExportReports,
  };
}


