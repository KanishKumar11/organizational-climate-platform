import { connectDB } from '@/lib/db';
import User from '@/models/User';
import Department from '@/models/Department';
import Company from '@/models/Company';

async function fixDepartmentCompanyIds() {
  try {
    await connectDB();

    console.log('=== FIXING DEPARTMENT COMPANY IDs ===\n');

    // 1. Get the test user's company
    const testUser = await User.findOne({ email: 'test@techcorp.com' });
    if (!testUser) {
      console.log('❌ Test user not found!');
      return;
    }

    console.log('1. Test user company ID:', testUser.company_id);

    // 2. Get the company details
    const company = await Company.findById(testUser.company_id);
    if (!company) {
      console.log('❌ Company not found!');
      return;
    }

    console.log('2. Company name:', company.name);

    // 3. Update all departments to use the correct company_id
    const updateResult = await Department.updateMany(
      {}, // Update all departments
      { company_id: testUser.company_id }
    );

    console.log('3. Updated departments:');
    console.log('   - Matched:', updateResult.matchedCount);
    console.log('   - Modified:', updateResult.modifiedCount);

    // 4. Verify the fix
    const updatedDepartments = await Department.find({
      company_id: testUser.company_id,
      is_active: true
    }).select('name _id');

    console.log('\n4. Departments now available for user\'s company:');
    updatedDepartments.forEach((dept, index) => {
      console.log(`   ${index + 1}. ${dept.name} (${dept._id})`);
    });

    console.log('\n✅ Fix completed successfully!');
    console.log('   Users can now select departments when creating microclimates.');

  } catch (error) {
    console.error('❌ Error fixing department company IDs:', error);
  }
}

// Run the fix script
fixDepartmentCompanyIds().then(() => {
  console.log('\n=== FIX COMPLETE ===');
  process.exit(0);
}).catch(error => {
  console.error('Script error:', error);
  process.exit(1);
});
