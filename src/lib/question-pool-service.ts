import QuestionBank from '@/models/QuestionBank';
import { connectDB } from '@/lib/db';

export interface QuestionPoolStats {
  totalQuestions: number;
  activeQuestions: number;
  categoriesCount: number;
  averageEffectiveness: number;
  utilizationRate: number;
  aiGeneratedCount: number;
  humanCreatedCount: number;
}

export interface CategoryStats {
  category: string;
  subcategories: string[];
  totalQuestions: number;
  activeQuestions: number;
  averageEffectiveness: number;
  totalUsage: number;
  averageResponseRate: number;
  lastUsed?: Date;
}

export interface QuestionEffectivenessMetrics {
  questionId: string;
  text: string;
  category: string;
  effectivenessScore: number;
  usageCount: number;
  responseRate: number;
  lastUsed?: Date;
  trend: 'improving' | 'declining' | 'stable';
  recommendations: string[];
}

export interface QuestionLifecycleAction {
  questionId: string;
  action: 'activate' | 'deprecate' | 'archive' | 'restore';
  reason?: string;
  performedBy: string;
  timestamp: Date;
}

export class QuestionPoolService {
  /**
   * Get comprehensive statistics about the question pool
   */
  static async getPoolStatistics(
    companyId?: string
  ): Promise<QuestionPoolStats> {
    await connectDB();

    const baseQuery = this.buildBaseQuery(companyId);

    const [stats] = await QuestionBank.aggregate([
      { $match: baseQuery },
      {
        $group: {
          _id: null,
          totalQuestions: { $sum: 1 },
          activeQuestions: {
            $sum: { $cond: [{ $eq: ['$is_active', true] }, 1, 0] },
          },
          categoriesCount: { $addToSet: '$category' },
          averageEffectiveness: { $avg: '$metrics.insight_score' },
          totalUsage: { $sum: '$metrics.usage_count' },
          aiGeneratedCount: {
            $sum: { $cond: [{ $eq: ['$is_ai_generated', true] }, 1, 0] },
          },
          humanCreatedCount: {
            $sum: { $cond: [{ $eq: ['$is_ai_generated', false] }, 1, 0] },
          },
        },
      },
    ]);

    const usedQuestions = await QuestionBank.countDocuments({
      ...baseQuery,
      'metrics.usage_count': { $gt: 0 },
    });

    return {
      totalQuestions: stats?.totalQuestions || 0,
      activeQuestions: stats?.activeQuestions || 0,
      categoriesCount: stats?.categoriesCount?.length || 0,
      averageEffectiveness: stats?.averageEffectiveness || 0,
      utilizationRate:
        stats?.totalQuestions > 0
          ? (usedQuestions / stats.totalQuestions) * 100
          : 0,
      aiGeneratedCount: stats?.aiGeneratedCount || 0,
      humanCreatedCount: stats?.humanCreatedCount || 0,
    };
  }

  /**
   * Get detailed statistics for each category
   */
  static async getCategoryStatistics(
    companyId?: string
  ): Promise<CategoryStats[]> {
    await connectDB();

    const baseQuery = this.buildBaseQuery(companyId);

    const categoryStats = await QuestionBank.aggregate([
      { $match: baseQuery },
      {
        $group: {
          _id: '$category',
          subcategories: { $addToSet: '$subcategory' },
          totalQuestions: { $sum: 1 },
          activeQuestions: {
            $sum: { $cond: [{ $eq: ['$is_active', true] }, 1, 0] },
          },
          averageEffectiveness: { $avg: '$metrics.insight_score' },
          totalUsage: { $sum: '$metrics.usage_count' },
          averageResponseRate: { $avg: '$metrics.response_rate' },
          lastUsed: { $max: '$metrics.last_used' },
        },
      },
      { $sort: { totalQuestions: -1 } },
    ]);

    return categoryStats.map((stat) => ({
      category: stat._id,
      subcategories: stat.subcategories.filter(Boolean),
      totalQuestions: stat.totalQuestions,
      activeQuestions: stat.activeQuestions,
      averageEffectiveness: stat.averageEffectiveness || 0,
      totalUsage: stat.totalUsage || 0,
      averageResponseRate: stat.averageResponseRate || 0,
      lastUsed: stat.lastUsed,
    }));
  }

