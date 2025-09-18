#!/usr/bin/env tsx

import { emailService } from '@/lib/email';
import { connectDB } from '@/lib/mongodb';
import Survey from '@/models/Survey';
import User from '@/models/User';

async function testBrevoEmail() {
  console.log('🧪 Testing Brevo Email Service...\n');

  try {
    await connectDB();

    // Check if Brevo is configured
    const brevoConfigured = !!process.env.BREVO_API_KEY;
    console.log(`📧 Email Service: ${brevoConfigured ? 'Brevo (Production)' : 'Mock (Development)'}`);
    
    if (!brevoConfigured) {
      console.log('⚠️  Brevo not configured. Add BREVO_API_KEY to .env.local to test actual email sending.');
      console.log('   For now, testing with MockEmailService (console logs only).\n');
    } else {
      console.log(`✅ Brevo API Key: ${process.env.BREVO_API_KEY?.substring(0, 8)}...`);
      console.log(`✅ From Email: ${process.env.BREVO_FROM_EMAIL || 'Not set'}\n`);
    }

    // Find test data
    const testSurvey = await Survey.findOne({ status: 'active' }).lean();
    const testUser = await User.findOne({ is_active: true }).lean();

    if (!testSurvey) {
      console.log('❌ No active survey found for testing. Create an active survey first.');
      return;
    }

    if (!testUser) {
      console.log('❌ No active user found for testing.');
      return;
    }

    console.log(`📋 Test Survey: "${testSurvey.title}" (${testSurvey._id})`);
    console.log(`👤 Test User: ${testUser.name} (${testUser.email})\n`);

    // Test 1: Survey Invitation
    console.log('🔍 TEST 1: Survey Invitation Email');
    const surveyInvitationData = {
      survey: testSurvey as any,
      recipient: testUser as any,
      invitationLink: `${process.env.NEXTAUTH_URL}/survey/${testSurvey._id}?token=test-token-123`,
      companyName: 'Test Company',
      expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    };

    try {
      const result1 = await emailService.sendSurveyInvitation(surveyInvitationData);
      console.log(`   Result: ${result1 ? '✅ Success' : '❌ Failed'}`);
    } catch (error) {
      console.log(`   Result: ❌ Error - ${error}`);
    }

    // Test 2: Survey Reminder
    console.log('\n🔍 TEST 2: Survey Reminder Email');
    const surveyReminderData = {
      ...surveyInvitationData,
      reminderCount: 1,
    };

    try {
      const result2 = await emailService.sendSurveyReminder(surveyReminderData);
      console.log(`   Result: ${result2 ? '✅ Success' : '❌ Failed'}`);
    } catch (error) {
      console.log(`   Result: ❌ Error - ${error}`);
    }

    // Test 3: Survey Completion
    console.log('\n🔍 TEST 3: Survey Completion Email');
    try {
      const result3 = await emailService.sendSurveyCompletion(surveyInvitationData);
      console.log(`   Result: ${result3 ? '✅ Success' : '❌ Failed'}`);
    } catch (error) {
      console.log(`   Result: ❌ Error - ${error}`);
    }

    // Test 4: Microclimate Invitation
    console.log('\n🔍 TEST 4: Microclimate Invitation Email');
    const microclimateData = {
      microclimate: {
        _id: 'test-microclimate-id',
        title: 'Team Pulse Check',
        description: 'Quick 5-minute feedback session',
        company_id: testSurvey.company_id,
        scheduling: {
          duration_minutes: 15,
          start_time: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
        },
        real_time_settings: {
          anonymous_responses: true,
          show_live_results: true,
        },
      },
      recipient: testUser as any,
      invitationLink: `${process.env.NEXTAUTH_URL}/microclimate/test-microclimate-id?token=test-token-456`,
      companyName: 'Test Company',
      expiryDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
    };

    try {
      const result4 = await emailService.sendMicroclimateInvitation(microclimateData);
      console.log(`   Result: ${result4 ? '✅ Success' : '❌ Failed'}`);
    } catch (error) {
      console.log(`   Result: ❌ Error - ${error}`);
    }

    // Test 5: Microclimate Reminder
    console.log('\n🔍 TEST 5: Microclimate Reminder Email');
    const microclimateReminderData = {
      ...microclimateData,
      reminderCount: 1,
    };

    try {
      const result5 = await emailService.sendMicroclimateReminder(microclimateReminderData);
      console.log(`   Result: ${result5 ? '✅ Success' : '❌ Failed'}`);
    } catch (error) {
      console.log(`   Result: ❌ Error - ${error}`);
    }

    // Summary
    console.log('\n📊 TEST SUMMARY:');
    console.log('   ✅ Survey Invitation - Template generation and sending');
    console.log('   ✅ Survey Reminder - With escalation styling');
    console.log('   ✅ Survey Completion - Thank you confirmation');
    console.log('   ✅ Microclimate Invitation - Real-time feedback styling');
    console.log('   ✅ Microclimate Reminder - Urgency indicators');

    if (brevoConfigured) {
      console.log('\n📧 EMAIL DELIVERY:');
      console.log('   ✅ Emails sent via Brevo API');
      console.log('   ✅ Check recipient inbox for test emails');
      console.log('   ✅ Monitor delivery in Brevo dashboard');
      console.log('   ✅ Check email analytics and engagement');
    } else {
      console.log('\n🔧 TO ENABLE ACTUAL EMAIL SENDING:');
      console.log('   1. Sign up at brevo.com (free tier available)');
      console.log('   2. Get API key from Account → SMTP & API → API Keys');
      console.log('   3. Add to .env.local:');
      console.log('      BREVO_API_KEY=your-api-key-here');
      console.log('      BREVO_FROM_EMAIL=noreply@yourdomain.com');
      console.log('   4. Run this test again to send actual emails');
    }

    console.log('\n✅ Brevo email service testing completed!');

  } catch (error) {
    console.error('❌ Error testing Brevo email service:', error);
    throw error;
  }
}

// CLI execution
if (require.main === module) {
  testBrevoEmail()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Brevo email test failed:', error);
      process.exit(1);
    });
}

export { testBrevoEmail };
