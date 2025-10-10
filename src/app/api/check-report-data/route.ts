import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Report from '@/models/Report';

export async function GET(request: NextRequest) {
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

    return NextResponse.json({
      success: true,
      message: 'Report data retrieved successfully',
      data: {
        reportId: report._id,
        title: report.title,
        metadata: report.metadata,
        metrics: report.metrics,
        demographics: report.demographics,
        insights: report.insights,
        recommendations: report.recommendations,
        dateRange: report.dateRange,
        sections: report.sections,
        // Show the raw report object to debug
        rawReport: report,
      },
    });
  } catch (error) {
    console.error('Check report data error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to check report data',
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
