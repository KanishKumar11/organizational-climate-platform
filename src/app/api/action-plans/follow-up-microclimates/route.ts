import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ActionPlan } from '@/models/ActionPlan';
import { Microclimate } from '@/models/Microclimate';
import { User } from '@/models/User';
import { connectDB } from '@/lib/db';
import { canAccessActionPlan } from '@/lib/permissions';
import { v4 as uuidv4 } from 'uuid';

// POST /api/action-plans/follow-up-microclimates - Trigger follow-up microclimates
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const user = await User.findById(session.user.id);
    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const {
      action_plan_id,
      trigger_type, // 'completion', 'milestone', 'stalled', 'manual'
      target_audience = 'assigned', // 'assigned', 'department', 'company'
      custom_questions = [],
      auto_activate = true,
    } = body;

    // Validate action plan exists and user has access
    const actionPlan = await ActionPlan.findById(action_plan_id)
      .populate('assigned_to', 'name email department_id')
      .populate('created_by', 'name email department_id');

    if (!actionPlan) {
      return Response.json({ error: 'Action plan not found' }, { status: 404 });
    }

    if (!canAccessActionPlan(user, actionPlan)) {
      return Response.json({ error: 'Access denied' }, { status: 403 });
    }

    // Calculate progress for context
    const kpiProgress =
      actionPlan.kpis.length > 0
        ? actionPlan.kpis.reduce((sum: number, kpi: any) => {
            const progress =
              kpi.target_value > 0
                ? (kpi.current_value / kpi.target_value) * 100
                : 0;
            return sum + Math.min(100, progress);
          }, 0) / actionPlan.kpis.length
        : 0;

    const qualitativeProgress =
      actionPlan.qualitative_objectives.length > 0
        ? actionPlan.qualitative_objectives.reduce(
            (sum: number, obj: any) => sum + obj.completion_percentage,
            0
          ) / actionPlan.qualitative_objectives.length
        : 0;

    const overallProgress =
      actionPlan.kpis.length > 0 && actionPlan.qualitative_objectives.length > 0
        ? (kpiProgress + qualitativeProgress) / 2
        : kpiProgress || qualitativeProgress;

    // Generate microclimate based on trigger type and progress
    const microclimateName = generateMicroclimateTitle(
      actionPlan.title,
      trigger_type,
      overallProgress
    );
    const questions = generateFollowUpQuestions(
      actionPlan,
      trigger_type,
      overallProgress,
      custom_questions
    );

    // Determine target users
    let targetUsers = [];
    switch (target_audience) {
      case 'assigned':
        targetUsers = actionPlan.assigned_to.map((u: any) => u._id);
        break;
      case 'department':
        if (actionPlan.department_id) {
          const deptUsers = await User.find({
            department_id: actionPlan.department_id,
            is_active: true,
          }).select('_id');
          targetUsers = deptUsers.map((u) => u._id);
        }
        break;
      case 'company':
        const companyUsers = await User.find({
          company_id: actionPlan.company_id,
          is_active: true,
        }).select('_id');
        targetUsers = companyUsers.map((u) => u._id);
        break;
    }

    if (targetUsers.length === 0) {
      return Response.json({ error: 'No target users found' }, { status: 400 });
    }

    // Create the follow-up microclimate
    const microclimate = new Microclimate({
      name: microclimateName,
      description: `Follow-up feedback collection for action plan: ${actionPlan.title}`,
      company_id: actionPlan.company_id,
      department_id: actionPlan.department_id,
      created_by: user._id,
      questions: questions,
      target_users: targetUsers,
      settings: {
        duration_minutes: 15,
        anonymous_responses: true,
        show_live_results: true,
        allow_comments: true,
        auto_close_after_hours: 72,
      },
      status: auto_activate ? 'active' : 'draft',
      metadata: {
        source_type: 'action_plan_follow_up',
        source_id: action_plan_id,
        trigger_type: trigger_type,
        action_plan_progress: Math.round(overallProgress),
        generated_at: new Date(),
      },
      tags: ['follow-up', 'action-plan', trigger_type, actionPlan.priority],
    });

    await microclimate.save();

    // Update action plan to reference the follow-up microclimate
    if (!actionPlan.follow_up_microclimates) {
      actionPlan.follow_up_microclimates = [];
    }
    actionPlan.follow_up_microclimates.push({
      microclimate_id: microclimate._id,
      trigger_type: trigger_type,
      created_at: new Date(),
      progress_at_trigger: Math.round(overallProgress),
    });
    await actionPlan.save();

    // Populate the response
    await microclimate.populate('created_by', 'name email');
    await microclimate.populate('target_users', 'name email');

    return Response.json(
      {
        microclimate,
        message: `Follow-up microclimate created successfully`,
        action_plan_progress: Math.round(overallProgress),
        target_user_count: targetUsers.length,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating follow-up microclimate:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/action-plans/follow-up-microclimates - Get follow-up microclimate suggestions
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const user = await User.findById(session.user.id);
    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const actionPlanId = searchParams.get('action_plan_id');

    if (!actionPlanId) {
      return Response.json(
        { error: 'action_plan_id is required' },
        { status: 400 }
      );
    }

    const actionPlan = await ActionPlan.findById(actionPlanId);
    if (!actionPlan) {
      return Response.json({ error: 'Action plan not found' }, { status: 404 });
    }

    if (!canAccessActionPlan(user, actionPlan)) {
      return Response.json({ error: 'Access denied' }, { status: 403 });
    }

    // Calculate current progress
    const kpiProgress =
      actionPlan.kpis.length > 0
        ? actionPlan.kpis.reduce((sum: number, kpi: any) => {
            const progress =
              kpi.target_value > 0
                ? (kpi.current_value / kpi.target_value) * 100
                : 0;
            return sum + Math.min(100, progress);
          }, 0) / actionPlan.kpis.length
        : 0;

    const qualitativeProgress =
      actionPlan.qualitative_objectives.length > 0
        ? actionPlan.qualitative_objectives.reduce(
            (sum: number, obj: any) => sum + obj.completion_percentage,
            0
          ) / actionPlan.qualitative_objectives.length
        : 0;

    const overallProgress =
      actionPlan.kpis.length > 0 && actionPlan.qualitative_objectives.length > 0
        ? (kpiProgress + qualitativeProgress) / 2
        : kpiProgress || qualitativeProgress;

    // Generate suggestions based on current state
    const suggestions = generateMicroclimateSuggestions(
      actionPlan,
      overallProgress
    );

    return Response.json({
      action_plan: {
        id: actionPlan._id,
        title: actionPlan.title,
        status: actionPlan.status,
        progress: Math.round(overallProgress),
      },
      suggestions,
    });
  } catch (error) {
    console.error('Error getting follow-up suggestions:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper function to generate microclimate title
function generateMicroclimateTitle(
  actionPlanTitle: string,
  triggerType: string,
  progress: number
): string {
  const shortTitle =
    actionPlanTitle.length > 30
      ? actionPlanTitle.substring(0, 30) + '...'
      : actionPlanTitle;

  switch (triggerType) {
    case 'completion':
      return `Follow-up: ${shortTitle} (Completed)`;
    case 'milestone':
      return `Milestone Check: ${shortTitle} (${Math.round(progress)}%)`;
    case 'stalled':
      return `Progress Review: ${shortTitle} (Stalled)`;
    case 'manual':
      return `Feedback Request: ${shortTitle}`;
    default:
      return `Follow-up: ${shortTitle}`;
  }
}

// Helper function to generate follow-up questions
function generateFollowUpQuestions(
  actionPlan: any,
  triggerType: string,
  progress: number,
  customQuestions: any[]
): any[] {
  const questions = [];

  // Add custom questions first
  questions.push(...customQuestions);

  // Generate contextual questions based on trigger type
  switch (triggerType) {
    case 'completion':
      questions.push(
        {
          id: uuidv4(),
          text: `How satisfied are you with the outcomes of "${actionPlan.title}"?`,
          type: 'likert',
          scale: {
            min: 1,
            max: 5,
            labels: [
              'Very Dissatisfied',
              'Dissatisfied',
              'Neutral',
              'Satisfied',
              'Very Satisfied',
            ],
          },
          required: true,
        },
        {
          id: uuidv4(),
          text: 'What worked well during this action plan?',
          type: 'open_ended',
          required: false,
        },
        {
          id: uuidv4(),
          text: 'What could be improved for future action plans?',
          type: 'open_ended',
          required: false,
        }
      );
      break;

    case 'milestone':
      questions.push(
        {
          id: uuidv4(),
          text: `How do you feel about the current progress on "${actionPlan.title}"?`,
          type: 'likert',
          scale: {
            min: 1,
            max: 5,
            labels: [
              'Very Concerned',
              'Concerned',
              'Neutral',
              'Confident',
              'Very Confident',
            ],
          },
          required: true,
        },
        {
          id: uuidv4(),
          text: 'What support do you need to maintain or accelerate progress?',
          type: 'open_ended',
          required: false,
        }
      );
      break;

    case 'stalled':
      questions.push(
        {
          id: uuidv4(),
          text: 'What are the main blockers preventing progress?',
          type: 'multiple_choice',
          options: [
            'Lack of resources',
            'Unclear expectations',
            'Technical challenges',
            'Time constraints',
            'Other priorities',
            'Need more support',
            'Other',
          ],
          multiple_select: true,
          required: true,
        },
        {
          id: uuidv4(),
          text: 'What would help you get back on track?',
          type: 'open_ended',
          required: false,
        }
      );
      break;

    case 'manual':
      questions.push(
        {
          id: uuidv4(),
          text: `How is the "${actionPlan.title}" action plan going from your perspective?`,
          type: 'likert',
          scale: {
            min: 1,
            max: 5,
            labels: ['Very Poorly', 'Poorly', 'Okay', 'Well', 'Very Well'],
          },
          required: true,
        },
        {
          id: uuidv4(),
          text: 'Any feedback or suggestions for this action plan?',
          type: 'open_ended',
          required: false,
        }
      );
      break;
  }

  return questions;
}

// Helper function to generate microclimate suggestions
function generateMicroclimateSuggestions(
  actionPlan: any,
  progress: number
): any[] {
  const suggestions = [];
  const now = new Date();
  const dueDate = new Date(actionPlan.due_date);
  const isOverdue = dueDate < now;
  const daysUntilDue = Math.ceil(
    (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Completion follow-up
  if (actionPlan.status === 'completed') {
    suggestions.push({
      trigger_type: 'completion',
      title: 'Post-Completion Feedback',
      description:
        'Gather feedback on the completed action plan to improve future initiatives',
      priority: 'medium',
      recommended_timing: 'immediate',
      target_audience: 'assigned',
    });
  }

  // Milestone check
  if (progress >= 50 && progress < 100 && actionPlan.status === 'in_progress') {
    suggestions.push({
      trigger_type: 'milestone',
      title: 'Mid-Point Progress Check',
      description:
        'Check in with team members about progress and any needed support',
      priority: 'medium',
      recommended_timing: 'immediate',
      target_audience: 'assigned',
    });
  }

  // Stalled progress
  const lastUpdate =
    actionPlan.progress_updates.length > 0
      ? new Date(
          actionPlan.progress_updates[
            actionPlan.progress_updates.length - 1
          ].update_date
        )
      : new Date(actionPlan.created_at);
  const daysSinceUpdate =
    (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24);

  if (daysSinceUpdate > 14 && actionPlan.status === 'in_progress') {
    suggestions.push({
      trigger_type: 'stalled',
      title: 'Progress Review',
      description: 'Address potential blockers and re-energize the team',
      priority: 'high',
      recommended_timing: 'immediate',
      target_audience: 'assigned',
    });
  }

  // Overdue follow-up
  if (isOverdue && actionPlan.status !== 'completed') {
    suggestions.push({
      trigger_type: 'manual',
      title: 'Overdue Action Plan Review',
      description:
        'Gather feedback on why the action plan is overdue and how to proceed',
      priority: 'high',
      recommended_timing: 'immediate',
      target_audience: 'assigned',
    });
  }

  // Department-wide check (for high-priority items)
  if (actionPlan.priority === 'critical' && progress >= 25) {
    suggestions.push({
      trigger_type: 'manual',
      title: 'Department Impact Assessment',
      description:
        'Assess how this critical action plan is affecting the broader department',
      priority: 'medium',
      recommended_timing: 'within_week',
      target_audience: 'department',
    });
  }

  return suggestions;
}
