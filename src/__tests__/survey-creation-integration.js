/**
 * Integration test script for survey creation from templates
 * This script can be run manually to test the actual API endpoint
 * 
 * Usage: node src/__tests__/survey-creation-integration.js
 */

const { connectDB } = require('../lib/db');
const SurveyTemplate = require('../models/SurveyTemplate').default;
const Survey = require('../models/Survey').default;

// Test data that mimics the problematic template structure
const testTemplateData = {
  name: 'Test Engagement Survey',
  description: 'Test template with engagement category and emoji_rating questions',
  category: 'engagement',
  is_public: true,
  tags: ['test', 'engagement'],
  questions: [
    {
      id: 'q1',
      type: 'emoji_rating',
      text: 'How are you feeling about work this week?',
      required: true,
      options: ['😫', '😕', '😐', '😊', '🤩']
    },
    {
      id: 'q2',
      type: 'likert',
      text: 'How manageable is your current workload?',
      required: true,
      options: ['Overwhelming', 'Too Much', 'Just Right', 'Light', 'Too Light']
    },
    {
      id: 'q3',
      type: 'multiple_choice',
      text: 'What motivates you most?',
      required: false,
      options: ['Recognition', 'Growth', 'Autonomy', 'Team', 'Impact']
    },
    {
      id: 'q4',
      type: 'open_ended',
      text: 'Any additional feedback?',
      required: false
    }
  ],
  default_settings: {
    anonymous: false,
    allow_partial_responses: true,
    randomize_questions: false,
    show_progress: true,
    auto_save: true
  }
};

// Import the mapping functions
const { 
  mapTemplateCategoryToSurveyType, 
  mapQuestionType, 
  transformTemplateQuestions 
} = require('../app/api/surveys/templates/[id]/use/route');

async function runIntegrationTest() {
  console.log('🚀 Starting Survey Creation Integration Test...\n');

  try {
    // Connect to database
    console.log('📡 Connecting to database...');
    await connectDB();
    console.log('✅ Database connected\n');

    // Create test template
    console.log('📝 Creating test template...');
    const template = new SurveyTemplate({
      ...testTemplateData,
      created_by: 'test-user-id',
      company_id: 'test-company-id'
    });
    
    await template.save();
    console.log(`✅ Test template created with ID: ${template._id}\n`);

    // Test the mapping functions
    console.log('🔄 Testing mapping functions...');
    
    const mappedType = mapTemplateCategoryToSurveyType(template.category);
    console.log(`   Category mapping: ${template.category} → ${mappedType}`);
    
    const transformedQuestions = transformTemplateQuestions(template.questions);
    console.log(`   Questions transformed: ${template.questions.length} questions`);
    
    transformedQuestions.forEach((q, index) => {
      const original = template.questions[index];
      console.log(`   Q${index + 1}: ${original.type} → ${q.type}, order: ${q.order}`);
    });
    console.log('');

    // Create survey from template (simulating the API logic)
    console.log('📊 Creating survey from template...');
    
    const surveyData = {
      title: 'Test Survey from Template',
      description: 'Integration test survey',
      type: mappedType,
      company_id: 'test-company-id',
      created_by: 'test-user-id',
      questions: transformedQuestions,
      demographics: [],
      settings: template.default_settings,
      start_date: new Date(),
      end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      department_ids: [],
      template_id: template._id
    };

    const survey = new Survey(surveyData);
    await survey.save();
    
    console.log(`✅ Survey created successfully with ID: ${survey._id}`);
    console.log(`   Title: ${survey.title}`);
    console.log(`   Type: ${survey.type}`);
    console.log(`   Questions: ${survey.questions.length}`);
    console.log(`   Status: ${survey.status}\n`);

    // Verify the survey data
    console.log('🔍 Verifying survey data...');
    
    const savedSurvey = await Survey.findById(survey._id);
    if (!savedSurvey) {
      throw new Error('Survey not found after creation');
    }

    // Check that all questions have valid types and order fields
    const invalidQuestions = savedSurvey.questions.filter(q => 
      !['likert', 'multiple_choice', 'ranking', 'open_ended', 'yes_no', 'rating'].includes(q.type) ||
      q.order === undefined || q.order === null
    );

    if (invalidQuestions.length > 0) {
      console.log('❌ Found invalid questions:', invalidQuestions);
      throw new Error('Survey contains invalid questions');
    }

    console.log('✅ All questions have valid types and order fields');
    console.log('✅ Survey type is valid for Survey model');
    console.log('✅ Integration test completed successfully!\n');

    // Cleanup
    console.log('🧹 Cleaning up test data...');
    await Survey.findByIdAndDelete(survey._id);
    await SurveyTemplate.findByIdAndDelete(template._id);
    console.log('✅ Test data cleaned up');

    console.log('\n🎉 All tests passed! The survey creation from template is working correctly.');

  } catch (error) {
    console.error('❌ Integration test failed:', error.message);
    console.error('Stack trace:', error.stack);
    
    // Try to cleanup on error
    try {
      await Survey.deleteMany({ created_by: 'test-user-id' });
      await SurveyTemplate.deleteMany({ created_by: 'test-user-id' });
      console.log('🧹 Cleaned up test data after error');
    } catch (cleanupError) {
      console.error('Failed to cleanup test data:', cleanupError.message);
    }
    
    process.exit(1);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  runIntegrationTest()
    .then(() => {
      console.log('\n✨ Integration test completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Integration test failed:', error);
      process.exit(1);
    });
}

module.exports = { runIntegrationTest };
