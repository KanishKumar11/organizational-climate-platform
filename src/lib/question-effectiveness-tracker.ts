import {
  QuestionEffectiveness,
  QuestionPool,
  IQuestionEffectiveness,
} from '@/models/QuestionPool';
import { connectToDatabase } from '@/lib/mongodb';
import { Response } from '@/models/Response';
import { Survey } from '@/models/Survey';
import { AIInsight } from '@/models/AIInsight';
import { ActionPlan } from '@/models/ActionPlan';

export interface EffectivenessMetrics {
  questionId: string;
  adaptationId?: string;
  responseRate: number;
  completionRate: number;
  insightQuality: number;
  actionPlanGeneration: number;
  engagementMetrics: {
    averageTimeSpent: number;
    skipRate: number;
    clarificationRequests: number;
  };
  sentimentDistribution: {
    positive: number;
    neutral: number;
    negative: number;
  };
  demographicBreakdown: Record<string, unknown>;
}

export interface EffectivenessAnalysis {
  overallScore: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  trendAnalysis: {
    direction: 'improving' | 'declining' | 'stable';
    changeRate: number;
    confidence: number;
  };
}

export class QuestionEffectivenessTracker {
  private static instance: QuestionEffectivenessTracker;

  public static getInstance(): QuestionEffectivenessTracker {
    if (!QuestionEffectivenessTracker.instance) {
      QuestionEffectivenessTracker.instance =
        new QuestionEffectivenessTracker();
    }
    return QuestionEffectivenessTracker.instance;
  }

  /**
   * Track effectiveness metrics for a question after survey completion
   */
  async trackQuestionEffectiveness(
    surveyId: string,
    questionId: string,
    adaptationId?: string
  ): Promise<EffectivenessMetrics> {
    await connectToDatabase();

    try {
      // Get survey details
      const survey = await Survey.findById(surveyId);
      if (!survey) {
        throw new Error('Survey not found');
      }

      // Calculate metrics
      const metrics = await this.calculateEffectivenessMetrics(
        surveyId,
        questionId,
        adaptationId,
        survey.company_id,
        (survey as any).department_id
      );

      // Save effectiveness record
      const effectivenessRecord = new QuestionEffectiveness({
        questionId,
        adaptationId,
        surveyId,
        companyId: survey.company_id,
        departmentId: (survey as any).department_id,
        responseRate: metrics.responseRate,
        completionRate: metrics.completionRate,
        insightQuality: metrics.insightQuality,
        actionPlanGeneration: metrics.actionPlanGeneration,
        demographicBreakdown: metrics.demographicBreakdown,
        sentimentScores: metrics.sentimentDistribution,
        engagementMetrics: metrics.engagementMetrics,
        measuredAt: new Date(),
      });

      await effectivenessRecord.save();

      // Update question pool effectiveness score
      await this.updateQuestionPoolEffectiveness(
        questionId,
        adaptationId,
        metrics
      );

      return metrics;
    } catch (error) {
      console.error('Error tracking question effectiveness:', error);
      throw new Error('Failed to track question effectiveness');
    }
  }

  /**
   * Calculate comprehensive effectiveness metrics
   */
  private async calculateEffectivenessMetrics(
    surveyId: string,
    questionId: string,
    adaptationId: string | undefined,
    companyId: string,
    _departmentId?: string
  ): Promise<EffectivenessMetrics> {
    // Get all responses for this question
    const responses = await Response.find({
      survey_id: surveyId,
      question_id: questionId,
    });

    // Get survey participants count
    const survey = await Survey.findById(surveyId);
    const totalParticipants = (survey as any)?.invited_users?.length || 0;

    // Calculate response rate
    const responseRate =
      totalParticipants > 0 ? (responses.length / totalParticipants) * 100 : 0;

    // Calculate completion rate (responses with actual values)
    const completedResponses = responses.filter(
      (r: any) =>
        r.responses && r.responses.length > 0 &&
        r.responses.some((resp: any) => 
          resp.response_value !== null &&
          resp.response_value !== undefined &&
          resp.response_value !== ''
        )
    );
    const completionRate =
      responses.length > 0
        ? (completedResponses.length / responses.length) * 100
        : 0;

    // Calculate engagement metrics
    const engagementMetrics = await this.calculateEngagementMetrics(
      responses,
      questionId
    );

    // Calculate insight quality
    const insightQuality = await this.calculateInsightQuality(
      surveyId,
      questionId
    );

    // Calculate action plan generation rate
    const actionPlanGeneration = await this.calculateActionPlanGeneration(
      surveyId,
      questionId
    );

    // Calculate sentiment distribution
    const sentimentDistribution =
      await this.calculateSentimentDistribution(responses);

    // Calculate demographic breakdown
    const demographicBreakdown = await this.calculateDemographicBreakdown(
      responses,
      companyId
    );

    return {
      questionId,
      adaptationId,
      responseRate,
      completionRate,
      insightQuality,
      actionPlanGeneration,
      engagementMetrics,
      sentimentDistribution,
      demographicBreakdown,
    };
  }

