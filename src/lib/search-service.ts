/**
 * Advanced search service with role-based scoping and relevance scoring
 */

import { connectToDatabase } from './mongodb';
import {
  SearchQuery,
  SearchResult,
  SearchResponse,
  SearchFilter,
  SearchFacet,
  UserScope,
  SearchableType,
} from '@/types/search';

export class SearchService {
  private static instance: SearchService;

  public static getInstance(): SearchService {
    if (!SearchService.instance) {
      SearchService.instance = new SearchService();
    }
    return SearchService.instance;
  }

  /**
   * Perform global search across all searchable entities
   */
  async search(searchQuery: SearchQuery): Promise<SearchResponse> {
    const { db } = await connectToDatabase();

    try {
      const results: SearchResult[] = [];
      const facets: SearchFacet[] = [];
      const suggestions: string[] = [];

      // Build MongoDB aggregation pipeline based on search query and filters
      const pipeline = this.buildSearchPipeline(searchQuery);

      // Search across different collections based on user scope
      if (this.canAccessType('survey', searchQuery.scope)) {
        const surveyResults = await this.searchSurveys(db, searchQuery);
        results.push(...surveyResults);
      }

      if (this.canAccessType('insight', searchQuery.scope)) {
        const insightResults = await this.searchInsights(db, searchQuery);
        results.push(...insightResults);
      }

      if (this.canAccessType('action_plan', searchQuery.scope)) {
        const actionPlanResults = await this.searchActionPlans(db, searchQuery);
        results.push(...actionPlanResults);
      }

      if (this.canAccessType('user', searchQuery.scope)) {
        const userResults = await this.searchUsers(db, searchQuery);
        results.push(...userResults);
      }

      if (this.canAccessType('department', searchQuery.scope)) {
        const departmentResults = await this.searchDepartments(db, searchQuery);
        results.push(...departmentResults);
      }

      // Sort results by relevance score
      results.sort((a, b) => b.relevance_score - a.relevance_score);

      // Apply pagination
      const offset = searchQuery.offset || 0;
      const limit = searchQuery.limit || 50;
      const paginatedResults = results.slice(offset, offset + limit);

      // Generate facets for filtering
      const generatedFacets = this.generateFacets(results);
      facets.push(...generatedFacets);

      // Generate search suggestions
      const generatedSuggestions = await this.generateSuggestions(
        searchQuery.query,
        db
      );
      suggestions.push(...generatedSuggestions);

      return {
        results: paginatedResults,
        total: results.length,
        query: searchQuery.query,
        filters: searchQuery.filters,
        facets,
        suggestions,
      };
    } catch (error) {
      console.error('Search error:', error);
      throw new Error('Search operation failed');
    }
  }

  /**
   * Search surveys with role-based scoping
   */
  private async searchSurveys(
    db: any,
    searchQuery: SearchQuery
  ): Promise<SearchResult[]> {
    const { query, scope } = searchQuery;

    const matchStage: any = {
      $and: [
        this.buildScopeFilter('survey', scope),
        query
          ? {
              $or: [
                { title: { $regex: query, $options: 'i' } },
                { description: { $regex: query, $options: 'i' } },
                { type: { $regex: query, $options: 'i' } },
              ],
            }
          : {},
      ].filter(Boolean),
    };

    // Apply additional filters
    const additionalFilters = this.buildTypeFilters(
      searchQuery.filters,
      'survey'
    );
    if (additionalFilters.length > 0) {
      matchStage.$and.push(...additionalFilters);
    }

    const pipeline = [
      { $match: matchStage },
      {
        $addFields: {
          relevance_score: this.buildRelevanceScore(query, [
            'title',
            'description',
          ]),
        },
      },
      { $sort: { relevance_score: -1, created_at: -1 } },
      { $limit: 100 },
    ];

    const surveys = await db
      .collection('surveys')
      .aggregate(pipeline)
      .toArray();

    return surveys.map((survey: any) => ({
      id: survey._id.toString(),
      type: 'survey' as SearchableType,
      title: survey.title,
      description: survey.description,
      status: survey.status,
      created_at: survey.created_at,
      updated_at: survey.updated_at,
      relevance_score: survey.relevance_score || 0,
      highlights: this.generateHighlights(query, survey, [
        'title',
        'description',
      ]),
      metadata: {
        type: survey.type,
        company_id: survey.company_id,
        created_by: survey.created_by,
        start_date: survey.start_date,
        end_date: survey.end_date,
      },
    }));
  }

