import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import Company from '@/models/Company';
import Department from '@/models/Department';
import User from '@/models/User';
import * as bcrypt from 'bcryptjs';

// POST /api/admin/seed-data/users - Create comprehensive user seed data
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only super_admin can seed users
    if (session.user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Forbidden - Super admin access required' },
        { status: 403 }
      );
    }

    await connectDB();

    const body = await request.json();
    const { force_reset = false, password = 'TestPass123!' } = body;

    // Check if users already exist
    const existingUsers = await User.countDocuments();
    if (existingUsers > 0 && !force_reset) {
      return NextResponse.json(
        {
          error:
            'Users already exist. Use force_reset: true to clear and reseed.',
          existing_users: existingUsers,
        },
        { status: 400 }
      );
    }

    // Clear existing users if force_reset is true
    if (force_reset) {
      await User.deleteMany({});
    }

    // Get companies and departments
    const companies = await Company.find({}).lean();
    const departments = await Department.find({}).lean();

    if (companies.length === 0 || departments.length === 0) {
      return NextResponse.json(
        {
          error: 'Companies and departments must be seeded first',
          available: {
            companies: companies.length,
            departments: departments.length,
          },
        },
        { status: 400 }
      );
    }

    const techCorp = companies.find((c) => c.domain === 'techcorp.com');
    const innovateLabs = companies.find((c) => c.domain === 'innovatelabs.io');
    const globalSolutions = companies.find(
      (c) => c.domain === 'globalsolutions.com'
    );

    if (!techCorp || !innovateLabs) {
      return NextResponse.json(
        {
          error: 'Required companies not found',
          available_companies: companies.map((c) => c.domain),
        },
        { status: 400 }
      );
    }

    // Hash password once for all users
    const hashedPassword = await bcrypt.hash(password, 12);

    const results = {
      users: 0,
      errors: [] as string[],
      credentials: [] as Array<{
        email: string;
        password: string;
        role: string;
      }>,
    };

    // Helper function to get department by name and company
    const getDepartment = (name: string, companyId: string) => {
      return departments.find(
        (d) => d.name === name && d.company_id === companyId
      );
    };

    // Create diverse user names for inclusivity testing
    const userNames = {
      // English names
      english: [
        'John Smith',
        'Sarah Johnson',
        'Michael Brown',
        'Emily Davis',
        'David Wilson',
        'Jessica Miller',
        'Christopher Moore',
        'Ashley Taylor',
        'Matthew Anderson',
        'Amanda Thomas',
      ],
      // International names
      international: [
        'Raj Patel',
        'Maria Garcia',
        'Chen Wei',
        'Fatima Al-Zahra',
        'Hiroshi Tanaka',
        'Priya Sharma',
        'Ahmed Hassan',
        'Yuki Nakamura',
        'Isabella Rodriguez',
        'Dmitri Volkov',
        'Aisha Okafor',
        'Lars Andersen',
        'Camila Santos',
        'Kwame Asante',
        'Zara Khan',
      ],
    };

    // Create comprehensive user data
    const users = [
      // Super Admins (2 users)
      {
        name: 'System Administrator',
        email: 'admin@system.com',
        password_hash: hashedPassword,
        role: 'super_admin',
        is_active: true,
        preferences: {
          language: 'en',
          timezone: 'UTC',
          theme: 'dark',
          notification_settings: {
            email_surveys: true,
            email_microclimates: true,
            email_action_plans: true,
            email_reminders: true,
            push_notifications: true,
            digest_frequency: 'daily',
          },
        },
      },
      {
        name: 'Global Admin',
        email: 'global.admin@system.com',
        password_hash: hashedPassword,
        role: 'super_admin',
        is_active: true,
        preferences: {
          language: 'en',
          timezone: 'America/New_York',
          theme: 'light',
        },
      },

      // TechCorp Company Admin (1 user)
      {
        name: 'Alex Thompson',
        email: 'alex.thompson@techcorp.com',
        password_hash: hashedPassword,
        role: 'company_admin',
        company_id: techCorp._id.toString(),
        department_id: getDepartment(
          'Human Resources',
          techCorp._id.toString()
        )?._id.toString(),
        demographics: {
          gender: 'non_binary',
          education_level: 'master',
          job_title: 'Chief People Officer',
          hierarchy_level: 'executive',
          work_location: 'hybrid',
          site_location: 'New York, NY',
          tenure_months: 36,
        },
        is_active: true,
      },

      // Innovate Labs Company Admin (1 user)
      {
        name: 'Dr. Sarah Chen',
        email: 'sarah.chen@innovatelabs.io',
        password_hash: hashedPassword,
        role: 'company_admin',
        company_id: innovateLabs._id.toString(),
        department_id: getDepartment(
          'Operations',
          innovateLabs._id.toString()
        )?._id.toString(),
        demographics: {
          gender: 'female',
          education_level: 'doctorate',
          job_title: 'Chief Operating Officer',
          hierarchy_level: 'c_level',
          work_location: 'onsite',
          site_location: 'Toronto, ON',
          tenure_months: 48,
        },
        is_active: true,
      },

      // HR Managers (2 users) - Using department_admin role for HR management capabilities
      {
        name: 'Jennifer Martinez',
        email: 'jennifer.martinez@techcorp.com',
        password_hash: hashedPassword,
        role: 'department_admin',
        company_id: techCorp._id.toString(),
        department_id: getDepartment(
          'Human Resources',
          techCorp._id.toString()
        )?._id.toString(),
        demographics: {
          gender: 'female',
          education_level: 'bachelor',
          job_title: 'HR Manager',
          hierarchy_level: 'senior',
          work_location: 'hybrid',
          site_location: 'Austin, TX',
          tenure_months: 24,
        },
        is_active: true,
      },
      {
        name: 'Robert Kim',
        email: 'robert.kim@innovatelabs.io',
        password_hash: hashedPassword,
        role: 'department_admin',
        company_id: innovateLabs._id.toString(),
        department_id: getDepartment(
          'Operations',
          innovateLabs._id.toString()
        )?._id.toString(),
        demographics: {
          gender: 'male',
          education_level: 'master',
          job_title: 'People Operations Manager',
          hierarchy_level: 'senior',
          work_location: 'remote',
          site_location: 'Vancouver, BC',
          tenure_months: 18,
        },
        is_active: true,
      },

      // Department Managers (4 users) - Using leader role for department management
      {
        name: 'Marcus Johnson',
        email: 'marcus.johnson@techcorp.com',
        password_hash: hashedPassword,
        role: 'leader',
        company_id: techCorp._id.toString(),
        department_id: getDepartment(
          'Engineering',
          techCorp._id.toString()
        )?._id.toString(),
        demographics: {
          gender: 'male',
          education_level: 'master',
          job_title: 'VP of Engineering',
          hierarchy_level: 'executive',
          work_location: 'hybrid',
          site_location: 'San Francisco, CA',
          tenure_months: 42,
        },
        is_active: true,
      },
      {
        name: 'Lisa Wang',
        email: 'lisa.wang@techcorp.com',
        password_hash: hashedPassword,
        role: 'leader',
        company_id: techCorp._id.toString(),
        department_id: getDepartment(
          'Marketing',
          techCorp._id.toString()
        )?._id.toString(),
        demographics: {
          gender: 'female',
          education_level: 'bachelor',
          job_title: 'Marketing Director',
          hierarchy_level: 'senior',
          work_location: 'onsite',
          site_location: 'New York, NY',
          tenure_months: 30,
        },
        is_active: true,
      },
      {
        name: 'Dr. Ahmed Hassan',
        email: 'ahmed.hassan@innovatelabs.io',
        password_hash: hashedPassword,
        role: 'leader',
        company_id: innovateLabs._id.toString(),
        department_id: getDepartment(
          'Research & Development',
          innovateLabs._id.toString()
        )?._id.toString(),
        demographics: {
          gender: 'male',
          education_level: 'doctorate',
          job_title: 'Research Director',
          hierarchy_level: 'executive',
          work_location: 'onsite',
          site_location: 'Toronto, ON',
          tenure_months: 60,
        },
        is_active: true,
      },
      {
        name: 'Rachel Green',
        email: 'rachel.green@techcorp.com',
        password_hash: hashedPassword,
        role: 'leader',
        company_id: techCorp._id.toString(),
        department_id: getDepartment(
          'Sales',
          techCorp._id.toString()
        )?._id.toString(),
        demographics: {
          gender: 'female',
          education_level: 'bachelor',
          job_title: 'Sales Director',
          hierarchy_level: 'senior',
          work_location: 'remote',
          site_location: 'Chicago, IL',
          tenure_months: 36,
        },
        is_active: true,
      },

      // Supervisors (6 users)
      {
        name: "Kevin O'Connor",
        email: 'kevin.oconnor@techcorp.com',
        password_hash: hashedPassword,
        role: 'supervisor',
        company_id: techCorp._id.toString(),
        department_id: getDepartment(
          'Frontend Team',
          techCorp._id.toString()
        )?._id.toString(),
        demographics: {
          gender: 'male',
          education_level: 'bachelor',
          job_title: 'Frontend Team Lead',
          hierarchy_level: 'mid',
          work_location: 'remote',
          site_location: 'Portland, OR',
          tenure_months: 28,
        },
        is_active: true,
      },
      {
        name: 'Priya Patel',
        email: 'priya.patel@techcorp.com',
        password_hash: hashedPassword,
        role: 'supervisor',
        company_id: techCorp._id.toString(),
        department_id: getDepartment(
          'Backend Team',
          techCorp._id.toString()
        )?._id.toString(),
        demographics: {
          gender: 'female',
          education_level: 'master',
          job_title: 'Backend Team Lead',
          hierarchy_level: 'senior',
          work_location: 'hybrid',
          site_location: 'Seattle, WA',
          tenure_months: 32,
        },
        is_active: true,
      },
      {
        name: 'Carlos Rodriguez',
        email: 'carlos.rodriguez@techcorp.com',
        password_hash: hashedPassword,
        role: 'supervisor',
        company_id: techCorp._id.toString(),
        department_id: getDepartment(
          'Digital Marketing',
          techCorp._id.toString()
        )?._id.toString(),
        demographics: {
          gender: 'male',
          education_level: 'bachelor',
          job_title: 'Digital Marketing Manager',
          hierarchy_level: 'mid',
          work_location: 'onsite',
          site_location: 'Miami, FL',
          tenure_months: 20,
        },
        is_active: true,
      },
      {
        name: 'Yuki Tanaka',
        email: 'yuki.tanaka@innovatelabs.io',
        password_hash: hashedPassword,
        role: 'supervisor',
        company_id: innovateLabs._id.toString(),
        department_id: getDepartment(
          'AI Research',
          innovateLabs._id.toString()
        )?._id.toString(),
        demographics: {
          gender: 'non_binary',
          education_level: 'doctorate',
          job_title: 'AI Research Team Lead',
          hierarchy_level: 'senior',
          work_location: 'onsite',
          site_location: 'Toronto, ON',
          tenure_months: 24,
        },
        is_active: true,
      },
      {
        name: 'Emma Thompson',
        email: 'emma.thompson@techcorp.com',
        password_hash: hashedPassword,
        role: 'supervisor',
        company_id: techCorp._id.toString(),
        department_id: getDepartment(
          'Enterprise Sales',
          techCorp._id.toString()
        )?._id.toString(),
        demographics: {
          gender: 'female',
          education_level: 'bachelor',
          job_title: 'Enterprise Account Manager',
          hierarchy_level: 'mid',
          work_location: 'remote',
          site_location: 'Boston, MA',
          tenure_months: 16,
        },
        is_active: true,
      },
      {
        name: 'James Wilson',
        email: 'james.wilson@techcorp.com',
        password_hash: hashedPassword,
        role: 'supervisor',
        company_id: techCorp._id.toString(),
        department_id: getDepartment(
          'DevOps & Infrastructure',
          techCorp._id.toString()
        )?._id.toString(),
        demographics: {
          gender: 'male',
          education_level: 'bachelor',
          job_title: 'DevOps Team Lead',
          hierarchy_level: 'senior',
          work_location: 'hybrid',
          site_location: 'Denver, CO',
          tenure_months: 38,
        },
        is_active: true,
      },
    ];

    // Add employees (15+ users with diverse backgrounds)
    const employeeData = [
      // TechCorp Employees
      {
        name: 'Aisha Okafor',
        dept: 'Frontend Team',
        title: 'Senior Frontend Developer',
        level: 'senior',
        location: 'remote',
        site: 'Atlanta, GA',
        tenure: 22,
        gender: 'female',
        education: 'bachelor',
      },
      {
        name: 'Chen Wei',
        dept: 'Backend Team',
        title: 'Software Engineer',
        level: 'mid',
        location: 'onsite',
        site: 'San Francisco, CA',
        tenure: 14,
        gender: 'male',
        education: 'master',
      },
      {
        name: 'Isabella Santos',
        dept: 'Frontend Team',
        title: 'UI/UX Designer',
        level: 'mid',
        location: 'hybrid',
        site: 'Los Angeles, CA',
        tenure: 18,
        gender: 'female',
        education: 'bachelor',
      },
      {
        name: 'Dmitri Volkov',
        dept: 'DevOps & Infrastructure',
        title: 'Cloud Engineer',
        level: 'senior',
        location: 'remote',
        site: 'Austin, TX',
        tenure: 26,
        gender: 'male',
        education: 'master',
      },
      {
        name: 'Fatima Al-Zahra',
        dept: 'Backend Team',
        title: 'API Developer',
        level: 'mid',
        location: 'hybrid',
        site: 'New York, NY',
        tenure: 12,
        gender: 'female',
        education: 'bachelor',
      },
      {
        name: 'Lars Andersen',
        dept: 'DevOps & Infrastructure',
        title: 'Site Reliability Engineer',
        level: 'senior',
        location: 'onsite',
        site: 'Seattle, WA',
        tenure: 34,
        gender: 'male',
        education: 'master',
      },
      {
        name: 'Zara Khan',
        dept: 'Digital Marketing',
        title: 'Content Marketing Specialist',
        level: 'entry',
        location: 'remote',
        site: 'Phoenix, AZ',
        tenure: 8,
        gender: 'female',
        education: 'bachelor',
      },
      {
        name: 'Kwame Asante',
        dept: 'Enterprise Sales',
        title: 'Sales Development Representative',
        level: 'entry',
        location: 'onsite',
        site: 'Chicago, IL',
        tenure: 6,
        gender: 'male',
        education: 'bachelor',
      },
      {
        name: 'Camila Rodriguez',
        dept: 'Digital Marketing',
        title: 'Social Media Manager',
        level: 'mid',
        location: 'hybrid',
        site: 'Miami, FL',
        tenure: 16,
        gender: 'female',
        education: 'bachelor',
      },
      {
        name: 'Hiroshi Nakamura',
        dept: 'Backend Team',
        title: 'Database Administrator',
        level: 'senior',
        location: 'onsite',
        site: 'San Francisco, CA',
        tenure: 40,
        gender: 'male',
        education: 'master',
      },
      {
        name: 'Sophie Martin',
        dept: 'Customer Support',
        title: 'Technical Support Specialist',
        level: 'mid',
        location: 'remote',
        site: 'Portland, OR',
        tenure: 20,
        gender: 'female',
        education: 'associate',
      },
      {
        name: 'Omar Hassan',
        dept: 'Talent Acquisition',
        title: 'Technical Recruiter',
        level: 'mid',
        location: 'hybrid',
        site: 'Austin, TX',
        tenure: 15,
        gender: 'male',
        education: 'bachelor',
      },
      {
        name: 'Nina Petrov',
        dept: 'Customer Support',
        title: 'Customer Success Manager',
        level: 'senior',
        location: 'onsite',
        site: 'New York, NY',
        tenure: 28,
        gender: 'female',
        education: 'master',
      },
      {
        name: 'Raj Gupta',
        dept: 'Enterprise Sales',
        title: 'Account Executive',
        level: 'mid',
        location: 'remote',
        site: 'Dallas, TX',
        tenure: 24,
        gender: 'male',
        education: 'bachelor',
      },
      {
        name: 'Elena Popov',
        dept: 'Frontend Team',
        title: 'Junior Developer',
        level: 'entry',
        location: 'hybrid',
        site: 'Boston, MA',
        tenure: 4,
        gender: 'female',
        education: 'bachelor',
      },

      // Innovate Labs Employees
      {
        name: 'Dr. Michael Chang',
        dept: 'AI Research',
        title: 'Machine Learning Researcher',
        level: 'senior',
        location: 'onsite',
        site: 'Toronto, ON',
        tenure: 36,
        gender: 'male',
        education: 'doctorate',
      },
      {
        name: 'Dr. Amara Okonkwo',
        dept: 'Biotechnology',
        title: 'Biotech Research Scientist',
        level: 'senior',
        location: 'onsite',
        site: 'Toronto, ON',
        tenure: 42,
        gender: 'female',
        education: 'doctorate',
      },
      {
        name: 'Lucas Silva',
        dept: 'AI Research',
        title: 'Data Scientist',
        level: 'mid',
        location: 'hybrid',
        site: 'Montreal, QC',
        tenure: 18,
        gender: 'male',
        education: 'master',
      },
      {
        name: 'Dr. Ingrid Larsson',
        dept: 'Biotechnology',
        title: 'Senior Research Associate',
        level: 'senior',
        location: 'onsite',
        site: 'Toronto, ON',
        tenure: 30,
        gender: 'female',
        education: 'doctorate',
      },
      {
        name: 'Kai Nakamura',
        dept: 'Administration',
        title: 'Operations Coordinator',
        level: 'entry',
        location: 'onsite',
        site: 'Toronto, ON',
        tenure: 10,
        gender: 'non_binary',
        education: 'bachelor',
      },
    ];

    // Create employee users
    for (const emp of employeeData) {
      const company =
        emp.dept.includes('Research') ||
        emp.dept.includes('AI') ||
        emp.dept.includes('Biotechnology') ||
        emp.dept.includes('Administration')
          ? innovateLabs
          : techCorp;
      const department = getDepartment(emp.dept, company._id.toString());

      if (department) {
        users.push({
          name: emp.name,
          email: `${emp.name
            .toLowerCase()
            .replace(/[^a-z\s]/g, '')
            .replace(/\s+/g, '.')}@${company.domain}`,
          password_hash: hashedPassword,
          role: 'employee',
          company_id: company._id.toString(),
          department_id: department._id.toString(),
          demographics: {
            gender: emp.gender as any,
            education_level: emp.education as any,
            job_title: emp.title,
            hierarchy_level: emp.level as any,
            work_location: emp.location as any,
            site_location: emp.site,
            tenure_months: emp.tenure,
          },
          is_active: true,
        });
      }
    }

    try {
      await User.insertMany(users);
      results.users = users.length;

      // Generate credentials list for testing
      results.credentials = users.map((user) => ({
        email: user.email,
        password: password,
        role: user.role,
      }));
    } catch (error) {
      results.errors.push(`User creation error: ${error}`);
    }

    return NextResponse.json({
      message: 'User seed data created successfully',
      results,
      summary: {
        total_users: results.users,
        role_distribution: {
          super_admin: users.filter((u) => u.role === 'super_admin').length,
          company_admin: users.filter((u) => u.role === 'company_admin').length,
          department_admin: users.filter((u) => u.role === 'department_admin')
            .length,
          leader: users.filter((u) => u.role === 'leader').length,
          supervisor: users.filter((u) => u.role === 'supervisor').length,
          employee: users.filter((u) => u.role === 'employee').length,
        },
        companies: {
          techcorp: users.filter(
            (u) => u.company_id === techCorp._id.toString()
          ).length,
          innovatelabs: users.filter(
            (u) => u.company_id === innovateLabs._id.toString()
          ).length,
        },
      },
      test_credentials: {
        super_admin: 'admin@system.com',
        company_admin_techcorp: 'alex.thompson@techcorp.com',
        company_admin_innovate: 'sarah.chen@innovatelabs.io',
        password: password,
        note: 'All users have the same password for testing purposes',
      },
    });
  } catch (error) {
    console.error('User seed data error:', error);
    return NextResponse.json(
      { error: 'Internal server error during user seeding' },
      { status: 500 }
    );
  }
}
