#!/usr/bin/env tsx

import { connectDB } from '@/lib/mongodb';
import Company from '@/models/Company';
import Department from '@/models/Department';
import User from '@/models/User';
import Microclimate from '@/models/Microclimate';
import MicroclimateInvitation from '@/models/MicroclimateInvitation';
import { QuestionPool } from '@/models/QuestionPool';
import MicroclimateTemplate from '@/models/MicroclimateTemplate';
import NotificationTemplate from '@/models/NotificationTemplate';

interface SystemStatus {
  companies: any[];
  departments: any[];
  users: any[];
  microclimates: any[];
  invitations: any[];
  questions: number;
  templates: number;
  notifications: number;
  readyForTesting: boolean;
  missingComponents: string[];
  recommendations: string[];
}

async function checkMicroclimateSystemStatus(): Promise<SystemStatus> {
  console.log('🔍 Checking Microclimate System Status...\n');

  try {
    await connectDB();

    // Check companies
    const companies = await Company.find({ is_active: true }).lean();
    console.log(`🏢 COMPANIES: ${companies.length} found`);
    companies.forEach((company, index) => {
      console.log(
        `   ${index + 1}. ${company.name} (${company.domain || 'no domain'})`
      );
    });

    // Check departments
    const departments = await Department.find({ is_active: true })
      .sort({ company_id: 1, 'hierarchy.level': 1, name: 1 })
      .lean();
    console.log(`\n🏗️  DEPARTMENTS: ${departments.length} found`);

    const departmentsByCompany = departments.reduce(
      (acc, dept) => {
        if (!acc[dept.company_id]) acc[dept.company_id] = [];
        acc[dept.company_id].push(dept);
        return acc;
      },
      {} as Record<string, any[]>
    );

    Object.entries(departmentsByCompany).forEach(([companyId, depts]) => {
      const company = companies.find((c) => c._id.toString() === companyId);
      console.log(
        `   📋 ${company?.name || 'Unknown Company'}: ${depts.length} departments`
      );
      depts.forEach((dept, index) => {
        const indent = '  '.repeat(dept.hierarchy.level + 1);
        console.log(
          `      ${index + 1}.${indent}${dept.name} (Level ${dept.hierarchy.level})`
        );
      });
    });

    // Check users
    const users = await User.find({ is_active: true })
      .sort({ company_id: 1, role: 1 })
      .lean();
    console.log(`\n👥 USERS: ${users.length} found`);

    const usersByCompany = users.reduce(
      (acc, user) => {
        if (!acc[user.company_id]) acc[user.company_id] = [];
        acc[user.company_id].push(user);
        return acc;
      },
      {} as Record<string, any[]>
    );

    Object.entries(usersByCompany).forEach(([companyId, companyUsers]) => {
      const company = companies.find((c) => c._id.toString() === companyId);
      console.log(
        `   👤 ${company?.name || 'Unknown Company'}: ${companyUsers.length} users`
      );

      const roleGroups = companyUsers.reduce(
        (acc, user) => {
          if (!acc[user.role]) acc[user.role] = [];
          acc[user.role].push(user);
          return acc;
        },
        {} as Record<string, any[]>
      );

      Object.entries(roleGroups).forEach(([role, roleUsers]: [string, any[]]) => {
        console.log(`      ${role}: ${roleUsers.length} users`);
        roleUsers.forEach((user) => {
          const dept = departments.find(
            (d) => d._id.toString() === user.department_id
          );
          console.log(
            `        - ${user.name} (${user.email}) - ${dept?.name || 'Unassigned'}`
          );
        });
      });
    });

    // Check microclimates
    const microclimates = await Microclimate.find().lean();
    console.log(`\n🌡️  MICROCLIMATES: ${microclimates.length} found`);
    microclimates.forEach((mc, index) => {
      console.log(
        `   ${index + 1}. ${mc.title} - Status: ${mc.status} - Participants: ${mc.response_count || 0}`
      );
    });

    // Check invitations
    const invitations = await MicroclimateInvitation.find().lean();
    console.log(`\n📧 MICROCLIMATE INVITATIONS: ${invitations.length} found`);
    if (invitations.length > 0) {
      const statusGroups = invitations.reduce(
        (acc, inv) => {
          if (!acc[inv.status]) acc[inv.status] = 0;
          acc[inv.status]++;
          return acc;
        },
        {} as Record<string, number>
      );
      Object.entries(statusGroups).forEach(([status, count]) => {
        console.log(`   ${status}: ${count} invitations`);
      });
    }

    // Check question pool
    let questionCount = 0;
    try {
      questionCount = await QuestionPool.countDocuments();
    } catch (error) {
      console.log(`\n❓ QUESTION POOL: Error accessing - ${error.message}`);
    }
    console.log(`\n❓ QUESTION POOL: ${questionCount} questions`);

    // Check microclimate templates
    let templateCount = 0;
    try {
      templateCount = await MicroclimateTemplate.countDocuments();
    } catch (error) {
      console.log(
        `📋 MICROCLIMATE TEMPLATES: Error accessing - ${error.message}`
      );
    }
    console.log(`📋 MICROCLIMATE TEMPLATES: ${templateCount} templates`);

    // Check notification templates
    let notificationCount = 0;
    try {
      notificationCount = await NotificationTemplate.countDocuments();
    } catch (error) {
      console.log(
        `📬 NOTIFICATION TEMPLATES: Error accessing - ${error.message}`
      );
    }
    console.log(`📬 NOTIFICATION TEMPLATES: ${notificationCount} templates`);

    // Analyze readiness for testing
    const missingComponents: string[] = [];
    const recommendations: string[] = [];

    if (companies.length === 0) {
      missingComponents.push('No companies found');
    }

    if (departments.length === 0) {
      missingComponents.push('No departments found');
    }

    if (users.length === 0) {
      missingComponents.push('No users found');
    } else {
      const leaders = users.filter((u) => u.role === 'leader');
      if (leaders.length === 0) {
        missingComponents.push(
          'No leaders found (needed to create microclimates)'
        );
      }

      // Check for users in multiple departments
      const departmentUserCounts = departments.map((dept) => ({
        name: dept.name,
        userCount: users.filter((u) => u.department_id === dept._id.toString())
          .length,
      }));

      const emptyDepartments = departmentUserCounts.filter(
        (d) => d.userCount === 0
      );
      if (emptyDepartments.length > 0) {
        recommendations.push(
          `Add users to empty departments: ${emptyDepartments.map((d) => d.name).join(', ')}`
        );
      }
    }

    if (questionCount === 0) {
      missingComponents.push('No questions in question pool');
      recommendations.push('Run: npm run seed:questions');
    }

    if (templateCount === 0) {
      recommendations.push(
        'Consider adding microclimate templates for easier creation'
      );
    }

    if (notificationCount === 0) {
      missingComponents.push('No notification templates found');
      recommendations.push(
        'Run: npm run seed:all to add notification templates'
      );
    }

    const readyForTesting = missingComponents.length === 0;

    console.log('\n📊 SYSTEM STATUS SUMMARY:');
    console.log(
      `   Ready for Testing: ${readyForTesting ? '✅ YES' : '❌ NO'}`
    );

    if (missingComponents.length > 0) {
      console.log('\n❌ MISSING COMPONENTS:');
      missingComponents.forEach((component) => {
        console.log(`   - ${component}`);
      });
    }

    if (recommendations.length > 0) {
      console.log('\n💡 RECOMMENDATIONS:');
      recommendations.forEach((rec) => {
        console.log(`   - ${rec}`);
      });
    }

    if (readyForTesting) {
      console.log('\n🎉 SYSTEM IS READY FOR MICROCLIMATE TESTING!');
      console.log('\n🚀 NEXT STEPS TO TEST:');
      console.log('   1. Login as a leader user');
      console.log('   2. Navigate to microclimate creation');
      console.log('   3. Create and activate a microclimate');
      console.log('   4. Check that invitations are sent to targeted users');
      console.log('   5. Test user participation flow');
    }

    return {
      companies,
      departments,
      users,
      microclimates,
      invitations,
      questions: questionCount,
      templates: templateCount,
      notifications: notificationCount,
      readyForTesting,
      missingComponents,
      recommendations,
    };
  } catch (error) {
    console.error('❌ Error checking system status:', error);
    throw error;
  }
}

// CLI execution
if (require.main === module) {
  checkMicroclimateSystemStatus()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Status check failed:', error);
      process.exit(1);
    });
}

export { checkMicroclimateSystemStatus };
