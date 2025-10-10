import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Report from '@/models/Report';

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

    console.log('=== REPORT OBJECT DEBUG ===');
    console.log('Report ID:', report._id);
    console.log('Report Title:', report.title);
    console.log('Report Type:', typeof report);
    console.log('Report Keys:', Object.keys(report));
    console.log('Has metadata property:', 'metadata' in report);
    console.log('Has metrics property:', 'metrics' in report);
    console.log('Metadata value:', report.metadata);
    console.log('Metrics value:', report.metrics);
    console.log('Metadata type:', typeof report.metadata);
    console.log('Metrics type:', typeof report.metrics);
    console.log('=== END DEBUG ===');

    return NextResponse.json({
      success: true,
      message: 'Report object debug completed',
      data: {
        reportId: report._id,
        title: report.title,
        hasMetadata: 'metadata' in report,
        hasMetrics: 'metrics' in report,
        metadata: report.metadata,
        metrics: report.metrics,
        allKeys: Object.keys(report),
      },
    });
  } catch (error) {
    console.error('Debug report object error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to debug report object',
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
