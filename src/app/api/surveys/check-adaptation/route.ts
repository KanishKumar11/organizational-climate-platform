import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  QuestionAdaptationEngine,
  AdaptationContext,
} from '@/lib/question-adaptation-engine';
import { connectDB } from '@/lib/db';

interface AdaptationTrigger {
  type:
    | 'response_pattern'
    | 'category_completion'
    | 'sentiment_shift'
    | 'engagement_drop';
  description: string;
  confidence: number;
}

// POST /api/surveys/check-adaptation - Check if questions should be adapted based on responses
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const {
      surveyId,
      userContext,
      responses,
      currentQuestionIndex,
      remainingQuestions,
    } = body;

    if (!responses || !Array.isArray(responses)) {
      return NextResponse.json(
        { error: 'Responses array is required' },
        { status: 400 }
      );
    }

    // Analyze responses to determine if adaptation is needed
    const adaptationAnalysis = analyzeResponsesForAdaptation(
      responses,
      currentQuestionIndex,
      remainingQuestions
    );

    if (!adaptationAnalysis.shouldAdapt) {
      return NextResponse.json({
        shouldAdapt: false,
        reason: adaptationAnalysis.reason,
      });
    }

    // Build enhanced adaptation context with response history
    const adaptationContext: AdaptationContext = {
      department: userContext?.department || session.user.departmentId,
      role: userContext?.role || session.user.role,
      industry: userContext?.industry,
      companySize: userContext?.companySize,
      demographics: userContext?.demographics,
      previousResponses: responses.map((r: any) => ({
        questionId: r.questionId,
        response: r.response,
        category: r.category,
      })),
      surveyType: userContext?.surveyType || 'general_climate',
    };

    // Get categories that still need questions
    const remainingCategories = getRemainingCategories(remainingQuestions);
    const questionsPerCategory = Math.ceil(
      remainingQuestions.length / remainingCategories.length
    );

    // Generate adapted questions
    const adaptedQuestions =
      await QuestionAdaptationEngine.adaptQuestionsForContext(
        remainingCategories,
        questionsPerCategory,
        adaptationContext,
        session.user.companyId
      );

    // Format questions for the UI
    const formattedQuestions = adaptedQuestions.map((q, index) => ({
      id: q.originalQuestionId || `adapted_${currentQuestionIndex}_${index}`,
      text: q.text,
      type: q.type,
      category: q.category,
      subcategory: q.subcategory,
      options: q.options,
      scale_min: q.scale_min,
      scale_max: q.scale_max,
      scale_labels: q.scale_labels,
      required: true,
      adaptationType: q.adaptationType,
      adaptationReason: q.adaptationReason,
      confidence: q.confidence,
      contextExplanation: generateAdaptationExplanation(
        q,
        adaptationAnalysis.triggers
      ),
    }));

    return NextResponse.json({
      shouldAdapt: true,
      adaptedQuestions: formattedQuestions,
      triggers: adaptationAnalysis.triggers,
      adaptation_reason: adaptationAnalysis.reason,
      confidence: adaptationAnalysis.confidence,
    });
  } catch (error) {
    console.error('Error checking adaptation:', error);
    return NextResponse.json(
      { error: 'Failed to check adaptation' },
      { status: 500 }
    );
  }
}

