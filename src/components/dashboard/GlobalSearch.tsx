/**
 * Global search component with advanced filtering and scoped results
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Filter,
  X,
  Clock,
  FileText,
  Brain,
  Target,
  Users,
  Building,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { useSearch } from '@/hooks/useSearch';
import { SearchResult, SearchFilter, SearchableType } from '@/types/search';
import { getModuleColors } from '@/lib/module-colors';
import { cn } from '@/lib/utils';

interface GlobalSearchProps {
  className?: string;
  placeholder?: string;
  onResultClick?: (result: SearchResult) => void;
  showFilters?: boolean;
  maxResults?: number;
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
  user: 'survey', // Default to survey color
  department: 'survey', // Default to survey color
} as const;

export function GlobalSearch({
  className,
  placeholder = 'Search surveys, insights, action plans...',
  onResultClick,
  showFilters = true,
  maxResults = 50,
}: GlobalSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    query,
    filters,
    results,
    loading,
    error,
    suggestions,
    total,
    setQuery,
    addFilter,
    removeFilter,
    clearFilters,
    clearSearch,
    getResultsCountByType,
  } = useSearch({
    debounceMs: 300,
    autoSearch: true,
  });

  // Close search dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSelectedSuggestion(-1);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (!isOpen) return;

      const totalItems =
        suggestions.length + results.slice(0, maxResults).length;

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setSelectedSuggestion((prev) => (prev + 1) % totalItems);
          break;
        case 'ArrowUp':
          event.preventDefault();
          setSelectedSuggestion((prev) => (prev - 1 + totalItems) % totalItems);
          break;
        case 'Enter':
          event.preventDefault();
          if (selectedSuggestion >= 0) {
            if (selectedSuggestion < suggestions.length) {
              // Select suggestion
              const suggestion = suggestions[selectedSuggestion];
              setQuery(suggestion);
              setIsOpen(false);
            } else {
              // Select result
              const resultIndex = selectedSuggestion - suggestions.length;
              const result = results[resultIndex];
              if (result && onResultClick) {
                onResultClick(result);
                setIsOpen(false);
              }
            }
          }
          break;
        case 'Escape':
          setIsOpen(false);
          setSelectedSuggestion(-1);
          inputRef.current?.blur();
          break;
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [
    isOpen,
    selectedSuggestion,
    suggestions,
    results,
    maxResults,
    setQuery,
    onResultClick,
  ]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setIsOpen(true);
    setSelectedSuggestion(-1);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleResultClick = (result: SearchResult) => {
    if (onResultClick) {
      onResultClick(result);
    }
    setIsOpen(false);
  };

  const handleFilterAdd = (
    type: SearchableType,
    field: string,
    value: string
  ) => {
    addFilter({
      type,
      field,
      value,
      operator: 'equals',
    });
  };

  const handleClearSearch = () => {
    clearSearch();
    inputRef.current?.focus();
  };

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

  const groupedResults = results.slice(0, maxResults).reduce(
    (acc, result) => {
      if (!acc[result.type]) {
        acc[result.type] = [];
      }
      acc[result.type].push(result);
      return acc;
    },
    {} as Record<SearchableType, SearchResult[]>
  );

  return (
    <div ref={searchRef} className={cn('relative w-full max-w-2xl', className)}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          className="pl-10 pr-20"
          aria-label="Global search"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          role="combobox"
        />

        {/* Clear and Filter buttons */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {(query || filters.length > 0) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearSearch}
              className="h-6 w-6 p-0"
              aria-label="Clear search"
            >
              <X className="h-3 w-3" />
            </Button>
          )}

          {showFilters && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  aria-label="Search filters"
                >
                  <Filter className="h-3 w-3" />
                  {filters.length > 0 && (
                    <Badge
                      variant="secondary"
                      className="ml-1 h-4 w-4 p-0 text-xs"
                    >
                      {filters.length}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Filter by Type</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {Object.entries(TYPE_LABELS).map(([type, label]) => (
                  <DropdownMenuItem
                    key={type}
                    onClick={() =>
                      handleFilterAdd(type as SearchableType, 'type', type)
                    }
                    className="flex items-center gap-2"
                  >
                    {getTypeIcon(type as SearchableType)}
                    {label}
                    {getResultsCountByType(type as SearchableType) > 0 && (
                      <Badge variant="secondary" className="ml-auto">
                        {getResultsCountByType(type as SearchableType)}
                      </Badge>
                    )}
                  </DropdownMenuItem>
                ))}
                {filters.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={clearFilters}>
                      <X className="h-4 w-4 mr-2" />
                      Clear Filters
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Active Filters */}
      {filters.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {filters.map((filter, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="flex items-center gap-1"
            >
              {getTypeIcon(filter.type)}
              {TYPE_LABELS[filter.type]}: {String(filter.value)}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeFilter(filter)}
                className="h-3 w-3 p-0 ml-1"
              >
                <X className="h-2 w-2" />
              </Button>
            </Badge>
          ))}
        </div>
      )}

      {/* Search Dropdown */}
      {isOpen && (query || results.length > 0) && (
        <Card className="absolute top-full left-0 right-0 mt-1 z-50 max-h-96 overflow-hidden shadow-lg">
          <CardContent className="p-0">
            {loading && (
              <div className="p-4 text-center text-muted-foreground">
                <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
                Searching...
              </div>
            )}

            {error && (
              <div className="p-4 text-center text-destructive">{error}</div>
            )}

            {!loading && !error && (
              <div className="max-h-96 overflow-y-auto">
                {/* Suggestions */}
                {suggestions.length > 0 && (
                  <div className="p-2">
                    <div className="text-xs font-medium text-muted-foreground mb-2 px-2">
                      Suggestions
                    </div>
                    {suggestions.map((suggestion, index) => (
                      <button
                        key={suggestion}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className={cn(
                          'w-full text-left px-2 py-1.5 rounded text-sm hover:bg-muted flex items-center gap-2',
                          selectedSuggestion === index && 'bg-muted'
                        )}
                      >
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        {suggestion}
                      </button>
                    ))}
                    {results.length > 0 && <Separator className="my-2" />}
                  </div>
                )}

                {/* Results */}
                {results.length > 0 && (
                  <div className="p-2">
                    <div className="text-xs font-medium text-muted-foreground mb-2 px-2">
                      Results ({total})
                    </div>
                    {Object.entries(groupedResults).map(
                      ([type, typeResults]) => (
                        <div key={type} className="mb-3 last:mb-0">
                          <div className="text-xs font-medium text-muted-foreground mb-1 px-2 flex items-center gap-1">
                            {getTypeIcon(type as SearchableType)}
                            {TYPE_LABELS[type as SearchableType]} (
                            {typeResults.length})
                          </div>
                          {typeResults.map((result, index) => {
                            const globalIndex =
                              suggestions.length +
                              Object.entries(groupedResults)
                                .slice(
                                  0,
                                  Object.keys(groupedResults).indexOf(type)
                                )
                                .reduce(
                                  (acc, [, results]) => acc + results.length,
                                  0
                                ) +
                              index;

                            const colors = getTypeColor(result.type);

                            return (
                              <button
                                key={result.id}
                                onClick={() => handleResultClick(result)}
                                className={cn(
                                  'w-full text-left p-2 rounded hover:bg-muted border-l-2 border-transparent',
                                  selectedSuggestion === globalIndex &&
                                    'bg-muted'
                                )}
                                style={{
                                  borderLeftColor:
                                    selectedSuggestion === globalIndex
                                      ? colors.primary
                                      : 'transparent',
                                }}
                              >
                                <div className="flex items-start gap-2">
                                  <div
                                    className="p-1 rounded"
                                    style={{
                                      backgroundColor: colors.muted,
                                      color: colors.mutedForeground,
                                    }}
                                  >
                                    {getTypeIcon(result.type)}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium text-sm truncate">
                                      {renderHighlightedText(
                                        result.title,
                                        result.highlights
                                      )}
                                    </div>
                                    {result.description && (
                                      <div className="text-xs text-muted-foreground truncate mt-0.5">
                                        {renderHighlightedText(
                                          result.description,
                                          result.highlights
                                        )}
                                      </div>
                                    )}
                                    <div className="flex items-center gap-2 mt-1">
                                      {result.status && (
                                        <Badge
                                          variant="outline"
                                          className="text-xs"
                                        >
                                          {result.status}
                                        </Badge>
                                      )}
                                      <span className="text-xs text-muted-foreground">
                                        {new Date(
                                          result.created_at
                                        ).toLocaleDateString()}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )
                    )}
                  </div>
                )}

                {!loading && !error && results.length === 0 && query && (
                  <div className="p-4 text-center text-muted-foreground">
                    No results found for "{query}"
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