  /**
   * Analyze question effectiveness and provide recommendations
   */
  static async analyzeQuestionEffectiveness(
    companyId?: string,
    category?: string
  ): Promise<QuestionEffectivenessMetrics[]> {
    await connectDB();

    const baseQuery = this.buildBaseQuery(companyId);
    if (category) baseQuery.category = category;

    // Only analyze questions with sufficient usage data
    baseQuery['metrics.usage_count'] = { $gte: 3 };

    const questions = await QuestionBank.find(baseQuery)
      .select('text category metrics created_at updated_at')
      .lean();

    return questions.map((question) => {
      const effectiveness = question.metrics.insight_score;
      const usageCount = question.metrics.usage_count;
      const responseRate = question.metrics.response_rate;

      // Determine trend (simplified logic)
      const trend = this.calculateTrend(question);

      // Generate recommendations
      const recommendations = this.generateRecommendations(
        effectiveness,
        usageCount,
        responseRate
      );

      return {
        questionId: question._id.toString(),
        text: question.text,
        category: question.category,
        effectivenessScore: effectiveness,
        usageCount,
        responseRate,
        lastUsed: question.metrics.last_used,
        trend,
        recommendations,
      };
    });
  }

  /**
   * Get questions that need lifecycle management attention
   */
  static async getQuestionsNeedingAttention(companyId?: string) {
    await connectDB();

    const baseQuery = this.buildBaseQuery(companyId);

    // Find questions that need attention
    const [neverUsed, lowEffectiveness, lowResponseRate, overused, outdated] =
      await Promise.all([
        // Never used questions (older than 30 days)
        QuestionBank.find({
          ...baseQuery,
          'metrics.usage_count': 0,
          created_at: { $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        })
          .limit(20)
          .lean(),

        // Low effectiveness questions
        QuestionBank.find({
          ...baseQuery,
          'metrics.usage_count': { $gte: 5 },
          'metrics.insight_score': { $lt: 4 },
        })
          .limit(20)
          .lean(),

        // Low response rate questions
        QuestionBank.find({
          ...baseQuery,
          'metrics.usage_count': { $gte: 3 },
          'metrics.response_rate': { $lt: 60 },
        })
          .limit(20)
          .lean(),

        // Overused questions (might need alternatives)
        QuestionBank.find({
          ...baseQuery,
          'metrics.usage_count': { $gt: 100 },
        })
          .limit(10)
          .lean(),

        // Outdated questions (not used in 90 days)
        QuestionBank.find({
          ...baseQuery,
          'metrics.last_used': {
            $lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
          },
          'metrics.usage_count': { $gt: 0 },
        })
          .limit(20)
          .lean(),
      ]);

    return {
      neverUsed: neverUsed.map((q) => ({
        id: q._id,
        text: q.text,
        category: q.category,
        createdAt: q.created_at,
        recommendation: 'Review relevance or promote usage',
      })),
      lowEffectiveness: lowEffectiveness.map((q) => ({
        id: q._id,
        text: q.text,
        category: q.category,
        effectivenessScore: q.metrics.insight_score,
        usageCount: q.metrics.usage_count,
        recommendation: 'Consider rewording or deprecating',
      })),
      lowResponseRate: lowResponseRate.map((q) => ({
        id: q._id,
        text: q.text,
        category: q.category,
        responseRate: q.metrics.response_rate,
        recommendation: 'Simplify question or improve clarity',
      })),
      overused: overused.map((q) => ({
        id: q._id,
        text: q.text,
        category: q.category,
        usageCount: q.metrics.usage_count,
        recommendation: 'Create alternative versions',
      })),
      outdated: outdated.map((q) => ({
        id: q._id,
        text: q.text,
        category: q.category,
        lastUsed: q.metrics.last_used,
        recommendation: 'Review relevance or archive',
      })),
    };
  }

  /**
   * Perform bulk lifecycle actions on questions
   */
  static async performLifecycleActions(
    actions: QuestionLifecycleAction[],
    companyId?: string
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    await connectDB();

    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const action of actions) {
      try {
        const baseQuery = this.buildBaseQuery(companyId);
        baseQuery._id = action.questionId;

        let updateData: any = { updated_at: new Date() };

        switch (action.action) {
          case 'activate':
            updateData.is_active = true;
            updateData.$unset = { deprecated_at: 1, archived_at: 1 };
            break;
          case 'deprecate':
            updateData.is_active = false;
            updateData.deprecated_at = action.timestamp;
            if (action.reason) updateData.deprecation_reason = action.reason;
            break;
          case 'archive':
            updateData.is_active = false;
            updateData.archived_at = action.timestamp;
            if (action.reason) updateData.archive_reason = action.reason;
            break;
          case 'restore':
            updateData.is_active = true;
            updateData.$unset = {
              deprecated_at: 1,
              archived_at: 1,
              deprecation_reason: 1,
              archive_reason: 1,
            };
            break;
        }

        const result = await QuestionBank.updateOne(baseQuery, updateData);

        if (result.matchedCount > 0) {
          success++;
        } else {
          failed++;
          errors.push(
            `Question ${action.questionId} not found or no permission`
          );
        }
      } catch (error) {
        failed++;
        errors.push(
          `Failed to ${action.action} question ${action.questionId}: ${error}`
        );
      }
    }

    return { success, failed, errors };
  }

