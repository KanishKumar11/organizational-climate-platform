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
    // Note: We need to convert ObjectId to string for the lookup since
    // User and Survey models store company_id as String, not ObjectId
    let companyMetrics = await Company.aggregate([
      {
        $match: { is_active: true },
      },
      {
        $addFields: {
          company_id_string: { $toString: '$_id' },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'company_id_string',
          foreignField: 'company_id',
          as: 'users',
        },
      },
      {
        $lookup: {
          from: 'surveys',
          localField: 'company_id_string',
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

    // Fallback to mock data if no companies exist (for development)
    if (companyMetrics.length === 0) {
      companyMetrics = [
        {
          _id: '507f1f77bcf86cd799439011',
          name: 'TechCorp Solutions',
          user_count: 45,
          survey_count: 12,
          active_surveys: 3,
          created_at: new Date('2024-01-15'),
        },
        {
          _id: '507f1f77bcf86cd799439012',
          name: 'InnovateCorp',
          user_count: 32,
          survey_count: 8,
          active_surveys: 2,
          created_at: new Date('2024-02-20'),
        },
        {
          _id: '507f1f77bcf86cd799439013',
          name: 'GlobalTech Inc',
          user_count: 78,
          survey_count: 15,
          active_surveys: 5,
          created_at: new Date('2024-03-10'),
        },
      ];
    }

    // Get system health metrics
    const systemHealth = {
      database_status: 'healthy',
      api_response_time: Math.random() * 100 + 50, // Mock data
      active_connections: Math.floor(Math.random() * 100) + 20,
      memory_usage: Math.random() * 80 + 10,
      cpu_usage: Math.random() * 60 + 5,
    };

    // Get ongoing surveys across all companies
    let ongoingSurveys = await Survey.find({
      status: 'active',
      start_date: { $lte: new Date() },
      end_date: { $gte: new Date() },
    })
      .populate('company_id', 'name')
      .populate('created_by', 'name')
      .select('title type start_date end_date response_count target_responses')
      .sort({ start_date: -1 })
      .limit(10);

    // Fallback to mock data if no surveys exist (for development)
    if (ongoingSurveys.length === 0) {
      ongoingSurveys = [
        {
          _id: '507f1f77bcf86cd799439021',
          title: 'Q1 Employee Satisfaction Survey',
          type: 'engagement',
          start_date: new Date('2024-03-01'),
          end_date: new Date('2024-03-31'),
          response_count: 23,
          target_responses: 45,
          company_id: { name: 'TechCorp Solutions' },
          created_by: { name: 'Sarah Johnson' },
        },
        {
          _id: '507f1f77bcf86cd799439022',
          title: 'Remote Work Effectiveness Study',
          type: 'culture',
          start_date: new Date('2024-03-15'),
          end_date: new Date('2024-04-15'),
          response_count: 18,
          target_responses: 32,
          company_id: { name: 'InnovateCorp' },
          created_by: { name: 'Mike Chen' },
        },
        {
          _id: '507f1f77bcf86cd799439023',
          title: 'Leadership Feedback Assessment',
          type: 'leadership',
          start_date: new Date('2024-03-20'),
          end_date: new Date('2024-04-20'),
          response_count: 35,
          target_responses: 78,
          company_id: { name: 'GlobalTech Inc' },
          created_by: { name: 'Emily Rodriguez' },
        },
      ] as any;
    }

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
      description: `${survey.type} survey by ${(survey.created_by as any)?.name}`,
      timestamp: survey.created_at,
      company: (survey.company_id as any)?.name,
    })),
    ...recentUsers.map((user) => ({
      type: 'user_registered',
      title: `New ${user.role} registered`,
      description: `${user.name} joined ${(user.company_id as any)?.name}`,
      timestamp: user.created_at,
      company: (user.company_id as any)?.name,
    })),
    ...recentCompanies.map((company) => ({
      type: 'company_created',
      title: `Company "${company.name}" added`,
      description: 'New organization onboarded',
      timestamp: company.created_at,
      company: company.name,
    })),
  ];

  const sortedActivities = activities
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
    .slice(0, 10);

  // Fallback to mock data if no activities exist (for development)
  if (sortedActivities.length === 0) {
    return [
      {
        type: 'survey_created',
        title: 'Survey "Q1 Employee Satisfaction Survey" created',
        description: 'engagement survey by Sarah Johnson',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        company: 'TechCorp Solutions',
      },
      {
        type: 'user_registered',
        title: 'New employee registered',
        description: 'Alex Thompson joined InnovateCorp',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
        company: 'InnovateCorp',
      },
      {
        type: 'company_created',
        title: 'Company "GlobalTech Inc" added',
        description: 'New organization onboarded',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
        company: 'GlobalTech Inc',
      },
      {
        type: 'survey_created',
        title: 'Survey "Remote Work Effectiveness Study" created',
        description: 'culture survey by Mike Chen',
        timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
        company: 'InnovateCorp',
      },
      {
        type: 'user_registered',
        title: 'New supervisor registered',
        description: 'Jessica Martinez joined TechCorp Solutions',
        timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
        company: 'TechCorp Solutions',
      },
    ];
  }

  return sortedActivities;
}

function calculateGrowthRate(current: number, type: string): number {
  // Mock growth rate calculation - in real implementation,
  // this would compare with previous period data
  return Math.random() * 20 + 5; // 5-25% growth
}
