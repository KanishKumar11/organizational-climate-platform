#!/usr/bin/env tsx

import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import { hasFeaturePermission, ROLE_PERMISSIONS } from '@/lib/permissions';

async function testSuperAdminNavigation() {
  console.log('🧭 Testing Super Admin Navigation Access...\n');

  try {
    await connectDB();

    // Find super admin user
    const superAdmin = await User.findOne({ 
      role: 'super_admin', 
      is_active: true,
      email: { $regex: /gmail\.com$/ } // Find the Gmail super admin
    }).lean();

    if (!superAdmin) {
      console.error('❌ Super admin user not found');
      return;
    }

    console.log(`👑 Testing navigation for: ${superAdmin.name} (${superAdmin.email})`);
    console.log(`   Role: ${superAdmin.role}`);

    // Test all permission checks that affect navigation
    const permissions = {
      canCreateSurveys: hasFeaturePermission(superAdmin.role, 'CREATE_SURVEYS'),
      canLaunchMicroclimates: hasFeaturePermission(superAdmin.role, 'LAUNCH_MICROCLIMATES'),
      canCreateActionPlans: hasFeaturePermission(superAdmin.role, 'CREATE_ACTION_PLANS'),
      canViewCompanyAnalytics: hasFeaturePermission(superAdmin.role, 'VIEW_COMPANY_ANALYTICS'),
      canManageUsers: hasFeaturePermission(superAdmin.role, 'CREATE_USERS'),
      canExportReports: hasFeaturePermission(superAdmin.role, 'EXPORT_REPORTS'),
    };

    console.log('\n🔐 PERMISSION CHECKS:');
    Object.entries(permissions).forEach(([permission, hasAccess]) => {
      console.log(`   ${permission}: ${hasAccess ? '✅' : '❌'}`);
    });

    // Test role-specific checks
    const roleChecks = {
      isSuperAdmin: superAdmin.role === 'super_admin',
      isCompanyAdmin: superAdmin.role === 'company_admin',
      isLeader: superAdmin.role === 'leader',
      isSupervisor: superAdmin.role === 'supervisor',
      isEmployee: superAdmin.role === 'employee',
    };

    console.log('\n👤 ROLE CHECKS:');
    Object.entries(roleChecks).forEach(([check, result]) => {
      console.log(`   ${check}: ${result ? '✅' : '❌'}`);
    });

    // Simulate navigation sections that should appear
    console.log('\n🧭 EXPECTED NAVIGATION SECTIONS:');

    // Core section - always available
    console.log('   ✅ Overview');
    console.log('      - Dashboard');

    // Survey management section
    if (permissions.canCreateSurveys) {
      console.log('   ✅ Surveys');
      console.log('      - All Surveys');
      console.log('      - Survey Templates');
    } else {
      console.log('   ❌ Surveys (no permission)');
    }

    // Microclimate section
    if (permissions.canLaunchMicroclimates) {
      console.log('   ✅ Real-time Feedback');
      console.log('      - Microclimates (Live)');
    } else {
      console.log('   ❌ Real-time Feedback (no permission)');
    }

    // Action plans section
    if (permissions.canCreateActionPlans) {
      console.log('   ✅ Improvement');
      console.log('      - Action Plans');
    } else {
      console.log('   ❌ Improvement (no permission)');
    }

    // Analytics section
    if (permissions.canViewCompanyAnalytics) {
      console.log('   ✅ Analytics');
      console.log('      - Reports');
      console.log('      - Benchmarks');
    } else {
      console.log('   ❌ Analytics (no permission)');
    }

    // User management section
    if (permissions.canManageUsers) {
      console.log('   ✅ Organization');
      console.log('      - Users');
      console.log('      - Departments');
    } else {
      console.log('   ❌ Organization (no permission)');
    }

    // Super admin section
    if (roleChecks.isSuperAdmin) {
      console.log('   ✅ System Administration');
      console.log('      - Companies');
      console.log('      - System Settings');
      console.log('      - System Logs');
    } else {
      console.log('   ❌ System Administration (not super admin)');
    }

    // Test specific microclimate access
    console.log('\n🌡️  MICROCLIMATE ACCESS TEST:');
    console.log(`   Can Launch Microclimates: ${permissions.canLaunchMicroclimates ? '✅' : '❌'}`);
    
    if (permissions.canLaunchMicroclimates) {
      console.log('   Expected URLs:');
      console.log('      - /microclimates (main page)');
      console.log('      - /microclimates/create (creation page)');
      
      console.log('\n   🎯 TROUBLESHOOTING STEPS:');
      console.log('   1. Check if "Microclimates" appears in your sidebar under "Real-time Feedback"');
      console.log('   2. Try navigating directly to /microclimates');
      console.log('   3. Try navigating directly to /microclimates/create');
      console.log('   4. Check browser console for any JavaScript errors');
      console.log('   5. Verify you\'re logged in as the correct super admin user');
    }

    // Check ROLE_PERMISSIONS configuration
    console.log('\n⚙️  ROLE_PERMISSIONS CONFIGURATION:');
    console.log(`   LAUNCH_MICROCLIMATES includes: ${ROLE_PERMISSIONS.LAUNCH_MICROCLIMATES.join(', ')}`);
    console.log(`   Super admin role included: ${ROLE_PERMISSIONS.LAUNCH_MICROCLIMATES.includes('super_admin') ? '✅' : '❌'}`);

    console.log('\n✅ Navigation test completed!');

    if (permissions.canLaunchMicroclimates) {
      console.log('\n🎉 RESULT: Super admin should have full microclimate access!');
      console.log('If you don\'t see the navigation, try:');
      console.log('1. Refresh the page');
      console.log('2. Clear browser cache');
      console.log('3. Check browser console for errors');
      console.log('4. Navigate directly to /microclimates');
    } else {
      console.log('\n❌ RESULT: Super admin does not have microclimate permissions (this is unexpected)');
    }

  } catch (error) {
    console.error('❌ Error testing super admin navigation:', error);
    throw error;
  }
}

// CLI execution
if (require.main === module) {
  testSuperAdminNavigation()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Navigation test failed:', error);
      process.exit(1);
    });
}

export { testSuperAdminNavigation };
