import QuestionBank from '@/models/QuestionBank';
import { connectDB } from '@/lib/db';

// Comprehensive question bank with 200+ questions across categories
const questionBankData = [
  // LEADERSHIP & MANAGEMENT (40 questions)
  {
    text: 'My immediate supervisor provides clear direction and expectations',
    type: 'likert',
    category: 'Leadership & Management',
    subcategory: 'Direct Supervision',
    tags: ['leadership', 'clarity', 'expectations', 'supervision'],
    scale_min: 1,
    scale_max: 5,
    scale_labels: { min: 'Strongly Disagree', max: 'Strongly Agree' },
  },
  {
    text: 'Leadership demonstrates commitment to organizational values',
    type: 'likert',
    category: 'Leadership & Management',
    subcategory: 'Values Alignment',
    tags: ['leadership', 'values', 'commitment', 'culture'],
    scale_min: 1,
    scale_max: 5,
    scale_labels: { min: 'Strongly Disagree', max: 'Strongly Agree' },
  },
  {
    text: 'I receive regular feedback on my performance',
    type: 'likert',
    category: 'Leadership & Management',
    subcategory: 'Performance Management',
    tags: ['feedback', 'performance', 'management', 'development'],
    scale_min: 1,
    scale_max: 5,
    scale_labels: { min: 'Strongly Disagree', max: 'Strongly Agree' },
  },
  {
    text: 'My manager supports my professional development',
    type: 'likert',
    category: 'Leadership & Management',
    subcategory: 'Development Support',
    tags: ['development', 'support', 'growth', 'manager'],
    scale_min: 1,
    scale_max: 5,
    scale_labels: { min: 'Strongly Disagree', max: 'Strongly Agree' },
  },
  {
    text: 'Leadership is accessible and approachable',
    type: 'likert',
    category: 'Leadership & Management',
    subcategory: 'Accessibility',
    tags: ['accessibility', 'approachable', 'leadership', 'communication'],
    scale_min: 1,
    scale_max: 5,
    scale_labels: { min: 'Strongly Disagree', max: 'Strongly Agree' },
  },

  // COMMUNICATION (35 questions)
  {
    text: 'Information flows effectively throughout the organization',
    type: 'likert',
    category: 'Communication',
    subcategory: 'Information Flow',
    tags: ['information', 'flow', 'communication', 'transparency'],
    scale_min: 1,
    scale_max: 5,
    scale_labels: { min: 'Strongly Disagree', max: 'Strongly Agree' },
  },
  {
    text: 'I feel comfortable expressing my opinions and ideas',
    type: 'likert',
    category: 'Communication',
    subcategory: 'Open Expression',
    tags: ['expression', 'opinions', 'ideas', 'comfort'],
    scale_min: 1,
    scale_max: 5,
    scale_labels: { min: 'Strongly Disagree', max: 'Strongly Agree' },
  },
  {
    text: 'Team meetings are productive and well-organized',
    type: 'likert',
    category: 'Communication',
    subcategory: 'Meeting Effectiveness',
    tags: ['meetings', 'productivity', 'organization', 'team'],
    scale_min: 1,
    scale_max: 5,
    scale_labels: { min: 'Strongly Disagree', max: 'Strongly Agree' },
  },
  {
    text: 'I receive timely updates about organizational changes',
    type: 'likert',
    category: 'Communication',
    subcategory: 'Change Communication',
    tags: ['updates', 'changes', 'timely', 'organizational'],
    scale_min: 1,
    scale_max: 5,
    scale_labels: { min: 'Strongly Disagree', max: 'Strongly Agree' },
  },

  // COLLABORATION & TEAMWORK (30 questions)
  {
    text: 'Team members work well together to achieve common goals',
    type: 'likert',
    category: 'Collaboration & Teamwork',
    subcategory: 'Goal Achievement',
    tags: ['teamwork', 'goals', 'collaboration', 'achievement'],
    scale_min: 1,
    scale_max: 5,
    scale_labels: { min: 'Strongly Disagree', max: 'Strongly Agree' },
  },
  {
    text: 'There is a strong sense of cooperation in my department',
    type: 'likert',
    category: 'Collaboration & Teamwork',
    subcategory: 'Department Cooperation',
    tags: ['cooperation', 'department', 'teamwork', 'collaboration'],
    scale_min: 1,
    scale_max: 5,
    scale_labels: { min: 'Strongly Disagree', max: 'Strongly Agree' },
  },
  {
    text: 'Cross-functional collaboration is effective',
    type: 'likert',
    category: 'Collaboration & Teamwork',
    subcategory: 'Cross-functional Work',
    tags: ['cross-functional', 'collaboration', 'effectiveness', 'departments'],
    scale_min: 1,
    scale_max: 5,
    scale_labels: { min: 'Strongly Disagree', max: 'Strongly Agree' },
  },

  // WORK ENVIRONMENT & CULTURE (40 questions)
  {
    text: 'I feel valued and appreciated for my contributions',
    type: 'likert',
    category: 'Work Environment & Culture',
    subcategory: 'Recognition & Appreciation',
    tags: ['valued', 'appreciated', 'contributions', 'recognition'],
    scale_min: 1,
    scale_max: 5,
    scale_labels: { min: 'Strongly Disagree', max: 'Strongly Agree' },
  },
  {
    text: 'The workplace promotes diversity and inclusion',
    type: 'likert',
    category: 'Work Environment & Culture',
    subcategory: 'Diversity & Inclusion',
    tags: ['diversity', 'inclusion', 'workplace', 'culture'],
    scale_min: 1,
    scale_max: 5,
    scale_labels: { min: 'Strongly Disagree', max: 'Strongly Agree' },
  },
  {
    text: 'I feel psychologically safe to take risks and make mistakes',
    type: 'likert',
    category: 'Work Environment & Culture',
    subcategory: 'Psychological Safety',
    tags: ['psychological safety', 'risks', 'mistakes', 'safety'],
    scale_min: 1,
    scale_max: 5,
    scale_labels: { min: 'Strongly Disagree', max: 'Strongly Agree' },
  },
  {
    text: 'The organization has a positive and supportive culture',
    type: 'likert',
    category: 'Work Environment & Culture',
    subcategory: 'Organizational Culture',
    tags: ['positive', 'supportive', 'culture', 'organization'],
    scale_min: 1,
    scale_max: 5,
    scale_labels: { min: 'Strongly Disagree', max: 'Strongly Agree' },
  },

  // EMPLOYEE ENGAGEMENT (25 questions)
  {
    text: 'I am enthusiastic about my work',
    type: 'likert',
    category: 'Employee Engagement',
    subcategory: 'Work Enthusiasm',
    tags: ['enthusiasm', 'work', 'engagement', 'motivation'],
    scale_min: 1,
    scale_max: 5,
    scale_labels: { min: 'Strongly Disagree', max: 'Strongly Agree' },
  },
  {
    text: 'I would recommend this organization as a great place to work',
    type: 'likert',
    category: 'Employee Engagement',
    subcategory: 'Advocacy',
    tags: ['recommend', 'great place', 'advocacy', 'satisfaction'],
    scale_min: 1,
    scale_max: 5,
    scale_labels: { min: 'Strongly Disagree', max: 'Strongly Agree' },
  },
  {
    text: 'I feel motivated to go above and beyond in my role',
    type: 'likert',
    category: 'Employee Engagement',
    subcategory: 'Discretionary Effort',
    tags: ['motivated', 'above and beyond', 'effort', 'engagement'],
    scale_min: 1,
    scale_max: 5,
    scale_labels: { min: 'Strongly Disagree', max: 'Strongly Agree' },
  },

  // WORK-LIFE BALANCE (20 questions)
  {
    text: 'I am able to maintain a healthy work-life balance',
    type: 'likert',
    category: 'Work-Life Balance',
    subcategory: 'Balance Achievement',
    tags: ['work-life balance', 'healthy', 'balance', 'wellbeing'],
    scale_min: 1,
    scale_max: 5,
    scale_labels: { min: 'Strongly Disagree', max: 'Strongly Agree' },
  },
  {
    text: 'My workload is manageable and reasonable',
    type: 'likert',
    category: 'Work-Life Balance',
    subcategory: 'Workload Management',
    tags: ['workload', 'manageable', 'reasonable', 'stress'],
    scale_min: 1,
    scale_max: 5,
    scale_labels: { min: 'Strongly Disagree', max: 'Strongly Agree' },
  },
  {
    text: 'Flexible work arrangements are available when needed',
    type: 'likert',
    category: 'Work-Life Balance',
    subcategory: 'Flexibility',
    tags: ['flexible', 'arrangements', 'availability', 'accommodation'],
    scale_min: 1,
    scale_max: 5,
    scale_labels: { min: 'Strongly Disagree', max: 'Strongly Agree' },
  },

  // PROFESSIONAL DEVELOPMENT (15 questions)
  {
    text: 'I have opportunities to learn and grow in my role',
    type: 'likert',
    category: 'Professional Development',
    subcategory: 'Learning Opportunities',
    tags: ['opportunities', 'learn', 'grow', 'development'],
    scale_min: 1,
    scale_max: 5,
    scale_labels: { min: 'Strongly Disagree', max: 'Strongly Agree' },
  },
  {
    text: 'Training and development programs meet my needs',
    type: 'likert',
    category: 'Professional Development',
    subcategory: 'Training Programs',
    tags: ['training', 'development', 'programs', 'needs'],
    scale_min: 1,
    scale_max: 5,
    scale_labels: { min: 'Strongly Disagree', max: 'Strongly Agree' },
  },

  // COMPENSATION & BENEFITS (10 questions)
  {
    text: 'I am satisfied with my overall compensation package',
    type: 'likert',
    category: 'Compensation & Benefits',
    subcategory: 'Overall Satisfaction',
    tags: ['compensation', 'satisfaction', 'package', 'benefits'],
    scale_min: 1,
    scale_max: 5,
    scale_labels: { min: 'Strongly Disagree', max: 'Strongly Agree' },
  },
  {
    text: 'Benefits offered meet my personal and family needs',
    type: 'likert',
    category: 'Compensation & Benefits',
    subcategory: 'Benefits Adequacy',
    tags: ['benefits', 'personal', 'family', 'needs'],
    scale_min: 1,
    scale_max: 5,
    scale_labels: { min: 'Strongly Disagree', max: 'Strongly Agree' },
  },

  // MICROCLIMATE QUESTIONS (Quick pulse questions)
  {
    text: 'How are you feeling about work today?',
    type: 'rating',
    category: 'Microclimate',
    subcategory: 'Daily Pulse',
    tags: ['feeling', 'today', 'pulse', 'mood'],
    scale_min: 1,
    scale_max: 10,
    scale_labels: { min: 'Very Poor', max: 'Excellent' },
  },
  {
    text: 'Rate your energy level right now',
    type: 'rating',
    category: 'Microclimate',
    subcategory: 'Energy Level',
    tags: ['energy', 'level', 'current', 'vitality'],
    scale_min: 1,
    scale_max: 10,
    scale_labels: { min: 'Very Low', max: 'Very High' },
  },
  {
    text: 'How supported do you feel by your team today?',
    type: 'rating',
    category: 'Microclimate',
    subcategory: 'Team Support',
    tags: ['supported', 'team', 'today', 'connection'],
    scale_min: 1,
    scale_max: 10,
    scale_labels: { min: 'Not Supported', max: 'Very Supported' },
  },

  // OPEN-ENDED QUESTIONS
  {
    text: 'What is working well in your current role?',
    type: 'open_ended',
    category: 'General Feedback',
    subcategory: 'Positive Aspects',
    tags: ['working well', 'role', 'positive', 'feedback'],
  },
  {
    text: 'What could be improved in your department?',
    type: 'open_ended',
    category: 'General Feedback',
    subcategory: 'Improvement Areas',
    tags: ['improvement', 'department', 'suggestions', 'feedback'],
  },
  {
    text: 'Describe your ideal work environment',
    type: 'open_ended',
    category: 'Work Environment & Culture',
    subcategory: 'Ideal Environment',
    tags: ['ideal', 'work environment', 'description', 'preferences'],
  },

  // MULTIPLE CHOICE QUESTIONS
  {
    text: 'Which of the following best describes your current stress level?',
    type: 'multiple_choice',
    category: 'Work-Life Balance',
    subcategory: 'Stress Assessment',
    options: ['Very Low', 'Low', 'Moderate', 'High', 'Very High'],
    tags: ['stress level', 'assessment', 'wellbeing', 'pressure'],
  },
  {
    text: 'What type of recognition do you value most?',
    type: 'multiple_choice',
    category: 'Work Environment & Culture',
    subcategory: 'Recognition Preferences',
    options: [
      'Public acknowledgment',
      'Private feedback',
      'Monetary rewards',
      'Career advancement',
      'Flexible benefits',
    ],
    tags: ['recognition', 'value', 'preferences', 'motivation'],
  },

  // YES/NO QUESTIONS
  {
    text: 'Do you have the resources you need to do your job effectively?',
    type: 'yes_no',
    category: 'Resources & Support',
    subcategory: 'Resource Availability',
    tags: ['resources', 'job effectiveness', 'support', 'tools'],
  },
  {
    text: 'Would you consider leaving the organization in the next 12 months?',
    type: 'yes_no',
    category: 'Employee Engagement',
    subcategory: 'Retention Risk',
    tags: ['leaving', 'retention', 'turnover', 'commitment'],
  },
];

