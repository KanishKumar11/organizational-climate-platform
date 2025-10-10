import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Survey from '@/models/Survey';
import { ObjectId } from 'mongodb';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    // Get a company ID
    const Company = (await import('@/models/Company')).default;
    const companies = await Company.find({}).lean();
    if (companies.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No companies found',
      });
    }

    const companyId = companies[0]._id;

    // Create a minimal survey
    const survey = new Survey({
      title: 'Test Survey',
      description: 'A test survey',
      type: 'general_climate',
      company_id: companyId,
      created_by: new ObjectId().toString(),
      questions: [
        {
          id: new ObjectId().toString(),
          text: 'How satisfied are you?',
          type: 'rating',
          options: ['Poor', 'Good', 'Excellent'],
          scale_min: 1,
          scale_max: 3,
          required: true,
          order: 1,
        },
      ],
      start_date: new Date('2024-01-01'),
      end_date: new Date('2024-12-31'),
      status: 'draft',
      target_audience_count: 10,
      settings: {},
    });

    await survey.save();

    return NextResponse.json({
      success: true,
      message: 'Test survey created successfully',
      surveyId: survey._id,
    });
  } catch (error) {
    console.error('Test survey creation error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to create test survey',
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
