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

    console.log('Generating report data with filters:', report.filters);

    // Generate report data
    const reportData = await ReportService.generateReportData(
      report.filters,
      report.config,
      report.company_id
    );

    console.log('Generated report data:', {
      surveysCount: reportData.surveys.length,
      responsesCount: reportData.responses.length,
      analyticsCount: reportData.analytics.length,
      aiInsightsCount: reportData.ai_insights.length,
      metadata: reportData.metadata,
    });

    return NextResponse.json({
      success: true,
      message: 'Report data generated successfully',
      data: {
        surveysCount: reportData.surveys.length,
        responsesCount: reportData.responses.length,
        analyticsCount: reportData.analytics.length,
        aiInsightsCount: reportData.ai_insights.length,
        metadata: reportData.metadata,
        surveyIds: reportData.surveys.map((s) => s._id),
        responseIds: reportData.responses.map((r) => r._id),
      },
    });
  } catch (error) {
    console.error('Generate report data error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to generate report data',
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
