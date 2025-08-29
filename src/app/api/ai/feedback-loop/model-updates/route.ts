import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  updateAIModels,
  enableContinuousLearning,
  aiFeedbackLoop,
} from '../../../../../lib/ai-feedback-loop';
import { connectDB } from '../../../../../lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      updateType = 'fine_tune',
      modelIds,
      force = false,
      validationThreshold = 0.05,
    } = await request.json();

    // Validate update type
    if (!['retrain', 'fine_tune', 'weight_adjustment'].includes(updateType)) {
      return NextResponse.json(
        {
          error:
            'updateType must be one of: retrain, fine_tune, weight_adjustment',
        },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if user has permission for model updates
    if (
      session.user.role !== 'super_admin' &&
      session.user.role !== 'company_admin'
    ) {
      return NextResponse.json(
        { error: 'Insufficient permissions for model updates' },
        { status: 403 }
      );
    }

    // Perform model updates
    const updateResults = await updateAIModels(
      updateType as 'retrain' | 'fine_tune' | 'weight_adjustment'
    );

    // Filter results by modelIds if specified
    const filteredResults = modelIds
      ? updateResults.filter((result) => modelIds.includes(result.modelId))
      : updateResults;

    // Calculate summary statistics
    const summary = {
      totalUpdates: filteredResults.length,
      successful: filteredResults.filter((r) => r.success).length,
      failed: filteredResults.filter((r) => !r.success).length,
      averageImprovement: this.calculateAverageImprovement(filteredResults),
      significantImprovements: filteredResults.filter((r) =>
        r.improvements.some((imp) => imp.improvement > validationThreshold)
      ).length,
      rollbacksAvailable: filteredResults.filter((r) => r.rollbackAvailable)
        .length,
    };

    // Generate recommendations
    const recommendations = this.generateUpdateRecommendations(
      filteredResults,
      validationThreshold
    );

    return NextResponse.json({
      success: true,
      message: 'Model updates completed',
      results: filteredResults,
      summary,
      recommendations,
      metadata: {
        updateType,
        timestamp: new Date().toISOString(),
        initiatedBy: session.user.id,
        validationThreshold,
      },
    });
  } catch (error) {
    console.error('Model update error:', error);
    return NextResponse.json(
      { error: 'Failed to update AI models' },
      { status: 500 }
    );
  }
}

// Helper function to calculate average improvement
function calculateAverageImprovement(results: any[]): number {
  const successfulResults = results.filter((r) => r.success);
  if (successfulResults.length === 0) return 0;

  const totalImprovement = successfulResults.reduce((sum, result) => {
    const avgImprovement =
      result.improvements.reduce(
        (impSum: number, imp: any) => impSum + imp.improvement,
        0
      ) / result.improvements.length;
    return sum + avgImprovement;
  }, 0);

  return totalImprovement / successfulResults.length;
}

// Helper function to generate update recommendations
function generateUpdateRecommendations(
  results: any[],
  threshold: number
): string[] {
  const recommendations = [];

  const failedUpdates = results.filter((r) => !r.success);
  if (failedUpdates.length > 0) {
    recommendations.push(
      `${failedUpdates.length} model updates failed. Review error logs and retry with different parameters.`
    );
  }

  const significantImprovements = results.filter(
    (r) =>
      r.success &&
      r.improvements.some((imp: any) => imp.improvement > threshold * 2)
  );
  if (significantImprovements.length > 0) {
    recommendations.push(
      `${significantImprovements.length} models showed significant improvement. Consider deploying these updates to production.`
    );
  }

  const minimalImprovements = results.filter(
    (r) =>
      r.success &&
      r.improvements.every((imp: any) => imp.improvement < threshold)
  );
  if (minimalImprovements.length > 0) {
    recommendations.push(
      `${minimalImprovements.length} models showed minimal improvement. Consider collecting more training data or adjusting parameters.`
    );
  }

  const rollbackCandidates = results.filter(
    (r) =>
      r.success &&
      r.improvements.some((imp: any) => imp.improvement < -threshold)
  );
  if (rollbackCandidates.length > 0) {
    recommendations.push(
      `${rollbackCandidates.length} models may have degraded performance. Consider rolling back these updates.`
    );
  }

  if (recommendations.length === 0) {
    recommendations.push(
      'All model updates completed successfully with acceptable improvements.'
    );
  }

  return recommendations;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const modelId = searchParams.get('modelId');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status'); // 'successful', 'failed'

    await connectDB();

    // Get feedback loop status to access model update history
    const feedbackLoops = aiFeedbackLoop.getFeedbackLoopStatus() as any[];

    // Extract model update history from feedback loops
    const modelUpdates = [];

    for (const loop of feedbackLoops) {
      if (loop.type === 'model_improvement' && loop.metrics.improvements) {
        loop.metrics.improvements.forEach((improvement: any) => {
          modelUpdates.push({
            modelId: loop.id.replace('_loop', ''),
            timestamp: improvement.timestamp,
            type: improvement.type,
            before: improvement.before,
            after: improvement.after,
            improvement: improvement.improvement,
            description: improvement.description,
            success: improvement.improvement >= 0,
            loopId: loop.id,
          });
        });
      }
    }

    // Sort by timestamp (most recent first)
    modelUpdates.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    // Apply filters
    let filteredUpdates = modelUpdates;

    if (modelId) {
      filteredUpdates = filteredUpdates.filter(
        (update) => update.modelId === modelId
      );
    }

    if (status) {
      const isSuccessful = status === 'successful';
      filteredUpdates = filteredUpdates.filter(
        (update) => update.success === isSuccessful
      );
    }

    // Limit results
    filteredUpdates = filteredUpdates.slice(0, limit);

    // Calculate statistics
    const stats = {
      totalUpdates: modelUpdates.length,
      recentUpdates: filteredUpdates.length,
      successfulUpdates: modelUpdates.filter((u) => u.success).length,
      failedUpdates: modelUpdates.filter((u) => !u.success).length,
      averageImprovement:
        modelUpdates.length > 0
          ? modelUpdates.reduce((sum, u) => sum + u.improvement, 0) /
            modelUpdates.length
          : 0,
      modelBreakdown: getModelBreakdown(modelUpdates),
      recentTrends: getRecentTrends(modelUpdates),
    };

    return NextResponse.json({
      success: true,
      updates: filteredUpdates,
      stats,
    });
  } catch (error) {
    console.error('Model update history error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve model update history' },
      { status: 500 }
    );
  }
}

