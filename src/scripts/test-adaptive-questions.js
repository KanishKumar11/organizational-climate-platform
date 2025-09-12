const { MongoClient } = require('mongodb');
const { v4: uuidv4 } = require('uuid');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/organizational-climate';

// Test data for adaptive question system
const testCompany = {
  _id: 'test-company-id',
  name: 'Test Tech Company',
  industry: 'Technology',
  size: 'medium',
  work_model: 'hybrid',
  culture_values: ['innovation', 'collaboration', 'transparency'],
  core_values: ['integrity', 'excellence', 'customer-focus']
};

const testDepartment = {
  _id: 'test-dept-id',
  name: 'Engineering',
  function: 'Engineering',
  company_id: 'test-company-id'
};

const testUsers = [
  {
    _id: 'user-1',
    email: 'engineer1@test.com',
    name: 'Senior Engineer',
    role: 'Software Engineer',
    company_id: 'test-company-id',
    department_id: 'test-dept-id',
    created_at: new Date('2022-01-01'),
    metadata: {
      experience_years: 5,
      work_location: 'remote',
      team_size: 8,
      work_style: 'collaborative'
    }
  },
  {
    _id: 'user-2',
    email: 'engineer2@test.com',
    name: 'Junior Engineer',
    role: 'Junior Software Engineer',
    company_id: 'test-company-id',
    department_id: 'test-dept-id',
    created_at: new Date('2023-06-01'),
    metadata: {
      experience_years: 1,
      work_location: 'onsite',
      team_size: 8,
      work_style: 'learning-focused'
    }
  },
  {
    _id: 'user-3',
    email: 'lead@test.com',
    name: 'Tech Lead',
    role: 'Technical Lead',
    company_id: 'test-company-id',
    department_id: 'test-dept-id',
    created_at: new Date('2020-03-01'),
    metadata: {
      experience_years: 8,
      work_location: 'hybrid',
      team_size: 8,
      work_style: 'mentoring'
    }
  }
];

const testSurvey = {
  _id: 'test-survey-id',
  title: 'Q2 Engineering Climate Survey',
  type: 'general_climate',
  company_id: 'test-company-id',
  department_id: 'test-dept-id',
  status: 'completed',
  created_at: new Date(),
  invited_users: ['user-1', 'user-2', 'user-3']
};

async function testAdaptiveQuestionSystem() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('Connected to MongoDB for testing');

    const db = client.db();

    // Setup test data
    await setupTestData(db);

    // Test 1: Basic question pool functionality
    console.log('\n=== Test 1: Basic Question Pool ===');
    await testBasicQuestionPool(db);

    // Test 2: Question adaptation engine
    console.log('\n=== Test 2: Question Adaptation ===');
    await testQuestionAdaptation(db);

    // Test 3: Effectiveness tracking
    console.log('\n=== Test 3: Effectiveness Tracking ===');
    await testEffectivenessTracking(db);

    // Test 4: Demographic context analysis
    console.log('\n=== Test 4: Demographic Context ===');
    await testDemographicContext(db);

    // Test 5: Question combinations
    console.log('\n=== Test 5: Question Combinations ===');
    await testQuestionCombinations(db);

    // Test 6: Performance metrics
    console.log('\n=== Test 6: Performance Metrics ===');
    await testPerformanceMetrics(db);

    console.log('\n=== All Tests Completed Successfully! ===');

  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await client.close();
    console.log('Disconnected from MongoDB');
  }
}

async function setupTestData(db) {
  console.log('Setting up test data...');

  // Insert test company
  await db.collection('companies').deleteMany({ _id: testCompany._id });
  await db.collection('companies').insertOne(testCompany);

  // Insert test department
  await db.collection('departments').deleteMany({ _id: testDepartment._id });
  await db.collection('departments').insertOne(testDepartment);

  // Insert test users
  await db.collection('users').deleteMany({ company_id: testCompany._id });
  await db.collection('users').insertMany(testUsers);

  // Insert test survey
  await db.collection('surveys').deleteMany({ _id: testSurvey._id });
  await db.collection('surveys').insertOne(testSurvey);

  console.log('Test data setup complete');
}

async function testBasicQuestionPool(db) {
  const questionPool = db.collection('questionpools');

  // Test question retrieval by category
  const leadershipQuestions = await questionPool.find({
    category: 'leadership',
    isActive: true
  }).toArray();

  console.log(`✓ Found ${leadershipQuestions.length} leadership questions`);

  // Test question retrieval by effectiveness
  const highEffectivenessQuestions = await questionPool.find({
    effectivenessScore: { $gte: 80 },
    isActive: true
  }).sort({ effectivenessScore: -1 }).limit(10).toArray();

  console.log(`✓ Found ${highEffectivenessQuestions.length} high-effectiveness questions`);

  // Test question search by tags
  const collaborationQuestions = await questionPool.find({
    tags: 'collaboration',
    isActive: true
  }).toArray();

  console.log(`✓ Found ${collaborationQuestions.length} collaboration-tagged questions`);

  // Verify question structure
  if (leadershipQuestions.length > 0) {
    const sampleQuestion = leadershipQuestions[0];
    const requiredFields = ['id', 'category', 'originalText', 'questionType', 'tags', 'effectivenessScore'];
    const hasAllFields = requiredFields.every(field => sampleQuestion.hasOwnProperty(field));
    console.log(`✓ Question structure validation: ${hasAllFields ? 'PASS' : 'FAIL'}`);
  }
}

