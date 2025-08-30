import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { forecastEngagement } from '../../../../../lib/predictive-analytics';
import { connectDB } from '../../../../../lib/db';
import { Response } from '../../../../../models/Response';
import { Survey } from '../../../../../models/Survey';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      companyId,
      departmentId,
      timeframe = 'medium',
      includeHistorical = true,
    } = await request.json();

    // Validate required parameters
    if (!companyId) {
      return NextResponse.json(
        { error: 'companyId is required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Build query filters
    const surveyFilter: any = { company_id: companyId };
    if (departmentId) {
      surveyFilter.target_departments = departmentId;
    }

    // Get surveys for engagement analysis
    const surveys = await Survey.find(surveyFilter)
      .sort({ created_at: -1 })
      .limit(20)
      .lean();

    const surveyIds = surveys.map((s) => s._id);

    // Get current engagement data (last 3 months)
    const currentData = await Response.find({
      survey_id: { $in: surveyIds },
      created_at: { $gte: new Date(Date.now() - 3 * 30 * 24 * 60 * 60 * 1000) },
      $or: [
        { category: 'engagement' },
        {
          question_text: {
            $regex: /engaged|engagement|motivated|satisfaction/i,
          },
        },
      ],
    }).lean();

    // Get historical data (last 12 months)
    let historicalData = [];
    if (includeHistorical) {
      historicalData = await Response.find({
        survey_id: { $in: surveyIds },
        created_at: {
          $gte: new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000),
          $lt: new Date(Date.now() - 3 * 30 * 24 * 60 * 60 * 1000),
        },
        $or: [
          { category: 'engagement' },
          {
            question_text: {
              $regex: /engaged|engagement|motivated|satisfaction/i,
            },
          },
        ],
      }).lean();
    }

    // Transform data to expected format
    const transformCurrentData = (data: any[]) => {
      return data.map((r) => ({
        score: typeof r.response_value === 'number' ? r.response_value : 5,
        date: r.created_at,
        category: r.category || 'engagement',
        department: departmentId || 'all',
      }));
    };

    const transformHistoricalData = (data: any[]) => {
      // Group by month and calculate average scores
      const monthlyData = new Map();

      data.forEach((r) => {
        const monthKey = new Date(r.created_at).toISOString().substring(0, 7); // YYYY-MM
        if (!monthlyData.has(monthKey)) {
          monthlyData.set(monthKey, { scores: [], date: r.created_at });
        }
        const score =
          typeof r.response_value === 'number' ? r.response_value : 5;
        monthlyData.get(monthKey).scores.push(score);
      });

      return Array.from(monthlyData.entries())
        .map(([month, data]) => ({
          score:
            data.scores.reduce((sum: number, score: number) => sum + score, 0) /
            data.scores.length,
          date: data.date,
          month,
          category: 'engagement',
        }))
        .sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );
    };

    const currentTransformed = transformCurrentData(currentData);
    const historicalTransformed = transformHistoricalData(historicalData);

    // Prepare context
    const context = {
      companyId,
      departmentId,
      timeframe: timeframe as 'short' | 'medium' | 'long',
      includeHistorical,
    };

    // Forecast engagement trends
    const trends = await forecastEngagement(
      historicalTransformed,
      currentTransformed,
      context
    );

    // Calculate additional insights
    const currentAverage =
      currentTransformed.length > 0
        ? currentTransformed.reduce((sum, d) => sum + d.score, 0) /
          currentTransformed.length
        : 5;

    const historicalAverage =
      historicalTransformed.length > 0
        ? historicalTransformed.reduce((sum, d) => sum + d.score, 0) /
          historicalTransformed.length
        : 5;

    const momentum = currentAverage - historicalAverage;

    return NextResponse.json({
      success: true,
      trends,
      insights: {
        currentAverage: Math.round(currentAverage * 10) / 10,
        historicalAverage: Math.round(historicalAverage * 10) / 10,
        momentum: Math.round(momentum * 10) / 10,
        momentumDirection:
          momentum > 0.2 ? 'positive' : momentum < -0.2 ? 'negative' : 'stable',
        dataQuality: {
          currentDataPoints: currentData.length,
          historicalDataPoints: historicalData.length,
          confidenceLevel:
            currentData.length > 50
              ? 'high'
              : currentData.length > 20
                ? 'medium'
                : 'low',
        },
      },
      metadata: {
        analysisDate: new Date().toISOString(),
        timeframe,
        includeHistorical,
        surveyCount: surveys.length,
      },
    });
  } catch (error) {
    console.error('Engagement forecasting error:', error);
    return NextResponse.json(
      { error: 'Failed to forecast engagement trends' },
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

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const period = searchParams.get('period') || '6months';

    if (!companyId) {
      return NextResponse.json(
        { error: 'companyId is required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Calculate period in months
    const periodMonths =
      period === '3months' ? 3 : period === '12months' ? 12 : 6;
    const startDate = new Date(
      Date.now() - periodMonths * 30 * 24 * 60 * 60 * 1000
    );

    // Get engagement data for the specified period
    const surveys = await Survey.find({
      company_id: companyId,
      created_at: { $gte: startDate },
    }).lean();

    const surveyIds = surveys.map((s) => s._id);

    const engagementData = await Response.find({
      survey_id: { $in: surveyIds },
      created_at: { $gte: startDate },
      $or: [
        { category: 'engagement' },
        {
          question_text: {
            $regex: /engaged|engagement|motivated|satisfaction/i,
          },
        },
      ],
    }).lean();

    // Group data by month
    const monthlyEngagement = new Map();

    engagementData
      .flatMap((r) =>
        (r.responses || []).map((qr) => ({
          ...qr,
          created_at: r.created_at,
          survey_id: r.survey_id,
          user_id: r.user_id,
        }))
      )
      .forEach((r) => {
        const monthKey = new Date(r.created_at).toISOString().substring(0, 7); // YYYY-MM
        if (!monthlyEngagement.has(monthKey)) {
          monthlyEngagement.set(monthKey, {
            scores: [],
            responses: 0,
            date: new Date(r.created_at),
          });
        }
        const score =
          typeof r.response_value === 'number' ? r.response_value : 5;
        monthlyEngagement.get(monthKey).scores.push(score);
        monthlyEngagement.get(monthKey).responses++;
      });

    // Calculate monthly averages and trends
    const monthlyTrends = Array.from(monthlyEngagement.entries())
      .map(([month, data]) => ({
        month,
        date: data.date,
        averageScore:
          data.scores.reduce((sum, score) => sum + score, 0) /
          data.scores.length,
        responseCount: data.responses,
        participationRate: Math.min(100, (data.responses / 100) * 100), // Assuming 100 target responses per month
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    // Calculate overall trend
    const overallTrend =
      monthlyTrends.length > 1
        ? monthlyTrends[monthlyTrends.length - 1].averageScore -
          monthlyTrends[0].averageScore
        : 0;

    // Calculate predictions for next 3 months
    const lastScore =
      monthlyTrends.length > 0
        ? monthlyTrends[monthlyTrends.length - 1].averageScore
        : 5;

    const trendSlope =
      monthlyTrends.length > 1 ? overallTrend / (monthlyTrends.length - 1) : 0;

    const predictions = [];
    for (let i = 1; i <= 3; i++) {
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + i);

      predictions.push({
        month: futureDate.toISOString().substring(0, 7),
        date: futureDate,
        predictedScore: Math.max(1, Math.min(10, lastScore + trendSlope * i)),
        confidence: Math.max(0.5, 0.9 - i * 0.1), // Decreasing confidence over time
        type: 'prediction',
      });
    }

    return NextResponse.json({
      success: true,
      historical: monthlyTrends,
      predictions,
      summary: {
        currentScore:
          monthlyTrends.length > 0
            ? monthlyTrends[monthlyTrends.length - 1].averageScore
            : 5,
        overallTrend:
          overallTrend > 0.2
            ? 'improving'
            : overallTrend < -0.2
              ? 'declining'
              : 'stable',
        trendValue: Math.round(overallTrend * 10) / 10,
        totalResponses: engagementData.length,
        averageParticipation:
          monthlyTrends.length > 0
            ? monthlyTrends.reduce((sum, t) => sum + t.participationRate, 0) /
              monthlyTrends.length
            : 0,
      },
    });
  } catch (error) {
    console.error('Engagement trends error:', error);
    return NextResponse.json(
      { error: 'Failed to get engagement trends' },
      { status: 500 }
    );
  }
}
