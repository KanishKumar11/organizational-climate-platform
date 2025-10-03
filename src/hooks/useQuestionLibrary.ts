import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

/**
 * Question Library Hook
 * 
 * Manages question library data with React Query.
 * 
 * Features:
 * - List questions with pagination
 * - Search and filter
 * - CRUD operations
 * - Quick-add most used questions
 * - Bulk operations
 * - Category management
 */

export interface Question {
  _id: string;
  question_text_es: string;
  question_text_en: string;
  question_type: 'likert' | 'multiple_choice' | 'open_ended' | 'yes_no' | 'rating';
  category_id: string;
  category_name?: string;
  options_es?: string[];
  options_en?: string[];
  is_required: boolean;
  is_active: boolean;
  usage_count: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface QuestionCategory {
  _id: string;
  name_es: string;
  name_en: string;
  description_es?: string;
  description_en?: string;
  parent_category_id?: string;
  order: number;
  is_active: boolean;
  question_count?: number;
}

export interface QuestionFilters {
  category?: string;
  type?: string;
  search?: string;
  language?: 'es' | 'en';
  isActive?: boolean;
}

export interface QuestionListResponse {
  questions: Question[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function useQuestionLibrary(filters: QuestionFilters = {}, options = {}) {
  const queryClient = useQueryClient();

  // Build query params
  const queryParams = new URLSearchParams();
  if (filters.category) queryParams.append('category', filters.category);
  if (filters.type) queryParams.append('type', filters.type);
  if (filters.search) queryParams.append('search', filters.search);
  if (filters.language) queryParams.append('language', filters.language);
  if (filters.isActive !== undefined) queryParams.append('isActive', String(filters.isActive));

  // Fetch questions
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['questions', filters],
    queryFn: async () => {
      const response = await fetch(`/api/question-library?${queryParams}`);
      if (!response.ok) {
        throw new Error('Failed to fetch questions');
      }
      return response.json() as Promise<QuestionListResponse>;
    },
    ...options,
  });

  // Create question
  const createMutation = useMutation({
    mutationFn: async (question: Partial<Question>) => {
      const response = await fetch('/api/question-library', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(question),
      });
      if (!response.ok) {
        throw new Error('Failed to create question');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
    },
  });

  // Update question
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Question> }) => {
      const response = await fetch(`/api/question-library/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('Failed to update question');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
    },
  });

  // Delete question
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/question-library/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete question');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
    },
  });

  return {
    // Data
    questions: data?.questions || [],
    total: data?.total || 0,
    page: data?.page || 1,
    limit: data?.limit || 20,
    totalPages: data?.totalPages || 0,
    
    // State
    isLoading,
    error,
    
    // Actions
    refetch,
    createQuestion: createMutation.mutate,
    updateQuestion: updateMutation.mutate,
    deleteQuestion: deleteMutation.mutate,
    
    // Mutation states
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

/**
 * Quick-add questions hook
 * Fetches most frequently used questions
 */
export function useQuickAddQuestions(limit = 10) {
  return useQuery({
    queryKey: ['questions', 'quick-add', limit],
    queryFn: async () => {
      const response = await fetch(`/api/question-library/quick-add?limit=${limit}`);
      if (!response.ok) {
        throw new Error('Failed to fetch quick-add questions');
      }
      return response.json() as Promise<{ questions: Question[] }>;
    },
  });
}

/**
 * Categories hook
 */
export function useQuestionCategories() {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['question-categories'],
    queryFn: async () => {
      const response = await fetch('/api/question-library/categories');
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }
      return response.json() as Promise<{ categories: QuestionCategory[] }>;
    },
  });

  // Create category
  const createMutation = useMutation({
    mutationFn: async (category: Partial<QuestionCategory>) => {
      const response = await fetch('/api/question-library/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(category),
      });
      if (!response.ok) {
        throw new Error('Failed to create category');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['question-categories'] });
    },
  });

  return {
    categories: data?.categories || [],
    isLoading,
    error,
    createCategory: createMutation.mutate,
    isCreating: createMutation.isPending,
  };
}

/**
 * Build hierarchical category tree
 */
export function useCategoryTree() {
  const { categories, isLoading } = useQuestionCategories();

  const tree = useCallback(() => {
    if (!categories.length) return [];

    const map = new Map<string, QuestionCategory & { children: QuestionCategory[] }>();
    const roots: (QuestionCategory & { children: QuestionCategory[] })[] = [];

    // Create map
    categories.forEach(cat => {
      map.set(cat._id, { ...cat, children: [] });
    });

    // Build tree
    categories.forEach(cat => {
      const node = map.get(cat._id)!;
      if (cat.parent_category_id) {
        const parent = map.get(cat.parent_category_id);
        if (parent) {
          parent.children.push(node);
        } else {
          roots.push(node);
        }
      } else {
        roots.push(node);
      }
    });

    return roots;
  }, [categories]);

  return {
    tree: tree(),
    isLoading,
  };
}
