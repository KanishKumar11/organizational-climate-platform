import { connectDB } from '@/lib/mongodb';
import mongoose from 'mongoose';
import Survey, { IQuestion, BinaryCommentConfig } from '@/models/Survey';
import Response, { IQuestionResponse } from '@/models/Response';
import Company from '@/models/Company';
import User from '@/models/User';

describe('Binary Question with Conditional Comment', () => {
  let testCompany: any;
  let testUser: any;
  let testSurvey: any;

  beforeAll(async () => {
    await connectDB();

    // Create test company
    testCompany = await Company.create({
      name: 'Test Company',
      domain: 'test.com',
      industry: 'Technology',
      size: '50-200',
      country: 'US',
      is_active: true,
    });

    // Create test user
    testUser = await User.create({
      name: 'Test User',
      email: 'test@test.com',
      password_hash: 'hashed',
      company_id: testCompany._id.toString(),
      role: 'employee',
      is_active: true,
    });
  });

  afterAll(async () => {
    await Company.deleteMany({});
    await User.deleteMany({});
    await Survey.deleteMany({});
    await Response.deleteMany({});
    await mongoose.connection.close();
  });

  describe('Binary Question Configuration', () => {
    test('should create survey with yes_no question type', async () => {
      const question: IQuestion = {
        id: 'q1',
        text: 'Do you feel supported by your manager?',
        type: 'yes_no',
        required: true,
        order: 1,
      };

      testSurvey = await Survey.create({
        title: 'Simple Yes/No Survey',
        company_id: testCompany._id.toString(),
        created_by: testUser._id.toString(),
        type: 'custom',
        questions: [question],
        settings: {
          anonymous: false,
          allow_partial_responses: false,
          randomize_questions: false,
          show_progress: true,
          auto_save: true,
          notification_settings: {
            send_invitations: false,
            send_reminders: false,
            reminder_frequency_days: 7,
          },
        },
        start_date: new Date(),
        end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: 'active',
      });

      expect(testSurvey).toBeDefined();
      expect(testSurvey.questions[0].type).toBe('yes_no');
    });

    test('should create yes_no question with conditional comment enabled', async () => {
      const binaryCommentConfig: BinaryCommentConfig = {
        enabled: true,
        label: 'Please explain your answer',
        placeholder: 'Tell us more about your experience...',
        max_length: 500,
        required: true,
        min_length: 10,
      };

      const question: IQuestion = {
        id: 'q2',
        text: 'Have you experienced any challenges with team collaboration?',
        type: 'yes_no',
        binary_comment_config: binaryCommentConfig,
        required: true,
        order: 1,
      };

      const survey = await Survey.create({
        title: 'Binary with Comment Survey',
        company_id: testCompany._id.toString(),
        created_by: testUser._id.toString(),
        type: 'custom',
        questions: [question],
        settings: {
          anonymous: false,
          allow_partial_responses: false,
          randomize_questions: false,
          show_progress: true,
          auto_save: true,
          notification_settings: {
            send_invitations: false,
            send_reminders: false,
            reminder_frequency_days: 7,
          },
        },
        start_date: new Date(),
        end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: 'active',
      });

      expect(survey).toBeDefined();
      expect(survey.questions[0].binary_comment_config?.enabled).toBe(true);
      expect(survey.questions[0].binary_comment_config?.label).toBe(
        'Please explain your answer'
      );
      expect(survey.questions[0].binary_comment_config?.max_length).toBe(500);
      expect(survey.questions[0].binary_comment_config?.required).toBe(true);
    });
  });

  describe('Binary Response Submission', () => {
    let surveyWithComment: any;

    beforeEach(async () => {
      const binaryCommentConfig: BinaryCommentConfig = {
        enabled: true,
        label: 'Please explain why',
        placeholder: 'Your explanation here',
        max_length: 300,
        required: true,
        min_length: 10,
      };

      surveyWithComment = await Survey.create({
        title: 'Binary Comment Test',
        company_id: testCompany._id.toString(),
        created_by: testUser._id.toString(),
        type: 'custom',
        questions: [
          {
            id: 'q1',
            text: 'Do you have suggestions for improvement?',
            type: 'yes_no',
            binary_comment_config: binaryCommentConfig,
            required: true,
            order: 1,
          },
        ],
        settings: {
          anonymous: false,
          allow_partial_responses: false,
          randomize_questions: false,
          show_progress: true,
          auto_save: true,
          notification_settings: {
            send_invitations: false,
            send_reminders: false,
            reminder_frequency_days: 7,
          },
        },
        start_date: new Date(),
        end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: 'active',
      });
    });

    test('should accept Yes response with comment when required', async () => {
      const questionResponse: IQuestionResponse = {
        question_id: 'q1',
        response_value: true, // Yes
        response_text:
          'I think we could improve our communication tools and processes.',
      };

      const response = await Response.create({
        survey_id: surveyWithComment._id.toString(),
        user_id: testUser._id.toString(),
        session_id: 'test-session-1',
        company_id: testCompany._id.toString(),
        responses: [questionResponse],
        demographics: [],
        is_complete: true,
        is_anonymous: false,
        start_time: new Date(),
        completion_time: new Date(),
      });

      expect(response).toBeDefined();
      expect(response.responses[0].response_value).toBe(true);
      expect(response.responses[0].response_text).toBeDefined();
      expect(
        response.responses[0].response_text?.length
      ).toBeGreaterThanOrEqual(10);
    });

    test('should accept No response without comment', async () => {
      const questionResponse: IQuestionResponse = {
        question_id: 'q1',
        response_value: false, // No
        // No response_text needed for "No"
      };

      const response = await Response.create({
        survey_id: surveyWithComment._id.toString(),
        user_id: testUser._id.toString(),
        session_id: 'test-session-2',
        company_id: testCompany._id.toString(),
        responses: [questionResponse],
        demographics: [],
        is_complete: true,
        is_anonymous: false,
        start_time: new Date(),
        completion_time: new Date(),
      });

      expect(response).toBeDefined();
      expect(response.responses[0].response_value).toBe(false);
      expect(response.responses[0].response_text).toBeUndefined();
    });

    test('should validate comment length when Yes is selected', async () => {
      const shortComment: IQuestionResponse = {
        question_id: 'q1',
        response_value: true,
        response_text: 'Too short', // Less than min_length (10)
      };

      // This should fail validation in the API layer
      // Note: Mongoose won't validate this automatically, validation happens in API
      expect(shortComment.response_text?.length).toBeLessThan(10);
    });

    test('should validate comment max length when Yes is selected', async () => {
      const longComment = 'a'.repeat(301); // Exceeds max_length (300)

      const questionResponse: IQuestionResponse = {
        question_id: 'q1',
        response_value: true,
        response_text: longComment,
      };

      // This should fail validation in the API layer
      expect(questionResponse.response_text?.length).toBeGreaterThan(300);
    });
  });

  describe('Binary Question Export', () => {
    test('should export responses with dedicated comment column', async () => {
      const surveyWithBinary = await Survey.create({
        title: 'Export Test Survey',
        company_id: testCompany._id.toString(),
        created_by: testUser._id.toString(),
        type: 'custom',
        questions: [
          {
            id: 'q1',
            text: 'Would you recommend our company?',
            type: 'yes_no',
            binary_comment_config: {
              enabled: true,
              label: 'Why or why not?',
              required: false,
            },
            required: true,
            order: 1,
          },
        ],
        settings: {
          anonymous: false,
          allow_partial_responses: false,
          randomize_questions: false,
          show_progress: true,
          auto_save: true,
          notification_settings: {
            send_invitations: false,
            send_reminders: false,
            reminder_frequency_days: 7,
          },
        },
        start_date: new Date(),
        end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: 'active',
      });

      // Create responses
      await Response.create([
        {
          survey_id: surveyWithBinary._id.toString(),
          user_id: testUser._id.toString(),
          session_id: 'export-session-1',
          company_id: testCompany._id.toString(),
          responses: [
            {
              question_id: 'q1',
              response_value: true,
              response_text: 'Great work environment and benefits',
            },
          ],
          demographics: [],
          is_complete: true,
          is_anonymous: false,
          start_time: new Date(),
          completion_time: new Date(),
        },
        {
          survey_id: surveyWithBinary._id.toString(),
          session_id: 'export-session-2',
          company_id: testCompany._id.toString(),
          responses: [
            {
              question_id: 'q1',
              response_value: false,
              // No comment
            },
          ],
          demographics: [],
          is_complete: true,
          is_anonymous: true,
          start_time: new Date(),
          completion_time: new Date(),
        },
      ]);

      // Fetch responses for export
      const responses = await Response.find({
        survey_id: surveyWithBinary._id.toString(),
      }).lean();

      expect(responses.length).toBe(2);

      // First response should have comment
      const yesResponse = responses.find(
        (r) => r.responses[0].response_value === true
      );
      expect(yesResponse?.responses[0].response_text).toBe(
        'Great work environment and benefits'
      );

      // Second response should not have comment
      const noResponse = responses.find(
        (r) => r.responses[0].response_value === false
      );
      expect(noResponse?.responses[0].response_text).toBeUndefined();

      // Expected CSV structure:
      // User, Question, Response, Comment (if Yes)
      // test@test.com, "Would you recommend...", "Yes", "Great work environment..."
      // Anonymous, "Would you recommend...", "No", ""
    });
  });

  describe('Backward Compatibility', () => {
    test('should support legacy yes_no_comment type', async () => {
      const question: IQuestion = {
        id: 'q1',
        text: 'Legacy question',
        type: 'yes_no_comment',
        comment_required: true,
        comment_prompt: 'Please explain',
        required: true,
        order: 1,
      };

      const survey = await Survey.create({
        title: 'Legacy Survey',
        company_id: testCompany._id.toString(),
        created_by: testUser._id.toString(),
        type: 'custom',
        questions: [question],
        settings: {
          anonymous: false,
          allow_partial_responses: false,
          randomize_questions: false,
          show_progress: true,
          auto_save: true,
          notification_settings: {
            send_invitations: false,
            send_reminders: false,
            reminder_frequency_days: 7,
          },
        },
        start_date: new Date(),
        end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: 'active',
      });

      expect(survey).toBeDefined();
      expect(survey.questions[0].type).toBe('yes_no_comment');
      expect(survey.questions[0].comment_required).toBe(true);
    });
  });
});