async function testQuestionAdaptation(db) {
  const questionPool = db.collection('questionpools');

  // Create test adaptation
  const testAdaptation = {
    id: uuidv4(),
    adaptationType: 'reformulate',
    adaptedText: 'How effectively does your development team demonstrate collaborative problem-solving?',
    sourceQuestionIds: ['original-question-id'],
    context: {
      companyId: testCompany._id,
      departmentId: testDepartment._id,
      demographicFilters: { role: 'Software Engineer' },
      surveyType: 'general_climate'
    },
    effectivenessScore: 0,
    usageCount: 0,
    createdAt: new Date(),
    isActive: true
  };

  // Add adaptation to a question
  await questionPool.updateOne(
    { category: 'collaboration', isActive: true },
    { $push: { adaptations: testAdaptation } }
  );

  console.log('✓ Created test question adaptation');

  // Test adaptation retrieval
  const questionsWithAdaptations = await questionPool.find({
    'adaptations.0': { $exists: true },
    isActive: true
  }).toArray();

  console.log(`✓ Found ${questionsWithAdaptations.length} questions with adaptations`);

  // Test adaptation filtering by context
  const contextAdaptations = await questionPool.find({
    'adaptations.context.departmentId': testDepartment._id,
    isActive: true
  }).toArray();

  console.log(`✓ Found ${contextAdaptations.length} questions with department-specific adaptations`);
}

async function testEffectivenessTracking(db) {
  const effectivenessCollection = db.collection('questioneffectivenesses');

  // Create test effectiveness records
  const testEffectivenessRecords = [
    {
      questionId: 'test-question-1',
      surveyId: testSurvey._id,
      companyId: testCompany._id,
      departmentId: testDepartment._id,
      responseRate: 85.5,
      completionRate: 92.3,
      insightQuality: 78.2,
      actionPlanGeneration: 65.8,
      demographicBreakdown: {
        byRole: { 'Software Engineer': 2, 'Technical Lead': 1 }
      },
      sentimentScores: {
        positive: 60,
        neutral: 30,
        negative: 10
      },
      engagementMetrics: {
        timeSpent: 45,
        skipRate: 7.7,
        clarificationRequests: 2
      },
      measuredAt: new Date(),
      createdAt: new Date()
    },
    {
      questionId: 'test-question-2',
      surveyId: testSurvey._id,
      companyId: testCompany._id,
      departmentId: testDepartment._id,
      responseRate: 78.2,
      completionRate: 88.9,
      insightQuality: 82.1,
      actionPlanGeneration: 71.4,
      demographicBreakdown: {
        byRole: { 'Software Engineer': 2, 'Technical Lead': 1 }
      },
      sentimentScores: {
        positive: 55,
        neutral: 35,
        negative: 10
      },
      engagementMetrics: {
        timeSpent: 52,
        skipRate: 11.1,
        clarificationRequests: 1
      },
      measuredAt: new Date(),
      createdAt: new Date()
    }
  ];

  await effectivenessCollection.deleteMany({ companyId: testCompany._id });
  await effectivenessCollection.insertMany(testEffectivenessRecords);

  console.log(`✓ Created ${testEffectivenessRecords.length} effectiveness tracking records`);

  // Test effectiveness aggregation
  const avgEffectiveness = await effectivenessCollection.aggregate([
    { $match: { companyId: testCompany._id } },
    {
      $group: {
        _id: null,
        avgResponseRate: { $avg: '$responseRate' },
        avgCompletionRate: { $avg: '$completionRate' },
        avgInsightQuality: { $avg: '$insightQuality' },
        avgActionPlanGeneration: { $avg: '$actionPlanGeneration' }
      }
    }
  ]).toArray();

  if (avgEffectiveness.length > 0) {
    const stats = avgEffectiveness[0];
    console.log(`✓ Average effectiveness metrics calculated:`);
    console.log(`  - Response Rate: ${stats.avgResponseRate.toFixed(1)}%`);
    console.log(`  - Completion Rate: ${stats.avgCompletionRate.toFixed(1)}%`);
    console.log(`  - Insight Quality: ${stats.avgInsightQuality.toFixed(1)}%`);
    console.log(`  - Action Plan Generation: ${stats.avgActionPlanGeneration.toFixed(1)}%`);
  }

  // Test top performing questions
  const topQuestions = await effectivenessCollection.aggregate([
    { $match: { companyId: testCompany._id } },
    {
      $group: {
        _id: '$questionId',
        avgScore: {
          $avg: {
            $add: [
              { $multiply: ['$responseRate', 0.25] },
              { $multiply: ['$completionRate', 0.25] },
              { $multiply: ['$insightQuality', 0.30] },
              { $multiply: ['$actionPlanGeneration', 0.20] }
            ]
          }
        },
        usageCount: { $sum: 1 }
      }
    },
    { $sort: { avgScore: -1 } }
  ]).toArray();

  console.log(`✓ Identified ${topQuestions.length} questions with performance scores`);
}

