import { connectDB } from './db';
import MicroclimateTemplate from '@/models/MicroclimateTemplate';

const SYSTEM_TEMPLATES = [
  {
    name: 'Weekly Team Pulse',
    description:
      'Quick weekly check-in to gauge team mood and identify any blockers or concerns',
    category: 'pulse_check',
    is_system_template: true,
    questions: [
      {
        id: 'q1',
        text: 'How are you feeling about your work this week?',
        type: 'emoji_rating',
        required: true,
        order: 0,
        category: 'mood',
      },
      {
        id: 'q2',
        text: 'Are there any blockers preventing you from doing your best work?',
        type: 'open_ended',
        required: false,
        order: 1,
        category: 'blockers',
      },
      {
        id: 'q3',
        text: 'How supported do you feel by your team?',
        type: 'likert',
        required: true,
        order: 2,
        category: 'support',
      },
    ],
    settings: {
      default_duration_minutes: 15,
      suggested_frequency: 'weekly',
      anonymous_by_default: true,
      auto_close: true,
      show_live_results: true,
    },
    tags: ['weekly', 'pulse', 'mood', 'quick'],
  },
  {
    name: 'Team Mood Check',
    description:
      'Simple mood assessment to understand team sentiment and energy levels',
    category: 'team_mood',
    is_system_template: true,
    questions: [
      {
        id: 'q1',
        text: 'What emoji best describes your current mood at work?',
        type: 'emoji_rating',
        required: true,
        order: 0,
        category: 'mood',
      },
      {
        id: 'q2',
        text: 'What is contributing most to your current mood?',
        type: 'multiple_choice',
        options: [
          'Workload',
          'Team dynamics',
          'Project progress',
          'Work-life balance',
          'Other',
        ],
        required: true,
        order: 1,
        category: 'factors',
      },
      {
        id: 'q3',
        text: "Any additional thoughts you'd like to share?",
        type: 'open_ended',
        required: false,
        order: 2,
        category: 'feedback',
      },
    ],
    settings: {
      default_duration_minutes: 10,
      suggested_frequency: 'bi_weekly',
      anonymous_by_default: true,
      auto_close: true,
      show_live_results: true,
    },
    tags: ['mood', 'sentiment', 'quick', 'emoji'],
  },
  {
    name: 'Project Retrospective',
    description:
      'Comprehensive retrospective to gather feedback on project completion and team performance',
    category: 'project_retrospective',
    is_system_template: true,
    questions: [
      {
        id: 'q1',
        text: 'How satisfied are you with the project outcome?',
        type: 'likert',
        required: true,
        order: 0,
        category: 'satisfaction',
      },
      {
        id: 'q2',
        text: 'What went well during this project?',
        type: 'open_ended',
        required: true,
        order: 1,
        category: 'positives',
      },
      {
        id: 'q3',
        text: 'What could we improve for next time?',
        type: 'open_ended',
        required: true,
        order: 2,
        category: 'improvements',
      },
      {
        id: 'q4',
        text: 'How would you rate team collaboration?',
        type: 'likert',
        required: true,
        order: 3,
        category: 'collaboration',
      },
      {
        id: 'q5',
        text: 'What was the biggest challenge faced?',
        type: 'multiple_choice',
        options: [
          'Communication',
          'Resources',
          'Timeline',
          'Technical issues',
          'Scope changes',
          'Other',
        ],
        required: true,
        order: 4,
        category: 'challenges',
      },
    ],
    settings: {
      default_duration_minutes: 45,
      suggested_frequency: 'monthly',
      anonymous_by_default: false,
      auto_close: true,
      show_live_results: false,
    },
    tags: ['retrospective', 'project', 'feedback', 'improvement'],
  },
  {
    name: 'Feedback Session',
    description:
      'Structured feedback collection for continuous improvement and team development',
    category: 'feedback_session',
    is_system_template: true,
    questions: [
      {
        id: 'q1',
        text: 'What is working well in our team?',
        type: 'open_ended',
        required: true,
        order: 0,
        category: 'positives',
      },
      {
        id: 'q2',
        text: 'What should we start doing?',
        type: 'open_ended',
        required: false,
        order: 1,
        category: 'start',
      },
      {
        id: 'q3',
        text: 'What should we stop doing?',
        type: 'open_ended',
        required: false,
        order: 2,
        category: 'stop',
      },
      {
        id: 'q4',
        text: 'What should we continue doing?',
        type: 'open_ended',
        required: false,
        order: 3,
        category: 'continue',
      },
      {
        id: 'q5',
        text: 'How can leadership better support the team?',
        type: 'open_ended',
        required: false,
        order: 4,
        category: 'leadership',
      },
    ],
    settings: {
      default_duration_minutes: 30,
      suggested_frequency: 'monthly',
      anonymous_by_default: true,
      auto_close: true,
      show_live_results: true,
    },
    tags: ['feedback', 'improvement', 'start-stop-continue', 'leadership'],
  },
  {
    name: 'Daily Standup Mood',
    description: 'Quick daily mood check to complement standup meetings',
    category: 'pulse_check',
    is_system_template: true,
    questions: [
      {
        id: 'q1',
        text: "How are you feeling about today's work?",
        type: 'emoji_rating',
        required: true,
        order: 0,
        category: 'mood',
      },
      {
        id: 'q2',
        text: 'Do you have any blockers or concerns?',
        type: 'multiple_choice',
        options: [
          'No blockers',
          'Technical issues',
          'Waiting for input',
          'Resource constraints',
          'Other',
        ],
        required: true,
        order: 1,
        category: 'blockers',
      },
    ],
    settings: {
      default_duration_minutes: 5,
      suggested_frequency: 'daily',
      anonymous_by_default: true,
      auto_close: true,
      show_live_results: true,
    },
    tags: ['daily', 'standup', 'quick', 'blockers'],
  },
  {
    name: 'Engagement Survey',
    description:
      'Comprehensive engagement assessment to understand team satisfaction and motivation',
    category: 'pulse_check',
    is_system_template: true,
    questions: [
      {
        id: 'q1',
        text: 'How engaged do you feel with your current work?',
        type: 'likert',
        required: true,
        order: 0,
        category: 'engagement',
      },
      {
        id: 'q2',
        text: 'How likely are you to recommend this company as a great place to work?',
        type: 'likert',
        required: true,
        order: 1,
        category: 'nps',
      },
      {
        id: 'q3',
        text: 'What motivates you most in your role?',
        type: 'multiple_choice',
        options: [
          'Learning opportunities',
          'Recognition',
          'Autonomy',
          'Team collaboration',
          'Impact',
          'Compensation',
        ],
        required: true,
        order: 2,
        category: 'motivation',
      },
      {
        id: 'q4',
        text: 'What would increase your job satisfaction?',
        type: 'open_ended',
        required: false,
        order: 3,
        category: 'satisfaction',
      },
    ],
    settings: {
      default_duration_minutes: 20,
      suggested_frequency: 'monthly',
      anonymous_by_default: true,
      auto_close: true,
      show_live_results: false,
    },
    tags: ['engagement', 'satisfaction', 'nps', 'motivation'],
  },
];

export async function seedMicroclimateTemplates() {
  try {
    await connectDB();

    // Check if templates already exist
    const existingCount = await MicroclimateTemplate.countDocuments({
      is_system_template: true,
    });

    if (existingCount > 0) {
      console.log('System templates already exist, skipping seed');
      return;
    }

    // Insert system templates
    await MicroclimateTemplate.insertMany(SYSTEM_TEMPLATES);

    console.log(
      `Successfully seeded ${SYSTEM_TEMPLATES.length} microclimate templates`
    );
  } catch (error) {
    console.error('Error seeding microclimate templates:', error);
    throw error;
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seedMicroclimateTemplates()
    .then(() => {
      console.log('Seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
}


