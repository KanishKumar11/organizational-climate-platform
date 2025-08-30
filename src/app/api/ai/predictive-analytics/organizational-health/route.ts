import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { calculateOrganizationalHealth } from '../../../../../lib/predictive-analytics';
import { connectDB } from '../../../../../lib/db';
import { Response } from '../../../../../models/Response';
import { Survey } from '../../../../../models/Survey';
import { User } from '../../../../../models/User';
import { Company } from '../../../../../models/Company';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      companyId,
      timeframe = 'medium',
      includeBenchmarks = true,
    } = await request.json();

    // Validate required parameters
    if (!companyId) {
      return NextResponse.json(
        { error: 'companyId is required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Get company information
    const company = await (Company as any).findById(companyId).lean();
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // Get all surveys for the company
    const surveys = await (Survey as any)
      .find({
        company_id: companyId,
        status: { $in: ['completed', 'active'] },
      })
      .sort({ created_at: -1 })
      .lean();

    const surveyIds = surveys.map((s) => s._id);

    // Get comprehensive organizational data (last 6 months)
    const organizationData = await (Response as any)
      .find({
        survey_id: { $in: surveyIds },
        created_at: {
          $gte: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000),
        },
      })
      .lean();

    // Get benchmark data (industry averages, similar companies)
    const benchmarkData = await this.getBenchmarkData(
      company.industry,
      company.size
    );

    // Transform organization data to expected format
    const transformedOrgData = this.transformOrganizationData(organizationData);

    // Prepare context
    const context = {
      companyId,
      timeframe: timeframe as 'short' | 'medium' | 'long',
      includeHistorical: true,
    };

    // Calculate organizational health
    const healthScore = await calculateOrganizationalHealth(
      transformedOrgData,
      benchmarkData,
      context
    );

    // Get additional company metrics
    const companyMetrics = await this.getCompanyMetrics(
      companyId,
      organizationData
    );

    // Generate executive summary
    const executiveSummary = this.generateExecutiveSummary(
      healthScore,
      companyMetrics
    );

    return NextResponse.json({
      success: true,
      healthScore,
      companyMetrics,
      executiveSummary,
      metadata: {
        companyName: company.name,
        industry: company.industry,
        employeeCount: companyMetrics.employeeCount,
        surveyCount: surveys.length,
        responseCount: organizationData.length,
        analysisDate: new Date().toISOString(),
        timeframe,
      },
    });
  } catch (error) {
    console.error('Organizational health calculation error:', error);
    return NextResponse.json(
      { error: 'Failed to calculate organizational health' },
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

    // Get historical health data
    const surveys = await (Survey as any)
      .find({
        company_id: companyId,
        created_at: { $gte: startDate },
      })
      .lean();

    const surveyIds = surveys.map((s) => s._id);

    const healthData = await (Response as any)
      .find({
        survey_id: { $in: surveyIds },
        created_at: { $gte: startDate },
      })
      .lean();

    // Group data by month and calculate health scores
    const monthlyHealth = new Map();

    healthData.forEach((r) => {
      const monthKey = new Date(r.created_at).toISOString().substring(0, 7);
      if (!monthlyHealth.has(monthKey)) {
        monthlyHealth.set(monthKey, {
          responses: [],
          date: new Date(r.created_at),
        });
      }
      monthlyHealth.get(monthKey).responses.push(r);
    });

    // Calculate monthly health scores
    const monthlyScores = [];
    for (const [month, data] of monthlyHealth.entries()) {
      const transformedData = data.responses.map((r: any) => ({
        category: r.category || 'general',
        score:
          typeof r.response_value === 'number'
            ? (r.response_value / 5) * 100
            : 50,
        date: r.created_at,
      }));

      // Simple health calculation for historical view
      const avgScore =
        transformedData.length > 0
          ? transformedData.reduce((sum, d) => sum + d.score, 0) /
            transformedData.length
          : 50;

      monthlyScores.push({
        month,
        date: data.date,
        healthScore: Math.round(avgScore),
        responseCount: data.responses.length,
        trend: 'stable', // Would be calculated based on previous months
      });
    }

    monthlyScores.sort((a, b) => a.date.getTime() - b.date.getTime());

    // Calculate overall trend
    const overallTrend =
      monthlyScores.length > 1
        ? monthlyScores[monthlyScores.length - 1].healthScore -
          monthlyScores[0].healthScore
        : 0;

    return NextResponse.json({
      success: true,
      historical: monthlyScores,
      summary: {
        currentScore:
          monthlyScores.length > 0
            ? monthlyScores[monthlyScores.length - 1].healthScore
            : 50,
        overallTrend:
          overallTrend > 2
            ? 'improving'
            : overallTrend < -2
              ? 'declining'
              : 'stable',
        trendValue: Math.round(overallTrend * 10) / 10,
        totalResponses: healthData.length,
        averageMonthlyResponses:
          monthlyScores.length > 0
            ? monthlyScores.reduce((sum, s) => sum + s.responseCount, 0) /
              monthlyScores.length
            : 0,
      },
    });
  } catch (error) {
    console.error('Organizational health history error:', error);
    return NextResponse.json(
      { error: 'Failed to get organizational health history' },
      { status: 500 }
    );
  }
}


