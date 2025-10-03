import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import QuestionLibrary from '@/models/QuestionLibrary';
import QuestionCategory from '@/models/QuestionCategory';

/**
 * POST Bulk Add Questions from Category
 *
 * Adds all questions from a specific category
 *
 * Body:
 * - categoryId: Category ID to add all questions from
 * - filters: Optional filters (type, isRequired, etc.)
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    if (!body.categoryId) {
      return NextResponse.json(
        { error: 'Category ID is required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Verify category exists
    const category = await (QuestionCategory as any).findById(body.categoryId);
    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    // Build query
    const query: any = {
      category_id: body.categoryId,
      is_active: true,
    };

    // Apply filters if provided
    if (body.filters) {
      if (body.filters.type) {
        query.question_type = body.filters.type;
      }
      if (body.filters.isRequired !== undefined) {
        query.is_required = body.filters.isRequired;
      }
    }

    // Fetch all questions from category
    const questions = await (QuestionLibrary as any)
      .find(query)
      .sort({ order: 1, created_at: 1 })
      .lean();

    // Increment usage count for bulk-added questions
    const questionIds = questions.map((q: any) => q._id);
    await (QuestionLibrary as any).updateMany(
      { _id: { $in: questionIds } },
      { $inc: { usage_count: 1 } }
    );

    const formattedQuestions = questions.map((q: any) => ({
      ...q,
      _id: q._id.toString(),
      category_id: q.category_id.toString(),
    }));

    return NextResponse.json({
      success: true,
      questions: formattedQuestions,
      count: formattedQuestions.length,
      category: {
        _id: category._id.toString(),
        name_es: category.name_es,
        name_en: category.name_en,
      },
    });
  } catch (error) {
    console.error('Bulk add questions error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
