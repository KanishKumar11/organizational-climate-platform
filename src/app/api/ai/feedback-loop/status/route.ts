import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { aiFeedbackLoop } from '../../../../../lib/ai-feedback-loop';
import { connectDB } from '../../../../../lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const loopId = searchParams.get('loopId');
    const includeMetrics = searchParams.get('includeMetrics') === 'true';
    const includeKPIs = searchParams.get('includeKPIs') === 'true';
    const includeFeedback = searchParams.get('includeFeedback') === 'true';

    await connectDB();

    let response: any = {
      success: true,
      timestamp: new Date().toISOString(),
    };

    if (loopId) {
      // Get specific feedback loop status
      try {
        const loop = aiFeedbackLoop.getFeedbackLoopStatus(loopId) as any;
        response.loop = {
          id: loop.id,
          name: loop.name,
          type: loop.type,
          status: loop.status,
          frequency: loop.frequency,
          triggers: loop.triggers,
          actions: loop.actions,
          created_at: loop.created_at,
          updated_at: loop.updated_at,
        };

        if (includeMetrics) {
          response.loop.metrics = loop.metrics;
        }
      } catch (error) {
        return NextResponse.json(
          { error: 'Feedback loop not found' },
          { status: 404 }
        );
      }
    } else {
      // Get all feedback loops status
      const allLoops = aiFeedbackLoop.getFeedbackLoopStatus() as any[];

      response.loops = allLoops.map((loop) => ({
        id: loop.id,
        name: loop.name,
        type: loop.type,
        status: loop.status,
        frequency: loop.frequency,
        triggerCount: loop.triggers.length,
        actionCount: loop.actions.length,
        lastExecution: loop.metrics.lastExecution,
        successRate: loop.metrics.successRate,
        executions: loop.metrics.executions,
        created_at: loop.created_at,
        updated_at: loop.updated_at,
        ...(includeMetrics && { metrics: loop.metrics }),
      }));

      // Calculate overall system status
      response.systemStatus = this.calculateSystemStatus(allLoops);
    }

    // Include KPI data if requested
    if (includeKPIs) {
      const allKPIs = aiFeedbackLoop.getKPITracker() as any[];
      response.kpis = {
        total: allKPIs.length,
        byCategory: this.groupKPIsByCategory(allKPIs),
        summary: this.calculateKPISummary(allKPIs),
        recentUpdates: allKPIs
          .filter((kpi) => kpi.dataPoints.length > 0)
          .map((kpi) => ({
            id: kpi.id,
            name: kpi.name,
            currentValue: kpi.currentValue,
            trend: kpi.trend,
            lastUpdate: kpi.dataPoints[kpi.dataPoints.length - 1]?.timestamp,
          }))
          .sort(
            (a, b) =>
              new Date(b.lastUpdate).getTime() -
              new Date(a.lastUpdate).getTime()
          )
          .slice(0, 10),
      };
    }

    // Include feedback data if requested
    if (includeFeedback) {
      const recentFeedback = aiFeedbackLoop.getQualitativeFeedbackInsights(20);
      response.feedback = {
        total: recentFeedback.length,
        recentCount: recentFeedback.filter(
          (f) => f.timestamp > new Date(Date.now() - 24 * 60 * 60 * 1000)
        ).length,
        averageSentiment:
          recentFeedback.length > 0
            ? recentFeedback.reduce((sum, f) => sum + f.sentiment, 0) /
              recentFeedback.length
            : 0,
        sourceDistribution: this.calculateSourceDistribution(recentFeedback),
        processingStatus: {
          processed: recentFeedback.filter((f) => f.processed).length,
          pending: recentFeedback.filter((f) => !f.processed).length,
        },
      };
    }

    // Include continuous learning status
    const learningConfig = aiFeedbackLoop.getContinuousLearningConfig();
    response.continuousLearning = {
      enabled: learningConfig.enabled,
      updateFrequency: learningConfig.updateFrequency,
      learningRate: learningConfig.learningRate,
      validationThreshold: learningConfig.validationThreshold,
      rollbackThreshold: learningConfig.rollbackThreshold,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Feedback loop status error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve feedback loop status' },
      { status: 500 }
    );
  }
}

// Helper function to calculate system status
function calculateSystemStatus(loops: any[]): any {
  const activeLoops = loops.filter((l) => l.status === 'active');
  const pausedLoops = loops.filter((l) => l.status === 'paused');
  const completedLoops = loops.filter((l) => l.status === 'completed');

  const totalExecutions = loops.reduce(
    (sum, l) => sum + l.metrics.executions,
    0
  );
  const averageSuccessRate =
    loops.length > 0
      ? loops.reduce((sum, l) => sum + l.metrics.successRate, 0) / loops.length
      : 0;

  const recentExecutions = loops.filter(
    (l) =>
      l.metrics.lastExecution &&
      new Date(l.metrics.lastExecution) >
        new Date(Date.now() - 24 * 60 * 60 * 1000)
  ).length;

  let overallHealth = 'healthy';
  if (averageSuccessRate < 0.7) {
    overallHealth = 'degraded';
  } else if (averageSuccessRate < 0.5) {
    overallHealth = 'critical';
  }

  return {
    overallHealth,
    totalLoops: loops.length,
    activeLoops: activeLoops.length,
    pausedLoops: pausedLoops.length,
    completedLoops: completedLoops.length,
    totalExecutions,
    averageSuccessRate: Math.round(averageSuccessRate * 100) / 100,
    recentExecutions,
    lastSystemUpdate:
      loops.length > 0
        ? Math.max(...loops.map((l) => new Date(l.updated_at).getTime()))
        : null,
  };
}

