import { connectDB } from '@/lib/db';
import Company from '@/models/Company';
import Department from '@/models/Department';
import User from '@/models/User';
import mongoose from 'mongoose';

// Migration function to ensure all companies have a default department
// and update users with 'unassigned' department_id
export async function migrateDepartments() {
  try {
    await connectDB();

    console.log('Starting department migration...');

    // Get all companies
    const companies = await Company.find({ is_active: true });

    for (const company of companies) {
      console.log(`Processing company: ${company.name}`);

      // Ensure default department exists
      let defaultDepartment = await Department.findOne({
        company_id: company._id.toString(),
        name: 'General',
      });

      if (!defaultDepartment) {
        console.log(`Creating default department for ${company.name}`);
        defaultDepartment = await Department.create({
          name: 'General',
          description: 'Default department for all employees',
          company_id: company._id.toString(),
          hierarchy: {
            level: 0,
            path: 'general',
          },
          is_active: true,
        });
      }

      // Update users with 'unassigned' department_id
      const usersToUpdate = await User.find({
        company_id: company._id.toString(),
        department_id: 'unassigned',
      });

      if (usersToUpdate.length > 0) {
        console.log(
          `Updating ${usersToUpdate.length} users in ${company.name}`
        );
        await User.updateMany(
          {
            company_id: company._id.toString(),
            department_id: 'unassigned',
          },
          {
            department_id: defaultDepartment._id.toString(),
          }
        );
      }
    }

    console.log('Department migration completed successfully');
  } catch (error) {
    console.error('Error during department migration:', error);
    throw error;
  }
}

// Generate consistent ObjectIds for demo data
const companyId1 = new mongoose.Types.ObjectId('507f1f77bcf86cd799439011');
const companyId2 = new mongoose.Types.ObjectId('507f1f77bcf86cd799439012');

// Department ObjectIds
const deptEngineering = new mongoose.Types.ObjectId('507f1f77bcf86cd799439021');
const deptFrontend = new mongoose.Types.ObjectId('507f1f77bcf86cd799439022');
const deptBackend = new mongoose.Types.ObjectId('507f1f77bcf86cd799439023');
const deptDevops = new mongoose.Types.ObjectId('507f1f77bcf86cd799439024');
const deptProduct = new mongoose.Types.ObjectId('507f1f77bcf86cd799439025');
const deptDesign = new mongoose.Types.ObjectId('507f1f77bcf86cd799439026');
const deptMarketing = new mongoose.Types.ObjectId('507f1f77bcf86cd799439027');
const deptSales = new mongoose.Types.ObjectId('507f1f77bcf86cd799439028');
const deptHR = new mongoose.Types.ObjectId('507f1f77bcf86cd799439029');

// Sample companies data
const sampleCompanies = [
  {
    _id: companyId1,
    name: 'TechCorp Solutions',
    domain: 'techcorp.com',
    industry: 'Technology',
    size: 'medium',
    work_model: 'hybrid',
    subscription_tier: 'professional',
    settings: {
      survey_frequency: 'monthly',
      microclimate_enabled: true,
      ai_insights_enabled: true,
      benchmark_comparison: true,
      custom_branding: true,
      sso_enabled: false,
      data_retention_months: 24,
      notification_preferences: {
        email_enabled: true,
        slack_enabled: true,
        teams_enabled: false,
      },
    },
    is_active: true,
  },
  {
    _id: companyId2,
    name: 'Global Manufacturing Inc',
    domain: 'globalmanufacturing.com',
    industry: 'Manufacturing',
    size: 'large',
    work_model: 'onsite',
    subscription_tier: 'enterprise',
    settings: {
      survey_frequency: 'bi_weekly',
      microclimate_enabled: true,
      ai_insights_enabled: true,
      benchmark_comparison: true,
      custom_branding: true,
      sso_enabled: true,
      data_retention_months: 36,
      notification_preferences: {
        email_enabled: true,
        slack_enabled: false,
        teams_enabled: true,
      },
    },
    is_active: true,
  },
];

