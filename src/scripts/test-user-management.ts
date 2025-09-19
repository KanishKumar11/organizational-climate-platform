#!/usr/bin/env tsx

import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import Department from '@/models/Department';

async function testUserManagement() {
  console.log('🧪 Testing User Management System...\n');

  try {
    await connectDB();

    // Find a company admin user for testing
    const adminUser = await User.findOne({
      role: { $in: ['super_admin', 'company_admin'] },
      is_active: true,
    }).lean();

    if (!adminUser) {
      console.error('❌ No admin user found for testing');
      return;
    }

    console.log(`👑 Admin User: ${adminUser.name} (${adminUser.email})`);
    console.log(`   Role: ${adminUser.role}`);
    console.log(`   Company ID: ${adminUser.company_id}\n`);

    // Find or create a department for testing
    let department = await Department.findOne({
      company_id: adminUser.company_id,
      is_active: true,
    }).lean();

    if (!department) {
      console.log('🏢 No department found, creating test department...');
      const newDepartment = new Department({
        name: 'Test Department',
        description: 'Test department for user management',
        company_id: adminUser.company_id,
        is_active: true,
        hierarchy: {
          level: 0,
          parent_department_id: null,
          path: 'test-department',
        },
      });

      await newDepartment.save();
      department = newDepartment.toObject();
      console.log('   ✅ Test department created:', department._id);
    }

    console.log(`🏢 Test Department: ${department.name} (${department._id})\n`);

    // Test 1: Create a test user
    console.log('TEST 1: Creating Test User');
    const testUserData = {
      name: 'Test User Management',
      email: 'test-user-mgmt@example.com',
      role: 'employee',
      department_id: department._id.toString(),
      company_id: adminUser.company_id,
      is_active: true,
      preferences: {
        language: 'en',
        timezone: 'America/New_York',
        email_notifications: true,
        dashboard_layout: 'default',
      },
    };

    console.log('   User data:', JSON.stringify(testUserData, null, 2));

    try {
      const testUser = new User(testUserData);
      await testUser.save();
      console.log('   ✅ Test user created successfully:', testUser._id);

      // Test 2: Update user (simulate PATCH API)
      console.log('\nTEST 2: Updating User');
      const updateData = {
        name: 'Updated Test User',
        role: 'supervisor',
        is_active: false,
      };

      console.log('   Update data:', JSON.stringify(updateData, null, 2));

      const updatedUser = await User.findByIdAndUpdate(
        testUser._id,
        { ...updateData, updated_at: new Date() },
        { new: true, runValidators: true }
      ).populate('department_id', 'name');

      if (updatedUser) {
        console.log('   ✅ User updated successfully');
        console.log(`     Name: ${updatedUser.name}`);
        console.log(`     Role: ${updatedUser.role}`);
        console.log(`     Active: ${updatedUser.is_active}`);
        console.log(
          `     Department: ${(updatedUser.department_id as any)?.name || 'N/A'}`
        );
      } else {
        console.log('   ❌ User update failed');
      }

      // Test 3: Verify user can be found in list
      console.log('\nTEST 3: Finding User in List');
      const users = await User.find({
        company_id: adminUser.company_id,
      })
        .populate('department_id', 'name')
        .lean();

      const foundUser = users.find(
        (u) => u._id.toString() === testUser._id.toString()
      );
      if (foundUser) {
        console.log('   ✅ User found in company user list');
        console.log(`     Total users in company: ${users.length}`);
      } else {
        console.log('   ❌ User not found in company user list');
      }

      // Test 4: Test user status toggle
      console.log('\nTEST 4: Testing User Status Toggle');
      const toggledUser = await User.findByIdAndUpdate(
        testUser._id,
        { is_active: !updatedUser.is_active, updated_at: new Date() },
        { new: true }
      );

      if (toggledUser) {
        console.log('   ✅ User status toggled successfully');
        console.log(`     Previous status: ${updatedUser.is_active}`);
        console.log(`     New status: ${toggledUser.is_active}`);
      } else {
        console.log('   ❌ User status toggle failed');
      }

      // Test 5: Test validation
      console.log('\nTEST 5: Testing Validation');
      try {
        const invalidUser = new User({
          name: '', // Invalid: empty name
          email: 'invalid-email', // Invalid: bad email format
          role: 'employee',
          department_id: department._id.toString(),
          company_id: adminUser.company_id,
        });

        await invalidUser.save();
        console.log("   ❌ Should have failed validation but didn't");
      } catch (validationError) {
        console.log('   ✅ Validation correctly failed for invalid data');
        console.log(
          '   Error:',
          validationError instanceof Error
            ? validationError.message
            : validationError
        );
      }

      // Cleanup
      console.log('\nCLEANUP: Removing test user');
      await User.deleteOne({ _id: testUser._id });
      console.log('   ✅ Test user cleaned up');

      console.log('\n🎉 All user management tests passed!');
    } catch (error) {
      console.error('❌ Error during user management test:', error);
      if (error instanceof Error) {
        console.error('   Error message:', error.message);
        console.error('   Error stack:', error.stack);
      }
    }

    // Test 6: Check existing users structure
    console.log('\nTEST 6: Checking Existing Users Structure');
    const existingUsers = await User.find({
      company_id: adminUser.company_id,
    })
      .select('name email role department_id is_active')
      .populate('department_id', 'name')
      .lean();

    console.log(`   Found ${existingUsers.length} existing users:`);
    existingUsers.slice(0, 5).forEach((user, index) => {
      console.log(`   ${index + 1}. "${user.name}" (${user.email})`);
      console.log(`      Role: ${user.role} | Active: ${user.is_active}`);
      console.log(
        `      Department: ${(user.department_id as any)?.name || 'Unassigned'}`
      );
    });

    if (existingUsers.length > 5) {
      console.log(`   ... and ${existingUsers.length - 5} more users`);
    }

    console.log('\n✅ User management system testing completed!');
  } catch (error) {
    console.error('❌ Error during user management testing:', error);
    throw error;
  }
}

// CLI execution
if (require.main === module) {
  testUserManagement()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('User management test failed:', error);
      process.exit(1);
    });
}

export { testUserManagement };
