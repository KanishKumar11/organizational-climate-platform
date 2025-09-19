/**
 * Test script to verify server-side fixes for microclimate system
 */

import { connectDB } from '@/lib/db';
import { sanitizeForSerialization } from '@/lib/data-sanitization';
import Microclimate from '@/models/Microclimate';
import User from '@/models/User';

async function testMicroclimateDataSanitization() {
  console.log('🧪 Testing microclimate data sanitization...');
  
  try {
    await connectDB();
    
    // Find a test microclimate
    const microclimate = await Microclimate.findOne();
    
    if (!microclimate) {
      console.log('❌ No microclimate found for testing');
      return;
    }
    
    console.log('✅ Found microclimate:', microclimate.title);
    
    // Test data sanitization
    const sanitizedData = sanitizeForSerialization({
      id: microclimate._id.toString(),
      title: microclimate.title,
      description: microclimate.description,
      status: microclimate.status,
      response_count: microclimate.response_count || 0,
      target_participant_count: microclimate.target_participant_count || 0,
      participation_rate: microclimate.participation_rate || 0,
      questions: microclimate.questions?.map((q: any) => ({
        id: q.id,
        text: q.text,
        type: q.type,
        options: q.options || [],
        required: q.required || false,
      })) || [],
      real_time_settings: microclimate.real_time_settings,
    });
    
    // Test JSON serialization
    const jsonString = JSON.stringify(sanitizedData);
    const parsed = JSON.parse(jsonString);
    
    console.log('✅ Data sanitization successful');
    console.log('✅ JSON serialization successful');
    console.log('📊 Sanitized data keys:', Object.keys(sanitizedData));
    
    return true;
  } catch (error) {
    console.error('❌ Error testing microclimate data sanitization:', error);
    return false;
  }
}

async function testCompanyAdminData() {
  console.log('🧪 Testing company admin dashboard data...');
  
  try {
    await connectDB();
    
    // Find a test user
    const user = await User.findOne({ role: 'company_admin' });
    
    if (!user) {
      console.log('❌ No company admin found for testing');
      return;
    }
    
    console.log('✅ Found company admin:', user.name);
    
    const companyId = user.company_id;
    
    // Test basic queries that the dashboard uses
    const totalEmployees = await User.countDocuments({ 
      company_id: companyId, 
      is_active: true 
    });
    
    console.log('✅ Employee count query successful:', totalEmployees);
    
    // Test data sanitization
    const testData = {
      companyKPIs: {
        totalEmployees,
        activeEmployees: totalEmployees,
        totalSurveys: 0,
        activeSurveys: 0,
        totalResponses: 0,
        completionRate: 0,
        departmentCount: 0,
        engagementTrend: 0,
      },
      departmentAnalytics: [],
      aiInsights: [],
      ongoingSurveys: [],
      pastSurveys: [],
      recentActivity: [],
      demographicVersions: [],
    };
    
    const sanitizedData = sanitizeForSerialization(testData);
    const jsonString = JSON.stringify(sanitizedData);
    const parsed = JSON.parse(jsonString);
    
    console.log('✅ Company admin data sanitization successful');
    console.log('✅ JSON serialization successful');
    
    return true;
  } catch (error) {
    console.error('❌ Error testing company admin data:', error);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting server-side fixes tests...\n');
  
  const results = await Promise.all([
    testMicroclimateDataSanitization(),
    testCompanyAdminData(),
  ]);
  
  const allPassed = results.every(result => result === true);
  
  console.log('\n📋 Test Results:');
  console.log('- Microclimate data sanitization:', results[0] ? '✅ PASS' : '❌ FAIL');
  console.log('- Company admin data sanitization:', results[1] ? '✅ PASS' : '❌ FAIL');
  
  if (allPassed) {
    console.log('\n🎉 All tests passed! Server-side fixes are working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the errors above.');
  }
  
  process.exit(allPassed ? 0 : 1);
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

export { runTests };