function analyzeResponsesForAdaptation(
  responses: any[],
  currentQuestionIndex: number,
  remainingQuestions: any[]
): {
  shouldAdapt: boolean;
  reason: string;
  confidence: number;
  triggers: AdaptationTrigger[];
} {
  const triggers: AdaptationTrigger[] = [];
  let shouldAdapt = false;
  let confidence = 0;

  // Trigger 1: Response pattern analysis
  const responsePatterns = analyzeResponsePatterns(responses);
  if (responsePatterns.hasPattern) {
    triggers.push({
      type: 'response_pattern',
      description: `Detected ${responsePatterns.pattern} response pattern`,
      confidence: responsePatterns.confidence,
    });
    shouldAdapt = true;
    confidence = Math.max(confidence, responsePatterns.confidence);
  }

  // Trigger 2: Category completion analysis
  const categoryAnalysis = analyzeCategoryCompletion(responses);
  if (categoryAnalysis.shouldFocus) {
    triggers.push({
      type: 'category_completion',
      description: `Focus on ${categoryAnalysis.focusCategory} based on responses`,
      confidence: categoryAnalysis.confidence,
    });
    shouldAdapt = true;
    confidence = Math.max(confidence, categoryAnalysis.confidence);
  }

  // Trigger 3: Sentiment shift detection
  const sentimentAnalysis = analyzeSentimentShift(responses);
  if (sentimentAnalysis.hasShift) {
    triggers.push({
      type: 'sentiment_shift',
      description: `Sentiment shift detected: ${sentimentAnalysis.direction}`,
      confidence: sentimentAnalysis.confidence,
    });
    shouldAdapt = true;
    confidence = Math.max(confidence, sentimentAnalysis.confidence);
  }

  // Trigger 4: Engagement drop detection
  const engagementAnalysis = analyzeEngagement(responses);
  if (engagementAnalysis.hasDropped) {
    triggers.push({
      type: 'engagement_drop',
      description: 'Engagement appears to be dropping, adapting questions',
      confidence: engagementAnalysis.confidence,
    });
    shouldAdapt = true;
    confidence = Math.max(confidence, engagementAnalysis.confidence);
  }

  // Only adapt if we have sufficient confidence and are not too close to the end
  const remainingCount = remainingQuestions.length;
  if (remainingCount < 3) {
    shouldAdapt = false; // Don't adapt if only a few questions left
  }

  return {
    shouldAdapt: shouldAdapt && confidence > 0.6,
    reason:
      triggers.length > 0
        ? `Adaptation triggered by: ${triggers.map((t) => t.type).join(', ')}`
        : 'No adaptation needed',
    confidence,
    triggers,
  };
}

function analyzeResponsePatterns(responses: any[]): {
  hasPattern: boolean;
  pattern: string;
  confidence: number;
} {
  if (responses.length < 3) {
    return { hasPattern: false, pattern: '', confidence: 0 };
  }

  // Check for consistent low scores (indicating dissatisfaction)
  const numericResponses = responses
    .filter((r) => typeof r.response === 'number')
    .map((r) => r.response);

  if (numericResponses.length >= 3) {
    const average =
      numericResponses.reduce((sum, val) => sum + val, 0) /
      numericResponses.length;

    if (average <= 2) {
      return {
        hasPattern: true,
        pattern: 'consistently low satisfaction',
        confidence: 0.8,
      };
    }

    if (average >= 4) {
      return {
        hasPattern: true,
        pattern: 'consistently high satisfaction',
        confidence: 0.7,
      };
    }
  }

  // Check for specific response patterns in text
  const textResponses = responses
    .filter((r) => typeof r.response === 'string')
    .map((r) => r.response.toLowerCase());

  const negativeKeywords = [
    'poor',
    'bad',
    'terrible',
    'awful',
    'hate',
    'frustrated',
    'disappointed',
  ];
  const positiveKeywords = [
    'great',
    'excellent',
    'amazing',
    'love',
    'fantastic',
    'wonderful',
  ];

  const negativeCount = textResponses.reduce(
    (count, text) =>
      count +
      negativeKeywords.filter((keyword) => text.includes(keyword)).length,
    0
  );

  const positiveCount = textResponses.reduce(
    (count, text) =>
      count +
      positiveKeywords.filter((keyword) => text.includes(keyword)).length,
    0
  );

  if (negativeCount > positiveCount && negativeCount >= 2) {
    return {
      hasPattern: true,
      pattern: 'negative sentiment in text responses',
      confidence: 0.7,
    };
  }

  return { hasPattern: false, pattern: '', confidence: 0 };
}