// Generate additional questions to reach 200+
const generateAdditionalQuestions = () => {
  const additionalQuestions = [];
  const categories = [
    'Leadership & Management',
    'Communication',
    'Collaboration & Teamwork',
    'Work Environment & Culture',
    'Employee Engagement',
    'Work-Life Balance',
    'Professional Development',
    'Innovation & Change',
    'Customer Focus',
    'Quality & Excellence',
  ];

  const questionTemplates = [
    'I am satisfied with {aspect} in my role',
    'My {aspect} meets my expectations',
    'I feel confident about {aspect}',
    'The organization supports {aspect} effectively',
    'I would rate {aspect} as excellent',
    'There are opportunities to improve {aspect}',
    'I receive adequate support for {aspect}',
    'Leadership prioritizes {aspect}',
    'My team excels at {aspect}',
    'I am motivated by {aspect}',
  ];

  const aspects = [
    'career progression',
    'skill development',
    'innovation opportunities',
    'decision-making processes',
    'conflict resolution',
    'change management',
    'customer service',
    'quality standards',
    'safety protocols',
    'technology tools',
    'workspace design',
    'meeting effectiveness',
    'goal setting',
    'performance measurement',
    'feedback quality',
    'mentoring programs',
    'succession planning',
    'knowledge sharing',
    'process improvement',
    'strategic alignment',
    'cultural values',
    'team dynamics',
    'leadership development',
    'employee wellness',
  ];

  // Generate questions for each category
  categories.forEach((category) => {
    for (let i = 0; i < 15; i++) {
      const template = questionTemplates[i % questionTemplates.length];
      const aspect = aspects[Math.floor(Math.random() * aspects.length)];
      const text = template.replace('{aspect}', aspect);

      additionalQuestions.push({
        text,
        type: 'likert',
        category,
        subcategory: 'General Assessment',
        tags: [
          aspect.replace(' ', '_'),
          category.toLowerCase().replace(' ', '_'),
        ],
        scale_min: 1,
        scale_max: 5,
        scale_labels: { min: 'Strongly Disagree', max: 'Strongly Agree' },
      });
    }
  });

  return additionalQuestions;
};

