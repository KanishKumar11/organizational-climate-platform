import DemographicSnapshot, {
  IDemographicSnapshot,
  DemographicData,
  DemographicChange,
} from '../models/DemographicSnapshot';
import User from '../models/User';
import Survey from '../models/Survey';
import { auditLog } from './audit-service';

export interface DemographicVersioningOptions {
  includeInactive?: boolean;
  customAttributes?: string[];
}

export interface DemographicImpactAnalysis {
  affected_users: number;
  affected_departments: string[];
  affected_roles: string[];
  changes_summary: {
    additions: number;
    modifications: number;
    removals: number;
  };
  impact_score: number; // 0-100 scale
}

export interface DemographicComparisonResult {
  changes: DemographicChange[];
  impact_analysis: DemographicImpactAnalysis;
  recommendations: string[];
}

export class DemographicVersioningService {
  /**
   * Create a new demographic snapshot for a survey
   */
  static async createSnapshot(
    surveyId: string,
    companyId: string,
    createdBy: string,
    reason: string,
    options: DemographicVersioningOptions = {}
  ): Promise<IDemographicSnapshot> {
    try {
      // Verify survey exists
      const survey = await Survey.findById(surveyId);
      if (!survey) {
        throw new Error('Survey not found');
      }

      // Get next version number
      const version = await DemographicSnapshot.getNextVersion(surveyId);

      // Collect demographic data
      const demographics = await this.collectDemographicData(
        companyId,
        survey.department_ids,
        options
      );

      // Create snapshot
      const snapshot = new DemographicSnapshot({
        survey_id: surveyId,
        company_id: companyId,
        version,
        demographics,
        created_by: createdBy,
        reason,
        changes: [], // Will be populated when comparing with previous version
      });

      // Compare with previous version if exists
      const previousSnapshot =
        await DemographicSnapshot.findLatestBySurvey(surveyId);
      if (previousSnapshot && previousSnapshot.version < version) {
        snapshot.changes = snapshot.compareWith(previousSnapshot);
      }

      await snapshot.save();

      // Trigger AI re-analysis if there are significant changes
      if (snapshot.changes.length > 0) {
        try {
          const { default: AIReanalysisTriggerService } = await import(
            './ai-reanalysis-triggers'
          );
          await AIReanalysisTriggerService.onDemographicChange(
            surveyId,
            companyId,
            snapshot.changes,
            createdBy
          );
        } catch (error) {
          console.error('Failed to trigger AI re-analysis:', error);
          // Don't fail the snapshot creation if re-analysis fails
        }
      }

      // Log audit trail
      await auditLog({
        user_id: createdBy,
        action: 'demographic_snapshot_created',
        resource_type: 'demographic_snapshot',
        resource_id: snapshot._id.toString(),
        details: {
          survey_id: surveyId,
          version,
          reason,
          total_users: demographics.length,
          changes_count: snapshot.changes.length,
        },
        ip_address: '', // Will be populated by middleware
        user_agent: '', // Will be populated by middleware
      });

      return snapshot;
    } catch (error) {
      throw new Error(
        `Failed to create demographic snapshot: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Collect current demographic data for users
   */
  private static async collectDemographicData(
    companyId: string,
    departmentIds?: string[],
    options: DemographicVersioningOptions = {}
  ): Promise<DemographicData[]> {
    const query: any = { company_id: companyId };

    if (!options.includeInactive) {
      query.is_active = true;
    }

    if (departmentIds && departmentIds.length > 0) {
      query.department_id = { $in: departmentIds };
    }

    const users = await User.find(query).select(
      'name email role department_id preferences created_at'
    );

    return users.map((user) => {
      const createdAt = new Date(user.created_at);
      const now = new Date();
      const monthsDiff =
        (now.getFullYear() - createdAt.getFullYear()) * 12 +
        (now.getMonth() - createdAt.getMonth());

      let tenure = 'new';
      if (monthsDiff >= 60) tenure = '5+ years';
      else if (monthsDiff >= 36) tenure = '3-5 years';
      else if (monthsDiff >= 12) tenure = '1-3 years';
      else if (monthsDiff >= 6) tenure = '6-12 months';
      else if (monthsDiff >= 3) tenure = '3-6 months';

      const demographicData: DemographicData = {
        user_id: user._id.toString(),
        department: user.department_id,
        role: user.role,
        tenure,
        custom_attributes: {},
      };

      // Add custom attributes if specified
      if (options.customAttributes) {
        for (const attr of options.customAttributes) {
          if (user.preferences && (user.preferences as any)[attr]) {
            demographicData.custom_attributes[attr] = (user.preferences as any)[
              attr
            ];
          }
        }
      }

      return demographicData;
    });
  }

  /**
   * Compare two demographic snapshots
   */
  static async compareSnapshots(
    snapshot1Id: string,
    snapshot2Id: string
  ): Promise<DemographicComparisonResult> {
    const [snapshot1, snapshot2] = await Promise.all([
      DemographicSnapshot.findById(snapshot1Id),
      DemographicSnapshot.findById(snapshot2Id),
    ]);

    if (!snapshot1 || !snapshot2) {
      throw new Error('One or both snapshots not found');
    }

    const changes = snapshot1.compareWith(snapshot2);
    const impactAnalysis = this.analyzeImpact(changes, snapshot1, snapshot2);
    const recommendations = this.generateRecommendations(
      impactAnalysis,
      changes
    );

    return {
      changes,
      impact_analysis: impactAnalysis,
      recommendations,
    };
  }

  /**
   * Analyze the impact of demographic changes
   */
  private static analyzeImpact(
    changes: DemographicChange[],
    snapshot1: IDemographicSnapshot,
    snapshot2: IDemographicSnapshot
  ): DemographicImpactAnalysis {
    const affectedUsers = new Set<string>();
    const affectedDepartments = new Set<string>();
    const affectedRoles = new Set<string>();

    let additions = 0;
    let modifications = 0;
    let removals = 0;

    for (const change of changes) {
      if (change.field.startsWith('user.')) {
        const userId = change.field.split('.')[1];
        affectedUsers.add(userId);

        if (change.old_value === null) {
          additions++;
        } else if (change.new_value === null) {
          removals++;
        } else {
          modifications++;
        }
      } else {
        const userId = change.field.split('.')[0];
        affectedUsers.add(userId);
        modifications++;
      }

      // Track affected departments and roles
      if (change.old_value && typeof change.old_value === 'object') {
        if (change.old_value.department)
          affectedDepartments.add(change.old_value.department);
        if (change.old_value.role) affectedRoles.add(change.old_value.role);
      }
      if (change.new_value && typeof change.new_value === 'object') {
        if (change.new_value.department)
          affectedDepartments.add(change.new_value.department);
        if (change.new_value.role) affectedRoles.add(change.new_value.role);
      }
    }

    // Calculate impact score (0-100)
    const totalUsers = Math.max(
      snapshot1.metadata.total_users,
      snapshot2.metadata.total_users
    );
    const changeRatio = affectedUsers.size / totalUsers;
    const impactScore = Math.min(
      100,
      Math.round(changeRatio * 100 + (changes.length / totalUsers) * 50)
    );

    return {
      affected_users: affectedUsers.size,
      affected_departments: Array.from(affectedDepartments),
      affected_roles: Array.from(affectedRoles),
      changes_summary: {
        additions,
        modifications,
        removals,
      },
      impact_score: impactScore,
    };
  }

  /**
   * Generate recommendations based on impact analysis
   */
  private static generateRecommendations(
    impact: DemographicImpactAnalysis,
    changes: DemographicChange[]
  ): string[] {
    const recommendations: string[] = [];

    if (impact.impact_score > 50) {
      recommendations.push(
        'High impact changes detected. Consider re-running AI analysis for affected surveys.'
      );
    }

    if (impact.changes_summary.additions > 0) {
      recommendations.push(
        `${impact.changes_summary.additions} new users added. Update survey targeting if needed.`
      );
    }

    if (impact.changes_summary.removals > 0) {
      recommendations.push(
        `${impact.changes_summary.removals} users removed. Review survey response validity.`
      );
    }

    if (impact.affected_departments.length > 3) {
      recommendations.push(
        'Multiple departments affected. Consider department-specific analysis.'
      );
    }

    if (impact.affected_roles.length > 2) {
      recommendations.push(
        'Multiple roles affected. Review role-based insights and recommendations.'
      );
    }

    // Check for significant role changes
    const roleChanges = changes.filter((c) => c.field.includes('.role'));
    if (roleChanges.length > 0) {
      recommendations.push(
        'Role changes detected. Update permission scoping and dashboard access.'
      );
    }

    // Check for department changes
    const deptChanges = changes.filter((c) => c.field.includes('.department'));
    if (deptChanges.length > 0) {
      recommendations.push(
        'Department changes detected. Review department-specific surveys and insights.'
      );
    }

    return recommendations;
  }

  /**
   * Rollback to a previous demographic snapshot
   */
  static async rollbackToSnapshot(
    surveyId: string,
    targetVersion: number,
    rolledBackBy: string,
    reason: string
  ): Promise<IDemographicSnapshot> {
    try {
      // Find target snapshot
      const targetSnapshot = await DemographicSnapshot.findByVersion(
        surveyId,
        targetVersion
      );
      if (!targetSnapshot) {
        throw new Error(`Snapshot version ${targetVersion} not found`);
      }

      // Create new snapshot based on target
      const newVersion = await DemographicSnapshot.getNextVersion(surveyId);
      const rollbackSnapshot = new DemographicSnapshot({
        survey_id: surveyId,
        company_id: targetSnapshot.company_id,
        version: newVersion,
        demographics: targetSnapshot.demographics,
        created_by: rolledBackBy,
        reason: `Rollback to version ${targetVersion}: ${reason}`,
        changes: [],
      });

      // Compare with current latest to show rollback changes
      const currentSnapshot =
        await DemographicSnapshot.findLatestBySurvey(surveyId);
      if (currentSnapshot && currentSnapshot.version !== targetVersion) {
        rollbackSnapshot.changes =
          rollbackSnapshot.compareWith(currentSnapshot);
      }

      await rollbackSnapshot.save();

      // Log audit trail
      await auditLog({
        user_id: rolledBackBy,
        action: 'demographic_snapshot_rollback',
        resource_type: 'demographic_snapshot',
        resource_id: rollbackSnapshot._id.toString(),
        details: {
          survey_id: surveyId,
          target_version: targetVersion,
          new_version: newVersion,
          reason,
          changes_count: rollbackSnapshot.changes.length,
        },
        ip_address: '',
        user_agent: '',
      });

      return rollbackSnapshot;
    } catch (error) {
      throw new Error(
        `Failed to rollback demographic snapshot: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get demographic history for a survey
   */
  static async getDemographicHistory(
    surveyId: string
  ): Promise<IDemographicSnapshot[]> {
    return DemographicSnapshot.findBySurvey(surveyId);
  }

  /**
   * Get demographic impact analysis for survey results
   */
  static async analyzeDemographicImpact(
    surveyId: string,
    currentVersion?: number
  ): Promise<DemographicImpactAnalysis | null> {
    const snapshots = await DemographicSnapshot.findBySurvey(surveyId);

    if (snapshots.length < 2) {
      return null; // Need at least 2 snapshots to compare
    }

    let currentSnapshot: IDemographicSnapshot;
    let previousSnapshot: IDemographicSnapshot;

    if (currentVersion) {
      currentSnapshot = snapshots.find((s) => s.version === currentVersion)!;
      previousSnapshot = snapshots.find(
        (s) => s.version === currentVersion - 1
      )!;
    } else {
      currentSnapshot = snapshots[0]; // Latest
      previousSnapshot = snapshots[1]; // Previous
    }

    if (!currentSnapshot || !previousSnapshot) {
      return null;
    }

    const changes = currentSnapshot.compareWith(previousSnapshot);
    return this.analyzeImpact(changes, currentSnapshot, previousSnapshot);
  }

  /**
   * Archive old demographic snapshots
   */
  static async archiveOldSnapshots(
    surveyId: string,
    keepVersions: number = 10
  ): Promise<number> {
    const snapshots = await DemographicSnapshot.findBySurvey(surveyId);

    if (snapshots.length <= keepVersions) {
      return 0; // Nothing to archive
    }

    const toArchive = snapshots.slice(keepVersions);
    const archivedCount = toArchive.length;

    // Mark as inactive instead of deleting for audit purposes
    await DemographicSnapshot.updateMany(
      { _id: { $in: toArchive.map((s) => s._id) } },
      { is_active: false }
    );

    return archivedCount;
  }
}

export default DemographicVersioningService;
