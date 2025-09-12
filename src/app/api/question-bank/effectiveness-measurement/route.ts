import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { QuestionnaireEffectivenessService } from '@/lib/questionnaire-effectiveness-service';
import { hasStringPermission } from '@/lib/permissions';

// GET /api/question-bank/effectiveness-measurement - Get effectiveness metrics for questions
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can view effectiveness measurements
    if (!hasStringPermission(session.user.role, 'manage_questions')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const questionId = searchParams.get('question_id');
    const timeframe = parseInt(searchParams.get('timeframe') || '90');
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (questionId) {
      // Get effectiveness for a specific question
      const effectiveness =
        await QuestionnaireEffectivenessService.calculateQuestionEffectiveness(
          questionId,
          timeframe
        );

      return NextResponse.json({
        success: true,
        effectiveness,
      });
    } else {
      // Get effectiveness for multiple questions
      const effectiveness = await getBulkEffectiveness(
        category,
        timeframe,
        limit,
        session.user.companyId
      );

      return NextResponse.json({
        success: true,
        effectiveness,
        timeframe: `${timeframe} days`,
      });
    }
  } catch (error) {
    console.error('Error getting effectiveness measurement:', error);
    return NextResponse.json(
      { error: 'Failed to get effectiveness measurement' },
      { status: 500 }
    );
  }
}

// POST /api/question-bank/effectiveness-measurement - Update effectiveness metrics
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can update effectiveness measurements
    if (!hasStringPermission(session.user.role, 'manage_questions')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action, ...params } = body;

    let result;

    switch (action) {
      case 'assess_response_quality':
        result = await QuestionnaireEffectivenessService.assessResponseQuality(
          params.responseId,
          params.questionId,
          params.responseValue,
          params.responseText
        );
        break;

      case 'generate_improvements':
        result =
          await QuestionnaireEffectivenessService.generateImprovementSuggestions(
            params.questionId
          );
        break;

      case 'setup_ab_test':
        result = await QuestionnaireEffectivenessService.setupABTest(
          params.questionAId,
          params.questionBId,
          params.testName,
          params.targetSampleSize
        );
        break;

      case 'analyze_ab_test':
        result = await QuestionnaireEffectivenessService.analyzeABTest(
          params.testId
        );
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error('Error processing effectiveness measurement:', error);
    return NextResponse.json(
      { error: 'Failed to process effectiveness measurement' },
      { status: 500 }
    );
  }
}

async function getBulkEffectiveness(
  category?: string,
  timeframe: number = 90,
  limit: number = 20,
  companyId?: string
) {
  const QuestionBank = (await import('@/models/QuestionBank')).default;

  const baseQuery: any = { is_active: true };

  if (companyId) {
    baseQuery.$or = [
      { company_id: companyId },
      { company_id: { $exists: false } },
    ];
  }

  if (category) {
    baseQuery.category = category;
  }

  // Get questions with sufficient usage for meaningful metrics
  const questions = await QuestionBank.find({
    ...baseQuery,
    'metrics.usage_count': { $gte: 5 },
  })
    .sort({ 'metrics.usage_count': -1 })
    .limit(limit)
    .lean();

  const effectiveness = await Promise.all(
    questions.map(async (question) => {
      try {
        return await QuestionnaireEffectivenessService.calculateQuestionEffectiveness(
          question._id.toString(),
          timeframe
        );
      } catch (error) {
        console.error(
          `Error calculating effectiveness for question ${question._id}:`,
          error
        );
        return null;
      }
    })
  );

  return effectiveness.filter(Boolean);
}
