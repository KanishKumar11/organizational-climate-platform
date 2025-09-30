import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { sanitizeForSerialization } from '@/lib/data-sanitization';
import User from '@/models/User';
import Survey from '@/models/Survey';
import Response from '@/models/Response';
import Company from '@/models/Company';
import Department from '@/models/Department';

export async function GET(request: NextRequest) {
  try {
    console.log('Company Admin Dashboard API called');
    const session = await getServerSession(authOptions);
    console.log('Session:', session?.user?.role, session?.user?.id);

    if (!session?.user || session.user.role !== 'company_admin') {
      console.log('Access denied - not company admin');
      return NextResponse.json(
        { error: 'Unauthorized - Company Admin access required' },
        { status: 403 }
      );
    }

    await connectDB();
    console.log('Database connected');

    const user = await (User as any).findById(session.user.id);
    console.log('User found:', !!user, user?.company_id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const companyId = user.company_id;
    if (!companyId) {
      console.log('User has no company_id');
      return NextResponse.json(
        { error: 'User not associated with a company' },
        { status: 400 }
      );
    }

    // Get company-specific KPIs
    console.log('Fetching company KPIs for company:', companyId);
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
      Response.countDocuments({ company_id: companyId }),
      calculateCompletionRate(companyId),
      Department.countDocuments({ company_id: companyId }),
      getCompanyRecentActivity(companyId),
    ]);

    console.log('KPIs fetched:', {
      totalEmployees,
      activeEmployees,
      totalSurveys,
      activeSurveys,
      totalResponses,
      completionRate,
      departmentCount,
      recentActivityCount: recentActivity?.length || 0,
    });

    // Get department analytics
    console.log('Fetching department analytics...');
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
                    { $in: ['$$deptId', '$department_ids'] },
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

    console.log(
      'Department analytics fetched:',
      departmentAnalytics?.length || 0,
      'departments'
    );

    // Get AI insights for the company
    const aiInsights = await getCompanyAIInsights(companyId);

    // Get ongoing surveys with proper serialization
    const ongoingSurveysRaw = await (Survey as any)
      .find({
        company_id: companyId,
        status: 'active',
        start_date: { $lte: new Date() },
        end_date: { $gte: new Date() },
      })
      .populate('created_by', 'name')
      .select('title type start_date end_date response_count department_ids')
      .sort({ start_date: -1 })
      .limit(10)
      .lean();

    // Get past surveys with proper serialization
    const pastSurveysRaw = await (Survey as any)
      .find({
        company_id: companyId,
        status: { $in: ['completed', 'archived'] },
      })
      .populate('created_by', 'name')
      .select('title type start_date end_date response_count')
      .sort({ end_date: -1 })
      .limit(10)
      .lean();

    // Sanitize survey data to avoid circular references
    const ongoingSurveys = ongoingSurveysRaw.map((survey: any) => ({
      id: survey._id.toString(),
      title: survey.title,
      type: survey.type,
      start_date: survey.start_date,
      end_date: survey.end_date,
      response_count: survey.response_count || 0,
      department_ids: survey.department_ids || [],
      created_by: survey.created_by
        ? {
            id:
              survey.created_by._id?.toString() || survey.created_by.toString(),
            name: survey.created_by.name || 'Unknown',
          }
        : null,
    }));

    const pastSurveys = pastSurveysRaw.map((survey: any) => ({
      id: survey._id.toString(),
      title: survey.title,
      type: survey.type,
      start_date: survey.start_date,
      end_date: survey.end_date,
      response_count: survey.response_count || 0,
      created_by: survey.created_by
        ? {
            id:
              survey.created_by._id?.toString() || survey.created_by.toString(),
            name: survey.created_by.name || 'Unknown',
          }
        : null,
    }));

    // Get demographic versioning info
    const demographicVersions = await getDemographicVersions(companyId);

    // Sanitize all data to prevent circular references and ensure serializability
    const responseData = sanitizeForSerialization({
      companyKPIs: {
        totalEmployees,
        activeEmployees,
        totalSurveys,
        activeSurveys,
        totalResponses,
        completionRate,
        departmentCount,
        engagementTrend: calculateEngagementTrend(),
      },
      departmentAnalytics,
      aiInsights,
      ongoingSurveys,
      pastSurveys,
      recentActivity,
      demographicVersions,
    });

    console.log('Successfully prepared response data');
    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Company admin dashboard error:', error);
    console.error(
      'Error stack:',
      error instanceof Error ? error.stack : 'No stack trace'
    );
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function calculateCompletionRate(companyId: string): Promise<number> {
  const surveys = await (Survey as any).find({
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
    (Survey as any)
      .find({ company_id: companyId })
      .populate('created_by', 'name')
      .sort({ created_at: -1 })
      .limit(5)
      .select('title type created_at')
      .lean(),
    (User as any)
      .find({ company_id: companyId, is_active: true })
      .populate('department_id', 'name')
      .sort({ created_at: -1 })
      .limit(5)
      .select('name role created_at')
      .lean(),
  ]);

  const activities = [
    ...recentSurveys.map((survey: any) => ({
      type: 'survey_created',
      title: `Survey "${survey.title}" created`,
      description: `${survey.type} survey by ${survey.created_by?.name || 'Unknown'}`,
      timestamp: survey.created_at,
      category: 'survey',
    })),
    ...recentUsers.map((user: any) => ({
      type: 'user_registered',
      title: `New ${user.role} joined`,
      description: `${user.name} joined ${user.department_id?.name || 'General Department'}`,
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

function calculateEngagementTrend(): number {
  // Mock engagement trend calculation
  return Math.random() * 20 - 10; // -10% to +10%
}
