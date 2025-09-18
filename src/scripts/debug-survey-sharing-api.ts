#!/usr/bin/env tsx

import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import Survey from '@/models/Survey';
import { hasFeaturePermission } from '@/lib/permissions';

async function debugSurveySharingAPI() {
  console.log('🔍 Debugging Survey Sharing API Call...\n');

  try {
    await connectDB();

    // Find super admin user
    const superAdmin = await User.findOne({ 
      role: 'super_admin', 
      is_active: true,
      email: { $regex: /gmail\.com$/ }
    }).lean();

    if (!superAdmin) {
      console.error('❌ Super admin user not found');
      return;
    }

    console.log(`👑 Super Admin: ${superAdmin.name} (${superAdmin.email})`);
    console.log(`   Role: ${superAdmin.role}`);
    console.log(`   Company ID: ${superAdmin.company_id}\n`);

    // Test permissions
    console.log('🔐 PERMISSION TESTING:');
    const hasCreateSurveys = hasFeaturePermission(superAdmin.role, 'CREATE_SURVEYS');
    console.log(`   CREATE_SURVEYS permission: ${hasCreateSurveys ? '✅ Yes' : '❌ No'}`);
    
    if (!hasCreateSurveys) {
      console.log('   ❌ This is the problem! Super admin should have CREATE_SURVEYS permission');
      
      // Check what roles have this permission
      const { ROLE_PERMISSIONS } = await import('@/lib/permissions');
      console.log(`   Roles with CREATE_SURVEYS: ${ROLE_PERMISSIONS.CREATE_SURVEYS.join(', ')}`);
      console.log(`   Super admin role: "${superAdmin.role}"`);
      console.log(`   Role type: ${typeof superAdmin.role}`);
      console.log(`   Is super admin in allowed roles: ${ROLE_PERMISSIONS.CREATE_SURVEYS.includes(superAdmin.role as any)}`);
      return;
    }

    // Find test users for email lookup
    const testUsers = await User.find({ 
      company_id: superAdmin.company_id,
      is_active: true 
    }).select('_id name email role').limit(3).lean();

    console.log(`\n👥 Test Users for Email Lookup:`);
    testUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.name} (${user.email}) - ${user.role}`);
    });

    const testEmails = testUsers.map(user => user.email);
    console.log(`\n📧 Test Emails: ${JSON.stringify(testEmails)}`);

    // Simulate the API call logic step by step
    console.log('\n🧪 SIMULATING API CALL LOGIC:\n');

    // Step 1: Email validation
    console.log('STEP 1: Email Validation');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const validEmails = testEmails.filter(email => 
      typeof email === 'string' && emailRegex.test(email.trim())
    );
    console.log(`   Input emails: ${testEmails.length}`);
    console.log(`   Valid emails: ${validEmails.length}`);
    console.log(`   Valid emails list: ${JSON.stringify(validEmails)}`);

    if (validEmails.length === 0) {
      console.log('   ❌ No valid emails - this would cause the error');
      return;
    }

    // Step 2: Build query
    console.log('\nSTEP 2: Build Database Query');
    let query: any = {
      email: { $in: validEmails.map(email => email.toLowerCase().trim()) },
      is_active: true,
    };

    // Super admin can find users across all companies
    if (superAdmin.role !== 'super_admin') {
      query.company_id = superAdmin.company_id;
    }

    console.log(`   Query: ${JSON.stringify(query, null, 2)}`);

    // Step 3: Execute query
    console.log('\nSTEP 3: Execute Database Query');
    const foundUsers = await User.find(query)
      .select('_id name email role department_id company_id')
      .lean();

    console.log(`   Users found: ${foundUsers.length}`);
    foundUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ✅ ${user.name} (${user.email}) - ID: ${user._id}`);
    });

    // Step 4: Check missing emails
    console.log('\nSTEP 4: Check Missing Emails');
    const foundEmails = foundUsers.map(user => user.email);
    const missingEmails = validEmails.filter(email => 
      !foundEmails.includes(email.toLowerCase().trim())
    );

    console.log(`   Found emails: ${foundEmails.length}`);
    console.log(`   Missing emails: ${missingEmails.length}`);
    if (missingEmails.length > 0) {
      console.log(`   Missing: ${JSON.stringify(missingEmails)}`);
    }

    // Step 5: API Response simulation
    console.log('\nSTEP 5: API Response Simulation');
    const apiResponse = {
      users: foundUsers,
      found_count: foundUsers.length,
      missing_emails: missingEmails,
      total_requested: validEmails.length,
    };

    console.log(`   Response: ${JSON.stringify(apiResponse, null, 2)}`);

    // Step 6: Survey invitations API simulation
    console.log('\nSTEP 6: Survey Invitations API Simulation');
    const userIds = foundUsers.map(user => user._id);
    console.log(`   User IDs extracted: ${JSON.stringify(userIds)}`);

    if (userIds.length === 0) {
      console.log('   ❌ No user IDs - this would cause "No users found" error in invitations API');
    } else {
      console.log('   ✅ User IDs available for invitation creation');
    }

    // Find an active survey for testing
    const activeSurvey = await Survey.findOne({ 
      company_id: superAdmin.company_id,
      status: 'active'
    }).lean();

    if (activeSurvey) {
      console.log(`\n📋 Test Survey: "${activeSurvey.title}" (${activeSurvey._id})`);
      
      // Simulate survey invitations API query
      let userQuery: any = { company_id: activeSurvey.company_id };
      if (userIds.length > 0) {
        userQuery._id = { $in: userIds };
      }
      
      console.log(`   Survey invitations query: ${JSON.stringify(userQuery, null, 2)}`);
      
      const surveyUsers = await User.find(userQuery).lean();
      console.log(`   Users found for survey invitations: ${surveyUsers.length}`);
      
      if (surveyUsers.length === 0) {
        console.log('   ❌ This would cause "No users found" error in survey invitations API');
      } else {
        console.log('   ✅ Survey invitations would be created successfully');
      }
    }

    // Summary
    console.log('\n📊 DIAGNOSIS SUMMARY:');
    console.log(`   ✅ Super admin has CREATE_SURVEYS permission: ${hasCreateSurveys}`);
    console.log(`   ✅ Email validation working: ${validEmails.length}/${testEmails.length} valid`);
    console.log(`   ✅ User lookup working: ${foundUsers.length} users found`);
    console.log(`   ✅ User IDs extraction: ${userIds.length} IDs available`);
    
    if (foundUsers.length === testEmails.length && userIds.length > 0) {
      console.log('\n🎉 CONCLUSION: Survey sharing should work correctly!');
      console.log('   The API logic is sound and should not produce "no user found" errors.');
      console.log('   The issue might be:');
      console.log('   1. Session data not matching database user data');
      console.log('   2. Frontend sending malformed email addresses');
      console.log('   3. Network/timing issues');
      console.log('   4. Different user context when called from browser');
    } else {
      console.log('\n❌ CONCLUSION: Issues found that could cause errors');
    }

    // Recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    console.log('   1. Check browser network tab for actual API request/response');
    console.log('   2. Add console.log debugging to /api/users/by-emails endpoint');
    console.log('   3. Verify session user data matches database user data');
    console.log('   4. Test with exact email addresses from the sharing modal');

    console.log('\n✅ Survey sharing API debugging completed!');

  } catch (error) {
    console.error('❌ Error debugging survey sharing API:', error);
    throw error;
  }
}

// CLI execution
if (require.main === module) {
  debugSurveySharingAPI()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Survey sharing API debug failed:', error);
      process.exit(1);
    });
}

export { debugSurveySharingAPI };
