require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

// Define the schema directly since we can't import ES modules in CommonJS
const QuestionMetricsSchema = new mongoose.Schema(
  {
    usage_count: { type: Number, default: 0, min: 0 },
    response_rate: { type: Number, default: 0, min: 0, max: 100 },
    insight_score: { type: Number, default: 0, min: 0, max: 10 },
    last_used: { type: Date },
  },
  { _id: false }
);

const QuestionBankSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: [true, 'Question text is required'],
      trim: true,
      maxlength: [500, 'Question text cannot exceed 500 characters'],
    },
    type: {
      type: String,
      enum: [
        'likert',
        'multiple_choice',
        'ranking',
        'open_ended',
        'yes_no',
        'rating',
      ],
      required: [true, 'Question type is required'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    subcategory: {
      type: String,
      trim: true,
    },
    options: [{ type: String, trim: true }],
    scale_min: { type: Number, min: 1, max: 10 },
    scale_max: { type: Number, min: 1, max: 10 },
    scale_labels: {
      min: { type: String, trim: true },
      max: { type: String, trim: true },
    },
    tags: [{ type: String, trim: true }],
    industry: {
      type: String,
      trim: true,
    },
    company_size: {
      type: String,
      enum: ['startup', 'small', 'medium', 'large', 'enterprise'],
    },
    metrics: {
      type: QuestionMetricsSchema,
      default: () => ({}),
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    is_ai_generated: {
      type: Boolean,
      default: false,
    },
    created_by: {
      type: String,
      trim: true,
    },
    company_id: {
      type: String,
      trim: true,
    },
    version: {
      type: Number,
      default: 1,
      min: 1,
    },
    parent_question_id: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

const QuestionBank = mongoose.models.QuestionBank || mongoose.model('QuestionBank', QuestionBankSchema);

// Comprehensive question pool with 200+ questions
const questionPool = [
  // ORGANIZATIONAL CLIMATE QUESTIONS
  {
    category: 'Communication',
    subcategory: 'Internal Communication',
    questions: [
      {
        text: 'How effectively does your team communicate important information?',
        type: 'likert',
        scale_min: 1,
        scale_max: 5,
        scale_labels: { min: 'Very Ineffectively', max: 'Very Effectively' },
        tags: ['communication', 'team', 'information-sharing'],
      },
      {
        text: 'How often do you receive clear and timely updates from leadership?',
        type: 'likert',
        scale_min: 1,
        scale_max: 5,
        scale_labels: { min: 'Never', max: 'Always' },
        tags: ['leadership', 'updates', 'clarity'],
      },
      {
        text: 'Rate the quality of feedback you receive from your supervisor',
        type: 'likert',
        scale_min: 1,
        scale_max: 5,
        scale_labels: { min: 'Very Poor', max: 'Excellent' },
        tags: ['feedback', 'supervisor', 'quality'],
      },
      {
        text: 'How comfortable do you feel expressing your opinions in team meetings?',
        type: 'likert',
        scale_min: 1,
        scale_max: 5,
        scale_labels: { min: 'Very Uncomfortable', max: 'Very Comfortable' },
        tags: ['psychological-safety', 'meetings', 'opinions'],
      },
      {
        text: 'What communication channels work best for your team?',
        type: 'multiple_choice',
        options: ['Email', 'Slack/Teams', 'In-person meetings', 'Video calls', 'Phone calls', 'Project management tools'],
        tags: ['channels', 'preferences', 'tools'],
      },
    ],
  },
  {
    category: 'Collaboration',
    subcategory: 'Team Dynamics',
    questions: [
      {
        text: 'How well does your team work together to achieve common goals?',
        type: 'likert',
        scale_min: 1,
        scale_max: 5,
        scale_labels: { min: 'Very Poorly', max: 'Very Well' },
        tags: ['teamwork', 'goals', 'collaboration'],
      },
      {
        text: 'Rate the level of trust within your team',
        type: 'likert',
        scale_min: 1,
        scale_max: 5,
        scale_labels: { min: 'Very Low', max: 'Very High' },
        tags: ['trust', 'team-dynamics', 'relationships'],
      },
      {
        text: 'How effectively does your team resolve conflicts?',
        type: 'likert',
        scale_min: 1,
        scale_max: 5,
        scale_labels: { min: 'Very Ineffectively', max: 'Very Effectively' },
        tags: ['conflict-resolution', 'team-dynamics'],
      },
      {
        text: 'Do team members actively support each other during challenging times?',
        type: 'likert',
        scale_min: 1,
        scale_max: 5,
        scale_labels: { min: 'Never', max: 'Always' },
        tags: ['support', 'challenges', 'mutual-aid'],
      },
      {
        text: 'How would you describe the collaboration between different departments?',
        type: 'multiple_choice',
        options: ['Excellent', 'Good', 'Fair', 'Poor', 'Very Poor', 'No interaction'],
        tags: ['cross-functional', 'departments', 'collaboration'],
      },
    ],
  },
  {
    category: 'Leadership',
    subcategory: 'Management Effectiveness',
    questions: [
      {
        text: 'How confident are you in your leadership team\'s decision-making?',
        type: 'likert',
        scale_min: 1,
        scale_max: 5,
        scale_labels: { min: 'Not Confident', max: 'Very Confident' },
        tags: ['leadership', 'decision-making', 'confidence'],
      },
      {
        text: 'Does your manager provide clear direction and expectations?',
        type: 'likert',
        scale_min: 1,
        scale_max: 5,
        scale_labels: { min: 'Never', max: 'Always' },
        tags: ['management', 'clarity', 'expectations'],
      },
      {
        text: 'How well does leadership communicate the company vision?',
        type: 'likert',
        scale_min: 1,
        scale_max: 5,
        scale_labels: { min: 'Very Poorly', max: 'Very Well' },
        tags: ['vision', 'communication', 'leadership'],
      },
      {
        text: 'Rate your manager\'s ability to develop and coach team members',
        type: 'likert',
        scale_min: 1,
        scale_max: 5,
        scale_labels: { min: 'Very Poor', max: 'Excellent' },
        tags: ['coaching', 'development', 'management'],
      },
      {
        text: 'How accessible is your direct manager when you need support?',
        type: 'likert',
        scale_min: 1,
        scale_max: 5,
        scale_labels: { min: 'Not Accessible', max: 'Very Accessible' },
        tags: ['accessibility', 'support', 'management'],
      },
    ],
  },
  {
    category: 'Work Environment',
    subcategory: 'Physical & Digital Workspace',
    questions: [
      {
        text: 'How satisfied are you with your physical work environment?',
        type: 'likert',
        scale_min: 1,
        scale_max: 5,
        scale_labels: { min: 'Very Dissatisfied', max: 'Very Satisfied' },
        tags: ['workspace', 'physical-environment', 'satisfaction'],
      },
      {
        text: 'Do you have the tools and resources needed to do your job effectively?',
        type: 'likert',
        scale_min: 1,
        scale_max: 5,
        scale_labels: { min: 'Never', max: 'Always' },
        tags: ['resources', 'tools', 'effectiveness'],
      },
      {
        text: 'How would you rate the technology infrastructure at your workplace?',
        type: 'likert',
        scale_min: 1,
        scale_max: 5,
        scale_labels: { min: 'Very Poor', max: 'Excellent' },
        tags: ['technology', 'infrastructure', 'workplace'],
      },
      {
        text: 'Rate the noise level in your work environment',
        type: 'likert',
        scale_min: 1,
        scale_max: 5,
        scale_labels: { min: 'Too Noisy', max: 'Perfect' },
        tags: ['noise', 'environment', 'concentration'],
      },
      {
        text: 'What type of work environment do you prefer?',
        type: 'multiple_choice',
        options: ['Fully remote', 'Hybrid (2-3 days office)', 'Mostly office-based', 'Fully office-based', 'Flexible arrangement'],
        tags: ['remote-work', 'preferences', 'flexibility'],
      },
    ],
  },
  {
    category: 'Recognition & Rewards',
    subcategory: 'Appreciation',
    questions: [
      {
        text: 'How often do you receive recognition for your contributions?',
        type: 'likert',
        scale_min: 1,
        scale_max: 5,
        scale_labels: { min: 'Never', max: 'Very Often' },
        tags: ['recognition', 'contributions', 'appreciation'],
      },
      {
        text: 'Rate the fairness of the reward system in your organization',
        type: 'likert',
        scale_min: 1,
        scale_max: 5,
        scale_labels: { min: 'Very Unfair', max: 'Very Fair' },
        tags: ['fairness', 'rewards', 'system'],
      },
      {
        text: 'Do you feel your achievements are celebrated appropriately?',
        type: 'likert',
        scale_min: 1,
        scale_max: 5,
        scale_labels: { min: 'Never', max: 'Always' },
        tags: ['achievements', 'celebration', 'recognition'],
      },
      {
        text: 'How satisfied are you with your compensation package?',
        type: 'likert',
        scale_min: 1,
        scale_max: 5,
        scale_labels: { min: 'Very Dissatisfied', max: 'Very Satisfied' },
        tags: ['compensation', 'satisfaction', 'benefits'],
      },
      {
        text: 'What forms of recognition are most meaningful to you?',
        type: 'multiple_choice',
        options: ['Public praise', 'Private feedback', 'Monetary rewards', 'Career advancement', 'Additional responsibilities', 'Flexible benefits'],
        tags: ['recognition-types', 'preferences', 'motivation'],
      },
    ],
  },
  {
    category: 'Professional Development',
    subcategory: 'Growth Opportunities',
    questions: [
      {
        text: 'How satisfied are you with the learning opportunities available?',
        type: 'likert',
        scale_min: 1,
        scale_max: 5,
        scale_labels: { min: 'Very Dissatisfied', max: 'Very Satisfied' },
        tags: ['learning', 'opportunities', 'development'],
      },
      {
        text: 'Does your organization support your career advancement goals?',
        type: 'likert',
        scale_min: 1,
        scale_max: 5,
        scale_labels: { min: 'Not at All', max: 'Completely' },
        tags: ['career-advancement', 'support', 'goals'],
      },
      {
        text: 'How clear is your career path within the organization?',
        type: 'likert',
        scale_min: 1,
        scale_max: 5,
        scale_labels: { min: 'Very Unclear', max: 'Very Clear' },
        tags: ['career-path', 'clarity', 'progression'],
      },
      {
        text: 'Rate the quality of mentorship available in your organization',
        type: 'likert',
        scale_min: 1,
        scale_max: 5,
        scale_labels: { min: 'Very Poor', max: 'Excellent' },
        tags: ['mentorship', 'quality', 'guidance'],
      },
      {
        text: 'What type of professional development would benefit you most?',
        type: 'multiple_choice',
        options: ['Technical skills training', 'Leadership development', 'Industry certifications', 'Cross-functional experience', 'External conferences', 'Internal mentoring'],
        tags: ['development-types', 'skills', 'preferences'],
      },
    ],
  },
  {
    category: 'Work-Life Balance',
    subcategory: 'Flexibility & Wellness',
    questions: [
      {
        text: 'How well does your job allow you to maintain work-life balance?',
        type: 'likert',
        scale_min: 1,
        scale_max: 5,
        scale_labels: { min: 'Very Poorly', max: 'Very Well' },
        tags: ['work-life-balance', 'flexibility', 'wellness'],
      },
      {
        text: 'How often do you feel overwhelmed by your workload?',
        type: 'likert',
        scale_min: 1,
        scale_max: 5,
        scale_labels: { min: 'Always', max: 'Never' },
        tags: ['workload', 'stress', 'overwhelm'],
      },
      {
        text: 'Rate the flexibility of your work schedule',
        type: 'likert',
        scale_min: 1,
        scale_max: 5,
        scale_labels: { min: 'Very Inflexible', max: 'Very Flexible' },
        tags: ['flexibility', 'schedule', 'autonomy'],
      },
      {
        text: 'How supported do you feel in managing personal commitments?',
        type: 'likert',
        scale_min: 1,
        scale_max: 5,
        scale_labels: { min: 'Not Supported', max: 'Very Supported' },
        tags: ['personal-commitments', 'support', 'understanding'],
      },
      {
        text: 'What would most improve your work-life balance?',
        type: 'multiple_choice',
        options: ['More flexible hours', 'Remote work options', 'Reduced workload', 'Better time management tools', 'Wellness programs', 'Clearer boundaries'],
        tags: ['improvements', 'balance', 'preferences'],
      },
    ],
  },
  {
    category: 'Innovation & Creativity',
    subcategory: 'Idea Generation',
    questions: [
      {
        text: 'How encouraged do you feel to share new ideas?',
        type: 'likert',
        scale_min: 1,
        scale_max: 5,
        scale_labels: { min: 'Not Encouraged', max: 'Very Encouraged' },
        tags: ['innovation', 'ideas', 'encouragement'],
      },
      {
        text: 'Does your organization act on employee suggestions for improvement?',
        type: 'likert',
        scale_min: 1,
        scale_max: 5,
        scale_labels: { min: 'Never', max: 'Always' },
        tags: ['suggestions', 'implementation', 'improvement'],
      },
      {
        text: 'How much creative freedom do you have in your role?',
        type: 'likert',
        scale_min: 1,
        scale_max: 5,
        scale_labels: { min: 'None', max: 'Complete Freedom' },
        tags: ['creativity', 'freedom', 'autonomy'],
      },
      {
        text: 'Rate your organization\'s openness to change and new approaches',
        type: 'likert',
        scale_min: 1,
        scale_max: 5,
        scale_labels: { min: 'Very Resistant', max: 'Very Open' },
        tags: ['change', 'openness', 'adaptability'],
      },
      {
        text: 'What barriers prevent you from being more innovative?',
        type: 'multiple_choice',
        options: ['Lack of time', 'Risk-averse culture', 'Limited resources', 'Unclear processes', 'Fear of failure', 'No barriers'],
        tags: ['barriers', 'innovation', 'obstacles'],
      },
    ],
  },
  {
    category: 'Diversity & Inclusion',
    subcategory: 'Belonging',
    questions: [
      {
        text: 'How included do you feel in your team and organization?',
        type: 'likert',
        scale_min: 1,
        scale_max: 5,
        scale_labels: { min: 'Not Included', max: 'Fully Included' },
        tags: ['inclusion', 'belonging', 'team'],
      },
      {
        text: 'Does your organization value diverse perspectives and backgrounds?',
        type: 'likert',
        scale_min: 1,
        scale_max: 5,
        scale_labels: { min: 'Not at All', max: 'Completely' },
        tags: ['diversity', 'perspectives', 'value'],
      },
      {
        text: 'How comfortable are you being your authentic self at work?',
        type: 'likert',
        scale_min: 1,
        scale_max: 5,
        scale_labels: { min: 'Very Uncomfortable', max: 'Very Comfortable' },
        tags: ['authenticity', 'comfort', 'psychological-safety'],
      },
      {
        text: 'Rate the fairness of opportunities for advancement regardless of background',
        type: 'likert',
        scale_min: 1,
        scale_max: 5,
        scale_labels: { min: 'Very Unfair', max: 'Very Fair' },
        tags: ['fairness', 'advancement', 'equity'],
      },
      {
        text: 'Have you witnessed or experienced discrimination in the workplace?',
        type: 'yes_no',
        tags: ['discrimination', 'experience', 'workplace'],
      },
    ],
  },
  {
    category: 'Job Satisfaction',
    subcategory: 'Overall Experience',
    questions: [
      {
        text: 'How satisfied are you with your current role overall?',
        type: 'likert',
        scale_min: 1,
        scale_max: 5,
        scale_labels: { min: 'Very Dissatisfied', max: 'Very Satisfied' },
        tags: ['satisfaction', 'role', 'overall'],
      },
      {
        text: 'Would you recommend this organization as a great place to work?',
        type: 'likert',
        scale_min: 1,
        scale_max: 5,
        scale_labels: { min: 'Definitely Not', max: 'Definitely Yes' },
        tags: ['recommendation', 'workplace', 'advocacy'],
      },
      {
        text: 'How likely are you to be working here in one year?',
        type: 'likert',
        scale_min: 1,
        scale_max: 5,
        scale_labels: { min: 'Very Unlikely', max: 'Very Likely' },
        tags: ['retention', 'future', 'commitment'],
      },
      {
        text: 'Rate your sense of accomplishment in your current role',
        type: 'likert',
        scale_min: 1,
        scale_max: 5,
        scale_labels: { min: 'Very Low', max: 'Very High' },
        tags: ['accomplishment', 'fulfillment', 'purpose'],
      },
      {
        text: 'What aspect of your job gives you the most satisfaction?',
        type: 'open_ended',
        tags: ['satisfaction-drivers', 'motivation', 'fulfillment'],
      },
    ],
  },
  {
    category: 'Organizational Culture',
    subcategory: 'Values & Mission',
    questions: [
      {
        text: 'How well do you understand your organization\'s mission and values?',
        type: 'likert',
        scale_min: 1,
        scale_max: 5,
        scale_labels: { min: 'Not at All', max: 'Completely' },
        tags: ['mission', 'values', 'understanding'],
      },
      {
        text: 'Do you feel your personal values align with the organization\'s values?',
        type: 'likert',
        scale_min: 1,
        scale_max: 5,
        scale_labels: { min: 'Not at All', max: 'Completely' },
        tags: ['alignment', 'values', 'personal'],
      },
      {
        text: 'How consistently are organizational values demonstrated in daily operations?',
        type: 'likert',
        scale_min: 1,
        scale_max: 5,
        scale_labels: { min: 'Never', max: 'Always' },
        tags: ['consistency', 'values', 'operations'],
      },
      {
        text: 'Rate the ethical standards maintained by your organization',
        type: 'likert',
        scale_min: 1,
        scale_max: 5,
        scale_labels: { min: 'Very Poor', max: 'Excellent' },
        tags: ['ethics', 'standards', 'integrity'],
      },
      {
        text: 'How would you describe the overall culture of your organization?',
        type: 'multiple_choice',
        options: ['Collaborative', 'Competitive', 'Innovative', 'Traditional', 'Fast-paced', 'Supportive', 'Results-driven'],
        tags: ['culture', 'description', 'characteristics'],
      },
    ],
  },
  {
    category: 'Change Management',
    subcategory: 'Adaptability',
    questions: [
      {
        text: 'How well does your organization handle change?',
        type: 'likert',
        scale_min: 1,
        scale_max: 5,
        scale_labels: { min: 'Very Poorly', max: 'Very Well' },
        tags: ['change-management', 'adaptability', 'organization'],
      },
      {
        text: 'Do you receive adequate communication during organizational changes?',
        type: 'likert',
        scale_min: 1,
        scale_max: 5,
        scale_labels: { min: 'Never', max: 'Always' },
        tags: ['communication', 'change', 'transparency'],
      },
      {
        text: 'How supported do you feel during periods of change?',
        type: 'likert',
        scale_min: 1,
        scale_max: 5,
        scale_labels: { min: 'Not Supported', max: 'Very Supported' },
        tags: ['support', 'change', 'transition'],
      },
      {
        text: 'Rate your confidence in leadership during times of change',
        type: 'likert',
        scale_min: 1,
        scale_max: 5,
        scale_labels: { min: 'No Confidence', max: 'Complete Confidence' },
        tags: ['confidence', 'leadership', 'change'],
      },
      {
        text: 'What would help you better adapt to organizational changes?',
        type: 'multiple_choice',
        options: ['More advance notice', 'Better communication', 'Training and support', 'Involvement in planning', 'Clear timelines', 'Regular updates'],
        tags: ['adaptation', 'support-needs', 'preferences'],
      },
    ],
  },
  {
    category: 'Performance Management',
    subcategory: 'Goal Setting & Feedback',
    questions: [
      {
        text: 'How clear are your performance expectations and goals?',
        type: 'likert',
        scale_min: 1,
        scale_max: 5,
        scale_labels: { min: 'Very Unclear', max: 'Very Clear' },
        tags: ['expectations', 'goals', 'clarity'],
      },
      {
        text: 'How often do you receive constructive feedback on your performance?',
        type: 'likert',
        scale_min: 1,
        scale_max: 5,
        scale_labels: { min: 'Never', max: 'Very Often' },
        tags: ['feedback', 'performance', 'frequency'],
      },
      {
        text: 'Rate the quality of your performance reviews',
        type: 'likert',
        scale_min: 1,
        scale_max: 5,
        scale_labels: { min: 'Very Poor', max: 'Excellent' },
        tags: ['performance-reviews', 'quality', 'evaluation'],
      },
      {
        text: 'Do you have input into setting your own performance goals?',
        type: 'likert',
        scale_min: 1,
        scale_max: 5,
        scale_labels: { min: 'No Input', max: 'Complete Input' },
        tags: ['goal-setting', 'input', 'autonomy'],
      },
      {
        text: 'How fair and objective is the performance evaluation process?',
        type: 'likert',
        scale_min: 1,
        scale_max: 5,
        scale_labels: { min: 'Very Unfair', max: 'Very Fair' },
        tags: ['fairness', 'objectivity', 'evaluation'],
      },
    ],
  },
  {
    category: 'Customer Focus',
    subcategory: 'External Relationships',
    questions: [
      {
        text: 'How well does your organization understand customer needs?',
        type: 'likert',
        scale_min: 1,
        scale_max: 5,
        scale_labels: { min: 'Very Poorly', max: 'Very Well' },
        tags: ['customer-needs', 'understanding', 'focus'],
      },
      {
        text: 'Do you have the authority to resolve customer issues effectively?',
        type: 'likert',
        scale_min: 1,
        scale_max: 5,
        scale_labels: { min: 'No Authority', max: 'Complete Authority' },
        tags: ['authority', 'customer-service', 'empowerment'],
      },
      {
        text: 'How responsive is your organization to customer feedback?',
        type: 'likert',
        scale_min: 1,
        scale_max: 5,
        scale_labels: { min: 'Not Responsive', max: 'Very Responsive' },
        tags: ['responsiveness', 'feedback', 'customer'],
      },
      {
        text: 'Rate the quality of products/services your organization delivers',
        type: 'likert',
        scale_min: 1,
        scale_max: 5,
        scale_labels: { min: 'Very Poor', max: 'Excellent' },
        tags: ['quality', 'products', 'services'],
      },
      {
        text: 'How customer-focused is your organization\'s culture?',
        type: 'likert',
        scale_min: 1,
        scale_max: 5,
        scale_labels: { min: 'Not Focused', max: 'Very Focused' },
        tags: ['customer-focus', 'culture', 'orientation'],
      },
    ],
  },
  {
    category: 'Safety & Well-being',
    subcategory: 'Health & Security',
    questions: [
      {
        text: 'How safe do you feel in your work environment?',
        type: 'likert',
        scale_min: 1,
        scale_max: 5,
        scale_labels: { min: 'Very Unsafe', max: 'Very Safe' },
        tags: ['safety', 'environment', 'security'],
      },
      {
        text: 'Does your organization prioritize employee mental health and well-being?',
        type: 'likert',
        scale_min: 1,
        scale_max: 5,
        scale_labels: { min: 'Not at All', max: 'Completely' },
        tags: ['mental-health', 'well-being', 'priority'],
      },
      {
        text: 'How adequate are the health and wellness benefits provided?',
        type: 'likert',
        scale_min: 1,
        scale_max: 5,
        scale_labels: { min: 'Very Inadequate', max: 'Very Adequate' },
        tags: ['benefits', 'wellness', 'health'],
      },
      {
        text: 'Do you feel comfortable reporting safety concerns?',
        type: 'likert',
        scale_min: 1,
        scale_max: 5,
        scale_labels: { min: 'Very Uncomfortable', max: 'Very Comfortable' },
        tags: ['reporting', 'safety-concerns', 'comfort'],
      },
      {
        text: 'What wellness initiatives would be most valuable to you?',
        type: 'multiple_choice',
        options: ['Mental health support', 'Fitness programs', 'Stress management', 'Ergonomic improvements', 'Flexible schedules', 'Health screenings'],
        tags: ['wellness-initiatives', 'preferences', 'health'],
      },
    ],
  },
  {
    category: 'Resource Management',
    subcategory: 'Tools & Support',
    questions: [
      {
        text: 'Do you have adequate resources to perform your job effectively?',
        type: 'likert',
        scale_min: 1,
        scale_max: 5,
        scale_labels: { min: 'Never', max: 'Always' },
        tags: ['resources', 'adequacy', 'effectiveness'],
      },
      {
        text: 'How current and relevant are the tools and technology you use?',
        type: 'likert',
        scale_min: 1,
        scale_max: 5,
        scale_labels: { min: 'Very Outdated', max: 'Very Current' },
        tags: ['tools', 'technology', 'relevance'],
      },
      {
        text: 'Rate the technical support available when you need help',
        type: 'likert',
        scale_min: 1,
        scale_max: 5,
        scale_labels: { min: 'Very Poor', max: 'Excellent' },
        tags: ['technical-support', 'help', 'availability'],
      },
      {
        text: 'How efficiently are resources allocated in your department?',
        type: 'likert',
        scale_min: 1,
        scale_max: 5,
        scale_labels: { min: 'Very Inefficiently', max: 'Very Efficiently' },
        tags: ['allocation', 'efficiency', 'department'],
      },
      {
        text: 'What resources would most improve your productivity?',
        type: 'multiple_choice',
        options: ['Better software/tools', 'Additional staff', 'Training', 'Equipment upgrades', 'Process improvements', 'More time'],
        tags: ['productivity', 'improvements', 'needs'],
      },
    ],
  },
  {
    category: 'Decision Making',
    subcategory: 'Autonomy & Involvement',
    questions: [
      {
        text: 'How much input do you have in decisions that affect your work?',
        type: 'likert',
        scale_min: 1,
        scale_max: 5,
        scale_labels: { min: 'No Input', max: 'Significant Input' },
        tags: ['input', 'decisions', 'involvement'],
      },
      {
        text: 'How quickly are important decisions made in your organization?',
        type: 'likert',
        scale_min: 1,
        scale_max: 5,
        scale_labels: { min: 'Very Slowly', max: 'Very Quickly' },
        tags: ['speed', 'decisions', 'efficiency'],
      },
      {
        text: 'Rate the quality of decision-making processes in your organization',
        type: 'likert',
        scale_min: 1,
        scale_max: 5,
        scale_labels: { min: 'Very Poor', max: 'Excellent' },
        tags: ['quality', 'decision-making', 'processes'],
      },
      {
        text: 'How well are decisions communicated throughout the organization?',
        type: 'likert',
        scale_min: 1,
        scale_max: 5,
        scale_labels: { min: 'Very Poorly', max: 'Very Well' },
        tags: ['communication', 'decisions', 'transparency'],
      },
      {
        text: 'Do you feel empowered to make decisions within your role?',
        type: 'likert',
        scale_min: 1,
        scale_max: 5,
        scale_labels: { min: 'Not Empowered', max: 'Very Empowered' },
        tags: ['empowerment', 'autonomy', 'authority'],
      },
    ],
  },
  // MICROCLIMATE QUESTIONS (for real-time feedback)
  {
    category: 'Team Pulse',
    subcategory: 'Current Mood',
    questions: [
      {
        text: 'How is your team feeling right now?',
        type: 'multiple_choice',
        options: ['Energized', 'Focused', 'Stressed', 'Confused', 'Motivated', 'Overwhelmed'],
        tags: ['mood', 'team-pulse', 'current-state'],
      },
      {
        text: 'What\'s the biggest challenge your team is facing today?',
        type: 'open_ended',
        tags: ['challenges', 'current', 'obstacles'],
      },
      {
        text: 'Rate today\'s team collaboration',
        type: 'rating',
        scale_min: 1,
        scale_max: 10,
        tags: ['collaboration', 'daily', 'teamwork'],
      },
      {
        text: 'How clear are today\'s priorities?',
        type: 'likert',
        scale_min: 1,
        scale_max: 5,
        scale_labels: { min: 'Very Unclear', max: 'Very Clear' },
        tags: ['priorities', 'clarity', 'focus'],
      },
      {
        text: 'What would improve your team\'s effectiveness right now?',
        type: 'open_ended',
        tags: ['improvements', 'effectiveness', 'immediate'],
      },
    ],
  },
  {
    category: 'Meeting Feedback',
    subcategory: 'Session Quality',
    questions: [
      {
        text: 'How productive was this meeting?',
        type: 'rating',
        scale_min: 1,
        scale_max: 10,
        tags: ['meeting', 'productivity', 'effectiveness'],
      },
      {
        text: 'Were the meeting objectives clear?',
        type: 'yes_no',
        tags: ['objectives', 'clarity', 'meeting'],
      },
      {
        text: 'Did everyone have a chance to contribute?',
        type: 'likert',
        scale_min: 1,
        scale_max: 5,
        scale_labels: { min: 'Not at All', max: 'Completely' },
        tags: ['participation', 'inclusion', 'contribution'],
      },
      {
        text: 'What could make our meetings more effective?',
        type: 'open_ended',
        tags: ['improvements', 'meetings', 'effectiveness'],
      },
      {
        text: 'Rate the quality of discussion in this meeting',
        type: 'rating',
        scale_min: 1,
        scale_max: 10,
        tags: ['discussion', 'quality', 'engagement'],
      },
    ],
  },
  {
    category: 'Project Status',
    subcategory: 'Progress Check',
    questions: [
      {
        text: 'How confident are you about meeting the project deadline?',
        type: 'likert',
        scale_min: 1,
        scale_max: 5,
        scale_labels: { min: 'Not Confident', max: 'Very Confident' },
        tags: ['confidence', 'deadline', 'project'],
      },
      {
        text: 'What\'s blocking your progress right now?',
        type: 'multiple_choice',
        options: ['Unclear requirements', 'Resource constraints', 'Technical issues', 'Dependencies', 'Communication gaps', 'No blockers'],
        tags: ['blockers', 'progress', 'obstacles'],
      },
      {
        text: 'Rate the current team morale on this project',
        type: 'rating',
        scale_min: 1,
        scale_max: 10,
        tags: ['morale', 'project', 'team'],
      },
      {
        text: 'How well is the team collaborating on this project?',
        type: 'likert',
        scale_min: 1,
        scale_max: 5,
        scale_labels: { min: 'Very Poorly', max: 'Very Well' },
        tags: ['collaboration', 'project', 'teamwork'],
      },
      {
        text: 'What support does the team need most right now?',
        type: 'open_ended',
        tags: ['support', 'needs', 'assistance'],
      },
    ],
  },
];

// Function to seed the database
async function seedQuestionPool() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);

    console.log('Clearing existing questions...');
    await QuestionBank.deleteMany({});

    console.log('Seeding question pool...');
    let totalQuestions = 0;

    for (const categoryData of questionPool) {
      const { category, subcategory, questions } = categoryData;

      for (const questionData of questions) {
        const question = new QuestionBank({
          ...questionData,
          category,
          subcategory,
          metrics: {
            usage_count: Math.floor(Math.random() * 20), // Random initial usage
            response_rate: Math.floor(Math.random() * 100),
            insight_score: Math.random() * 10,
            last_used: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date within last 30 days
          },
          is_active: true,
          is_ai_generated: false,
          version: 1,
        });

        await question.save();
        totalQuestions++;
      }
    }

    console.log(`Successfully seeded ${totalQuestions} questions`);

    // Create some AI-generated question examples
    console.log('Creating AI-generated question examples...');
    const aiQuestions = [
      {
        text: 'How effectively does cross-functional communication support your daily workflow?',
        type: 'likert',
        category: 'Communication',
        subcategory: 'Cross-functional',
        scale_min: 1,
        scale_max: 5,
        scale_labels: { min: 'Very Ineffectively', max: 'Very Effectively' },
        tags: ['ai-generated', 'cross-functional', 'workflow'],
        is_ai_generated: true,
        parent_question_id: null, // Would reference original questions in real implementation
      },
      {
        text: 'Rate the balance between collaborative teamwork and individual accountability in your role',
        type: 'likert',
        category: 'Collaboration',
        subcategory: 'Balance',
        scale_min: 1,
        scale_max: 5,
        scale_labels: { min: 'Poor Balance', max: 'Excellent Balance' },
        tags: ['ai-generated', 'balance', 'accountability'],
        is_ai_generated: true,
      },
      {
        text: 'How well does leadership communication align with your professional development expectations?',
        type: 'likert',
        category: 'Leadership',
        subcategory: 'Development Alignment',
        scale_min: 1,
        scale_max: 5,
        scale_labels: { min: 'Very Poorly', max: 'Very Well' },
        tags: ['ai-generated', 'alignment', 'development'],
        is_ai_generated: true,
      },
    ];

    for (const aiQuestion of aiQuestions) {
      const question = new QuestionBank({
        ...aiQuestion,
        metrics: {
          usage_count: Math.floor(Math.random() * 15),
          response_rate: Math.floor(Math.random() * 100),
          insight_score: Math.random() * 10,
          last_used: new Date(Date.now() - Math.random() * 15 * 24 * 60 * 60 * 1000),
        },
        is_active: true,
        version: 1,
      });

      await question.save();
      totalQuestions++;
    }

    console.log(`Total questions seeded: ${totalQuestions}`);
    console.log('Question pool seeding completed successfully!');

  } catch (error) {
    console.error('Error seeding question pool:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Run the seeding function
if (require.main === module) {
  seedQuestionPool();
}

module.exports = { seedQuestionPool, questionPool };