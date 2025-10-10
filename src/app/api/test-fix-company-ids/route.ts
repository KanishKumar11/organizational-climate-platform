import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Report from '@/models/Report';
import Survey from '@/models/Survey';
import Response from '@/models/Response';

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

    // Get the latest survey
    const survey = await Survey.findOne({}).sort({ created_at: -1 });
    if (!survey) {
      return NextResponse.json({
        success: false,
        message: 'No surveys found',
      });
    }

    // Update survey company_id to match report
    survey.company_id = report.company_id;
    await survey.save();

    // Update all responses company_id to match report
    const responses = await Response.find({});
    for (const response of responses) {
      response.company_id = report.company_id;
      await response.save();
    }

    console.log('Updated company IDs:', {
      reportCompanyId: report.company_id,
      surveyId: survey._id,
      surveyCompanyId: survey.company_id,
      responsesUpdated: responses.length,
    });

    return NextResponse.json({
      success: true,
      message: 'Company IDs updated',
      data: {
        reportCompanyId: report.company_id,
        surveyId: survey._id,
        surveyCompanyId: survey.company_id,
        responsesUpdated: responses.length,
      },
    });
  } catch (error) {
    console.error('Fix company IDs error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fix company IDs',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
