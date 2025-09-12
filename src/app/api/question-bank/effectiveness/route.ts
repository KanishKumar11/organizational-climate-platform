import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import QuestionBank from '@/models/QuestionBank';
import { connectDB } from '@/lib/db';
import { hasStringPermission } from '@/lib/permissions';

// GET /api/question-bank/effectiveness - Get question effectiveness metrics
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can view effectiveness metrics
    if (!hasStringPermission(session.user.role, 'manage_questions')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const timeframe = searchParams.get('timeframe') || '30'; // days
    const threshold = parseFloat(searchParams.get('threshold') || '5.0');

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

    // Get effectiveness metrics
    const effectivenessMetrics = await getEffectivenessMetrics(
      baseQuery,
      startDate,
      threshold
    );

    return NextResponse.json({
      success: true,
      metrics: effectivenessMetrics,
      timeframe: `${timeframe} days`,
      threshold,
    });
  } catch (error) {
    console.error('Error getting question effectiveness:', error);
    return NextResponse.json(
      { error: 'Failed to get question effectiveness' },
      { status: 500 }
    );
  }
}

// POST /api/question-bank/effectiveness - Update question effectiveness scores
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can update effectiveness scores
    if (!hasStringPermission(session.user.role, 'manage_questions')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    await connectDB();

    const body = await request.json();
    const { question_id, effectiveness_score, usage_data, response_quality } =
      body;

    if (!question_id || effectiveness_score === undefined) {
      return NextResponse.json(
        { error: 'Question ID and effectiveness score are required' },
        { status: 400 }
      );
    }

    // Update question effectiveness
    const updateData: any = {
      'metrics.insight_score': effectiveness_score,
      'metrics.last_updated': new Date(),
    };

    if (usage_data) {
      updateData['metrics.usage_count'] = usage_data.usage_count;
      updateData['metrics.response_rate'] = usage_data.response_rate;
      updateData['metrics.last_used'] = new Date(usage_data.last_used);
    }

    if (response_quality) {
      updateData['metrics.response_quality'] = response_quality;
    }

    const question = await QuestionBank.findByIdAndUpdate(
      question_id,
      { $set: updateData },
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
      question: {
        id: question._id,
        text: question.text,
        metrics: question.metrics,
      },
    });
  } catch (error) {
    console.error('Error updating question effectiveness:', error);
    return NextResponse.json(
      { error: 'Failed to update question effectiveness' },
      { status: 500 }
    );
  }
}

async function getEffectivenessMetrics(
  baseQuery: any,
  startDate: Date,
  threshold: number
) {
  // High-performing questions
  const highPerforming = await QuestionBank.find({
    ...baseQuery,
    'metrics.insight_score': { $gte: threshold },
  })
    .sort({ 'metrics.insight_score': -1 })
    .limit(20)
    .select('text category metrics type')
    .lean();

  // Low-performing questions
  const lowPerforming = await QuestionBank.find({
    ...baseQuery,
    'metrics.usage_count': { $gt: 3 },
    'metrics.insight_score': { $lt: threshold },
  })
    .sort({ 'metrics.insight_score': 1 })
    .limit(20)
    .select('text category metrics type')
    .lean();

  // Category effectiveness
  const categoryEffectiveness = await QuestionBank.aggregate([
    { $match: baseQuery },
    {
      $group: {
        _id: '$category',
        avgEffectiveness: { $avg: '$metrics.insight_score' },
        count: { $sum: 1 },
        totalUsage: { $sum: '$metrics.usage_count' },
      },
    },
    { $sort: { avgEffectiveness: -1 } },
  ]);

  // Recent effectiveness trends
  const recentTrends = await QuestionBank.find({
    ...baseQuery,
    'metrics.last_used': { $gte: startDate },
  })
    .sort({ 'metrics.last_used': -1 })
    .select('text category metrics.last_used metrics.insight_score')
    .lean();

  // Effectiveness distribution
  const distribution = await QuestionBank.aggregate([
    { $match: baseQuery },
    {
      $bucket: {
        groupBy: '$metrics.insight_score',
        boundaries: [0, 2, 4, 6, 8, 10],
        default: 'other',
        output: {
          count: { $sum: 1 },
          questions: {
            $push: { text: '$text', score: '$metrics.insight_score' },
          },
        },
      },
    },
  ]);

  return {
    high_performing: highPerforming,
    low_performing: lowPerforming,
    category_effectiveness: categoryEffectiveness,
    recent_trends: recentTrends,
    distribution,
    summary: {
      total_questions: await QuestionBank.countDocuments(baseQuery),
      above_threshold: await QuestionBank.countDocuments({
        ...baseQuery,
        'metrics.insight_score': { $gte: threshold },
      }),
      below_threshold: await QuestionBank.countDocuments({
        ...baseQuery,
        'metrics.insight_score': { $lt: threshold },
      }),
    },
  };
}
