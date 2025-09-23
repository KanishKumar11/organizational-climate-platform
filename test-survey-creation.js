/**
 * Manual test script for survey creation from templates
 * This script tests the actual API endpoint
 * 
 * Prerequisites:
 * 1. Server must be running
 * 2. You need a valid session/authentication
 * 3. A template with ID matching the one in the script must exist
 * 
 * Usage: node test-survey-creation.js
 */

const https = require('https');
const http = require('http');

// Configuration
const config = {
  host: 'localhost',
  port: 3000,
  protocol: 'http', // Change to 'https' if using HTTPS
  templateId: '68d288a72b848331398002bb', // Replace with actual template ID
  // You'll need to get these from your browser's dev tools or authentication system
  sessionCookie: 'your-session-cookie-here',
  csrfToken: 'your-csrf-token-here'
};

// Test data for creating survey from template
const testSurveyData = {
  title: 'Test Survey from Template',
  description: 'Testing the fixed survey creation endpoint',
  start_date: new Date().toISOString(),
  end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
  department_ids: [],
  customizations: {
    settings: {
      anonymous: true
    }
  }
};

function makeRequest(options, data) {
  return new Promise((resolve, reject) => {
    const client = options.protocol === 'https' ? https : http;
    
    const req = client.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(responseData);
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: parsedData
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: responseData
          });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testSurveyCreation() {
  console.log('🚀 Testing Survey Creation from Template...\n');
  
  try {
    // First, let's try to get the template to see its structure
    console.log(`📋 Fetching template ${config.templateId}...`);
    
    const getTemplateOptions = {
      hostname: config.host,
      port: config.port,
      path: `/api/surveys/templates/${config.templateId}`,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': config.sessionCookie
      }
    };
    
    const templateResponse = await makeRequest(getTemplateOptions);
    
    if (templateResponse.statusCode !== 200) {
      console.log('❌ Failed to fetch template:');
      console.log(`   Status: ${templateResponse.statusCode}`);
      console.log(`   Response:`, templateResponse.data);
      
      if (templateResponse.statusCode === 401) {
        console.log('\n💡 Tip: You need to set a valid session cookie in the config');
        console.log('   1. Open your browser and log into the application');
        console.log('   2. Open Developer Tools > Application > Cookies');
        console.log('   3. Copy the session cookie value');
        console.log('   4. Update the sessionCookie in this script');
      }
      
      return;
    }
    
    console.log('✅ Template fetched successfully');
    console.log(`   Name: ${templateResponse.data.template?.name || 'Unknown'}`);
    console.log(`   Category: ${templateResponse.data.template?.category || 'Unknown'}`);
    console.log(`   Questions: ${templateResponse.data.template?.questions?.length || 0}\n`);
    
    // Now test creating a survey from the template
    console.log('📊 Creating survey from template...');
    
    const createSurveyOptions = {
      hostname: config.host,
      port: config.port,
      path: `/api/surveys/templates/${config.templateId}/use`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': config.sessionCookie
      }
    };
    
    const surveyResponse = await makeRequest(createSurveyOptions, testSurveyData);
    
    console.log(`📈 Survey creation response:`);
    console.log(`   Status: ${surveyResponse.statusCode}`);
    
    if (surveyResponse.statusCode === 201) {
      console.log('✅ Survey created successfully!');
      console.log(`   Survey ID: ${surveyResponse.data.survey?.id}`);
      console.log(`   Title: ${surveyResponse.data.survey?.title}`);
      console.log(`   Type: ${surveyResponse.data.survey?.type}`);
      console.log(`   Status: ${surveyResponse.data.survey?.status}`);
      console.log('\n🎉 Test completed successfully! The validation fixes are working.');
    } else {
      console.log('❌ Survey creation failed:');
      console.log('   Response:', JSON.stringify(surveyResponse.data, null, 2));
      
      if (surveyResponse.statusCode === 400 && surveyResponse.data.validationErrors) {
        console.log('\n🔍 Validation errors found:');
        Object.entries(surveyResponse.data.validationErrors).forEach(([field, error]) => {
          console.log(`   ${field}: ${error.message || error}`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Instructions for manual testing
function printInstructions() {
  console.log('📋 Manual Testing Instructions:');
  console.log('');
  console.log('1. Make sure your development server is running:');
  console.log('   npm run dev');
  console.log('');
  console.log('2. Get authentication credentials:');
  console.log('   - Open your browser and navigate to your app');
  console.log('   - Log in with valid credentials');
  console.log('   - Open Developer Tools > Application > Cookies');
  console.log('   - Copy the session cookie value');
  console.log('');
  console.log('3. Update this script:');
  console.log('   - Set the correct templateId (find one from /api/surveys/templates)');
  console.log('   - Set the sessionCookie from step 2');
  console.log('');
  console.log('4. Run this script:');
  console.log('   node test-survey-creation.js');
  console.log('');
  console.log('Current configuration:');
  console.log(`   Server: ${config.protocol}://${config.host}:${config.port}`);
  console.log(`   Template ID: ${config.templateId}`);
  console.log(`   Session Cookie: ${config.sessionCookie.substring(0, 20)}...`);
  console.log('');
}

// Check if we have the required configuration
if (config.sessionCookie === 'your-session-cookie-here') {
  printInstructions();
  console.log('⚠️  Please update the configuration before running the test.');
} else {
  testSurveyCreation();
}
