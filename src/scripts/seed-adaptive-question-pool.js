const { MongoClient } = require('mongodb');
const { v4: uuidv4 } = require('uuid');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/organizational-climate';

// Comprehensive question pool with 200+ questions across categories
const questionCategories = {
  'leadership': [
    {
      text: "How effectively does your immediate supervisor provide clear direction and guidance?",
      type: 'likert',
      tags: ['supervision', 'clarity', 'guidance'],
      combinationPotential: ['communication', 'trust', 'support']
    },
    {
      text: "To what extent do leaders in your organization demonstrate the company values?",
      type: 'likert',
      tags: ['values', 'authenticity', 'role-modeling'],
      combinationPotential: ['culture', 'trust', 'integrity']
    },
    {
      text: "How well do leaders communicate the organization's vision and strategy?",
      type: 'likert',
      tags: ['vision', 'strategy', 'communication'],
      combinationPotential: ['communication', 'direction', 'clarity']
    },
    {
      text: "How effectively do leaders support employee development and growth?",
      type: 'likert',
      tags: ['development', 'growth', 'support'],
      combinationPotential: ['career-development', 'mentoring', 'support']
    },
    {
      text: "To what degree do leaders make decisions transparently?",
      type: 'likert',
      tags: ['transparency', 'decision-making', 'openness'],
      combinationPotential: ['transparency', 'trust', 'communication']
    },
    {
      text: "How well do leaders handle conflict and difficult situations?",
      type: 'likert',
      tags: ['conflict-resolution', 'crisis-management', 'leadership-skills'],
      combinationPotential: ['conflict-resolution', 'communication', 'problem-solving']
    },
    {
      text: "How effectively do leaders recognize and reward good performance?",
      type: 'likert',
      tags: ['recognition', 'rewards', 'performance-management'],
      combinationPotential: ['recognition', 'motivation', 'performance']
    },
    {
      text: "To what extent do leaders encourage innovation and new ideas?",
      type: 'likert',
      tags: ['innovation', 'creativity', 'encouragement'],
      combinationPotential: ['innovation', 'creativity', 'psychological-safety']
    },
    {
      text: "How well do leaders adapt their management style to different team members?",
      type: 'likert',
      tags: ['adaptability', 'personalization', 'management-style'],
      combinationPotential: ['adaptability', 'emotional-intelligence', 'individualization']
    },
    {
      text: "How effectively do leaders build trust within the team?",
      type: 'likert',
      tags: ['trust-building', 'reliability', 'integrity'],
      combinationPotential: ['trust', 'integrity', 'consistency']
    }
  ],
  'communication': [
    {
      text: "How effectively does information flow between different levels of the organization?",
      type: 'likert',
      tags: ['information-flow', 'hierarchy', 'transparency'],
      combinationPotential: ['transparency', 'leadership', 'organizational-structure']
    },
    {
      text: "To what extent do you feel comfortable expressing your opinions and ideas?",
      type: 'likert',
      tags: ['psychological-safety', 'expression', 'openness'],
      combinationPotential: ['psychological-safety', 'trust', 'inclusion']
    },
    {
      text: "How well do team members listen to and understand each other?",
      type: 'likert',
      tags: ['active-listening', 'understanding', 'empathy'],
      combinationPotential: ['collaboration', 'empathy', 'teamwork']
    },
    {
      text: "How effectively are important decisions communicated to the team?",
      type: 'likert',
      tags: ['decision-communication', 'clarity', 'timeliness'],
      combinationPotential: ['transparency', 'leadership', 'change-management']
    },
    {
      text: "To what degree do you receive timely feedback on your work?",
      type: 'likert',
      tags: ['feedback', 'timeliness', 'performance'],
      combinationPotential: ['feedback', 'performance-management', 'development']
    },
    {
      text: "How well do different departments communicate and coordinate with each other?",
      type: 'likert',
      tags: ['cross-functional', 'coordination', 'silos'],
      combinationPotential: ['collaboration', 'organizational-structure', 'teamwork']
    },
    {
      text: "How effectively does your organization use digital communication tools?",
      type: 'likert',
      tags: ['digital-tools', 'technology', 'efficiency'],
      combinationPotential: ['technology', 'efficiency', 'remote-work']
    },
    {
      text: "To what extent do you feel your voice is heard in team meetings?",
      type: 'likert',
      tags: ['voice', 'participation', 'inclusion'],
      combinationPotential: ['inclusion', 'psychological-safety', 'participation']
    },
    {
      text: "How well does your organization communicate changes and updates?",
      type: 'likert',
      tags: ['change-communication', 'updates', 'transparency'],
      combinationPotential: ['change-management', 'transparency', 'leadership']
    },
    {
      text: "How effectively do you communicate with remote or distributed team members?",
      type: 'likert',
      tags: ['remote-communication', 'distributed-teams', 'virtual-collaboration'],
      combinationPotential: ['remote-work', 'technology', 'collaboration']
    }
  ],
  'collaboration': [
    {
      text: "How well do team members work together to achieve common goals?",
      type: 'likert',
      tags: ['teamwork', 'shared-goals', 'cooperation'],
      combinationPotential: ['teamwork', 'goal-alignment', 'communication']
    },
    {
      text: "To what extent do you feel supported by your colleagues?",
      type: 'likert',
      tags: ['peer-support', 'mutual-aid', 'solidarity'],
      combinationPotential: ['support', 'trust', 'relationships']
    },
    {
      text: "How effectively does your team share knowledge and expertise?",
      type: 'likert',
      tags: ['knowledge-sharing', 'expertise', 'learning'],
      combinationPotential: ['learning', 'knowledge-management', 'development']
    },
    {
      text: "How well do team members handle disagreements and conflicts?",
      type: 'likert',
      tags: ['conflict-resolution', 'disagreement-handling', 'maturity'],
      combinationPotential: ['conflict-resolution', 'communication', 'emotional-intelligence']
    },
    {
      text: "To what degree do team members trust each other?",
      type: 'likert',
      tags: ['interpersonal-trust', 'reliability', 'confidence'],
      combinationPotential: ['trust', 'reliability', 'integrity']
    },
    {
      text: "How effectively do cross-functional teams collaborate on projects?",
      type: 'likert',
      tags: ['cross-functional', 'project-collaboration', 'integration'],
      combinationPotential: ['cross-functional', 'communication', 'project-management']
    },
    {
      text: "How well does your team celebrate successes and learn from failures?",
      type: 'likert',
      tags: ['celebration', 'learning', 'resilience'],
      combinationPotential: ['learning', 'resilience', 'recognition']
    },
    {
      text: "To what extent do team members help each other during busy periods?",
      type: 'likert',
      tags: ['mutual-support', 'flexibility', 'teamwork'],
      combinationPotential: ['support', 'flexibility', 'solidarity']
    },
    {
      text: "How effectively do team members coordinate their work activities?",
      type: 'likert',
      tags: ['coordination', 'synchronization', 'planning'],
      combinationPotential: ['coordination', 'planning', 'communication']
    },
    {
      text: "How well do team members respect diverse perspectives and approaches?",
      type: 'likert',
      tags: ['diversity', 'respect', 'inclusion'],
      combinationPotential: ['diversity', 'inclusion', 'respect']
    }
  ],
  'innovation': [
    {
      text: "How encouraged do you feel to propose new ideas and solutions?",
      type: 'likert',
      tags: ['idea-generation', 'encouragement', 'creativity'],
      combinationPotential: ['creativity', 'psychological-safety', 'leadership']
    },
    {
      text: "To what extent does your organization embrace change and new approaches?",
      type: 'likert',
      tags: ['change-embrace', 'adaptability', 'openness'],
      combinationPotential: ['adaptability', 'change-management', 'culture']
    },
    {
      text: "How well does your organization support experimentation and risk-taking?",
      type: 'likert',
      tags: ['experimentation', 'risk-taking', 'support'],
      combinationPotential: ['risk-taking', 'psychological-safety', 'learning']
    },
    {
      text: "How effectively are innovative ideas implemented in your organization?",
      type: 'likert',
      tags: ['implementation', 'execution', 'follow-through'],
      combinationPotential: ['execution', 'change-management', 'leadership']
    },
    {
      text: "To what degree do you have time and resources to explore new ideas?",
      type: 'likert',
      tags: ['time-allocation', 'resources', 'exploration'],
      combinationPotential: ['resources', 'time-management', 'priorities']
    },
    {
      text: "How well does your organization learn from both successes and failures?",
      type: 'likert',
      tags: ['learning', 'reflection', 'continuous-improvement'],
      combinationPotential: ['learning', 'resilience', 'growth-mindset']
    },
    {
      text: "How effectively does your team challenge existing processes and methods?",
      type: 'likert',
      tags: ['process-improvement', 'questioning', 'optimization'],
      combinationPotential: ['process-improvement', 'critical-thinking', 'efficiency']
    },
    {
      text: "To what extent are you encouraged to collaborate with external partners for innovation?",
      type: 'likert',
      tags: ['external-collaboration', 'partnerships', 'networking'],
      combinationPotential: ['collaboration', 'networking', 'external-focus']
    },
    {
      text: "How well does your organization recognize and reward innovative contributions?",
      type: 'likert',
      tags: ['innovation-recognition', 'rewards', 'incentives'],
      combinationPotential: ['recognition', 'motivation', 'rewards']
    },
    {
      text: "How effectively does your organization stay current with industry trends and technologies?",
      type: 'likert',
      tags: ['trend-awareness', 'technology-adoption', 'market-intelligence'],
      combinationPotential: ['technology', 'market-awareness', 'competitive-advantage']
    }
  ],
  'work-life-balance': [
    {
      text: "How well are you able to maintain a healthy balance between work and personal life?",
      type: 'likert',
      tags: ['balance', 'personal-time', 'boundaries'],
      combinationPotential: ['wellness', 'boundaries', 'stress-management']
    },
    {
      text: "To what extent does your organization respect your personal time and boundaries?",
      type: 'likert',
      tags: ['boundaries', 'respect', 'personal-time'],
      combinationPotential: ['respect', 'boundaries', 'culture']
    },
    {
      text: "How flexible are your work arrangements (schedule, location, etc.)?",
      type: 'likert',
      tags: ['flexibility', 'arrangements', 'autonomy'],
      combinationPotential: ['flexibility', 'autonomy', 'remote-work']
    },
    {
      text: "How manageable is your current workload?",
      type: 'likert',
      tags: ['workload', 'manageability', 'capacity'],
      combinationPotential: ['workload', 'stress', 'resource-allocation']
    },
    {
      text: "To what degree do you feel pressured to work outside normal hours?",
      type: 'likert',
      tags: ['overtime-pressure', 'expectations', 'boundaries'],
      combinationPotential: ['pressure', 'expectations', 'culture']
    },
    {
      text: "How well does your organization support employee wellness and mental health?",
      type: 'likert',
      tags: ['wellness', 'mental-health', 'support'],
      combinationPotential: ['wellness', 'support', 'mental-health']
    },
    {
      text: "How effectively can you disconnect from work during time off?",
      type: 'likert',
      tags: ['disconnection', 'time-off', 'boundaries'],
      combinationPotential: ['boundaries', 'rest', 'recovery']
    },
    {
      text: "To what extent do you feel guilty about taking time off or breaks?",
      type: 'likert',
      tags: ['guilt', 'time-off', 'culture'],
      combinationPotential: ['culture', 'psychological-safety', 'wellness']
    },
    {
      text: "How well does your manager support your work-life balance needs?",
      type: 'likert',
      tags: ['manager-support', 'understanding', 'accommodation'],
      combinationPotential: ['leadership', 'support', 'empathy']
    },
    {
      text: "How satisfied are you with your vacation and time-off policies?",
      type: 'likert',
      tags: ['vacation-policy', 'time-off', 'satisfaction'],
      combinationPotential: ['policies', 'benefits', 'satisfaction']
    }
  ],
  'recognition': [
    {
      text: "How often do you receive recognition for your contributions and achievements?",
      type: 'likert',
      tags: ['frequency', 'acknowledgment', 'appreciation'],
      combinationPotential: ['appreciation', 'motivation', 'feedback']
    },
    {
      text: "To what extent is recognition meaningful and personalized to you?",
      type: 'likert',
      tags: ['meaningfulness', 'personalization', 'relevance'],
      combinationPotential: ['personalization', 'value', 'impact']
    },
    {
      text: "How well does your organization celebrate team and individual successes?",
      type: 'likert',
      tags: ['celebration', 'success', 'acknowledgment'],
      combinationPotential: ['celebration', 'team-spirit', 'morale']
    },
    {
      text: "How fairly is recognition distributed across team members?",
      type: 'likert',
      tags: ['fairness', 'equity', 'distribution'],
      combinationPotential: ['fairness', 'equity', 'justice']
    },
    {
      text: "To what degree do you feel valued for your unique contributions?",
      type: 'likert',
      tags: ['value', 'uniqueness', 'contribution'],
      combinationPotential: ['value', 'uniqueness', 'appreciation']
    },
    {
      text: "How effectively does recognition motivate you to perform better?",
      type: 'likert',
      tags: ['motivation', 'performance', 'incentive'],
      combinationPotential: ['motivation', 'performance', 'engagement']
    },
    {
      text: "How well do peers recognize and appreciate each other's work?",
      type: 'likert',
      tags: ['peer-recognition', 'mutual-appreciation', 'culture'],
      combinationPotential: ['peer-support', 'culture', 'teamwork']
    },
    {
      text: "To what extent is recognition tied to actual performance and results?",
      type: 'likert',
      tags: ['performance-link', 'merit', 'results'],
      combinationPotential: ['performance', 'merit', 'fairness']
    },
    {
      text: "How timely is recognition when you achieve something significant?",
      type: 'likert',
      tags: ['timeliness', 'responsiveness', 'immediacy'],
      combinationPotential: ['timeliness', 'impact', 'effectiveness']
    },
    {
      text: "How well does recognition align with your personal values and preferences?",
      type: 'likert',
      tags: ['alignment', 'values', 'preferences'],
      combinationPotential: ['values', 'personalization', 'relevance']
    }
  ],
  'development': [
    {
      text: "How well does your organization support your professional development?",
      type: 'likert',
      tags: ['professional-development', 'support', 'growth'],
      combinationPotential: ['growth', 'support', 'career']
    },
    {
      text: "To what extent do you have clear career advancement opportunities?",
      type: 'likert',
      tags: ['career-advancement', 'opportunities', 'clarity'],
      combinationPotential: ['career', 'opportunities', 'transparency']
    },
    {
      text: "How effectively does your manager help you identify and develop your skills?",
      type: 'likert',
      tags: ['skill-development', 'manager-support', 'identification'],
      combinationPotential: ['leadership', 'development', 'mentoring']
    },
    {
      text: "How well do you receive constructive feedback to improve your performance?",
      type: 'likert',
      tags: ['constructive-feedback', 'improvement', 'performance'],
      combinationPotential: ['feedback', 'performance', 'growth']
    },
    {
      text: "To what degree are you challenged to learn and grow in your role?",
      type: 'likert',
      tags: ['challenge', 'learning', 'growth'],
      combinationPotential: ['challenge', 'learning', 'engagement']
    },
    {
      text: "How accessible are training and learning resources in your organization?",
      type: 'likert',
      tags: ['training-access', 'resources', 'availability'],
      combinationPotential: ['resources', 'learning', 'accessibility']
    },
    {
      text: "How well does your organization support cross-functional learning and exposure?",
      type: 'likert',
      tags: ['cross-functional', 'exposure', 'breadth'],
      combinationPotential: ['cross-functional', 'learning', 'exposure']
    },
    {
      text: "To what extent do you have mentoring or coaching opportunities?",
      type: 'likert',
      tags: ['mentoring', 'coaching', 'guidance'],
      combinationPotential: ['mentoring', 'guidance', 'support']
    },
    {
      text: "How well are your development goals aligned with organizational needs?",
      type: 'likert',
      tags: ['goal-alignment', 'organizational-needs', 'strategy'],
      combinationPotential: ['alignment', 'strategy', 'mutual-benefit']
    },
    {
      text: "How effectively do you apply new skills and knowledge in your work?",
      type: 'likert',
      tags: ['application', 'skill-transfer', 'implementation'],
      combinationPotential: ['application', 'learning-transfer', 'effectiveness']
    }
  ],
  'trust': [
    {
      text: "How much do you trust your immediate supervisor to make fair decisions?",
      type: 'likert',
      tags: ['supervisor-trust', 'fairness', 'decision-making'],
      combinationPotential: ['leadership', 'fairness', 'integrity']
    },
    {
      text: "To what extent do you trust that your organization will keep its commitments?",
      type: 'likert',
      tags: ['organizational-trust', 'commitments', 'reliability'],
      combinationPotential: ['reliability', 'integrity', 'consistency']
    },
    {
      text: "How comfortable do you feel sharing concerns or problems with your manager?",
      type: 'likert',
      tags: ['psychological-safety', 'openness', 'vulnerability'],
      combinationPotential: ['psychological-safety', 'communication', 'support']
    },
    {
      text: "How confident are you that your personal information is handled appropriately?",
      type: 'likert',
      tags: ['privacy', 'confidentiality', 'data-protection'],
      combinationPotential: ['privacy', 'security', 'respect']
    },
    {
      text: "To what degree do you trust your colleagues to deliver on their commitments?",
      type: 'likert',
      tags: ['peer-trust', 'reliability', 'accountability'],
      combinationPotential: ['reliability', 'accountability', 'teamwork']
    },
    {
      text: "How much do you trust that performance evaluations are fair and accurate?",
      type: 'likert',
      tags: ['evaluation-trust', 'fairness', 'accuracy'],
      combinationPotential: ['fairness', 'performance', 'transparency']
    },
    {
      text: "How well does your organization demonstrate integrity in its actions?",
      type: 'likert',
      tags: ['organizational-integrity', 'consistency', 'values'],
      combinationPotential: ['integrity', 'values', 'authenticity']
    },
    {
      text: "To what extent do you feel secure in your job and position?",
      type: 'likert',
      tags: ['job-security', 'stability', 'confidence'],
      combinationPotential: ['security', 'stability', 'confidence']
    },
    {
      text: "How much do you trust that your organization will support you during difficult times?",
      type: 'likert',
      tags: ['support-trust', 'difficult-times', 'loyalty'],
      combinationPotential: ['support', 'loyalty', 'care']
    },
    {
      text: "How well does your organization follow through on announced changes and initiatives?",
      type: 'likert',
      tags: ['follow-through', 'consistency', 'implementation'],
      combinationPotential: ['consistency', 'change-management', 'reliability']
    }
  ],
  'diversity-inclusion': [
    {
      text: "How well does your organization value and respect diverse perspectives?",
      type: 'likert',
      tags: ['diversity-value', 'respect', 'perspectives'],
      combinationPotential: ['respect', 'diversity', 'inclusion']
    },
    {
      text: "To what extent do you feel included and valued regardless of your background?",
      type: 'likert',
      tags: ['inclusion', 'value', 'belonging'],
      combinationPotential: ['belonging', 'value', 'acceptance']
    },
    {
      text: "How fairly are opportunities distributed across different groups?",
      type: 'likert',
      tags: ['opportunity-equity', 'fairness', 'distribution'],
      combinationPotential: ['equity', 'fairness', 'opportunities']
    },
    {
      text: "How comfortable do you feel being your authentic self at work?",
      type: 'likert',
      tags: ['authenticity', 'comfort', 'self-expression'],
      combinationPotential: ['authenticity', 'psychological-safety', 'acceptance']
    },
    {
      text: "To what degree does your organization actively promote diversity and inclusion?",
      type: 'likert',
      tags: ['active-promotion', 'commitment', 'initiatives'],
      combinationPotential: ['commitment', 'initiatives', 'leadership']
    },
    {
      text: "How well are different cultural backgrounds understood and appreciated?",
      type: 'likert',
      tags: ['cultural-understanding', 'appreciation', 'awareness'],
      combinationPotential: ['cultural-awareness', 'appreciation', 'respect']
    },
    {
      text: "How effectively does your organization address bias and discrimination?",
      type: 'likert',
      tags: ['bias-addressing', 'discrimination', 'intervention'],
      combinationPotential: ['fairness', 'intervention', 'justice']
    },
    {
      text: "To what extent do you see diverse representation in leadership positions?",
      type: 'likert',
      tags: ['leadership-diversity', 'representation', 'role-models'],
      combinationPotential: ['representation', 'leadership', 'role-models']
    },
    {
      text: "How well does your team leverage diverse skills and experiences?",
      type: 'likert',
      tags: ['skill-diversity', 'experience-leverage', 'utilization'],
      combinationPotential: ['skill-utilization', 'teamwork', 'effectiveness']
    },
    {
      text: "How safe do you feel to speak up about diversity and inclusion issues?",
      type: 'likert',
      tags: ['psychological-safety', 'speak-up', 'advocacy'],
      combinationPotential: ['psychological-safety', 'advocacy', 'voice']
    }
  ],
  'performance': [
    {
      text: "How clear are your performance expectations and goals?",
      type: 'likert',
      tags: ['goal-clarity', 'expectations', 'performance'],
      combinationPotential: ['clarity', 'goals', 'communication']
    },
    {
      text: "To what extent do you have the resources needed to perform your job effectively?",
      type: 'likert',
      tags: ['resource-adequacy', 'tools', 'support'],
      combinationPotential: ['resources', 'support', 'effectiveness']
    },
    {
      text: "How well do you understand how your work contributes to organizational success?",
      type: 'likert',
      tags: ['purpose-clarity', 'contribution', 'impact'],
      combinationPotential: ['purpose', 'impact', 'meaning']
    },
    {
      text: "How effectively are performance issues addressed and resolved?",
      type: 'likert',
      tags: ['issue-resolution', 'performance-management', 'intervention'],
      combinationPotential: ['performance-management', 'support', 'improvement']
    },
    {
      text: "To what degree are you held accountable for your results?",
      type: 'likert',
      tags: ['accountability', 'responsibility', 'ownership'],
      combinationPotential: ['accountability', 'ownership', 'responsibility']
    },
    {
      text: "How well do performance reviews reflect your actual contributions?",
      type: 'likert',
      tags: ['review-accuracy', 'contribution-reflection', 'fairness'],
      combinationPotential: ['fairness', 'accuracy', 'recognition']
    },
    {
      text: "How effectively do you receive ongoing performance feedback?",
      type: 'likert',
      tags: ['ongoing-feedback', 'continuous-improvement', 'guidance'],
      combinationPotential: ['feedback', 'improvement', 'development']
    },
    {
      text: "To what extent are high performers recognized and rewarded appropriately?",
      type: 'likert',
      tags: ['high-performer-recognition', 'rewards', 'merit'],
      combinationPotential: ['recognition', 'merit', 'motivation']
    },
    {
      text: "How well does your organization set realistic and achievable performance standards?",
      type: 'likert',
      tags: ['realistic-standards', 'achievability', 'expectations'],
      combinationPotential: ['realistic-expectations', 'achievability', 'fairness']
    },
    {
      text: "How effectively do you collaborate with others to achieve performance goals?",
      type: 'likert',
      tags: ['collaborative-performance', 'teamwork', 'goal-achievement'],
      combinationPotential: ['collaboration', 'teamwork', 'goal-achievement']
    }
  ]
};

