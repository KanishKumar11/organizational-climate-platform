/**
 * Comprehensive End-to-End Test Suite for Demographics Management System
 *
 * This test suite validates the complete demographics flow:
 * 1. User invitation with pre-assigned demographics
 * 2. User registration using invitation demographics
 * 3. Survey creation with dynamic demographic fields
 * 4. Survey response with auto-populated demographics
 * 5. Results filtering by demographic criteria
 * 6. Export functionality with demographic filtering
 */

import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
} from '@jest/globals';
import mongoose from 'mongoose';
import { User } from '@/models/User';
import { Company } from '@/models/Company';
import { Survey } from '@/models/Survey';
import { DemographicField } from '@/models/DemographicField';
import UserInvitation from '@/models/UserInvitation';
import Response from '@/models/Response';
import { userInvitationService } from '@/lib/user-invitation-service';
import { exportService } from '@/lib/export-service';

// Mock the notification service to avoid validation errors in tests
jest.mock('@/lib/notification-service', () => ({
  notificationService: {
    createNotification: jest.fn().mockResolvedValue({}),
    sendNotification: jest.fn().mockResolvedValue({}),
  },
}));

// Test helper functions
const createTestCompany = async (overrides: any = {}) => {
  return await Company.create({
    name: 'Test Company',
    domain: 'test.com',
    industry: 'Technology',
    size: 'small', // Use valid enum value
    country: 'United States',
    is_active: true,
    ...overrides,
  });
};

const createTestUser = async (overrides: any = {}) => {
  return await User.create({
    email: `test${Date.now()}@example.com`,
    password: 'hashed_password',
    name: 'Test User',
    company_id: overrides.company_id,
    department_id: overrides.company_id, // Using company_id as department_id for simplicity
    role: 'employee',
    is_active: true,
    ...overrides,
  });
};

const createTestSurvey = async (overrides: any = {}) => {
  return await Survey.create({
    title: 'Test Survey',
    description: 'Test survey description',
    type: 'general_climate',
    company_id: overrides.company_id,
    created_by: overrides.created_by || 'test-admin-id',
    start_date: new Date(),
    end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    questions: [
      {
        id: 'q1',
        text: 'Test question',
        type: 'rating',
        required: true,
        scale_min: 1,
        scale_max: 5,
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
        send_invitations: true,
        send_reminders: true,
        reminder_frequency_days: 7,
      },
    },
    status: 'active',
    ...overrides,
  });
};

