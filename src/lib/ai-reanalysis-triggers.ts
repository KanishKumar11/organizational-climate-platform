import DemographicVersioningService from './demographic-versioning';
import { aiService, processSurveyResponses } from './ai-service';
import { auditLog } from './audit-service';
import Survey from '../models/Survey';
import Response from '../models/Response';
import AIInsight from '../models/AIInsight';
import DemographicSnapshot, {
  DemographicChange,
} from '../models/DemographicSnapshot';

export interface ReanalysisConfig {
  trigger_threshold: number; // Impact score threshold (0-100)
  auto_reanalyze: boolean;
  notification_enabled: boolean;
  incremental_only: boolean; // Only reanalyze affected segments
}

export interface ReanalysisResult {
  survey_id: string;
  triggered_by: string;
  trigger_reason: string;
  impact_score: number;
  affected_segments: string[];
  new_insights: any[];
  updated_insights: any[];
  processing_time_ms: number;
  incremental: boolean;
}

export interface DemographicChangeNotification {
  survey_id: string;
  company_id: string;
  change_type:
    | 'demographic_update'
    | 'user_addition'
    | 'user_removal'
    | 'role_change';
  impact_score: number;
  affected_users: number;
  recommendations: string[];
  requires_reanalysis: boolean;
}

export class AIReanalysisTriggerService {
  private static readonly DEFAULT_CONFIG: ReanalysisConfig = {
    trigger_threshold: 30,
    auto_reanalyze: true,
    notification_enabled: true,
    incremental_only: true,
  };

  /**
   * Monitor demographic changes and trigger re-analysis if needed
   */
  static async onDemographicChange(
    surveyId: string,
    companyId: string,
    changes: DemographicChange[],
    triggeredBy: string,
    config: Partial<ReanalysisConfig> = {}
  ): Promise<ReanalysisResult | null> {
    const finalConfig = { ...this.DEFAULT_CONFIG, ...config };

    try {
      // Calculate impact score
      const impactAnalysis =
        await DemographicVersioningService.analyzeDemographicImpact(surveyId);

      if (!impactAnalysis) {
        console.log('No impact analysis available for demographic changes');
        return null;
      }

      // Check if reanalysis is needed
      const shouldReanalyze =
        impactAnalysis.impact_score >= finalConfig.trigger_threshold;

      // Send notification regardless of auto-reanalysis setting
      if (finalConfig.notification_enabled) {
        await this.sendDemographicChangeNotification({
          survey_id: surveyId,
          company_id: companyId,
          change_type: this.determineChangeType(changes),
          impact_score: impactAnalysis.impact_score,
          affected_users: impactAnalysis.affected_users,
          recommendations: this.generateChangeRecommendations(
            impactAnalysis,
            changes
          ),
          requires_reanalysis: shouldReanalyze,
        });
      }

      // Trigger automatic reanalysis if configured and threshold met
      if (finalConfig.auto_reanalyze && shouldReanalyze) {
        return await this.triggerReanalysis(
          surveyId,
          triggeredBy,
          `Demographic changes with ${impactAnalysis.impact_score}% impact`,
          impactAnalysis,
          finalConfig.incremental_only
        );
      }

      return null;
    } catch (error) {
      console.error('Error in demographic change monitoring:', error);
      throw error;
    }
  }

