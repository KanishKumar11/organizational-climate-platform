import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import SurveyTemplate from '@/models/SurveyTemplate';
import { hasFeaturePermission } from '@/lib/permissions';

// Sample templates data
const sampleTemplates = [
  {
    name: 'Employee Satisfaction Survey',
    description:
      'Comprehensive survey to measure overall employee satisfaction and engagement levels across different aspects of work life.',
    category: 'engagement',
    is_public: true,
    tags: ['satisfaction', 'engagement', 'workplace'],
    questions: [
      {
        id: 'q1',
        type: 'likert',
        text: 'How satisfied are you with your current work environment?',
        required: true,
        options: [
          'Very Dissatisfied',
          'Dissatisfied',
          'Neutral',
          'Satisfied',
          'Very Satisfied',
        ],
      },
      {
        id: 'q2',
        type: 'likert',
        text: 'How would you rate your work-life balance?',
        required: true,
        options: ['Very Poor', 'Poor', 'Average', 'Good', 'Excellent'],
      },
      {
        id: 'q3',
        type: 'likert',
        text: 'How supported do you feel by your immediate supervisor?',
        required: true,
        options: [
          'Not Supported',
          'Slightly Supported',
          'Moderately Supported',
          'Well Supported',
          'Excellently Supported',
        ],
      },
      {
        id: 'q4',
        type: 'multiple_choice',
        text: 'What aspects of your job do you find most rewarding? (Select all that apply)',
        required: false,
        options: [
          'Challenging work',
          'Team collaboration',
          'Recognition',
          'Learning opportunities',
          'Compensation',
          'Flexibility',
        ],
      },
      {
        id: 'q5',
        type: 'open_ended',
        text: 'What suggestions do you have for improving our workplace?',
        required: false,
      },
    ],
  },
  {
    name: 'Team Pulse Check',
    description:
      'Quick weekly or bi-weekly survey to gauge team morale, workload, and immediate concerns.',
    category: 'engagement',
    is_public: true,
    tags: ['pulse', 'team', 'morale', 'quick'],
    questions: [
      {
        id: 'q1',
        type: 'emoji_rating',
        text: 'How are you feeling about work this week?',
        required: true,
        options: ['😫', '😕', '😐', '😊', '🤩'],
      },
      {
        id: 'q2',
        type: 'likert',
        text: 'How manageable is your current workload?',
        required: true,
        options: [
          'Overwhelming',
          'Too Much',
          'Just Right',
          'Light',
          'Too Light',
        ],
      },
      {
        id: 'q3',
        type: 'likert',
        text: 'How connected do you feel to your team?',
        required: true,
        options: [
          'Very Disconnected',
          'Disconnected',
          'Neutral',
          'Connected',
          'Very Connected',
        ],
      },
      {
        id: 'q4',
        type: 'open_ended',
        text: 'Any blockers or concerns you want to share?',
        required: false,
      },
    ],
  },
  {
    name: 'Performance Review Template',
    description:
      'Structured template for employee self-assessment and performance evaluation discussions.',
    category: 'leadership',
    is_public: true,
    tags: ['performance', 'review', 'evaluation', 'goals'],
    questions: [
      {
        id: 'q1',
        type: 'likert',
        text: 'How well do you feel you met your goals this period?',
        required: true,
        options: [
          'Did Not Meet',
          'Partially Met',
          'Met',
          'Exceeded',
          'Far Exceeded',
        ],
      },
      {
        id: 'q2',
        type: 'open_ended',
        text: 'What were your key accomplishments this period?',
        required: true,
      },
      {
        id: 'q3',
        type: 'open_ended',
        text: 'What challenges did you face and how did you address them?',
        required: true,
      },
      {
        id: 'q4',
        type: 'open_ended',
        text: 'What skills would you like to develop further?',
        required: false,
      },
      {
        id: 'q5',
        type: 'open_ended',
        text: 'What goals would you like to set for the next period?',
        required: true,
      },
    ],
  },
  {
    name: 'Exit Interview Survey',
    description:
      'Comprehensive exit interview template to gather feedback from departing employees.',
    category: 'culture',
    is_public: true,
    tags: ['exit', 'feedback', 'retention', 'improvement'],
    questions: [
      {
        id: 'q1',
        type: 'multiple_choice',
        text: 'What is your primary reason for leaving?',
        required: true,
        options: [
          'Better opportunity',
          'Compensation',
          'Work-life balance',
          'Management',
          'Career growth',
          'Company culture',
          'Other',
        ],
      },
      {
        id: 'q2',
        type: 'likert',
        text: 'How satisfied were you with your compensation?',
        required: true,
        options: [
          'Very Dissatisfied',
          'Dissatisfied',
          'Neutral',
          'Satisfied',
          'Very Satisfied',
        ],
      },
      {
        id: 'q3',
        type: 'likert',
        text: 'How would you rate the support from your manager?',
        required: true,
        options: ['Very Poor', 'Poor', 'Average', 'Good', 'Excellent'],
      },
      {
        id: 'q4',
        type: 'open_ended',
        text: 'What could the company have done to retain you?',
        required: false,
      },
      {
        id: 'q5',
        type: 'open_ended',
        text: 'Any additional feedback for the organization?',
        required: false,
      },
    ],
  },
  {
    name: 'New Employee Onboarding Feedback',
    description:
      'Gather feedback from new hires about their onboarding experience and early impressions.',
    category: 'culture',
    is_public: true,
    tags: ['onboarding', 'new hire', 'feedback', 'experience'],
    questions: [
      {
        id: 'q1',
        type: 'likert',
        text: 'How would you rate your overall onboarding experience?',
        required: true,
        options: ['Very Poor', 'Poor', 'Average', 'Good', 'Excellent'],
      },
      {
        id: 'q2',
        type: 'likert',
        text: 'How well prepared did you feel for your role after onboarding?',
        required: true,
        options: [
          'Not Prepared',
          'Slightly Prepared',
          'Moderately Prepared',
          'Well Prepared',
          'Very Well Prepared',
        ],
      },
      {
        id: 'q3',
        type: 'multiple_choice',
        text: 'Which aspects of onboarding were most helpful? (Select all that apply)',
        required: false,
        options: [
          'Orientation sessions',
          'Buddy/mentor program',
          'Training materials',
          'Team introductions',
          'IT setup',
          'HR sessions',
        ],
      },
      {
        id: 'q4',
        type: 'open_ended',
        text: 'What would you improve about the onboarding process?',
        required: false,
      },
    ],
  },
];

// Seed sample templates
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permissions - only users who can create surveys can seed templates
    if (!hasFeaturePermission(session.user.role, 'CREATE_SURVEYS')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();

    // Check if templates already exist
    const existingCount = await SurveyTemplate.countDocuments({
      company_id: session.user.companyId,
    });

    if (existingCount > 0) {
      return NextResponse.json({
        message: 'Templates already exist for this company',
        count: existingCount,
      });
    }

    // Create sample templates
    const templates = sampleTemplates.map((template) => ({
      ...template,
      created_by: session.user.id,
      company_id: session.user.companyId,
      settings: {
        anonymous: false,
        allow_partial_responses: true,
        randomize_questions: false,
        show_progress: true,
        auto_save: true,
      },
      usage_count: 0,
      created_at: new Date(),
      updated_at: new Date(),
    }));

    const createdTemplates = await SurveyTemplate.insertMany(templates);

    return NextResponse.json({
      success: true,
      message: `Created ${createdTemplates.length} sample templates`,
      templates: createdTemplates.map((t) => ({
        id: t._id,
        name: t.name,
        category: t.category,
      })),
    });
  } catch (error) {
    console.error('Error seeding templates:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
