import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Survey from '@/models/Survey';
import Response from '@/models/Response';
import Company from '@/models/Company';
import { ObjectId } from 'mongodb';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    // Get a company ID
    const companies = await Company.find({}).lean();
    if (companies.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No companies found',
      });
    }

    const companyId = companies[0]._id;

    // Create one survey
    const survey = new Survey({
      title: 'Test Survey for Reports',
      description: 'A test survey for report generation',
      type: 'general_climate',
      company_id: companyId,
      created_by: new ObjectId().toString(),
      questions: [
        {
          id: new ObjectId().toString(),
          text: 'How satisfied are you with your role?',
          type: 'rating',
          options: [
            'Very Dissatisfied',
            'Dissatisfied',
            'Neutral',
            'Satisfied',
            'Very Satisfied',
          ],
          scale_min: 1,
          scale_max: 5,
          scale_labels: { min: 'Very Dissatisfied', max: 'Very Satisfied' },
          required: true,
          order: 1,
        },
        {
          id: new ObjectId().toString(),
          text: 'What is your department?',
          type: 'multiple_choice',
          options: ['Engineering', 'Marketing', 'Sales', 'HR'],
          required: true,
          order: 2,
        },
      ],
      start_date: new Date('2024-01-01'),
      end_date: new Date('2024-12-31'),
      status: 'completed',
      target_audience_count: 10,
      settings: {},
    });

    await survey.save();

    // Create some responses
    const responses = [];
    for (let i = 0; i < 5; i++) {
      const response = new Response({
        survey_id: survey._id,
        user_id: new ObjectId().toString(),
        session_id: new ObjectId().toString(),
        company_id: companyId,
        department_id: new ObjectId().toString(),
        responses: [
          {
            question_id: survey.questions[0].id,
            response_value: Math.floor(Math.random() * 5) + 1,
            time_spent_seconds: Math.floor(Math.random() * 60) + 30,
          },
          {
            question_id: survey.questions[1].id,
            response_value: ['Engineering', 'Marketing', 'Sales', 'HR'][
              Math.floor(Math.random() * 4)
            ],
            time_spent_seconds: Math.floor(Math.random() * 30) + 15,
          },
        ],
        total_time_seconds: Math.floor(Math.random() * 300) + 120,
        is_complete: true,
        start_time: new Date(
          Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000
        ), // Last 7 days
        completion_time: new Date(
          Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000
        ),
        ip_address: `192.168.1.${Math.floor(Math.random() * 255)}`,
        user_agent: 'Chrome',
      });
      responses.push(response);
    }

    await Response.insertMany(responses);

    return NextResponse.json({
      success: true,
      message: 'Minimal test data created successfully',
      data: {
        surveyId: survey._id,
        responses: responses.length,
        surveyTitle: survey.title,
      },
    });
  } catch (error) {
    console.error('Minimal seed error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to create minimal test data',
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
