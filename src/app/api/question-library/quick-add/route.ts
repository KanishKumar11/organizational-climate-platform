import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import QuestionLibrary from '@/models/QuestionLibrary';

/**
 * GET Quick-Add Questions
 * 
 * Returns most frequently used questions for quick selection
 * 
 * Query Parameters:
 * - limit: Number of questions to return (default: 10)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    await connectDB();

    // Fetch most used active questions
    const questions = await (QuestionLibrary as any)
      .find({ is_active: true })
      .sort({ usage_count: -1, created_at: -1 })
      .limit(limit)
      .lean();

    const formattedQuestions = questions.map((q: any) => ({
      ...q,
      _id: q._id.toString(),
      category_id: q.category_id.toString(),
    }));

    return NextResponse.json({
      questions: formattedQuestions,
    });

  } catch (error) {
    console.error('Get quick-add questions error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
