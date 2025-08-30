import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import QuestionBank from '@/models/QuestionBank';
import { connectDB } from '@/lib/db';
import { hasPermission, hasStringPermission } from '@/lib/permissions';

// POST /api/question-bank/optimize - Optimize question bank based on AI insights
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can optimize question bank
    if (!hasStringPermission(session.user.role, 'manage_questions')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    await connectDB();

    const body = await request.json();
    const {
      optimizationType,
      category,
      targetEffectiveness = 7.0,
      autoApprove = false,
    } = body;

    let optimizationResults;

    switch (optimizationType) {
      case 'effectiveness':
        optimizationResults = await optimizeByEffectiveness(
          session.user,
          targetEffectiveness,
          category
        );
        break;
      case 'response_rate':
        optimizationResults = await optimizeByResponseRate(
          session.user,
          category
        );
        break;
      case 'usage_patterns':
        optimizationResults = await optimizeByUsagePatterns(
          session.user,
          category
        );
        break;
      case 'ai_suggestions':
        optimizationResults = await generateAISuggestions(
          session.user,
          category
        );
        break;
      case 'comprehensive':
        optimizationResults = await comprehensiveOptimization(
          session.user,
          category,
          targetEffectiveness
        );
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid optimization type' },
          { status: 400 }
        );
    }

    // Auto-approve changes if requested and user has permission
    if (autoApprove && session.user.role === 'super_admin') {
      await applyOptimizations(optimizationResults.suggestions);
      optimizationResults.applied = true;
    }

    return NextResponse.json(optimizationResults);
  } catch (error) {
    console.error('Error optimizing question bank:', error);
    return NextResponse.json(
      { error: 'Failed to optimize question bank' },
      { status: 500 }
    );
  }
}

// Optimize questions based on effectiveness scores
async function optimizeByEffectiveness(
  user: any,
  targetEffectiveness: number,
  category?: string
) {
  const query: any = { is_active: true };

  // Apply company scoping
  if (user.role === 'company_admin') {
    query.$or = [
      { company_id: user.companyId },
      { company_id: { $exists: false } },
    ];
  }

  if (category) query.category = category;

  // Find underperforming questions
  const underperforming = await QuestionBank.find({
    ...query,
    'metrics.usage_count': { $gt: 3 }, // Only questions with sufficient usage
    'metrics.insight_score': { $lt: targetEffectiveness },
  }).lean();

  // Find high-performing questions for reference
  const highPerforming = await QuestionBank.find({
    ...query,
    'metrics.insight_score': { $gte: targetEffectiveness + 1 },
  }).lean();

  const suggestions = [];

  // Suggest deactivating very poor performers
  const veryPoor = underperforming.filter((q) => q.metrics.insight_score < 3);
  for (const question of veryPoor) {
    suggestions.push({
      type: 'deactivate',
      questionId: question._id,
      currentText: question.text,
      reason: `Very low effectiveness score: ${question.metrics.insight_score}`,
      action: 'Set is_active to false',
      priority: 'high',
    });
  }

  // Suggest rewording for moderate performers
  const moderate = underperforming.filter(
    (q) =>
      q.metrics.insight_score >= 3 &&
      q.metrics.insight_score < targetEffectiveness
  );
  for (const question of moderate) {
    const similarHighPerforming = highPerforming.find(
      (hp) => hp.category === question.category && hp.type === question.type
    );

    if (similarHighPerforming) {
      suggestions.push({
        type: 'reword',
        questionId: question._id,
        currentText: question.text,
        suggestedText: generateImprovedVersion(
          question.text,
          similarHighPerforming.text
        ),
        reason: `Effectiveness below target: ${question.metrics.insight_score} < ${targetEffectiveness}`,
        reference: similarHighPerforming.text,
        priority: 'medium',
      });
    }
  }

  return {
    type: 'effectiveness_optimization',
    targetEffectiveness,
    analyzed: underperforming.length,
    suggestions,
    summary: {
      toDeactivate: suggestions.filter((s) => s.type === 'deactivate').length,
      toReword: suggestions.filter((s) => s.type === 'reword').length,
    },
  };
}

