import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ActionPlan } from '@/models/ActionPlan';
import { User } from '@/models/User';
import { connectDB } from '@/lib/db';
import { canAccessActionPlan } from '@/lib/permissions';

// GET /api/action-plans/[id]/analytics - Get detailed analytics for action plan
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const actionPlan = await (ActionPlan as any)
      .findById(id)
      .populate('created_by', 'name email')
      .populate('assigned_to', 'name email')
      .populate('progress_updates.updated_by', 'name email');

    if (!actionPlan) {
      return Response.json({ error: 'Action plan not found' }, { status: 404 });
    }

    // Check access permissions
    if (!canAccessActionPlan(user, actionPlan)) {
      return Response.json({ error: 'Access denied' }, { status: 403 });
    }

    // Calculate time analytics
    const now = new Date();
    const createdDate = new Date(actionPlan.created_at);
    const dueDate = new Date(actionPlan.due_date);
    const totalDuration = dueDate.getTime() - createdDate.getTime();
    const timeElapsed = now.getTime() - createdDate.getTime();
    const timeRemaining = dueDate.getTime() - now.getTime();

    const timeProgress = Math.min(
      100,
      Math.max(0, (timeElapsed / totalDuration) * 100)
    );
    const daysElapsed = Math.floor(timeElapsed / (1000 * 60 * 60 * 24));
    const daysRemaining = Math.ceil(timeRemaining / (1000 * 60 * 60 * 24));
    const isOverdue = now > dueDate;

    // Calculate progress analytics
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

    // Progress trend analysis
    const progressHistory = actionPlan.progress_updates
      .map((update: any) => ({
        date: update.update_date,
        kpi_progress:
          update.kpi_updates.length > 0
            ? update.kpi_updates.reduce((sum: number, ku: any) => {
                const kpi = actionPlan.kpis.find(
                  (k: any) => k.id === ku.kpi_id
                );
                if (!kpi) return sum;
                const progress =
                  kpi.target_value > 0
                    ? (ku.new_value / kpi.target_value) * 100
                    : 0;
                return sum + Math.min(100, progress);
              }, 0) / update.kpi_updates.length
            : 0,
        qualitative_progress:
          update.qualitative_updates.length > 0
            ? update.qualitative_updates.reduce(
                (sum: number, qu: any) => sum + qu.completion_percentage,
                0
              ) / update.qualitative_updates.length
            : 0,
      }))
      .sort(
        (a: any, b: any) =>
          new Date(a.date).getTime() - new Date(b.date).getTime()
      );

    // Calculate velocity (progress per day)
    let velocity = 0;
    if (progressHistory.length >= 2) {
      const firstUpdate = progressHistory[0];
      const lastUpdate = progressHistory[progressHistory.length - 1];
      const daysBetween =
        (new Date(lastUpdate.date).getTime() -
          new Date(firstUpdate.date).getTime()) /
        (1000 * 60 * 60 * 24);
      const progressChange =
        (lastUpdate.kpi_progress + lastUpdate.qualitative_progress) / 2 -
        (firstUpdate.kpi_progress + firstUpdate.qualitative_progress) / 2;
      velocity = daysBetween > 0 ? progressChange / daysBetween : 0;
    }

    // Predict completion date based on current velocity
    let predictedCompletionDate = null;
    if (velocity > 0 && overallProgress < 100) {
      const remainingProgress = 100 - overallProgress;
      const daysToComplete = remainingProgress / velocity;
      predictedCompletionDate = new Date(
        now.getTime() + daysToComplete * 24 * 60 * 60 * 1000
      );
    }

    // Risk assessment
    const riskFactors = [];
    let riskLevel = 'low';

    if (isOverdue) {
      riskFactors.push('Action plan is overdue');
      riskLevel = 'critical';
    } else if (daysRemaining <= 3 && overallProgress < 80) {
      riskFactors.push('Deadline approaching with low progress');
      riskLevel = 'high';
    } else if (daysRemaining <= 7 && overallProgress < 50) {
      riskFactors.push('Limited time with moderate progress');
      riskLevel = 'medium';
    }

    if (velocity < 0) {
      riskFactors.push('Negative progress velocity');
      if (riskLevel === 'low') riskLevel = 'medium';
    }

    const daysSinceLastUpdate =
      actionPlan.progress_updates.length > 0
        ? (now.getTime() -
            new Date(
              actionPlan.progress_updates[
                actionPlan.progress_updates.length - 1
              ].update_date
            ).getTime()) /
          (1000 * 60 * 60 * 24)
        : daysElapsed;

    if (daysSinceLastUpdate > 14) {
      riskFactors.push('No recent progress updates');
      if (riskLevel === 'low') riskLevel = 'medium';
    }

    // Performance metrics
    const performanceMetrics = {
      efficiency:
        overallProgress > 0
          ? (overallProgress / Math.max(1, timeProgress)) * 100
          : 0,
      consistency: calculateConsistency(progressHistory),
      engagement: calculateEngagement(
        actionPlan.progress_updates,
        actionPlan.assigned_to.length
      ),
      quality: calculateQuality(actionPlan.progress_updates),
    };

    // Recommendations
    const recommendations = generateRecommendations(
      overallProgress,
      velocity,
      daysRemaining,
      riskLevel,
      performanceMetrics,
      actionPlan
    );

    return Response.json({
      action_plan: {
        id: actionPlan._id,
        title: actionPlan.title,
        status: actionPlan.status,
        priority: actionPlan.priority,
      },
      time_analytics: {
        days_elapsed: daysElapsed,
        days_remaining: daysRemaining,
        time_progress: Math.round(timeProgress),
        is_overdue: isOverdue,
        predicted_completion_date: predictedCompletionDate,
      },
      progress_analytics: {
        overall_progress: Math.round(overallProgress),
        kpi_progress: Math.round(kpiProgress),
        qualitative_progress: Math.round(qualitativeProgress),
        velocity: Math.round(velocity * 100) / 100,
        progress_history: progressHistory,
      },
      risk_assessment: {
        level: riskLevel,
        factors: riskFactors,
        score: calculateRiskScore(riskLevel),
      },
      performance_metrics: {
        efficiency: Math.round(performanceMetrics.efficiency),
        consistency: Math.round(performanceMetrics.consistency),
        engagement: Math.round(performanceMetrics.engagement),
        quality: Math.round(performanceMetrics.quality),
      },
      kpi_breakdown: actionPlan.kpis.map((kpi: any) => ({
        id: kpi.id,
        name: kpi.name,
        progress:
          kpi.target_value > 0
            ? Math.round((kpi.current_value / kpi.target_value) * 100)
            : 0,
        current_value: kpi.current_value,
        target_value: kpi.target_value,
        unit: kpi.unit,
        is_on_track:
          kpi.target_value > 0
            ? kpi.current_value / kpi.target_value >= 0.75
            : false,
      })),
      qualitative_breakdown: actionPlan.qualitative_objectives.map(
        (obj: any) => ({
          id: obj.id,
          description: obj.description,
          completion_percentage: obj.completion_percentage,
          current_status: obj.current_status,
          is_on_track: obj.completion_percentage >= 75,
        })
      ),
      team_analytics: {
        total_assigned: actionPlan.assigned_to.length,
        active_contributors: getActiveContributors(actionPlan.progress_updates),
        update_frequency: calculateUpdateFrequency(actionPlan.progress_updates),
      },
      recommendations,
    });
  } catch (error) {
    console.error('Error fetching action plan analytics:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper function to calculate consistency score
function calculateConsistency(progressHistory: any[]): number {
  if (progressHistory.length < 3) return 50; // Not enough data

  const intervals = [];
  for (let i = 1; i < progressHistory.length; i++) {
    const daysBetween =
      (new Date(progressHistory[i].date).getTime() -
        new Date(progressHistory[i - 1].date).getTime()) /
      (1000 * 60 * 60 * 24);
    intervals.push(daysBetween);
  }

  const avgInterval =
    intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
  const variance =
    intervals.reduce(
      (sum, interval) => sum + Math.pow(interval - avgInterval, 2),
      0
    ) / intervals.length;
  const standardDeviation = Math.sqrt(variance);

  // Lower standard deviation = higher consistency
  const consistencyScore = Math.max(
    0,
    100 - (standardDeviation / avgInterval) * 100
  );
  return consistencyScore;
}

// Helper function to calculate engagement score
function calculateEngagement(
  progressUpdates: any[],
  totalAssigned: number
): number {
  if (progressUpdates.length === 0) return 0;

  const uniqueContributors = new Set(
    progressUpdates.map((update: any) => update.updated_by)
  ).size;
  const participationRate = (uniqueContributors / totalAssigned) * 100;

  const avgUpdatesPerContributor = progressUpdates.length / uniqueContributors;
  const engagementBonus = Math.min(20, avgUpdatesPerContributor * 5);

  return Math.min(100, participationRate + engagementBonus);
}

// Helper function to calculate quality score
function calculateQuality(progressUpdates: any[]): number {
  if (progressUpdates.length === 0) return 0;

  let qualityScore = 0;
  let totalUpdates = 0;

  for (const update of progressUpdates) {
    totalUpdates++;
    let updateQuality = 50; // Base score

    // Bonus for detailed notes
    if (update.overall_notes && update.overall_notes.length > 50) {
      updateQuality += 20;
    }

    // Bonus for KPI updates
    if (update.kpi_updates && update.kpi_updates.length > 0) {
      updateQuality += 15;
    }

    // Bonus for qualitative updates
    if (update.qualitative_updates && update.qualitative_updates.length > 0) {
      updateQuality += 15;
    }

    qualityScore += Math.min(100, updateQuality);
  }

  return qualityScore / totalUpdates;
}

// Helper function to get active contributors
function getActiveContributors(progressUpdates: any[]): number {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentUpdates = progressUpdates.filter(
    (update: any) => new Date(update.update_date) >= thirtyDaysAgo
  );

  return new Set(recentUpdates.map((update: any) => update.updated_by)).size;
}

// Helper function to calculate update frequency
function calculateUpdateFrequency(progressUpdates: any[]): string {
  if (progressUpdates.length < 2) return 'insufficient_data';

  const sortedUpdates = progressUpdates.sort(
    (a: any, b: any) =>
      new Date(a.update_date).getTime() - new Date(b.update_date).getTime()
  );

  const intervals = [];
  for (let i = 1; i < sortedUpdates.length; i++) {
    const daysBetween =
      (new Date(sortedUpdates[i].update_date).getTime() -
        new Date(sortedUpdates[i - 1].update_date).getTime()) /
      (1000 * 60 * 60 * 24);
    intervals.push(daysBetween);
  }

  const avgInterval =
    intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;

  if (avgInterval <= 3) return 'very_frequent';
  if (avgInterval <= 7) return 'frequent';
  if (avgInterval <= 14) return 'regular';
  if (avgInterval <= 30) return 'occasional';
  return 'infrequent';
}

// Helper function to calculate risk score
function calculateRiskScore(riskLevel: string): number {
  switch (riskLevel) {
    case 'low':
      return 25;
    case 'medium':
      return 50;
    case 'high':
      return 75;
    case 'critical':
      return 100;
    default:
      return 0;
  }
}

// Helper function to generate recommendations
function generateRecommendations(
  overallProgress: number,
  velocity: number,
  daysRemaining: number,
  riskLevel: string,
  performanceMetrics: any,
  actionPlan: any
): string[] {
  const recommendations = [];

  // Progress-based recommendations
  if (overallProgress < 25) {
    recommendations.push(
      'Consider breaking down objectives into smaller, more manageable tasks'
    );
    recommendations.push(
      'Schedule immediate team meeting to identify and address blockers'
    );
  } else if (overallProgress < 50) {
    recommendations.push('Increase check-in frequency to maintain momentum');
  } else if (overallProgress >= 90) {
    recommendations.push(
      'Prepare for action plan completion and success documentation'
    );
  }

  // Velocity-based recommendations
  if (velocity <= 0) {
    recommendations.push(
      'Progress has stalled - immediate intervention required'
    );
    recommendations.push(
      'Review current approach and consider alternative strategies'
    );
  } else if (velocity < 2 && daysRemaining < 14) {
    recommendations.push(
      'Current pace may not meet deadline - consider resource reallocation'
    );
  }

  // Time-based recommendations
  if (daysRemaining <= 3 && overallProgress < 80) {
    recommendations.push(
      'Deadline is critical - focus on highest impact activities only'
    );
    recommendations.push('Consider requesting deadline extension if justified');
  } else if (daysRemaining <= 7 && overallProgress < 60) {
    recommendations.push(
      'Prioritize this action plan over other non-critical tasks'
    );
  }

  // Performance-based recommendations
  if (performanceMetrics.engagement < 50) {
    recommendations.push(
      'Low team engagement detected - schedule one-on-one meetings with assigned members'
    );
  }

  if (performanceMetrics.consistency < 40) {
    recommendations.push(
      'Establish regular update schedule to improve consistency'
    );
  }

  if (performanceMetrics.quality < 60) {
    recommendations.push(
      'Encourage more detailed progress updates with specific metrics and notes'
    );
  }

  // Risk-based recommendations
  if (riskLevel === 'critical') {
    recommendations.push(
      'URGENT: This action plan requires immediate leadership attention'
    );
  } else if (riskLevel === 'high') {
    recommendations.push('Schedule escalation meeting with stakeholders');
  }

  // KPI-specific recommendations
  const atRiskKPIs = actionPlan.kpis.filter(
    (kpi: any) =>
      kpi.target_value > 0 && kpi.current_value / kpi.target_value < 0.5
  );

  if (atRiskKPIs.length > 0) {
    recommendations.push(
      `${atRiskKPIs.length} KPI(s) are significantly behind target - review measurement approach`
    );
  }

  return recommendations.slice(0, 8); // Limit to top 8 recommendations
}
