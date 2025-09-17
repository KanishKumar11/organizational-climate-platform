import { connectDB } from '@/lib/db';
import User from '@/models/User';
import Company from '@/models/Company';
import Department from '@/models/Department';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

// Create a test user for development
export async function seedTestUser() {
  try {
    await connectDB();

    // Check if test user already exists
    const existingUser = await User.findOne({ email: 'test@techcorp.com' });
    if (existingUser) {
      console.log('Test user already exists:', existingUser.email);
      return existingUser;
    }

    // Get the demo company and department
    console.log('Looking for demo company and department...');
    const company = await Company.findOne(); // Use any existing company
    const department = await Department.findOne({ name: 'Engineering' });

    console.log('Found company:', company ? company.name : 'Not found');
    console.log(
      'Found department:',
      department ? department.name : 'Not found'
    );

    if (!company || !department) {
      console.log(
        'Available companies:',
        await Company.find({}).select('name')
      );
      console.log(
        'Available departments:',
        await Department.find({}).select('name')
      );
      throw new Error(
        'Demo company or department not found. Please run company seeding first.'
      );
    }

    // Create test user
    const hashedPassword = await bcrypt.hash('password123', 12);

    const testUser = new User({
      name: 'Test Leader',
      email: 'test@techcorp.com',
      password_hash: hashedPassword,
      role: 'leader', // Leader role can create microclimates
      company_id: company._id.toString(),
      department_id: department._id.toString(),
      is_active: true,
      preferences: {
        language: 'en',
        timezone: 'America/New_York',
        email_notifications: true,
        dashboard_layout: 'default',
      },
    });

    await testUser.save();
    console.log('✅ Test user created successfully:', testUser.email);
    console.log('   Password: password123');
    console.log('   Role:', testUser.role);
    console.log('   Company:', company.name);
    console.log('   Department:', department.name);

    return testUser;
  } catch (error) {
    console.error('❌ Error creating test user:', error);
    throw error;
  }
}

// Export for use in other scripts
export default seedTestUser;
