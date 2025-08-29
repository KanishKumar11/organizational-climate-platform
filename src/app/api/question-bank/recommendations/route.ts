import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import QuestionBank from '@/models/QuestionBank';
import { connectDB } from '@/lib/db';

// GET /api/question-bank/recommendations - Get AI-powered question recommendations
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const industry = searchParams.get('industry');
    const companySize = searchParams.get('company_size');
    const surveyType = searchParams.get('survey_type');
    const department = searchParams.get('department');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Build query based on context
    let query: any = { is_active: true };

    // Apply company scoping
    if (
      session.user.role === 'company_admin' ||
      session.user.role === 'department_admin'
    ) {
      query.$or = [
        { company_id: session.user.companyId },
        { company_id: { $exists: false } },
      ];
    } else if (session.user.role === 'evaluated_user') {
      query.company_id = { $exists: false };
    }

    // Apply context filters
    if (category) query.category = category;
    if (industry) query.industry = industry;
    if (companySize) query.company_size = companySize;

    // Get recommendations based on different strategies
    const recommendations = await getQuestionRecommendations({
      query,
      category,
      surveyType,
      department,
      industry,
      companySize,
      limit,
      userRole: session.user.role,
    });

    return NextResponse.json({
      recommendations,
      context: {
        category,
        industry,
        companySize,
        surveyType,
        department,
      },
    });
  } catch (error) {
    console.error('Error getting question recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to get question recommendations' },
      { status: 500 }
    );
  }
}

// AI-powered recommendation engine
async function getQuestionRecommendations({
  query,
  category,
  surveyType,
  department,
  industry,
  companySize,
  limit,
  userRole,
}: {
  query: any;
  category?: string;
  surveyType?: string;
  department?: string;
  industry?: string;
  companySize?: string;
  limit: number;
  userRole: string;
}) {
  const recommendations = [];

  // Strategy 1: High-performing questions in category
  if (category) {
    const topPerformers = await QuestionBank.find({
      ...query,
      category,
    })
      .sort({ 'metrics.insight_score': -1, 'metrics.usage_count': -1 })
      .limit(Math.ceil(limit * 0.4))
      .lean();

    recommendations.push(
      ...topPerformers.map((q) => ({
        ...q,
        recommendation_reason: 'High effectiveness in category',
        recommendation_score:
          q.metrics.insight_score * 0.7 + (q.metrics.usage_count / 100) * 0.3,
        strategy: 'top_performers',
      }))
    );
  }

  // Strategy 2: Industry-specific recommendations
  if (industry) {
    const industryQuestions = await QuestionBank.find({
      ...query,
      industry,
      _id: { $nin: recommendations.map((r) => r._id) },
    })
      .sort({ 'metrics.insight_score': -1 })
      .limit(Math.ceil(limit * 0.3))
      .lean();

    recommendations.push(
      ...industryQuestions.map((q) => ({
        ...q,
        recommendation_reason: `Optimized for ${industry} industry`,
        recommendation_score: q.metrics.insight_score * 0.8 + 0.2,
        strategy: 'industry_specific',
      }))
    );
  }

  // Strategy 3: Survey type optimization
  if (surveyType) {
    const typeOptimized = await getQuestionsForSurveyType(
      surveyType,
      query,
      limit
    );
    recommendations.push(
      ...typeOptimized.map((q) => ({
        ...q,
        recommendation_reason: `Optimized for ${surveyType} surveys`,
        recommendation_score: q.metrics.insight_score * 0.6 + 0.4,
        strategy: 'survey_type_optimized',
      }))
    );
  }

  // Strategy 4: Trending questions (recently high-performing)
  const recentDate = new Date();
  recentDate.setMonth(recentDate.getMonth() - 3); // Last 3 months

  const trendingQuestions = await QuestionBank.find({
    ...query,
    'metrics.last_used': { $gte: recentDate },
    _id: { $nin: recommendations.map((r) => r._id) },
  })
    .sort({ 'metrics.usage_count': -1, 'metrics.insight_score': -1 })
    .limit(Math.ceil(limit * 0.2))
    .lean();

  recommendations.push(
    ...trendingQuestions.map((q) => ({
      ...q,
      recommendation_reason: 'Trending - high recent usage',
      recommendation_score:
        q.metrics.insight_score * 0.5 + (q.metrics.usage_count / 50) * 0.5,
      strategy: 'trending',
    }))
  );

  // Strategy 5: AI-generated questions for specific contexts
  const aiGenerated = await QuestionBank.find({
    ...query,
    is_ai_generated: true,
    _id: { $nin: recommendations.map((r) => r._id) },
  })
    .sort({ 'metrics.insight_score': -1 })
    .limit(Math.ceil(limit * 0.1))
    .lean();

  recommendations.push(
    ...aiGenerated.map((q) => ({
      ...q,
      recommendation_reason: 'AI-generated for your context',
      recommendation_score: q.metrics.insight_score * 0.6 + 0.3,
      strategy: 'ai_generated',
    }))
  );

  // Sort by recommendation score and limit results
  return recommendations
    .sort((a, b) => b.recommendation_score - a.recommendation_score)
    .slice(0, limit)
    .map((q) => ({
      _id: q._id,
      text: q.text,
      type: q.type,
      category: q.category,
      subcategory: q.subcategory,
      tags: q.tags,
      metrics: q.metrics,
      recommendation_reason: q.recommendation_reason,
      recommendation_score: Math.round(q.recommendation_score * 100) / 100,
      strategy: q.strategy,
    }));
}

// Get questions optimized for specific survey types
async function getQuestionsForSurveyType(
  surveyType: string,
  baseQuery: any,
  limit: number
) {
  const typeMapping: Record<string, string[]> = {
    general_climate: [
      'Leadership & Management',
      'Communication',
      'Work Environment & Culture',
      'Employee Engagement',
    ],
    microclimate: ['Microclimate', 'Employee Engagement', 'Communication'],
    organizational_culture: [
      'Work Environment & Culture',
      'Leadership & Management',
      'Professional Development',
    ],
    pulse: ['Employee Engagement', 'Work-Life Balance', 'Communication'],
    exit: [
      'Employee Engagement',
      'Work Environment & Culture',
      'Leadership & Management',
    ],
    onboarding: [
      'Work Environment & Culture',
      'Communication',
      'Professional Development',
    ],
  };

  const relevantCategories = typeMapping[surveyType] || ['Employee Engagement'];

  return await QuestionBank.find({
    ...baseQuery,
    category: { $in: relevantCategories },
  })
    .sort({ 'metrics.insight_score': -1 })
    .limit(Math.ceil(limit * 0.3))
    .lean();
}
