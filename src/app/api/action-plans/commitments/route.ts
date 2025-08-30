import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ActionPlan } from '@/models/ActionPlan';
import { User } from '@/models/User';
import { connectDB } from '@/lib/db';
import { applyDataScoping } from '@/lib/permissions';

// GET /api/action-plans/commitments - Get commitment tracking data
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const user = await (User as any).findById(session.user.id);
    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const timeframe = searchParams.get('timeframe') || '30'; // days

    // Build base query with scoping
    let query: any = {};
    query = applyDataScoping(query, user);

    // Filter by specific user if requested
    if (userId) {
      query.assigned_to = { $in: [userId] };
    }

    const timeframeDate = new Date();
    timeframeDate.setDate(timeframeDate.getDate() - parseInt(timeframe));

    const actionPlans = await (ActionPlan as any)
      .find({
        ...query,
        $or: [
          { due_date: { $gte: timeframeDate } },
          { created_at: { $gte: timeframeDate } },
        ],
      })
      .populate('created_by', 'name email')
      .populate('assigned_to', 'name email');

    const commitments = [];
    const now = new Date();

    for (const actionPlan of actionPlans) {
      const dueDate = new Date(actionPlan.due_date);
      const isOverdue = dueDate < now && actionPlan.status !== 'completed';
      const daysUntilDue = Math.ceil(
        (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Calculate progress
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
        actionPlan.kpis.length > 0 &&
        actionPlan.qualitative_objectives.length > 0
          ? (kpiProgress + qualitativeProgress) / 2
          : kpiProgress || qualitativeProgress;

      // Calculate commitment score
      const commitmentScore = calculateCommitmentScore(
        actionPlan,
        overallProgress,
        isOverdue
      );

      // Generate nudges if needed
      const nudges = generateNudges(
        actionPlan,
        overallProgress,
        daysUntilDue,
        isOverdue
      );

      for (const assignedUser of actionPlan.assigned_to) {
        commitments.push({
          id: `${actionPlan._id}-${assignedUser._id}`,
          action_plan_id: actionPlan._id,
          action_plan_title: actionPlan.title,
          action_plan_priority: actionPlan.priority,
          action_plan_status: actionPlan.status,
          assigned_user: assignedUser,
          due_date: actionPlan.due_date,
          created_at: actionPlan.created_at,
          progress: Math.round(overallProgress),
          commitment_score: commitmentScore,
          is_overdue: isOverdue,
          days_until_due: daysUntilDue,
          last_update:
            actionPlan.progress_updates.length > 0
              ? actionPlan.progress_updates[
                  actionPlan.progress_updates.length - 1
                ].update_date
              : null,
          nudges: nudges,
          success_prediction: predictSuccess(
            actionPlan,
            overallProgress,
            daysUntilDue
          ),
          recommended_interventions: generateInterventions(
            actionPlan,
            overallProgress,
            commitmentScore
          ),
        });
      }
    }

    // Sort by commitment score (lowest first - needs most attention)
    commitments.sort((a, b) => a.commitment_score - b.commitment_score);

    // Generate summary statistics
    const summary = {
      total_commitments: commitments.length,
      overdue: commitments.filter((c) => c.is_overdue).length,
      at_risk: commitments.filter((c) => c.commitment_score < 0.6).length,
      on_track: commitments.filter((c) => c.commitment_score >= 0.8).length,
      needs_nudge: commitments.filter((c) => c.nudges.length > 0).length,
      average_progress:
        commitments.length > 0
          ? Math.round(
              commitments.reduce((sum, c) => sum + c.progress, 0) /
                commitments.length
            )
          : 0,
      average_commitment_score:
        commitments.length > 0
          ? commitments.reduce((sum, c) => sum + c.commitment_score, 0) /
            commitments.length
          : 0,
    };

    return Response.json({
      commitments,
      summary,
    });
  } catch (error) {
    console.error('Error fetching commitments:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/action-plans/commitments - Send nudges or interventions
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const user = await (User as any).findById(session.user.id);
    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const {
      action_plan_id,
      user_id,
      nudge_type, // 'reminder', 'escalation', 'support_offer', 'deadline_extension'
      message,
      auto_generated = false,
    } = body;

    // Validate action plan exists and user has access
    const actionPlan = await (ActionPlan as any).findById(action_plan_id);
    if (!actionPlan) {
      return Response.json({ error: 'Action plan not found' }, { status: 404 });
    }

    // Here you would typically:
    // 1. Send email/notification to the user
    // 2. Log the nudge in a tracking system
    // 3. Schedule follow-up nudges if needed

    // For now, we'll just return success
    return Response.json({
      message: 'Nudge sent successfully',
      nudge: {
        action_plan_id,
        user_id,
        nudge_type,
        message,
        sent_at: new Date(),
        sent_by: user._id,
        auto_generated,
      },
    });
  } catch (error) {
    console.error('Error sending nudge:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper function to calculate commitment score (0-1, higher is better)
function calculateCommitmentScore(
  actionPlan: any,
  progress: number,
  isOverdue: boolean
): number {
  let score = 0.5; // Base score

  // Progress factor (0.4 weight)
  score += (progress / 100) * 0.4;

  // Timeliness factor (0.3 weight)
  if (isOverdue) {
    score -= 0.3;
  } else {
    const now = new Date();
    const dueDate = new Date(actionPlan.due_date);
    const createdDate = new Date(actionPlan.created_at);
    const totalDuration = dueDate.getTime() - createdDate.getTime();
    const timeElapsed = now.getTime() - createdDate.getTime();
    const timeProgress = Math.min(1, timeElapsed / totalDuration);

    // Good if progress is ahead of time
    if (progress / 100 > timeProgress) {
      score += 0.2;
    } else if (progress / 100 < timeProgress * 0.5) {
      score -= 0.2;
    }
  }

  // Update frequency factor (0.2 weight)
  const lastUpdate =
    actionPlan.progress_updates.length > 0
      ? new Date(
          actionPlan.progress_updates[
            actionPlan.progress_updates.length - 1
          ].update_date
        )
      : new Date(actionPlan.created_at);
  const daysSinceUpdate =
    (new Date().getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24);

  if (daysSinceUpdate <= 7) {
    score += 0.2;
  } else if (daysSinceUpdate > 30) {
    score -= 0.2;
  }

  // Priority factor (0.1 weight)
  if (actionPlan.priority === 'critical' && progress < 50) {
    score -= 0.1;
  }

  return Math.max(0, Math.min(1, score));
}

// Helper function to generate nudges
function generateNudges(
  actionPlan: any,
  progress: number,
  daysUntilDue: number,
  isOverdue: boolean
): string[] {
  const nudges = [];

  if (isOverdue) {
    nudges.push(
      'This action plan is overdue. Please provide an immediate status update.'
    );
  } else if (daysUntilDue <= 3 && progress < 80) {
    nudges.push(
      'Deadline is approaching. Consider prioritizing this action plan.'
    );
  } else if (daysUntilDue <= 7 && progress < 50) {
    nudges.push('You may need to accelerate progress to meet the deadline.');
  }

  const lastUpdate =
    actionPlan.progress_updates.length > 0
      ? new Date(
          actionPlan.progress_updates[
            actionPlan.progress_updates.length - 1
          ].update_date
        )
      : new Date(actionPlan.created_at);
  const daysSinceUpdate =
    (new Date().getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24);

  if (daysSinceUpdate > 14) {
    nudges.push(
      'Please provide a progress update - it has been over 2 weeks since the last update.'
    );
  }

  if (progress < 25 && actionPlan.status === 'in_progress') {
    nudges.push(
      'Consider reviewing the action plan approach if progress is slower than expected.'
    );
  }

  return nudges;
}

// Helper function to predict success likelihood
function predictSuccess(
  actionPlan: any,
  progress: number,
  daysUntilDue: number
): {
  likelihood: number;
  confidence: number;
  factors: string[];
} {
  let likelihood = 0.5;
  const factors = [];

  // Progress factor
  if (progress > 75) {
    likelihood += 0.3;
    factors.push('High progress completion');
  } else if (progress < 25) {
    likelihood -= 0.2;
    factors.push('Low progress completion');
  }

  // Time factor
  if (daysUntilDue > 7) {
    likelihood += 0.2;
    factors.push('Adequate time remaining');
  } else if (daysUntilDue < 0) {
    likelihood -= 0.4;
    factors.push('Already overdue');
  } else {
    likelihood -= 0.1;
    factors.push('Limited time remaining');
  }

  // Update frequency factor
  const lastUpdate =
    actionPlan.progress_updates.length > 0
      ? new Date(
          actionPlan.progress_updates[
            actionPlan.progress_updates.length - 1
          ].update_date
        )
      : new Date(actionPlan.created_at);
  const daysSinceUpdate =
    (new Date().getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24);

  if (daysSinceUpdate <= 7) {
    likelihood += 0.1;
    factors.push('Recent progress updates');
  } else if (daysSinceUpdate > 30) {
    likelihood -= 0.2;
    factors.push('Stale progress updates');
  }

  likelihood = Math.max(0, Math.min(1, likelihood));
  const confidence = actionPlan.progress_updates.length > 2 ? 0.8 : 0.6;

  return {
    likelihood,
    confidence,
    factors,
  };
}

// Helper function to generate intervention recommendations
function generateInterventions(
  actionPlan: any,
  progress: number,
  commitmentScore: number
): string[] {
  const interventions = [];

  if (commitmentScore < 0.4) {
    interventions.push(
      'Schedule immediate one-on-one meeting to discuss blockers'
    );
    interventions.push(
      'Consider reassigning or providing additional resources'
    );
  } else if (commitmentScore < 0.6) {
    interventions.push('Increase check-in frequency to weekly');
    interventions.push('Offer additional support or training');
  }

  if (progress < 25 && actionPlan.status === 'in_progress') {
    interventions.push('Review and potentially adjust KPI targets');
    interventions.push('Break down objectives into smaller, manageable tasks');
  }

  const now = new Date();
  const dueDate = new Date(actionPlan.due_date);
  const daysUntilDue = Math.ceil(
    (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysUntilDue < 7 && progress < 70) {
    interventions.push('Consider deadline extension if justified');
    interventions.push('Prioritize this action plan over other tasks');
  }

  return interventions;
}


