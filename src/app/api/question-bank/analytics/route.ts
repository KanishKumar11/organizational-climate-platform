import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import QuestionBank from '@/models/QuestionBank';
import { connectDB } from '@/lib/db';
import { hasPermission } from '@/lib/permissions';

// GET /api/question-bank/analytics - Get question effectiveness analytics
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can view analytics
    if (!hasPermission(session.user.role, 'manage_questions')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || '30'; // days
    const category = searchParams.get('category');

    // Build base query with company scoping
    let baseQuery: any = { is_active: true };

    if (session.user.role === 'company_admin') {
      baseQuery.$or = [
        { company_id: session.user.companyId },
        { company_id: { $exists: false } },
      ];
    }

    if (category) {
      baseQuery.category = category;
    }

    // Calculate date range
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(timeframe));

    // Get overall analytics
    const analytics = await getQuestionAnalytics(baseQuery, startDate);

    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Error getting question analytics:', error);
    return NextResponse.json(
      { error: 'Failed to get question analytics' },
      { status: 500 }
    );
  }
}

async function getQuestionAnalytics(baseQuery: any, startDate: Date) {
  // Overall statistics
  const totalQuestions = await QuestionBank.countDocuments(baseQuery);
  const activeQuestions = await QuestionBank.countDocuments({
    ...baseQuery,
    'metrics.usage_count': { $gt: 0 },
  });

  // Effectiveness distribution
  const effectivenessDistribution = await QuestionBank.aggregate([
    { $match: baseQuery },
    {
      $bucket: {
        groupBy: '$metrics.insight_score',
        boundaries: [0, 2, 4, 6, 8, 10],
        default: 'other',
        output: {
          count: { $sum: 1 },
          avgUsage: { $avg: '$metrics.usage_count' },
        },
      },
    },
  ]);

  // Category performance
  const categoryPerformance = await QuestionBank.aggregate([
    { $match: baseQuery },
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
        avgEffectiveness: { $avg: '$metrics.insight_score' },
        totalUsage: { $sum: '$metrics.usage_count' },
        avgResponseRate: { $avg: '$metrics.response_rate' },
      },
    },
    { $sort: { avgEffectiveness: -1 } },
  ]);

  // Question type analysis
  const typeAnalysis = await QuestionBank.aggregate([
    { $match: baseQuery },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        avgEffectiveness: { $avg: '$metrics.insight_score' },
        avgResponseRate: { $avg: '$metrics.response_rate' },
      },
    },
    { $sort: { avgEffectiveness: -1 } },
  ]);

  // Top performing questions
  const topQuestions = await QuestionBank.find(baseQuery)
    .sort({ 'metrics.insight_score': -1, 'metrics.usage_count': -1 })
    .limit(10)
    .select('text category metrics type tags')
    .lean();

  // Underperforming questions (candidates for improvement)
  const underperformingQuestions = await QuestionBank.find({
    ...baseQuery,
    'metrics.usage_count': { $gt: 5 }, // Only questions that have been used
    'metrics.insight_score': { $lt: 4 },
  })
    .sort({ 'metrics.insight_score': 1 })
    .limit(10)
    .select('text category metrics type tags')
    .lean();

  // Usage trends (recent activity)
  const recentlyUsed = await QuestionBank.find({
    ...baseQuery,
    'metrics.last_used': { $gte: startDate },
  })
    .sort({ 'metrics.last_used': -1 })
    .limit(20)
    .select('text category metrics.last_used metrics.usage_count')
    .lean();

  // AI-generated vs human-created comparison
  const aiVsHumanComparison = await QuestionBank.aggregate([
    { $match: baseQuery },
    {
      $group: {
        _id: '$is_ai_generated',
        count: { $sum: 1 },
        avgEffectiveness: { $avg: '$metrics.insight_score' },
        avgUsage: { $avg: '$metrics.usage_count' },
        avgResponseRate: { $avg: '$metrics.response_rate' },
      },
    },
  ]);

  // Question optimization suggestions
  const optimizationSuggestions =
    await generateOptimizationSuggestions(baseQuery);

  return {
    overview: {
      totalQuestions,
      activeQuestions,
      utilizationRate:
        totalQuestions > 0
          ? ((activeQuestions / totalQuestions) * 100).toFixed(1)
          : 0,
    },
    effectiveness: {
      distribution: effectivenessDistribution,
      categoryPerformance,
      typeAnalysis,
    },
    performance: {
      topQuestions,
      underperformingQuestions,
      recentActivity: recentlyUsed,
    },
    insights: {
      aiVsHuman: aiVsHumanComparison,
      optimizationSuggestions,
    },
  };
}

async function generateOptimizationSuggestions(baseQuery: any) {
  const suggestions = [];

  // Find categories with low effectiveness
  const lowPerformingCategories = await QuestionBank.aggregate([
    { $match: baseQuery },
    {
      $group: {
        _id: '$category',
        avgEffectiveness: { $avg: '$metrics.insight_score' },
        count: { $sum: 1 },
      },
    },
    {
      $match: {
        avgEffectiveness: { $lt: 5 },
        count: { $gte: 3 },
      },
    },
  ]);

  for (const category of lowPerformingCategories) {
    suggestions.push({
      type: 'category_improvement',
      category: category._id,
      message: `Consider reviewing questions in ${category._id} category (avg effectiveness: ${category.avgEffectiveness.toFixed(1)})`,
      priority: 'medium',
      actionable: true,
    });
  }

  // Find unused questions
  const unusedCount = await QuestionBank.countDocuments({
    ...baseQuery,
    'metrics.usage_count': 0,
  });

  if (unusedCount > 0) {
    suggestions.push({
      type: 'unused_questions',
      message: `${unusedCount} questions have never been used. Consider reviewing their relevance or promoting them.`,
      priority: 'low',
      actionable: true,
    });
  }

  // Find questions with low response rates
  const lowResponseRate = await QuestionBank.countDocuments({
    ...baseQuery,
    'metrics.usage_count': { $gt: 3 },
    'metrics.response_rate': { $lt: 70 },
  });

  if (lowResponseRate > 0) {
    suggestions.push({
      type: 'response_rate',
      message: `${lowResponseRate} questions have low response rates (<70%). Consider simplifying or rewording them.`,
      priority: 'high',
      actionable: true,
    });
  }

  // Suggest AI-generated alternatives for underperforming questions
  const underperformingCount = await QuestionBank.countDocuments({
    ...baseQuery,
    'metrics.usage_count': { $gt: 5 },
    'metrics.insight_score': { $lt: 4 },
    is_ai_generated: false,
  });

  if (underperformingCount > 0) {
    suggestions.push({
      type: 'ai_alternatives',
      message: `${underperformingCount} human-created questions are underperforming. Consider generating AI alternatives.`,
      priority: 'medium',
      actionable: true,
    });
  }

  return suggestions;
}