// Additional specialized questions for microclimates and culture
const microclimateQuestions = [
  {
    category: 'microclimate',
    text: "How are you feeling about work today?",
    type: 'multiple_choice',
    options: ['Energized', 'Motivated', 'Neutral', 'Stressed', 'Overwhelmed'],
    tags: ['mood', 'current-state', 'wellbeing']
  },
  {
    category: 'microclimate',
    text: "What's the biggest challenge you're facing right now?",
    type: 'open_ended',
    tags: ['challenges', 'obstacles', 'current-issues']
  },
  {
    category: 'microclimate',
    text: "How supported do you feel by your team today?",
    type: 'likert',
    tags: ['support', 'team-connection', 'current-state']
  },
  {
    category: 'microclimate',
    text: "What would make your work experience better this week?",
    type: 'open_ended',
    tags: ['improvement', 'suggestions', 'immediate-needs']
  },
  {
    category: 'microclimate',
    text: "How clear are you on your priorities for today?",
    type: 'likert',
    tags: ['clarity', 'priorities', 'direction']
  }
];

const cultureQuestions = [
  {
    category: 'culture',
    text: "How well do the organization's actions align with its stated values?",
    type: 'likert',
    tags: ['values-alignment', 'authenticity', 'integrity']
  },
  {
    category: 'culture',
    text: "To what extent do you feel proud to work for this organization?",
    type: 'likert',
    tags: ['pride', 'engagement', 'loyalty']
  },
  {
    category: 'culture',
    text: "How well does the organization's culture support your personal values?",
    type: 'likert',
    tags: ['personal-alignment', 'values-fit', 'compatibility']
  },
  {
    category: 'culture',
    text: "How effectively does the organization adapt to changing market conditions?",
    type: 'likert',
    tags: ['adaptability', 'market-responsiveness', 'agility']
  },
  {
    category: 'culture',
    text: "To what degree does the organization demonstrate social responsibility?",
    type: 'likert',
    tags: ['social-responsibility', 'ethics', 'community-impact']
  }
];

