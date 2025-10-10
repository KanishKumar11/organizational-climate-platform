import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Report from '@/models/Report';
import Survey from '@/models/Survey';

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

    // Get the latest survey
    const survey = await Survey.findOne({}).sort({ created_at: -1 });
    if (!survey) {
      return NextResponse.json({
        success: false,
        message: 'No surveys found',
      });
    }

    // Update report filters to include the survey ID
    report.filters.survey_ids = [survey._id.toString()];
    await report.save();

    console.log('Updated report filters:', {
      reportId: report._id,
      surveyId: survey._id,
      filters: report.filters,
    });

    return NextResponse.json({
      success: true,
      message: 'Report filters updated',
      data: {
        reportId: report._id,
        surveyId: survey._id,
        updatedFilters: report.filters,
      },
    });
  } catch (error) {
    console.error('Update report filters error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to update report filters',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
