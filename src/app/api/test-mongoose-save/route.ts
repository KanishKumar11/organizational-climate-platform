import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Report from '@/models/Report';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    // Get the latest report
    const report = await Report.findOne({}).sort({ created_at: -1 });
    if (!report) {
      return NextResponse.json({
        success: false,
        message: 'No reports found',
      });
    }

    console.log('Before update:', {
      id: report._id,
      hasMetadata: !!report.metadata,
      hasMetrics: !!report.metrics,
    });

    // Try to update with simple values first
    report.metadata = {
      responseCount: 5,
      totalSurveys: 1,
      totalResponses: 5,
      averageCompletionTime: 300,
    };

    report.metrics = {
      engagementScore: 75.5,
      responseRate: 85.0,
      satisfaction: 8.2,
      completionRate: 95.0,
      participationRate: 80.0,
    };

    await report.save();

    console.log('After save:', {
      id: report._id,
      hasMetadata: !!report.metadata,
      hasMetrics: !!report.metrics,
      metadata: report.metadata,
      metrics: report.metrics,
    });

    // Fetch again to verify persistence
    const savedReport = await Report.findById(report._id).lean();
    console.log('After fetch:', {
      id: savedReport._id,
      hasMetadata: !!savedReport.metadata,
      hasMetrics: !!savedReport.metrics,
      metadata: savedReport.metadata,
      metrics: savedReport.metrics,
    });

    return NextResponse.json({
      success: true,
      message: 'Report updated and verified',
      data: {
        reportId: savedReport._id,
        metadata: savedReport.metadata,
        metrics: savedReport.metrics,
      },
    });
  } catch (error) {
    console.error('Mongoose save test error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to test Mongoose save',
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