  /**
   * Search AI insights with role-based scoping
   */
  private async searchInsights(
    db: any,
    searchQuery: SearchQuery
  ): Promise<SearchResult[]> {
    const { query, scope } = searchQuery;

    const matchStage: any = {
      $and: [
        this.buildScopeFilter('insight', scope),
        query
          ? {
              $or: [
                { title: { $regex: query, $options: 'i' } },
                { description: { $regex: query, $options: 'i' } },
                { category: { $regex: query, $options: 'i' } },
                { recommended_actions: { $regex: query, $options: 'i' } },
              ],
            }
          : {},
      ].filter(Boolean),
    };

    const additionalFilters = this.buildTypeFilters(
      searchQuery.filters,
      'insight'
    );
    if (additionalFilters.length > 0) {
      matchStage.$and.push(...additionalFilters);
    }

    const pipeline = [
      { $match: matchStage },
      {
        $addFields: {
          relevance_score: this.buildRelevanceScore(query, [
            'title',
            'description',
            'category',
          ]),
        },
      },
      { $sort: { relevance_score: -1, created_at: -1 } },
      { $limit: 100 },
    ];

    const insights = await db
      .collection('aiinsights')
      .aggregate(pipeline)
      .toArray();

    return insights.map((insight: any) => ({
      id: insight._id.toString(),
      type: 'insight' as SearchableType,
      title: insight.title,
      description: insight.description,
      status: insight.priority,
      created_at: insight.created_at,
      relevance_score: insight.relevance_score || 0,
      highlights: this.generateHighlights(query, insight, [
        'title',
        'description',
        'category',
      ]),
      metadata: {
        category: insight.category,
        priority: insight.priority,
        confidence_score: insight.confidence_score,
        survey_id: insight.survey_id,
        affected_segments: insight.affected_segments,
      },
    }));
  }

  /**
   * Search action plans with role-based scoping
   */
  private async searchActionPlans(
    db: any,
    searchQuery: SearchQuery
  ): Promise<SearchResult[]> {
    const { query, scope } = searchQuery;

    const matchStage: any = {
      $and: [
        this.buildScopeFilter('action_plan', scope),
        query
          ? {
              $or: [
                { title: { $regex: query, $options: 'i' } },
                { description: { $regex: query, $options: 'i' } },
                { ai_recommendations: { $regex: query, $options: 'i' } },
              ],
            }
          : {},
      ].filter(Boolean),
    };

    const additionalFilters = this.buildTypeFilters(
      searchQuery.filters,
      'action_plan'
    );
    if (additionalFilters.length > 0) {
      matchStage.$and.push(...additionalFilters);
    }

    const pipeline = [
      { $match: matchStage },
      {
        $addFields: {
          relevance_score: this.buildRelevanceScore(query, [
            'title',
            'description',
          ]),
        },
      },
      { $sort: { relevance_score: -1, created_at: -1 } },
      { $limit: 100 },
    ];

    const actionPlans = await db
      .collection('actionplans')
      .aggregate(pipeline)
      .toArray();

    return actionPlans.map((plan: any) => ({
      id: plan._id.toString(),
      type: 'action_plan' as SearchableType,
      title: plan.title,
      description: plan.description,
      status: plan.status,
      created_at: plan.created_at,
      updated_at: plan.updated_at,
      relevance_score: plan.relevance_score || 0,
      highlights: this.generateHighlights(query, plan, [
        'title',
        'description',
      ]),
      metadata: {
        company_id: plan.company_id,
        created_by: plan.created_by,
        assigned_to: plan.assigned_to,
        due_date: plan.due_date,
        kpis: plan.kpis,
      },
    }));
  }

  /**
   * Search users with role-based scoping
   */
  private async searchUsers(
    db: any,
    searchQuery: SearchQuery
  ): Promise<SearchResult[]> {
    const { query, scope } = searchQuery;

    // Only super admins and company admins can search users
    if (!['super_admin', 'company_admin'].includes(scope.role)) {
      return [];
    }

    const matchStage: any = {
      $and: [
        this.buildScopeFilter('user', scope),
        query
          ? {
              $or: [
                { name: { $regex: query, $options: 'i' } },
                { email: { $regex: query, $options: 'i' } },
                { role: { $regex: query, $options: 'i' } },
              ],
            }
          : {},
      ].filter(Boolean),
    };

    const additionalFilters = this.buildTypeFilters(
      searchQuery.filters,
      'user'
    );
    if (additionalFilters.length > 0) {
      matchStage.$and.push(...additionalFilters);
    }

    const pipeline = [
      { $match: matchStage },
      {
        $addFields: {
          relevance_score: this.buildRelevanceScore(query, ['name', 'email']),
        },
      },
      { $sort: { relevance_score: -1, created_at: -1 } },
      { $limit: 100 },
    ];

    const users = await db.collection('users').aggregate(pipeline).toArray();

    return users.map((user: any) => ({
      id: user._id.toString(),
      type: 'user' as SearchableType,
      title: user.name,
      description: user.email,
      status: user.role,
      created_at: user.created_at,
      updated_at: user.updated_at,
      relevance_score: user.relevance_score || 0,
      highlights: this.generateHighlights(query, user, ['name', 'email']),
      metadata: {
        role: user.role,
        company_id: user.company_id,
        department_id: user.department_id,
      },
    }));
  }

