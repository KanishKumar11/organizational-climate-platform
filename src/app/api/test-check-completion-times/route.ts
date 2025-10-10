import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Response from '@/models/Response';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Get all responses
    const responses = await Response.find({}).lean();

    console.log(
      'Response completion times:',
      responses.map((r) => ({
        id: r._id,
        survey_id: r.survey_id,
        completion_time: r.completion_time,
        start_time: r.start_time,
        is_complete: r.is_complete,
      }))
    );

    return NextResponse.json({
      success: true,
      data: {
        responses: responses.map((r) => ({
          id: r._id,
          survey_id: r.survey_id,
          completion_time: r.completion_time,
          start_time: r.start_time,
          is_complete: r.is_complete,
        })),
      },
    });
  } catch (error) {
    console.error('Check completion times error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to check completion times',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
