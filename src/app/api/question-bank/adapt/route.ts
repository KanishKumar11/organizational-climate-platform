import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  QuestionAdaptationEngine,
  AdaptationContext,
} from '@/lib/question-adaptation-engine';
import { hasStringPermission } from '@/lib/permissions';

// POST /api/question-bank/adapt - Adapt questions for specific context
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      categories,
      questionsPerCategory = 3,
      context,
      surveyId,
      saveAdaptations = false,
    } = body;

    if (!categories || !Array.isArray(categories) || categories.length === 0) {
      return NextResponse.json(
        { error: 'Categories array is required' },
        { status: 400 }
      );
    }

    // Build adaptation context
    const adaptationContext: AdaptationContext = {
      department: context?.department,
      role: context?.role,
      industry: context?.industry,
      companySize: context?.companySize,
      demographics: context?.demographics,
      previousResponses: context?.previousResponses,
      surveyType: context?.surveyType || 'general_climate',
    };

    const companyId =
      session.user.role === 'company_admin'
        ? session.user.companyId
        : undefined;

    // Adapt questions using the AI engine
    const adaptedQuestions =
      await QuestionAdaptationEngine.adaptQuestionsForContext(
        categories,
        questionsPerCategory,
        adaptationContext,
        companyId
      );

    let savedQuestionIds: string[] = [];

    // Save adaptations if requested and user has permission
    if (
      saveAdaptations &&
      hasStringPermission(session.user.role, 'manage_questions')
    ) {
      savedQuestionIds = await QuestionAdaptationEngine.saveAdaptedQuestions(
        adaptedQuestions,
        surveyId || 'manual_adaptation',
        session.user.id,
        companyId
      );
    }

    return NextResponse.json({
      success: true,
      adapted_questions: adaptedQuestions,
      adaptation_summary: {
        total_questions: adaptedQuestions.length,
        by_type: this.summarizeByType(adaptedQuestions),
        by_category: this.summarizeByCategory(adaptedQuestions),
        average_confidence: this.calculateAverageConfidence(adaptedQuestions),
      },
      saved_question_ids: savedQuestionIds,
      context_used: adaptationContext,
    });
  } catch (error) {
    console.error('Error adapting questions:', error);
    return NextResponse.json(
      { error: 'Failed to adapt questions' },
      { status: 500 }
    );
  }
}

// GET /api/question-bank/adapt - Get adaptation history and analytics
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can view adaptation analytics
    if (!hasStringPermission(session.user.role, 'manage_questions')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || '30'; // days
    const category = searchParams.get('category');

    const companyId =
      session.user.role === 'company_admin'
        ? session.user.companyId
        : undefined;

    const analytics = await this.getAdaptationAnalytics(
      parseInt(timeframe),
      category,
      companyId
    );

    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Error getting adaptation analytics:', error);
    return NextResponse.json(
      { error: 'Failed to get adaptation analytics' },
      { status: 500 }
    );
  }
}

// Helper methods
function summarizeByType(questions: any[]) {
  const summary: Record<string, number> = {};
  questions.forEach((q) => {
    summary[q.adaptationType] = (summary[q.adaptationType] || 0) + 1;
  });
  return summary;
}

function summarizeByCategory(questions: any[]) {
  const summary: Record<string, number> = {};
  questions.forEach((q) => {
    summary[q.category] = (summary[q.category] || 0) + 1;
  });
  return summary;
}

function calculateAverageConfidence(questions: any[]) {
  if (questions.length === 0) return 0;
  const total = questions.reduce((sum, q) => sum + q.confidence, 0);
  return total / questions.length;
}

async function getAdaptationAnalytics(
  timeframeDays: number,
  category?: string,
  companyId?: string
) {
  const QuestionBank = (await import('@/models/QuestionBank')).default;

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - timeframeDays);

  const baseQuery: any = {
    is_ai_generated: true,
    adaptation_metadata: { $exists: true },
    created_at: { $gte: startDate },
  };

  if (companyId) {
    baseQuery.$or = [
      { company_id: companyId },
      { company_id: { $exists: false } },
    ];
  }

  if (category) {
    baseQuery.category = category;
  }

  // Get adaptation statistics
  const adaptationStats = await QuestionBank.aggregate([
    { $match: baseQuery },
    {
      $group: {
        _id: '$adaptation_metadata.adaptation_type',
        count: { $sum: 1 },
        avgConfidence: { $avg: '$adaptation_metadata.confidence' },
        avgEffectiveness: { $avg: '$metrics.insight_score' },
        avgUsage: { $avg: '$metrics.usage_count' },
      },
    },
  ]);

  // Get category breakdown
  const categoryBreakdown = await QuestionBank.aggregate([
    { $match: baseQuery },
    {
      $group: {
        _id: '$category',
        total: { $sum: 1 },
        avgConfidence: { $avg: '$adaptation_metadata.confidence' },
        avgEffectiveness: { $avg: '$metrics.insight_score' },
      },
    },
    { $sort: { total: -1 } },
  ]);

  // Get recent adaptations
  const recentAdaptations = await QuestionBank.find(baseQuery)
    .sort({ created_at: -1 })
    .limit(20)
    .select('text category adaptation_metadata created_at metrics')
    .lean();

  // Get effectiveness comparison
  const effectivenessComparison = await QuestionBank.aggregate([
    {
      $match: {
        ...baseQuery,
        'metrics.usage_count': { $gt: 0 },
      },
    },
    {
      $group: {
        _id: '$adaptation_metadata.adaptation_type',
        avgEffectiveness: { $avg: '$metrics.insight_score' },
        avgResponseRate: { $avg: '$metrics.response_rate' },
        count: { $sum: 1 },
      },
    },
  ]);

  return {
    timeframe: `${timeframeDays} days`,
    adaptation_stats: adaptationStats,
    category_breakdown: categoryBreakdown,
    recent_adaptations: recentAdaptations,
    effectiveness_comparison: effectivenessComparison,
    summary: {
      total_adaptations: await QuestionBank.countDocuments(baseQuery),
      most_common_type:
        adaptationStats.length > 0
          ? adaptationStats.reduce((max, stat) =>
              stat.count > max.count ? stat : max
            )._id
          : null,
    },
  };
}