// Sample departments data with hierarchy
const sampleDepartments = [
  // TechCorp Solutions Departments
  {
    _id: deptEngineering,
    name: 'Engineering',
    description: 'Software development and technical operations',
    company_id: companyId1.toString(),
    hierarchy: {
      level: 0,
      path: 'engineering',
    },
    manager_id: null, // Will be set after users are created
    employee_count: 25,
    settings: {
      survey_participation_required: true,
      microclimate_frequency: 'bi_weekly',
      auto_action_plans: true,
      notification_preferences: {
        email_enabled: true,
        slack_enabled: true,
        teams_enabled: false,
      },
    },
    is_active: true,
  },
  {
    _id: deptFrontend,
    name: 'Frontend Development',
    description: 'User interface and user experience development',
    company_id: companyId1.toString(),
    hierarchy: {
      parent_department_id: deptEngineering.toString(),
      level: 1,
      path: 'engineering/frontend',
    },
    manager_id: null,
    employee_count: 8,
    settings: {
      survey_participation_required: true,
      microclimate_frequency: 'weekly',
      auto_action_plans: true,
      notification_preferences: {
        email_enabled: true,
        slack_enabled: true,
        teams_enabled: false,
      },
    },
    is_active: true,
  },
  {
    _id: deptBackend,
    name: 'Backend Development',
    description: 'Server-side development and API management',
    company_id: companyId1.toString(),
    hierarchy: {
      parent_department_id: deptEngineering.toString(),
      level: 1,
      path: 'engineering/backend',
    },
    manager_id: null,
    employee_count: 12,
    settings: {
      survey_participation_required: true,
      microclimate_frequency: 'weekly',
      auto_action_plans: true,
      notification_preferences: {
        email_enabled: true,
        slack_enabled: true,
        teams_enabled: false,
      },
    },
    is_active: true,
  },
  {
    _id: deptDevops,
    name: 'DevOps & Infrastructure',
    description: 'Development operations and infrastructure management',
    company_id: companyId1.toString(),
    hierarchy: {
      parent_department_id: deptEngineering.toString(),
      level: 1,
      path: 'engineering/devops',
    },
    manager_id: null,
    employee_count: 5,
    settings: {
      survey_participation_required: true,
      microclimate_frequency: 'bi_weekly',
      auto_action_plans: true,
      notification_preferences: {
        email_enabled: true,
        slack_enabled: true,
        teams_enabled: false,
      },
    },
    is_active: true,
  },
  {
    _id: deptProduct,
    name: 'Product Management',
    description: 'Product strategy and roadmap management',
    company_id: companyId1.toString(),
    hierarchy: {
      level: 0,
      path: 'product',
    },
    manager_id: null,
    employee_count: 8,
    settings: {
      survey_participation_required: true,
      microclimate_frequency: 'monthly',
      auto_action_plans: true,
      notification_preferences: {
        email_enabled: true,
        slack_enabled: true,
        teams_enabled: false,
      },
    },
    is_active: true,
  },
  {
    _id: deptDesign,
    name: 'Design',
    description: 'User experience and visual design',
    company_id: companyId1.toString(),
    hierarchy: {
      level: 0,
      path: 'design',
    },
    manager_id: null,
    employee_count: 6,
    settings: {
      survey_participation_required: true,
      microclimate_frequency: 'monthly',
      auto_action_plans: true,
      notification_preferences: {
        email_enabled: true,
        slack_enabled: true,
        teams_enabled: false,
      },
    },
    is_active: true,
  },
  {
    _id: deptMarketing,
    name: 'Marketing',
    description: 'Marketing and customer acquisition',
    company_id: companyId1.toString(),
    hierarchy: {
      level: 0,
      path: 'marketing',
    },
    manager_id: null,
    employee_count: 10,
    settings: {
      survey_participation_required: true,
      microclimate_frequency: 'monthly',
      auto_action_plans: true,
      notification_preferences: {
        email_enabled: true,
        slack_enabled: true,
        teams_enabled: false,
      },
    },
    is_active: true,
  },
  {
    _id: deptSales,
    name: 'Sales',
    description: 'Sales and business development',
    company_id: companyId1.toString(),
    hierarchy: {
      level: 0,
      path: 'sales',
    },
    manager_id: null,
    employee_count: 12,
    settings: {
      survey_participation_required: true,
      microclimate_frequency: 'monthly',
      auto_action_plans: true,
      notification_preferences: {
        email_enabled: true,
        slack_enabled: true,
        teams_enabled: false,
      },
    },
    is_active: true,
  },
  {
    _id: deptHR,
    name: 'Human Resources',
    description: 'Human resources and people operations',
    company_id: companyId1.toString(),
    hierarchy: {
      level: 0,
      path: 'hr',
    },
    manager_id: null,
    employee_count: 4,
    settings: {
      survey_participation_required: true,
      microclimate_frequency: 'monthly',
      auto_action_plans: true,
      notification_preferences: {
        email_enabled: true,
        slack_enabled: true,
        teams_enabled: false,
      },
    },
    is_active: true,
  },
];

export async function seedCompaniesAndDepartments() {
  try {
    await connectDB();

    // Check if companies already exist
    const existingCompanies = await Company.countDocuments();
    if (existingCompanies > 0) {
      console.log(
        `Companies already exist (${existingCompanies} found). Skipping company seeding.`
      );
    } else {
      // Insert sample companies
      await Company.insertMany(sampleCompanies);
      console.log(`✅ Seeded ${sampleCompanies.length} companies`);
    }

    // Check if departments already exist
    const existingDepartments = await Department.countDocuments();
    if (existingDepartments > 0) {
      console.log(
        `Departments already exist (${existingDepartments} found). Skipping department seeding.`
      );
    } else {
      // Insert sample departments
      await Department.insertMany(sampleDepartments);
      console.log(`✅ Seeded ${sampleDepartments.length} departments`);
    }

    console.log('🎉 Companies and departments seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding companies and departments:', error);
    throw error;
  }
}

// Export sample data for testing
export { sampleCompanies, sampleDepartments };