// Helper function to group KPIs by category
function groupKPIsByCategory(kpis: any[]): any {
  const grouped = kpis.reduce(
    (acc, kpi) => {
      if (!acc[kpi.category]) {
        acc[kpi.category] = [];
      }
      acc[kpi.category].push({
        id: kpi.id,
        name: kpi.name,
        currentValue: kpi.currentValue,
        targetValue: kpi.targetValue,
        trend: kpi.trend,
        confidence: kpi.confidence,
      });
      return acc;
    },
    {} as Record<string, any[]>
  );

  // Sort each category by current value
  Object.keys(grouped).forEach((category) => {
    grouped[category].sort((a, b) => b.currentValue - a.currentValue);
  });

  return grouped;
}

// Helper function to calculate KPI summary
function calculateKPISummary(kpis: any[]): any {
  if (kpis.length === 0) {
    return {
      totalKPIs: 0,
      onTarget: 0,
      belowTarget: 0,
      averageConfidence: 0,
      trends: { improving: 0, declining: 0, stable: 0 },
    };
  }

  const onTarget = kpis.filter(
    (kpi) => kpi.currentValue >= kpi.targetValue
  ).length;
  const belowTarget = kpis.filter(
    (kpi) => kpi.currentValue < kpi.targetValue
  ).length;
  const averageConfidence =
    kpis.reduce((sum, kpi) => sum + kpi.confidence, 0) / kpis.length;

  const trends = {
    improving: kpis.filter((kpi) => kpi.trend === 'improving').length,
    declining: kpis.filter((kpi) => kpi.trend === 'declining').length,
    stable: kpis.filter((kpi) => kpi.trend === 'stable').length,
  };

  return {
    totalKPIs: kpis.length,
    onTarget,
    belowTarget,
    averageConfidence: Math.round(averageConfidence * 100) / 100,
    trends,
  };
}

// Helper function to calculate source distribution
function calculateSourceDistribution(feedback: any[]): any {
  return feedback.reduce(
    (acc, f) => {
      acc[f.source] = (acc[f.source] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, loopId, parameters } = await request.json();

    // Validate required parameters
    if (!action) {
      return NextResponse.json(
        { error: 'action is required' },
        { status: 400 }
      );
    }

    if (!['execute', 'pause', 'resume', 'reset'].includes(action)) {
      return NextResponse.json(
        { error: 'action must be one of: execute, pause, resume, reset' },
        { status: 400 }
      );
    }

    await connectDB();

    // Check permissions
    if (
      session.user.role !== 'super_admin' &&
      session.user.role !== 'company_admin'
    ) {
      return NextResponse.json(
        { error: 'Insufficient permissions for feedback loop control' },
        { status: 403 }
      );
    }

    let result: any = {
      success: true,
      action,
      timestamp: new Date().toISOString(),
      initiatedBy: session.user.id,
    };

    switch (action) {
      case 'execute':
        if (loopId) {
          // Execute specific loop
          await aiFeedbackLoop.executeFeedbackLoop(loopId);
          result.message = `Feedback loop ${loopId} executed successfully`;
          result.loopId = loopId;
        } else {
          // Execute all active loops
          await aiFeedbackLoop.executeAllLoops();
          result.message = 'All active feedback loops executed successfully';
        }
        break;

      case 'pause':
        if (!loopId) {
          return NextResponse.json(
            { error: 'loopId is required for pause action' },
            { status: 400 }
          );
        }

        const loopToPause = aiFeedbackLoop.getFeedbackLoopStatus(loopId) as any;
        loopToPause.status = 'paused';
        loopToPause.updated_at = new Date();

        result.message = `Feedback loop ${loopId} paused successfully`;
        result.loopId = loopId;
        break;

      case 'resume':
        if (!loopId) {
          return NextResponse.json(
            { error: 'loopId is required for resume action' },
            { status: 400 }
          );
        }

        const loopToResume = aiFeedbackLoop.getFeedbackLoopStatus(
          loopId
        ) as any;
        loopToResume.status = 'active';
        loopToResume.updated_at = new Date();

        result.message = `Feedback loop ${loopId} resumed successfully`;
        result.loopId = loopId;
        break;

      case 'reset':
        if (!loopId) {
          return NextResponse.json(
            { error: 'loopId is required for reset action' },
            { status: 400 }
          );
        }

        const loopToReset = aiFeedbackLoop.getFeedbackLoopStatus(loopId) as any;
        loopToReset.metrics = {
          executions: 0,
          successRate: 0,
          averageExecutionTime: 0,
          lastExecution: new Date(),
          improvements: [],
          performance: loopToReset.metrics.performance, // Keep performance metrics
        };
        loopToReset.updated_at = new Date();

        result.message = `Feedback loop ${loopId} metrics reset successfully`;
        result.loopId = loopId;
        break;
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Feedback loop control error:', error);
    return NextResponse.json(
      { error: `Failed to control feedback loop` },
      { status: 500 }
    );
  }
}
