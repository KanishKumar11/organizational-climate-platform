import QuestionBank from '@/models/QuestionBank';
import Survey from '@/models/Survey';
import Response from '@/models/Response';
import { connectDB } from '@/lib/db';

export interface EffectivenessMetrics {
  questionId: string;
  questionText: string;
  category: string;
  adaptationType: string;
  responseRate: number;
  completionRate: number;
  insightScore: number;
  engagementScore: number;
  relevanceScore: number;
  overallEffectiveness: number;
  sampleSize: number;
  confidenceInterval: number;
  trend: 'improving' | 'declining' | 'stable';
  recommendations: string[];
}

export interface ABTestResult {
  testId: string;
  questionA: {
    id: string;
    text: string;
    metrics: EffectivenessMetrics;
  };
  questionB: {
    id: string;
    text: string;
    metrics: EffectivenessMetrics;
  };
  winner: 'A' | 'B' | 'tie';
  confidence: number;
  statisticalSignificance: boolean;
  sampleSizeA: number;
  sampleSizeB: number;
  testDuration: number; // days
  startDate: Date;
  endDate?: Date;
  status: 'running' | 'completed' | 'paused';
}

export interface ResponseQualityAssessment {
  responseId: string;
  questionId: string;
  qualityScore: number; // 0-1
  factors: {
    completeness: number;
    thoughtfulness: number;
    relevance: number;
    consistency: number;
  };
  flags: string[];
  recommendations: string[];
}

export interface QuestionImprovementSuggestion {
  questionId: string;
  currentText: string;
  suggestedText: string;
  improvementType: 'clarity' | 'relevance' | 'engagement' | 'specificity';
  expectedImpact: number; // 0-1
  confidence: number; // 0-1
  reasoning: string;
  testRecommendation: boolean;
}

export class QuestionnaireEffectivenessService {
  /**
   * Calculate comprehensive effectiveness metrics for a question
   */
  static async calculateQuestionEffectiveness(
    questionId: string,
    timeframe: number = 90 // days
  ): Promise<EffectivenessMetrics> {
    await connectDB();

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - timeframe);

    // Get question details
    const question = await QuestionBank.findById(questionId).lean();
    if (!question) {
      throw new Error('Question not found');
    }

    // Get all responses for this question
    const responses = await Response.find({
      question_id: questionId,
      created_at: { $gte: startDate },
    }).lean();

    // Get surveys that included this question
    const surveyIds = [...new Set(responses.map((r) => r.survey_id))];
    const surveys = await Survey.find({
      _id: { $in: surveyIds },
    }).lean();

    // Calculate metrics
    const responseRate = await this.calculateResponseRate(
      questionId,
      surveyIds
    );
    const completionRate = await this.calculateCompletionRate(
      questionId,
      responses
    );
    const insightScore = await this.calculateInsightScore(
      questionId,
      responses
    );
    const engagementScore = await this.calculateEngagementScore(
      questionId,
      responses
    );
    const relevanceScore = await this.calculateRelevanceScore(
      questionId,
      responses
    );

    // Calculate overall effectiveness (weighted average)
    const overallEffectiveness =
      responseRate * 0.2 +
      completionRate * 0.2 +
      insightScore * 0.3 +
      engagementScore * 0.15 +
      relevanceScore * 0.15;

    // Calculate confidence interval
    const sampleSize = responses.length;
    const confidenceInterval = this.calculateConfidenceInterval(
      overallEffectiveness,
      sampleSize
    );

    // Determine trend
    const trend = await this.calculateTrend(questionId, timeframe);

    // Generate recommendations
    const recommendations = this.generateEffectivenessRecommendations({
      responseRate,
      completionRate,
      insightScore,
      engagementScore,
      relevanceScore,
      sampleSize,
    });

