#!/usr/bin/env tsx

import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import Department from '@/models/Department';

async function testDepartmentCreation() {
  console.log('🧪 Testing Department Creation...\n');

  try {
    await connectDB();

    // Find a super admin or company admin user
    const adminUser = await User.findOne({ 
      role: { $in: ['super_admin', 'company_admin'] },
      is_active: true 
    }).lean();

    if (!adminUser) {
      console.error('❌ No admin user found for testing');
      return;
    }

    console.log(`👑 Admin User: ${adminUser.name} (${adminUser.email})`);
    console.log(`   Role: ${adminUser.role}`);
    console.log(`   Company ID: ${adminUser.company_id}\n`);

    // Test 1: Create a root department
    console.log('TEST 1: Creating Root Department');
    const rootDeptData = {
      name: 'Test Engineering',
      description: 'Test engineering department',
      company_id: adminUser.company_id,
      is_active: true,
      hierarchy: {
        level: 0,
        parent_department_id: null,
        path: 'test-engineering',
      },
    };

    console.log('   Department data:', JSON.stringify(rootDeptData, null, 2));

    try {
      const rootDept = new Department(rootDeptData);
      await rootDept.save();
      console.log('   ✅ Root department created successfully:', rootDept._id);
      
      // Test 2: Create a subdepartment
      console.log('\nTEST 2: Creating Subdepartment');
      const subDeptData = {
        name: 'Test Backend',
        description: 'Test backend team',
        company_id: adminUser.company_id,
        is_active: true,
        hierarchy: {
          level: 1,
          parent_department_id: rootDept._id.toString(),
          path: 'test-engineering/test-backend',
        },
      };

      console.log('   Subdepartment data:', JSON.stringify(subDeptData, null, 2));

      const subDept = new Department(subDeptData);
      await subDept.save();
      console.log('   ✅ Subdepartment created successfully:', subDept._id);

      // Test 3: Verify hierarchy
      console.log('\nTEST 3: Verifying Department Hierarchy');
      const createdRoot = await Department.findById(rootDept._id).lean();
      const createdSub = await Department.findById(subDept._id).lean();

      console.log('   Root Department:');
      console.log(`     Name: ${createdRoot?.name}`);
      console.log(`     Path: ${createdRoot?.hierarchy.path}`);
      console.log(`     Level: ${createdRoot?.hierarchy.level}`);
      console.log(`     Parent: ${createdRoot?.hierarchy.parent_department_id || 'None'}`);

      console.log('   Subdepartment:');
      console.log(`     Name: ${createdSub?.name}`);
      console.log(`     Path: ${createdSub?.hierarchy.path}`);
      console.log(`     Level: ${createdSub?.hierarchy.level}`);
      console.log(`     Parent: ${createdSub?.hierarchy.parent_department_id}`);

      // Test 4: Test path generation logic
      console.log('\nTEST 4: Testing Path Generation Logic');
      const testNames = [
        'Engineering',
        'Human Resources',
        'Sales & Marketing',
        'Research & Development',
        'Quality Assurance'
      ];

      testNames.forEach(name => {
        const path = name.toLowerCase().replace(/\s+/g, '-').replace(/[&]/g, 'and');
        console.log(`   "${name}" → "${path}"`);
      });

      // Cleanup
      console.log('\nCLEANUP: Removing test departments');
      await Department.deleteOne({ _id: subDept._id });
      await Department.deleteOne({ _id: rootDept._id });
      console.log('   ✅ Test departments cleaned up');

      console.log('\n🎉 All tests passed! Department creation should work correctly.');

    } catch (error) {
      console.error('❌ Error during department creation test:', error);
      if (error instanceof Error) {
        console.error('   Error message:', error.message);
        console.error('   Error stack:', error.stack);
      }
    }

    // Test 5: Validate required fields
    console.log('\nTEST 5: Testing Required Field Validation');
    
    try {
      const invalidDept = new Department({
        name: 'Test Invalid',
        company_id: adminUser.company_id,
        hierarchy: {
          level: 0,
          parent_department_id: null,
          // Missing required 'path' field
        },
      });
      
      await invalidDept.save();
      console.log('   ❌ Should have failed validation but didn\'t');
    } catch (validationError) {
      console.log('   ✅ Validation correctly failed for missing path field');
      console.log('   Error:', validationError instanceof Error ? validationError.message : validationError);
    }

    // Test 6: Check existing departments
    console.log('\nTEST 6: Checking Existing Departments');
    const existingDepts = await Department.find({ 
      company_id: adminUser.company_id 
    }).select('name hierarchy.path hierarchy.level').lean();

    console.log(`   Found ${existingDepts.length} existing departments:`);
    existingDepts.forEach((dept, index) => {
      console.log(`   ${index + 1}. "${dept.name}" - Path: "${dept.hierarchy.path}" - Level: ${dept.hierarchy.level}`);
    });

    console.log('\n✅ Department creation testing completed!');

  } catch (error) {
    console.error('❌ Error during department creation testing:', error);
    throw error;
  }
}

// CLI execution
if (require.main === module) {
  testDepartmentCreation()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Department creation test failed:', error);
      process.exit(1);
    });
}

export { testDepartmentCreation };
