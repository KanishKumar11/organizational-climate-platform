#!/usr/bin/env tsx

import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import Department from '@/models/Department';
import { hasFeaturePermission } from '@/lib/permissions';

async function testDepartmentTargeting() {
  console.log('🧪 Testing Department Targeting Access...\n');

  try {
    await connectDB();

    // Find the test user
    const testUser = await User.findOne({ email: 'test@techcorp.com' });
    if (!testUser) {
      console.error('❌ Test user not found. Please run user seeding first.');
      return;
    }

    console.log('👤 TEST USER DETAILS:');
    console.log(`   - Email: ${testUser.email}`);
    console.log(`   - Role: ${testUser.role}`);
    console.log(`   - Company ID: ${testUser.company_id}`);
    console.log(`   - Department ID: ${testUser.department_id}`);

    // Check microclimate permissions
    const canLaunchMicroclimates = hasFeaturePermission(testUser.role, 'LAUNCH_MICROCLIMATES');
    console.log(`   - Can Launch Microclimates: ${canLaunchMicroclimates ? '✅' : '❌'}`);

    if (!canLaunchMicroclimates) {
      console.log('\n❌ User cannot launch microclimates. Department targeting not applicable.');
      return;
    }

    // Test regular departments endpoint logic
    console.log('\n📋 REGULAR DEPARTMENTS ENDPOINT (/api/departments):');
    let regularQuery: any = { is_active: true };

    if (testUser.role === 'super_admin') {
      // Super admin can see all departments
    } else if (testUser.role === 'company_admin') {
      // Company admin can see all departments in their company
      regularQuery.company_id = testUser.company_id;
    } else {
      // Other roles can only see their own department and its children
      regularQuery.$or = [
        { _id: testUser.department_id },
        { 'hierarchy.parent_department_id': testUser.department_id },
      ];
      regularQuery.company_id = testUser.company_id;
    }

    const regularDepartments = await Department.find(regularQuery)
      .sort({ 'hierarchy.level': 1, name: 1 })
      .lean();

    console.log(`   Query: ${JSON.stringify(regularQuery, null, 2)}`);
    console.log(`   Results: ${regularDepartments.length} departments`);
    regularDepartments.forEach((dept, index) => {
      console.log(`   ${index + 1}. ${dept.name} (${dept._id})`);
    });

    // Test targeting departments endpoint logic
    console.log('\n🎯 TARGETING DEPARTMENTS ENDPOINT (/api/departments/for-targeting):');
    let targetingQuery: any = { is_active: true };

    if (testUser.role === 'super_admin') {
      // Super admin can see all departments across all companies
    } else if (testUser.role === 'company_admin') {
      // Company admin can see all departments in their company
      targetingQuery.company_id = testUser.company_id;
    } else if (testUser.role === 'leader') {
      // Leaders can see all departments in their company for microclimate targeting
      targetingQuery.company_id = testUser.company_id;
    } else {
      // Other roles can only target their own department and its children
      targetingQuery.$or = [
        { _id: testUser.department_id },
        { 'hierarchy.parent_department_id': testUser.department_id },
      ];
      targetingQuery.company_id = testUser.company_id;
    }

    const targetingDepartments = await Department.find(targetingQuery)
      .sort({ 'hierarchy.level': 1, name: 1 })
      .lean();

    console.log(`   Query: ${JSON.stringify(targetingQuery, null, 2)}`);
    console.log(`   Results: ${targetingDepartments.length} departments`);
    targetingDepartments.forEach((dept, index) => {
      console.log(`   ${index + 1}. ${dept.name} (${dept._id})`);
    });

    // Compare results
    console.log('\n📊 COMPARISON:');
    console.log(`   Regular endpoint: ${regularDepartments.length} departments`);
    console.log(`   Targeting endpoint: ${targetingDepartments.length} departments`);
    
    const improvement = targetingDepartments.length - regularDepartments.length;
    if (improvement > 0) {
      console.log(`   ✅ Targeting endpoint provides ${improvement} additional departments for better microclimate targeting!`);
    } else if (improvement === 0) {
      console.log(`   ℹ️  Both endpoints return the same departments (user has full access already)`);
    } else {
      console.log(`   ⚠️  Targeting endpoint returns fewer departments (unexpected)`);
    }

    // Show all departments in company for context
    console.log('\n🏢 ALL DEPARTMENTS IN COMPANY:');
    const allCompanyDepartments = await Department.find({
      company_id: testUser.company_id,
      is_active: true
    }).sort({ 'hierarchy.level': 1, name: 1 }).lean();

    console.log(`   Total: ${allCompanyDepartments.length} departments`);
    allCompanyDepartments.forEach((dept, index) => {
      const isAccessibleRegular = regularDepartments.some(d => d._id.toString() === dept._id.toString());
      const isAccessibleTargeting = targetingDepartments.some(d => d._id.toString() === dept._id.toString());
      
      console.log(`   ${index + 1}. ${dept.name}`);
      console.log(`      - Regular: ${isAccessibleRegular ? '✅' : '❌'}`);
      console.log(`      - Targeting: ${isAccessibleTargeting ? '✅' : '❌'}`);
    });

    console.log('\n🎉 Department targeting test completed!');
    
    if (testUser.role === 'leader' && targetingDepartments.length === allCompanyDepartments.length) {
      console.log('✅ SUCCESS: Leaders can now access all company departments for microclimate targeting!');
    } else if (testUser.role === 'leader') {
      console.log('⚠️  WARNING: Leaders still have limited department access. Check the targeting endpoint logic.');
    }

  } catch (error) {
    console.error('❌ Error testing department targeting:', error);
    throw error;
  }
}

// Run the test
if (require.main === module) {
  testDepartmentTargeting()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Test failed:', error);
      process.exit(1);
    });
}

export { testDepartmentTargeting };