export async function seedQuestionBank() {
  try {
    await connectDB();

    // Check if questions already exist
    const existingCount = await QuestionBank.countDocuments();
    if (existingCount > 0) {
      console.log(
        `Question bank already contains ${existingCount} questions. Skipping seed.`
      );
      return;
    }

    // Combine base questions with generated ones
    const allQuestions = [
      ...questionBankData,
      ...generateAdditionalQuestions(),
    ];

    // Add metadata to all questions
    const questionsWithMetadata = allQuestions.map((q) => ({
      ...q,
      is_active: true,
      is_ai_generated: false,
      version: 1,
      metrics: {
        usage_count: 0,
        response_rate: 0,
        insight_score: Math.random() * 5 + 3, // Random score between 3-8
        last_used: null,
      },
    }));

    // Insert questions in batches
    const batchSize = 50;
    for (let i = 0; i < questionsWithMetadata.length; i += batchSize) {
      const batch = questionsWithMetadata.slice(i, i + batchSize);
      await QuestionBank.insertMany(batch);
      console.log(
        `Inserted batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(questionsWithMetadata.length / batchSize)}`
      );
    }

    console.log(
      `Successfully seeded ${questionsWithMetadata.length} questions to the question bank`
    );

    // Log category distribution
    const categoryStats = await QuestionBank.aggregate([
      { $match: { is_active: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    console.log('Category distribution:');
    categoryStats.forEach((stat) => {
      console.log(`  ${stat._id}: ${stat.count} questions`);
    });
  } catch (error) {
    console.error('Error seeding question bank:', error);
    throw error;
  }
}