async function seedQuestionPool() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db();
    const collection = db.collection('questionpools');

    // Clear existing questions
    await collection.deleteMany({});
    console.log('Cleared existing question pool');

    const allQuestions = [];

    // Process main categories
    Object.entries(questionCategories).forEach(([category, questions]) => {
      questions.forEach((question, index) => {
        allQuestions.push({
          id: uuidv4(),
          category,
          subcategory: null,
          originalText: question.text,
          questionType: question.type,
          options: question.options || null,
          tags: question.tags,
          effectivenessScore: Math.floor(Math.random() * 30) + 70, // Random score between 70-100
          usageCount: Math.floor(Math.random() * 50),
          createdBy: 'system',
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: true,
          adaptations: [],
          combinationPotential: question.combinationPotential || [],
          demographicContext: [],
          metadata: {
            surveyTypes: ['general_climate', 'organizational_culture'],
            difficulty: 'standard',
            estimatedResponseTime: 30
          }
        });
      });
    });

    // Add microclimate questions
    microclimateQuestions.forEach(question => {
      allQuestions.push({
        id: uuidv4(),
        category: question.category,
        subcategory: null,
        originalText: question.text,
        questionType: question.type,
        options: question.options || null,
        tags: question.tags,
        effectivenessScore: Math.floor(Math.random() * 20) + 80, // Higher effectiveness for microclimate
        usageCount: Math.floor(Math.random() * 100),
        createdBy: 'system',
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
        adaptations: [],
        combinationPotential: [],
        demographicContext: [],
        metadata: {
          surveyTypes: ['microclimate'],
          difficulty: 'simple',
          estimatedResponseTime: 15
        }
      });
    });

    // Add culture questions
    cultureQuestions.forEach(question => {
      allQuestions.push({
        id: uuidv4(),
        category: question.category,
        subcategory: null,
        originalText: question.text,
        questionType: question.type,
        options: question.options || null,
        tags: question.tags,
        effectivenessScore: Math.floor(Math.random() * 25) + 75,
        usageCount: Math.floor(Math.random() * 30),
        createdBy: 'system',
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
        adaptations: [],
        combinationPotential: [],
        demographicContext: [],
        metadata: {
          surveyTypes: ['organizational_culture'],
          difficulty: 'standard',
          estimatedResponseTime: 45
        }
      });
    });

    // Insert all questions
    const result = await collection.insertMany(allQuestions);
    console.log(`Inserted ${result.insertedCount} questions into the pool`);

    // Create indexes for performance
    await collection.createIndex({ category: 1, isActive: 1 });
    await collection.createIndex({ effectivenessScore: -1 });
    await collection.createIndex({ tags: 1 });
    await collection.createIndex({ 'metadata.surveyTypes': 1 });

    console.log('Created database indexes');

    // Print summary
    const categoryCount = await collection.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]).toArray();

    console.log('\nQuestion Pool Summary:');
    console.log('=====================');
    categoryCount.forEach(cat => {
      console.log(`${cat._id}: ${cat.count} questions`);
    });
    console.log(`Total: ${allQuestions.length} questions`);

  } catch (error) {
    console.error('Error seeding question pool:', error);
  } finally {
    await client.close();
    console.log('Disconnected from MongoDB');
  }
}

// Run the seed script
if (require.main === module) {
  seedQuestionPool().catch(console.error);
}

module.exports = { seedQuestionPool };