  /**
   * Track question usage and update metrics
   */
  static async trackQuestionUsage(
    questionId: string,
    surveyId: string,
    responseCount: number = 0,
    responseRate?: number
  ): Promise<void> {
    await connectDB();

    const updateData: any = {
      $inc: { 'metrics.usage_count': 1 },
      $set: { 'metrics.last_used': new Date() },
    };

    if (responseRate !== undefined) {
      updateData.$set['metrics.response_rate'] = responseRate;
    }

    await QuestionBank.findByIdAndUpdate(questionId, updateData);
  }

  /**
   * Update question effectiveness score based on AI analysis
   */
  static async updateEffectivenessScore(
    questionId: string,
    effectivenessScore: number,
    analysisData?: any
  ): Promise<void> {
    await connectDB();

    const updateData: any = {
      'metrics.insight_score': Math.max(0, Math.min(10, effectivenessScore)),
      'metrics.last_analyzed': new Date(),
    };

    if (analysisData) {
      updateData['analysis_data'] = analysisData;
    }

    await QuestionBank.findByIdAndUpdate(questionId, updateData);
  }

  /**
   * Get question usage trends over time
   */
  static async getUsageTrends(
    companyId?: string,
    timeframe: number = 30
  ): Promise<any[]> {
    await connectDB();

    const baseQuery = this.buildBaseQuery(companyId);
    const startDate = new Date(Date.now() - timeframe * 24 * 60 * 60 * 1000);

    return await QuestionBank.aggregate([
      { $match: { ...baseQuery, 'metrics.last_used': { $gte: startDate } } },
      {
        $group: {
          _id: {
            date: {
              $dateToString: { format: '%Y-%m-%d', date: '$metrics.last_used' },
            },
            category: '$category',
          },
          usageCount: { $sum: '$metrics.usage_count' },
          questionCount: { $sum: 1 },
          avgEffectiveness: { $avg: '$metrics.insight_score' },
        },
      },
      { $sort: { '_id.date': 1 } },
    ]);
  }

