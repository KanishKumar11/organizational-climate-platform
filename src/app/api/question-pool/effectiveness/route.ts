import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { questionEffectivenessTracker } from '@/lib/question-effectiveness-tracker';
import { connectToDatabase } from '@/lib/mongodb';
import { User } from '@/models/User';
import { QuestionEffectiveness } from '@/models/QuestionPool';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Get user details
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check permissions - only admins can trigger effectiveness tracking
    if (!['super_admin', 'company_admin'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { surveyId, questionId, adaptationId } = body;

    // Validate required fields
    if (!surveyId || !questionId) {
      return NextResponse.json(
        { error: 'Survey ID and Question ID are required' },
        { status: 400 }
      );
    }

    // Track question effectiveness
    const metrics =
      await questionEffectivenessTracker.trackQuestionEffectiveness(
        surveyId,
        questionId,
        adaptationId
      );

    return NextResponse.json({
      success: true,
      data: {
        metrics,
        message: 'Question effectiveness tracked successfully',
      },
    });
  } catch (error) {
    console.error('Error tracking question effectiveness:', error);
    return NextResponse.json(
      { error: 'Failed to track question effectiveness' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Get user details
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const questionId = searchParams.get('questionId');
    const companyId = searchParams.get('companyId') || user.company_id;
    const departmentId = searchParams.get('departmentId');
    const timeRange = searchParams.get('timeRange'); // '7d', '30d', '90d', '1y'
    const limit = parseInt(searchParams.get('limit') || '10');

    // Validate user has access to the company
    if (user.role !== 'super_admin' && user.company_id !== companyId) {
      return NextResponse.json(
        { error: 'Access denied to this company' },
        { status: 403 }
      );
    }

    // Build query
    const query = { companyId } as any;
    if (questionId) query.questionId = questionId;
    if (departmentId) query.departmentId = departmentId;

    // Add time range filter
    if (timeRange) {
      const now = new Date();
      let startDate: Date;

      switch (timeRange) {
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case '1y':
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }

      query.measuredAt = { $gte: startDate };
    }

    if (questionId) {
      // Get detailed analysis for specific question
      const analysis =
        await questionEffectivenessTracker.getEffectivenessAnalysis(
          questionId,
          companyId,
          timeRange
            ? {
                start: new Date(
                  Date.now() -
                    (timeRange === '7d'
                      ? 7
                      : timeRange === '30d'
                        ? 30
                        : timeRange === '90d'
                          ? 90
                          : 365) *
                      24 *
                      60 *
                      60 *
                      1000
                ),
                end: new Date(),
              }
            : undefined
        );

      // Get historical effectiveness records
      const effectivenessRecords = await (QuestionEffectiveness as any).find(query)
        .sort({ measuredAt: -1 })
        .limit(limit);

      return NextResponse.json({
        success: true,
        data: {
          questionId,
          analysis,
          history: effectivenessRecords,
          summary: {
            totalMeasurements: effectivenessRecords.length,
            averageResponseRate:
              effectivenessRecords.reduce((sum, r) => sum + r.responseRate, 0) /
                effectivenessRecords.length || 0,
            averageCompletionRate:
              effectivenessRecords.reduce(
                (sum, r) => sum + r.completionRate,
                0
              ) / effectivenessRecords.length || 0,
            averageInsightQuality:
              effectivenessRecords.reduce(
                (sum, r) => sum + r.insightQuality,
                0
              ) / effectivenessRecords.length || 0,
          },
        },
      });
    } else {
      // Get top performing questions
      const topQuestions =
        await questionEffectivenessTracker.getTopPerformingQuestions(
          companyId,
          limit,
          timeRange
            ? {
                start: new Date(
                  Date.now() -
                    (timeRange === '7d'
                      ? 7
                      : timeRange === '30d'
                        ? 30
                        : timeRange === '90d'
                          ? 90
                          : 365) *
                      24 *
                      60 *
                      60 *
                      1000
                ),
                end: new Date(),
              }
            : undefined
        );

      // Get overall effectiveness statistics
      const overallStats = await QuestionEffectiveness.aggregate([
        { $match: query },
        {
          $group: {
            _id: null,
            totalQuestions: { $addToSet: '$questionId' },
            avgResponseRate: { $avg: '$responseRate' },
            avgCompletionRate: { $avg: '$completionRate' },
            avgInsightQuality: { $avg: '$insightQuality' },
            avgActionPlanGeneration: { $avg: '$actionPlanGeneration' },
            totalMeasurements: { $sum: 1 },
          },
        },
      ]);

      const stats = overallStats[0] || {
        totalQuestions: [],
        avgResponseRate: 0,
        avgCompletionRate: 0,
        avgInsightQuality: 0,
        avgActionPlanGeneration: 0,
        totalMeasurements: 0,
      };

      return NextResponse.json({
        success: true,
        data: {
          topPerformingQuestions: topQuestions,
          overallStatistics: {
            uniqueQuestions: stats.totalQuestions.length,
            totalMeasurements: stats.totalMeasurements,
            averageResponseRate: Math.round(stats.avgResponseRate * 100) / 100,
            averageCompletionRate:
              Math.round(stats.avgCompletionRate * 100) / 100,
            averageInsightQuality:
              Math.round(stats.avgInsightQuality * 100) / 100,
            averageActionPlanGeneration:
              Math.round(stats.avgActionPlanGeneration * 100) / 100,
          },
          filters: {
            companyId,
            departmentId,
            timeRange,
            limit,
          },
        },
      });
    }
  } catch (error) {
    console.error('Error getting question effectiveness:', error);
    return NextResponse.json(
      { error: 'Failed to get question effectiveness data' },
      { status: 500 }
    );
  }
}
