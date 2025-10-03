import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { QuestionLibraryService } from '@/lib/question-library-service';

/**
 * CLIMA-002: Question Library Categories API
 *
 * GET /api/question-library/categories
 * Returns hierarchical category tree
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const categories = await QuestionLibraryService.getCategories(
      session.user.companyId,
      true // Include global categories
    );

    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}
