import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { predictTeamPerformance } from '../../../../../lib/predictive-analytics';
import { connectDB } from '../../../../../lib/db';
import { Response } from '../../../../../models/Response';
import { User } from '../../../../../models/User';
import { Department } from '../../../../../models/Department';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      teamId,
      departmentId,
      companyId,
      timeframe = 'medium',
      includeHistorical = true,
    } = await request.json();

    // Validate required parameters
    if (!companyId || (!teamId && !departmentId)) {
      return NextResponse.json(
        { error: 'companyId and either teamId or departmentId are required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Get team members
    const userFilter: any = { company_id: companyId };
    if (teamId) {
      userFilter.team_id = teamId;
    } else if (departmentId) {
      userFilter.department_id = departmentId;
    }

    const teamMembers = await User.find(userFilter).lean();
    const teamMemberIds = teamMembers.map((u) => u._id);

    if (teamMembers.length === 0) {
      return NextResponse.json(
        { error: 'No team members found' },
        { status: 404 }
      );
    }

    // Get current team performance data (last 3 months)
    const currentData = await Response.find({
      user_id: { $in: teamMemberIds },
      created_at: { $gte: new Date(Date.now() - 3 * 30 * 24 * 60 * 60 * 1000) },
      $or: [
        {
          category: {
            $in: [
              'collaboration',
              'communication',
              'productivity',
              'innovation',
            ],
          },
        },
        {
          question_text: {
            $regex: /collaborate|communication|productive|innovation|teamwork/i,
          },
        },
      ],
    }).lean();

    // Get historical performance data
    let historicalData = [];
    if (includeHistorical) {
      historicalData = await Response.find({
        user_id: { $in: teamMemberIds },
        created_at: {
          $gte: new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000),
          $lt: new Date(Date.now() - 3 * 30 * 24 * 60 * 60 * 1000),
        },
        $or: [
          {
            category: {
              $in: [
                'collaboration',
                'communication',
                'productivity',
                'innovation',
              ],
            },
          },
          {
            question_text: {
              $regex:
                /collaborate|communication|productive|innovation|teamwork/i,
            },
          },
        ],
      }).lean();
    }

    // Transform data to expected format
    const transformTeamData = (data: any[]) => {
      return data.map((r) => ({
        category:
          r.category || this.inferCategoryFromQuestion(r.question_text || ''),
        question: r.question_text || '',
        value: typeof r.response_value === 'number' ? r.response_value : 5,
        userId: r.user_id,
        date: r.created_at,
        type: typeof r.response_value === 'string' ? 'text' : 'numeric',
      }));
    };

    const currentTransformed = transformTeamData(currentData);
    const historicalTransformed = transformTeamData(historicalData);

    // Get department info for context
    const department = departmentId
      ? await Department.findById(departmentId).lean()
      : null;

    // Prepare context
    const context = {
      userId: teamId,
      departmentId: departmentId || department?._id?.toString(),
      companyId,
      timeframe: timeframe as 'short' | 'medium' | 'long',
      includeHistorical,
    };

    // Predict team performance
    const prediction = await predictTeamPerformance(
      currentTransformed,
      historicalTransformed,
      context
    );

    // Calculate team metrics
    const teamMetrics = {
      size: teamMembers.length,
      averageTenure: this.calculateAverageTenure(teamMembers),
      roleDistribution: this.calculateRoleDistribution(teamMembers),
      responseRate: (currentData.length / (teamMembers.length * 10)) * 100, // Assuming 10 questions per member
      engagementLevel: this.calculateTeamEngagement(currentTransformed),
    };

    // Generate team-specific insights
    const teamInsights = this.generateTeamInsights(
      prediction,
      teamMetrics,
      currentTransformed
    );

    return NextResponse.json({
      success: true,
      prediction,
      teamMetrics,
      insights: teamInsights,
      metadata: {
        teamSize: teamMembers.length,
        currentDataPoints: currentData.length,
        historicalDataPoints: historicalData.length,
        analysisDate: new Date().toISOString(),
        department: department?.name || 'Unknown',
      },
    });
  } catch (error) {
    console.error('Team performance prediction error:', error);
    return NextResponse.json(
      { error: 'Failed to predict team performance' },
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
    const departmentId = searchParams.get('departmentId');

    if (!companyId) {
      return NextResponse.json(
        { error: 'companyId is required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Get all teams/departments for the company
    const departmentFilter: any = { company_id: companyId };
    if (departmentId) {
      departmentFilter._id = departmentId;
    }

    const departments = await Department.find(departmentFilter).lean();
    const teamPredictions = [];

    for (const dept of departments) {
      try {
        // Get team members
        const teamMembers = await User.find({
          company_id: companyId,
          department_id: dept._id,
        }).lean();

        if (teamMembers.length === 0) continue;

        const teamMemberIds = teamMembers.map((u) => u._id);

        // Get recent performance data
        const performanceData = await Response.find({
          user_id: { $in: teamMemberIds },
          created_at: {
            $gte: new Date(Date.now() - 3 * 30 * 24 * 60 * 60 * 1000),
          },
          $or: [
            {
              category: {
                $in: [
                  'collaboration',
                  'communication',
                  'productivity',
                  'innovation',
                ],
              },
            },
            {
              question_text: {
                $regex:
                  /collaborate|communication|productive|innovation|teamwork/i,
              },
            },
          ],
        }).lean();

        // Transform and predict
        const transformedData = performanceData.map((r) => ({
          category: r.category || 'general',
          question: r.question_text || '',
          value: typeof r.response_value === 'number' ? r.response_value : 5,
          type: typeof r.response_value === 'string' ? 'text' : 'numeric',
        }));

        const context = {
          userId: dept._id.toString(),
          departmentId: dept._id.toString(),
          companyId,
          timeframe: 'medium' as const,
          includeHistorical: false,
        };

        const prediction = await predictTeamPerformance(
          transformedData,
          [],
          context
        );

        teamPredictions.push({
          department: {
            id: dept._id,
            name: dept.name,
            description: dept.description,
          },
          prediction,
          teamSize: teamMembers.length,
          dataPoints: performanceData.length,
        });
      } catch (error) {
        console.error(`Error analyzing department ${dept._id}:`, error);
      }
    }

    // Sort by predicted performance (highest first)
    teamPredictions.sort(
      (a, b) =>
        b.prediction.predictedPerformance - a.prediction.predictedPerformance
    );

    // Calculate summary statistics
    const summary = {
      totalTeams: teamPredictions.length,
      averagePerformance:
        teamPredictions.length > 0
          ? teamPredictions.reduce(
              (sum, t) => sum + t.prediction.predictedPerformance,
              0
            ) / teamPredictions.length
          : 0,
      performanceLevels: {
        excellent: teamPredictions.filter(
          (t) => t.prediction.performanceLevel === 'excellent'
        ).length,
        good: teamPredictions.filter(
          (t) => t.prediction.performanceLevel === 'good'
        ).length,
        average: teamPredictions.filter(
          (t) => t.prediction.performanceLevel === 'average'
        ).length,
        needs_improvement: teamPredictions.filter(
          (t) => t.prediction.performanceLevel === 'needs_improvement'
        ).length,
      },
      topPerformers: teamPredictions.slice(0, 3).map((t) => ({
        department: t.department.name,
        score: t.prediction.predictedPerformance,
      })),
      improvementOpportunities: teamPredictions
        .filter((t) => t.prediction.performanceLevel === 'needs_improvement')
        .map((t) => ({
          department: t.department.name,
          score: t.prediction.predictedPerformance,
          keyIssues: t.prediction.keyFactors
            .filter((f: any) => f.impact < 0.5)
            .map((f: any) => f.factor),
        })),
    };

    return NextResponse.json({
      success: true,
      predictions: teamPredictions,
      summary,
    });
  } catch (error) {
    console.error('Team performance analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze team performance' },
      { status: 500 }
    );
  }
}