  /**
   * Search departments with role-based scoping
   */
  private async searchDepartments(
    db: any,
    searchQuery: SearchQuery
  ): Promise<SearchResult[]> {
    const { query, scope } = searchQuery;

    const matchStage: any = {
      $and: [
        this.buildScopeFilter('department', scope),
        query
          ? {
              $or: [
                { name: { $regex: query, $options: 'i' } },
                { description: { $regex: query, $options: 'i' } },
              ],
            }
          : {},
      ].filter(Boolean),
    };

    const additionalFilters = this.buildTypeFilters(
      searchQuery.filters,
      'department'
    );
    if (additionalFilters.length > 0) {
      matchStage.$and.push(...additionalFilters);
    }

    const pipeline = [
      { $match: matchStage },
      {
        $addFields: {
          relevance_score: this.buildRelevanceScore(query, [
            'name',
            'description',
          ]),
        },
      },
      { $sort: { relevance_score: -1, created_at: -1 } },
      { $limit: 100 },
    ];

    const departments = await db
      .collection('departments')
      .aggregate(pipeline)
      .toArray();

    return departments.map((dept: any) => ({
      id: dept._id.toString(),
      type: 'department' as SearchableType,
      title: dept.name,
      description: dept.description,
      created_at: dept.created_at,
      updated_at: dept.updated_at,
      relevance_score: dept.relevance_score || 0,
      highlights: this.generateHighlights(query, dept, ['name', 'description']),
      metadata: {
        company_id: dept.company_id,
        manager_id: dept.manager_id,
      },
    }));
  }

  /**
   * Build scope filter based on user role and permissions
   */
  private buildScopeFilter(type: SearchableType, scope: UserScope): any {
    const baseFilter: any = {};

    switch (scope.role) {
      case 'super_admin':
        // Super admins can access everything
        return {};

      case 'company_admin':
        // Company admins can access their company's data
        if (scope.company_access.length > 0) {
          baseFilter.company_id = { $in: scope.company_access };
        }
        break;

      case 'leader':
      case 'supervisor':
        // Leaders and supervisors can access their department's data
        if (scope.department_access.length > 0) {
          baseFilter.department_id = { $in: scope.department_access };
        }
        break;

      case 'employee':
        // Employees can only access their own data or public data
        if (type === 'user') {
          baseFilter._id = scope.user_id;
        } else {
          baseFilter.$or = [
            { created_by: scope.user_id },
            { visibility: 'public' },
          ];
        }
        break;
    }

    return baseFilter;
  }

  /**
   * Build filters for specific search types
   */
  private buildTypeFilters(
    filters: SearchFilter[],
    type: SearchableType
  ): any[] {
    return filters
      .filter((filter) => filter.type === type)
      .map((filter) => {
        switch (filter.operator) {
          case 'equals':
            return { [filter.field]: filter.value };
          case 'contains':
            return { [filter.field]: { $regex: filter.value, $options: 'i' } };
          case 'starts_with':
            return {
              [filter.field]: { $regex: `^${filter.value}`, $options: 'i' },
            };
          case 'date_range':
            if (
              typeof filter.value === 'object' &&
              'start' in filter.value &&
              'end' in filter.value
            ) {
              return {
                [filter.field]: {
                  $gte: new Date(filter.value.start),
                  $lte: new Date(filter.value.end),
                },
              };
            }
            return {};
          default:
            return {};
        }
      });
  }

  /**
   * Build relevance score calculation
   */
  private buildRelevanceScore(query: string, fields: string[]): any {
    if (!query) return { $literal: 1 };

    const conditions = fields.map((field) => ({
      $cond: {
        if: { $regexMatch: { input: `$${field}`, regex: query, options: 'i' } },
        then: {
          $add: [
            // Exact match bonus
            { $cond: { if: { $eq: [`$${field}`, query] }, then: 10, else: 0 } },
            // Starts with bonus
            {
              $cond: {
                if: {
                  $regexMatch: {
                    input: `$${field}`,
                    regex: `^${query}`,
                    options: 'i',
                  },
                },
                then: 5,
                else: 0,
              },
            },
            // Contains bonus
            1,
          ],
        },
        else: 0,
      },
    }));

    return { $add: conditions };
  }