  /**
   * Calculate engagement metrics from response data
   */
  private async calculateEngagementMetrics(
    responses: any[],
    _questionId: string
  ): Promise<{
    averageTimeSpent: number;
    skipRate: number;
    clarificationRequests: number;
  }> {
    if (responses.length === 0) {
      return { averageTimeSpent: 0, skipRate: 0, clarificationRequests: 0 };
    }

    // Calculate average time spent (if tracked in metadata)
    const timeSpentValues = responses
      .map((r: any) => r.metadata?.timeSpent)
      .filter((t) => t !== undefined && t !== null);

    const averageTimeSpent =
      timeSpentValues.length > 0
        ? timeSpentValues.reduce((sum, time) => sum + time, 0) /
          timeSpentValues.length
        : 0;

    // Calculate skip rate
    const skippedResponses = responses.filter(
      (r: any) =>
        !r.responses || r.responses.length === 0 ||
        r.responses.every((resp: any) => 
          resp.response_value === null ||
          resp.response_value === undefined ||
          resp.response_value === ''
        )
    );
    const skipRate = (skippedResponses.length / responses.length) * 100;

    // Calculate clarification requests (if tracked)
    const clarificationRequests = responses.filter(
      (r: any) => r.metadata?.clarificationRequested === true
    ).length;

    return {
      averageTimeSpent,
      skipRate,
      clarificationRequests,
    };
  }

  /**
   * Calculate insight quality based on AI analysis results
   */
  private async calculateInsightQuality(
    surveyId: string,
    questionId: string
  ): Promise<number> {
    try {
      // Get AI insights related to this question
      const insights = await AIInsight.find({
        survey_id: surveyId,
        'metadata.sourceQuestions': questionId,
      });

      if (insights.length === 0) return 0;

      // Calculate average confidence score of insights
      const confidenceScores = insights.map(
        (insight) => insight.confidenceScore || 0
      );
      const averageConfidence =
        confidenceScores.length > 0
          ? confidenceScores.reduce((sum, score) => sum + score, 0) /
            confidenceScores.length
          : 0;

      // Weight by insight priority
      const priorityWeights = {
        critical: 1.0,
        high: 0.8,
        medium: 0.6,
        low: 0.4,
      };
      const weightedScore =
        insights.reduce((sum, insight) => {
          const weight =
            priorityWeights[insight.priority as keyof typeof priorityWeights] ||
            0.5;
          return sum + (insight.confidenceScore || 0) * weight;
        }, 0) / insights.length;

      return Math.min(averageConfidence * 0.6 + weightedScore * 0.4, 100);
    } catch (error) {
      console.error('Error calculating insight quality:', error);
      return 0;
    }
  }

  /**
   * Calculate action plan generation rate
   */
  private async calculateActionPlanGeneration(
    surveyId: string,
    questionId: string
  ): Promise<number> {
    try {
      // Get insights related to this question
      const insights = await AIInsight.find({
        survey_id: surveyId,
        'metadata.sourceQuestions': questionId,
      });

      if (insights.length === 0) return 0;

      // Count action plans generated from these insights
      const actionPlans = await ActionPlan.find({
        ai_recommendations: { $in: insights.map((i) => i._id) },
      });

      // Calculate generation rate
      const generationRate = (actionPlans.length / insights.length) * 100;
      return Math.min(generationRate, 100);
    } catch (error) {
      console.error('Error calculating action plan generation:', error);
      return 0;
    }
  }

