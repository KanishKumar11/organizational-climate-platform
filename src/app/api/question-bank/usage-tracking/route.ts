import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import QuestionBank from '@/models/QuestionBank';
import { connectDB } from '@/lib/db';
import { hasStringPermission } from '@/lib/permissions';

// GET /api/question-bank/usage-tracking - Get question usage analytics
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can view usage tracking
    if (!hasStringPermission(session.user.role, 'manage_questions')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || '30'; // days
    const category = searchParams.get('category');
    const type = searchParams.get('type');

    // Build base query with company scoping
    let baseQuery: any = { is_active: true };

    if (session.user.role === 'company_admin') {
      baseQuery.$or = [
        { company_id: session.user.companyId },
        { company_id: { $exists: false } },
      ];
    }

    if (category) baseQuery.category = category;
    if (type) baseQuery.type = type;

    // Calculate date range
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(timeframe));

    const usageAnalytics = await getUsageAnalytics(baseQuery, startDate);

    return NextResponse.json({
      success: true,
      analytics: usageAnalytics,
      timeframe: `${timeframe} days`,
    });
  } catch (error) {
    console.error('Error getting usage tracking:', error);
    return NextResponse.json(
      { error: 'Failed to get usage tracking' },
      { status: 500 }
    );
  }
}

// POST /api/question-bank/usage-tracking - Track question usage
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const { question_id, survey_id, usage_context, response_count } = body;

    if (!question_id) {
      return NextResponse.json(
        { error: 'Question ID is required' },
        { status: 400 }
      );
    }

    // Update usage metrics
    const updateData: any = {
      $inc: { 'metrics.usage_count': 1 },
      $set: { 'metrics.last_used': new Date() },
      $push: {
        usage_history: {
          survey_id,
          used_at: new Date(),
          context: usage_context,
          response_count: response_count || 0,
        },
      },
    };

    const question = await QuestionBank.findByIdAndUpdate(
      question_id,
      updateData,
      { new: true }
    );

    if (!question) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Usage tracked successfully',
      current_usage_count: question.metrics.usage_count,
    });
  } catch (error) {
    console.error('Error tracking question usage:', error);
    return NextResponse.json(
      { error: 'Failed to track question usage' },
      { status: 500 }
    );
  }
}

async function getUsageAnalytics(baseQuery: any, startDate: Date) {
  // Most used questions
  const mostUsed = await QuestionBank.find(baseQuery)
    .sort({ 'metrics.usage_count': -1 })
    .limit(20)
    .select('text category metrics type')
    .lean();

  // Least used questions
  const leastUsed = await QuestionBank.find({
    ...baseQuery,
    'metrics.usage_count': { $gte: 1 },
  })
    .sort({ 'metrics.usage_count': 1 })
    .limit(20)
    .select('text category metrics type')
    .lean();

  // Never used questions
  const neverUsed = await QuestionBank.find({
    ...baseQuery,
    'metrics.usage_count': 0,
  })
    .select('text category type created_at')
    .lean();

  // Usage by category
  const usageByCategory = await QuestionBank.aggregate([
    { $match: baseQuery },
    {
      $group: {
        _id: '$category',
        totalUsage: { $sum: '$metrics.usage_count' },
        avgUsage: { $avg: '$metrics.usage_count' },
        questionCount: { $sum: 1 },
      },
    },
    { $sort: { totalUsage: -1 } },
  ]);

  // Usage by type
  const usageByType = await QuestionBank.aggregate([
    { $match: baseQuery },
    {
      $group: {
        _id: '$type',
        totalUsage: { $sum: '$metrics.usage_count' },
        avgUsage: { $avg: '$metrics.usage_count' },
        questionCount: { $sum: 1 },
      },
    },
    { $sort: { totalUsage: -1 } },
  ]);

  // Recent usage trends
  const recentUsage = await QuestionBank.find({
    ...baseQuery,
    'metrics.last_used': { $gte: startDate },
  })
    .sort({ 'metrics.last_used': -1 })
    .select('text category metrics.last_used metrics.usage_count')
    .lean();

  // Usage distribution
  const usageDistribution = await QuestionBank.aggregate([
    { $match: baseQuery },
    {
      $bucket: {
        groupBy: '$metrics.usage_count',
        boundaries: [0, 1, 5, 10, 25, 50, 100],
        default: '100+',
        output: {
          count: { $sum: 1 },
          questions: {
            $push: { text: '$text', usage: '$metrics.usage_count' },
          },
        },
      },
    },
  ]);

  // AI vs Human created usage comparison
  const aiVsHumanUsage = await QuestionBank.aggregate([
    { $match: baseQuery },
    {
      $group: {
        _id: '$is_ai_generated',
        totalUsage: { $sum: '$metrics.usage_count' },
        avgUsage: { $avg: '$metrics.usage_count' },
        questionCount: { $sum: 1 },
      },
    },
  ]);

  return {
    most_used: mostUsed,
    least_used: leastUsed,
    never_used: neverUsed.slice(0, 20), // Limit to 20 for performance
    usage_by_category: usageByCategory,
    usage_by_type: usageByType,
    recent_usage: recentUsage,
    usage_distribution: usageDistribution,
    ai_vs_human: aiVsHumanUsage,
    summary: {
      total_questions: await QuestionBank.countDocuments(baseQuery),
      used_questions: await QuestionBank.countDocuments({
        ...baseQuery,
        'metrics.usage_count': { $gt: 0 },
      }),
      never_used_count: neverUsed.length,
      total_usage: await QuestionBank.aggregate([
        { $match: baseQuery },
        { $group: { _id: null, total: { $sum: '$metrics.usage_count' } } },
      ]).then((result) => result[0]?.total || 0),
    },
  };
}
