/**
 * Search page with comprehensive search functionality
 */

'use client';

import React from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { GlobalSearch } from '@/components/dashboard/GlobalSearch';
import { SearchResults } from '@/components/dashboard/SearchResults';
import { SearchResult } from '@/types/search';

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialQuery = searchParams.get('q') || '';
  const initialType = searchParams.get('type');
  const initialStatus = searchParams.get('status');

  // Build initial filters from URL params
  const initialFilters = [];
  if (initialType) {
    initialFilters.push({
      type: initialType as any,
      field: 'type',
      value: initialType,
      operator: 'equals' as const,
    });
  }
  if (initialStatus) {
    initialFilters.push({
      type: 'survey' as any, // Default to survey
      field: 'status',
      value: initialStatus,
      operator: 'equals' as const,
    });
  }

  const handleResultClick = (result: SearchResult) => {
    // Navigate to the appropriate page based on result type
    switch (result.type) {
      case 'survey':
        router.push(`/dashboard/surveys/${result.id}`);
        break;
      case 'insight':
        router.push(`/dashboard/insights/${result.id}`);
        break;
      case 'action_plan':
        router.push(`/dashboard/action-plans/${result.id}`);
        break;
      case 'user':
        router.push(`/dashboard/users/${result.id}`);
        break;
      case 'department':
        router.push(`/dashboard/departments/${result.id}`);
        break;
      default:
        console.warn('Unknown result type:', result.type);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Search Header */}
      <div className="flex flex-col items-center space-y-4">
        <h1 className="text-3xl font-bold text-center">Search</h1>
        <GlobalSearch
          className="w-full max-w-3xl"
          placeholder="Search surveys, insights, action plans, users, and departments..."
          onResultClick={handleResultClick}
          showFilters={true}
        />
      </div>

      {/* Search Results */}
      <SearchResults
        initialQuery={initialQuery}
        initialFilters={initialFilters}
        onResultClick={handleResultClick}
      />
    </div>
  );
}
