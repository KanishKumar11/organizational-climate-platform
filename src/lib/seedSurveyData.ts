import { connectDB } from './mongodb';
import Survey from '@/models/Survey';
import Response from '@/models/Response';
import { ObjectId } from 'mongodb';

interface SeedOptions {
  force_reset?: boolean;
  verbose?: boolean;
}

interface SeedResults {
  surveys: number;
  responses: number;
  errors: string[];
}

/**
 * Seed survey and response data for testing reports
 */
export async function seedSurveyData(
  options: SeedOptions = {}
): Promise<SeedResults> {
  const { force_reset = false, verbose = false } = options;

  const log = (message: string) => {
    if (verbose) console.log(`[SEED] ${message}`);
  };

  const results: SeedResults = {
    surveys: 0,
    responses: 0,
    errors: [],
  };

  try {
    // Set MongoDB URI if not already set
    if (!process.env.MONGODB_URI) {
      process.env.MONGODB_URI =
        'mongodb://localhost:27017/organizational_climate';
    }
    await connectDB();
    log('Connected to database');

    // Check existing data
    const existingSurveys = await Survey.countDocuments();
    const existingResponses = await Response.countDocuments();

    if ((existingSurveys > 0 || existingResponses > 0) && !force_reset) {
      throw new Error(
        `Survey data already exists. Use force_reset: true to clear and reseed. Found: ${existingSurveys} surveys, ${existingResponses} responses`
      );
    }

    // Clear existing data if force_reset
    if (force_reset) {
      log('Clearing existing survey data...');
      await Response.deleteMany({});
      await Survey.deleteMany({});
      log('Existing survey data cleared');
    }

    // Get company IDs from existing companies
    const Company = (await import('@/models/Company')).default;
    const companies = await Company.find({}).lean();
    if (companies.length === 0) {
      throw new Error('No companies found. Please run company seeding first.');
    }

    const techCorpId = companies.find((c) => c.domain === 'techcorp.com')?._id;
    const innovateLabsId = companies.find(
      (c) => c.domain === 'innovatelabs.io'
    )?._id;

    if (!techCorpId || !innovateLabsId) {
      throw new Error(
        'Required companies not found. Please run comprehensive seeding first.'
      );
    }

    // Create sample questions (embedded in surveys)
    log('Creating sample questions...');
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
      },
    ];

    log(`Created ${questions.length} question templates`);

    // Create surveys
    log('Creating surveys...');
    const surveys = [
      {
        _id: new ObjectId().toString(),
        title: 'Q4 2024 Employee Engagement Survey',
        description: 'Quarterly employee engagement and satisfaction survey',
        type: 'engagement',
        company_id: techCorpId,
        created_by: new ObjectId().toString(), // This would be a real user ID
        questions: questions,
        target_audience_count: 150,
        start_date: new Date('2024-10-01'),
        end_date: new Date('2024-12-31'),
        status: 'completed',
        settings: {
          anonymous_responses: false,
          allow_multiple_responses: false,
          reminder_frequency: 'weekly',
          auto_close: true,
        },
        is_active: true,
      },
      {
        _id: new ObjectId().toString(),
        title: 'Team Communication Assessment',
        description: 'Assessment of team communication effectiveness',
        type: 'communication',
        company_id: techCorpId,
        created_by: new ObjectId().toString(),
        questions: questions.slice(0, 3), // Use first 3 questions
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
        type: 'climate',
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
    results.surveys = surveys.length;
    log(`Created ${surveys.length} surveys`);

    // Create responses
    log('Creating responses...');
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
        company_id: techCorpId,
        department_id: new ObjectId().toString(), // This would be a real department ID
        responses: [
          {
            question_id: questions[0].id,
            response_value: Math.floor(Math.random() * 5) + 1, // 1-5 rating
            response_text: null,
            response_time: Math.floor(Math.random() * 300) + 30, // 30-330 seconds
          },
          {
            question_id: questions[1].id,
            response_value: Math.floor(Math.random() * 5) + 1,
            response_text: null,
            response_time: Math.floor(Math.random() * 200) + 20,
          },
          {
            question_id: questions[2].id,
            response_value: Math.floor(Math.random() * 11), // 0-10 NPS
            response_text: null,
            response_time: Math.floor(Math.random() * 250) + 25,
          },
          {
            question_id: questions[3].id,
            response_value: [
              'engineering',
              'marketing',
              'sales',
              'hr',
              'support',
            ][Math.floor(Math.random() * 5)],
            response_text: null,
            response_time: Math.floor(Math.random() * 150) + 15,
          },
          {
            question_id: questions[4].id,
            response_value: Math.floor(Math.random() * 5) + 1,
            response_text: null,
            response_time: Math.floor(Math.random() * 200) + 20,
          },
        ],
        completion_time: Math.floor(Math.random() * 600) + 180, // 3-13 minutes
        is_complete: true,
        started_at: new Date(
          Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
        ), // Last 30 days
        completed_at: new Date(
          Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
        ),
        metadata: {
          device_type: ['desktop', 'mobile', 'tablet'][
            Math.floor(Math.random() * 3)
          ],
          browser: ['chrome', 'firefox', 'safari', 'edge'][
            Math.floor(Math.random() * 4)
          ],
          ip_address: `192.168.1.${Math.floor(Math.random() * 255)}`,
        },
      };
      responses.push(response);
    }

    // Generate 60 responses for communication survey (80% response rate)
    for (let i = 0; i < 60; i++) {
      const response = {
        _id: new ObjectId().toString(),
        survey_id: techCorpCommSurvey._id,
        user_id: new ObjectId().toString(),
        company_id: techCorpId,
        department_id: new ObjectId().toString(),
        responses: [
          {
            question_id: questions[0].id,
            response_value: Math.floor(Math.random() * 5) + 1,
            response_text: null,
            response_time: Math.floor(Math.random() * 300) + 30,
          },
          {
            question_id: questions[1].id,
            response_value: Math.floor(Math.random() * 5) + 1,
            response_text: null,
            response_time: Math.floor(Math.random() * 200) + 20,
          },
          {
            question_id: questions[2].id,
            response_value: Math.floor(Math.random() * 11),
            response_text: null,
            response_time: Math.floor(Math.random() * 250) + 25,
          },
        ],
        completion_time: Math.floor(Math.random() * 400) + 120, // 2-8 minutes
        is_complete: true,
        started_at: new Date(
          Date.now() - Math.random() * 15 * 24 * 60 * 60 * 1000
        ), // Last 15 days
        completed_at: new Date(
          Date.now() - Math.random() * 15 * 24 * 60 * 60 * 1000
        ),
        metadata: {
          device_type: ['desktop', 'mobile', 'tablet'][
            Math.floor(Math.random() * 3)
          ],
          browser: ['chrome', 'firefox', 'safari', 'edge'][
            Math.floor(Math.random() * 4)
          ],
          ip_address: `192.168.1.${Math.floor(Math.random() * 255)}`,
        },
      };
      responses.push(response);
    }

    // Generate responses for Innovate Labs survey
    const innovateLabsSurvey = surveys[2];
    for (let i = 0; i < 40; i++) {
      // 80% response rate
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
            response_time: Math.floor(Math.random() * 300) + 30,
          },
          {
            question_id: questions[1].id,
            response_value: Math.floor(Math.random() * 5) + 1,
            response_text: null,
            response_time: Math.floor(Math.random() * 200) + 20,
          },
          {
            question_id: questions[2].id,
            response_value: Math.floor(Math.random() * 11),
            response_text: null,
            response_time: Math.floor(Math.random() * 250) + 25,
          },
          {
            question_id: questions[3].id,
            response_value: ['research', 'operations'][
              Math.floor(Math.random() * 2)
            ],
            response_text: null,
            response_time: Math.floor(Math.random() * 150) + 15,
          },
          {
            question_id: questions[4].id,
            response_value: Math.floor(Math.random() * 5) + 1,
            response_text: null,
            response_time: Math.floor(Math.random() * 200) + 20,
          },
        ],
        completion_time: Math.floor(Math.random() * 600) + 180,
        is_complete: true,
        started_at: new Date(
          Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000
        ), // Last 60 days
        completed_at: new Date(
          Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000
        ),
        metadata: {
          device_type: ['desktop', 'mobile', 'tablet'][
            Math.floor(Math.random() * 3)
          ],
          browser: ['chrome', 'firefox', 'safari', 'edge'][
            Math.floor(Math.random() * 4)
          ],
          ip_address: `192.168.1.${Math.floor(Math.random() * 255)}`,
        },
      };
      responses.push(response);
    }

    await Response.insertMany(responses);
    results.responses = responses.length;
    log(`Created ${responses.length} responses`);

    log('Survey data seeding completed successfully');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    results.errors.push(errorMessage);
    log(`Error: ${errorMessage}`);
  }

  return results;
}

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);
  const options: SeedOptions = {
    force_reset: args.includes('--force'),
    verbose: args.includes('--verbose'),
  };

  seedSurveyData(options)
    .then((results) => {
      console.log('\n🎉 Survey Data Seeding Complete!');
      console.log(`✅ Questions: 5`);
      console.log(`✅ Surveys: ${results.surveys}`);
      console.log(`✅ Responses: ${results.responses}`);

      if (results.errors.length > 0) {
        console.log(`❌ Errors: ${results.errors.length}`);
        results.errors.forEach((error) => console.log(`   - ${error}`));
      }

      console.log('\n📊 Survey Data Summary:');
      console.log('- TechCorp Q4 Engagement: 120 responses');
      console.log('- TechCorp Communication: 60 responses');
      console.log('- Innovate Labs Climate: 40 responses');
      console.log('- Total: 220 responses across 3 surveys');

      process.exit(results.errors.length > 0 ? 1 : 0);
    })
    .catch((error) => {
      console.error('❌ Survey data seeding failed:', error);
      process.exit(1);
    });
}
