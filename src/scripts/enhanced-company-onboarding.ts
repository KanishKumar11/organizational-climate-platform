import { connectDB } from '@/lib/db';
import Company from '@/models/Company';
import Department from '@/models/Department';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

interface CompanyOnboardingData {
  company: {
    name: string;
    description?: string;
    industry?: string;
    size?: string;
    website?: string;
    email?: string;
    phone?: string;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      country?: string;
      postal_code?: string;
    };
  };
  admin: {
    name: string;
    email: string;
    password: string;
  };
  departments: Array<{
    name: string;
    description?: string;
    parent?: string; // Name of parent department
  }>;
  initialUsers?: Array<{
    name: string;
    email: string;
    role: 'employee' | 'supervisor' | 'leader' | 'department_admin';
    department: string; // Name of department
    password?: string;
  }>;
}

export async function onboardCompany(data: CompanyOnboardingData) {
  try {
    await connectDB();

    console.log(`🏢 Starting onboarding for company: ${data.company.name}`);

    // 1. Create the company
    const company = new Company({
      name: data.company.name,
      description: data.company.description,
      industry: data.company.industry,
      size: data.company.size,
      website: data.company.website,
      email: data.company.email,
      phone: data.company.phone,
      address: data.company.address,
      branding: {
        primary_color: '#3B82F6',
        secondary_color: '#6B7280',
        font_family: 'Inter',
      },
      settings: {
        timezone: 'America/New_York',
        date_format: 'MM/DD/YYYY',
        language: 'en',
        currency: 'USD',
        email_notifications: true,
        survey_reminders: true,
        data_retention_days: 365,
      },
    });

    await company.save();
    console.log(`✅ Company created with ID: ${company._id}`);

    // 2. Create departments with hierarchy
    const departmentMap = new Map<string, any>();
    const departmentsToCreate = [...data.departments];
    const createdDepartments = [];

    // First pass: create root departments (no parent)
    for (let i = departmentsToCreate.length - 1; i >= 0; i--) {
      const deptData = departmentsToCreate[i];
      if (!deptData.parent) {
        const department = new Department({
          name: deptData.name,
          description: deptData.description,
          company_id: company._id,
          is_active: true,
          hierarchy: {
            level: 0,
            parent_department_id: null,
          },
        });

        await department.save();
        departmentMap.set(deptData.name, department);
        createdDepartments.push(department);
        departmentsToCreate.splice(i, 1);
        console.log(`✅ Root department created: ${deptData.name}`);
      }
    }

    // Subsequent passes: create child departments
    let maxIterations = 10; // Prevent infinite loops
    while (departmentsToCreate.length > 0 && maxIterations > 0) {
      let createdInThisPass = 0;

      for (let i = departmentsToCreate.length - 1; i >= 0; i--) {
        const deptData = departmentsToCreate[i];
        const parentDept = departmentMap.get(deptData.parent!);

        if (parentDept) {
          const department = new Department({
            name: deptData.name,
            description: deptData.description,
            company_id: company._id,
            is_active: true,
            hierarchy: {
              level: parentDept.hierarchy.level + 1,
              parent_department_id: parentDept._id,
            },
          });

          await department.save();
          departmentMap.set(deptData.name, department);
          createdDepartments.push(department);
          departmentsToCreate.splice(i, 1);
          createdInThisPass++;
          console.log(`✅ Child department created: ${deptData.name} (parent: ${deptData.parent})`);
        }
      }

      if (createdInThisPass === 0) {
        console.warn(`⚠️ Could not create remaining departments: ${departmentsToCreate.map(d => d.name).join(', ')}`);
        break;
      }

      maxIterations--;
    }

    // 3. Create company admin user
    const hashedPassword = await bcrypt.hash(data.admin.password, 12);
    const defaultDepartment = createdDepartments[0]; // Assign to first department

    const adminUser = new User({
      name: data.admin.name,
      email: data.admin.email,
      password_hash: hashedPassword,
      role: 'company_admin',
      department_id: defaultDepartment._id,
      company_id: company._id,
      is_active: true,
      preferences: {
        language: 'en',
        timezone: 'America/New_York',
        email_notifications: true,
        dashboard_layout: 'default',
      },
    });

    await adminUser.save();
    console.log(`✅ Company admin created: ${data.admin.email}`);

    // 4. Create initial users if provided
    if (data.initialUsers && data.initialUsers.length > 0) {
      for (const userData of data.initialUsers) {
        const department = departmentMap.get(userData.department);
        if (!department) {
          console.warn(`⚠️ Department not found for user ${userData.email}: ${userData.department}`);
          continue;
        }

        const userPassword = userData.password || Math.random().toString(36).slice(-8);
        const hashedUserPassword = await bcrypt.hash(userPassword, 12);

        const user = new User({
          name: userData.name,
          email: userData.email,
          password_hash: hashedUserPassword,
          role: userData.role,
          department_id: department._id,
          company_id: company._id,
          is_active: true,
          preferences: {
            language: 'en',
            timezone: 'America/New_York',
            email_notifications: true,
            dashboard_layout: 'default',
          },
        });

        await user.save();
        console.log(`✅ User created: ${userData.email} (${userData.role}) - Password: ${userPassword}`);
      }
    }

    console.log(`🎉 Company onboarding completed successfully!`);
    console.log(`📊 Summary:`);
    console.log(`   - Company: ${company.name}`);
    console.log(`   - Departments: ${createdDepartments.length}`);
    console.log(`   - Users: ${1 + (data.initialUsers?.length || 0)}`);

    return {
      success: true,
      company,
      departments: createdDepartments,
      adminUser,
    };
  } catch (error) {
    console.error('❌ Error during company onboarding:', error);
    throw error;
  }
}

