import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import QuestionLibrary from '@/models/QuestionLibrary';
import QuestionCategory from '@/models/QuestionCategory';

/**
 * GET Question Library
 *
 * Query Parameters:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20)
 * - category: Filter by category ID
 * - type: Filter by question type
 * - search: Search in question text (ES/EN)
 * - language: Filter by language (es/en)
 * - isActive: Filter by active status
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const category = searchParams.get('category');
    const type = searchParams.get('type');
    const search = searchParams.get('search');
    const language = searchParams.get('language');
    const isActive = searchParams.get('isActive');

    await connectDB();

    // Build query
    const query: any = {};

    if (category) {
      query.category_id = category;
    }

    if (type) {
      query.question_type = type;
    }

    if (isActive !== null && isActive !== undefined) {
      query.is_active = isActive === 'true';
    }

    if (search) {
      // Search in both languages
      query.$or = [
        { question_text_es: { $regex: search, $options: 'i' } },
        { question_text_en: { $regex: search, $options: 'i' } },
      ];
    }

    // Count total
    const total = await (QuestionLibrary as any).countDocuments(query);

    // Fetch questions with pagination
    const questions = await (QuestionLibrary as any)
      .find(query)
      .sort({ usage_count: -1, created_at: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // Enrich with category names
    const categoryIds = [...new Set(questions.map((q: any) => q.category_id))];
    const categories = await (QuestionCategory as any)
      .find({ _id: { $in: categoryIds } })
      .lean();

    const categoryMap = new Map(
      categories.map((cat: any) => [cat._id.toString(), cat])
    );

    const enrichedQuestions = questions.map((q: any) => {
      const category = categoryMap.get(q.category_id.toString()) as any;
      return {
        ...q,
        _id: q._id.toString(),
        category_id: q.category_id.toString(),
        category_name: category
          ? language === 'en'
            ? category.name_en
            : category.name_es
          : undefined,
      };
    });

    return NextResponse.json({
      questions: enrichedQuestions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Get questions error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST Create Question
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    // Validation
    if (!body.question_text_es || !body.question_text_en) {
      return NextResponse.json(
        { error: 'Question text in both languages is required' },
        { status: 400 }
      );
    }

    if (!body.question_type) {
      return NextResponse.json(
        { error: 'Question type is required' },
        { status: 400 }
      );
    }

    if (!body.category_id) {
      return NextResponse.json(
        { error: 'Category is required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Verify category exists
    const category = await (QuestionCategory as any).findById(body.category_id);
    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    // Create question
    const question = await (QuestionLibrary as any).create({
      question_text_es: body.question_text_es,
      question_text_en: body.question_text_en,
      question_type: body.question_type,
      category_id: body.category_id,
      options_es: body.options_es || [],
      options_en: body.options_en || [],
      is_required: body.is_required || false,
      is_active: body.is_active !== undefined ? body.is_active : true,
      created_by: session.user.id,
    });

    // Increment category question count
    await (QuestionCategory as any).findByIdAndUpdate(body.category_id, {
      $inc: { question_count: 1 },
    });

    return NextResponse.json({
      success: true,
      question: {
        _id: question._id.toString(),
        ...question.toObject(),
      },
    });
  } catch (error) {
    console.error('Create question error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
