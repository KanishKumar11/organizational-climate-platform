import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ActionPlan } from '@/models/ActionPlan';
import { User } from '@/models/User';
import { connectDB } from '@/lib/db';
import { applyDataScoping } from '@/lib/permissions';

// GET /api/action-plans/reports - Generate comprehensive action plan reports
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
    const reportType = searchParams.get('type') || 'summary';
    const timeframe = searchParams.get('timeframe') || '30'; // days
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const departmentId = searchParams.get('department_id');
    const assignedTo = searchParams.get('assigned_to');

    // Build base query with scoping
    let query: any = {};
    query = applyDataScoping(query, user);

    // Apply filters
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (
      departmentId &&
      ['company_admin', 'department_admin'].includes(user.role)
    ) {
      query.department_id = departmentId;
    }
    if (assignedTo) query.assigned_to = { $in: [assignedTo] };

    // Time-based filtering
    const timeframeDate = new Date();
    timeframeDate.setDate(timeframeDate.getDate() - parseInt(timeframe));
    query.created_at = { $gte: timeframeDate };

    const actionPlans = await (ActionPlan as any)
      .find(query)
      .populate('created_by', 'name email')
      .populate('assigned_to', 'name email')
      .populate('progress_updates.updated_by', 'name email')
      .sort({ created_at: -1 });

    let report;

    switch (reportType) {
      case 'summary':
        report = generateSummaryReport(actionPlans, timeframe);
        break;
      case 'detailed':
        report = generateDetailedReport(actionPlans, timeframe);
        break;
      case 'performance':
        report = generatePerformanceReport(actionPlans, timeframe);
        break;
      case 'risk':
        report = generateRiskReport(actionPlans, timeframe);
        break;
      case 'team':
        report = generateTeamReport(actionPlans, timeframe);
        break;
      default:
        report = generateSummaryReport(actionPlans, timeframe);
    }

    return Response.json({
      report_type: reportType,
      timeframe_days: parseInt(timeframe),
      generated_at: new Date(),
      generated_by: {
        id: user._id,
        name: user.name,
        role: user.role,
      },
      data_scope: {
        company_id: user.company_id,
        department_id:
          user.role === 'department_admin' ? user.department_id : null,
        total_action_plans: actionPlans.length,
      },
      ...report,
    });
  } catch (error) {
    console.error('Error generating action plan report:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Generate summary report
function generateSummaryReport(actionPlans: any[], timeframe: string) {
  const now = new Date();

  // Status distribution
  const statusCounts = actionPlans.reduce((acc, plan) => {
    acc[plan.status] = (acc[plan.status] || 0) + 1;
    return acc;
  }, {});

  // Priority distribution
  const priorityCounts = actionPlans.reduce((acc, plan) => {
    acc[plan.priority] = (acc[plan.priority] || 0) + 1;
    return acc;
  }, {});

  // Calculate overall metrics
  let totalProgress = 0;
  let overdueCount = 0;
  let atRiskCount = 0;
  let onTrackCount = 0;

  for (const plan of actionPlans) {
    // Calculate progress
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

    // Check if overdue
    if (new Date(plan.due_date) < now && plan.status !== 'completed') {
      overdueCount++;
    }

    // Risk assessment
    const daysUntilDue = Math.ceil(
      (new Date(plan.due_date).getTime() - now.getTime()) /
        (1000 * 60 * 60 * 24)
    );
    if (daysUntilDue < 0 || (daysUntilDue <= 7 && overallProgress < 50)) {
      atRiskCount++;
    } else if (overallProgress >= 75 || plan.status === 'completed') {
      onTrackCount++;
    }
  }

  const averageProgress =
    actionPlans.length > 0 ? totalProgress / actionPlans.length : 0;

  // Recent activity
  const recentUpdates = actionPlans
    .flatMap((plan) =>
      plan.progress_updates.map((update: any) => ({
        action_plan_id: plan._id,
        action_plan_title: plan.title,
        update_date: update.update_date,
        updated_by: update.updated_by,
      }))
    )
    .sort(
      (a, b) =>
        new Date(b.update_date).getTime() - new Date(a.update_date).getTime()
    )
    .slice(0, 10);

  return {
    summary: {
      total_action_plans: actionPlans.length,
      average_progress: Math.round(averageProgress),
      overdue_count: overdueCount,
      at_risk_count: atRiskCount,
      on_track_count: onTrackCount,
      completion_rate:
        actionPlans.length > 0
          ? Math.round(
              ((statusCounts.completed || 0) / actionPlans.length) * 100
            )
          : 0,
    },
    status_distribution: statusCounts,
    priority_distribution: priorityCounts,
    recent_activity: recentUpdates,
    key_insights: generateKeyInsights(actionPlans, {
      averageProgress,
      overdueCount,
      atRiskCount,
      onTrackCount,
    }),
  };
}

// Generate detailed report
function generateDetailedReport(actionPlans: any[], timeframe: string) {
  const detailedPlans = actionPlans.map((plan) => {
    const now = new Date();
    const dueDate = new Date(plan.due_date);
    const isOverdue = dueDate < now && plan.status !== 'completed';
    const daysUntilDue = Math.ceil(
      (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Calculate progress
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

    // Risk level
    let riskLevel = 'low';
    if (isOverdue) riskLevel = 'critical';
    else if (daysUntilDue <= 3 && overallProgress < 80) riskLevel = 'high';
    else if (daysUntilDue <= 7 && overallProgress < 50) riskLevel = 'medium';

    return {
      id: plan._id,
      title: plan.title,
      description: plan.description,
      status: plan.status,
      priority: plan.priority,
      created_by: plan.created_by,
      assigned_to: plan.assigned_to,
      due_date: plan.due_date,
      created_at: plan.created_at,
      progress: {
        overall: Math.round(overallProgress),
        kpi: Math.round(kpiProgress),
        qualitative: Math.round(qualitativeProgress),
      },
      timeline: {
        days_until_due: daysUntilDue,
        is_overdue: isOverdue,
      },
      risk_level: riskLevel,
      kpis: plan.kpis.map((kpi: any) => ({
        id: kpi.id,
        name: kpi.name,
        current_value: kpi.current_value,
        target_value: kpi.target_value,
        unit: kpi.unit,
        progress:
          kpi.target_value > 0
            ? Math.round((kpi.current_value / kpi.target_value) * 100)
            : 0,
      })),
      qualitative_objectives: plan.qualitative_objectives.map((obj: any) => ({
        id: obj.id,
        description: obj.description,
        completion_percentage: obj.completion_percentage,
        current_status: obj.current_status,
      })),
      recent_updates: plan.progress_updates
        .sort(
          (a: any, b: any) =>
            new Date(b.update_date).getTime() -
            new Date(a.update_date).getTime()
        )
        .slice(0, 3)
        .map((update: any) => ({
          date: update.update_date,
          updated_by: update.updated_by,
          notes: update.overall_notes,
        })),
    };
  });

  return {
    action_plans: detailedPlans,
    total_count: detailedPlans.length,
  };
}

// Generate performance report
function generatePerformanceReport(actionPlans: any[], timeframe: string) {
  const performanceData = actionPlans.map((plan) => {
    const now = new Date();
    const createdDate = new Date(plan.created_at);
    const dueDate = new Date(plan.due_date);
    const totalDuration = dueDate.getTime() - createdDate.getTime();
    const timeElapsed = now.getTime() - createdDate.getTime();
    const timeProgress = Math.min(
      100,
      Math.max(0, (timeElapsed / totalDuration) * 100)
    );

    // Calculate progress
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

    // Calculate efficiency (progress vs time)
    const efficiency =
      overallProgress > 0
        ? (overallProgress / Math.max(1, timeProgress)) * 100
        : 0;

    // Calculate velocity
    const progressHistory = plan.progress_updates.sort(
      (a: any, b: any) =>
        new Date(a.update_date).getTime() - new Date(b.update_date).getTime()
    );

    let velocity = 0;
    if (progressHistory.length >= 2) {
      const firstUpdate = progressHistory[0];
      const lastUpdate = progressHistory[progressHistory.length - 1];
      const daysBetween =
        (new Date(lastUpdate.update_date).getTime() -
          new Date(firstUpdate.update_date).getTime()) /
        (1000 * 60 * 60 * 24);

      if (daysBetween > 0) {
        // Simplified velocity calculation
        velocity = overallProgress / Math.max(1, daysBetween);
      }
    }

    return {
      id: plan._id,
      title: plan.title,
      status: plan.status,
      priority: plan.priority,
      overall_progress: Math.round(overallProgress),
      time_progress: Math.round(timeProgress),
      efficiency: Math.round(efficiency),
      velocity: Math.round(velocity * 100) / 100,
      update_frequency: plan.progress_updates.length,
      team_size: plan.assigned_to.length,
    };
  });

  // Calculate averages
  const avgProgress =
    performanceData.reduce((sum, p) => sum + p.overall_progress, 0) /
      performanceData.length || 0;
  const avgEfficiency =
    performanceData.reduce((sum, p) => sum + p.efficiency, 0) /
      performanceData.length || 0;
  const avgVelocity =
    performanceData.reduce((sum, p) => sum + p.velocity, 0) /
      performanceData.length || 0;

  // Top and bottom performers
  const topPerformers = performanceData
    .sort((a, b) => b.efficiency - a.efficiency)
    .slice(0, 5);

  const bottomPerformers = performanceData
    .sort((a, b) => a.efficiency - b.efficiency)
    .slice(0, 5);

  return {
    performance_summary: {
      average_progress: Math.round(avgProgress),
      average_efficiency: Math.round(avgEfficiency),
      average_velocity: Math.round(avgVelocity * 100) / 100,
      total_action_plans: performanceData.length,
    },
    top_performers: topPerformers,
    bottom_performers: bottomPerformers,
    all_performance_data: performanceData,
  };
}

// Generate risk report
function generateRiskReport(actionPlans: any[], timeframe: string) {
  const now = new Date();
  const riskAnalysis = actionPlans.map((plan) => {
    const dueDate = new Date(plan.due_date);
    const isOverdue = dueDate < now && plan.status !== 'completed';
    const daysUntilDue = Math.ceil(
      (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Calculate progress
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

    // Risk factors
    const riskFactors = [];
    let riskScore = 0;

    if (isOverdue) {
      riskFactors.push('Overdue');
      riskScore += 40;
    } else if (daysUntilDue <= 3 && overallProgress < 80) {
      riskFactors.push('Deadline approaching with low progress');
      riskScore += 30;
    } else if (daysUntilDue <= 7 && overallProgress < 50) {
      riskFactors.push('Limited time with moderate progress');
      riskScore += 20;
    }

    if (overallProgress < 25) {
      riskFactors.push('Very low progress');
      riskScore += 25;
    }

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

    if (daysSinceLastUpdate > 14) {
      riskFactors.push('No recent updates');
      riskScore += 15;
    }

    if (plan.priority === 'critical' && overallProgress < 50) {
      riskFactors.push('Critical priority with low progress');
      riskScore += 20;
    }

    // Risk level
    let riskLevel = 'low';
    if (riskScore >= 60) riskLevel = 'critical';
    else if (riskScore >= 40) riskLevel = 'high';
    else if (riskScore >= 20) riskLevel = 'medium';

    return {
      id: plan._id,
      title: plan.title,
      status: plan.status,
      priority: plan.priority,
      assigned_to: plan.assigned_to,
      due_date: plan.due_date,
      days_until_due: daysUntilDue,
      is_overdue: isOverdue,
      overall_progress: Math.round(overallProgress),
      risk_level: riskLevel,
      risk_score: riskScore,
      risk_factors: riskFactors,
      days_since_last_update: Math.round(daysSinceLastUpdate),
    };
  });

  // Group by risk level
  const riskGroups = {
    critical: riskAnalysis.filter((r) => r.risk_level === 'critical'),
    high: riskAnalysis.filter((r) => r.risk_level === 'high'),
    medium: riskAnalysis.filter((r) => r.risk_level === 'medium'),
    low: riskAnalysis.filter((r) => r.risk_level === 'low'),
  };

  return {
    risk_summary: {
      total_action_plans: riskAnalysis.length,
      critical_risk: riskGroups.critical.length,
      high_risk: riskGroups.high.length,
      medium_risk: riskGroups.medium.length,
      low_risk: riskGroups.low.length,
      overdue_count: riskAnalysis.filter((r) => r.is_overdue).length,
    },
    risk_groups: riskGroups,
    immediate_attention_required: riskGroups.critical
      .concat(riskGroups.high)
      .sort((a, b) => b.risk_score - a.risk_score)
      .slice(0, 10),
  };
}

// Generate team report
function generateTeamReport(actionPlans: any[], timeframe: string) {
  const teamStats = new Map();

  // Collect team member statistics
  for (const plan of actionPlans) {
    for (const member of plan.assigned_to) {
      if (!teamStats.has(member._id)) {
        teamStats.set(member._id, {
          id: member._id,
          name: member.name,
          email: member.email,
          assigned_count: 0,
          completed_count: 0,
          overdue_count: 0,
          total_progress: 0,
          update_count: 0,
          last_activity: null,
        });
      }

      const stats = teamStats.get(member._id);
      stats.assigned_count++;

      if (plan.status === 'completed') {
        stats.completed_count++;
      }

      const now = new Date();
      if (new Date(plan.due_date) < now && plan.status !== 'completed') {
        stats.overdue_count++;
      }

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

      stats.total_progress += overallProgress;

      // Count updates by this member
      const memberUpdates = plan.progress_updates.filter(
        (update: any) => update.updated_by._id === member._id
      );
      stats.update_count += memberUpdates.length;

      // Track last activity
      if (memberUpdates.length > 0) {
        const lastUpdate = memberUpdates.sort(
          (a: any, b: any) =>
            new Date(b.update_date).getTime() -
            new Date(a.update_date).getTime()
        )[0];

        if (
          !stats.last_activity ||
          new Date(lastUpdate.update_date) > new Date(stats.last_activity)
        ) {
          stats.last_activity = lastUpdate.update_date;
        }
      }
    }
  }

  // Convert to array and calculate averages
  const teamData = Array.from(teamStats.values()).map((stats) => ({
    ...stats,
    average_progress:
      stats.assigned_count > 0
        ? Math.round(stats.total_progress / stats.assigned_count)
        : 0,
    completion_rate:
      stats.assigned_count > 0
        ? Math.round((stats.completed_count / stats.assigned_count) * 100)
        : 0,
    updates_per_plan:
      stats.assigned_count > 0
        ? Math.round((stats.update_count / stats.assigned_count) * 100) / 100
        : 0,
  }));

  // Sort by performance
  const topPerformers = teamData
    .sort(
      (a, b) =>
        b.completion_rate - a.completion_rate ||
        b.average_progress - a.average_progress
    )
    .slice(0, 10);

  const mostActive = teamData
    .sort((a, b) => b.update_count - a.update_count)
    .slice(0, 10);

  return {
    team_summary: {
      total_team_members: teamData.length,
      average_assignments:
        teamData.reduce((sum, t) => sum + t.assigned_count, 0) /
          teamData.length || 0,
      average_completion_rate:
        teamData.reduce((sum, t) => sum + t.completion_rate, 0) /
          teamData.length || 0,
      total_updates: teamData.reduce((sum, t) => sum + t.update_count, 0),
    },
    top_performers: topPerformers,
    most_active: mostActive,
    all_team_data: teamData,
  };
}

// Generate key insights
function generateKeyInsights(actionPlans: any[], metrics: any): string[] {
  const insights = [];

  if (metrics.averageProgress < 30) {
    insights.push(
      'Overall progress is significantly below expectations - immediate intervention required'
    );
  } else if (metrics.averageProgress > 80) {
    insights.push('Excellent overall progress - teams are performing well');
  }

  if (metrics.overdueCount > actionPlans.length * 0.2) {
    insights.push(
      `High number of overdue action plans (${metrics.overdueCount}) - review deadline setting and resource allocation`
    );
  }

  if (metrics.atRiskCount > actionPlans.length * 0.3) {
    insights.push(
      'Many action plans are at risk - consider increasing support and monitoring frequency'
    );
  }

  const completedCount = actionPlans.filter(
    (p) => p.status === 'completed'
  ).length;
  if (completedCount > actionPlans.length * 0.7) {
    insights.push(
      'High completion rate indicates effective action plan management'
    );
  }

  const criticalPlans = actionPlans.filter(
    (p) => p.priority === 'critical'
  ).length;
  if (criticalPlans > actionPlans.length * 0.4) {
    insights.push(
      'High proportion of critical priority plans - consider reviewing prioritization criteria'
    );
  }

  return insights.slice(0, 5); // Limit to top 5 insights
}
