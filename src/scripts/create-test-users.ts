#!/usr/bin/env tsx

import { connectDB } from '@/lib/mongodb';
import Company from '@/models/Company';
import Department from '@/models/Department';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

interface TestUser {
  name: string;
  email: string;
  role: 'employee' | 'supervisor' | 'leader';
  department: string; // Department name
  password?: string;
}

const testUsers: TestUser[] = [
  // Engineering Department (already has test@techcorp.com as leader)
  { name: 'Alice Frontend', email: 'alice@techcorp.com', role: 'employee', department: 'Frontend Development' },
  { name: 'Bob Backend', email: 'bob@techcorp.com', role: 'employee', department: 'Backend Development' },
  { name: 'Charlie DevOps', email: 'charlie@techcorp.com', role: 'supervisor', department: 'DevOps & Infrastructure' },
  
  // Design Department
  { name: 'Diana Designer', email: 'diana@techcorp.com', role: 'leader', department: 'Design' },
  { name: 'Eve UX', email: 'eve@techcorp.com', role: 'employee', department: 'Design' },
  
  // Marketing Department
  { name: 'Frank Marketing', email: 'frank@techcorp.com', role: 'leader', department: 'Marketing' },
  { name: 'Grace Content', email: 'grace@techcorp.com', role: 'employee', department: 'Marketing' },
  
  // Sales Department
  { name: 'Henry Sales', email: 'henry@techcorp.com', role: 'leader', department: 'Sales' },
  { name: 'Ivy Inside', email: 'ivy@techcorp.com', role: 'employee', department: 'Sales' },
  
  // HR Department
  { name: 'Jack HR', email: 'jack@techcorp.com', role: 'supervisor', department: 'Human Resources' },
  { name: 'Kate People', email: 'kate@techcorp.com', role: 'employee', department: 'Human Resources' },
  
  // Product Management
  { name: 'Leo Product', email: 'leo@techcorp.com', role: 'leader', department: 'Product Management' },
  { name: 'Mia Strategy', email: 'mia@techcorp.com', role: 'employee', department: 'Product Management' },
];

async function createTestUsers() {
  console.log('👥 Creating Test Users for Microclimate Testing...\n');

  try {
    await connectDB();

    // Find the Gmail.com Organization (TechCorp equivalent)
    const company = await Company.findOne({ domain: 'gmail.com' });
    if (!company) {
      console.error('❌ Gmail.com Organization not found. Please run company seeding first.');
      return;
    }

    console.log(`🏢 Target Company: ${company.name} (${company._id})`);

    // Get all departments
    const departments = await Department.find({ 
      company_id: company._id.toString(),
      is_active: true 
    }).lean();

    console.log(`📋 Found ${departments.length} departments`);

    let createdCount = 0;
    let skippedCount = 0;

    for (const userData of testUsers) {
      // Check if user already exists
      const existingUser = await User.findOne({ email: userData.email });
      if (existingUser) {
        console.log(`   ⏭️  ${userData.email} already exists, skipping`);
        skippedCount++;
        continue;
      }

      // Find the department
      const department = departments.find(d => d.name === userData.department);
      if (!department) {
        console.log(`   ⚠️  Department "${userData.department}" not found for ${userData.email}, skipping`);
        continue;
      }

      // Generate password
      const password = userData.password || 'password123';
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create user
      const user = new User({
        name: userData.name,
        email: userData.email,
        password_hash: hashedPassword,
        role: userData.role,
        department_id: department._id.toString(),
        company_id: company._id.toString(),
        is_active: true,
        preferences: {
          language: 'en',
          timezone: 'America/New_York',
          email_notifications: true,
          dashboard_layout: 'default',
        },
      });

      await user.save();
      console.log(`   ✅ Created: ${userData.name} (${userData.email}) - ${userData.role} in ${userData.department}`);
      createdCount++;
    }

    console.log(`\n🎉 Test user creation completed!`);
    console.log(`   Created: ${createdCount} new users`);
    console.log(`   Skipped: ${skippedCount} existing users`);

    // Show final user distribution
    console.log('\n📊 Final User Distribution:');
    const allUsers = await User.find({ 
      company_id: company._id.toString(),
      is_active: true 
    }).lean();

    const usersByDepartment = allUsers.reduce((acc, user) => {
      const dept = departments.find(d => d._id.toString() === user.department_id);
      const deptName = dept?.name || 'Unassigned';
      if (!acc[deptName]) acc[deptName] = [];
      acc[deptName].push(user);
      return acc;
    }, {} as Record<string, any[]>);

    Object.entries(usersByDepartment).forEach(([deptName, users]) => {
      console.log(`   📋 ${deptName}: ${users.length} users`);
      users.forEach(user => {
        console.log(`      - ${user.name} (${user.role})`);
      });
    });

    console.log('\n✨ System is now ready for comprehensive microclimate testing!');
    console.log('\n🚀 Test Scenarios You Can Now Run:');
    console.log('   1. Login as test@techcorp.com (leader) - password: password123');
    console.log('   2. Create microclimate targeting multiple departments');
    console.log('   3. Activate microclimate to send invitations');
    console.log('   4. Login as different users to test participation');
    console.log('   5. Test cross-departmental targeting and responses');

    console.log('\n📧 Test User Credentials (all use password: password123):');
    testUsers.forEach(user => {
      console.log(`   ${user.email} - ${user.role} in ${user.department}`);
    });

  } catch (error) {
    console.error('❌ Error creating test users:', error);
    throw error;
  }
}

// CLI execution
if (require.main === module) {
  createTestUsers()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Test user creation failed:', error);
      process.exit(1);
    });
}

export { createTestUsers };
