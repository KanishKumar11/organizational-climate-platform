import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Survey from '@/models/Survey';
import Response from '@/models/Response';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Get the latest survey
    const survey = await Survey.findOne({}).sort({ created_at: -1 }).lean();
    if (!survey) {
      return NextResponse.json({
        success: false,
        message: 'No surveys found',
      });
    }

    // Get all responses
    const responses = await Response.find({}).lean();

    console.log('Survey details:', {
      id: survey._id,
      title: survey.title,
      company_id: survey.company_id,
    });

    console.log(
      'Response details:',
      responses.map((r) => ({
        id: r._id,
        survey_id: r.survey_id,
        company_id: r.company_id,
        is_complete: r.is_complete,
        responses_count: r.responses?.length || 0,
      }))
    );

    return NextResponse.json({
      success: true,
      data: {
        survey: {
          id: survey._id,
          title: survey.title,
          company_id: survey.company_id,
        },
        responses: responses.map((r) => ({
          id: r._id,
          survey_id: r.survey_id,
          company_id: r.company_id,
          is_complete: r.is_complete,
          responses_count: r.responses?.length || 0,
        })),
      },
    });
  } catch (error) {
    console.error('Check responses error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to check responses',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
