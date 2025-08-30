import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { trackKPI, aiFeedbackLoop } from '../../../../../lib/ai-feedback-loop';
import { connectDB } from '../../../../../lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { kpiId, value, source, metadata, companyId } = await request.json();

    // Validate required parameters
    if (!kpiId || value === undefined || !source) {
      return NextResponse.json(
        { error: 'kpiId, value, and source are required' },
        { status: 400 }
      );
    }

    if (typeof value !== 'number') {
      return NextResponse.json(
        { error: 'value must be a number' },
        { status: 400 }
      );
    }

    await connectDB();

    // Add company context to metadata
    const enrichedMetadata = {
      ...metadata,
      companyId,
      userId: session.user.id,
      timestamp: new Date().toISOString(),
    };

    // Track the KPI
    await trackKPI(kpiId, value, source, enrichedMetadata);

    // Get updated tracker data
    const tracker = aiFeedbackLoop.getKPITracker(kpiId) as any;

    return NextResponse.json({
      success: true,
      message: 'KPI tracked successfully',
      tracker: {
        id: tracker.id,
        name: tracker.name,
        category: tracker.category,
        currentValue: tracker.currentValue,
        targetValue: tracker.targetValue,
        trend: tracker.trend,
        changeRate: tracker.changeRate,
        confidence: tracker.confidence,
        recentDataPoints: tracker.dataPoints.slice(-5), // Last 5 points
        predictions: tracker.predictions,
      },
    });
  } catch (error) {
    console.error('KPI tracking error:', error);
    return NextResponse.json({ error: 'Failed to track KPI' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const kpiId = searchParams.get('kpiId');
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '10');

    await connectDB();

    if (kpiId) {
      // Get specific KPI tracker
      try {
        const tracker = aiFeedbackLoop.getKPITracker(kpiId) as any;

        return NextResponse.json({
          success: true,
          tracker: {
            ...tracker,
            dataPoints: tracker.dataPoints.slice(-limit), // Limit data points
          },
        });
      } catch (error) {
        return NextResponse.json(
          { error: 'KPI tracker not found' },
          { status: 404 }
        );
      }
    } else {
      // Get all KPI trackers
      const allTrackers = aiFeedbackLoop.getKPITracker() as any[];

      // Filter by category if specified
      let filteredTrackers = allTrackers;
      if (category) {
        filteredTrackers = allTrackers.filter((t) => t.category === category);
      }

      // Limit data points for each tracker
      const trackersWithLimitedData = filteredTrackers.map((tracker) => ({
        ...tracker,
        dataPoints: tracker.dataPoints.slice(-limit),
      }));

      // Calculate summary statistics
      const summary = {
        totalTrackers: filteredTrackers.length,
        categories: [...new Set(allTrackers.map((t) => t.category))],
        trends: {
          improving: filteredTrackers.filter((t) => t.trend === 'improving')
            .length,
          declining: filteredTrackers.filter((t) => t.trend === 'declining')
            .length,
          stable: filteredTrackers.filter((t) => t.trend === 'stable').length,
        },
        averageConfidence:
          filteredTrackers.length > 0
            ? filteredTrackers.reduce((sum, t) => sum + t.confidence, 0) /
              filteredTrackers.length
            : 0,
        topPerformers: filteredTrackers
          .filter((t) => t.currentValue >= t.targetValue)
          .sort(
            (a, b) =>
              b.currentValue / b.targetValue - a.currentValue / a.targetValue
          )
          .slice(0, 5)
          .map((t) => ({
            id: t.id,
            name: t.name,
            performance: t.currentValue / t.targetValue,
          })),
        needsAttention: filteredTrackers
          .filter(
            (t) =>
              t.currentValue < t.targetValue * 0.8 || t.trend === 'declining'
          )
          .sort(
            (a, b) =>
              a.currentValue / a.targetValue - b.currentValue / b.targetValue
          )
          .slice(0, 5)
          .map((t) => ({
            id: t.id,
            name: t.name,
            performance: t.currentValue / t.targetValue,
            trend: t.trend,
            changeRate: t.changeRate,
          })),
      };

      return NextResponse.json({
        success: true,
        trackers: trackersWithLimitedData,
        summary,
      });
    }
  } catch (error) {
    console.error('KPI retrieval error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve KPI data' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { kpiId, targetValue, name, category } = await request.json();

    // Validate required parameters
    if (!kpiId) {
      return NextResponse.json({ error: 'kpiId is required' }, { status: 400 });
    }

    await connectDB();

    try {
      const tracker = aiFeedbackLoop.getKPITracker(kpiId) as any;

      // Update tracker properties
      if (targetValue !== undefined) {
        tracker.targetValue = targetValue;
      }
      if (name) {
        tracker.name = name;
      }
      if (category) {
        tracker.category = category;
      }

      return NextResponse.json({
        success: true,
        message: 'KPI tracker updated successfully',
        tracker: {
          id: tracker.id,
          name: tracker.name,
          category: tracker.category,
          currentValue: tracker.currentValue,
          targetValue: tracker.targetValue,
          trend: tracker.trend,
          changeRate: tracker.changeRate,
          confidence: tracker.confidence,
        },
      });
    } catch (error) {
      return NextResponse.json(
        { error: 'KPI tracker not found' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('KPI update error:', error);
    return NextResponse.json(
      { error: 'Failed to update KPI tracker' },
      { status: 500 }
    );
  }
}


