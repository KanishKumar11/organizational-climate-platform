/**
 * Translation Utilities
 * Helper functions for working with translations in the app
 */

import { useTranslations } from 'next-intl';

/**
 * Hook to get common translations used across the app
 */
export function useCommonTranslations() {
  const t = useTranslations();

  return {
    common: useTranslations('common'),
    navigation: useTranslations('navigation'),
    validation: useTranslations('validation'),
    errors: useTranslations('errors'),
    success: useTranslations('success'),
  };
}

/**
 * Get locale from browser or localStorage
 */
export function getPreferredLocale(): 'en' | 'es' {
  if (typeof window === 'undefined') return 'en';

  // Check localStorage first
  const stored = localStorage.getItem('preferredLocale');
  if (stored === 'en' || stored === 'es') return stored;

  // Check browser language
  const browserLang = navigator.language.toLowerCase();
  if (browserLang.startsWith('es')) return 'es';

  return 'en';
}

/**
 * Format date according to locale
 */
export function formatDate(
  date: Date | string,
  locale: 'en' | 'es' = 'en'
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  return new Intl.DateTimeFormat(locale === 'es' ? 'es-ES' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(dateObj);
}

/**
 * Format date and time according to locale
 */
export function formatDateTime(
  date: Date | string,
  locale: 'en' | 'es' = 'en'
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  return new Intl.DateTimeFormat(locale === 'es' ? 'es-ES' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(dateObj);
}

/**
 * Format numbers according to locale
 */
export function formatNumber(num: number, locale: 'en' | 'es' = 'en'): string {
  return new Intl.NumberFormat(locale === 'es' ? 'es-ES' : 'en-US').format(num);
}

/**
 * Format currency according to locale
 */
export function formatCurrency(
  amount: number,
  currency: string = 'USD',
  locale: 'en' | 'es' = 'en'
): string {
  return new Intl.NumberFormat(locale === 'es' ? 'es-ES' : 'en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Format percentage according to locale
 */
export function formatPercentage(
  value: number,
  locale: 'en' | 'es' = 'en'
): string {
  return new Intl.NumberFormat(locale === 'es' ? 'es-ES' : 'en-US', {
    style: 'percent',
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(value / 100);
}

/**
 * Get status translation key
 */
export function getStatusKey(status: string): string {
  const statusMap: Record<string, string> = {
    active: 'common.active',
    inactive: 'common.inactive',
    completed: 'common.completed',
    pending: 'common.pending',
    failed: 'common.failed',
    draft: 'surveys.draft',
    published: 'surveys.published',
    closed: 'surveys.closed',
    scheduled: 'surveys.scheduled',
    in_progress: 'actionPlans.inProgress',
    not_started: 'actionPlans.notStarted',
    overdue: 'actionPlans.overdue',
    cancelled: 'actionPlans.cancelled',
  };

  return statusMap[status] || status;
}

/**
 * Get role translation key
 */
export function getRoleKey(role: string): string {
  const roleMap: Record<string, string> = {
    employee: 'users.employee',
    supervisor: 'users.supervisor',
    leader: 'users.leader',
    department_admin: 'users.departmentAdmin',
    company_admin: 'users.companyAdmin',
    super_admin: 'users.superAdmin',
  };

  return roleMap[role] || role;
}

/**
 * Get priority translation key
 */
export function getPriorityKey(priority: string): string {
  const priorityMap: Record<string, string> = {
    low: 'actionPlans.low',
    medium: 'actionPlans.medium',
    high: 'actionPlans.high',
    critical: 'actionPlans.critical',
  };

  return priorityMap[priority] || priority;
}
