import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { QuestionLibraryService } from '@/lib/question-library-service';

/**
 * CLIMA-002: Question Library Search API
 *
 * GET /api/question-library/search
 *
 * Query parameters:
 * - category_id: Filter by category
 * - tags: Filter by tags (comma-separated)
 * - type: Filter by question type
 * - search: Search query
 * - page: Page number (default: 1)
 * - limit: Results per page (default: 20)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    const filters = {
      category_id: searchParams.get('category_id') || undefined,
      tags: searchParams.get('tags')?.split(',').filter(Boolean),
      type: searchParams.get('type') || undefined,
      difficulty_level: searchParams.get('difficulty') || undefined,
      search_query: searchParams.get('search') || undefined,
      company_id: session.user.companyId,
      include_global: true, // Always include global questions
      is_approved_only: searchParams.get('approved_only') === 'true',
    };

    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const result = await QuestionLibraryService.searchQuestions(
      filters,
      page,
      limit
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error searching question library:', error);
    return NextResponse.json(
      { error: 'Failed to search questions' },
      { status: 500 }
    );
  }
}