  /**
   * Generate optimization recommendations for the question pool
   */
  static async generateOptimizationRecommendations(
    companyId?: string
  ): Promise<any[]> {
    const [stats, categoryStats, needingAttention] = await Promise.all([
      this.getPoolStatistics(companyId),
      this.getCategoryStatistics(companyId),
      this.getQuestionsNeedingAttention(companyId),
    ]);

    const recommendations = [];

    // Low utilization recommendation
    if (stats.utilizationRate < 50) {
      recommendations.push({
        type: 'utilization',
        priority: 'high',
        title: 'Low Question Utilization',
        description: `Only ${stats.utilizationRate.toFixed(1)}% of questions are being used`,
        action:
          'Review and promote unused questions or archive irrelevant ones',
        impact: 'Improve question pool efficiency',
      });
    }

    // Category imbalance recommendation
    const imbalancedCategories = categoryStats.filter(
      (cat) => cat.totalQuestions < 5 || cat.averageEffectiveness < 5
    );
    if (imbalancedCategories.length > 0) {
      recommendations.push({
        type: 'category_balance',
        priority: 'medium',
        title: 'Category Imbalance',
        description: `${imbalancedCategories.length} categories need attention`,
        categories: imbalancedCategories.map((cat) => cat.category),
        action: 'Add more questions to underrepresented categories',
        impact: 'Better coverage of organizational aspects',
      });
    }

    // Effectiveness improvement recommendation
    if (stats.averageEffectiveness < 6) {
      recommendations.push({
        type: 'effectiveness',
        priority: 'high',
        title: 'Low Average Effectiveness',
        description: `Average effectiveness score is ${stats.averageEffectiveness.toFixed(1)}/10`,
        action: 'Review and improve low-performing questions',
        impact: 'Generate more actionable insights',
      });
    }

    // Lifecycle management recommendations
    const totalNeedingAttention = Object.values(needingAttention).reduce(
      (sum, arr) => sum + arr.length,
      0
    );

    if (totalNeedingAttention > 10) {
      recommendations.push({
        type: 'lifecycle',
        priority: 'medium',
        title: 'Questions Need Lifecycle Management',
        description: `${totalNeedingAttention} questions need attention`,
        breakdown: {
          neverUsed: needingAttention.neverUsed.length,
          lowEffectiveness: needingAttention.lowEffectiveness.length,
          lowResponseRate: needingAttention.lowResponseRate.length,
          overused: needingAttention.overused.length,
          outdated: needingAttention.outdated.length,
        },
        action: 'Perform lifecycle management actions',
        impact: 'Maintain question pool quality',
      });
    }

    return recommendations;
  }

  // Helper methods
  private static buildBaseQuery(companyId?: string): any {
    const query: any = {};

    if (companyId) {
      query.$or = [
        { company_id: companyId },
        { company_id: { $exists: false } },
      ];
    }

    return query;
  }

  private static calculateTrend(
    question: any
  ): 'improving' | 'declining' | 'stable' {
    // Simplified trend calculation - in real implementation, this would analyze historical data
    const effectiveness = question.metrics.insight_score;
    const usageCount = question.metrics.usage_count;

    if (effectiveness > 7 && usageCount > 10) return 'improving';
    if (effectiveness < 4 || usageCount === 0) return 'declining';
    return 'stable';
  }

  private static generateRecommendations(
    effectiveness: number,
    usageCount: number,
    responseRate: number
  ): string[] {
    const recommendations = [];

    if (effectiveness < 4) {
      recommendations.push('Consider rewording or deprecating this question');
    } else if (effectiveness < 6) {
      recommendations.push('Review question clarity and relevance');
    }

    if (responseRate < 60) {
      recommendations.push('Simplify question to improve response rate');
    }

    if (usageCount === 0) {
      recommendations.push('Promote usage or review relevance');
    } else if (usageCount > 50) {
      recommendations.push('Consider creating alternative versions');
    }

    if (recommendations.length === 0) {
      recommendations.push('Question is performing well');
    }

    return recommendations;
  }
}
