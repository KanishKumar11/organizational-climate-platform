import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import Survey from '@/models/Survey';
import Company from '@/models/Company';
import Department from '@/models/Department';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Super Admin access required' },
        { status: 403 }
      );
    }

    await connectDB();

    // Get global KPIs
    const [
      totalCompanies,
      totalUsers,
      activeUsers,
      totalSurveys,
      activeSurveys,
      totalResponses,
      recentActivity,
    ] = await Promise.all([
      Company.countDocuments({ is_active: true }),
      User.countDocuments({ is_active: true }),
      User.countDocuments({
        is_active: true,
        last_login: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      }),
      Survey.countDocuments(),
      Survey.countDocuments({
        status: 'active',
        start_date: { $lte: new Date() },
        end_date: { $gte: new Date() },
      }),
      Survey.aggregate([{ $unwind: '$responses' }, { $count: 'total' }]).then(
        (result) => result[0]?.total || 0
      ),
      getRecentActivity(),
    ]);

    // Get company performance metrics
    const companyMetrics = await Company.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: 'company_id',
          as: 'users',
        },
      },
      {
        $lookup: {
          from: 'surveys',
          localField: '_id',
          foreignField: 'company_id',
          as: 'surveys',
        },
      },
      {
        $project: {
          name: 1,
          user_count: { $size: '$users' },
          survey_count: { $size: '$surveys' },
          active_surveys: {
            $size: {
              $filter: {
                input: '$surveys',
                cond: { $eq: ['$$this.status', 'active'] },
              },
            },
          },
          created_at: 1,
        },
      },
      { $sort: { created_at: -1 } },
      { $limit: 10 },
    ]);

    // Get system health metrics
    const systemHealth = {
      database_status: 'healthy',
      api_response_time: Math.random() * 100 + 50, // Mock data
      active_connections: Math.floor(Math.random() * 100) + 20,
      memory_usage: Math.random() * 80 + 10,
      cpu_usage: Math.random() * 60 + 5,
    };

    // Get ongoing surveys across all companies
    const ongoingSurveys = await Survey.find({
      status: 'active',
      start_date: { $lte: new Date() },
      end_date: { $gte: new Date() },
    })
      .populate('company_id', 'name')
      .populate('created_by', 'name')
      .select('title type start_date end_date response_count target_responses')
      .sort({ start_date: -1 })
      .limit(10);

    return NextResponse.json({
      globalKPIs: {
        totalCompanies,
        totalUsers,
        activeUsers,
        totalSurveys,
        activeSurveys,
        totalResponses,
        userGrowthRate: calculateGrowthRate(totalUsers, 'users'),
        surveyCompletionRate:
          totalResponses > 0
            ? (totalResponses / (totalSurveys * 100)) * 100
            : 0,
      },
      companyMetrics,
      systemHealth,
      ongoingSurveys,
      recentActivity,
    });
  } catch (error) {
    console.error('Super admin dashboard error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function getRecentActivity() {
  // Get recent surveys, users, and other activities
  const [recentSurveys, recentUsers, recentCompanies] = await Promise.all([
    Survey.find()
      .populate('created_by', 'name')
      .populate('company_id', 'name')
      .sort({ created_at: -1 })
      .limit(5)
      .select('title type created_at'),
    User.find({ is_active: true })
      .populate('company_id', 'name')
      .sort({ created_at: -1 })
      .limit(5)
      .select('name role created_at'),
    Company.find({ is_active: true })
      .sort({ created_at: -1 })
      .limit(3)
      .select('name created_at'),
  ]);

  const activities = [
    ...recentSurveys.map((survey) => ({
      type: 'survey_created',
      title: `Survey "${survey.title}" created`,
      description: `${survey.type} survey by ${survey.created_by?.name}`,
      timestamp: survey.created_at,
      company: survey.company_id?.name,
    })),
    ...recentUsers.map((user) => ({
      type: 'user_registered',
      title: `New ${user.role} registered`,
      description: `${user.name} joined ${user.company_id?.name}`,
      timestamp: user.created_at,
      company: user.company_id?.name,
    })),
    ...recentCompanies.map((company) => ({
      type: 'company_created',
      title: `Company "${company.name}" added`,
      description: 'New organization onboarded',
      timestamp: company.created_at,
      company: company.name,
    })),
  ];

  return activities
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
    .slice(0, 10);
}

function calculateGrowthRate(current: number, type: string): number {
  // Mock growth rate calculation - in real implementation,
  // this would compare with previous period data
  return Math.random() * 20 + 5; // 5-25% growth
}
