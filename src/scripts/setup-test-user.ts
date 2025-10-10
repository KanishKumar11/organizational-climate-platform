/**
 * Setup Test User for Testing
 * Creates a super admin user with test credentials: 77kanish@gmail.com / kanish@7.7
 */

import { connectDB } from '../lib/mongodb';
import User from '../models/User';
import Company from '../models/Company';
import Department from '../models/Department';
import bcrypt from 'bcryptjs';

async function setupTestUser() {
  try {
    await connectDB();
    console.log('🔌 Connected to MongoDB');

    const testEmail = '77kanish@gmail.com';
    const testPassword = 'kanish@7.7';

    // Check if user already exists
    let existingUser = await User.findOne({ email: testEmail });

    if (existingUser) {
      console.log('✅ Test user already exists:', testEmail);
      console.log('   Role:', existingUser.role);
      console.log('   Company ID:', existingUser.company_id);
      console.log('   Department ID:', existingUser.department_id);

      // Update to super_admin if needed
      if (existingUser.role !== 'super_admin') {
        existingUser.role = 'super_admin';
        await existingUser.save();
        console.log('✅ Updated user role to super_admin');
      }

      return;
    }

    // Find or create a test company
    let testCompany = await Company.findOne({ domain: 'testcompany.com' });

    if (!testCompany) {
      console.log('📦 Creating test company...');
      testCompany = await Company.create({
        name: 'Test Company',
        domain: 'testcompany.com',
        industry: 'Technology',
        size: '50-200',
        is_active: true,
        branding: {
          primary_color: '#2563EB',
          logo_url: '',
        },
        settings: {
          survey: {
            allow_anonymous: true,
            require_demographics: false,
          },
        },
      });
      console.log('✅ Test company created:', testCompany.name);
    }

    // Find or create a test department
    let testDepartment = await Department.findOne({
      company_id: testCompany._id.toString(),
      name: 'General',
    });

    if (!testDepartment) {
      console.log('🏢 Creating test department...');
      testDepartment = await Department.create({
        name: 'General',
        description: 'General department for test users',
        company_id: testCompany._id.toString(),
        hierarchy: {
          level: 0,
          path: 'general',
        },
        is_active: true,
      });
      console.log('✅ Test department created:', testDepartment.name);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(testPassword, 12);

    // Create test super admin user
    console.log('👤 Creating test super admin user...');
    const testUser = await User.create({
      name: 'Test Super Admin',
      email: testEmail,
      password_hash: passwordHash,
      role: 'super_admin',
      company_id: testCompany._id.toString(),
      department_id: testDepartment._id.toString(),
      is_active: true,
      demographics: {},
    });

    console.log('\n✅ Test user created successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔑 TEST CREDENTIALS:');
    console.log('   Email:', testEmail);
    console.log('   Password:', testPassword);
    console.log('   Role:', testUser.role);
    console.log('   Company:', testCompany.name);
    console.log('   Department:', testDepartment.name);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting up test user:', error);
    process.exit(1);
  }
}

setupTestUser();

