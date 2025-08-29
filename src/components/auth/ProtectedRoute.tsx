'use client';

import { ReactNode } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { UserRole } from '../../types/user';
import { ROLE_PERMISSIONS } from '../../lib/permissions';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: UserRole;
  requiredFeature?: keyof typeof ROLE_PERMISSIONS;
  fallback?: ReactNode;
  loadingComponent?: ReactNode;
}

export default function ProtectedRoute({
  children,
  requiredRole,
  requiredFeature,
  fallback = (
    <div className="p-4 text-center text-red-600">
      Access denied. Insufficient permissions.
    </div>
  ),
  loadingComponent = <div className="p-4 text-center">Loading...</div>,
}: ProtectedRouteProps) {
  const {
    isLoading,
    isAuthenticated,
    checkPermission,
    checkFeaturePermission,
  } = useAuth();

  if (isLoading) {
    return <>{loadingComponent}</>;
  }

  if (!isAuthenticated) {
    return <>{fallback}</>;
  }

  // Check role-based permission
  if (requiredRole && !checkPermission(requiredRole)) {
    return <>{fallback}</>;
  }

  // Check feature-based permission
  if (requiredFeature && !checkFeaturePermission(requiredFeature)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
