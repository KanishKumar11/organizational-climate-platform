#!/usr/bin/env tsx

import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import { getServerSession } from 'next-auth';

async function debugUserLookup() {
  console.log('🔍 Debugging User Lookup Issue...\n');

  try {
    await connectDB();

    // Find super admin user for testing
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
    console.log(`   Company ID: ${superAdmin.company_id}`);
    console.log(`   Role: ${superAdmin.role}\n`);

    // Get all users in the same company
    const companyUsers = await User.find({ 
      company_id: superAdmin.company_id,
      is_active: true 
    }).select('_id name email role department_id company_id').lean();

    console.log(`👥 Users in Company (${superAdmin.company_id}):`);
    console.log(`   Total active users: ${companyUsers.length}\n`);

    // Show first 10 users with their exact email addresses
    const testUsers = companyUsers.slice(0, 10);
    console.log('📧 Sample User Email Addresses:');
    testUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. "${user.email}" - ${user.name} (${user.role})`);
      console.log(`      ID: ${user._id}`);
      console.log(`      Company ID: ${user.company_id}`);
    });

    // Test email lookup scenarios
    console.log('\n🧪 Testing Email Lookup Scenarios:\n');

    // Test 1: Exact email match
    const testEmail = testUsers[0].email;
    console.log(`TEST 1: Exact email match for "${testEmail}"`);
    
    const exactQuery = {
      email: testEmail,
      is_active: true,
      company_id: superAdmin.company_id
    };
    
    const exactResult = await User.find(exactQuery).lean();
    console.log(`   Query: ${JSON.stringify(exactQuery)}`);
    console.log(`   Result: ${exactResult.length} users found`);
    if (exactResult.length > 0) {
      console.log(`   ✅ Found: ${exactResult[0].name} (${exactResult[0].email})`);
    } else {
      console.log(`   ❌ No users found`);
    }

    // Test 2: Case insensitive lookup
    console.log(`\nTEST 2: Case insensitive lookup for "${testEmail.toUpperCase()}"`);
    
    const caseQuery = {
      email: { $in: [testEmail.toLowerCase()] },
      is_active: true,
      company_id: superAdmin.company_id
    };
    
    const caseResult = await User.find(caseQuery).lean();
    console.log(`   Query: ${JSON.stringify(caseQuery)}`);
    console.log(`   Result: ${caseResult.length} users found`);
    if (caseResult.length > 0) {
      console.log(`   ✅ Found: ${caseResult[0].name} (${caseResult[0].email})`);
    } else {
      console.log(`   ❌ No users found`);
    }

    // Test 3: Multiple email lookup (simulating the API)
    const testEmails = testUsers.slice(0, 3).map(user => user.email);
    console.log(`\nTEST 3: Multiple email lookup`);
    console.log(`   Emails: ${JSON.stringify(testEmails)}`);
    
    const multiQuery = {
      email: { $in: testEmails.map(email => email.toLowerCase().trim()) },
      is_active: true,
      company_id: superAdmin.company_id
    };
    
    const multiResult = await User.find(multiQuery).lean();
    console.log(`   Query: ${JSON.stringify(multiQuery)}`);
    console.log(`   Result: ${multiResult.length} users found`);
    multiResult.forEach((user, index) => {
      console.log(`   ${index + 1}. ✅ Found: ${user.name} (${user.email})`);
    });

    // Test 4: Super admin cross-company lookup
    console.log(`\nTEST 4: Super admin cross-company lookup (no company filter)`);
    
    const superAdminQuery = {
      email: { $in: testEmails.map(email => email.toLowerCase().trim()) },
      is_active: true
      // No company_id filter for super admin
    };
    
    const superAdminResult = await User.find(superAdminQuery).lean();
    console.log(`   Query: ${JSON.stringify(superAdminQuery)}`);
    console.log(`   Result: ${superAdminResult.length} users found`);
    superAdminResult.forEach((user, index) => {
      console.log(`   ${index + 1}. ✅ Found: ${user.name} (${user.email}) - Company: ${user.company_id}`);
    });

    // Test 5: Email validation
    console.log(`\nTEST 5: Email validation`);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    testEmails.forEach((email, index) => {
      const isValid = emailRegex.test(email.trim());
      console.log(`   ${index + 1}. "${email}" - ${isValid ? '✅ Valid' : '❌ Invalid'}`);
    });

    // Test 6: Simulate the exact API call
    console.log(`\nTEST 6: Simulating API call logic`);
    const apiEmails = testEmails;
    console.log(`   Input emails: ${JSON.stringify(apiEmails)}`);
    
    // Validate email format (from API)
    const validEmails = apiEmails.filter(email => 
      typeof email === 'string' && emailRegex.test(email.trim())
    );
    console.log(`   Valid emails: ${JSON.stringify(validEmails)}`);
    
    // Build query (from API)
    let apiQuery: any = {
      email: { $in: validEmails.map(email => email.toLowerCase().trim()) },
      is_active: true,
    };
    
    // Super admin can find users across all companies
    if (superAdmin.role !== 'super_admin') {
      apiQuery.company_id = superAdmin.company_id;
    }
    
    console.log(`   Final query: ${JSON.stringify(apiQuery)}`);
    
    const apiResult = await User.find(apiQuery)
      .select('_id name email role department_id company_id')
      .lean();
    
    console.log(`   API Result: ${apiResult.length} users found`);
    apiResult.forEach((user, index) => {
      console.log(`   ${index + 1}. ✅ ${user.name} (${user.email}) - ID: ${user._id}`);
    });
    
    // Check missing emails
    const foundEmails = apiResult.map(user => user.email);
    const missingEmails = validEmails.filter(email => 
      !foundEmails.includes(email.toLowerCase().trim())
    );
    
    if (missingEmails.length > 0) {
      console.log(`   ❌ Missing emails: ${JSON.stringify(missingEmails)}`);
    } else {
      console.log(`   ✅ All emails found successfully`);
    }

    // Summary
    console.log('\n📊 DIAGNOSIS SUMMARY:');
    console.log(`   • Total users in company: ${companyUsers.length}`);
    console.log(`   • Test emails used: ${testEmails.length}`);
    console.log(`   • Users found by API logic: ${apiResult.length}`);
    console.log(`   • Missing emails: ${missingEmails.length}`);
    
    if (apiResult.length === testEmails.length) {
      console.log('   ✅ User lookup should work correctly');
    } else {
      console.log('   ❌ User lookup has issues - investigating...');
      
      // Additional debugging
      console.log('\n🔧 ADDITIONAL DEBUGGING:');
      
      // Check if emails are stored differently
      console.log('   Checking email storage format:');
      testUsers.slice(0, 3).forEach((user, index) => {
        console.log(`   ${index + 1}. Stored: "${user.email}" (length: ${user.email.length})`);
        console.log(`      Trimmed: "${user.email.trim()}" (length: ${user.email.trim().length})`);
        console.log(`      Lowercase: "${user.email.toLowerCase()}"`);
      });
    }

    console.log('\n✅ User lookup debugging completed!');

  } catch (error) {
    console.error('❌ Error debugging user lookup:', error);
    throw error;
  }
}

// CLI execution
if (require.main === module) {
  debugUserLookup()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('User lookup debug failed:', error);
      process.exit(1);
    });
}

export { debugUserLookup };
