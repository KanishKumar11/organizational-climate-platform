/**
 * CLIMA-007: React Query Configuration
 *
 * Centralized data fetching and caching with:
 * - Automatic background refetching
 * - Stale-while-revalidate pattern
 * - Optimistic updates
 * - Retry logic
 * - DevTools integration
 */

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time: How long data is considered fresh (5 minutes)
      staleTime: 5 * 60 * 1000,

      // Cache time: How long inactive data stays in cache (10 minutes)
      gcTime: 10 * 60 * 1000,

      // Retry failed requests (with exponential backoff)
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

      // Refetch on window focus (for real-time data)
      refetchOnWindowFocus: true,

      // Refetch on reconnect
      refetchOnReconnect: true,

      // Don't refetch on mount if data is fresh
      refetchOnMount: false,
    },
    mutations: {
      // Retry mutations once
      retry: 1,

      // Network error handling
      networkMode: 'online',
    },
  },
});

/**
 * Query Keys Factory
 * Centralized query key management for consistency
 */
export const queryKeys = {
  // Companies
  companies: {
    all: ['companies'] as const,
    lists: () => [...queryKeys.companies.all, 'list'] as const,
    list: (filters: string) =>
      [...queryKeys.companies.lists(), { filters }] as const,
    details: () => [...queryKeys.companies.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.companies.details(), id] as const,
    departments: (id: string) =>
      [...queryKeys.companies.detail(id), 'departments'] as const,
    users: (id: string) =>
      [...queryKeys.companies.detail(id), 'users'] as const,
  },

  // Surveys
  surveys: {
    all: ['surveys'] as const,
    lists: () => [...queryKeys.surveys.all, 'list'] as const,
    list: (filters: string) =>
      [...queryKeys.surveys.lists(), { filters }] as const,
    details: () => [...queryKeys.surveys.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.surveys.details(), id] as const,
    responses: (id: string) =>
      [...queryKeys.surveys.detail(id), 'responses'] as const,
    results: (id: string) =>
      [...queryKeys.surveys.detail(id), 'results'] as const,
    drafts: ['surveys', 'drafts'] as const,
    draft: (sessionId: string) =>
      [...queryKeys.surveys.drafts, sessionId] as const,
  },

  // Question Library
  questionLibrary: {
    all: ['question-library'] as const,
    questions: (filters: string) =>
      [...queryKeys.questionLibrary.all, 'questions', { filters }] as const,
    categories: () => [...queryKeys.questionLibrary.all, 'categories'] as const,
    popular: (limit: number) =>
      [...queryKeys.questionLibrary.all, 'popular', limit] as const,
  },

  // Users
  users: {
    all: ['users'] as const,
    lists: () => [...queryKeys.users.all, 'list'] as const,
    list: (filters: string) =>
      [...queryKeys.users.lists(), { filters }] as const,
    details: () => [...queryKeys.users.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.users.details(), id] as const,
    current: () => [...queryKeys.users.all, 'current'] as const,
  },

  // Departments
  departments: {
    all: ['departments'] as const,
    lists: () => [...queryKeys.departments.all, 'list'] as const,
    list: (companyId: string) =>
      [...queryKeys.departments.lists(), companyId] as const,
    details: () => [...queryKeys.departments.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.departments.details(), id] as const,
  },

  // Analytics
  analytics: {
    all: ['analytics'] as const,
    survey: (id: string) => [...queryKeys.analytics.all, 'survey', id] as const,
    dashboard: () => [...queryKeys.analytics.all, 'dashboard'] as const,
  },
};

/**
 * Prefetch helper for predictive loading
 */
export async function prefetchQuery<T>(
  queryKey: readonly unknown[],
  queryFn: () => Promise<T>
) {
  return queryClient.prefetchQuery({
    queryKey,
    queryFn,
  });
}

/**
 * Invalidate queries helper
 */
export function invalidateQueries(queryKey: readonly unknown[]) {
  return queryClient.invalidateQueries({ queryKey });
}

/**
 * Set query data helper (for optimistic updates)
 */
export function setQueryData<T>(queryKey: readonly unknown[], data: T) {
  queryClient.setQueryData(queryKey, data);
}

/**
 * Get query data helper
 */
export function getQueryData<T>(queryKey: readonly unknown[]): T | undefined {
  return queryClient.getQueryData(queryKey);
}
