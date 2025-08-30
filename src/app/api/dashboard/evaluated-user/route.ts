import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import Survey from '@/models/Survey';
import Department from '@/models/Department';
import { withApiMiddleware } from '@/lib/api-middleware';

export const GET = withApiMiddleware(async (request: NextRequest) => {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== 'employee') {
    return NextResponse.json(
      { error: 'Unauthorized - Employee access required' },
      { status: 403 }
    );
  }

  await connectDB();

  const user = await User.findById(session.user.id)
    .populate('company_id', 'name')
    .populate('department_id', 'name');

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const userId = user._id.toString();
  const departmentId = user.department_id;
  const companyId = user.company_id;

  // Get assigned surveys (active surveys targeting user's department)
  const assignedSurveys = await Survey.find({
    company_id: companyId,
    target_departments: departmentId,
    status: 'active',
    start_date: { $lte: new Date() },
    end_date: { $gte: new Date() },
  })
    .populate('created_by', 'name')
    .select('title description type start_date end_date questions')
    .sort({ start_date: -1 });

  // Get user's participation history
  const participationHistory = await Survey.find({
    company_id: companyId,
    target_departments: departmentId,
    'responses.user_id': userId,
  })
    .populate('created_by', 'name')
    .select('title type start_date end_date completion_date')
    .sort({ completion_date: -1 })
    .limit(10);

  // Get adaptive questionnaires (AI-tailored questions for this user)
  const adaptiveQuestionnaires = await getAdaptiveQuestionnaires(
    userId,
    departmentId
  );

  // Get microclimate participation history
  const microclimateHistory = await getMicroclimateHistory(
    userId,
    departmentId
  );

  // Get personal insights (if enabled by permissions)
  const personalInsights = await getPersonalInsights(userId);

  // Calculate user engagement metrics
  const engagementMetrics = {
    surveys_completed: participationHistory.length,
    completion_rate: calculateUserCompletionRate(
      userId,
      assignedSurveys.length
    ),
    avg_response_time: Math.random() * 5 + 1, // Mock data: 1-6 days
    participation_streak: Math.floor(Math.random() * 10) + 1, // Mock data
    last_activity: user.last_login || new Date(),
  };

  // Get upcoming deadlines
  const upcomingDeadlines = assignedSurveys
    .filter((survey) => new Date(survey.end_date) > new Date())
    .map((survey) => ({
      survey_id: survey._id,
      title: survey.title,
      type: survey.type,
      end_date: survey.end_date,
      days_remaining: Math.ceil(
        (new Date(survey.end_date).getTime() - new Date().getTime()) /
          (1000 * 60 * 60 * 24)
      ),
    }))
    .sort((a, b) => a.days_remaining - b.days_remaining);

  return NextResponse.json({
    user: {
      name: user.name,
      email: user.email,
      department: (user.department_id as any)?.name,
      company: (user.company_id as any)?.name,
      role: user.role,
    },
    engagementMetrics,
    assignedSurveys,
    participationHistory,
    adaptiveQuestionnaires,
    microclimateHistory,
    personalInsights,
    upcomingDeadlines,
  });
});

async function getAdaptiveQuestionnaires(userId: string, departmentId: string) {
  // Mock adaptive questionnaires - in real implementation,
  // this would fetch AI-tailored questions based on user profile
  return [
    {
      id: '1',
      title: 'Weekly Team Pulse Check',
      description: 'Quick 5-minute survey about your team experience this week',
      type: 'adaptive_pulse',
      estimated_time: 5,
      questions_count: 8,
      ai_adapted: true,
      adaptation_reason: 'Tailored based on your role and recent team changes',
      due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      priority: 'medium',
    },
    {
      id: '2',
      title: 'Personal Development Check-in',
      description: 'Questions about your growth and development needs',
      type: 'adaptive_development',
      estimated_time: 10,
      questions_count: 12,
      ai_adapted: true,
      adaptation_reason: 'Customized based on your career stage and interests',
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      priority: 'low',
    },
  ];
}

async function getMicroclimateHistory(userId: string, departmentId: string) {
  // Mock microclimate participation history
  return [
    {
      id: '1',
      title: 'Team Retrospective Session',
      type: 'retrospective',
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      participation_status: 'completed',
      responses_given: 5,
      insights_generated: true,
    },
    {
      id: '2',
      title: 'Project Kickoff Feedback',
      type: 'project_feedback',
      date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      participation_status: 'completed',
      responses_given: 3,
      insights_generated: true,
    },
    {
      id: '3',
      title: 'Monthly Team Mood Check',
      type: 'mood_check',
      date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      participation_status: 'completed',
      responses_given: 4,
      insights_generated: false,
    },
  ];
}

async function getPersonalInsights(userId: string) {
  // Mock personal insights - in real implementation, this would check permissions
  // and return user-specific insights if enabled
  return {
    insights_enabled: true, // This would be based on company/admin settings
    insights: [
      {
        id: '1',
        type: 'strength',
        title: 'Strong Collaboration Skills',
        description:
          'Your responses consistently show high collaboration and teamwork scores',
        confidence: 0.89,
        trend: 'stable',
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
      {
        id: '2',
        type: 'development_area',
        title: 'Work-Life Balance Opportunity',
        description:
          'Consider exploring flexible work arrangements to improve satisfaction',
        confidence: 0.72,
        trend: 'improving',
        created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      },
      {
        id: '3',
        type: 'recommendation',
        title: 'Leadership Development',
        description:
          'Your responses suggest readiness for increased leadership responsibilities',
        confidence: 0.81,
        trend: 'improving',
        created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      },
    ],
  };
}

function calculateUserCompletionRate(
  userId: string,
  totalAssigned: number
): number {
  // Mock completion rate calculation
  if (totalAssigned === 0) return 100;
  const completed = Math.floor(Math.random() * totalAssigned) + 1;
  return (completed / totalAssigned) * 100;
}


