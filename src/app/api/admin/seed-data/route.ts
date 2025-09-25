import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import Company from '@/models/Company';
import Department from '@/models/Department';
import User from '@/models/User';
import * as bcrypt from 'bcryptjs';
import { ObjectId } from 'mongodb';

// POST /api/admin/seed-data - Comprehensive seed data for testing
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only super_admin can seed data
    if (session.user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Forbidden - Super admin access required' },
        { status: 403 }
      );
    }

    await connectDB();

    const body = await request.json();
    const { force_reset = false, include_inactive = true } = body;

    // Check if data already exists
    const existingCompanies = await Company.countDocuments();
    const existingUsers = await User.countDocuments();
    const existingDepartments = await Department.countDocuments();

    if (
      (existingCompanies > 0 || existingUsers > 0 || existingDepartments > 0) &&
      !force_reset
    ) {
      return NextResponse.json(
        {
          error:
            'Data already exists. Use force_reset: true to clear and reseed.',
          existing_data: {
            companies: existingCompanies,
            users: existingUsers,
            departments: existingDepartments,
          },
        },
        { status: 400 }
      );
    }

    // Clear existing data if force_reset is true
    if (force_reset) {
      await User.deleteMany({});
      await Department.deleteMany({});
      await Company.deleteMany({});
    }

    const results = {
      companies: 0,
      departments: 0,
      users: 0,
      errors: [] as string[],
    };

    // Generate company IDs
    const techCorpId = new ObjectId().toString();
    const innovateLabsId = new ObjectId().toString();
    const globalSolutionsId = new ObjectId().toString();

    // Create companies
    const companies = [
      {
        _id: techCorpId,
        name: 'TechCorp Solutions',
        domain: 'techcorp.com',
        industry: 'Technology',
        size: 'medium',
        country: 'United States',
        subscription_tier: 'professional',
        settings: {
          survey_frequency: 'monthly',
          microclimate_enabled: true,
          ai_insights_enabled: true,
          anonymous_surveys: false,
          data_retention_days: 2555,
          timezone: 'America/New_York',
          language: 'en',
        },
        branding: {
          primary_color: '#3B82F6',
          secondary_color: '#1F2937',
          font_family: 'Inter',
        },
        is_active: true,
      },
      {
        _id: innovateLabsId,
        name: 'Innovate Labs',
        domain: 'innovatelabs.io',
        industry: 'Research & Development',
        size: 'small',
        country: 'Canada',
        subscription_tier: 'enterprise',
        settings: {
          survey_frequency: 'quarterly',
          microclimate_enabled: true,
          ai_insights_enabled: true,
          anonymous_surveys: true,
          data_retention_days: 1825,
          timezone: 'America/Toronto',
          language: 'en',
        },
        branding: {
          primary_color: '#10B981',
          secondary_color: '#374151',
          font_family: 'Roboto',
        },
        is_active: true,
      },
      {
        _id: globalSolutionsId,
        name: 'Global Solutions Inc',
        domain: 'globalsolutions.com',
        industry: 'Consulting',
        size: 'large',
        country: 'United Kingdom',
        subscription_tier: 'basic',
        settings: {
          survey_frequency: 'semi_annual',
          microclimate_enabled: false,
          ai_insights_enabled: false,
          anonymous_surveys: true,
          data_retention_days: 1095,
          timezone: 'Europe/London',
          language: 'en',
        },
        branding: {
          primary_color: '#8B5CF6',
          secondary_color: '#4B5563',
          font_family: 'Open Sans',
        },
        is_active: include_inactive ? false : true, // Inactive company for testing
      },
    ];

    try {
      await Company.insertMany(companies);
      results.companies = companies.length;
    } catch (error) {
      results.errors.push(`Company creation error: ${error}`);
    }

    // Generate department IDs for TechCorp
    const techCorpDeptIds = {
      engineering: new ObjectId().toString(),
      frontend: new ObjectId().toString(),
      backend: new ObjectId().toString(),
      devops: new ObjectId().toString(),
      marketing: new ObjectId().toString(),
      digital: new ObjectId().toString(),
      content: new ObjectId().toString(),
      hr: new ObjectId().toString(),
      recruiting: new ObjectId().toString(),
      sales: new ObjectId().toString(),
      enterprise: new ObjectId().toString(),
      support: new ObjectId().toString(),
    };

    // Generate department IDs for Innovate Labs
    const innovateLabsDeptIds = {
      research: new ObjectId().toString(),
      ai: new ObjectId().toString(),
      biotech: new ObjectId().toString(),
      operations: new ObjectId().toString(),
      admin: new ObjectId().toString(),
    };

    // Create departments with realistic hierarchy
    const departments = [
      // TechCorp Solutions Departments
      {
        _id: techCorpDeptIds.engineering,
        name: 'Engineering',
        description: 'Software development and technical operations',
        company_id: techCorpId,
        hierarchy: { level: 0, path: 'engineering' },
        employee_count: 45,
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
        _id: techCorpDeptIds.frontend,
        name: 'Frontend Team',
        description: 'User interface and user experience development',
        company_id: techCorpId,
        hierarchy: {
          parent_department_id: techCorpDeptIds.engineering,
          level: 1,
          path: 'engineering/frontend',
        },
        employee_count: 18,
        is_active: true,
      },
      {
        _id: techCorpDeptIds.backend,
        name: 'Backend Team',
        description: 'Server-side development and API services',
        company_id: techCorpId,
        hierarchy: {
          parent_department_id: techCorpDeptIds.engineering,
          level: 1,
          path: 'engineering/backend',
        },
        employee_count: 22,
        is_active: true,
      },
      {
        _id: techCorpDeptIds.devops,
        name: 'DevOps & Infrastructure',
        description: 'Cloud infrastructure and deployment automation',
        company_id: techCorpId,
        hierarchy: {
          parent_department_id: techCorpDeptIds.engineering,
          level: 1,
          path: 'engineering/devops',
        },
        employee_count: 8,
        is_active: true,
      },
      {
        _id: techCorpDeptIds.marketing,
        name: 'Marketing',
        description: 'Brand management and customer acquisition',
        company_id: techCorpId,
        hierarchy: { level: 0, path: 'marketing' },
        employee_count: 25,
        is_active: true,
      },
      {
        _id: techCorpDeptIds.digital,
        name: 'Digital Marketing',
        description: 'Online marketing campaigns and social media',
        company_id: techCorpId,
        hierarchy: {
          parent_department_id: techCorpDeptIds.marketing,
          level: 1,
          path: 'marketing/digital',
        },
        employee_count: 12,
        is_active: true,
      },
      {
        _id: techCorpDeptIds.content,
        name: 'Content Strategy',
        description: 'Content creation and brand storytelling',
        company_id: techCorpId,
        hierarchy: {
          parent_department_id: techCorpDeptIds.marketing,
          level: 1,
          path: 'marketing/content',
        },
        employee_count: 8,
        is_active: include_inactive ? false : true, // Inactive department for testing
      },
      {
        _id: techCorpDeptIds.hr,
        name: 'Human Resources',
        description: 'People operations and organizational development',
        company_id: techCorpId,
        hierarchy: { level: 0, path: 'hr' },
        employee_count: 12,
        is_active: true,
      },
      {
        _id: techCorpDeptIds.recruiting,
        name: 'Talent Acquisition',
        description: 'Recruitment and onboarding processes',
        company_id: techCorpId,
        hierarchy: {
          parent_department_id: techCorpDeptIds.hr,
          level: 1,
          path: 'hr/recruiting',
        },
        employee_count: 6,
        is_active: true,
      },
      {
        _id: techCorpDeptIds.sales,
        name: 'Sales',
        description: 'Revenue generation and client relationships',
        company_id: techCorpId,
        hierarchy: { level: 0, path: 'sales' },
        employee_count: 20,
        is_active: true,
      },
      {
        _id: techCorpDeptIds.enterprise,
        name: 'Enterprise Sales',
        description: 'Large client acquisition and account management',
        company_id: techCorpId,
        hierarchy: {
          parent_department_id: techCorpDeptIds.sales,
          level: 1,
          path: 'sales/enterprise',
        },
        employee_count: 10,
        is_active: true,
      },
      {
        _id: techCorpDeptIds.support,
        name: 'Customer Support',
        description: 'Technical support and customer success',
        company_id: techCorpId,
        hierarchy: { level: 0, path: 'support' },
        employee_count: 15,
        is_active: true,
      },

      // Innovate Labs Departments
      {
        _id: innovateLabsDeptIds.research,
        name: 'Research & Development',
        description: 'Scientific research and product innovation',
        company_id: innovateLabsId,
        hierarchy: { level: 0, path: 'research' },
        employee_count: 30,
        is_active: true,
      },
      {
        _id: innovateLabsDeptIds.ai,
        name: 'AI Research',
        description: 'Artificial intelligence and machine learning research',
        company_id: innovateLabsId,
        hierarchy: {
          parent_department_id: innovateLabsDeptIds.research,
          level: 1,
          path: 'research/ai',
        },
        employee_count: 15,
        is_active: true,
      },
      {
        _id: innovateLabsDeptIds.biotech,
        name: 'Biotechnology',
        description: 'Biological and medical technology research',
        company_id: innovateLabsId,
        hierarchy: {
          parent_department_id: innovateLabsDeptIds.research,
          level: 1,
          path: 'research/biotech',
        },
        employee_count: 12,
        is_active: true,
      },
      {
        _id: innovateLabsDeptIds.operations,
        name: 'Operations',
        description: 'Business operations and administration',
        company_id: innovateLabsId,
        hierarchy: { level: 0, path: 'operations' },
        employee_count: 8,
        is_active: true,
      },
      {
        _id: innovateLabsDeptIds.admin,
        name: 'Administration',
        description: 'Administrative support and facilities management',
        company_id: innovateLabsId,
        hierarchy: {
          parent_department_id: innovateLabsDeptIds.operations,
          level: 1,
          path: 'operations/admin',
        },
        employee_count: 4,
        is_active: true,
      },
    ];

    try {
      await Department.insertMany(departments);
      results.departments = departments.length;
    } catch (error) {
      results.errors.push(`Department creation error: ${error}`);
    }

    return NextResponse.json({
      message: 'Seed data creation initiated',
      results,
      next_step: 'Call POST /api/admin/seed-data/users to create users',
    });
  } catch (error) {
    console.error('Seed data error:', error);
    return NextResponse.json(
      { error: 'Internal server error during seeding' },
      { status: 500 }
    );
  }
}

