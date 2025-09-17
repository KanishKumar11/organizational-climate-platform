import { connectDB } from '@/lib/db';
import User from '@/models/User';
import Department from '@/models/Department';
import Company from '@/models/Company';

async function debugDepartments() {
  try {
    await connectDB();

    console.log('=== DEBUGGING DEPARTMENT VALIDATION ISSUE ===\n');

    // 1. Check test user details
    const testUser = await User.findOne({ email: 'test@techcorp.com' });
    if (!testUser) {
      console.log('❌ Test user not found!');
      return;
    }

    console.log('1. TEST USER DETAILS:');
    console.log('   - ID:', testUser._id.toString());
    console.log('   - Email:', testUser.email);
    console.log('   - Role:', testUser.role);
    console.log('   - Company ID:', testUser.company_id);
    console.log('   - Department ID:', testUser.department_id);

    // 2. Check user's company
    const userCompany = await Company.findById(testUser.company_id);
    console.log('\n2. USER\'S COMPANY:');
    if (userCompany) {
      console.log('   - Company Name:', userCompany.name);
      console.log('   - Company ID:', userCompany._id.toString());
    } else {
      console.log('   - ❌ Company not found!');
    }

    // 3. Check all departments
    const allDepartments = await Department.find({}).lean();
    console.log('\n3. ALL DEPARTMENTS IN DATABASE:');
    allDepartments.forEach((dept, index) => {
      console.log(`   ${index + 1}. ${dept.name}`);
      console.log(`      - ID: ${dept._id}`);
      console.log(`      - Company ID: ${dept.company_id || 'NOT SET'}`);
      console.log(`      - Active: ${dept.is_active}`);
      console.log(`      - Parent: ${dept.hierarchy?.parent_department_id || 'None'}`);
    });

    // 4. Check departments that match user's company
    const userCompanyDepartments = await Department.find({
      company_id: testUser.company_id,
      is_active: true
    }).lean();

    console.log('\n4. DEPARTMENTS FOR USER\'S COMPANY:');
    if (userCompanyDepartments.length === 0) {
      console.log('   ❌ NO DEPARTMENTS FOUND FOR USER\'S COMPANY!');
      console.log('   This is likely the root cause of the validation error.');
    } else {
      userCompanyDepartments.forEach((dept, index) => {
        console.log(`   ${index + 1}. ${dept.name} (${dept._id})`);
      });
    }

    // 5. Check what the /api/departments endpoint would return
    let departmentQuery: any = { is_active: true };
    
    if (testUser.role === 'super_admin') {
      // Super admin can see all departments
    } else if (testUser.role === 'company_admin') {
      // Company admin can see all departments in their company
      departmentQuery.company_id = testUser.company_id;
    } else {
      // Other roles can only see their own department and its children
      departmentQuery.$or = [
        { _id: testUser.department_id },
        { 'hierarchy.parent_department_id': testUser.department_id },
      ];
      departmentQuery.company_id = testUser.company_id;
    }

    const apiDepartments = await Department.find(departmentQuery).lean();
    console.log('\n5. DEPARTMENTS API WOULD RETURN:');
    console.log('   Query:', JSON.stringify(departmentQuery, null, 2));
    console.log('   Results:', apiDepartments.length);
    apiDepartments.forEach((dept, index) => {
      console.log(`   ${index + 1}. ${dept.name} (${dept._id})`);
    });

    // 6. Suggested fix
    console.log('\n6. SUGGESTED FIX:');
    if (userCompanyDepartments.length === 0) {
      console.log('   The departments were seeded without company_id values.');
      console.log('   We need to update the seeded departments to have the correct company_id.');
      console.log(`   Run: Department.updateMany({}, { company_id: "${testUser.company_id}" })`);
    }

  } catch (error) {
    console.error('❌ Error debugging departments:', error);
  }
}

// Run the debug script
debugDepartments().then(() => {
  console.log('\n=== DEBUG COMPLETE ===');
  process.exit(0);
}).catch(error => {
  console.error('Script error:', error);
  process.exit(1);
});
