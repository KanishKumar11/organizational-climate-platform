import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Survey from '@/models/Survey';
import Response from '@/models/Response';
import Company from '@/models/Company';
import { ObjectId } from 'mongodb';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const url = new URL(request.url);
    const force = url.searchParams.get('force') === 'true';

    // Check if data already exists
    const existingSurveys = await Survey.countDocuments();
    const existingResponses = await Response.countDocuments();

    if ((existingSurveys > 0 || existingResponses > 0) && !force) {
      return NextResponse.json({
        success: false,
        message:
          'Survey data already exists. Use force=true to clear and reseed.',
        existing: { surveys: existingSurveys, responses: existingResponses },
      });
    }

    // Clear existing data if force is true
    if (force) {
      await Response.deleteMany({});
      await Survey.deleteMany({});
    }

    // Get company IDs from existing companies
    const companies = await Company.find({}).lean();
    if (companies.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No companies found. Please run company seeding first.',
      });
    }

    const techCorpId = companies.find((c) => c.domain === 'techcorp.com')?._id;
    const innovateLabsId = companies.find(
      (c) => c.domain === 'innovatelabs.io'
    )?._id;

    if (!techCorpId || !innovateLabsId) {
      return NextResponse.json({
        success: false,
        message:
          'Required companies not found. Please run comprehensive seeding first.',
      });
    }

    // Create sample questions
    const questions = [
      {
        id: new ObjectId().toString(),
        text: 'How satisfied are you with your current role?',
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
        category: 'job_satisfaction',
        order: 1,
      },
      {
        id: new ObjectId().toString(),
        text: 'How would you rate the communication within your team?',
        type: 'rating',
        options: ['Poor', 'Below Average', 'Average', 'Good', 'Excellent'],
        scale_min: 1,
        scale_max: 5,
        scale_labels: { min: 'Poor', max: 'Excellent' },
        required: true,
        category: 'communication',
        order: 2,
      },
      {
        id: new ObjectId().toString(),
        text: 'How likely are you to recommend this company as a place to work?',
        type: 'rating',
        options: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
        scale_min: 0,
        scale_max: 10,
        scale_labels: { min: 'Not at all likely', max: 'Extremely likely' },
        required: true,
        category: 'engagement',
        order: 3,
      },
      {
        id: new ObjectId().toString(),
        text: 'What is your department?',
        type: 'multiple_choice',
        options: [
          'Engineering',
          'Marketing',
          'Sales',
          'Human Resources',
          'Customer Support',
        ],
        required: true,
        category: 'demographics',
        order: 4,
      },
      {
        id: new ObjectId().toString(),
        text: 'How would you rate your work-life balance?',
        type: 'rating',
        options: ['Poor', 'Below Average', 'Average', 'Good', 'Excellent'],
        scale_min: 1,
        scale_max: 5,
        scale_labels: { min: 'Poor', max: 'Excellent' },
        required: true,
        category: 'work_life_balance',
        order: 5,
      },
    ];

    // Create surveys
    const surveys = [
      {
        _id: new ObjectId().toString(),
        title: 'Q4 2024 Employee Engagement Survey',
        description: 'Quarterly employee engagement and satisfaction survey',
        type: 'general_climate',
        company_id: techCorpId,
        created_by: new ObjectId().toString(),
        questions: questions,
        target_audience_count: 150,
        start_date: new Date('2024-10-01'),
        end_date: new Date('2024-12-31'),
        status: 'completed',
        settings: {
          anonymous: false,
          allow_partial_responses: true,
          randomize_questions: false,
          show_progress: true,
          auto_save: true,
          notification_settings: {
            send_invitations: true,
            send_reminders: true,
            reminder_frequency_days: 7,
          },
        },
        is_active: true,
      },
      {
        _id: new ObjectId().toString(),
        title: 'Team Communication Assessment',
        description: 'Assessment of team communication effectiveness',
        type: 'microclimate',
        company_id: techCorpId,
        created_by: new ObjectId().toString(),
        questions: questions.slice(0, 3),
        target_audience_count: 75,
        start_date: new Date('2024-11-01'),
        end_date: new Date('2024-11-30'),
        status: 'active',
        settings: {
          anonymous_responses: true,
          allow_multiple_responses: false,
          reminder_frequency: 'bi_weekly',
          auto_close: true,
        },
        is_active: true,
      },
      {
        _id: new ObjectId().toString(),
        title: 'Research Team Climate Survey',
        description: 'Climate assessment for research and development teams',
        type: 'organizational_culture',
        company_id: innovateLabsId,
        created_by: new ObjectId().toString(),
        questions: questions,
        target_audience_count: 50,
        start_date: new Date('2024-09-01'),
        end_date: new Date('2024-12-31'),
        status: 'completed',
        settings: {
          anonymous_responses: false,
          allow_multiple_responses: false,
          reminder_frequency: 'monthly',
          auto_close: true,
        },
        is_active: true,
      },
    ];

    await Survey.insertMany(surveys);

    // Create responses
    const responses = [];

    // Generate responses for TechCorp surveys
    const techCorpSurvey = surveys[0];
    const techCorpCommSurvey = surveys[1];

    // Generate 120 responses for main survey (80% response rate)
    for (let i = 0; i < 120; i++) {
      const response = {
        _id: new ObjectId().toString(),
        survey_id: techCorpSurvey._id,
        user_id: new ObjectId().toString(),
        session_id: new ObjectId().toString(),
        company_id: techCorpId,
        department_id: new ObjectId().toString(),
        responses: [
          {
            question_id: questions[0].id,
            response_value: Math.floor(Math.random() * 5) + 1,
            response_text: null,
            time_spent_seconds: Math.floor(Math.random() * 300) + 30,
          },
          {
            question_id: questions[1].id,
            response_value: Math.floor(Math.random() * 5) + 1,
            response_text: null,
            time_spent_seconds: Math.floor(Math.random() * 200) + 20,
          },
          {
            question_id: questions[2].id,
            response_value: Math.floor(Math.random() * 11),
            response_text: null,
            time_spent_seconds: Math.floor(Math.random() * 250) + 25,
          },
          {
            question_id: questions[3].id,
            response_value: [
              'Engineering',
              'Marketing',
              'Sales',
              'Human Resources',
              'Customer Support',
            ][Math.floor(Math.random() * 5)],
            response_text: null,
            time_spent_seconds: Math.floor(Math.random() * 150) + 15,
          },
          {
            question_id: questions[4].id,
            response_value: Math.floor(Math.random() * 5) + 1,
            response_text: null,
            time_spent_seconds: Math.floor(Math.random() * 200) + 20,
          },
        ],
        total_time_seconds: Math.floor(Math.random() * 600) + 180,
        is_complete: true,
        start_time: new Date(
          Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
        ),
        completion_time: new Date(
          Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
        ),
        ip_address: `192.168.1.${Math.floor(Math.random() * 255)}`,
        user_agent: ['Chrome', 'Firefox', 'Safari', 'Edge'][
          Math.floor(Math.random() * 4)
        ],
      };
      responses.push(response);
    }

    // Generate 60 responses for communication survey
    for (let i = 0; i < 60; i++) {
      const response = {
        _id: new ObjectId().toString(),
        survey_id: techCorpCommSurvey._id,
        user_id: new ObjectId().toString(),
        session_id: new ObjectId().toString(),
        company_id: techCorpId,
        department_id: new ObjectId().toString(),
        responses: [
          {
            question_id: questions[0].id,
            response_value: Math.floor(Math.random() * 5) + 1,
            response_text: null,
            time_spent_seconds: Math.floor(Math.random() * 300) + 30,
          },
          {
            question_id: questions[1].id,
            response_value: Math.floor(Math.random() * 5) + 1,
            response_text: null,
            time_spent_seconds: Math.floor(Math.random() * 200) + 20,
          },
          {
            question_id: questions[2].id,
            response_value: Math.floor(Math.random() * 11),
            response_text: null,
            time_spent_seconds: Math.floor(Math.random() * 250) + 25,
          },
        ],
        completion_time: Math.floor(Math.random() * 400) + 120,
        is_complete: true,
        started_at: new Date(
          Date.now() - Math.random() * 15 * 24 * 60 * 60 * 1000
        ),
        completed_at: new Date(
          Date.now() - Math.random() * 15 * 24 * 60 * 60 * 1000
        ),
        ip_address: `192.168.1.${Math.floor(Math.random() * 255)}`,
        user_agent: ['Chrome', 'Firefox', 'Safari', 'Edge'][
          Math.floor(Math.random() * 4)
        ],
      };
      responses.push(response);
    }

    // Generate responses for Innovate Labs survey
    const innovateLabsSurvey = surveys[2];
    for (let i = 0; i < 40; i++) {
      const response = {
        _id: new ObjectId().toString(),
        survey_id: innovateLabsSurvey._id,
        user_id: new ObjectId().toString(),
        company_id: innovateLabsId,
        department_id: new ObjectId().toString(),
        responses: [
          {
            question_id: questions[0].id,
            response_value: Math.floor(Math.random() * 5) + 1,
            response_text: null,
            time_spent_seconds: Math.floor(Math.random() * 300) + 30,
          },
          {
            question_id: questions[1].id,
            response_value: Math.floor(Math.random() * 5) + 1,
            response_text: null,
            time_spent_seconds: Math.floor(Math.random() * 200) + 20,
          },
          {
            question_id: questions[2].id,
            response_value: Math.floor(Math.random() * 11),
            response_text: null,
            time_spent_seconds: Math.floor(Math.random() * 250) + 25,
          },
          {
            question_id: questions[3].id,
            response_value: ['Research', 'Operations'][
              Math.floor(Math.random() * 2)
            ],
            response_text: null,
            time_spent_seconds: Math.floor(Math.random() * 150) + 15,
          },
          {
            question_id: questions[4].id,
            response_value: Math.floor(Math.random() * 5) + 1,
            response_text: null,
            time_spent_seconds: Math.floor(Math.random() * 200) + 20,
          },
        ],
        completion_time: Math.floor(Math.random() * 600) + 180,
        is_complete: true,
        started_at: new Date(
          Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000
        ),
        completed_at: new Date(
          Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000
        ),
        ip_address: `192.168.1.${Math.floor(Math.random() * 255)}`,
        user_agent: ['Chrome', 'Firefox', 'Safari', 'Edge'][
          Math.floor(Math.random() * 4)
        ],
      };
      responses.push(response);
    }

    await Response.insertMany(responses);

    return NextResponse.json({
      success: true,
      message: 'Survey data seeded successfully',
      data: {
        questions: questions.length,
        surveys: surveys.length,
        responses: responses.length,
        summary: {
          'TechCorp Q4 Engagement': 120,
          'TechCorp Communication': 60,
          'Innovate Labs Climate': 40,
          Total: 220,
        },
      },
    });
  } catch (error) {
    console.error('Survey data seeding error:', error);
    console.error(
      'Error stack:',
      error instanceof Error ? error.stack : 'No stack trace'
    );
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to seed survey data',
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