// Optimize questions based on response rates
async function optimizeByResponseRate(user: any, category?: string) {
  const query: any = { is_active: true };

  if (user.role === 'company_admin') {
    query.$or = [
      { company_id: user.companyId },
      { company_id: { $exists: false } },
    ];
  }

  if (category) query.category = category;

  // Find questions with low response rates
  const lowResponseRate = await QuestionBank.find({
    ...query,
    'metrics.usage_count': { $gt: 2 },
    'metrics.response_rate': { $lt: 75 },
  }).lean();

  const suggestions = [];

  for (const question of lowResponseRate) {
    suggestions.push({
      type: 'simplify',
      questionId: question._id,
      currentText: question.text,
      suggestedText: simplifyQuestion(question.text),
      reason: `Low response rate: ${question.metrics.response_rate}%`,
      currentResponseRate: question.metrics.response_rate,
      priority: question.metrics.response_rate < 50 ? 'high' : 'medium',
    });
  }

  return {
    type: 'response_rate_optimization',
    analyzed: lowResponseRate.length,
    suggestions,
    summary: {
      averageResponseRate:
        lowResponseRate.reduce((sum, q) => sum + q.metrics.response_rate, 0) /
        lowResponseRate.length,
    },
  };
}

// Optimize based on usage patterns
async function optimizeByUsagePatterns(user: any, category?: string) {
  const query: any = { is_active: true };

  if (user.role === 'company_admin') {
    query.$or = [
      { company_id: user.companyId },
      { company_id: { $exists: false } },
    ];
  }

  if (category) query.category = category;

  // Find unused questions
  const unused = await QuestionBank.find({
    ...query,
    'metrics.usage_count': 0,
  }).lean();

  // Find overused questions (might need alternatives)
  const overused = await QuestionBank.find({
    ...query,
    'metrics.usage_count': { $gt: 50 },
  }).lean();

  const suggestions = [];

  // Suggest promoting unused questions
  for (const question of unused.slice(0, 10)) {
    // Limit to top 10
    suggestions.push({
      type: 'promote',
      questionId: question._id,
      currentText: question.text,
      reason: 'Never been used - consider promoting or reviewing relevance',
      action: 'Add to recommended questions or review for relevance',
      priority: 'low',
    });
  }

  // Suggest creating alternatives for overused questions
  for (const question of overused) {
    suggestions.push({
      type: 'create_alternative',
      questionId: question._id,
      currentText: question.text,
      suggestedText: generateAlternativeVersion(question.text),
      reason: `Heavily used (${question.metrics.usage_count} times) - consider creating alternatives`,
      usageCount: question.metrics.usage_count,
      priority: 'medium',
    });
  }

  return {
    type: 'usage_pattern_optimization',
    analyzed: unused.length + overused.length,
    suggestions,
    summary: {
      unusedQuestions: unused.length,
      overusedQuestions: overused.length,
    },
  };
}

// Generate AI-powered suggestions
async function generateAISuggestions(user: any, category?: string) {
  const query: any = { is_active: true };

  if (user.role === 'company_admin') {
    query.$or = [
      { company_id: user.companyId },
      { company_id: { $exists: false } },
    ];
  }

  if (category) query.category = category;

  // Analyze question gaps
  const categoryStats = await QuestionBank.aggregate([
    { $match: query },
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
        avgEffectiveness: { $avg: '$metrics.insight_score' },
      },
    },
  ]);

  const suggestions = [];

  // Suggest new questions for underrepresented categories
  const underrepresentedCategories = categoryStats.filter(
    (cat) => cat.count < 5
  );
  for (const cat of underrepresentedCategories) {
    suggestions.push({
      type: 'generate_new',
      category: cat._id,
      reason: `Only ${cat.count} questions in ${cat._id} category`,
      suggestedQuestions: generateQuestionsForCategory(cat._id),
      priority: 'medium',
    });
  }

  return {
    type: 'ai_suggestions',
    suggestions,
    summary: {
      newQuestionsToGenerate: suggestions.reduce(
        (sum, s) => sum + (s.suggestedQuestions?.length || 0),
        0
      ),
    },
  };
}