  /**
   * Calculate sentiment distribution from responses
   */
  private async calculateSentimentDistribution(
    responses: any[]
  ): Promise<{ positive: number; neutral: number; negative: number }> {
    if (responses.length === 0) {
      return { positive: 0, neutral: 0, negative: 0 };
    }

    // For Likert scale responses, map to sentiment
    const sentimentCounts = { positive: 0, neutral: 0, negative: 0 };

    responses.forEach((response: any) => {
      if (response.responses && response.responses.length > 0) {
        response.responses.forEach((resp: any) => {
          if (typeof resp.response_value === 'number') {
            // Assuming 1-5 Likert scale
            if (resp.response_value >= 4) {
              sentimentCounts.positive++;
            } else if (resp.response_value === 3) {
              sentimentCounts.neutral++;
            } else {
              sentimentCounts.negative++;
            }
          }
        });
      }
      
      // Check for pre-calculated sentiment on the response level
      if (response.sentiment_score) {
        if (response.sentiment_score > 0.1) {
          sentimentCounts.positive++;
        } else if (response.sentiment_score > -0.1) {
          sentimentCounts.neutral++;
        } else {
          sentimentCounts.negative++;
        }
      }
    });

    const total = responses.length;
    return {
      positive: (sentimentCounts.positive / total) * 100,
      neutral: (sentimentCounts.neutral / total) * 100,
      negative: (sentimentCounts.negative / total) * 100,
    };
  }

  /**
   * Calculate demographic breakdown of responses
   */
  private async calculateDemographicBreakdown(
    _responses: unknown[],
    _companyId: string
  ): Promise<Record<string, unknown>> {
    const breakdown: Record<string, unknown> = {
      byDepartment: {},
      byRole: {},
      byTenure: {},
      responseDistribution: {},
    };

    // This would require joining with user data
    // For now, return basic structure
    return breakdown;
  }

  /**
   * Update question pool effectiveness score
   */
  private async updateQuestionPoolEffectiveness(
    questionId: string,
    adaptationId: string | undefined,
    metrics: EffectivenessMetrics
  ): Promise<void> {
    try {
      // Calculate overall effectiveness score
      const overallScore = this.calculateOverallEffectivenessScore(metrics);

      if (adaptationId) {
        // Update adaptation effectiveness
        await (QuestionPool as any).updateOne(
          {
            id: questionId,
            'adaptations.id': adaptationId,
          },
          {
            $set: {
              'adaptations.$.effectivenessScore': overallScore,
            },
            $inc: {
              'adaptations.$.usageCount': 1,
            },
          }
        );
      } else {
        // Update original question effectiveness
        await (QuestionPool as any).updateOne(
          { id: questionId },
          {
            $set: { effectivenessScore: overallScore },
            $inc: { usageCount: 1 },
          }
        );
      }
    } catch (error) {
      console.error('Error updating question pool effectiveness:', error);
    }
  }

  /**
   * Calculate overall effectiveness score from metrics
   */
  private calculateOverallEffectivenessScore(
    metrics: EffectivenessMetrics
  ): number {
    const weights = {
      responseRate: 0.25,
      completionRate: 0.25,
      insightQuality: 0.3,
      actionPlanGeneration: 0.2,
    };

    const score =
      metrics.responseRate * weights.responseRate +
      metrics.completionRate * weights.completionRate +
      metrics.insightQuality * weights.insightQuality +
      metrics.actionPlanGeneration * weights.actionPlanGeneration;

    return Math.min(Math.max(score, 0), 100);
  }

