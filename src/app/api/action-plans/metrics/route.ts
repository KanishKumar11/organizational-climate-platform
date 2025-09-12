import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ActionPlan } from '@/models/ActionPlan';
import { User } from '@/models/User';
import { connectDB } from '@/lib/db';
import { applyDataScoping } from '@/lib/permissions';

// GET /api/action-plans/metrics - Get comprehensive action plan metrics
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
    const timeframe = searchParams.get('timeframe') || '30'; // days
    const departmentId = searchParams.get('department_id');
    const priority = searchParams.get('priority');
    const status = searchParams.get('status');

    // Build base query with scoping
    let query: any = {};
    query = applyDataScoping(query, user);

    // Apply filters
    if (
      departmentId &&
      ['company_admin', 'department_admin'].includes(user.role)
    ) {
      query.department_id = departmentId;
    }
    if (priority) query.priority = priority;
    if (status) query.status = status;

    // Time-based filtering
    const timeframeDate = new Date();
    timeframeDate.setDate(timeframeDate.getDate() - parseInt(timeframe));
    query.created_at = { $gte: timeframeDate };

    const actionPlans = await (ActionPlan as any)
      .find(query)
      .populate('created_by', 'name email')
      .populate('assigned_to', 'name email')
      .populate('progress_updates.updated_by', 'name email');

    // Calculate comprehensive metrics
    const metrics = calculateComprehensiveMetrics(
      actionPlans,
      parseInt(timeframe)
    );

    return Response.json({
      timeframe_days: parseInt(timeframe),
      generated_at: new Date(),
      data_scope: {
        company_id: user.company_id,
        department_id:
          user.role === 'department_admin' ? user.department_id : null,
        total_action_plans: actionPlans.length,
      },
      ...metrics,
    });
  } catch (error) {
    console.error('Error fetching action plan metrics:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function calculateComprehensiveMetrics(
  actionPlans: any[],
  timeframeDays: number
) {
  const now = new Date();

  // Basic counts
  const totalPlans = actionPlans.length;
  const statusCounts = actionPlans.reduce((acc, plan) => {
    acc[plan.status] = (acc[plan.status] || 0) + 1;
    return acc;
  }, {});

  const priorityCounts = actionPlans.reduce((acc, plan) => {
    acc[plan.priority] = (acc[plan.priority] || 0) + 1;
    return acc;
  }, {});

  // Progress metrics
  let totalProgress = 0;
  let totalKPIProgress = 0;
  let totalQualitativeProgress = 0;
  let kpiCount = 0;
  let qualitativeCount = 0;

  // Time metrics
  let overdueCount = 0;
  let atRiskCount = 0;
  let onTrackCount = 0;
  let completedOnTime = 0;
  let completedLate = 0;

  // Performance metrics
  let totalVelocity = 0;
  let velocityCount = 0;
  let totalEfficiency = 0;
  let efficiencyCount = 0;

  // Team metrics
  const teamMembers = new Set();
  const activeContributors = new Set();
  let totalUpdates = 0;

  // KPI metrics
  const kpiMetrics = {
    total_kpis: 0,
    on_track_kpis: 0,
    at_risk_kpis: 0,
    completed_kpis: 0,
    average_kpi_progress: 0,
  };

  for (const plan of actionPlans) {
    // Calculate progress for this plan
    const kpiProgress =
      plan.kpis.length > 0
        ? plan.kpis.reduce((sum: number, kpi: any) => {
            const progress =
              kpi.target_value > 0
                ? (kpi.current_value / kpi.target_value) * 100
                : 0;
            return sum + Math.min(100, progress);
          }, 0) / plan.kpis.length
        : 0;

    const qualitativeProgress =
      plan.qualitative_objectives.length > 0
        ? plan.qualitative_objectives.reduce(
            (sum: number, obj: any) => sum + obj.completion_percentage,
            0
          ) / plan.qualitative_objectives.length
        : 0;

    const overallProgress =
      plan.kpis.length > 0 && plan.qualitative_objectives.length > 0
        ? (kpiProgress + qualitativeProgress) / 2
        : kpiProgress || qualitativeProgress;

    totalProgress += overallProgress;

    if (plan.kpis.length > 0) {
      totalKPIProgress += kpiProgress;
      kpiCount++;
    }

    if (plan.qualitative_objectives.length > 0) {
      totalQualitativeProgress += qualitativeProgress;
      qualitativeCount++;
    }

    // Time analysis
    const dueDate = new Date(plan.due_date);
    const isOverdue = dueDate < now && plan.status !== 'completed';
    const daysUntilDue = Math.ceil(
      (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (isOverdue) {
      overdueCount++;
    } else if (daysUntilDue <= 7 && overallProgress < 50) {
      atRiskCount++;
    } else if (overallProgress >= 75 || plan.status === 'completed') {
      onTrackCount++;
    }

    // Completion timing
    if (plan.status === 'completed') {
      const completedDate =
        plan.progress_updates.length > 0
          ? new Date(
              plan.progress_updates[
                plan.progress_updates.length - 1
              ].update_date
            )
          : new Date(plan.updated_at);

      if (completedDate <= dueDate) {
        completedOnTime++;
      } else {
        completedLate++;
      }
    }

    // Performance calculations
    const createdDate = new Date(plan.created_at);
    const totalDuration = dueDate.getTime() - createdDate.getTime();
    const timeElapsed = now.getTime() - createdDate.getTime();
    const timeProgress = Math.min(
      100,
      Math.max(0, (timeElapsed / totalDuration) * 100)
    );

    if (overallProgress > 0 && timeProgress > 0) {
      const efficiency = (overallProgress / timeProgress) * 100;
      totalEfficiency += efficiency;
      efficiencyCount++;
    }

    // Velocity calculation
    const progressHistory = plan.progress_updates.sort(
      (a: any, b: any) =>
        new Date(a.update_date).getTime() - new Date(b.update_date).getTime()
    );

    if (progressHistory.length >= 2) {
      const firstUpdate = progressHistory[0];
      const lastUpdate = progressHistory[progressHistory.length - 1];
      const daysBetween =
        (new Date(lastUpdate.update_date).getTime() -
          new Date(firstUpdate.update_date).getTime()) /
        (1000 * 60 * 60 * 24);

      if (daysBetween > 0) {
        const velocity = overallProgress / daysBetween;
        totalVelocity += velocity;
        velocityCount++;
      }
    }

    // Team analysis
    for (const member of plan.assigned_to) {
      teamMembers.add(member._id.toString());
    }

    // Count updates and active contributors
    totalUpdates += plan.progress_updates.length;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentUpdates = plan.progress_updates.filter(
      (update: any) => new Date(update.update_date) >= thirtyDaysAgo
    );

    for (const update of recentUpdates) {
      activeContributors.add(update.updated_by.toString());
    }

    // KPI analysis
    kpiMetrics.total_kpis += plan.kpis.length;
    for (const kpi of plan.kpis) {
      const kpiProgress =
        kpi.target_value > 0 ? (kpi.current_value / kpi.target_value) * 100 : 0;
      if (kpiProgress >= 100) {
        kpiMetrics.completed_kpis++;
      } else if (kpiProgress >= 75) {
        kpiMetrics.on_track_kpis++;
      } else if (kpiProgress < 50) {
        kpiMetrics.at_risk_kpis++;
      }
    }
  }

  // Calculate averages
  const averageProgress = totalPlans > 0 ? totalProgress / totalPlans : 0;
  const averageKPIProgress = kpiCount > 0 ? totalKPIProgress / kpiCount : 0;
  const averageQualitativeProgress =
    qualitativeCount > 0 ? totalQualitativeProgress / qualitativeCount : 0;
  const averageVelocity = velocityCount > 0 ? totalVelocity / velocityCount : 0;
  const averageEfficiency =
    efficiencyCount > 0 ? totalEfficiency / efficiencyCount : 0;

  kpiMetrics.average_kpi_progress =
    kpiMetrics.total_kpis > 0
      ? Math.round(
          ((kpiMetrics.on_track_kpis + kpiMetrics.completed_kpis) /
            kpiMetrics.total_kpis) *
            100
        )
      : 0;

  // Calculate trends (compare with previous period)
  const previousPeriodStart = new Date();
  previousPeriodStart.setDate(
    previousPeriodStart.getDate() - timeframeDays * 2
  );
  const previousPeriodEnd = new Date();
  previousPeriodEnd.setDate(previousPeriodEnd.getDate() - timeframeDays);

  const previousPlans = actionPlans.filter((plan: any) => {
    const createdDate = new Date(plan.created_at);
    return (
      createdDate >= previousPeriodStart && createdDate < previousPeriodEnd
    );
  });

  const previousAverageProgress =
    previousPlans.length > 0
      ? previousPlans.reduce((sum: number, plan: any) => {
          const kpiProgress =
            plan.kpis.length > 0
              ? plan.kpis.reduce((kpiSum: number, kpi: any) => {
                  const progress =
                    kpi.target_value > 0
                      ? (kpi.current_value / kpi.target_value) * 100
                      : 0;
                  return kpiSum + Math.min(100, progress);
                }, 0) / plan.kpis.length
              : 0;

          const qualitativeProgress =
            plan.qualitative_objectives.length > 0
              ? plan.qualitative_objectives.reduce(
                  (qualSum: number, obj: any) =>
                    qualSum + obj.completion_percentage,
                  0
                ) / plan.qualitative_objectives.length
              : 0;

          return (
            sum +
            (plan.kpis.length > 0 && plan.qualitative_objectives.length > 0
              ? (kpiProgress + qualitativeProgress) / 2
              : kpiProgress || qualitativeProgress)
          );
        }, 0) / previousPlans.length
      : 0;

  const progressTrend =
    previousAverageProgress > 0
      ? ((averageProgress - previousAverageProgress) /
          previousAverageProgress) *
        100
      : 0;

  // Success predictions
  const successPredictions = generateSuccessPredictions(actionPlans);

  return {
    overview: {
      total_action_plans: totalPlans,
      average_progress: Math.round(averageProgress),
      average_kpi_progress: Math.round(averageKPIProgress),
      average_qualitative_progress: Math.round(averageQualitativeProgress),
      completion_rate:
        totalPlans > 0
          ? Math.round(((statusCounts.completed || 0) / totalPlans) * 100)
          : 0,
      on_time_completion_rate:
        completedOnTime + completedLate > 0
          ? Math.round(
              (completedOnTime / (completedOnTime + completedLate)) * 100
            )
          : 0,
    },
    status_distribution: statusCounts,
    priority_distribution: priorityCounts,
    risk_assessment: {
      overdue: overdueCount,
      at_risk: atRiskCount,
      on_track: onTrackCount,
      risk_percentage:
        totalPlans > 0
          ? Math.round(((overdueCount + atRiskCount) / totalPlans) * 100)
          : 0,
    },
    performance_metrics: {
      average_velocity: Math.round(averageVelocity * 100) / 100,
      average_efficiency: Math.round(averageEfficiency),
      total_updates: totalUpdates,
      updates_per_plan:
        totalPlans > 0
          ? Math.round((totalUpdates / totalPlans) * 100) / 100
          : 0,
    },
    team_metrics: {
      total_team_members: teamMembers.size,
      active_contributors: activeContributors.size,
      engagement_rate:
        teamMembers.size > 0
          ? Math.round((activeContributors.size / teamMembers.size) * 100)
          : 0,
      average_assignments:
        teamMembers.size > 0
          ? Math.round((totalPlans / teamMembers.size) * 100) / 100
          : 0,
    },
    kpi_metrics: kpiMetrics,
    trends: {
      progress_trend: Math.round(progressTrend * 100) / 100,
      trend_direction:
        progressTrend > 5
          ? 'improving'
          : progressTrend < -5
            ? 'declining'
            : 'stable',
      previous_period_progress: Math.round(previousAverageProgress),
      current_period_progress: Math.round(averageProgress),
    },
    success_predictions: successPredictions,
    recommendations: generateMetricRecommendations({
      averageProgress,
      overdueCount,
      atRiskCount,
      totalPlans,
      averageEfficiency,
      averageVelocity,
      engagementRate:
        teamMembers.size > 0
          ? (activeContributors.size / teamMembers.size) * 100
          : 0,
    }),
  };
}

function generateSuccessPredictions(actionPlans: any[]) {
  const now = new Date();
  const predictions = {
    likely_to_succeed: 0,
    at_risk_of_failure: 0,
    requires_intervention: 0,
    predicted_completion_rate: 0,
  };

  let successfulPredictions = 0;

  for (const plan of actionPlans) {
    if (plan.status === 'completed') continue;

    const dueDate = new Date(plan.due_date);
    const daysUntilDue = Math.ceil(
      (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Calculate current progress
    const kpiProgress =
      plan.kpis.length > 0
        ? plan.kpis.reduce((sum: number, kpi: any) => {
            const progress =
              kpi.target_value > 0
                ? (kpi.current_value / kpi.target_value) * 100
                : 0;
            return sum + Math.min(100, progress);
          }, 0) / plan.kpis.length
        : 0;

    const qualitativeProgress =
      plan.qualitative_objectives.length > 0
        ? plan.qualitative_objectives.reduce(
            (sum: number, obj: any) => sum + obj.completion_percentage,
            0
          ) / plan.qualitative_objectives.length
        : 0;

    const overallProgress =
      plan.kpis.length > 0 && plan.qualitative_objectives.length > 0
        ? (kpiProgress + qualitativeProgress) / 2
        : kpiProgress || qualitativeProgress;

    // Calculate velocity
    let velocity = 0;
    const progressHistory = plan.progress_updates.sort(
      (a: any, b: any) =>
        new Date(a.update_date).getTime() - new Date(b.update_date).getTime()
    );

    if (progressHistory.length >= 2) {
      const firstUpdate = progressHistory[0];
      const lastUpdate = progressHistory[progressHistory.length - 1];
      const daysBetween =
        (new Date(lastUpdate.update_date).getTime() -
          new Date(firstUpdate.update_date).getTime()) /
        (1000 * 60 * 60 * 24);

      if (daysBetween > 0) {
        velocity = overallProgress / daysBetween;
      }
    }

    // Predict success
    let successLikelihood = 0.5; // Base 50%

    // Progress factor
    if (overallProgress > 75) successLikelihood += 0.3;
    else if (overallProgress > 50) successLikelihood += 0.1;
    else if (overallProgress < 25) successLikelihood -= 0.2;

    // Time factor
    if (daysUntilDue > 14) successLikelihood += 0.2;
    else if (daysUntilDue < 0) successLikelihood -= 0.4;
    else if (daysUntilDue < 7) successLikelihood -= 0.1;

    // Velocity factor
    if (velocity > 2) successLikelihood += 0.2;
    else if (velocity < 0.5) successLikelihood -= 0.2;

    // Update frequency factor
    const daysSinceLastUpdate =
      plan.progress_updates.length > 0
        ? (now.getTime() -
            new Date(
              plan.progress_updates[
                plan.progress_updates.length - 1
              ].update_date
            ).getTime()) /
          (1000 * 60 * 60 * 24)
        : (now.getTime() - new Date(plan.created_at).getTime()) /
          (1000 * 60 * 60 * 24);

    if (daysSinceLastUpdate <= 7) successLikelihood += 0.1;
    else if (daysSinceLastUpdate > 30) successLikelihood -= 0.2;

    successLikelihood = Math.max(0, Math.min(1, successLikelihood));

    if (successLikelihood > 0.7) {
      predictions.likely_to_succeed++;
      successfulPredictions++;
    } else if (successLikelihood < 0.4) {
      predictions.at_risk_of_failure++;
      if (successLikelihood < 0.3) {
        predictions.requires_intervention++;
      }
    }
  }

  const activePlans = actionPlans.filter(
    (p) => p.status !== 'completed' && p.status !== 'cancelled'
  ).length;
  predictions.predicted_completion_rate =
    activePlans > 0
      ? Math.round(
          ((successfulPredictions +
            actionPlans.filter((p) => p.status === 'completed').length) /
            actionPlans.length) *
            100
        )
      : 0;

  return predictions;
}

function generateMetricRecommendations(metrics: any): string[] {
  const recommendations = [];

  if (metrics.averageProgress < 30) {
    recommendations.push(
      'Overall progress is critically low - implement immediate intervention strategies'
    );
  } else if (metrics.averageProgress < 50) {
    recommendations.push(
      'Progress is below target - consider increasing support and resources'
    );
  }

  if (metrics.overdueCount > metrics.totalPlans * 0.2) {
    recommendations.push(
      'High number of overdue action plans - review deadline setting and resource allocation'
    );
  }

  if (metrics.atRiskCount > metrics.totalPlans * 0.3) {
    recommendations.push(
      'Many action plans at risk - increase monitoring frequency and provide additional support'
    );
  }

  if (metrics.averageEfficiency < 60) {
    recommendations.push(
      'Low efficiency detected - review resource allocation and remove blockers'
    );
  }

  if (metrics.averageVelocity < 1) {
    recommendations.push(
      'Slow progress velocity - consider breaking down objectives into smaller tasks'
    );
  }

  if (metrics.engagementRate < 50) {
    recommendations.push(
      'Low team engagement - schedule one-on-one meetings and provide additional motivation'
    );
  }

  return recommendations.slice(0, 6); // Limit to top 6 recommendations
}
