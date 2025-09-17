import { connectDB } from '@/lib/db';
import User from '@/models/User';
import Company from '@/models/Company';
import Department from '@/models/Department';
import bcrypt from 'bcryptjs';

interface RolePermissionData {
  companyId: string;
  users: Array<{
    name: string;
    email: string;
    role:
      | 'employee'
      | 'supervisor'
      | 'leader'
      | 'department_admin'
      | 'company_admin';
    department: string; // Department name
    password?: string;
    // Note: Permissions are role-based, not user-specific
  }>;
}

interface SuperAdminData {
  name: string;
  email: string;
  password: string;
}

// Role hierarchy and default permissions
// Note: Role hierarchy levels for reference (higher number = more permissions)
// const ROLE_HIERARCHY = {
//   employee: 0,
//   supervisor: 1,
//   leader: 2,
//   department_admin: 3,
//   company_admin: 4,
//   super_admin: 5,
// };

const DEFAULT_PERMISSIONS = {
  employee: {
    can_create_surveys: false,
    can_view_all_responses: false,
    can_manage_users: false,
    can_export_data: false,
  },
  supervisor: {
    can_create_surveys: true,
    can_view_all_responses: false,
    can_manage_users: false,
    can_export_data: false,
  },
  leader: {
    can_create_surveys: true,
    can_view_all_responses: true,
    can_manage_users: false,
    can_export_data: true,
  },
  department_admin: {
    can_create_surveys: true,
    can_view_all_responses: true,
    can_manage_users: true,
    can_export_data: true,
  },
  company_admin: {
    can_create_surveys: true,
    can_view_all_responses: true,
    can_manage_users: true,
    can_export_data: true,
  },
};

export async function seedUsersWithRolesAndPermissions(
  data: RolePermissionData
) {
  try {
    await connectDB();

    console.log(
      `👥 Starting user role and permission seeding for company: ${data.companyId}`
    );

    // Verify company exists
    const company = await Company.findById(data.companyId);
    if (!company) {
      throw new Error(`Company not found: ${data.companyId}`);
    }

    // Get all departments for the company
    const departments = await Department.find({
      company_id: data.companyId,
      is_active: true,
    });
    const deptMap = new Map(departments.map((d) => [d.name.toLowerCase(), d]));

    console.log(`📋 Found ${departments.length} departments`);

    const createdUsers = [];
    const errors = [];

    for (const userData of data.users) {
      try {
        // Find department
        const department = deptMap.get(userData.department.toLowerCase());
        if (!department) {
          errors.push(
            `Department not found for user ${userData.email}: ${userData.department}`
          );
          continue;
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email: userData.email });
        if (existingUser) {
          console.log(
            `⚠️ User already exists: ${userData.email} - Updating role and permissions`
          );

          // Update existing user
          const updatedUser = await User.findByIdAndUpdate(
            existingUser._id,
            {
              role: userData.role,
              department_id: department._id,
              updated_at: new Date(),
            },
            { new: true }
          );

          createdUsers.push(updatedUser);
          console.log(`🔄 Updated user: ${userData.email} (${userData.role})`);
          continue;
        }

        // Generate password if not provided
        const password =
          userData.password || Math.random().toString(36).slice(-8);
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create new user
        const newUser = new User({
          name: userData.name,
          email: userData.email,
          password_hash: hashedPassword,
          role: userData.role,
          department_id: department._id,
          company_id: data.companyId,
          is_active: true,
          preferences: {
            language: 'en',
            timezone: 'America/New_York',
            email_notifications: true,
            dashboard_layout: 'default',
          },
        });

        await newUser.save();
        createdUsers.push(newUser);

        console.log(
          `✅ Created user: ${userData.email} (${userData.role}) - Password: ${password}`
        );
      } catch (error) {
        console.error(`❌ Error creating user ${userData.email}:`, error);
        errors.push(`Failed to create user ${userData.email}: ${error}`);
      }
    }

    console.log(`✅ User seeding completed`);
    console.log(`📊 Summary:`);
    console.log(`   - Created/Updated: ${createdUsers.length} users`);
    console.log(`   - Errors: ${errors.length}`);

    if (errors.length > 0) {
      console.log(`❌ Errors encountered:`);
      errors.forEach((error) => console.log(`   - ${error}`));
    }

    return {
      success: true,
      createdUsers,
      errors,
    };
  } catch (error) {
    console.error('❌ Error during user seeding:', error);
    throw error;
  }
}

export async function createSuperAdmin(data: SuperAdminData) {
  try {
    await connectDB();

    console.log(`🔐 Creating super admin user: ${data.email}`);

    // Check if super admin already exists
    const existingAdmin = await User.findOne({
      email: data.email,
      role: 'super_admin',
    });

    if (existingAdmin) {
      console.log(`⚠️ Super admin already exists: ${data.email}`);
      return { success: true, user: existingAdmin, created: false };
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);

    const superAdmin = new User({
      name: data.name,
      email: data.email,
      password_hash: hashedPassword,
      role: 'super_admin',
      department_id: null, // Super admin doesn't belong to a specific department
      company_id: null, // Super admin doesn't belong to a specific company
      is_active: true,
      // Note: Super admin permissions are role-based, not user-specific
      preferences: {
        language: 'en',
        timezone: 'America/New_York',
        email_notifications: true,
        dashboard_layout: 'admin',
      },
    });

    await superAdmin.save();
    console.log(`✅ Super admin created: ${data.email}`);

    return {
      success: true,
      user: superAdmin,
      created: true,
    };
  } catch (error) {
    console.error('❌ Error creating super admin:', error);
    throw error;
  }
}

