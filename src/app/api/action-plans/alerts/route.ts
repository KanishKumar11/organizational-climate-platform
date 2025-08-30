import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ActionPlan } from '@/models/ActionPlan';
import { User } from '@/models/User';
import { connectDB } from '@/lib/db';
import { applyDataScoping } from '@/lib/permissions';

// GET /api/action-plans/alerts - Get alerts for action plans
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
    const alertType = searchParams.get('type'); // 'deadline', 'overdue', 'stalled', 'all'

    // Build base query with scoping
    let query: any = {};
    query = applyDataScoping(query, user);

    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const actionPlans = await (ActionPlan as any)
      .find(query)
      .populate('created_by', 'name email')
      .populate('assigned_to', 'name email');

    const alerts = [];

    for (const actionPlan of actionPlans) {
      const dueDate = new Date(actionPlan.due_date);
      const lastUpdate =
        actionPlan.progress_updates.length > 0
          ? new Date(
              actionPlan.progress_updates[
                actionPlan.progress_updates.length - 1
              ].update_date
            )
          : new Date(actionPlan.created_at);

      // Calculate overall progress
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

      // Overdue alerts
      if (
        dueDate < now &&
        actionPlan.status !== 'completed' &&
        actionPlan.status !== 'cancelled'
      ) {
        const daysOverdue = Math.ceil(
          (now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        alerts.push({
          id: `overdue-${actionPlan._id}`,
          type: 'overdue',
          priority: daysOverdue > 7 ? 'critical' : 'high',
          title: 'Action Plan Overdue',
          message: `"${actionPlan.title}" is ${daysOverdue} day${daysOverdue !== 1 ? 's' : ''} overdue`,
          action_plan_id: actionPlan._id,
          action_plan_title: actionPlan.title,
          due_date: actionPlan.due_date,
          assigned_to: actionPlan.assigned_to,
          created_at: now,
          metadata: {
            days_overdue: daysOverdue,
            progress: Math.round(overallProgress),
          },
        });
      }

      // Deadline approaching alerts (3 days)
      if (
        dueDate > now &&
        dueDate <= threeDaysFromNow &&
        actionPlan.status !== 'completed'
      ) {
        const daysUntilDue = Math.ceil(
          (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );
        alerts.push({
          id: `deadline-${actionPlan._id}`,
          type: 'deadline',
          priority: daysUntilDue <= 1 ? 'high' : 'medium',
          title: 'Deadline Approaching',
          message: `"${actionPlan.title}" is due in ${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''}`,
          action_plan_id: actionPlan._id,
          action_plan_title: actionPlan.title,
          due_date: actionPlan.due_date,
          assigned_to: actionPlan.assigned_to,
          created_at: now,
          metadata: {
            days_until_due: daysUntilDue,
            progress: Math.round(overallProgress),
          },
        });
      }

      // Stalled progress alerts (no updates in 30 days for active plans)
      if (actionPlan.status === 'in_progress' && lastUpdate < thirtyDaysAgo) {
        const daysSinceUpdate = Math.ceil(
          (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24)
        );
        alerts.push({
          id: `stalled-${actionPlan._id}`,
          type: 'stalled',
          priority: 'medium',
          title: 'Progress Stalled',
          message: `"${actionPlan.title}" has not been updated in ${daysSinceUpdate} days`,
          action_plan_id: actionPlan._id,
          action_plan_title: actionPlan.title,
          due_date: actionPlan.due_date,
          assigned_to: actionPlan.assigned_to,
          created_at: now,
          metadata: {
            days_since_update: daysSinceUpdate,
            progress: Math.round(overallProgress),
            last_update: lastUpdate,
          },
        });
      }

      // Low progress alerts (less than 25% progress with less than 50% time remaining)
      const totalDuration =
        new Date(actionPlan.due_date).getTime() -
        new Date(actionPlan.created_at).getTime();
      const timeElapsed =
        now.getTime() - new Date(actionPlan.created_at).getTime();
      const timeProgress = (timeElapsed / totalDuration) * 100;

      if (
        actionPlan.status === 'in_progress' &&
        overallProgress < 25 &&
        timeProgress > 50
      ) {
        alerts.push({
          id: `low-progress-${actionPlan._id}`,
          type: 'low_progress',
          priority: 'medium',
          title: 'Low Progress Warning',
          message: `"${actionPlan.title}" is ${Math.round(overallProgress)}% complete with ${Math.round(100 - timeProgress)}% time remaining`,
          action_plan_id: actionPlan._id,
          action_plan_title: actionPlan.title,
          due_date: actionPlan.due_date,
          assigned_to: actionPlan.assigned_to,
          created_at: now,
          metadata: {
            progress: Math.round(overallProgress),
            time_progress: Math.round(timeProgress),
          },
        });
      }

      // Success prediction alerts (high risk of failure)
      const riskScore = calculateRiskScore(
        actionPlan,
        overallProgress,
        timeProgress
      );
      if (riskScore > 0.7 && actionPlan.status === 'in_progress') {
        alerts.push({
          id: `high-risk-${actionPlan._id}`,
          type: 'high_risk',
          priority: riskScore > 0.85 ? 'high' : 'medium',
          title: 'High Risk of Failure',
          message: `"${actionPlan.title}" has a ${Math.round(riskScore * 100)}% risk of not meeting its deadline`,
          action_plan_id: actionPlan._id,
          action_plan_title: actionPlan.title,
          due_date: actionPlan.due_date,
          assigned_to: actionPlan.assigned_to,
          created_at: now,
          metadata: {
            risk_score: riskScore,
            progress: Math.round(overallProgress),
            recommended_actions: generateRiskMitigationActions(
              actionPlan,
              riskScore
            ),
          },
        });
      }
    }

    // Filter by alert type if specified
    const filteredAlerts =
      alertType && alertType !== 'all'
        ? alerts.filter((alert) => alert.type === alertType)
        : alerts;

    // Sort by priority and creation date
    const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    filteredAlerts.sort((a, b) => {
      const priorityDiff =
        (priorityOrder[b.priority as keyof typeof priorityOrder] || 0) -
        (priorityOrder[a.priority as keyof typeof priorityOrder] || 0);
      if (priorityDiff !== 0) return priorityDiff;
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    });

    return Response.json({
      alerts: filteredAlerts,
      summary: {
        total: filteredAlerts.length,
        critical: filteredAlerts.filter((a) => a.priority === 'critical')
          .length,
        high: filteredAlerts.filter((a) => a.priority === 'high').length,
        medium: filteredAlerts.filter((a) => a.priority === 'medium').length,
        low: filteredAlerts.filter((a) => a.priority === 'low').length,
        by_type: {
          overdue: filteredAlerts.filter((a) => a.type === 'overdue').length,
          deadline: filteredAlerts.filter((a) => a.type === 'deadline').length,
          stalled: filteredAlerts.filter((a) => a.type === 'stalled').length,
          low_progress: filteredAlerts.filter((a) => a.type === 'low_progress')
            .length,
          high_risk: filteredAlerts.filter((a) => a.type === 'high_risk')
            .length,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching action plan alerts:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper function to calculate risk score
function calculateRiskScore(
  actionPlan: any,
  overallProgress: number,
  timeProgress: number
): number {
  let riskScore = 0;

  // Progress vs time risk
  const expectedProgress = timeProgress * 0.8; // Expect 80% of time progress
  if (overallProgress < expectedProgress) {
    riskScore += 0.3;
  }

  // Overdue risk
  const now = new Date();
  const dueDate = new Date(actionPlan.due_date);
  if (dueDate < now) {
    riskScore += 0.4;
  }

  // Stalled progress risk
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
  if (daysSinceUpdate > 14) {
    riskScore += 0.2;
  }

  // Priority risk
  if (actionPlan.priority === 'critical') {
    riskScore += 0.1;
  }

  return Math.min(1, riskScore);
}

// Helper function to generate risk mitigation actions
function generateRiskMitigationActions(
  actionPlan: any,
  riskScore: number
): string[] {
  const actions = [];

  if (riskScore > 0.8) {
    actions.push('Schedule immediate review meeting with stakeholders');
    actions.push('Consider reallocating resources or extending deadline');
  }

  if (riskScore > 0.6) {
    actions.push('Increase progress update frequency to weekly');
    actions.push('Identify and remove blockers');
  }

  actions.push('Review and adjust KPI targets if necessary');
  actions.push(
    'Provide additional support or training to assigned team members'
  );

  return actions;
}


