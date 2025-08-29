/**
 * Search results page component with advanced filtering and pagination
 */

'use client';

import React, { useState } from 'react';
import {
  FileText,
  Brain,
  Target,
  Users,
  Building,
  Calendar,
  Filter,
  SortAsc,
  SortDesc,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSearch } from '@/hooks/useSearch';
import { SearchResult, SearchableType, SearchFilter } from '@/types/search';
import { getModuleColors } from '@/lib/module-colors';
import { cn } from '@/lib/utils';

interface SearchResultsProps {
  initialQuery?: string;
  initialFilters?: SearchFilter[];
  onResultClick?: (result: SearchResult) => void;
}

const TYPE_ICONS = {
  survey: FileText,
  insight: Brain,
  action_plan: Target,
  user: Users,
  department: Building,
};

const TYPE_LABELS = {
  survey: 'Surveys',
  insight: 'AI Insights',
  action_plan: 'Action Plans',
  user: 'Users',
  department: 'Departments',
};

const TYPE_COLORS = {
  survey: 'survey',
  insight: 'ai',
  action_plan: 'action',
  user: 'survey',
  department: 'survey',
} as const;

type SortField = 'relevance' | 'date' | 'title';
type SortOrder = 'asc' | 'desc';

export function SearchResults({
  initialQuery = '',
  initialFilters = [],
  onResultClick,
}: SearchResultsProps) {
  const [sortField, setSortField] = useState<SortField>('relevance');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [selectedType, setSelectedType] = useState<SearchableType | 'all'>(
    'all'
  );

  const {
    query,
    filters,
    results,
    loading,
    error,
    facets,
    total,
    setQuery,
    addFilter,
    removeFilter,
    clearFilters,
    filterResultsByType,
    getResultsCountByType,
  } = useSearch({
    debounceMs: 300,
    autoSearch: true,
    defaultFilters: initialFilters,
  });

  // Initialize query if provided
  React.useEffect(() => {
    if (initialQuery && !query) {
      setQuery(initialQuery);
    }
  }, [initialQuery, query, setQuery]);

  const getTypeIcon = (type: SearchableType) => {
    const Icon = TYPE_ICONS[type];
    return Icon ? <Icon className="h-4 w-4" /> : null;
  };

  const getTypeColor = (type: SearchableType) => {
    const colorType = TYPE_COLORS[type];
    return getModuleColors(colorType);
  };

  const renderHighlightedText = (text: string, highlights: any[]) => {
    const highlight = highlights.find((h) => h.value === text);
    if (highlight) {
      return (
        <span dangerouslySetInnerHTML={{ __html: highlight.highlighted }} />
      );
    }
    return text;
  };

  const sortResults = (results: SearchResult[]) => {
    return [...results].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'relevance':
          comparison = b.relevance_score - a.relevance_score;
          break;
        case 'date':
          comparison =
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
      }

      return sortOrder === 'asc' ? -comparison : comparison;
    });
  };

  const filteredResults =
    selectedType === 'all' ? results : filterResultsByType(selectedType);

  const sortedResults = sortResults(filteredResults);

  const handleTypeFilter = (type: SearchableType) => {
    if (selectedType === type) {
      setSelectedType('all');
    } else {
      setSelectedType(type);
    }
  };

  const handleStatusFilter = (status: string) => {
    const existingFilter = filters.find((f) => f.field === 'status');
    if (existingFilter) {
      removeFilter(existingFilter);
    } else {
      addFilter({
        type: 'survey', // Default to survey, but this could be dynamic
        field: 'status',
        value: status,
        operator: 'equals',
      });
    }
  };

  const toggleSort = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Search Results</h2>
          {query && (
            <p className="text-muted-foreground">
              {total} results for "{query}"
            </p>
          )}
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-2">
          <Select
            value={sortField}
            onValueChange={(value) => setSortField(value as SortField)}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevance">Relevance</SelectItem>
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="title">Title</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={toggleSort}
            className="flex items-center gap-1"
          >
            {sortOrder === 'asc' ? (
              <SortAsc className="h-4 w-4" />
            ) : (
              <SortDesc className="h-4 w-4" />
            )}
            {sortOrder === 'asc' ? 'Asc' : 'Desc'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Type Filters */}
              <div>
                <h4 className="font-medium mb-2">Type</h4>
                <div className="space-y-1">
                  {Object.entries(TYPE_LABELS).map(([type, label]) => {
                    const count = getResultsCountByType(type as SearchableType);
                    const colors = getTypeColor(type as SearchableType);
                    const isSelected = selectedType === type;

                    return (
                      <button
                        key={type}
                        onClick={() => handleTypeFilter(type as SearchableType)}
                        disabled={count === 0}
                        className={cn(
                          'w-full flex items-center justify-between p-2 rounded text-sm transition-colors',
                          isSelected
                            ? 'bg-primary text-primary-foreground'
                            : count > 0
                              ? 'hover:bg-muted'
                              : 'opacity-50 cursor-not-allowed'
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="p-1 rounded"
                            style={{
                              backgroundColor: isSelected
                                ? 'rgba(255,255,255,0.2)'
                                : colors.muted,
                              color: isSelected
                                ? 'currentColor'
                                : colors.mutedForeground,
                            }}
                          >
                            {getTypeIcon(type as SearchableType)}
                          </div>
                          {label}
                        </div>
                        <Badge variant={isSelected ? 'secondary' : 'outline'}>
                          {count}
                        </Badge>
                      </button>
                    );
                  })}
                </div>
              </div>

              <Separator />

              {/* Status Filters (from facets) */}
              {facets.find((f) => f.field === 'status') && (
                <div>
                  <h4 className="font-medium mb-2">Status</h4>
                  <div className="space-y-1">
                    {facets
                      .find((f) => f.field === 'status')
                      ?.values.map(({ value, count }) => {
                        const isActive = filters.some(
                          (f) => f.field === 'status' && f.value === value
                        );

                        return (
                          <button
                            key={value}
                            onClick={() => handleStatusFilter(value)}
                            className={cn(
                              'w-full flex items-center justify-between p-2 rounded text-sm transition-colors',
                              isActive
                                ? 'bg-primary text-primary-foreground'
                                : 'hover:bg-muted'
                            )}
                          >
                            <span className="capitalize">{value}</span>
                            <Badge variant={isActive ? 'secondary' : 'outline'}>
                              {count}
                            </Badge>
                          </button>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Clear Filters */}
              {(filters.length > 0 || selectedType !== 'all') && (
                <>
                  <Separator />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      clearFilters();
                      setSelectedType('all');
                    }}
                    className="w-full"
                  >
                    Clear All Filters
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Results */}
        <div className="lg:col-span-3">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          )}

          {error && (
            <Card>
              <CardContent className="p-6 text-center text-destructive">
                {error}
              </CardContent>
            </Card>
          )}

          {!loading && !error && sortedResults.length === 0 && (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                {query ? `No results found for "${query}"` : 'No results found'}
              </CardContent>
            </Card>
          )}

          {!loading && !error && sortedResults.length > 0 && (
            <div className="space-y-4">
              {sortedResults.map((result) => {
                const colors = getTypeColor(result.type);

                return (
                  <Card
                    key={result.id}
                    className="cursor-pointer hover:shadow-md transition-shadow border-l-4"
                    style={{ borderLeftColor: colors.primary }}
                    onClick={() => onResultClick?.(result)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div
                          className="p-2 rounded"
                          style={{
                            backgroundColor: colors.muted,
                            color: colors.mutedForeground,
                          }}
                        >
                          {getTypeIcon(result.type)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-semibold text-lg">
                              {renderHighlightedText(
                                result.title,
                                result.highlights
                              )}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {new Date(result.created_at).toLocaleDateString()}
                            </div>
                          </div>

                          {result.description && (
                            <p className="text-muted-foreground mt-1">
                              {renderHighlightedText(
                                result.description,
                                result.highlights
                              )}
                            </p>
                          )}

                          <div className="flex items-center gap-2 mt-3">
                            <Badge
                              variant="secondary"
                              style={{
                                backgroundColor: colors.accent,
                                color: colors.accentForeground,
                              }}
                            >
                              {TYPE_LABELS[result.type]}
                            </Badge>

                            {result.status && (
                              <Badge variant="outline">{result.status}</Badge>
                            )}

                            {result.relevance_score > 0 && (
                              <Badge variant="outline" className="text-xs">
                                {Math.round(result.relevance_score * 100)}%
                                match
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
