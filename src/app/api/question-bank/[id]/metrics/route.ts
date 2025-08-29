import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import QuestionBank from '@/models/QuestionBank';
import { connectDB } from '@/lib/db';
import { hasPermission } from '@/lib/permissions';

// GET /api/question-bank/[id]/metrics - Get question effectiveness metrics
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const question = await QuestionBank.findById(params.id);
    if (!question) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    // Check access permissions
    if (
      question.company_id &&
      session.user.role !== 'super_admin' &&
      question.company_id !== session.user.companyId
    ) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const metrics = {
      id: question._id,
      text: question.text,
      category: question.category,
      subcategory: question.subcategory,
      metrics: question.metrics,
      version: question.version,
      created_at: question.created_at,
      updated_at: question.updated_at,
    };

    return NextResponse.json(metrics);
  } catch (error) {
    console.error('Error fetching question metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch question metrics' },
      { status: 500 }
    );
  }
}

// PUT /api/question-bank/[id]/metrics - Update question effectiveness metrics
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only AI service or admins can update metrics
    if (
      !hasPermission(session.user.role, 'manage_questions') &&
      session.user.role !== 'ai_service'
    ) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    await connectDB();

    const question = await QuestionBank.findById(params.id);
    if (!question) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { response_rate, insight_score, increment_usage } = body;

    if (increment_usage) {
      await question.incrementUsage();
    }

    if (response_rate !== undefined || insight_score !== undefined) {
      const newResponseRate =
        response_rate !== undefined
          ? response_rate
          : question.metrics.response_rate;
      const newInsightScore =
        insight_score !== undefined
          ? insight_score
          : question.metrics.insight_score;

      await question.updateMetrics(newResponseRate, newInsightScore);
    }

    return NextResponse.json({
      message: 'Metrics updated successfully',
      metrics: question.metrics,
    });
  } catch (error) {
    console.error('Error updating question metrics:', error);
    return NextResponse.json(
      { error: 'Failed to update question metrics' },
      { status: 500 }
    );
  }
}

// POST /api/question-bank/[id]/metrics/usage - Increment usage count
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const question = await QuestionBank.findById(params.id);
    if (!question) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    // Check access permissions
    if (
      question.company_id &&
      session.user.role !== 'super_admin' &&
      question.company_id !== session.user.companyId
    ) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    await question.incrementUsage();

    return NextResponse.json({
      message: 'Usage count incremented',
      usage_count: question.metrics.usage_count,
      last_used: question.metrics.last_used,
    });
  } catch (error) {
    console.error('Error incrementing usage:', error);
    return NextResponse.json(
      { error: 'Failed to increment usage' },
      { status: 500 }
    );
  }
}
