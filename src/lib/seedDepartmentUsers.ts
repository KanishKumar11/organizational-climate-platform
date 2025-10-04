import { connectDB } from '@/lib/db';
import User from '@/models/User';
import Company from '@/models/Company';
import Department from '@/models/Department';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

// Test users data for each department
const departmentUsers = [
  // Engineering Department
  {
    department: 'Engineering',
    users: [
      {
        name: 'Sarah Chen',
        email: 'sarah.chen@techcorp.com',
        role: 'supervisor' as const,
        title: 'Engineering Manager',
      },
      {
        name: 'Mike Johnson',
        email: 'mike.johnson@techcorp.com',
        role: 'employee' as const,
        title: 'Senior Software Engineer',
      },
      {
        name: 'Alex Rodriguez',
        email: 'alex.rodriguez@techcorp.com',
        role: 'employee' as const,
        title: 'Software Engineer',
      },
      {
        name: 'Emma Wilson',
        email: 'emma.wilson@techcorp.com',
        role: 'employee' as const,
        title: 'Junior Developer',
      },
    ],
  },
  // Frontend Development Department
  {
    department: 'Frontend Team',
    users: [
      {
        name: 'David Kim',
        email: 'david.kim@techcorp.com',
        role: 'supervisor' as const,
        title: 'Frontend Team Lead',
      },
      {
        name: 'Lisa Park',
        email: 'lisa.park@techcorp.com',
        role: 'employee' as const,
        title: 'Senior Frontend Developer',
      },
      {
        name: 'Tom Anderson',
        email: 'tom.anderson@techcorp.com',
        role: 'employee' as const,
        title: 'Frontend Developer',
      },
    ],
  },
  // Backend Development Department
  {
    department: 'Backend Team',
    users: [
      {
        name: 'James Mitchell',
        email: 'james.mitchell@techcorp.com',
        role: 'supervisor' as const,
        title: 'Backend Team Lead',
      },
      {
        name: 'Rachel Green',
        email: 'rachel.green@techcorp.com',
        role: 'employee' as const,
        title: 'Senior Backend Developer',
      },
      {
        name: 'Kevin Brown',
        email: 'kevin.brown@techcorp.com',
        role: 'employee' as const,
        title: 'Backend Developer',
      },
      {
        name: 'Sophie Taylor',
        email: 'sophie.taylor@techcorp.com',
        role: 'employee' as const,
        title: 'API Developer',
      },
    ],
  },
  // DevOps & Infrastructure Department
  {
    department: 'DevOps & Infrastructure',
    users: [
      {
        name: 'Chris Davis',
        email: 'chris.davis@techcorp.com',
        role: 'supervisor' as const,
        title: 'DevOps Manager',
      },
      {
        name: 'Anna Martinez',
        email: 'anna.martinez@techcorp.com',
        role: 'employee' as const,
        title: 'DevOps Engineer',
      },
      {
        name: 'Robert Lee',
        email: 'robert.lee@techcorp.com',
        role: 'employee' as const,
        title: 'Infrastructure Engineer',
      },
    ],
  },
  // Product Management Department (using Content Strategy)
  {
    department: 'Content Strategy',
    users: [
      {
        name: 'Jennifer Adams',
        email: 'jennifer.adams@techcorp.com',
        role: 'supervisor' as const,
        title: 'Product Manager',
      },
      {
        name: 'Mark Thompson',
        email: 'mark.thompson@techcorp.com',
        role: 'employee' as const,
        title: 'Associate Product Manager',
      },
      {
        name: 'Nina Patel',
        email: 'nina.patel@techcorp.com',
        role: 'employee' as const,
        title: 'Product Analyst',
      },
    ],
  },
  // Design Department (using Digital Marketing as proxy)
  {
    department: 'Digital Marketing',
    users: [
      {
        name: 'Olivia Garcia',
        email: 'olivia.garcia@techcorp.com',
        role: 'supervisor' as const,
        title: 'Design Lead',
      },
      {
        name: 'Daniel White',
        email: 'daniel.white@techcorp.com',
        role: 'employee' as const,
        title: 'UX Designer',
      },
      {
        name: 'Maya Singh',
        email: 'maya.singh@techcorp.com',
        role: 'employee' as const,
        title: 'UI Designer',
      },
    ],
  },
  // Talent Acquisition Department
  {
    department: 'Talent Acquisition',
    users: [
      {
        name: 'Victoria Chen',
        email: 'victoria.chen@techcorp.com',
        role: 'supervisor' as const,
        title: 'Talent Acquisition Manager',
      },
      {
        name: 'Ryan Martinez',
        email: 'ryan.martinez@techcorp.com',
        role: 'employee' as const,
        title: 'Senior Recruiter',
      },
    ],
  },
  // Customer Support Department
  {
    department: 'Customer Support',
    users: [
      {
        name: 'Carlos Rodriguez',
        email: 'carlos.rodriguez@techcorp.com',
        role: 'supervisor' as const,
        title: 'Customer Support Lead',
      },
      {
        name: 'Jessica Liu',
        email: 'jessica.liu@techcorp.com',
        role: 'employee' as const,
        title: 'Support Specialist',
      },
      {
        name: 'Tyler Johnson',
        email: 'tyler.johnson@techcorp.com',
        role: 'employee' as const,
        title: 'Technical Support Engineer',
      },
    ],
  },
  // Marketing Department
  {
    department: 'Marketing',
    users: [
      {
        name: 'Brian Foster',
        email: 'brian.foster@techcorp.com',
        role: 'supervisor' as const,
        title: 'Marketing Manager',
      },
      {
        name: 'Laura Evans',
        email: 'laura.evans@techcorp.com',
        role: 'employee' as const,
        title: 'Content Marketing Specialist',
      },
      {
        name: 'Steve Murphy',
        email: 'steve.murphy@techcorp.com',
        role: 'employee' as const,
        title: 'Digital Marketing Specialist',
      },
      {
        name: 'Grace Wong',
        email: 'grace.wong@techcorp.com',
        role: 'employee' as const,
        title: 'Social Media Manager',
      },
    ],
  },
  // Sales Department
  {
    department: 'Sales',
    users: [
      {
        name: 'Michael Harris',
        email: 'michael.harris@techcorp.com',
        role: 'supervisor' as const,
        title: 'Sales Manager',
      },
      {
        name: 'Amanda Clark',
        email: 'amanda.clark@techcorp.com',
        role: 'employee' as const,
        title: 'Senior Sales Representative',
      },
      {
        name: 'Jason Wright',
        email: 'jason.wright@techcorp.com',
        role: 'employee' as const,
        title: 'Sales Representative',
      },
      {
        name: 'Diana Lopez',
        email: 'diana.lopez@techcorp.com',
        role: 'employee' as const,
        title: 'Business Development Manager',
      },
    ],
  },
  // Human Resources Department
  {
    department: 'Human Resources',
    users: [
      {
        name: 'Karen Miller',
        email: 'karen.miller@techcorp.com',
        role: 'supervisor' as const,
        title: 'HR Manager',
      },
      {
        name: 'Paul Turner',
        email: 'paul.turner@techcorp.com',
        role: 'employee' as const,
        title: 'HR Specialist',
      },
    ],
  },
];