// Example usage function
export async function createSampleCompany() {
  const sampleData: CompanyOnboardingData = {
    company: {
      name: 'Acme Corporation',
      description: 'A leading technology company focused on innovative solutions',
      industry: 'Technology',
      size: '201-500',
      website: 'https://acme-corp.com',
      email: 'contact@acme-corp.com',
      phone: '+1 (555) 123-4567',
      address: {
        street: '123 Innovation Drive',
        city: 'San Francisco',
        state: 'CA',
        country: 'United States',
        postal_code: '94105',
      },
    },
    admin: {
      name: 'John Admin',
      email: 'admin@acme-corp.com',
      password: 'SecurePassword123!',
    },
    departments: [
      { name: 'Engineering', description: 'Software development and technical operations' },
      { name: 'Frontend', description: 'User interface and experience development', parent: 'Engineering' },
      { name: 'Backend', description: 'Server-side development and APIs', parent: 'Engineering' },
      { name: 'DevOps', description: 'Infrastructure and deployment', parent: 'Engineering' },
      { name: 'Marketing', description: 'Brand promotion and customer acquisition' },
      { name: 'Digital Marketing', description: 'Online marketing and social media', parent: 'Marketing' },
      { name: 'Content', description: 'Content creation and strategy', parent: 'Marketing' },
      { name: 'Sales', description: 'Revenue generation and client relationships' },
      { name: 'Human Resources', description: 'Employee management and culture' },
      { name: 'Finance', description: 'Financial planning and accounting' },
    ],
    initialUsers: [
      { name: 'Alice Johnson', email: 'alice@acme-corp.com', role: 'leader', department: 'Engineering' },
      { name: 'Bob Smith', email: 'bob@acme-corp.com', role: 'supervisor', department: 'Frontend' },
      { name: 'Carol Davis', email: 'carol@acme-corp.com', role: 'employee', department: 'Frontend' },
      { name: 'David Wilson', email: 'david@acme-corp.com', role: 'supervisor', department: 'Backend' },
      { name: 'Eve Brown', email: 'eve@acme-corp.com', role: 'employee', department: 'Backend' },
      { name: 'Frank Miller', email: 'frank@acme-corp.com', role: 'leader', department: 'Marketing' },
      { name: 'Grace Lee', email: 'grace@acme-corp.com', role: 'employee', department: 'Digital Marketing' },
      { name: 'Henry Taylor', email: 'henry@acme-corp.com', role: 'leader', department: 'Sales' },
    ],
  };

  return await onboardCompany(sampleData);
}

// CLI execution
if (require.main === module) {
  createSampleCompany()
    .then(() => {
      console.log('✅ Sample company created successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Failed to create sample company:', error);
      process.exit(1);
    });
}
