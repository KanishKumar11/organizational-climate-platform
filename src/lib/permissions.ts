import { UserRole, USER_ROLES } from '../types/user';

// Type definitions for permission functions
interface UserWithPermissions {
  _id: string;
  role: UserRole;
  company_id: string;
  department_id: string;
}

interface ActionPlanWithPermissions {
  _id: string;
  company_id: string;
  department_id: string;
  created_by: string;
  assigned_to: string[];
}

/**
 * Permission utility functions for role-based access control
 */

/**
 * Check if a user role has permission to access a required role level
 */
export function hasPermission(
  userRole: UserRole,
  requiredRole: UserRole
): boolean {
  const userLevel = USER_ROLES[userRole];
  const requiredLevel = USER_ROLES[requiredRole];
  return userLevel >= requiredLevel;
}

/**
 * Check if a user can access a specific company
 */
export function canAccessCompany(
  userRole: UserRole,
  userCompanyId: string,
  targetCompanyId: string
): boolean {
  // Super admins can access any company
  if (userRole === 'super_admin') {
    return true;
  }
  // Other roles can only access their own company
  return userCompanyId === targetCompanyId;
}

/**
 * Check if a user can access a specific department
 */
export function canAccessDepartment(
  userRole: UserRole,
  userCompanyId: string,
  userDepartmentId: string,
  targetDepartmentId: string
): boolean {
  // Super admins can access any department
  if (userRole === 'super_admin') {
    return true;
  }
  // Company admins can access all departments in their company
  if (userRole === 'company_admin') {
    return true;
  }
  // Other roles can only access their own department
  return userDepartmentId === targetDepartmentId;
}

/**
 * Get the permission level for a role
 */
export function getPermissionLevel(role: UserRole): number {
  return USER_ROLES[role];
}

/**
 * Check if a user can manage other users
 */
export function canManageUsers(
  userRole: UserRole,
  targetUserRole: UserRole
): boolean {
  // Users can only manage users with lower permission levels
  return getPermissionLevel(userRole) > getPermissionLevel(targetUserRole);
}

/**
 * Check if a user can create surveys
 */
export function canCreateSurveys(userRole: UserRole): boolean {
  return hasPermission(userRole, 'company_admin');
}

/**
 * Check if a user can launch microclimates
 */
export function canLaunchMicroclimates(userRole: UserRole): boolean {
  return hasPermission(userRole, 'leader');
}

/**
 * Check if a user can create action plans
 */
export function canCreateActionPlans(userRole: UserRole): boolean {
  return hasPermission(userRole, 'leader');
}

/**
 * Check if a user can view company-wide analytics
 */
export function canViewCompanyAnalytics(userRole: UserRole): boolean {
  return hasPermission(userRole, 'company_admin');
}

/**
 * Check if a user can manage benchmarks
 */
export function canManageBenchmarks(userRole: UserRole): boolean {
  return hasPermission(userRole, 'company_admin');
}

/**
 * Check if a user can access global settings
 */
export function canAccessGlobalSettings(userRole: UserRole): boolean {
  return hasPermission(userRole, 'super_admin');
}

/**
 * Get allowed roles that a user can assign to others
 */
export function getAllowedRolesToAssign(userRole: UserRole): UserRole[] {
  const userLevel = getPermissionLevel(userRole);
  return Object.entries(USER_ROLES)
    .filter(([, level]) => level < userLevel)
    .map(([role]) => role as UserRole);
}

/**
 * Role-based feature flags
 */
export const ROLE_PERMISSIONS = {
  // Survey management
  CREATE_SURVEYS: ['super_admin', 'company_admin'] as UserRole[],
  EDIT_SURVEYS: ['super_admin', 'company_admin'] as UserRole[],
  DELETE_SURVEYS: ['super_admin', 'company_admin'] as UserRole[],
  VIEW_SURVEY_RESULTS: ['super_admin', 'company_admin', 'leader'] as UserRole[],

  // Microclimate management
  LAUNCH_MICROCLIMATES: [
    'super_admin',
    'company_admin',
    'leader',
  ] as UserRole[],
  VIEW_MICROCLIMATE_RESULTS: [
    'super_admin',
    'company_admin',
    'leader',
  ] as UserRole[],

  // Action plan management
  CREATE_ACTION_PLANS: ['super_admin', 'company_admin', 'leader'] as UserRole[],
  ASSIGN_ACTION_PLANS: ['super_admin', 'company_admin', 'leader'] as UserRole[],
  VIEW_ACTION_PLANS: [
    'super_admin',
    'company_admin',
    'leader',
    'supervisor',
  ] as UserRole[],

  // User management
  CREATE_USERS: ['super_admin', 'company_admin'] as UserRole[],
  EDIT_USERS: ['super_admin', 'company_admin'] as UserRole[],
  DELETE_USERS: ['super_admin', 'company_admin'] as UserRole[],

  // Analytics and reporting
  VIEW_COMPANY_ANALYTICS: ['super_admin', 'company_admin'] as UserRole[],
  VIEW_DEPARTMENT_ANALYTICS: [
    'super_admin',
    'company_admin',
    'leader',
  ] as UserRole[],
  VIEW_TEAM_ANALYTICS: [
    'super_admin',
    'company_admin',
    'leader',
    'supervisor',
  ] as UserRole[],
  EXPORT_REPORTS: ['super_admin', 'company_admin', 'leader'] as UserRole[],

  // System administration
  MANAGE_BENCHMARKS: ['super_admin', 'company_admin'] as UserRole[],
  MANAGE_QUESTION_BANK: ['super_admin', 'company_admin'] as UserRole[],
  GLOBAL_SETTINGS: ['super_admin'] as UserRole[],
  COMPANY_SETTINGS: ['super_admin', 'company_admin'] as UserRole[],
} as const;

