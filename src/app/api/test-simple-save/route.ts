import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Report from '@/models/Report';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    // Create a new report with minimal data first
    const report = new Report({
      title: 'Simple Save Test',
      type: 'survey_analysis',
      company_id: '68d5518a04127f5f884e728d',
      created_by: 'test-user',
      filters: {
        survey_ids: [],
        time_filter: {
          start_date: new Date('2024-01-01'),
          end_date: new Date('2025-12-31'),
        },
      },
      config: {
        include_charts: false,
        include_raw_data: false,
        include_ai_insights: false,
        include_recommendations: false,
      },
      status: 'generating',
      format: 'pdf',
      is_recurring: false,
    });

    console.log('Before save:', {
      id: report._id,
      title: report.title,
      hasMetadata: !!report.metadata,
      hasMetrics: !!report.metrics,
    });

    const savedReport = await report.save();
    console.log('After save:', {
      id: savedReport._id,
      title: savedReport.title,
      hasMetadata: !!savedReport.metadata,
      hasMetrics: !!savedReport.metrics,
      metadata: savedReport.metadata,
      metrics: savedReport.metrics,
    });

    // Now try to update with nested data
    savedReport.metadata = {
      responseCount: 5,
      totalSurveys: 1,
      totalResponses: 5,
      averageCompletionTime: 300,
    };

    savedReport.metrics = {
      engagementScore: 75.5,
      responseRate: 85.0,
      satisfaction: 8.2,
      completionRate: 95.0,
      participationRate: 80.0,
    };

    console.log('Before update save:', {
      id: savedReport._id,
      hasMetadata: !!savedReport.metadata,
      hasMetrics: !!savedReport.metrics,
      metadata: savedReport.metadata,
      metrics: savedReport.metrics,
    });

    const updatedReport = await savedReport.save();
    console.log('After update save:', {
      id: updatedReport._id,
      hasMetadata: !!updatedReport.metadata,
      hasMetrics: !!updatedReport.metrics,
      metadata: updatedReport.metadata,
      metrics: updatedReport.metrics,
    });

    // Fetch again to verify
    const fetchedReport = await Report.findById(updatedReport._id).lean();
    console.log('After fetch:', {
      id: fetchedReport._id,
      hasMetadata: !!fetchedReport.metadata,
      hasMetrics: !!fetchedReport.metrics,
      metadata: fetchedReport.metadata,
      metrics: fetchedReport.metrics,
    });

    return NextResponse.json({
      success: true,
      message: 'Simple save test completed',
      data: {
        reportId: fetchedReport._id,
        title: fetchedReport.title,
        hasMetadata: !!fetchedReport.metadata,
        hasMetrics: !!fetchedReport.metrics,
        metadata: fetchedReport.metadata,
        metrics: fetchedReport.metrics,
      },
    });
  } catch (error) {
    console.error('Simple save test error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to test simple save',
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