// Helper function to get model breakdown
function getModelBreakdown(updates: any[]): any {
  const breakdown: Record<string, any> = {};

  updates.forEach((update) => {
    if (!breakdown[update.modelId]) {
      breakdown[update.modelId] = {
        totalUpdates: 0,
        successfulUpdates: 0,
        averageImprovement: 0,
        lastUpdate: null,
      };
    }

    breakdown[update.modelId].totalUpdates++;
    if (update.success) {
      breakdown[update.modelId].successfulUpdates++;
    }

    if (
      !breakdown[update.modelId].lastUpdate ||
      new Date(update.timestamp) >
        new Date(breakdown[update.modelId].lastUpdate)
    ) {
      breakdown[update.modelId].lastUpdate = update.timestamp;
    }
  });

  // Calculate average improvements
  Object.keys(breakdown).forEach((modelId) => {
    const modelUpdates = updates.filter((u) => u.modelId === modelId);
    breakdown[modelId].averageImprovement =
      modelUpdates.length > 0
        ? modelUpdates.reduce((sum, u) => sum + u.improvement, 0) /
          modelUpdates.length
        : 0;
  });

  return breakdown;
}

// Helper function to get recent trends
function getRecentTrends(updates: any[]): any {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recentUpdates = updates.filter(
    (u) => new Date(u.timestamp) > thirtyDaysAgo
  );

  if (recentUpdates.length === 0) {
    return {
      trend: 'no_data',
      updateFrequency: 0,
      averageImprovement: 0,
    };
  }

  const avgImprovement =
    recentUpdates.reduce((sum, u) => sum + u.improvement, 0) /
    recentUpdates.length;
  const updateFrequency = recentUpdates.length / 30; // Updates per day

  let trend = 'stable';
  if (avgImprovement > 0.05) {
    trend = 'improving';
  } else if (avgImprovement < -0.05) {
    trend = 'declining';
  }

  return {
    trend,
    updateFrequency: Math.round(updateFrequency * 100) / 100,
    averageImprovement: Math.round(avgImprovement * 1000) / 1000,
    recentUpdateCount: recentUpdates.length,
  };
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      continuousLearning,
      learningRate,
      updateFrequency,
      validationThreshold,
      rollbackThreshold,
      maxModelVersions,
    } = await request.json();

    await connectDB();

    // Check permissions
    if (
      session.user.role !== 'super_admin' &&
      session.user.role !== 'company_admin'
    ) {
      return NextResponse.json(
        {
          error:
            'Insufficient permissions for continuous learning configuration',
        },
        { status: 403 }
      );
    }

    // Prepare configuration
    const config: any = {};

    if (continuousLearning !== undefined) {
      config.enabled = continuousLearning;
    }
    if (learningRate !== undefined) {
      config.learningRate = learningRate;
    }
    if (updateFrequency !== undefined) {
      config.updateFrequency = updateFrequency;
    }
    if (validationThreshold !== undefined) {
      config.validationThreshold = validationThreshold;
    }
    if (rollbackThreshold !== undefined) {
      config.rollbackThreshold = rollbackThreshold;
    }
    if (maxModelVersions !== undefined) {
      config.maxModelVersions = maxModelVersions;
    }

    // Update continuous learning configuration
    await enableContinuousLearning(config);

    // Get updated configuration
    const updatedConfig = aiFeedbackLoop.getContinuousLearningConfig();

    return NextResponse.json({
      success: true,
      message: 'Continuous learning configuration updated successfully',
      config: updatedConfig,
    });
  } catch (error) {
    console.error('Continuous learning configuration error:', error);
    return NextResponse.json(
      { error: 'Failed to update continuous learning configuration' },
      { status: 500 }
    );
  }
}