  /**
   * Generate search highlights
   */
  private generateHighlights(
    query: string,
    document: any,
    fields: string[]
  ): any[] {
    if (!query) return [];

    const highlights: any[] = [];
    const regex = new RegExp(`(${query})`, 'gi');

    fields.forEach((field) => {
      const value = document[field];
      if (value && typeof value === 'string' && regex.test(value)) {
        const highlighted = value.replace(regex, '<mark>$1</mark>');
        highlights.push({
          field,
          value,
          highlighted,
        });
      }
    });

    return highlights;
  }

  /**
   * Generate search facets for filtering
   */
  private generateFacets(results: SearchResult[]): SearchFacet[] {
    const facets: SearchFacet[] = [];

    // Type facet
    const typeCounts = results.reduce(
      (acc, result) => {
        acc[result.type] = (acc[result.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    facets.push({
      field: 'type',
      values: Object.entries(typeCounts).map(([value, count]) => ({
        value,
        count,
      })),
    });

    // Status facet
    const statusCounts = results.reduce(
      (acc, result) => {
        if (result.status) {
          acc[result.status] = (acc[result.status] || 0) + 1;
        }
        return acc;
      },
      {} as Record<string, number>
    );

    if (Object.keys(statusCounts).length > 0) {
      facets.push({
        field: 'status',
        values: Object.entries(statusCounts).map(([value, count]) => ({
          value,
          count,
        })),
      });
    }

    return facets;
  }

  /**
   * Generate search suggestions
   */
  private async generateSuggestions(query: string, db: any): Promise<string[]> {
    if (!query || query.length < 2) return [];

    try {
      // Get common terms from titles and descriptions
      const pipeline = [
        {
          $match: {
            $or: [
              { title: { $regex: query, $options: 'i' } },
              { description: { $regex: query, $options: 'i' } },
            ],
          },
        },
        {
          $group: {
            _id: null,
            titles: { $push: '$title' },
            descriptions: { $push: '$description' },
          },
        },
      ];

      const suggestions: string[] = [];

      // Search across multiple collections
      const collections = ['surveys', 'aiinsights', 'actionplans'];

      for (const collectionName of collections) {
        const results = await db
          .collection(collectionName)
          .aggregate(pipeline)
          .toArray();
        if (results.length > 0) {
          const { titles, descriptions } = results[0];

          // Extract relevant terms
          [...titles, ...descriptions].forEach((text: string) => {
            if (text && typeof text === 'string') {
              const words = text.toLowerCase().split(/\s+/);
              words.forEach((word) => {
                if (
                  word.includes(query.toLowerCase()) &&
                  word.length > 2 &&
                  !suggestions.includes(word)
                ) {
                  suggestions.push(word);
                }
              });
            }
          });
        }
      }

      return suggestions.slice(0, 5); // Return top 5 suggestions
    } catch (error) {
      console.error('Error generating suggestions:', error);
      return [];
    }
  }

  /**
   * Check if user can access specific search type
   */
  private canAccessType(type: SearchableType, scope: UserScope): boolean {
    switch (type) {
      case 'survey':
        return (
          scope.survey_access.length > 0 ||
          ['super_admin', 'company_admin'].includes(scope.role)
        );
      case 'insight':
        return (
          scope.insight_access.length > 0 ||
          ['super_admin', 'company_admin', 'leader'].includes(scope.role)
        );
      case 'action_plan':
        return [
          'super_admin',
          'company_admin',
          'leader',
          'supervisor',
        ].includes(scope.role);
      case 'user':
        return ['super_admin', 'company_admin'].includes(scope.role);
      case 'department':
        return ['super_admin', 'company_admin', 'leader'].includes(scope.role);
      default:
        return false;
    }
  }

  /**
   * Build search pipeline for MongoDB aggregation
   */
  private buildSearchPipeline(searchQuery: SearchQuery): any[] {
    const pipeline: any[] = [];

    // Add text search stage if query is provided
    if (searchQuery.query) {
      pipeline.push({
        $match: {
          $text: { $search: searchQuery.query },
        },
      });
    }

    // Add filter stages
    if (searchQuery.filters.length > 0) {
      const filterStages = searchQuery.filters.map((filter) => ({
        $match: this.buildTypeFilters([filter], filter.type)[0],
      }));
      pipeline.push(...filterStages);
    }

    return pipeline;
  }
}

export const searchService = SearchService.getInstance();


