import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Report from '@/models/Report';
import Survey from '@/models/Survey';
import Response from '@/models/Response';
import Company from '@/models/Company';
import { ObjectId } from 'mongodb';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    // Get a company
    const companies = await Company.find({}).lean();
    if (companies.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No companies found',
      });
    }

    const company = companies[0];

    // Get surveys and responses for this company
    const surveys = await Survey.find({ company_id: company._id }).lean();
    const responses = await Response.find({ company_id: company._id }).lean();

    return NextResponse.json({
      success: true,
      message: 'Data found successfully',
      data: {
        companyId: company._id,
        companyName: company.name,
        surveyCount: surveys.length,
        responseCount: responses.length,
        surveys: surveys.map((s) => ({
          id: s._id,
          title: s.title,
          type: s.type,
          status: s.status,
          targetAudience: s.target_audience_count,
          questionCount: s.questions?.length || 0,
        })),
        responses: responses.map((r) => ({
          id: r._id,
          surveyId: r.survey_id,
          isComplete: r.is_complete,
          responseCount: r.responses?.length || 0,
          totalTime: r.total_time_seconds,
        })),
      },
    });
  } catch (error) {
    console.error('Simple report test error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to test simple report',
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
