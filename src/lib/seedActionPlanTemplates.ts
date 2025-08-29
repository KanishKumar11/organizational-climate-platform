import { ActionPlanTemplate } from '@/models/ActionPlanTemplate';
import { connectDB } from '@/lib/db';

const actionPlanTemplates = [
  {
    name: 'Team Collaboration Improvement',
    description:
      'Template for improving cross-team collaboration and communication',
    category: 'Collaboration',
    company_id: null, // Global template
    created_by: 'system',
    kpi_templates: [
      {
        name: 'Cross-team Project Success Rate',
        target_value: 85,
        unit: '%',
        measurement_frequency: 'monthly',
      },
      {
        name: 'Inter-team Communication Score',
        target_value: 4.2,
        unit: 'points',
        measurement_frequency: 'quarterly',
      },
    ],
    qualitative_objective_templates: [
      {
        description: 'Establish regular cross-team communication channels',
        success_criteria:
          'Weekly cross-team standups implemented and attended by 80% of team members',
      },
      {
        description: 'Create shared knowledge base for project documentation',
        success_criteria:
          'All active projects have up-to-date documentation accessible to all teams',
      },
    ],
    ai_recommendation_templates: [
      'Implement weekly cross-team standup meetings',
      'Create shared project documentation system',
      'Establish collaboration metrics and tracking',
      'Set up cross-functional project teams',
    ],
    tags: ['collaboration', 'communication', 'cross-team', 'productivity'],
    usage_count: 0,
    is_active: true,
  },
  {
    name: 'Employee Engagement Enhancement',
    description: 'Template for boosting employee engagement and satisfaction',
    category: 'Engagement',
    company_id: null,
    created_by: 'system',
    kpi_templates: [
      {
        name: 'Employee Satisfaction Score',
        target_value: 4.5,
        unit: 'points',
        measurement_frequency: 'quarterly',
      },
      {
        name: 'Employee Retention Rate',
        target_value: 92,
        unit: '%',
        measurement_frequency: 'quarterly',
      },
      {
        name: 'Internal Promotion Rate',
        target_value: 25,
        unit: '%',
        measurement_frequency: 'quarterly',
      },
    ],
    qualitative_objective_templates: [
      {
        description: 'Improve manager-employee relationship quality',
        success_criteria:
          'Regular 1-on-1 meetings scheduled and conducted with 95% consistency',
      },
      {
        description: 'Enhance career development opportunities',
        success_criteria:
          'Individual development plans created for all employees with quarterly reviews',
      },
    ],
    ai_recommendation_templates: [
      'Implement regular 1-on-1 meeting structure',
      'Create career development pathways',
      'Establish employee recognition programs',
      'Provide manager training on coaching skills',
    ],
    tags: ['engagement', 'satisfaction', 'retention', 'development'],
    usage_count: 0,
    is_active: true,
  },
  {
    name: 'Remote Work Optimization',
    description:
      'Template for improving remote work effectiveness and team connection',
    category: 'Remote Work',
    company_id: null,
    created_by: 'system',
    kpi_templates: [
      {
        name: 'Remote Employee Engagement Score',
        target_value: 4.3,
        unit: 'points',
        measurement_frequency: 'monthly',
      },
      {
        name: 'Virtual Meeting Effectiveness Rating',
        target_value: 4.0,
        unit: 'points',
        measurement_frequency: 'monthly',
      },
      {
        name: 'Remote Collaboration Tool Adoption',
        target_value: 90,
        unit: '%',
        measurement_frequency: 'monthly',
      },
    ],
    qualitative_objective_templates: [
      {
        description: 'Establish effective remote communication protocols',
        success_criteria:
          'Clear communication guidelines documented and followed by all remote teams',
      },
      {
        description: 'Create virtual team bonding opportunities',
        success_criteria:
          'Monthly virtual team events with 80% participation rate',
      },
    ],
    ai_recommendation_templates: [
      'Implement async communication protocols',
      'Create virtual coffee chat sessions',
      'Establish remote work best practices guide',
      'Set up dedicated collaboration spaces',
    ],
    tags: ['remote-work', 'communication', 'virtual-teams', 'collaboration'],
    usage_count: 0,
    is_active: true,
  },
  {
    name: 'Leadership Development',
    description:
      'Template for developing leadership capabilities and manager effectiveness',
    category: 'Leadership',
    company_id: null,
    created_by: 'system',
    kpi_templates: [
      {
        name: 'Manager Effectiveness Score',
        target_value: 4.4,
        unit: 'points',
        measurement_frequency: 'quarterly',
      },
      {
        name: 'Leadership Training Completion Rate',
        target_value: 95,
        unit: '%',
        measurement_frequency: 'quarterly',
      },
      {
        name: 'Team Performance Under Manager',
        target_value: 4.2,
        unit: 'points',
        measurement_frequency: 'quarterly',
      },
    ],
    qualitative_objective_templates: [
      {
        description: 'Enhance coaching and mentoring skills',
        success_criteria:
          'All managers complete coaching certification and demonstrate improved feedback quality',
      },
      {
        description: 'Develop strategic thinking capabilities',
        success_criteria:
          'Managers successfully lead strategic initiatives with measurable business impact',
      },
    ],
    ai_recommendation_templates: [
      'Provide manager training on coaching skills',
      'Create manager effectiveness feedback loop',
      'Implement leadership mentoring programs',
      'Establish 360-degree feedback processes',
    ],
    tags: ['leadership', 'management', 'coaching', 'development'],
    usage_count: 0,
    is_active: true,
  },
  {
    name: 'Innovation Culture Building',
    description:
      'Template for fostering innovation and creative thinking in teams',
    category: 'Innovation',
    company_id: null,
    created_by: 'system',
    kpi_templates: [
      {
        name: 'Innovation Ideas Submitted',
        target_value: 50,
        unit: 'ideas',
        measurement_frequency: 'quarterly',
      },
      {
        name: 'Innovation Implementation Rate',
        target_value: 15,
        unit: '%',
        measurement_frequency: 'quarterly',
      },
      {
        name: 'Employee Innovation Engagement',
        target_value: 4.1,
        unit: 'points',
        measurement_frequency: 'quarterly',
      },
    ],
    qualitative_objective_templates: [
      {
        description: 'Create safe space for experimentation and failure',
        success_criteria:
          'Innovation time allocated and failure celebration events conducted monthly',
      },
      {
        description: 'Establish innovation recognition and rewards',
        success_criteria:
          'Innovation awards program launched with quarterly recognition ceremonies',
      },
    ],
    ai_recommendation_templates: [
      'Implement innovation time allocation (20% time)',
      'Create idea submission and evaluation process',
      'Establish innovation labs or spaces',
      'Develop failure celebration culture',
    ],
    tags: ['innovation', 'creativity', 'experimentation', 'culture'],
    usage_count: 0,
    is_active: true,
  },
  {
    name: 'Diversity & Inclusion Initiative',
    description:
      'Template for improving diversity, equity, and inclusion in the workplace',
    category: 'Diversity & Inclusion',
    company_id: null,
    created_by: 'system',
    kpi_templates: [
      {
        name: 'Diversity Representation Score',
        target_value: 40,
        unit: '%',
        measurement_frequency: 'quarterly',
      },
      {
        name: 'Inclusion Index Score',
        target_value: 4.3,
        unit: 'points',
        measurement_frequency: 'quarterly',
      },
      {
        name: 'D&I Training Completion Rate',
        target_value: 100,
        unit: '%',
        measurement_frequency: 'quarterly',
      },
    ],
    qualitative_objective_templates: [
      {
        description: 'Create inclusive hiring and promotion practices',
        success_criteria:
          'Bias-free recruitment processes implemented with diverse interview panels',
      },
      {
        description: 'Foster inclusive team culture and belonging',
        success_criteria:
          'Employee resource groups established with active participation and leadership support',
      },
    ],
    ai_recommendation_templates: [
      'Implement bias-free recruitment processes',
      'Create employee resource groups',
      'Provide unconscious bias training',
      'Establish inclusive leadership practices',
    ],
    tags: ['diversity', 'inclusion', 'equity', 'belonging', 'culture'],
    usage_count: 0,
    is_active: true,
  },
];

export async function seedActionPlanTemplates() {
  try {
    await connectDB();

    // Check if templates already exist
    const existingCount = await ActionPlanTemplate.countDocuments();
    if (existingCount > 0) {
      console.log('Action plan templates already exist, skipping seed');
      return;
    }

    // Insert templates
    await ActionPlanTemplate.insertMany(actionPlanTemplates);
    console.log(
      `Successfully seeded ${actionPlanTemplates.length} action plan templates`
    );
  } catch (error) {
    console.error('Error seeding action plan templates:', error);
    throw error;
  }
}

// Export templates for testing
export { actionPlanTemplates };