export async function auditUserPermissions(companyId?: string) {
  try {
    await connectDB();

    console.log(
      `🔍 Auditing user permissions${companyId ? ` for company: ${companyId}` : ' (all companies)'}`
    );

    const query = companyId ? { company_id: companyId } : {};
    const users = await User.find(query).populate('department_id', 'name');

    const auditResults = {
      totalUsers: users.length,
      roleDistribution: {} as Record<string, number>,
      permissionIssues: [] as string[],
      recommendations: [] as string[],
    };

    // Count role distribution
    users.forEach((user) => {
      auditResults.roleDistribution[user.role] =
        (auditResults.roleDistribution[user.role] || 0) + 1;
    });

    // Check for permission issues
    users.forEach((user) => {
      const expectedPermissions =
        DEFAULT_PERMISSIONS[user.role as keyof typeof DEFAULT_PERMISSIONS];

      if (!expectedPermissions) {
        auditResults.permissionIssues.push(
          `User ${user.email} has invalid role: ${user.role}`
        );
        return;
      }

      // Note: Permissions are role-based in this system, not user-specific
      // The DEFAULT_PERMISSIONS object is for reference only
      // Users inherit permissions based on their role

      // Check for orphaned users (no department)
      if (!user.department_id && user.role !== 'super_admin') {
        auditResults.permissionIssues.push(
          `User ${user.email} has no department assigned`
        );
      }
    });

    // Generate recommendations
    const adminCount = auditResults.roleDistribution.company_admin || 0;
    if (adminCount === 0) {
      auditResults.recommendations.push(
        'No company admins found. Consider promoting at least one user to company_admin role.'
      );
    } else if (adminCount === 1) {
      auditResults.recommendations.push(
        'Only one company admin found. Consider having multiple admins for redundancy.'
      );
    }

    const employeeCount = auditResults.roleDistribution.employee || 0;
    const supervisorCount = auditResults.roleDistribution.supervisor || 0;
    if (employeeCount > 0 && supervisorCount === 0) {
      auditResults.recommendations.push(
        'Employees found without supervisors. Consider promoting some users to supervisor role.'
      );
    }

    console.log(`📊 Audit Results:`);
    console.log(`   - Total Users: ${auditResults.totalUsers}`);
    console.log(`   - Role Distribution:`, auditResults.roleDistribution);
    console.log(
      `   - Permission Issues: ${auditResults.permissionIssues.length}`
    );
    console.log(`   - Recommendations: ${auditResults.recommendations.length}`);

    if (auditResults.permissionIssues.length > 0) {
      console.log(`❌ Permission Issues:`);
      auditResults.permissionIssues.forEach((issue) =>
        console.log(`   - ${issue}`)
      );
    }

    if (auditResults.recommendations.length > 0) {
      console.log(`💡 Recommendations:`);
      auditResults.recommendations.forEach((rec) => console.log(`   - ${rec}`));
    }

    return auditResults;
  } catch (error) {
    console.error('❌ Error during permission audit:', error);
    throw error;
  }
}

// Example usage function
export async function seedSampleUsers(companyId: string) {
  const sampleData: RolePermissionData = {
    companyId,
    users: [
      {
        name: 'John Manager',
        email: 'john.manager@company.com',
        role: 'leader',
        department: 'Engineering',
        password: 'manager123',
      },
      {
        name: 'Sarah Supervisor',
        email: 'sarah.supervisor@company.com',
        role: 'supervisor',
        department: 'Marketing',
        password: 'supervisor123',
      },
      {
        name: 'Mike Employee',
        email: 'mike.employee@company.com',
        role: 'employee',
        department: 'Sales',
        password: 'employee123',
      },
      {
        name: 'Lisa Admin',
        email: 'lisa.admin@company.com',
        role: 'department_admin',
        department: 'Human Resources',
        password: 'admin123',
        // Note: Permissions are role-based, not user-specific
      },
    ],
  };

  return await seedUsersWithRolesAndPermissions(sampleData);
}

// CLI execution
if (require.main === module) {
  const command = process.argv[2];

  if (command === 'create-super-admin') {
    createSuperAdmin({
      name: 'Super Administrator',
      email: 'super@admin.com',
      password: 'SuperSecure123!',
    })
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  } else if (command === 'audit') {
    const companyId = process.argv[3];
    auditUserPermissions(companyId)
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  } else {
    console.log('Available commands:');
    console.log('  create-super-admin - Create a super admin user');
    console.log('  audit [companyId] - Audit user permissions');
    process.exit(1);
  }
}