  /**
   * Get effectiveness analysis for a question
   */
  async getEffectivenessAnalysis(
    questionId: string,
    companyId: string,
    timeRange?: { start: Date; end: Date }
  ): Promise<EffectivenessAnalysis> {
    await connectToDatabase();

    try {
      const query: any = { questionId, companyId };
      if (timeRange) {
        query.measuredAt = { $gte: timeRange.start, $lte: timeRange.end };
      }

      const effectivenessRecords = await (QuestionEffectiveness as any).find(query)
        .sort({ measuredAt: -1 })
        .limit(50);

      if (effectivenessRecords.length === 0) {
        return {
          overallScore: 0,
          strengths: [],
          weaknesses: [],
          recommendations: [],
          trendAnalysis: {
            direction: 'stable',
            changeRate: 0,
            confidence: 0,
          },
        };
      }

      // Calculate overall score
      const overallScore = this.calculateAverageScore(effectivenessRecords);

      // Identify strengths and weaknesses
      const { strengths, weaknesses } =
        this.identifyStrengthsAndWeaknesses(effectivenessRecords);

      // Generate recommendations
      const recommendations = this.generateRecommendations(
        effectivenessRecords,
        strengths,
        weaknesses
      );

      // Analyze trends
      const trendAnalysis = this.analyzeTrends(effectivenessRecords);

      return {
        overallScore,
        strengths,
        weaknesses,
        recommendations,
        trendAnalysis,
      };
    } catch (error) {
      console.error('Error getting effectiveness analysis:', error);
      throw new Error('Failed to get effectiveness analysis');
    }
  }

  /**
   * Calculate average effectiveness score
   */
  private calculateAverageScore(records: IQuestionEffectiveness[]): number {
    if (records.length === 0) return 0;

    const totalScore = records.reduce((sum, record) => {
      const score = this.calculateOverallEffectivenessScore({
        questionId: record.questionId,
        adaptationId: record.adaptationId,
        responseRate: record.responseRate,
        completionRate: record.completionRate,
        insightQuality: record.insightQuality,
        actionPlanGeneration: record.actionPlanGeneration,
        engagementMetrics: {
          averageTimeSpent: record.engagementMetrics.timeSpent,
          skipRate: record.engagementMetrics.skipRate,
          clarificationRequests: record.engagementMetrics.clarificationRequests,
        },
        sentimentDistribution: record.sentimentScores,
        demographicBreakdown: record.demographicBreakdown,
      });
      return sum + score;
    }, 0);

    return totalScore / records.length;
  }

  /**
   * Identify strengths and weaknesses
   */
  private identifyStrengthsAndWeaknesses(records: IQuestionEffectiveness[]): {
    strengths: string[];
    weaknesses: string[];
  } {
    const strengths: string[] = [];
    const weaknesses: string[] = [];

    // Calculate averages
    const avgResponseRate =
      records.reduce((sum, r) => sum + r.responseRate, 0) / records.length;
    const avgCompletionRate =
      records.reduce((sum, r) => sum + r.completionRate, 0) / records.length;
    const avgInsightQuality =
      records.reduce((sum, r) => sum + r.insightQuality, 0) / records.length;
    const avgActionPlanGeneration =
      records.reduce((sum, r) => sum + r.actionPlanGeneration, 0) /
      records.length;

    // Identify strengths (above 75%)
    if (avgResponseRate > 75) strengths.push('High response rate');
    if (avgCompletionRate > 75) strengths.push('High completion rate');
    if (avgInsightQuality > 75)
      strengths.push('Generates high-quality insights');
    if (avgActionPlanGeneration > 75)
      strengths.push('Effective at driving action plans');

    // Identify weaknesses (below 50%)
    if (avgResponseRate < 50) weaknesses.push('Low response rate');
    if (avgCompletionRate < 50) weaknesses.push('High skip rate');
    if (avgInsightQuality < 50) weaknesses.push('Poor insight generation');
    if (avgActionPlanGeneration < 50)
      weaknesses.push('Limited action plan creation');

    return { strengths, weaknesses };
  }

  /**
   * Generate recommendations based on analysis
   */
  private generateRecommendations(
    records: IQuestionEffectiveness[],
    strengths: string[],
    weaknesses: string[]
  ): string[] {
    const recommendations: string[] = [];

    if (weaknesses.includes('Low response rate')) {
      recommendations.push(
        'Consider reformulating the question to be more engaging'
      );
      recommendations.push('Review question placement in survey flow');
    }

    if (weaknesses.includes('High skip rate')) {
      recommendations.push(
        'Simplify question wording or provide clearer instructions'
      );
      recommendations.push(
        'Consider making the question optional or providing "Not Applicable" option'
      );
    }

    if (weaknesses.includes('Poor insight generation')) {
      recommendations.push('Review question relevance to organizational goals');
      recommendations.push(
        'Consider combining with related questions for better context'
      );
    }

    if (weaknesses.includes('Limited action plan creation')) {
      recommendations.push(
        'Ensure question addresses actionable organizational aspects'
      );
      recommendations.push(
        'Provide clearer connection between question and potential improvements'
      );
    }

    if (strengths.length > 2) {
      recommendations.push(
        'Consider using this question as a template for similar topics'
      );
    }

    return recommendations;
  }

