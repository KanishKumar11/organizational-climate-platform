/**
 * Search functionality types and interfaces
 */

export type SearchableType =
  | 'survey'
  | 'insight'
  | 'action_plan'
  | 'user'
  | 'department';

export type SearchOperator =
  | 'equals'
  | 'contains'
  | 'starts_with'
  | 'date_range';

export interface SearchFilter {
  type: SearchableType;
  field: string;
  value: string | string[] | { start: string; end: string };
  operator: SearchOperator;
}

export interface SearchQuery {
  query: string;
  filters: SearchFilter[];
  scope: UserScope;
  limit?: number;
  offset?: number;
}

export interface SearchResult {
  id: string;
  type: SearchableType;
  title: string;
  description?: string;
  status?: string;
  created_at: Date;
  updated_at?: Date;
  relevance_score: number;
  highlights: SearchHighlight[];
  metadata: Record<string, any>;
}

export interface SearchHighlight {
  field: string;
  value: string;
  highlighted: string;
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  query: string;
  filters: SearchFilter[];
  facets: SearchFacet[];
  suggestions: string[];
}

export interface SearchFacet {
  field: string;
  values: Array<{
    value: string;
    count: number;
  }>;
}

export interface UserScope {
  user_id: string;
  role: string;
  company_access: string[];
  department_access: string[];
  survey_access: string[];
  insight_access: string[];
}

export interface DashboardSearchState {
  query: string;
  filters: SearchFilter[];
  results: SearchResult[];
  loading: boolean;
  error: string | null;
  facets: SearchFacet[];
  suggestions: string[];
  total: number;
}

export interface SearchConfig {
  placeholder: string;
  searchableFields: string[];
  filterableFields: string[];
  sortableFields: string[];
  defaultFilters: SearchFilter[];
  maxResults: number;
}

// Search result type guards
export function isSurveyResult(
  result: SearchResult
): result is SearchResult & { type: 'survey' } {
  return result.type === 'survey';
}

export function isInsightResult(
  result: SearchResult
): result is SearchResult & { type: 'insight' } {
  return result.type === 'insight';
}

export function isActionPlanResult(
  result: SearchResult
): result is SearchResult & { type: 'action_plan' } {
  return result.type === 'action_plan';
}

export function isUserResult(
  result: SearchResult
): result is SearchResult & { type: 'user' } {
  return result.type === 'user';
}

export function isDepartmentResult(
  result: SearchResult
): result is SearchResult & { type: 'department' } {
  return result.type === 'department';
}