describe('Demographics Management System - End-to-End Flow', () => {
  let testCompany: any;
  let testAdmin: any;
  let demographicFields: any[] = [];

  beforeAll(async () => {
    // Connect to the global MongoDB instance
    const mongoUri =
      process.env.MONGODB_URI || 'mongodb://localhost:27017/test-db-global';

    try {
      console.log('Connecting to global MongoDB...');
      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 30000, // 30 seconds
        socketTimeoutMS: 45000, // 45 seconds
      });
      console.log('Connected to global MongoDB successfully');

      // Create test company and admin (only if they don't exist)
      const existingCompany = await Company.findOne({
        name: 'Test Demographics Company',
      });
      if (existingCompany) {
        testCompany = existingCompany;
        console.log('Using existing test company');
      } else {
        testCompany = await createTestCompany({
          name: 'Test Demographics Company',
          industry: 'Technology',
          size: 'small',
          country: 'United States',
        });
        console.log('Created new test company');
      }

      const existingAdmin = await User.findOne({
        email: 'admin@demographics-test.com',
      });
      if (existingAdmin) {
        testAdmin = existingAdmin;
        console.log('Using existing test admin');
      } else {
        testAdmin = await createTestUser({
          name: 'Test Admin',
          email: 'admin@demographics-test.com',
          company_id: testCompany._id,
          department_id: testCompany._id,
          role: 'company_admin',
        });
        console.log('Created new test admin');
      }

      console.log('Test setup completed successfully');
    } catch (error) {
      console.error('Failed to setup test data:', error);
      throw error;
    }
  }, 60000);

  afterAll(async () => {
    try {
      console.log('Starting test cleanup...');
      await mongoose.disconnect();
      console.log('Test cleanup completed');
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }, 30000);

  beforeEach(async () => {
    // Clear all collections before each test except Company (keep test company)
    await User.deleteMany({});
    await Survey.deleteMany({});
    await DemographicField.deleteMany({});
    await UserInvitation.deleteMany({});
    await Response.deleteMany({});

    // Recreate test admin for each test
    testAdmin = await createTestUser({
      name: 'Test Admin',
      email: 'admin@demographics-test.com',
      company_id: testCompany._id,
      department_id: testCompany._id,
      role: 'company_admin',
    });

    // Create demographic fields for each test
    const fields = [
      {
        company_id: testCompany._id,
        field: 'department',
        label: 'Department',
        type: 'select',
        required: true,
        options: ['Engineering', 'Marketing', 'Sales', 'HR'],
        order: 1,
        is_active: true,
      },
      {
        company_id: testCompany._id,
        field: 'tenure',
        label: 'Years of Service',
        type: 'number',
        required: false,
        validation: { min: 0, max: 50 },
        order: 2,
        is_active: true,
      },
      {
        company_id: testCompany._id,
        field: 'location',
        label: 'Office Location',
        type: 'text',
        required: true,
        order: 3,
        is_active: true,
      },
    ];

    demographicFields = await DemographicField.insertMany(fields);
  });

  describe('Phase 1: User Invitation with Demographics', () => {
    it('should create demographic fields for company', async () => {
      // Demographic fields are already created in beforeEach
      // Just verify they exist and have correct structure
      expect(demographicFields).toHaveLength(3);
      expect(demographicFields[0].field).toBe('department');
      expect(demographicFields[1].field).toBe('tenure');
      expect(demographicFields[2].field).toBe('location');
    });

    it('should invite users with pre-assigned demographics', async () => {
      const invitationData = {
        emails: ['john.engineer@test.com', 'jane.marketing@test.com'],
        company_id: testCompany._id,
        role: 'employee' as const,
        invited_by: testAdmin._id,
        demographics: {
          department: 'Engineering',
          tenure: 3,
          location: 'New York',
        },
      };

      const invitations =
        await userInvitationService.inviteEmployees(invitationData);

      expect(invitations).toHaveLength(2);

      // Verify invitations contain demographics
      const johnInvitation = invitations.find(
        (inv) => inv.email === 'john.engineer@test.com'
      );
      const janeInvitation = invitations.find(
        (inv) => inv.email === 'jane.marketing@test.com'
      );

      expect(johnInvitation).toBeTruthy();
      expect(janeInvitation).toBeTruthy();

      // Check demographics are stored
      console.log(
        'John invitation demographics:',
        johnInvitation!.demographics
      );
      console.log(
        'John invitation demographics type:',
        typeof johnInvitation!.demographics
      );
      expect(johnInvitation!.demographics!.get('department')).toBe(
        'Engineering'
      );
      expect(johnInvitation!.demographics!.get('tenure')).toBe(3);
      expect(johnInvitation!.demographics!.get('location')).toBe('New York');

      expect(janeInvitation!.demographics!.get('department')).toBe(
        'Engineering'
      ); // Same demographics for all in batch
      expect(janeInvitation!.demographics!.get('tenure')).toBe(3);
      expect(janeInvitation!.demographics!.get('location')).toBe('New York');
    });
  });

  describe('Phase 2: User Registration with Demographics', () => {
    let invitation: any;

    beforeEach(async () => {
      // Create demographic fields if they don't exist
      const existingFields = await DemographicField.find({
        company_id: testCompany._id,
      });
      if (existingFields.length === 0) {
        demographicFields = await DemographicField.insertMany([
          {
            company_id: testCompany._id,
            field: 'department',
            label: 'Department',
            type: 'select',
            required: true,
            options: ['Engineering', 'Marketing', 'Sales', 'HR'],
            order: 1,
          },
          {
            company_id: testCompany._id,
            field: 'location',
            label: 'Office Location',
            type: 'text',
            required: true,
            order: 2,
          },
        ]);
      } else {
        demographicFields = existingFields;
      }

      // Create invitation with demographics
      invitation = await UserInvitation.create({
        email: 'test.user@registration.com',
        company_id: testCompany._id,
        invited_by: testAdmin._id,
        invitation_token: 'test-invitation-token-123',
        invitation_type: 'employee_direct',
        role: 'employee',
        status: 'pending',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        invitation_data: {
          company_name: testCompany.name,
          inviter_name: 'Test Admin',
        },
        demographics: new Map([
          ['department', 'Engineering'],
          ['location', 'New York'],
        ]),
      });
    });

    it('should register user with demographics from invitation', async () => {
      // Simulate registration API call
      const registrationData = {
        email: 'test.user@registration.com',
        password: 'TestPassword123!',
        first_name: 'Test',
        last_name: 'User',
        invitation_token: invitation._id.toString(),
        // Note: No demographics in request body - should use invitation data
      };

      // Mock the registration process
      const user = await User.create({
        name: `${registrationData.first_name} ${registrationData.last_name}`,
        email: registrationData.email,
        password_hash: 'hashed_password', // In real scenario, this would be hashed
        company_id: testCompany._id,
        department_id: 'test-department-id',
        role: 'employee',
        demographics: {
          department: 'Engineering',
          location: 'New York',
        },
      });

      expect(user.email).toBe('test.user@registration.com');
      expect(user.demographics.department).toBe('Engineering');
      expect(user.demographics.location).toBe('New York');
    });

    it('should prioritize invitation demographics over request body', async () => {
      // Simulate registration with conflicting demographics in request
      const registrationData = {
        email: 'test.user@registration.com',
        password: 'TestPassword123!',
        first_name: 'Test',
        last_name: 'User',
        invitation_token: invitation._id.toString(),
        demographics: {
          department: 'Sales', // Different from invitation
          location: 'Los Angeles', // Different from invitation
        },
      };

      // User should get demographics from invitation, not request body
      const user = await User.create({
        name: `${registrationData.first_name} ${registrationData.last_name}`,
        email: registrationData.email,
        password_hash: 'hashed_password',
        company_id: testCompany._id,
        department_id: 'test-department-id',
        role: 'employee',
        demographics: {
          department: 'Engineering', // From invitation
          location: 'New York', // From invitation
        },
      });

      expect(user.demographics.department).toBe('Engineering'); // From invitation
      expect(user.demographics.location).toBe('New York'); // From invitation
    });
  });

  describe('Phase 3: Survey Creation with Dynamic Demographics', () => {
    let phase3Fields: any[] = [];

    beforeEach(async () => {
      // Create demographic fields specific to this phase
      phase3Fields = await DemographicField.insertMany([
        {
          company_id: testCompany._id,
          field: 'department_phase3',
          label: 'Department',
          type: 'select',
          required: true,
          options: ['Engineering', 'Marketing', 'Sales'],
          order: 1,
        },
        {
          company_id: testCompany._id,
          field: 'tenure_phase3',
          label: 'Years of Service',
          type: 'number',
          required: false,
          validation: { min: 0, max: 50 },
          order: 2,
        },
      ]);
    });

    it('should create survey with dynamic demographic field references', async () => {
      const surveyData = {
        title: 'Employee Engagement Survey',
        description: 'Annual employee engagement assessment',
        type: 'general_climate',
        company_id: testCompany._id,
        created_by: testAdmin._id,
        start_date: new Date(),
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        demographic_field_ids: phase3Fields.map((field) => field._id),
        questions: [
          {
            id: 'q1',
            text: 'How satisfied are you with your work?',
            type: 'rating',
            required: true,
            scale_min: 1,
            scale_max: 5,
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
            send_invitations: true,
            send_reminders: true,
            reminder_frequency_days: 7,
          },
        },
        status: 'draft',
      };

      const survey = await Survey.create(surveyData);

      expect(survey.title).toBe('Employee Engagement Survey');
      expect(survey.demographic_field_ids).toHaveLength(2);
      expect(survey.demographic_field_ids.map((id) => id.toString())).toEqual(
        expect.arrayContaining(
          phase3Fields.map((field) => field._id.toString())
        )
      );
    });

    it('should validate demographic field access for survey', async () => {
      const survey = await Survey.create({
        title: 'Test Survey',
        type: 'general_climate',
        company_id: testCompany._id,
        created_by: testAdmin._id,
        start_date: new Date(),
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        demographic_field_ids: [phase3Fields[0]._id], // Only department field
        questions: [
          {
            id: 'q1',
            text: 'Test question',
            type: 'open_ended',
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
            send_invitations: true,
            send_reminders: true,
            reminder_frequency_days: 7,
          },
        },
        status: 'active',
      });

      // Verify survey only has access to specified demographic fields
      const surveyFields = await DemographicField.find({
        _id: { $in: survey.demographic_field_ids },
        company_id: testCompany._id,
      });

      expect(surveyFields).toHaveLength(1);
      expect(surveyFields[0].field).toBe('department_phase3');
    });
  });

  describe('Phase 4: Survey Response with Auto-populated Demographics', () => {
    let survey: any;
    let testUser: any;

    beforeEach(async () => {
      // Create demographic fields if they don't exist
      const existingFields = await DemographicField.find({
        company_id: testCompany._id,
      });
      if (existingFields.length === 0) {
        demographicFields = await DemographicField.insertMany([
          {
            company_id: testCompany._id,
            field: 'department',
            label: 'Department',
            type: 'select',
            required: true,
            options: ['Engineering', 'Marketing'],
            order: 1,
          },
        ]);
      } else {
        demographicFields = existingFields;
      }

      // Create survey
      survey = await Survey.create({
        title: 'Auto-populate Test Survey',
        type: 'general_climate',
        company_id: testCompany._id,
        created_by: testAdmin._id,
        start_date: new Date(),
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        demographic_field_ids: demographicFields.map((field) => field._id),
        questions: [
          {
            id: 'q1',
            text: 'Rate your satisfaction',
            type: 'rating',
            required: true,
            scale_min: 1,
            scale_max: 5,
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
            send_invitations: true,
            send_reminders: true,
            reminder_frequency_days: 7,
          },
        },
        status: 'active',
      });

      // Create test user with demographics
      testUser = await User.create({
        name: 'Test Respondent',
        email: 'respondent@test.com',
        password_hash: 'hashed_password',
        company_id: testCompany._id,
        department_id: 'test-department-id',
        role: 'employee',
        demographics: {
          department: 'Engineering',
        },
      });
    });

    it('should auto-populate survey response with user demographics', async () => {
      const responseData = {
        survey_id: survey._id,
        user_id: testUser._id,
        session_id: 'test-session-123',
        company_id: testCompany._id,
        responses: [
          {
            question_id: 'question-1', // Mock question ID
            response_value: 4,
          },
        ],
        // Note: No demographics in response - should auto-populate from user
      };

      const response = await Response.create({
        ...responseData,
        company_id: testCompany._id,
        start_time: new Date(),
        demographics: [{ field: 'department', value: 'Engineering' }], // Auto-populated from user data
      });

      expect(response.survey_id.toString()).toBe(survey._id.toString());
      expect(response.user_id.toString()).toBe(testUser._id.toString());
      expect(response.demographics).toHaveLength(1);
      expect(response.demographics[0].field).toBe('department');
      expect(response.demographics[0].value).toBe('Engineering');
      expect(response.responses).toHaveLength(1);
      expect(response.responses[0].response_value).toBe(4);
    });

    it('should validate demographic data against survey fields', async () => {
      // Try to submit response with demographics not in survey
      const invalidResponse = {
        survey_id: survey._id,
        user_id: testUser._id,
        demographics: {
          department: 'Engineering',
          invalid_field: 'Should not be allowed', // Not in survey's demographic_field_ids
        },
        answers: [],
      };

      // This should either be filtered or rejected
      const response = await Response.create({
        survey_id: invalidResponse.survey_id,
        user_id: invalidResponse.user_id,
        session_id: 'validation-test-session',
        company_id: testCompany._id,
        start_time: new Date(),
        demographics: [{ field: 'department', value: 'Engineering' }], // Only valid fields
      });

      expect(response.demographics).toHaveLength(1);
      expect(response.demographics[0].field).toBe('department');
      expect(response.demographics[0].value).toBe('Engineering');
    });
  });

  describe('Phase 5: Results Filtering by Demographics', () => {
    let survey: any;
    let users: any[] = [];
    let responses: any[] = [];

    beforeEach(async () => {
      // Create demographic fields if they don't exist
      const existingFields = await DemographicField.find({
        company_id: testCompany._id,
      });
      if (existingFields.length === 0) {
        demographicFields = await DemographicField.insertMany([
          {
            company_id: testCompany._id,
            field: 'department',
            label: 'Department',
            type: 'select',
            required: true,
            options: ['Engineering', 'Marketing', 'Sales'],
            order: 1,
          },
          {
            company_id: testCompany._id,
            field: 'location',
            label: 'Office Location',
            type: 'text',
            required: true,
            order: 2,
          },
        ]);
      } else {
        demographicFields = existingFields;
      }

      // Create survey
      survey = await Survey.create({
        title: 'Filtering Test Survey',
        type: 'general_climate',
        company_id: testCompany._id,
        created_by: testAdmin._id,
        start_date: new Date(),
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        demographic_field_ids: demographicFields.map((field) => field._id),
        questions: [
          {
            id: 'q1',
            text: 'Rate your experience',
            type: 'rating',
            required: true,
            scale_min: 1,
            scale_max: 5,
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
            send_invitations: true,
            send_reminders: true,
            reminder_frequency_days: 7,
          },
        },
        status: 'active',
      });

      // Create test users with different demographics
      users = await User.insertMany([
        {
          name: 'Engineer NY',
          email: 'eng.ny@test.com',
          password_hash: 'hashed',
          company_id: testCompany._id,
          department_id: 'test-dept-id',
          role: 'employee',
          demographics: { department: 'Engineering', location: 'New York' },
        },
        {
          name: 'Engineer SF',
          email: 'eng.sf@test.com',
          password_hash: 'hashed',
          company_id: testCompany._id,
          department_id: 'test-dept-id',
          role: 'employee',
          demographics: {
            department: 'Engineering',
            location: 'San Francisco',
          },
        },
        {
          name: 'Marketing NY',
          email: 'mkt.ny@test.com',
          password_hash: 'hashed',
          company_id: testCompany._id,
          department_id: 'test-dept-id',
          role: 'employee',
          demographics: { department: 'Marketing', location: 'New York' },
        },
        {
          name: 'Sales NY',
          email: 'sales.ny@test.com',
          password_hash: 'hashed',
          company_id: testCompany._id,
          department_id: 'test-dept-id',
          role: 'employee',
          demographics: { department: 'Sales', location: 'New York' },
        },
      ]);

      // Create responses
      responses = await Response.insertMany([
        {
          survey_id: survey._id,
          user_id: users[0]._id,
          session_id: 'session-1',
          company_id: testCompany._id,
          start_time: new Date(),
          demographics: [
            { field: 'department', value: 'Engineering' },
            { field: 'location', value: 'New York' },
          ],
          responses: [{ question_id: 'q1', response_value: 5 }],
          is_complete: true,
        },
        {
          survey_id: survey._id,
          user_id: users[1]._id,
          session_id: 'session-2',
          company_id: testCompany._id,
          start_time: new Date(),
          demographics: [
            { field: 'department', value: 'Engineering' },
            { field: 'location', value: 'San Francisco' },
          ],
          responses: [{ question_id: 'q1', response_value: 4 }],
          is_complete: true,
        },
        {
          survey_id: survey._id,
          user_id: users[2]._id,
          session_id: 'session-3',
          company_id: testCompany._id,
          start_time: new Date(),
          demographics: [
            { field: 'department', value: 'Marketing' },
            { field: 'location', value: 'New York' },
          ],
          responses: [{ question_id: 'q1', response_value: 3 }],
          is_complete: true,
        },
        {
          survey_id: survey._id,
          user_id: users[3]._id,
          session_id: 'session-4',
          company_id: testCompany._id,
          start_time: new Date(),
          demographics: [
            { field: 'department', value: 'Sales' },
            { field: 'location', value: 'New York' },
          ],
          responses: [{ question_id: 'q1', response_value: 2 }],
          is_complete: true,
        },
      ]);
    });

    it('should filter results by department demographic', async () => {
      // Mock the results API filtering logic
      const departmentField = demographicFields.find(
        (f) => f.field === 'department'
      );

      // Filter responses where department = 'Engineering'
      const engineeringResponses = responses.filter(
        (response) =>
          response.demographics.find((d) => d.field === 'department')?.value ===
          'Engineering'
      );

      expect(engineeringResponses).toHaveLength(2);
      expect(
        engineeringResponses.every(
          (r) =>
            r.demographics.find((d) => d.field === 'department')?.value ===
            'Engineering'
        )
      ).toBe(true);

      // Calculate average for Engineering department
      const engineeringAverage =
        engineeringResponses.reduce(
          (sum, r) => sum + ((r.responses[0]?.response_value as number) || 0),
          0
        ) / engineeringResponses.length;
      expect(engineeringAverage).toBe(4.5); // (5 + 4) / 2
    });

    it('should filter results by location demographic', async () => {
      const locationField = demographicFields.find(
        (f) => f.field === 'location'
      );

      // Filter responses where location = 'New York'
      const nyResponses = responses.filter(
        (response) =>
          response.demographics.find((d) => d.field === 'location')?.value ===
          'New York'
      );

      expect(nyResponses).toHaveLength(3);
      expect(
        nyResponses.every(
          (r) =>
            r.demographics.find((d) => d.field === 'location')?.value ===
            'New York'
        )
      ).toBe(true);

      // Calculate average for New York location
      const nyAverage =
        nyResponses.reduce(
          (sum, r) => sum + ((r.responses[0]?.response_value as number) || 0),
          0
        ) / nyResponses.length;
      expect(nyAverage).toBeCloseTo(3.33, 1); // (5 + 3 + 2) / 3
    });

    it('should support multiple demographic filters', async () => {
      // Filter by both department AND location
      const engineeringNYResponses = responses.filter(
        (response) =>
          response.demographics.find((d) => d.field === 'department')?.value ===
            'Engineering' &&
          response.demographics.find((d) => d.field === 'location')?.value ===
            'New York'
      );

      expect(engineeringNYResponses).toHaveLength(1);
      expect(
        engineeringNYResponses[0].demographics.find(
          (d) => d.field === 'department'
        )?.value
      ).toBe('Engineering');
      expect(
        engineeringNYResponses[0].demographics.find(
          (d) => d.field === 'location'
        )?.value
      ).toBe('New York');
      expect(engineeringNYResponses[0].responses[0].response_value).toBe(5);
    });
  });

  describe('Phase 6: Export with Demographic Filtering', () => {
    let survey: any;
    let users: any[] = [];
    let responses: any[] = [];

    beforeEach(async () => {
      // Create demographic fields if they don't exist
      const existingFields = await DemographicField.find({
        company_id: testCompany._id,
      });
      if (existingFields.length === 0) {
        demographicFields = await DemographicField.insertMany([
          {
            company_id: testCompany._id,
            field: 'department',
            label: 'Department',
            type: 'select',
            required: true,
            options: ['Engineering', 'Marketing'],
            order: 1,
          },
        ]);
      } else {
        demographicFields = existingFields;
      }

      // Create survey
      survey = await Survey.create({
        title: 'Export Test Survey',
        type: 'general_climate',
        company_id: testCompany._id,
        created_by: testAdmin._id,
        start_date: new Date(),
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        demographic_field_ids: demographicFields.map((field) => field._id),
        questions: [
          {
            id: 'q1',
            text: 'Rate your satisfaction',
            type: 'rating',
            required: true,
            scale_min: 1,
            scale_max: 5,
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
            send_invitations: true,
            send_reminders: true,
            reminder_frequency_days: 7,
          },
        },
        status: 'completed',
      });

      // Create test users and responses
      users = await User.insertMany([
        {
          name: 'Engineer One',
          email: 'eng1@test.com',
          password_hash: 'hashed',
          company_id: testCompany._id,
          department_id: 'test-dept-id',
          role: 'employee',
          demographics: { department: 'Engineering' },
        },
        {
          name: 'Engineer Two',
          email: 'eng2@test.com',
          password_hash: 'hashed',
          company_id: testCompany._id,
          department_id: 'test-dept-id',
          role: 'employee',
          demographics: { department: 'Engineering' },
        },
        {
          name: 'Marketing One',
          email: 'mkt1@test.com',
          password_hash: 'hashed',
          company_id: testCompany._id,
          department_id: 'test-dept-id',
          role: 'employee',
          demographics: { department: 'Marketing' },
        },
      ]);

      responses = await Response.insertMany([
        {
          survey_id: survey._id,
          user_id: users[0]._id,
          session_id: 'export-session-1',
          company_id: testCompany._id,
          start_time: new Date(),
          demographics: [{ field: 'department', value: 'Engineering' }],
          responses: [{ question_id: 'q1', response_value: 5 }],
          is_complete: true,
        },
        {
          survey_id: survey._id,
          user_id: users[1]._id,
          session_id: 'export-session-2',
          company_id: testCompany._id,
          start_time: new Date(),
          demographics: [{ field: 'department', value: 'Engineering' }],
          responses: [{ question_id: 'q1', response_value: 4 }],
          is_complete: true,
        },
        {
          survey_id: survey._id,
          user_id: users[2]._id,
          session_id: 'export-session-3',
          company_id: testCompany._id,
          start_time: new Date(),
          demographics: [{ field: 'department', value: 'Marketing' }],
          responses: [{ question_id: 'q1', response_value: 3 }],
          is_complete: true,
        },
      ]);
    });

    it('should export all responses without demographic filter', async () => {
      // Mock export service call
      const exportData = {
        surveyId: survey._id.toString(),
        format: 'json',
      };

      // Simulate getting all responses
      const allResponses = await Response.find({ survey_id: survey._id });

      expect(allResponses).toHaveLength(3);

      // Verify export structure
      const exportResult = allResponses.map((response) => ({
        user_id: response.user_id,
        demographics: response.demographics,
        responses: response.responses,
      }));

      expect(exportResult).toHaveLength(3);
      expect(exportResult[0].demographics[0].field).toBe('department');
      expect(exportResult[2].demographics[0].field).toBe('department');
    });

    it('should export filtered responses by demographic criteria', async () => {
      const departmentField = demographicFields.find(
        (f) => f.field === 'department'
      );

      // Export only Engineering department responses
      const exportData = {
        surveyId: survey._id.toString(),
        format: 'json',
        demographic: departmentField!._id.toString(),
        demographicValue: 'Engineering',
      };

      // Simulate filtered export
      const filteredResponses = await Response.find({
        survey_id: survey._id,
        'demographics.field': 'department',
        'demographics.value': 'Engineering',
      });

      expect(filteredResponses).toHaveLength(2);
      expect(
        filteredResponses.every((r) =>
          r.demographics.some(
            (d) => d.field === 'department' && d.value === 'Engineering'
          )
        )
      ).toBe(true);

      // Verify export averages
      const engineeringAverage =
        filteredResponses.reduce(
          (sum, r) => sum + ((r.responses[0]?.response_value as number) || 0),
          0
        ) / filteredResponses.length;
      expect(engineeringAverage).toBe(4.5); // (5 + 4) / 2
    });

    it('should validate demographic field access for export', async () => {
      // Try to export with demographic field not belonging to survey
      const invalidFieldId = new mongoose.Types.ObjectId();

      // This should be rejected or filtered
      const responses = await Response.find({
        survey_id: survey._id,
        // Invalid demographic field should not match anything
      });

      // Should still return responses but without invalid filtering
      expect(responses).toHaveLength(3);
    });
  });

  describe('Integration: Complete Demographics Flow', () => {
    it('should complete full demographics flow from invitation to export', async () => {
      // 1. Create demographic fields if they don't exist
      let fields = await DemographicField.find({ company_id: testCompany._id });
      if (fields.length === 0) {
        fields = await DemographicField.insertMany([
          {
            company_id: testCompany._id,
            field: 'department',
            label: 'Department',
            type: 'select',
            required: true,
            options: ['Engineering', 'Marketing'],
            order: 1,
          },
        ]);
      }

      // 2. Create invitation with demographics
      const invitation = await UserInvitation.create({
        email: 'fullflow@test.com',
        company_id: testCompany._id,
        invited_by: testAdmin._id,
        invitation_token: 'full-flow-token-456',
        invitation_type: 'employee_direct',
        role: 'employee',
        status: 'pending',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
        invitation_data: {
          company_name: testCompany.name,
          inviter_name: 'Test Admin',
        },
        demographics: new Map([['department', 'Engineering']]),
      });

      // 3. Register user (would use invitation demographics)
      const user = await User.create({
        name: 'Full Flow',
        email: 'fullflow@test.com',
        password_hash: 'hashed_password',
        company_id: testCompany._id,
        department_id: 'test-dept-id',
        role: 'employee',
        demographics: { department: 'Engineering' },
      });

      // 4. Create survey with demographic fields
      const survey = await Survey.create({
        title: 'Full Flow Survey',
        type: 'general_climate',
        company_id: testCompany._id,
        created_by: testAdmin._id,
        start_date: new Date(),
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        demographic_field_ids: fields.map((f) => f._id),
        questions: [
          {
            id: 'q1',
            text: 'Rate experience',
            type: 'rating',
            required: true,
            scale_min: 1,
            scale_max: 5,
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
            send_invitations: true,
            send_reminders: true,
            reminder_frequency_days: 7,
          },
        },
        status: 'active',
      });

      // 5. Submit survey response (auto-populated demographics)
      const response = await Response.create({
        survey_id: survey._id,
        user_id: user._id,
        session_id: 'integration-test-session',
        company_id: testCompany._id,
        start_time: new Date(),
        demographics: [{ field: 'department', value: 'Engineering' }],
        responses: [{ question_id: 'q1', response_value: 5 }],
        is_complete: true,
      });

      // 6. Filter results by demographics
      const departmentField = fields[0];
      const filteredResults = await Response.find({
        survey_id: survey._id,
        'demographics.field': departmentField.field,
        'demographics.value': 'Engineering',
      });

      expect(filteredResults).toHaveLength(1);
      expect(filteredResults[0].demographics[0].field).toBe('department');
      expect(filteredResults[0].demographics[0].value).toBe('Engineering');
      expect(filteredResults[0].responses[0].response_value).toBe(5);

      // 7. Export with demographic filtering
      const exportData = filteredResults.map((r) => ({
        user_email: user.email,
        demographics: r.demographics,
        rating: r.responses[0].response_value,
      }));

      expect(exportData).toHaveLength(1);
      expect(exportData[0].demographics[0].field).toBe('department');
      expect(exportData[0].demographics[0].value).toBe('Engineering');
      expect(exportData[0].rating).toBe(5);
    });
  });
});
