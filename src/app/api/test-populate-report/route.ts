import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Report from '@/models/Report';
import { ReportService } from '@/lib/report-service';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    // Get the latest report
    const report = await Report.findOne({}).sort({ created_at: -1 }).lean();
    if (!report) {
      return NextResponse.json({
        success: false,
        message: 'No reports found',
      });
    }

    console.log('Report before population:', {
      id: report._id,
      title: report.title,
      hasMetadata: !!report.metadata,
      hasMetrics: !!report.metrics,
      hasDemographics: !!report.demographics,
      hasInsights: !!report.insights,
      hasRecommendations: !!report.recommendations,
    });

    // Generate report data first
    const reportData = await ReportService.generateReportData(
      report.filters,
      report.config,
      report.company_id
    );

    // Populate the report with data
    await ReportService.populateReportWithData(
      report._id.toString(),
      reportData
    );

    // Fetch the updated report
    const populatedReport = await Report.findById(report._id).lean();

    console.log('Report after population:', {
      id: populatedReport._id,
      title: populatedReport.title,
      hasMetadata: !!populatedReport.metadata,
      hasMetrics: !!populatedReport.metrics,
      hasDemographics: !!populatedReport.demographics,
      hasInsights: !!populatedReport.insights,
      hasRecommendations: !!populatedReport.recommendations,
      metadata: populatedReport.metadata,
      metrics: populatedReport.metrics,
    });

    return NextResponse.json({
      success: true,
      message: 'Report populated successfully',
      data: {
        reportId: populatedReport._id,
        title: populatedReport.title,
        metadata: populatedReport.metadata,
        metrics: populatedReport.metrics,
        demographics: populatedReport.demographics,
        insights: populatedReport.insights,
        recommendations: populatedReport.recommendations,
      },
    });
  } catch (error) {
    console.error('Report population error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to populate report',
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