/**
 * Check if a user has a specific feature permission
 */
export function hasFeaturePermission(
  userRole: UserRole,
  feature: keyof typeof ROLE_PERMISSIONS
): boolean {
  return ROLE_PERMISSIONS[feature].includes(userRole);
}
/**
 * Check if a user can access a specific action plan
 */
export function canAccessActionPlan(
  user: UserWithPermissions,
  actionPlan: ActionPlanWithPermissions
): boolean {
  // Super admins can access any action plan
  if (user.role === 'super_admin') {
    return true;
  }

  // Company admins can access action plans in their company
  if (
    user.role === 'company_admin' &&
    actionPlan.company_id === user.company_id
  ) {
    return true;
  }

  // Department admins can access action plans in their department
  if (
    user.role === 'department_admin' &&
    actionPlan.company_id === user.company_id &&
    actionPlan.department_id === user.department_id
  ) {
    return true;
  }

  // Leaders can access action plans they created or are assigned to
  if (['leader', 'supervisor'].includes(user.role)) {
    const isCreator = actionPlan.created_by.toString() === user._id.toString();
    const isAssigned = actionPlan.assigned_to.some(
      (assignedId: string) => assignedId.toString() === user._id.toString()
    );
    return isCreator || isAssigned;
  }

  // Employees can only access action plans they are assigned to
  if (user.role === 'employee') {
    return actionPlan.assigned_to.some(
      (assignedId: string) => assignedId.toString() === user._id.toString()
    );
  }

  return false;
}

/**
 * Apply data scoping to a query based on user role and permissions
 */
export function applyDataScoping(
  query: Record<string, any>,
  user: UserWithPermissions
): Record<string, unknown> {
  switch (user.role) {
    case 'super_admin':
      // Super admins can see everything
      return query;

    case 'company_admin':
      // Company admins can see everything in their company
      return { ...query, company_id: user.company_id };

    case 'department_admin':
      // Department admins can see everything in their department
      return {
        ...query,
        company_id: user.company_id,
        department_id: user.department_id,
      };

    case 'leader':
    case 'supervisor':
      // Leaders can see action plans they created or are assigned to
      return {
        ...query,
        company_id: user.company_id,
        $or: [{ created_by: user._id }, { assigned_to: { $in: [user._id] } }],
      };

    case 'employee':
      // Employees can only see action plans they are assigned to
      return {
        ...query,
        company_id: user.company_id,
        assigned_to: { $in: [user._id] },
      };

    default:
      // Default to no access
      return { ...query, _id: null };
  }
}

/**
 * Check if a user can edit a specific action plan
 */
export function canEditActionPlan(
  user: UserWithPermissions,
  actionPlan: ActionPlanWithPermissions
): boolean {
  // Super admins can edit any action plan
  if (user.role === 'super_admin') {
    return true;
  }

  // Company admins can edit action plans in their company
  if (
    user.role === 'company_admin' &&
    actionPlan.company_id === user.company_id
  ) {
    return true;
  }

  // Department admins can edit action plans in their department
  if (
    user.role === 'department_admin' &&
    actionPlan.company_id === user.company_id &&
    actionPlan.department_id === user.department_id
  ) {
    return true;
  }

  // Creators can edit their own action plans
  if (actionPlan.created_by.toString() === user._id.toString()) {
    return true;
  }

  return false;
}

/**
 * Check if a user can assign action plans to others
 */
export function canAssignActionPlans(user: UserWithPermissions): boolean {
  return [
    'super_admin',
    'company_admin',
    'department_admin',
    'leader',
  ].includes(user.role);
}

/**
 * Check if a user can manage questions in the question bank
 */
export function canManageQuestions(userRole: UserRole): boolean {
  return hasFeaturePermission(userRole, 'MANAGE_QUESTION_BANK');
}

/**
 * Check if a user has a specific permission by string
 */
export function hasStringPermission(
  userRole: UserRole,
  permission: string
): boolean {
  switch (permission) {
    case 'manage_questions':
      return canManageQuestions(userRole);
    case 'create_surveys':
      return canCreateSurveys(userRole);
    case 'launch_microclimates':
      return canLaunchMicroclimates(userRole);
    case 'create_action_plans':
      return canCreateActionPlans(userRole);
    case 'view_company_analytics':
      return canViewCompanyAnalytics(userRole);
    case 'manage_benchmarks':
      return canManageBenchmarks(userRole);
    case 'access_global_settings':
      return canAccessGlobalSettings(userRole);
    default:
      return false;
  }
}

/**
 * Validate permissions for a user and action
 */
export async function validatePermissions(
  userId: string,
  action: string,
  companyId?: string
): Promise<boolean> {
  // This is a simplified implementation
  // In a real app, you'd fetch the user and check their permissions
  return true;
}

/**
 * Check permissions for a user role and feature
 */
export function checkPermissions(userRole: UserRole, feature: string): boolean {
  // This is a simplified implementation
  // In a real app, you'd have a more complex permission system
  return true;
}
