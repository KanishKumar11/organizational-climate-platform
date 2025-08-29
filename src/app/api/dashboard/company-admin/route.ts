import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import Survey from '@/models/Survey';
import Company from '@/models/Company';
import Department from '@/models/Department';
import { withApiMiddleware } from '@/lib/api-middleware';

export async function GET(request: NextRequest) {
  return withApiMiddleware(request, async () => {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'company_admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Company Admin access required' },
        { status: 403 }
      );
    }

    await connectDB();

    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const companyId = user.company_id;

    // Get company-specific KPIs
    const [
      totalEmployees,
      activeEmployees,
      totalSurveys,
      activeSurveys,
      totalResponses,
      completionRate,
      departmentCount,
      recentActivity,
    ] = await Promise.all([
      User.countDocuments({ company_id: companyId, is_active: true }),
      User.countDocuments({
        company_id: companyId,
        is_active: true,
        last_login: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      }),
      Survey.countDocuments({ company_id: companyId }),
      Survey.countDocuments({
        company_id: companyId,
        status: 'active',
        start_date: { $lte: new Date() },
        end_date: { $gte: new Date() },
      }),
      Survey.aggregate([
        { $match: { company_id: companyId } },
        { $unwind: '$responses' },
        { $count: 'total' },
      ]).then((result) => result[0]?.total || 0),
      calculateCompletionRate(companyId),
      Department.countDocuments({ company_id: companyId }),
      getCompanyRecentActivity(companyId),
    ]);

    // Get department analytics
    const departmentAnalytics = await Department.aggregate([
      { $match: { company_id: companyId } },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: 'department_id',
          as: 'employees',
        },
      },
      {
        $lookup: {
          from: 'surveys',
          let: { deptId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$company_id', companyId] },
                    { $in: ['$$deptId', '$target_departments'] },
                  ],
                },
              },
            },
          ],
          as: 'surveys',
        },
      },
      {
        $project: {
          name: 1,
          employee_count: { $size: '$employees' },
          active_employees: {
            $size: {
              $filter: {
                input: '$employees',
                cond: { $eq: ['$$this.is_active', true] },
              },
            },
          },
          survey_count: { $size: '$surveys' },
          active_surveys: {
            $size: {
              $filter: {
                input: '$surveys',
                cond: { $eq: ['$$this.status', 'active'] },
              },
            },
          },
          engagement_score: { $multiply: [Math.random(), 100] }, // Mock data
        },
      },
      { $sort: { name: 1 } },
    ]);

    // Get AI insights for the company
    const aiInsights = await getCompanyAIInsights(companyId);

    // Get ongoing surveys
    const ongoingSurveys = await Survey.find({
      company_id: companyId,
      status: 'active',
      start_date: { $lte: new Date() },
      end_date: { $gte: new Date() },
    })
      .populate('created_by', 'name')
      .select(
        'title type start_date end_date response_count target_responses target_departments'
      )
      .sort({ start_date: -1 })
      .limit(10);

    // Get past surveys
    const pastSurveys = await Survey.find({
      company_id: companyId,
      status: { $in: ['completed', 'archived'] },
    })
      .populate('created_by', 'name')
      .select(
        'title type start_date end_date response_count target_responses completion_rate'
      )
      .sort({ end_date: -1 })
      .limit(10);

    // Get demographic versioning info
    const demographicVersions = await getDemographicVersions(companyId);

    return NextResponse.json({
      companyKPIs: {
        totalEmployees,
        activeEmployees,
        totalSurveys,
        activeSurveys,
        totalResponses,
        completionRate,
        departmentCount,
        engagementTrend: calculateEngagementTrend(companyId),
      },
      departmentAnalytics,
      aiInsights,
      ongoingSurveys,
      pastSurveys,
      recentActivity,
      demographicVersions,
    });
  });
}

async function calculateCompletionRate(companyId: string): Promise<number> {
  const surveys = await Survey.find({
    company_id: companyId,
    status: 'completed',
  });
  if (surveys.length === 0) return 0;

  const totalRate = surveys.reduce(
    (sum, survey) => sum + (survey.completion_rate || 0),
    0
  );
  return totalRate / surveys.length;
}

async function getCompanyRecentActivity(companyId: string) {
  const [recentSurveys, recentUsers] = await Promise.all([
    Survey.find({ company_id: companyId })
      .populate('created_by', 'name')
      .sort({ created_at: -1 })
      .limit(5)
      .select('title type created_at'),
    User.find({ company_id: companyId, is_active: true })
      .populate('department_id', 'name')
      .sort({ created_at: -1 })
      .limit(5)
      .select('name role created_at'),
  ]);

  const activities = [
    ...recentSurveys.map((survey) => ({
      type: 'survey_created',
      title: `Survey "${survey.title}" created`,
      description: `${survey.type} survey by ${survey.created_by?.name}`,
      timestamp: survey.created_at,
      category: 'survey',
    })),
    ...recentUsers.map((user) => ({
      type: 'user_registered',
      title: `New ${user.role} joined`,
      description: `${user.name} joined ${user.department_id?.name}`,
      timestamp: user.created_at,
      category: 'user',
    })),
  ];

  return activities
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
    .slice(0, 10);
}

async function getCompanyAIInsights(companyId: string) {
  // Mock AI insights - in real implementation, this would fetch from AI insights collection
  return [
    {
      id: '1',
      type: 'recommendation',
      title: 'Improve Team Communication',
      description:
        'Survey data indicates communication gaps in Engineering department',
      priority: 'high',
      confidence: 0.85,
      affected_departments: ['Engineering'],
      created_at: new Date(),
      recommendations: [
        'Implement daily standups',
        'Create cross-team communication channels',
        'Schedule regular team retrospectives',
      ],
    },
    {
      id: '2',
      type: 'risk',
      title: 'Declining Engagement in Sales',
      description: 'Engagement scores have dropped 15% in the Sales department',
      priority: 'medium',
      confidence: 0.78,
      affected_departments: ['Sales'],
      created_at: new Date(),
      recommendations: [
        'Conduct one-on-one meetings',
        'Review workload distribution',
        'Implement recognition program',
      ],
    },
    {
      id: '3',
      type: 'pattern',
      title: 'Positive Trend in Remote Work Satisfaction',
      description:
        'Remote work satisfaction has increased 20% across all departments',
      priority: 'low',
      confidence: 0.92,
      affected_departments: ['All'],
      created_at: new Date(),
      recommendations: [
        'Maintain current remote work policies',
        'Share best practices across teams',
        'Consider expanding flexible work options',
      ],
    },
  ];
}

async function getDemographicVersions(companyId: string) {
  // Mock demographic versioning data - in real implementation, this would fetch from demographic snapshots
  return [
    {
      id: '1',
      version: 3,
      created_at: new Date(),
      created_by: 'Admin User',
      changes: [
        'Added new department: Customer Success',
        'Updated role definitions',
      ],
      surveys_affected: 2,
    },
    {
      id: '2',
      version: 2,
      created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      created_by: 'Admin User',
      changes: ['Reorganized Engineering teams', 'Updated reporting structure'],
      surveys_affected: 1,
    },
  ];
}

function calculateEngagementTrend(companyId: string): number {
  // Mock engagement trend calculation
  return Math.random() * 20 - 10; // -10% to +10%
}
