/**
 * CLIMA-007: React Query Hooks
 *
 * Custom hooks for data fetching with caching and automatic refetching
 */

import { useQuery, useMutation, UseQueryOptions } from '@tanstack/react-query';
import { queryKeys, invalidateQueries } from '@/lib/react-query-config';

/**
 * Fetch companies list
 */
export function useCompanies(filters?: Record<string, any>) {
  return useQuery({
    queryKey: queryKeys.companies.list(JSON.stringify(filters || {})),
    queryFn: async () => {
      const params = new URLSearchParams(filters || {});
      const response = await fetch(`/api/companies?${params}`);
      if (!response.ok) throw new Error('Failed to fetch companies');
      return response.json();
    },
  });
}

/**
 * Fetch single company
 */
export function useCompany(id: string) {
  return useQuery({
    queryKey: queryKeys.companies.detail(id),
    queryFn: async () => {
      const response = await fetch(`/api/companies/${id}`);
      if (!response.ok) throw new Error('Failed to fetch company');
      return response.json();
    },
    enabled: !!id,
  });
}

/**
 * Fetch company departments (with prefetching on company selection)
 */
export function useCompanyDepartments(companyId: string) {
  return useQuery({
    queryKey: queryKeys.companies.departments(companyId),
    queryFn: async () => {
      const response = await fetch(`/api/companies/${companyId}/departments`);
      if (!response.ok) throw new Error('Failed to fetch departments');
      const data = await response.json();
      return data.departments || [];
    },
    enabled: !!companyId,
    staleTime: 10 * 60 * 1000, // 10 minutes (departments change infrequently)
  });
}

/**
 * Fetch company users (with prefetching on company selection)
 */
export function useCompanyUsers(
  companyId: string,
  options?: { limit?: number; search?: string; departmentId?: string }
) {
  return useQuery({
    queryKey: queryKeys.companies.users(companyId),
    queryFn: async () => {
      const params = new URLSearchParams({
        limit: String(options?.limit || 1000),
        ...(options?.search && { search: options.search }),
        ...(options?.departmentId && { departmentId: options.departmentId }),
      });
      const response = await fetch(
        `/api/companies/${companyId}/users?${params}`
      );
      if (!response.ok) throw new Error('Failed to fetch users');
      const data = await response.json();
      return data.users || [];
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Search question library with caching
 */
export function useQuestionLibrary(filters?: {
  category_id?: string;
  tags?: string[];
  type?: string;
  search_query?: string;
  page?: number;
  limit?: number;
}) {
  // Create a stable query key by stringifying individual values
  const queryKey = [
    'questionLibrary',
    'questions',
    filters?.category_id || '',
    filters?.type || '',
    filters?.search_query || '',
    filters?.tags?.join(',') || '', // Use join to create stable string
    filters?.page || 1,
    filters?.limit || 20,
  ];

  return useQuery({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.category_id) params.append('category', filters.category_id);
      if (filters?.type) params.append('type', filters.type);
      if (filters?.search_query) params.append('search', filters.search_query);
      if (filters?.tags) {
        filters.tags.forEach((tag) => params.append('tags', tag));
      }
      params.append('page', String(filters?.page || 1));
      params.append('limit', String(filters?.limit || 20));

      const response = await fetch(`/api/question-library/search?${params}`);
      if (!response.ok) throw new Error('Failed to search questions');
      return response.json();
    },
    staleTime: 15 * 60 * 1000, // 15 minutes (library changes infrequently)
  });
}

/**
 * Get question categories (cached aggressively)
 */
export function useQuestionCategories(companyId?: string) {
  return useQuery({
    queryKey: queryKeys.questionLibrary.categories(),
    queryFn: async () => {
      const params = companyId ? `?companyId=${companyId}` : '';
      const response = await fetch(`/api/question-library/categories${params}`);
      if (!response.ok) throw new Error('Failed to fetch categories');
      const data = await response.json();
      return data.categories || [];
    },
    staleTime: 30 * 60 * 1000, // 30 minutes (categories rarely change)
  });
}

/**
 * Fetch survey draft
 */
export function useSurveyDraft(sessionId: string) {
  return useQuery({
    queryKey: queryKeys.surveys.draft(sessionId),
    queryFn: async () => {
      const response = await fetch(
        `/api/surveys/drafts?session_id=${sessionId}`
      );
      if (!response.ok) throw new Error('Failed to fetch draft');
      const data = await response.json();
      return data.draft;
    },
    enabled: !!sessionId,
    staleTime: 0, // Always fresh (for draft recovery)
    gcTime: 60 * 60 * 1000, // Keep in cache for 1 hour
  });
}

/**
 * Fetch surveys list
 */
export function useSurveys(filters?: Record<string, any>) {
  return useQuery({
    queryKey: queryKeys.surveys.list(JSON.stringify(filters || {})),
    queryFn: async () => {
      const params = new URLSearchParams(filters || {});
      const response = await fetch(`/api/surveys?${params}`);
      if (!response.ok) throw new Error('Failed to fetch surveys');
      return response.json();
    },
  });
}

/**
 * Fetch single survey
 */
export function useSurvey(id: string) {
  return useQuery({
    queryKey: queryKeys.surveys.detail(id),
    queryFn: async () => {
      const response = await fetch(`/api/surveys/${id}`);
      if (!response.ok) throw new Error('Failed to fetch survey');
      return response.json();
    },
    enabled: !!id,
  });
}

/**
 * Fetch survey responses
 */
export function useSurveyResponses(surveyId: string) {
  return useQuery({
    queryKey: queryKeys.surveys.responses(surveyId),
    queryFn: async () => {
      const response = await fetch(`/api/surveys/${surveyId}/responses`);
      if (!response.ok) throw new Error('Failed to fetch responses');
      return response.json();
    },
    enabled: !!surveyId,
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
  });
}

/**
 * Mutation: Create survey
 */
export function useCreateSurvey() {
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/surveys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create survey');
      return response.json();
    },
    onSuccess: () => {
      // Invalidate surveys list to refetch
      invalidateQueries(queryKeys.surveys.lists());
    },
  });
}

/**
 * Mutation: Save survey draft
 */
export function useSaveDraft() {
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/surveys/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to save draft');
      return response.json();
    },
    onSuccess: (_, variables) => {
      // Update draft cache
      if (variables.session_id) {
        invalidateQueries(queryKeys.surveys.draft(variables.session_id));
      }
    },
  });
}

/**
 * Mutation: Delete draft
 */
export function useDeleteDraft() {
  return useMutation({
    mutationFn: async (draftId: string) => {
      const response = await fetch(`/api/surveys/drafts/${draftId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete draft');
      return response.json();
    },
    onSuccess: () => {
      invalidateQueries(queryKeys.surveys.drafts);
    },
  });
}

/**
 * Mutation: Increment question usage count
 */
export function useIncrementQuestionUsage() {
  return useMutation({
    mutationFn: async (questionId: string) => {
      const response = await fetch(`/api/question-library/${questionId}/use`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to increment usage');
      return response.json();
    },
    onSuccess: () => {
      // Invalidate question library to show updated usage counts
      invalidateQueries(queryKeys.questionLibrary.all);
    },
  });
}
