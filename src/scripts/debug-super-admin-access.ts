#!/usr/bin/env tsx

import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import Company from '@/models/Company';
import Department from '@/models/Department';
import { hasFeaturePermission } from '@/lib/permissions';

async function debugSuperAdminAccess() {
  console.log('🔍 Debugging Super Admin Microclimate Access...\n');

  try {
    await connectDB();

    // Find super admin users
    const superAdmins = await User.find({ role: 'super_admin', is_active: true }).lean();
    
    console.log(`👑 SUPER ADMIN USERS: ${superAdmins.length} found`);
    
    for (const admin of superAdmins) {
      console.log(`\n📋 SUPER ADMIN: ${admin.name} (${admin.email})`);
      console.log(`   - ID: ${admin._id}`);
      console.log(`   - Role: ${admin.role}`);
      console.log(`   - Company ID: ${admin.company_id || 'UNASSIGNED'}`);
      console.log(`   - Department ID: ${admin.department_id || 'UNASSIGNED'}`);
      console.log(`   - Is Active: ${admin.is_active}`);

      // Check permissions
      const canLaunchMicroclimates = hasFeaturePermission(admin.role, 'LAUNCH_MICROCLIMATES');
      const canCreateSurveys = hasFeaturePermission(admin.role, 'CREATE_SURVEYS');
      const canManageUsers = hasFeaturePermission(admin.role, 'CREATE_USERS');
      
      console.log(`\n   🔐 PERMISSIONS:`);
      console.log(`   - Can Launch Microclimates: ${canLaunchMicroclimates ? '✅' : '❌'}`);
      console.log(`   - Can Create Surveys: ${canCreateSurveys ? '✅' : '❌'}`);
      console.log(`   - Can Manage Users: ${canManageUsers ? '✅' : '❌'}`);

      // Check company access
      if (admin.company_id && admin.company_id !== 'unassigned') {
        const company = await Company.findById(admin.company_id);
        if (company) {
          console.log(`\n   🏢 COMPANY ACCESS:`);
          console.log(`   - Company: ${company.name}`);
          console.log(`   - Domain: ${company.domain || 'No domain'}`);
          console.log(`   - Active: ${company.is_active}`);

          // Check departments in this company
          const departments = await Department.find({ 
            company_id: admin.company_id,
            is_active: true 
          }).lean();
          
          console.log(`\n   📋 DEPARTMENTS IN COMPANY: ${departments.length} found`);
          departments.forEach((dept, index) => {
            console.log(`      ${index + 1}. ${dept.name} (Level ${dept.hierarchy.level})`);
          });
        } else {
          console.log(`\n   ⚠️  COMPANY NOT FOUND: ${admin.company_id}`);
        }
      } else {
        console.log(`\n   ⚠️  NO COMPANY ASSIGNED`);
      }

      // Check department access
      if (admin.department_id && admin.department_id !== 'unassigned') {
        const department = await Department.findById(admin.department_id);
        if (department) {
          console.log(`\n   🏗️  DEPARTMENT ACCESS:`);
          console.log(`   - Department: ${department.name}`);
          console.log(`   - Level: ${department.hierarchy.level}`);
          console.log(`   - Active: ${department.is_active}`);
        } else {
          console.log(`\n   ⚠️  DEPARTMENT NOT FOUND: ${admin.department_id}`);
        }
      } else {
        console.log(`\n   ⚠️  NO DEPARTMENT ASSIGNED`);
      }
    }

    // Check what companies exist for assignment
    console.log(`\n🏢 AVAILABLE COMPANIES FOR ASSIGNMENT:`);
    const companies = await Company.find({ is_active: true }).lean();
    companies.forEach((company, index) => {
      console.log(`   ${index + 1}. ${company.name} (${company._id})`);
      console.log(`      Domain: ${company.domain || 'No domain'}`);
    });

    // Recommendations
    console.log(`\n💡 RECOMMENDATIONS:`);
    
    const unassignedAdmins = superAdmins.filter(admin => 
      !admin.company_id || admin.company_id === 'unassigned'
    );
    
    if (unassignedAdmins.length > 0) {
      console.log(`   ⚠️  ${unassignedAdmins.length} super admin(s) have no company assignment`);
      console.log(`   📝 To fix: Assign super admins to a company for proper microclimate access`);
      
      if (companies.length > 0) {
        console.log(`\n   🔧 SUGGESTED FIX:`);
        console.log(`   Run this command to assign super admin to first company:`);
        console.log(`   npm run assign:super-admin ${companies[0]._id}`);
      }
    }

    // Check microclimate access URLs
    console.log(`\n🌐 MICROCLIMATE ACCESS URLS:`);
    console.log(`   - Main microclimates page: /microclimates`);
    console.log(`   - Create microclimate: /microclimates/create`);
    console.log(`   - Dashboard: /dashboard`);

    console.log(`\n✅ Debug completed!`);

  } catch (error) {
    console.error('❌ Error debugging super admin access:', error);
    throw error;
  }
}

// CLI execution
if (require.main === module) {
  debugSuperAdminAccess()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Debug failed:', error);
      process.exit(1);
    });
}

export { debugSuperAdminAccess };
