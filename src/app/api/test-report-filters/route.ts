import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Report from '@/models/Report';
import Survey from '@/models/Survey';

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

    // Get all surveys
    const surveys = await Survey.find({}).lean();

    console.log('Report filters:', report.filters);
    console.log(
      'Available surveys:',
      surveys.map((s) => ({ id: s._id, title: s.title }))
    );

    return NextResponse.json({
      success: true,
      data: {
        reportId: report._id,
        reportFilters: report.filters,
        availableSurveys: surveys.map((s) => ({ id: s._id, title: s.title })),
      },
    });
  } catch (error) {
    console.error('Report filters check error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to check report filters',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