  /**
   * Analyze effectiveness trends over time
   */
  private analyzeTrends(records: IQuestionEffectiveness[]): {
    direction: 'improving' | 'declining' | 'stable';
    changeRate: number;
    confidence: number;
  } {
    if (records.length < 3) {
      return { direction: 'stable', changeRate: 0, confidence: 0 };
    }

    // Sort by date
    const sortedRecords = records.sort(
      (a, b) => a.measuredAt.getTime() - b.measuredAt.getTime()
    );

    // Calculate scores for trend analysis
    const scores = sortedRecords.map((record) =>
      this.calculateOverallEffectivenessScore({
        questionId: record.questionId,
        adaptationId: record.adaptationId,
        responseRate: record.responseRate,
        completionRate: record.completionRate,
        insightQuality: record.insightQuality,
        actionPlanGeneration: record.actionPlanGeneration,
        engagementMetrics: {
          averageTimeSpent: record.engagementMetrics.timeSpent,
          skipRate: record.engagementMetrics.skipRate,
          clarificationRequests: record.engagementMetrics.clarificationRequests,
        },
        sentimentDistribution: record.sentimentScores,
        demographicBreakdown: record.demographicBreakdown,
      })
    );

    // Simple linear trend calculation
    const n = scores.length;
    const sumX = (n * (n + 1)) / 2;
    const sumY = scores.reduce((sum, score) => sum + score, 0);
    const sumXY = scores.reduce(
      (sum, score, index) => sum + score * (index + 1),
      0
    );
    const sumX2 = (n * (n + 1) * (2 * n + 1)) / 6;

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const changeRate = Math.abs(slope);

    let direction: 'improving' | 'declining' | 'stable' = 'stable';
    if (slope > 1) direction = 'improving';
    else if (slope < -1) direction = 'declining';

    // Calculate confidence based on data consistency
    const variance =
      scores.reduce((sum, score) => {
        const mean = sumY / n;
        return sum + Math.pow(score - mean, 2);
      }, 0) / n;

    const confidence = Math.max(0, Math.min(100, 100 - variance / 10));

    return { direction, changeRate, confidence };
  }

  /**
   * Get top performing questions
   */
  async getTopPerformingQuestions(
    companyId: string,
    limit: number = 10,
    timeRange?: { start: Date; end: Date }
  ): Promise<Array<{ questionId: string; score: number; usageCount: number }>> {
    await connectToDatabase();

    const query: Record<string, unknown> = { companyId };
    if (timeRange) {
      query.measuredAt = { $gte: timeRange.start, $lte: timeRange.end };
    }

    const pipeline = [
      { $match: query },
      {
        $group: {
          _id: '$questionId',
          avgResponseRate: { $avg: '$responseRate' },
          avgCompletionRate: { $avg: '$completionRate' },
          avgInsightQuality: { $avg: '$insightQuality' },
          avgActionPlanGeneration: { $avg: '$actionPlanGeneration' },
          usageCount: { $sum: 1 },
        },
      },
      {
        $addFields: {
          overallScore: {
            $add: [
              { $multiply: ['$avgResponseRate', 0.25] },
              { $multiply: ['$avgCompletionRate', 0.25] },
              { $multiply: ['$avgInsightQuality', 0.3] },
              { $multiply: ['$avgActionPlanGeneration', 0.2] },
            ],
          },
        },
      },
      { $sort: { overallScore: -1 } },
      { $limit: limit },
    ];

    const results = await (QuestionEffectiveness as any).aggregate(pipeline);

    return results.map((result) => ({
      questionId: result._id,
      score: result.overallScore,
      usageCount: result.usageCount,
    }));
  }
}

export const questionEffectivenessTracker =
  QuestionEffectivenessTracker.getInstance();