// Company admin user
const companyAdminUser = {
  name: 'John Smith',
  email: 'john.smith@techcorp.com',
  role: 'company_admin' as const,
  title: 'CEO',
  department: 'General', // Will be assigned to default department
};

export async function seedDepartmentUsers() {
  try {
    await connectDB();

    console.log('🌱 Starting department user seeding...');

    // Get the demo company (TechCorp Solutions)
    const company = await Company.findOne({ name: 'TechCorp Solutions' });
    if (!company) {
      throw new Error(
        'TechCorp Solutions company not found. Please run company seeding first.'
      );
    }

    console.log(`📍 Seeding users for company: ${company.name}`);

    let totalUsersCreated = 0;
    let totalUsersSkipped = 0;

    // Seed company admin first
    const existingAdmin = await User.findOne({ email: companyAdminUser.email });
    if (!existingAdmin) {
      const adminDepartment = await Department.findOne({
        company_id: company._id.toString(),
        name: companyAdminUser.department,
      });

      if (!adminDepartment) {
        throw new Error(
          `Admin department "${companyAdminUser.department}" not found.`
        );
      }

      const hashedPassword = await bcrypt.hash('admin123', 12);

      const adminUser = new User({
        name: companyAdminUser.name,
        email: companyAdminUser.email,
        password_hash: hashedPassword,
        role: companyAdminUser.role,
        company_id: company._id.toString(),
        department_id: adminDepartment._id.toString(),
        is_active: true,
        preferences: {
          language: 'en',
          timezone: 'America/New_York',
          notification_settings: {
            email_surveys: true,
            email_microclimates: true,
            email_action_plans: true,
            email_reminders: true,
            push_notifications: false,
            digest_frequency: 'daily',
          },
          dashboard_layout: 'default',
          theme: 'light',
        },
        demographics: {
          title: companyAdminUser.title,
          hire_date: new Date('2020-01-15'),
          employment_type: 'full_time',
        },
      });

      await adminUser.save();
      console.log(
        `✅ Created company admin: ${adminUser.name} (${adminUser.email})`
      );
      console.log(`   Password: admin123`);
      console.log(`   Role: ${adminUser.role}`);
      console.log(`   Department: ${adminDepartment.name}`);
      totalUsersCreated++;
    } else {
      console.log(`⏭️  Company admin already exists: ${existingAdmin.email}`);
      totalUsersSkipped++;
    }

    // Seed users for each department
    for (const deptData of departmentUsers) {
      console.log(`\n🏢 Processing department: ${deptData.department}`);

      // Find the department
      const department = await Department.findOne({
        company_id: company._id.toString(),
        name: deptData.department,
      });

      if (!department) {
        console.log(
          `⚠️  Department "${deptData.department}" not found, skipping...`
        );
        continue;
      }

      // Create users for this department
      for (const userData of deptData.users) {
        const existingUser = await User.findOne({ email: userData.email });

        if (existingUser) {
          console.log(
            `⏭️  User already exists: ${userData.name} (${userData.email})`
          );
          totalUsersSkipped++;
          continue;
        }

        // Hash password (use a common password for all test users)
        const hashedPassword = await bcrypt.hash('password123', 12);

        const user = new User({
          name: userData.name,
          email: userData.email,
          password_hash: hashedPassword,
          role: userData.role,
          company_id: company._id.toString(),
          department_id: department._id.toString(),
          is_active: true,
          preferences: {
            language: 'en',
            timezone: 'America/New_York',
            notification_settings: {
              email_surveys: true,
              email_microclimates: true,
              email_action_plans: true,
              email_reminders: true,
              push_notifications: false,
              digest_frequency: 'weekly',
            },
            dashboard_layout: 'default',
            theme: 'light',
          },
          demographics: {
            title: userData.title,
            hire_date: new Date(
              Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000
            ), // Random hire date within last year
            employment_type: 'full_time',
          },
        });

        await user.save();
        console.log(`✅ Created user: ${user.name} (${user.email})`);
        console.log(
          `   Role: ${user.role} | Department: ${department.name} | Title: ${userData.title}`
        );
        totalUsersCreated++;
      }
    }

    console.log(`\n🎉 Department user seeding completed!`);
    console.log(`📊 Summary:`);
    console.log(`   ✅ Users created: ${totalUsersCreated}`);
    console.log(`   ⏭️  Users skipped: ${totalUsersSkipped}`);
    console.log(
      `   📧 Total users in system: ${await User.countDocuments({ company_id: company._id.toString() })}`
    );

    console.log(`\n🔐 Test Credentials:`);
    console.log(`   Company Admin: john.smith@techcorp.com / admin123`);
    console.log(`   All Employees: [name]@techcorp.com / password123`);
    console.log(`   Example: sarah.chen@techcorp.com / password123`);

    return {
      usersCreated: totalUsersCreated,
      usersSkipped: totalUsersSkipped,
    };
  } catch (error) {
    console.error('❌ Error seeding department users:', error);
    throw error;
  }
}

// Export for use in other scripts
export default seedDepartmentUsers;
