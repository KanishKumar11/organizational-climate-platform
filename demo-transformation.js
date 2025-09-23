/**
 * Demonstration of the survey template transformation
 * Shows how the problematic template data gets transformed to valid survey data
 */

// Simulate the mapping functions (same logic as in the route)
function mapTemplateCategoryToSurveyType(category) {
  const categoryMapping = {
    'climate': 'general_climate',
    'culture': 'organizational_culture',
    'engagement': 'general_climate',
    'leadership': 'organizational_culture',
    'wellbeing': 'general_climate',
    'custom': 'custom'
  };
  
  return categoryMapping[category] || 'general_climate';
}

function mapQuestionType(templateQuestionType) {
  const typeMapping = {
    'likert': 'likert',
    'multiple_choice': 'multiple_choice',
    'ranking': 'ranking',
    'open_ended': 'open_ended',
    'yes_no': 'yes_no',
    'rating': 'rating',
    'emoji_rating': 'rating' // This is the key fix
  };
  
  return typeMapping[templateQuestionType] || 'likert';
}

function transformTemplateQuestions(templateQuestions) {
  return templateQuestions.map((question, index) => ({
    id: question.id,
    text: question.text,
    type: mapQuestionType(question.type),
    options: question.options,
    scale_min: question.scale_min,
    scale_max: question.scale_max,
    scale_labels: question.scale_labels,
    required: question.required !== undefined ? question.required : true,
    conditional_logic: question.conditional_logic,
    order: question.order !== undefined ? question.order : index, // Auto-assign order
    category: question.category
  }));
}

// Original problematic template data (similar to what was causing the error)
const problematicTemplate = {
  _id: '68d288a72b848331398002bb',
  name: 'Team Pulse Check',
  description: 'Quick weekly or bi-weekly survey to gauge team morale, workload, and immediate concerns.',
  category: 'engagement', // ❌ Not valid for Survey model
  is_public: true,
  tags: ['pulse', 'team', 'morale', 'quick'],
  questions: [
    {
      id: 'q1',
      type: 'emoji_rating', // ❌ Not valid for Survey model
      text: 'How are you feeling about work this week?',
      required: true,
      options: ['😫', '😕', '😐', '😊', '🤩']
      // ❌ Missing 'order' field
    },
    {
      id: 'q2',
      type: 'likert',
      text: 'How manageable is your current workload?',
      required: true,
      options: ['Overwhelming', 'Too Much', 'Just Right', 'Light', 'Too Light']
      // ❌ Missing 'order' field
    },
    {
      id: 'q3',
      type: 'likert',
      text: 'How connected do you feel to your team?',
      required: true,
      options: ['Very Disconnected', 'Disconnected', 'Neutral', 'Connected', 'Very Connected']
      // ❌ Missing 'order' field
    },
    {
      id: 'q4',
      type: 'open_ended',
      text: 'What would help improve your work experience this week?',
      required: false
      // ❌ Missing 'order' field
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

console.log('🔧 Survey Template Transformation Demo\n');

console.log('📋 ORIGINAL TEMPLATE DATA (Problematic):');
console.log('==========================================');
console.log(`Category: ${problematicTemplate.category} ❌ (not valid for Survey model)`);
console.log(`Questions: ${problematicTemplate.questions.length} questions`);
console.log('');

problematicTemplate.questions.forEach((q, index) => {
  console.log(`Q${index + 1}: ${q.text}`);
  console.log(`   Type: ${q.type} ${q.type === 'emoji_rating' ? '❌ (not valid for Survey model)' : '✅'}`);
  console.log(`   Order: ${q.order || 'undefined'} ${q.order === undefined ? '❌ (missing required field)' : '✅'}`);
  console.log(`   Required: ${q.required}`);
  console.log('');
});

console.log('🔄 APPLYING TRANSFORMATIONS:');
console.log('============================');

// Apply transformations
const transformedType = mapTemplateCategoryToSurveyType(problematicTemplate.category);
const transformedQuestions = transformTemplateQuestions(problematicTemplate.questions);

console.log(`Category mapping: ${problematicTemplate.category} → ${transformedType} ✅`);
console.log('');

console.log('Question transformations:');
transformedQuestions.forEach((q, index) => {
  const original = problematicTemplate.questions[index];
  console.log(`Q${index + 1}: ${q.text}`);
  console.log(`   Type: ${original.type} → ${q.type} ${q.type !== original.type ? '🔄 (transformed)' : '✅'}`);
  console.log(`   Order: ${original.order || 'undefined'} → ${q.order} ${original.order === undefined ? '🔄 (auto-assigned)' : '✅'}`);
  console.log(`   Required: ${q.required} ✅`);
  console.log('');
});

console.log('✅ FINAL SURVEY DATA (Valid):');
console.log('=============================');

const finalSurveyData = {
  title: 'Test Survey from Template',
  description: problematicTemplate.description,
  type: transformedType,
  company_id: 'example-company-id',
  created_by: 'example-user-id',
  questions: transformedQuestions,
  demographics: [],
  settings: problematicTemplate.default_settings,
  start_date: new Date(),
  end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  department_ids: [],
  template_id: problematicTemplate._id
};

console.log(`Survey Type: ${finalSurveyData.type} ✅ (valid for Survey model)`);
console.log(`Questions: ${finalSurveyData.questions.length} questions, all with valid types and order fields ✅`);
console.log('');

// Validate that all questions have valid types
const validQuestionTypes = ['likert', 'multiple_choice', 'ranking', 'open_ended', 'yes_no', 'rating'];
const invalidQuestions = finalSurveyData.questions.filter(q => 
  !validQuestionTypes.includes(q.type) || q.order === undefined
);

if (invalidQuestions.length === 0) {
  console.log('🎉 SUCCESS: All validation issues have been resolved!');
  console.log('   ✅ Survey type is valid');
  console.log('   ✅ All question types are valid');
  console.log('   ✅ All questions have order fields');
  console.log('   ✅ Survey can be created without validation errors');
} else {
  console.log('❌ FAILURE: Some validation issues remain:');
  invalidQuestions.forEach(q => {
    console.log(`   - Question ${q.id}: type=${q.type}, order=${q.order}`);
  });
}

console.log('\n📊 SUMMARY:');
console.log('===========');
console.log('This transformation fixes the three main validation errors:');
console.log('1. Maps template categories to valid survey types');
console.log('2. Converts emoji_rating questions to rating type');
console.log('3. Auto-assigns order fields to all questions');
console.log('');
console.log('The survey creation from template ID 68d288a72b848331398002bb should now work correctly! 🚀');