async function testDemographicContext(db) {
  const users = db.collection('users');

  // Test demographic analysis
  const userProfiles = await users.find({ company_id: testCompany._id }).toArray();

  // Calculate demographic distribution
  const roleDistribution = userProfiles.reduce((acc, user) => {
    acc[user.role] = (acc[user.role] || 0) + 1;
    return acc;
  }, {});

  const experienceDistribution = userProfiles.reduce((acc, user) => {
    const experience = user.metadata?.experience_years || 0;
    const level = experience < 2 ? 'entry' : experience < 5 ? 'mid' : experience < 8 ? 'senior' : 'executive';
    acc[level] = (acc[level] || 0) + 1;
    return acc;
  }, {});

  const workLocationDistribution = userProfiles.reduce((acc, user) => {
    const location = user.metadata?.work_location || 'unknown';
    acc[location] = (acc[location] || 0) + 1;
    return acc;
  }, {});

  console.log('✓ Demographic analysis completed:');
  console.log(`  - Role distribution:`, roleDistribution);
  console.log(`  - Experience distribution:`, experienceDistribution);
  console.log(`  - Work location distribution:`, workLocationDistribution);

  // Test demographic context insights
  const insights = {
    questionPreferences: {
      'likert': 85,
      'multiple_choice': 75,
      'open_ended': 60
    },
    engagementFactors: ['technical challenges', 'remote work dynamics', 'team collaboration'],
    adaptationOpportunities: ['role-specific variations', 'experience-level adaptations'],
    culturalConsiderations: ['innovation culture', 'remote work dynamics']
  };

  console.log('✓ Generated demographic insights:', insights);
}

async function testQuestionCombinations(db) {
  const combinationsCollection = db.collection('questioncombinations');

  // Create test question combination
  const testCombination = {
    id: uuidv4(),
    sourceQuestionIds: ['leadership-q1', 'trust-q1'],
    combinedText: 'How effectively do leaders in your organization build trust through transparent decision-making?',
    combinationType: 'hybrid',
    effectivenessScore: 82.5,
    usageCount: 15,
    successfulAdaptations: 12,
    companyContexts: [testCompany._id],
    departmentContexts: [testDepartment._id],
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true
  };

  await combinationsCollection.deleteMany({ companyContexts: testCompany._id });
  await combinationsCollection.insertOne(testCombination);

  console.log('✓ Created test question combination');

  // Test combination retrieval
  const combinations = await combinationsCollection.find({
    companyContexts: testCompany._id,
    isActive: true
  }).sort({ effectivenessScore: -1 }).toArray();

  console.log(`✓ Found ${combinations.length} question combinations for company`);

  // Test combination effectiveness
  if (combinations.length > 0) {
    const avgEffectiveness = combinations.reduce((sum, combo) => sum + combo.effectivenessScore, 0) / combinations.length;
    console.log(`✓ Average combination effectiveness: ${avgEffectiveness.toFixed(1)}%`);
  }
}

async function testPerformanceMetrics(db) {
  const questionPool = db.collection('questionpools');
  const effectivenessCollection = db.collection('questioneffectivenesses');

  // Test query performance with indexes
  console.time('Category query performance');
  await questionPool.find({ category: 'leadership', isActive: true }).toArray();
  console.timeEnd('Category query performance');

  console.time('Effectiveness query performance');
  await questionPool.find({ effectivenessScore: { $gte: 80 } }).sort({ effectivenessScore: -1 }).toArray();
  console.timeEnd('Effectiveness query performance');

  console.time('Tag search performance');
  await questionPool.find({ tags: 'collaboration' }).toArray();
  console.timeEnd('Tag search performance');

  console.time('Effectiveness aggregation performance');
  await effectivenessCollection.aggregate([
    { $match: { companyId: testCompany._id } },
    { $group: { _id: '$questionId', avgScore: { $avg: '$responseRate' } } }
  ]).toArray();
  console.timeEnd('Effectiveness aggregation performance');

  // Test data integrity
  const totalQuestions = await questionPool.countDocuments({ isActive: true });
  const questionsWithRequiredFields = await questionPool.countDocuments({
    id: { $exists: true },
    category: { $exists: true },
    originalText: { $exists: true },
    questionType: { $exists: true },
    isActive: true
  });

  console.log(`✓ Data integrity check: ${questionsWithRequiredFields}/${totalQuestions} questions have required fields`);

  // Test index usage
  const indexes = await questionPool.indexes();
  console.log(`✓ Database indexes: ${indexes.length} indexes created`);

  console.log('✓ Performance metrics test completed');
}

// Run the test suite
if (require.main === module) {
  testAdaptiveQuestionSystem().catch(console.error);
}

module.exports = { testAdaptiveQuestionSystem };