  /**
   * Manually trigger AI re-analysis for a survey
   */
  static async triggerReanalysis(
    surveyId: string,
    triggeredBy: string,
    reason: string,
    impactAnalysis?: any,
    incrementalOnly: boolean = true
  ): Promise<ReanalysisResult> {
    const startTime = Date.now();

    try {
      // Get survey and existing responses
      const survey = await Survey.findById(surveyId);
      if (!survey) {
        throw new Error('Survey not found');
      }

      const responses = await Response.find({ survey_id: surveyId });

      // Get current demographic snapshot
      const currentSnapshot =
        await DemographicSnapshot.findLatestBySurvey(surveyId);
      if (!currentSnapshot) {
        throw new Error('No demographic snapshot found for survey');
      }

      let affectedSegments: string[] = [];
      let responsesToAnalyze = responses;

      // If incremental, only analyze affected segments
      if (incrementalOnly && impactAnalysis) {
        affectedSegments = [
          ...impactAnalysis.affected_departments,
          ...impactAnalysis.affected_roles,
        ];

        // Filter responses to only affected users
        const affectedUserIds = new Set(
          currentSnapshot.demographics
            .filter(
              (d) =>
                affectedSegments.includes(d.department) ||
                affectedSegments.includes(d.role)
            )
            .map((d) => d.user_id)
        );

        responsesToAnalyze = responses.filter((r) =>
          affectedUserIds.has(r.user_id)
        );
      }

      // Group responses by demographic segments for analysis
      const segmentedResponses = this.groupResponsesByDemographics(
        responsesToAnalyze,
        currentSnapshot
      );

      const newInsights: any[] = [];
      const updatedInsights: any[] = [];

      // Process each segment
      for (const [segment, segmentResponses] of Object.entries(
        segmentedResponses
      )) {
        const [department, role] = segment.split('|');

        const context = {
          department,
          role,
          tenure: this.calculateAverageTenure(
            segmentResponses,
            currentSnapshot
          ),
          teamSize: segmentResponses.length,
        };

        // Generate new insights for this segment
        const analysisResult = await processSurveyResponses(
          segmentResponses,
          context
        );

        for (const insight of analysisResult.insights) {
          const aiInsight = new AIInsight({
            survey_id: surveyId,
            type: 'pattern',
            category: insight.category,
            title: `${segment}: ${insight.insight}`,
            description: insight.insight,
            confidence_score: insight.confidence,
            affected_segments: [segment],
            recommended_actions: insight.recommendations,
            priority: insight.priority,
            metadata: {
              reanalysis_trigger: reason,
              segment,
              demographic_version: currentSnapshot.version,
              processing_timestamp: new Date(),
            },
          });

          await aiInsight.save();
          newInsights.push(aiInsight);
        }
      }

      // Update existing insights that are no longer valid
      const existingInsights = await AIInsight.find({
        survey_id: surveyId,
        'metadata.segment': { $in: affectedSegments },
      });

      for (const existingInsight of existingInsights) {
        // Mark as outdated or update with new demographic context
        existingInsight.metadata.outdated = true;
        existingInsight.metadata.superseded_by_reanalysis = new Date();
        await existingInsight.save();
        updatedInsights.push(existingInsight);
      }

      const processingTime = Date.now() - startTime;

      // Log the reanalysis
      await auditLog({
        user_id: triggeredBy,
        action: 'ai_reanalysis_triggered',
        resource_type: 'survey',
        resource_id: surveyId,
        details: {
          reason,
          impact_score: impactAnalysis?.impact_score || 0,
          affected_segments: affectedSegments,
          new_insights_count: newInsights.length,
          updated_insights_count: updatedInsights.length,
          processing_time_ms: processingTime,
          incremental: incrementalOnly,
        },
        ip_address: '',
        user_agent: '',
      });

      return {
        survey_id: surveyId,
        triggered_by: triggeredBy,
        trigger_reason: reason,
        impact_score: impactAnalysis?.impact_score || 0,
        affected_segments: affectedSegments,
        new_insights: newInsights,
        updated_insights: updatedInsights,
        processing_time_ms: processingTime,
        incremental: incrementalOnly,
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;

      // Log the error
      await auditLog({
        user_id: triggeredBy,
        action: 'ai_reanalysis_failed',
        resource_type: 'survey',
        resource_id: surveyId,
        details: {
          reason,
          error: error instanceof Error ? error.message : 'Unknown error',
          processing_time_ms: processingTime,
        },
        ip_address: '',
        user_agent: '',
      });

      throw error;
    }
  }

  /**
   * Assess demographic change impact and determine if reanalysis is needed
   */
  static async assessDemographicImpact(
    surveyId: string,
    changes: DemographicChange[]
  ): Promise<{
    impact_score: number;
    requires_reanalysis: boolean;
    affected_segments: string[];
    recommendations: string[];
  }> {
    const impactAnalysis =
      await DemographicVersioningService.analyzeDemographicImpact(surveyId);

    if (!impactAnalysis) {
      return {
        impact_score: 0,
        requires_reanalysis: false,
        affected_segments: [],
        recommendations: [
          'Create demographic snapshots to enable impact analysis',
        ],
      };
    }

    const requiresReanalysis =
      impactAnalysis.impact_score >= this.DEFAULT_CONFIG.trigger_threshold;
    const recommendations = this.generateChangeRecommendations(
      impactAnalysis,
      changes
    );

    return {
      impact_score: impactAnalysis.impact_score,
      requires_reanalysis: requiresReanalysis,
      affected_segments: [
        ...impactAnalysis.affected_departments,
        ...impactAnalysis.affected_roles,
      ],
      recommendations,
    };
  }

  /**
   * Get reanalysis configuration for a survey/company
   */
  static async getReanalysisConfig(
    surveyId: string,
    companyId: string
  ): Promise<ReanalysisConfig> {
    // In a real implementation, this would fetch from database
    // For now, return default config
    return this.DEFAULT_CONFIG;
  }

  /**
   * Update reanalysis configuration
   */
  static async updateReanalysisConfig(
    surveyId: string,
    companyId: string,
    config: Partial<ReanalysisConfig>,
    updatedBy: string
  ): Promise<ReanalysisConfig> {
    // In a real implementation, this would save to database
    const newConfig = { ...this.DEFAULT_CONFIG, ...config };

    await auditLog({
      user_id: updatedBy,
      action: 'reanalysis_config_updated',
      resource_type: 'survey',
      resource_id: surveyId,
      details: {
        old_config: this.DEFAULT_CONFIG,
        new_config: newConfig,
      },
      ip_address: '',
      user_agent: '',
    });

    return newConfig;
  }

  /**
   * Send notification about demographic changes
   */
  private static async sendDemographicChangeNotification(
    notification: DemographicChangeNotification
  ): Promise<void> {
    // In a real implementation, this would integrate with the notification service
    console.log('Demographic change notification:', notification);

    // Log the notification
    await auditLog({
      user_id: 'system',
      action: 'demographic_change_notification',
      resource_type: 'survey',
      resource_id: notification.survey_id,
      details: notification,
      ip_address: '',
      user_agent: '',
    });
  }

  /**
   * Group responses by demographic segments
   */
  private static groupResponsesByDemographics(
    responses: any[],
    snapshot: any
  ): Record<string, any[]> {
    const grouped: Record<string, any[]> = {};

    for (const response of responses) {
      const userDemo = snapshot.demographics.find(
        (d: any) => d.user_id === response.user_id
      );
      if (userDemo) {
        const segment = `${userDemo.department}|${userDemo.role}`;
        if (!grouped[segment]) {
          grouped[segment] = [];
        }
        grouped[segment].push(response);
      }
    }

    return grouped;
  }

  /**
   * Calculate average tenure for a group of responses
   */
  private static calculateAverageTenure(
    responses: any[],
    snapshot: any
  ): string {
    const tenures = responses
      .map((r) => {
        const userDemo = snapshot.demographics.find(
          (d: any) => d.user_id === r.user_id
        );
        return userDemo?.tenure;
      })
      .filter(Boolean);

    // Simple tenure calculation - in real implementation would be more sophisticated
    const tenureMap = {
      new: 0,
      '3-6 months': 1,
      '6-12 months': 2,
      '1-3 years': 3,
      '3-5 years': 4,
      '5+ years': 5,
    };
    const avgTenure =
      tenures.reduce(
        (sum, t) => sum + (tenureMap[t as keyof typeof tenureMap] || 0),
        0
      ) / tenures.length;

    if (avgTenure < 1) return 'new';
    if (avgTenure < 2) return '3-6 months';
    if (avgTenure < 3) return '6-12 months';
    if (avgTenure < 4) return '1-3 years';
    if (avgTenure < 5) return '3-5 years';
    return '5+ years';
  }

  /**
   * Determine the type of demographic change
   */
  private static determineChangeType(
    changes: DemographicChange[]
  ): DemographicChangeNotification['change_type'] {
    const hasRoleChanges = changes.some((c) => c.field.includes('.role'));
    const hasAdditions = changes.some((c) => c.old_value === null);
    const hasRemovals = changes.some((c) => c.new_value === null);

    if (hasRoleChanges) return 'role_change';
    if (hasAdditions) return 'user_addition';
    if (hasRemovals) return 'user_removal';
    return 'demographic_update';
  }

  /**
   * Generate recommendations based on demographic changes
   */
  private static generateChangeRecommendations(
    impactAnalysis: any,
    changes: DemographicChange[]
  ): string[] {
    const recommendations: string[] = [];

    if (impactAnalysis.impact_score > 70) {
      recommendations.push(
        'High impact changes detected - immediate AI re-analysis recommended'
      );
      recommendations.push(
        'Review all existing insights and action plans for affected segments'
      );
    }

    if (impactAnalysis.changes_summary.additions > 5) {
      recommendations.push(
        'Significant user additions - update survey targeting and audience segmentation'
      );
    }

    if (impactAnalysis.changes_summary.removals > 3) {
      recommendations.push(
        'User removals detected - validate existing survey responses and insights'
      );
    }

    const roleChanges = changes.filter((c) => c.field.includes('.role'));
    if (roleChanges.length > 0) {
      recommendations.push(
        'Role changes detected - update permission scoping and dashboard access'
      );
      recommendations.push(
        'Review role-based insights and recommendations for accuracy'
      );
    }

    const deptChanges = changes.filter((c) => c.field.includes('.department'));
    if (deptChanges.length > 0) {
      recommendations.push(
        'Department changes detected - review department-specific surveys and insights'
      );
      recommendations.push(
        'Update department-based action plans and microclimate targeting'
      );
    }

    if (impactAnalysis.affected_departments.length > 3) {
      recommendations.push(
        'Multiple departments affected - consider department-specific re-analysis'
      );
    }

    return recommendations;
  }
}

export default AIReanalysisTriggerService;