// Comprehensive optimization combining all strategies
async function comprehensiveOptimization(
  user: any,
  category?: string,
  targetEffectiveness: number = 7.0
) {
  const [effectiveness, responseRate, usagePatterns, aiSuggestions] =
    await Promise.all([
      optimizeByEffectiveness(user, targetEffectiveness, category),
      optimizeByResponseRate(user, category),
      optimizeByUsagePatterns(user, category),
      generateAISuggestions(user, category),
    ]);

  return {
    type: 'comprehensive_optimization',
    components: {
      effectiveness,
      responseRate,
      usagePatterns,
      aiSuggestions,
    },
    summary: {
      totalSuggestions:
        effectiveness.suggestions.length +
        responseRate.suggestions.length +
        usagePatterns.suggestions.length +
        aiSuggestions.suggestions.length,
      highPriority: [
        ...effectiveness.suggestions.filter((s) => s.priority === 'high'),
        ...responseRate.suggestions.filter((s) => s.priority === 'high'),
        ...usagePatterns.suggestions.filter((s) => s.priority === 'high'),
      ].length,
    },
  };
}

// Apply optimization suggestions
async function applyOptimizations(suggestions: any[]) {
  for (const suggestion of suggestions) {
    try {
      switch (suggestion.type) {
        case 'deactivate':
          await QuestionBank.findByIdAndUpdate(suggestion.questionId, {
            is_active: false,
          });
          break;
        case 'reword':
          await QuestionBank.findByIdAndUpdate(suggestion.questionId, {
            text: suggestion.suggestedText,
            version: { $inc: 1 },
          });
          break;
        case 'generate_new':
          // Create new questions
          for (const newQuestion of suggestion.suggestedQuestions || []) {
            const question = new QuestionBank({
              ...newQuestion,
              is_ai_generated: true,
              created_by: 'ai_optimization',
            });
            await question.save();
          }
          break;
      }
    } catch (error) {
      console.error(`Failed to apply suggestion ${suggestion.type}:`, error);
    }
  }
}

// Helper functions for text generation
function generateImprovedVersion(
  originalText: string,
  referenceText: string
): string {
  // Simple improvement logic - in a real implementation, this would use AI
  const improvements = [
    originalText.replace(/\b(very|really|quite)\b/gi, ''),
    originalText.replace(/\?$/, ''),
    originalText.charAt(0).toUpperCase() + originalText.slice(1).toLowerCase(),
  ];

  return improvements[0].trim() || originalText;
}

function simplifyQuestion(text: string): string {
  // Simplification logic
  return text
    .replace(/\b(extremely|significantly|substantially)\b/gi, '')
    .replace(/\b(in your opinion|do you think|would you say)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function generateAlternativeVersion(text: string): string {
  // Generate alternative phrasing
  const alternatives = [
    text.replace(/\bI\b/g, 'we'),
    text.replace(/\bfeel\b/g, 'believe'),
    text.replace(/\bthink\b/g, 'consider'),
  ];

  return alternatives[0] !== text
    ? alternatives[0]
    : `How would you rate: ${text.toLowerCase()}`;
}

function generateQuestionsForCategory(category: string): any[] {
  // Generate new questions for category - simplified version
  const templates = {
    'Leadership & Management': [
      { text: 'Leadership provides clear strategic direction', type: 'likert' },
      { text: 'Management supports employee development', type: 'likert' },
    ],
    Communication: [
      { text: 'Information flows effectively across teams', type: 'likert' },
      {
        text: 'Feedback is provided regularly and constructively',
        type: 'likert',
      },
    ],
    'Work Environment & Culture': [
      { text: 'The workplace promotes psychological safety', type: 'likert' },
      { text: 'Diversity and inclusion are valued', type: 'likert' },
    ],
  };

  return (templates[category as keyof typeof templates] || []).map((q) => ({
    ...q,
    category,
    tags: [category.toLowerCase().replace(/\s+/g, '_')],
    scale_min: 1,
    scale_max: 5,
    scale_labels: { min: 'Strongly Disagree', max: 'Strongly Agree' },
  }));
}
