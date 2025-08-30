/**
 * Search hook for managing search state and operations
 */

import { useState, useCallback, useEffect } from 'react';
import {
  SearchResult,
  SearchFilter,
  SearchFacet,
  DashboardSearchState,
  SearchableType,
} from '@/types/search';

interface UseSearchOptions {
  debounceMs?: number;
  autoSearch?: boolean;
  defaultFilters?: SearchFilter[];
}

export function useSearch(options: UseSearchOptions = {}) {
  const { debounceMs = 300, autoSearch = true, defaultFilters = [] } = options;

  const [searchState, setSearchState] = useState<DashboardSearchState>({
    query: '',
    filters: defaultFilters,
    results: [],
    loading: false,
    error: null,
    facets: [],
    suggestions: [],
    total: 0,
  });

  const debouncedQuery = useDebounce(searchState.query, debounceMs);

  // Perform search
  const performSearch = useCallback(
    async (query: string, filters: SearchFilter[] = []) => {
      if (!query.trim() && filters.length === 0) {
        setSearchState((prev) => ({
          ...prev,
          results: [],
          total: 0,
          facets: [],
          error: null,
        }));
        return;
      }

      setSearchState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const searchParams = new URLSearchParams();
        if (query.trim()) {
          searchParams.append('q', query.trim());
        }

        // Add filters as query parameters
        filters.forEach((filter) => {
          if (filter.type) searchParams.append('type', filter.type);
          if (filter.field === 'status' && typeof filter.value === 'string') {
            searchParams.append('status', filter.value);
          }
          if (
            filter.operator === 'date_range' &&
            typeof filter.value === 'object' &&
            'start' in filter.value
          ) {
            searchParams.append('date_from', filter.value.start);
            searchParams.append('date_to', filter.value.end);
          }
        });

        const response = await fetch(`/api/search?${searchParams.toString()}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Search failed');
        }

        if (data.success) {
          setSearchState((prev) => ({
            ...prev,
            results: data.data.results,
            total: data.data.total,
            facets: data.data.facets,
            loading: false,
          }));
        } else {
          throw new Error(data.error || 'Search failed');
        }
      } catch (error) {
        console.error('Search error:', error);
        setSearchState((prev) => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Search failed',
          results: [],
          total: 0,
        }));
      }
    },
    []
  );

  // Get search suggestions
  const getSuggestions = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSearchState((prev) => ({ ...prev, suggestions: [] }));
      return;
    }

    try {
      const response = await fetch(
        `/api/search/suggestions?q=${encodeURIComponent(query)}&limit=5`
      );
      const data = await response.json();

      if (data.success) {
        setSearchState((prev) => ({
          ...prev,
          suggestions: data.data.suggestions,
        }));
      }
    } catch (error) {
      console.error('Suggestions error:', error);
      // Don't show error for suggestions, just clear them
      setSearchState((prev) => ({ ...prev, suggestions: [] }));
    }
  }, []);

  // Update search query
  const setQuery = useCallback(
    (query: string) => {
      setSearchState((prev) => ({ ...prev, query }));

      // Get suggestions for non-empty queries
      if (query.trim().length >= 2) {
        getSuggestions(query);
      } else {
        setSearchState((prev) => ({ ...prev, suggestions: [] }));
      }
    },
    [getSuggestions]
  );

  // Add filter
  const addFilter = useCallback((filter: SearchFilter) => {
    setSearchState((prev) => {
      const existingFilterIndex = prev.filters.findIndex(
        (f) => f.type === filter.type && f.field === filter.field
      );

      let newFilters;
      if (existingFilterIndex >= 0) {
        // Replace existing filter
        newFilters = [...prev.filters];
        newFilters[existingFilterIndex] = filter;
      } else {
        // Add new filter
        newFilters = [...prev.filters, filter];
      }

      return { ...prev, filters: newFilters };
    });
  }, []);

  // Remove filter
  const removeFilter = useCallback((filterToRemove: SearchFilter) => {
    setSearchState((prev) => ({
      ...prev,
      filters: prev.filters.filter(
        (f) =>
          !(f.type === filterToRemove.type && f.field === filterToRemove.field)
      ),
    }));
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSearchState((prev) => ({ ...prev, filters: defaultFilters }));
  }, [defaultFilters]);

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchState({
      query: '',
      filters: defaultFilters,
      results: [],
      loading: false,
      error: null,
      facets: [],
      suggestions: [],
      total: 0,
    });
  }, [defaultFilters]);

  // Filter results by type
  const filterResultsByType = useCallback(
    (type: SearchableType) => {
      return searchState.results.filter((result) => result.type === type);
    },
    [searchState.results]
  );

  // Get results count by type
  const getResultsCountByType = useCallback(
    (type: SearchableType) => {
      return searchState.results.filter((result) => result.type === type)
        .length;
    },
    [searchState.results]
  );

  // Auto-search when debounced query or filters change
  useEffect(() => {
    if (autoSearch) {
      performSearch(debouncedQuery, searchState.filters);
    }
  }, [debouncedQuery, searchState.filters, autoSearch, performSearch]);

  return {
    // State
    query: searchState.query,
    filters: searchState.filters,
    results: searchState.results,
    loading: searchState.loading,
    error: searchState.error,
    facets: searchState.facets,
    suggestions: searchState.suggestions,
    total: searchState.total,

    // Actions
    setQuery,
    addFilter,
    removeFilter,
    clearFilters,
    clearSearch,
    performSearch: () => performSearch(searchState.query, searchState.filters),

    // Utilities
    filterResultsByType,
    getResultsCountByType,
  };
}

// Helper hook for debouncing values
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
