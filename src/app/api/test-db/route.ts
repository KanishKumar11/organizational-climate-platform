import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Survey from '@/models/Survey';
import Response from '@/models/Response';
import Company from '@/models/Company';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const surveyCount = await Survey.countDocuments();
    const responseCount = await Response.countDocuments();
    const companyCount = await Company.countDocuments();

    return NextResponse.json({
      success: true,
      data: {
        surveys: surveyCount,
        responses: responseCount,
        companies: companyCount,
      },
    });
  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
