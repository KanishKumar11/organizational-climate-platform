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

    // Update time filter to include 2025
    report.filters.time_filter = {
      start_date: new Date('2024-01-01'),
      end_date: new Date('2025-12-31'),
    };
    await report.save();

    console.log('Updated time filter:', {
      reportId: report._id,
      timeFilter: report.filters.time_filter,
    });

    return NextResponse.json({
      success: true,
      message: 'Time filter updated',
      data: {
        reportId: report._id,
        timeFilter: report.filters.time_filter,
      },
    });
  } catch (error) {
    console.error('Update time filter error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to update time filter',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
