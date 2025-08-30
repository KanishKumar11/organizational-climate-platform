/**
 * Global search API endpoint with role-based scoping
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { searchService } from '@/lib/search-service';
import { SearchQuery, UserScope } from '@/types/search';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build user scope based on session
    const userScope: UserScope = {
      user_id: session.user.id,
      role: session.user.role,
      company_access: session.user.companyId ? [session.user.companyId] : [],
      department_access: session.user.departmentId
        ? [session.user.departmentId]
        : [],
      survey_access: [], // This would be populated based on user permissions
      insight_access: [], // This would be populated based on user permissions
    };

    // Build search filters
    const filters = [];

    if (type) {
      filters.push({
        type: type as any,
        field: 'type',
        value: type,
        operator: 'equals' as const,
      });
    }

    if (status) {
      filters.push({
        type: 'survey' as any, // Default to survey, but this could be dynamic
        field: 'status',
        value: status,
        operator: 'equals' as const,
      });
    }

    if (dateFrom && dateTo) {
      filters.push({
        type: 'survey' as any, // Default to survey, but this could be dynamic
        field: 'created_at',
        value: { start: dateFrom, end: dateTo },
        operator: 'date_range' as const,
      });
    }

    const searchQuery: SearchQuery = {
      query,
      filters,
      scope: userScope,
      limit,
      offset,
    };

    const results = await searchService.search(searchQuery);

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Search operation failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { query, filters = [], limit = 50, offset = 0 } = body;

    // Build user scope based on session
    const userScope: UserScope = {
      user_id: session.user.id,
      role: session.user.role,
      company_access: session.user.companyId ? [session.user.companyId] : [],
      department_access: session.user.departmentId
        ? [session.user.departmentId]
        : [],
      survey_access: [], // This would be populated based on user permissions
      insight_access: [], // This would be populated based on user permissions
    };

    const searchQuery: SearchQuery = {
      query,
      filters,
      scope: userScope,
      limit,
      offset,
    };

    const results = await searchService.search(searchQuery);

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Search operation failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}


