import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { analyzeTurnoverRisk } from '../../../../../lib/predictive-analytics';
import { connectDB } from '../../../../../lib/db';
import { Response } from '../../../../../models/Response';
import { User } from '../../../../../models/User';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      userId,
      companyId,
      timeframe = 'medium',
      includeHistorical = true,
    } = await request.json();

    // Validate required parameters
    if (!userId || !companyId) {
      return NextResponse.json(
        { error: 'userId and companyId are required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Get user responses
    const userResponses = await Response.find({
      user_id: userId,
      created_at: { $gte: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000) }, // Last 6 months
    }).lean();

    // Get historical data for similar users (same department/role)
    const user = await User.findById(userId).lean();
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let historicalData = [];
    if (includeHistorical) {
      const similarUsers = await User.find({
        company_id: companyId,
        department_id: user.department_id,
        role: user.role,
        _id: { $ne: userId },
      })
        .limit(50)
        .lean();

      const similarUserIds = similarUsers.map((u) => u._id);
      historicalData = await Response.find({
        user_id: { $in: similarUserIds },
        created_at: {
          $gte: new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000),
        }, // Last 12 months
      }).lean();
    }

    // Prepare context
    const context = {
      userId,
      companyId,
      departmentId: user.department_id,
      timeframe: timeframe as 'short' | 'medium' | 'long',
      includeHistorical,
    };

    // Transform responses to expected format
    const transformedResponses = userResponses.map((r) => ({
      category: r.category || 'general',
      question: r.question_text || '',
      value: r.response_value,
      type: typeof r.response_value === 'string' ? 'text' : 'numeric',
    }));

    const transformedHistorical = historicalData.map((r) => ({
      category: r.category || 'general',
      question: r.question_text || '',
      value: r.response_value,
      type: typeof r.response_value === 'string' ? 'text' : 'numeric',
      date: r.created_at,
    }));

    // Analyze turnover risk
    const prediction = await analyzeTurnoverRisk(
      transformedResponses,
      transformedHistorical,
      context
    );

    return NextResponse.json({
      success: true,
      prediction,
      metadata: {
        responseCount: userResponses.length,
        historicalCount: historicalData.length,
        analysisDate: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Turnover prediction error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze turnover risk' },
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
    const riskLevel = searchParams.get('riskLevel');

    if (!companyId) {
      return NextResponse.json(
        { error: 'companyId is required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Get users based on filters
    const userFilter: any = { company_id: companyId };
    if (departmentId) userFilter.department_id = departmentId;

    const users = await User.find(userFilter).lean();
    const userIds = users.map((u) => u._id);

    // Get recent responses for all users
    const responses = await Response.find({
      user_id: { $in: userIds },
      created_at: { $gte: new Date(Date.now() - 3 * 30 * 24 * 60 * 60 * 1000) }, // Last 3 months
    }).lean();

    // Group responses by user
    const userResponseMap = new Map();
    responses.forEach((r) => {
      if (!userResponseMap.has(r.user_id.toString())) {
        userResponseMap.set(r.user_id.toString(), []);
      }
      userResponseMap.get(r.user_id.toString()).push({
        category: r.category || 'general',
        question: r.question_text || '',
        value: r.response_value,
        type: typeof r.response_value === 'string' ? 'text' : 'numeric',
      });
    });

    // Analyze turnover risk for each user
    const predictions = [];
    for (const user of users) {
      const userResponses = userResponseMap.get(user._id.toString()) || [];
      if (userResponses.length === 0) continue;

      const context = {
        userId: user._id.toString(),
        companyId,
        departmentId: user.department_id,
        timeframe: 'medium' as const,
        includeHistorical: false,
      };

      try {
        const prediction = await analyzeTurnoverRisk(
          userResponses,
          [],
          context
        );

        // Filter by risk level if specified
        if (!riskLevel || prediction.riskLevel === riskLevel) {
          predictions.push({
            ...prediction,
            user: {
              id: user._id,
              name: user.name,
              email: user.email,
              department: user.department_id,
              role: user.role,
            },
          });
        }
      } catch (error) {
        console.error(`Error analyzing user ${user._id}:`, error);
      }
    }

    // Sort by risk score (highest first)
    predictions.sort((a, b) => b.riskScore - a.riskScore);

    return NextResponse.json({
      success: true,
      predictions,
      summary: {
        total: predictions.length,
        critical: predictions.filter((p) => p.riskLevel === 'critical').length,
        high: predictions.filter((p) => p.riskLevel === 'high').length,
        medium: predictions.filter((p) => p.riskLevel === 'medium').length,
        low: predictions.filter((p) => p.riskLevel === 'low').length,
      },
    });
  } catch (error) {
    console.error('Turnover analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze turnover risks' },
      { status: 500 }
    );
  }
}
