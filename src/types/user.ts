/**
 * User types and constants for client-side usage
 * This file contains only TypeScript types and constants without Mongoose dependencies
 */

export const USER_ROLES = {
  employee: 1,
  supervisor: 2,
  leader: 3,
  department_admin: 4,
  company_admin: 5,
  super_admin: 6,
} as const;

export type UserRole = keyof typeof USER_ROLES;

export interface NotificationSettings {
  email_surveys: boolean;
  email_microclimates: boolean;
  email_action_plans: boolean;
  email_reminders: boolean;
  push_notifications: boolean;
  digest_frequency: 'daily' | 'weekly' | 'monthly' | 'never';
}

export interface UserPreferences {
  language: string;
  timezone: string;
  notification_settings: NotificationSettings;
  dashboard_layout?: string;
  theme?: 'light' | 'dark' | 'auto';
}

// Enhanced demographic information for users
export interface UserDemographics {
  gender?: 'male' | 'female' | 'non_binary' | 'prefer_not_to_say' | 'other';
  education_level?:
    | 'high_school'
    | 'associate'
    | 'bachelor'
    | 'master'
    | 'doctorate'
    | 'other';
  job_title?: string;
  hierarchy_level?: 'entry' | 'mid' | 'senior' | 'executive' | 'c_level';
  work_location?: 'remote' | 'hybrid' | 'onsite';
  site_location?: string;
  tenure_months?: number; // Time with company in months
  previous_experience_years?: number;
  team_size?: number;
  reports_count?: number;
  custom_attributes?: Record<string, any>;
}

/**
 * Base user interface for client-side usage
 * This excludes Mongoose Document methods and properties
 */
export interface IUserBase {
  _id?: string;
  name: string;
  email: string;
  role: UserRole;
  company_id: string;
  department_id: string;
  preferences: UserPreferences;
  demographics?: UserDemographics;
  is_active: boolean;
  last_login?: Date;
  created_at: Date;
  updated_at: Date;
}

/**
 * User interface for authentication context
 */
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  companyId: string;
  departmentId: string;
  isActive: boolean;
  image?: string;
}