    return {
      questionId,
      questionText: question.text,
      category: question.category,
      adaptationType: question.is_ai_generated ? 'ai_generated' : 'original',
      responseRate,
      completionRate,
      insightScore,
      engagementScore,
      relevanceScore,
      overallEffectiveness,
      sampleSize,
      confidenceInterval,
      trend,
      recommendations,
    };
  }

  /**
   * Set up A/B test for question variations
   */
  static async setupABTest(
    questionAId: string,
    questionBId: string,
    testName: string,
    targetSampleSize: number = 100
  ): Promise<ABTestResult> {
    await connectDB();

    const [questionA, questionB] = await Promise.all([
      QuestionBank.findById(questionAId).lean(),
      QuestionBank.findById(questionBId).lean(),
    ]);

    if (!questionA || !questionB) {
      throw new Error('One or both questions not found');
    }

    const testId = `ab_test_${Date.now()}`;

    // Create test record (you might want to create a separate ABTest model)
    const testResult: ABTestResult = {
      testId,
      questionA: {
        id: questionAId,
        text: questionA.text,
        metrics: await this.calculateQuestionEffectiveness(questionAId),
      },
      questionB: {
        id: questionBId,
        text: questionB.text,
        metrics: await this.calculateQuestionEffectiveness(questionBId),
      },
      winner: 'tie',
      confidence: 0,
      statisticalSignificance: false,
      sampleSizeA: 0,
      sampleSizeB: 0,
      testDuration: 0,
      startDate: new Date(),
      status: 'running',
    };

    // Store test configuration (implement based on your needs)
    await this.storeABTest(testResult);

    return testResult;
  }

  /**
   * Analyze A/B test results
   */
  static async analyzeABTest(testId: string): Promise<ABTestResult> {
    await connectDB();

    // Get test configuration
    const test = await this.getABTest(testId);
    if (!test) {
      throw new Error('A/B test not found');
    }

    // Get current metrics for both questions
    const [metricsA, metricsB] = await Promise.all([
      this.calculateQuestionEffectiveness(test.questionA.id),
      this.calculateQuestionEffectiveness(test.questionB.id),
    ]);

    // Perform statistical analysis
    const statisticalResult = this.performStatisticalAnalysis(
      metricsA,
      metricsB
    );

    const updatedTest: ABTestResult = {
      ...test,
      questionA: { ...test.questionA, metrics: metricsA },
      questionB: { ...test.questionB, metrics: metricsB },
      winner: statisticalResult.winner,
      confidence: statisticalResult.confidence,
      statisticalSignificance: statisticalResult.significant,
      sampleSizeA: metricsA.sampleSize,
      sampleSizeB: metricsB.sampleSize,
      testDuration: Math.ceil(
        (Date.now() - test.startDate.getTime()) / (1000 * 60 * 60 * 24)
      ),
      endDate: statisticalResult.significant ? new Date() : undefined,
      status: statisticalResult.significant ? 'completed' : 'running',
    };

    // Update test record
    await this.updateABTest(testId, updatedTest);

    return updatedTest;
  }

  /**
   * Assess response quality for a given response
   */
  static async assessResponseQuality(
    responseId: string,
    questionId: string,
    responseValue: any,
    responseText?: string
  ): Promise<ResponseQualityAssessment> {
    await connectDB();

    const question = await QuestionBank.findById(questionId).lean();
    if (!question) {
      throw new Error('Question not found');
    }

    // Calculate quality factors
    const completeness = this.assessCompleteness(
      responseValue,
      responseText,
      question
    );
    const thoughtfulness = this.assessThoughtfulness(
      responseValue,
      responseText,
      question
    );
    const relevance = this.assessRelevance(
      responseValue,
      responseText,
      question
    );
    const consistency = await this.assessConsistency(
      responseId,
      responseValue,
      question
    );

    // Calculate overall quality score
    const qualityScore =
      (completeness + thoughtfulness + relevance + consistency) / 4;

    // Generate flags and recommendations
    const flags = this.generateQualityFlags({
      completeness,
      thoughtfulness,
      relevance,
      consistency,
    });

    const recommendations = this.generateQualityRecommendations({
      completeness,
      thoughtfulness,
      relevance,
      consistency,
    });

    return {
      responseId,
      questionId,
      qualityScore,
      factors: {
        completeness,
        thoughtfulness,
        relevance,
        consistency,
      },
      flags,
      recommendations,
    };
  }

  /**
   * Generate improvement suggestions for a question
   */
  static async generateImprovementSuggestions(
    questionId: string
  ): Promise<QuestionImprovementSuggestion[]> {
    await connectDB();

    const effectiveness = await this.calculateQuestionEffectiveness(questionId);
    const question = await QuestionBank.findById(questionId).lean();

    if (!question) {
      throw new Error('Question not found');
    }

    const suggestions: QuestionImprovementSuggestion[] = [];

    // Analyze different improvement opportunities
    if (effectiveness.responseRate < 0.7) {
      suggestions.push(
        await this.generateClarityImprovement(question, effectiveness)
      );
    }

    if (effectiveness.engagementScore < 0.6) {
      suggestions.push(
        await this.generateEngagementImprovement(question, effectiveness)
      );
    }

    if (effectiveness.relevanceScore < 0.7) {
      suggestions.push(
        await this.generateRelevanceImprovement(question, effectiveness)
      );
    }

    if (effectiveness.insightScore < 0.6) {
      suggestions.push(
        await this.generateSpecificityImprovement(question, effectiveness)
      );
    }

    return suggestions.filter(Boolean);
  }

  // Private helper methods

  private static async calculateResponseRate(
    questionId: string,
    surveyIds: string[]
  ): Promise<number> {
    if (surveyIds.length === 0) return 0;

    // Get total number of survey participants
    const totalParticipants = await Response.aggregate([
      { $match: { survey_id: { $in: surveyIds } } },
      { $group: { _id: '$user_id' } },
      { $count: 'total' },
    ]);

    // Get number of participants who responded to this question
    const questionResponders = await Response.aggregate([
      { $match: { question_id: questionId, survey_id: { $in: surveyIds } } },
      { $group: { _id: '$user_id' } },
      { $count: 'total' },
    ]);

    const total = totalParticipants[0]?.total || 0;
    const responders = questionResponders[0]?.total || 0;

    return total > 0 ? responders / total : 0;
  }

  private static async calculateCompletionRate(
    questionId: string,
    responses: any[]
  ): Promise<number> {
    if (responses.length === 0) return 0;

    const completedResponses = responses.filter((r) => {
      if (typeof r.response_value === 'string') {
        return r.response_value.trim().length > 0;
      }
      return r.response_value !== null && r.response_value !== undefined;
    });

    return completedResponses.length / responses.length;
  }

  private static async calculateInsightScore(
    questionId: string,
    responses: any[]
  ): Promise<number> {
    if (responses.length === 0) return 0;

    // Analyze response variance and depth
    let varianceScore = 0;
    let depthScore = 0;

    const numericResponses = responses
      .filter((r) => typeof r.response_value === 'number')
      .map((r) => r.response_value);

    if (numericResponses.length > 1) {
      const mean =
        numericResponses.reduce((sum, val) => sum + val, 0) /
        numericResponses.length;
      const variance =
        numericResponses.reduce(
          (sum, val) => sum + Math.pow(val - mean, 2),
          0
        ) / numericResponses.length;
      varianceScore = Math.min(variance / 2, 1); // Normalize to 0-1
    }

    const textResponses = responses
      .filter((r) => typeof r.response_value === 'string')
      .map((r) => r.response_value);

    if (textResponses.length > 0) {
      const avgLength =
        textResponses.reduce((sum, text) => sum + text.length, 0) /
        textResponses.length;
      depthScore = Math.min(avgLength / 100, 1); // Normalize to 0-1 (100 chars = max score)
    }

    return (varianceScore + depthScore) / 2;
  }

  private static async calculateEngagementScore(
    questionId: string,
    responses: any[]
  ): Promise<number> {
    if (responses.length === 0) return 0;

    // Measure engagement based on response quality and time spent
    let qualityScore = 0;
    let timeScore = 0;

    // Quality: longer text responses indicate higher engagement
    const textResponses = responses.filter(
      (r) => typeof r.response_value === 'string'
    );
    if (textResponses.length > 0) {
      const avgLength =
        textResponses.reduce((sum, r) => sum + r.response_value.length, 0) /
        textResponses.length;
      qualityScore = Math.min(avgLength / 50, 1); // 50 chars = good engagement
    }

    // Time: reasonable time spent (not too fast, not too slow)
    // This would require tracking response times - simplified for now
    timeScore = 0.7; // Default assumption

    return (qualityScore + timeScore) / 2;
  }

  private static async calculateRelevanceScore(
    questionId: string,
    responses: any[]
  ): Promise<number> {
    if (responses.length === 0) return 0;

    // Analyze relevance based on response patterns and user feedback
    // This is a simplified implementation
    const question = await QuestionBank.findById(questionId).lean();
    if (!question) return 0;

    // Higher usage count indicates relevance
    const usageScore = Math.min(question.metrics.usage_count / 20, 1);

    // Response rate indicates relevance
    const responseRate = await this.calculateResponseRate(questionId, []);

    return (usageScore + responseRate) / 2;
  }

  private static calculateConfidenceInterval(
    effectiveness: number,
    sampleSize: number
  ): number {
    if (sampleSize < 30) return 0.2; // Low confidence for small samples

    // Simplified confidence interval calculation
    const standardError = Math.sqrt(
      (effectiveness * (1 - effectiveness)) / sampleSize
    );
    return 1.96 * standardError; // 95% confidence interval
  }

  private static async calculateTrend(
    questionId: string,
    timeframe: number
  ): Promise<'improving' | 'declining' | 'stable'> {
    // Compare recent performance vs historical
    const recentStart = new Date();
    recentStart.setDate(recentStart.getDate() - Math.floor(timeframe / 3));

    const historicalStart = new Date();
    historicalStart.setDate(historicalStart.getDate() - timeframe);

    const [recentResponses, historicalResponses] = await Promise.all([
      Response.find({
        question_id: questionId,
        created_at: { $gte: recentStart },
      }).lean(),
      Response.find({
        question_id: questionId,
        created_at: { $gte: historicalStart, $lt: recentStart },
      }).lean(),
    ]);

    if (recentResponses.length < 5 || historicalResponses.length < 5) {
      return 'stable'; // Not enough data
    }

    const recentAvg = this.calculateAverageScore(recentResponses);
    const historicalAvg = this.calculateAverageScore(historicalResponses);

    const difference = recentAvg - historicalAvg;

    if (difference > 0.1) return 'improving';
    if (difference < -0.1) return 'declining';
    return 'stable';
  }

  private static calculateAverageScore(responses: any[]): number {
    const numericResponses = responses
      .filter((r) => typeof r.response_value === 'number')
      .map((r) => r.response_value);

    if (numericResponses.length === 0) return 0;

    return (
      numericResponses.reduce((sum, val) => sum + val, 0) /
      numericResponses.length
    );
  }

  private static generateEffectivenessRecommendations(metrics: {
    responseRate: number;
    completionRate: number;
    insightScore: number;
    engagementScore: number;
    relevanceScore: number;
    sampleSize: number;
  }): string[] {
    const recommendations = [];

    if (metrics.responseRate < 0.7) {
      recommendations.push(
        'Consider simplifying the question or improving clarity'
      );
    }

    if (metrics.completionRate < 0.8) {
      recommendations.push(
        'Review question format - users may be skipping this question'
      );
    }

    if (metrics.insightScore < 0.6) {
      recommendations.push(
        'Question may not be generating actionable insights - consider rewording'
      );
    }

    if (metrics.engagementScore < 0.6) {
      recommendations.push(
        'Low engagement detected - make question more relevant or interesting'
      );
    }

    if (metrics.relevanceScore < 0.7) {
      recommendations.push(
        'Question relevance is low - consider contextualizing for specific roles/departments'
      );
    }

    if (metrics.sampleSize < 30) {
      recommendations.push('Increase sample size for more reliable metrics');
    }

    return recommendations;
  }

  // Additional helper methods for response quality assessment
  private static assessCompleteness(
    responseValue: any,
    responseText: string | undefined,
    question: any
  ): number {
    if (question.type === 'open_ended') {
      if (!responseText || responseText.trim().length === 0) return 0;
      if (responseText.trim().length < 10) return 0.3;
      if (responseText.trim().length < 30) return 0.7;
      return 1;
    }

    return responseValue !== null && responseValue !== undefined ? 1 : 0;
  }

  private static assessThoughtfulness(
    responseValue: any,
    responseText: string | undefined,
    question: any
  ): number {
    if (question.type === 'open_ended' && responseText) {
      // Check for thoughtful indicators
      const thoughtfulWords = [
        'because',
        'however',
        'although',
        'specifically',
        'example',
      ];
      const hasThoughtfulWords = thoughtfulWords.some((word) =>
        responseText.toLowerCase().includes(word)
      );

      const wordCount = responseText.split(/\s+/).length;
      const lengthScore = Math.min(wordCount / 20, 1);
      const thoughtfulnessBonus = hasThoughtfulWords ? 0.2 : 0;

      return Math.min(lengthScore + thoughtfulnessBonus, 1);
    }

    return 0.7; // Default for non-text responses
  }

  private static assessRelevance(
    responseValue: any,
    responseText: string | undefined,
    question: any
  ): number {
    // Simplified relevance assessment
    if (question.type === 'open_ended' && responseText) {
      const questionKeywords = question.text
        .toLowerCase()
        .split(/\s+/)
        .filter((word: string) => word.length > 3);

      const responseWords = responseText.toLowerCase().split(/\s+/);
      const relevantWords = questionKeywords.filter((keyword: string) =>
        responseWords.some(
          (word) => word.includes(keyword) || keyword.includes(word)
        )
      );

      return Math.min(
        relevantWords.length / Math.max(questionKeywords.length * 0.3, 1),
        1
      );
    }

    return 0.8; // Default for structured responses
  }

  private static async assessConsistency(
    responseId: string,
    responseValue: any,
    question: any
  ): Promise<number> {
    // Check consistency with user's other responses
    // This is a simplified implementation
    return 0.8; // Default consistency score
  }

  private static generateQualityFlags(factors: {
    completeness: number;
    thoughtfulness: number;
    relevance: number;
    consistency: number;
  }): string[] {
    const flags = [];

    if (factors.completeness < 0.5) flags.push('incomplete_response');
    if (factors.thoughtfulness < 0.4) flags.push('low_effort');
    if (factors.relevance < 0.5) flags.push('off_topic');
    if (factors.consistency < 0.5) flags.push('inconsistent');

    return flags;
  }

  private static generateQualityRecommendations(factors: {
    completeness: number;
    thoughtfulness: number;
    relevance: number;
    consistency: number;
  }): string[] {
    const recommendations = [];

    if (factors.completeness < 0.7) {
      recommendations.push('Encourage more complete responses');
    }
    if (factors.thoughtfulness < 0.6) {
      recommendations.push('Provide examples of thoughtful responses');
    }
    if (factors.relevance < 0.6) {
      recommendations.push('Clarify question context and expectations');
    }

    return recommendations;
  }

  // Statistical analysis helpers
  private static performStatisticalAnalysis(
    metricsA: EffectivenessMetrics,
    metricsB: EffectivenessMetrics
  ): { winner: 'A' | 'B' | 'tie'; confidence: number; significant: boolean } {
    const effectivenessA = metricsA.overallEffectiveness;
    const effectivenessB = metricsB.overallEffectiveness;
    const sampleA = metricsA.sampleSize;
    const sampleB = metricsB.sampleSize;

    // Simplified statistical test
    const difference = Math.abs(effectivenessA - effectivenessB);
    const pooledSE = Math.sqrt(
      (effectivenessA * (1 - effectivenessA)) / sampleA +
        (effectivenessB * (1 - effectivenessB)) / sampleB
    );

    const zScore = difference / pooledSE;
    const confidence = Math.min(zScore / 2, 0.99); // Simplified confidence calculation
    const significant = zScore > 1.96 && sampleA + sampleB > 100; // 95% confidence

    let winner: 'A' | 'B' | 'tie' = 'tie';
    if (significant) {
      winner = effectivenessA > effectivenessB ? 'A' : 'B';
    }

    return { winner, confidence, significant };
  }

  // Improvement suggestion generators
  private static async generateClarityImprovement(
    question: any,
    effectiveness: EffectivenessMetrics
  ): Promise<QuestionImprovementSuggestion> {
    return {
      questionId: question._id.toString(),
      currentText: question.text,
      suggestedText: this.simplifySentence(question.text),
      improvementType: 'clarity',
      expectedImpact: 0.3,
      confidence: 0.7,
      reasoning: 'Low response rate suggests clarity issues',
      testRecommendation: true,
    };
  }

  private static async generateEngagementImprovement(
    question: any,
    effectiveness: EffectivenessMetrics
  ): Promise<QuestionImprovementSuggestion> {
    return {
      questionId: question._id.toString(),
      currentText: question.text,
      suggestedText: this.makeMoreEngaging(question.text),
      improvementType: 'engagement',
      expectedImpact: 0.25,
      confidence: 0.6,
      reasoning:
        'Low engagement score indicates need for more compelling language',
      testRecommendation: true,
    };
  }

  private static async generateRelevanceImprovement(
    question: any,
    effectiveness: EffectivenessMetrics
  ): Promise<QuestionImprovementSuggestion> {
    return {
      questionId: question._id.toString(),
      currentText: question.text,
      suggestedText: this.addContext(question.text),
      improvementType: 'relevance',
      expectedImpact: 0.4,
      confidence: 0.8,
      reasoning:
        'Low relevance score suggests need for better contextualization',
      testRecommendation: true,
    };
  }

  private static async generateSpecificityImprovement(
    question: any,
    effectiveness: EffectivenessMetrics
  ): Promise<QuestionImprovementSuggestion> {
    return {
      questionId: question._id.toString(),
      currentText: question.text,
      suggestedText: this.makeMoreSpecific(question.text),
      improvementType: 'specificity',
      expectedImpact: 0.35,
      confidence: 0.7,
      reasoning: 'Low insight score suggests need for more specific questions',
      testRecommendation: true,
    };
  }

  // Text improvement helpers (simplified implementations)
  private static simplifySentence(text: string): string {
    return text
      .replace(/\b(extremely|significantly|substantially)\b/gi, '')
      .replace(/\b(in your opinion|do you think|would you say)\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private static makeMoreEngaging(text: string): string {
    if (text.includes('How')) {
      return text.replace('How', 'In what ways');
    }
    return `What's your experience with ${text.toLowerCase()}?`;
  }

  private static addContext(text: string): string {
    return `In your current role, ${text.toLowerCase()}`;
  }

  private static makeMoreSpecific(text: string): string {
    return text.replace(/\b(things|stuff|issues)\b/gi, 'specific aspects');
  }

  // Placeholder methods for A/B test storage (implement based on your needs)
  private static async storeABTest(test: ABTestResult): Promise<void> {
    // Implement A/B test storage
  }

  private static async getABTest(testId: string): Promise<ABTestResult | null> {
    // Implement A/B test retrieval
    return null;
  }

  private static async updateABTest(
    testId: string,
    test: ABTestResult
  ): Promise<void> {
    // Implement A/B test update
  }
}