// GET /api/admin/seed-data - Check seed data status
export async function GET() {
  try {
    await connectDB();

    const companies = await Company.countDocuments();
    const departments = await Department.countDocuments();
    const users = await User.countDocuments();

    const companyList = await Company.find({}, 'name domain is_active').lean();
    const departmentList = await Department.find(
      {},
      'name company_id is_active hierarchy.level'
    ).lean();
    const userRoleDistribution = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    return NextResponse.json({
      status: 'ready',
      counts: {
        companies,
        departments,
        users,
      },
      data_overview: {
        companies: companyList,
        departments: departmentList,
        user_roles: userRoleDistribution,
      },
      endpoints: {
        seed_companies_departments: 'POST /api/admin/seed-data',
        seed_users: 'POST /api/admin/seed-data/users',
        clear_all: 'DELETE /api/admin/seed-data',
      },
    });
  } catch (error) {
    console.error('Seed data status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/seed-data - Clear all seed data
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();

    const deletedUsers = await User.deleteMany({});
    const deletedDepartments = await Department.deleteMany({});
    const deletedCompanies = await Company.deleteMany({});

    return NextResponse.json({
      message: 'All seed data cleared successfully',
      deleted: {
        users: deletedUsers.deletedCount,
        departments: deletedDepartments.deletedCount,
        companies: deletedCompanies.deletedCount,
      },
    });
  } catch (error) {
    console.error('Clear seed data error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
