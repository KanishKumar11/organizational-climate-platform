import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import Survey from '@/models/Survey';
import Department from '@/models/Department';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (
      !session?.user ||
      !['leader', 'supervisor'].includes(session.user.role)
    ) {
      return NextResponse.json(
        { error: 'Unauthorized - Department Admin access required' },
        { status: 403 }
      );
    }

    await connectDB();

    const user = await (User as any).findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const departmentId = user.department_id;
    const companyId = user.company_id;

    // Get department information
    const department = await (Department as any)
      .findById(departmentId)
      .populate('company_id', 'name');
    if (!department) {
      return NextResponse.json(
        { error: 'Department not found' },
        { status: 404 }
      );
    }

    // Get department-specific KPIs
    const [
      totalTeamMembers,
      activeTeamMembers,
      departmentSurveys,
      activeDepartmentSurveys,
      departmentResponses,
      recentActivity,
    ] = await Promise.all([
      User.countDocuments({ department_id: departmentId, is_active: true }),
      User.countDocuments({
        department_id: departmentId,
        is_active: true,
        last_login: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      }),
      Survey.countDocuments({
        company_id: companyId,
        target_departments: departmentId,
      }),
      Survey.countDocuments({
        company_id: companyId,
        target_departments: departmentId,
        status: 'active',
        start_date: { $lte: new Date() },
        end_date: { $gte: new Date() },
      }),
      Survey.aggregate([
        {
          $match: {
            company_id: companyId,
            target_departments: departmentId,
          },
        },
        { $unwind: '$responses' },
        {
          $lookup: {
            from: 'users',
            localField: 'responses.user_id',
            foreignField: '_id',
            as: 'user',
          },
        },
        {
          $match: {
            'user.department_id': departmentId,
          },
        },
        { $count: 'total' },
      ]).then((result) => result[0]?.total || 0),
      getDepartmentRecentActivity(departmentId, companyId),
    ]);

    // Get team member details
    const teamMembers = await (User as any)
      .find({
        department_id: departmentId,
        is_active: true,
      })
      .select('name email role last_login created_at')
      .sort({ name: 1 });

    // Get department-specific AI insights
    const departmentInsights = await getDepartmentAIInsights(departmentId);

    // Get ongoing surveys for the department
    const ongoingSurveys = await (Survey as any)
      .find({
        company_id: companyId,
        target_departments: departmentId,
        status: 'active',
        start_date: { $lte: new Date() },
        end_date: { $gte: new Date() },
      })
      .populate('created_by', 'name')
      .select('title type start_date end_date response_count target_responses')
      .sort({ start_date: -1 })
      .limit(10);

    // Get past surveys for the department
    const pastSurveys = await Survey.find({
      company_id: companyId,
      target_departments: departmentId,
      status: { $in: ['completed', 'archived'] },
    })
      .populate('created_by', 'name')
      .select(
        'title type start_date end_date response_count target_responses completion_rate'
      )
      .sort({ end_date: -1 })
      .limit(10);

    // Get department action plans (mock data for now)
    const actionPlans = getDepartmentActionPlans(departmentId);

    // Calculate department performance metrics
    const performanceMetrics = {
      engagement_score: Math.random() * 100,
      participation_rate:
        departmentResponses > 0
          ? (departmentResponses / (departmentSurveys * totalTeamMembers)) * 100
          : 0,
      response_time_avg: Math.random() * 5 + 1, // 1-6 days average
      satisfaction_score: Math.random() * 100,
    };

    return NextResponse.json({
      department: {
        name: department.name,
        description: department.description,
        company_name: department.company_id?.name,
      },
      departmentKPIs: {
        totalTeamMembers,
        activeTeamMembers,
        departmentSurveys,
        activeDepartmentSurveys,
        departmentResponses,
        ...performanceMetrics,
      },
      teamMembers,
      departmentInsights,
      ongoingSurveys,
      pastSurveys,
      actionPlans,
      recentActivity,
    });
  } catch (error) {
    console.error('Department admin dashboard error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function getDepartmentRecentActivity(
  departmentId: string,
  companyId: string
) {
  const [recentSurveys, recentUsers] = await Promise.all([
    Survey.find({
      company_id: companyId,
      target_departments: departmentId,
    })
      .sort({ created_at: -1 })
      .limit(3)
      .select('title type created_at'),
    User.find({
      department_id: departmentId,
      is_active: true,
    })
      .sort({ created_at: -1 })
      .limit(3)
      .select('name role created_at'),
  ]);

  const activities = [
    ...recentSurveys.map((survey) => ({
      type: 'survey_assigned',
      title: `Survey "${survey.title}" assigned to department`,
      description: `${survey.type} survey created`,
      timestamp: survey.created_at,
      category: 'survey',
    })),
    ...recentUsers.map((user) => ({
      type: 'team_member_joined',
      title: `${user.name} joined the team`,
      description: `New ${user.role} added to department`,
      timestamp: user.created_at,
      category: 'team',
    })),
  ];

  return activities
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
    .slice(0, 8);
}

async function getDepartmentAIInsights(departmentId: string) {
  // Mock AI insights specific to department - in real implementation,
  // this would fetch from AI insights collection filtered by department
  return [
    {
      id: '1',
      type: 'recommendation',
      title: 'Improve Team Collaboration',
      description:
        'Team members report challenges with cross-functional collaboration',
      priority: 'medium',
      confidence: 0.82,
      created_at: new Date(),
      recommendations: [
        'Schedule weekly cross-team sync meetings',
        'Implement shared project tracking tools',
        'Create collaboration guidelines',
      ],
    },
    {
      id: '2',
      type: 'pattern',
      title: 'High Engagement in Morning Hours',
      description:
        'Survey responses show 30% higher engagement during morning hours',
      priority: 'low',
      confidence: 0.91,
      created_at: new Date(),
      recommendations: [
        'Schedule important meetings in the morning',
        'Plan team activities during peak engagement hours',
        'Consider flexible work arrangements',
      ],
    },
  ];
}

function getDepartmentActionPlans(departmentId: string) {
  // Mock action plans - in real implementation, this would fetch from action plans collection
  return [
    {
      id: '1',
      title: 'Improve Team Communication',
      description:
        'Implement better communication practices based on survey feedback',
      status: 'in_progress',
      progress: 65,
      due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      assigned_to: 'Team Lead',
      created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    },
    {
      id: '2',
      title: 'Enhance Work-Life Balance',
      description:
        'Address work-life balance concerns raised in recent surveys',
      status: 'not_started',
      progress: 0,
      due_date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
      assigned_to: 'Department Manager',
      created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
    {
      id: '3',
      title: 'Skills Development Program',
      description:
        'Launch professional development initiative based on team feedback',
      status: 'completed',
      progress: 100,
      due_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      assigned_to: 'HR Partner',
      created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    },
  ];
}