function analyzeCategoryCompletion(responses: any[]): {
  shouldFocus: boolean;
  focusCategory: string;
  confidence: number;
} {
  if (responses.length < 2) {
    return { shouldFocus: false, focusCategory: '', confidence: 0 };
  }

  // Count responses by category
  const categoryCount: Record<string, number> = {};
  const categoryScores: Record<string, number[]> = {};

  responses.forEach((response) => {
    const category = response.category;
    categoryCount[category] = (categoryCount[category] || 0) + 1;

    if (typeof response.response === 'number') {
      if (!categoryScores[category]) categoryScores[category] = [];
      categoryScores[category].push(response.response);
    }
  });

  // Find category with concerning scores that needs more focus
  for (const [category, scores] of Object.entries(categoryScores)) {
    if (scores.length >= 2) {
      const average = scores.reduce((sum, val) => sum + val, 0) / scores.length;
      if (average <= 2.5) {
        return {
          shouldFocus: true,
          focusCategory: category,
          confidence: 0.8,
        };
      }
    }
  }

  return { shouldFocus: false, focusCategory: '', confidence: 0 };
}

function analyzeSentimentShift(responses: any[]): {
  hasShift: boolean;
  direction: string;
  confidence: number;
} {
  if (responses.length < 4) {
    return { hasShift: false, direction: '', confidence: 0 };
  }

  const numericResponses = responses
    .filter((r) => typeof r.response === 'number')
    .map((r) => r.response);

  if (numericResponses.length < 4) {
    return { hasShift: false, direction: '', confidence: 0 };
  }

  // Compare first half vs second half
  const midPoint = Math.floor(numericResponses.length / 2);
  const firstHalf = numericResponses.slice(0, midPoint);
  const secondHalf = numericResponses.slice(midPoint);

  const firstAvg =
    firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
  const secondAvg =
    secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;

  const difference = secondAvg - firstAvg;

  if (Math.abs(difference) > 1) {
    return {
      hasShift: true,
      direction: difference > 0 ? 'improving' : 'declining',
      confidence: Math.min(Math.abs(difference) / 2, 0.9),
    };
  }

  return { hasShift: false, direction: '', confidence: 0 };
}

function analyzeEngagement(responses: any[]): {
  hasDropped: boolean;
  confidence: number;
} {
  if (responses.length < 3) {
    return { hasDropped: false, confidence: 0 };
  }

  // Check for decreasing response length in text responses
  const textResponses = responses
    .filter((r) => typeof r.response === 'string')
    .map((r) => r.response);

  if (textResponses.length >= 3) {
    const lengths = textResponses.map((text) => text.length);
    const recentLengths = lengths.slice(-2);
    const earlierLengths = lengths.slice(0, -2);

    const recentAvg =
      recentLengths.reduce((sum, len) => sum + len, 0) / recentLengths.length;
    const earlierAvg =
      earlierLengths.reduce((sum, len) => sum + len, 0) / earlierLengths.length;

    if (earlierAvg > 20 && recentAvg < earlierAvg * 0.5) {
      return {
        hasDropped: true,
        confidence: 0.7,
      };
    }
  }

  return { hasDropped: false, confidence: 0 };
}

function getRemainingCategories(remainingQuestions: any[]): string[] {
  const categories = new Set<string>();
  remainingQuestions.forEach((q) => categories.add(q.category));
  return Array.from(categories);
}

function generateAdaptationExplanation(
  question: any,
  triggers: AdaptationTrigger[]
): string {
  if (triggers.length === 0) {
    return 'This question has been adapted to better match your responses.';
  }

  const triggerTypes = triggers.map((t) => t.type);

  if (triggerTypes.includes('response_pattern')) {
    return 'Based on your response patterns, this question focuses on areas that seem most relevant to your experience.';
  }

  if (triggerTypes.includes('sentiment_shift')) {
    return 'We noticed a change in your responses, so this question explores that area more deeply.';
  }

  if (triggerTypes.includes('category_completion')) {
    return 'This question dives deeper into an area where your responses suggest there might be important insights.';
  }

  return 'This question has been personalized based on your previous responses.';
}
