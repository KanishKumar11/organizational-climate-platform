import { connectDB } from './db';
import User from '../models/User';
import Response from '../models/Response';
import AuditLog from '../models/AuditLog';
import { DataPrivacyService } from './data-privacy';
import AuditService from './audit-service';

/**
 * GDPR Data Subject Rights
 */
export enum GDPRRight {
  ACCESS = 'access', // Right to access personal data
  RECTIFICATION = 'rectification', // Right to rectify inaccurate data
  ERASURE = 'erasure', // Right to be forgotten
  PORTABILITY = 'portability', // Right to data portability
  RESTRICTION = 'restriction', // Right to restrict processing
  OBJECTION = 'objection', // Right to object to processing
}

/**
 * GDPR Request status
 */
export enum GDPRRequestStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  REJECTED = 'rejected',
}

/**
 * GDPR Request interface
 */
export interface GDPRRequest {
  id: string;
  user_id: string;
  company_id: string;
  right: GDPRRight;
  status: GDPRRequestStatus;
  requested_at: Date;
  completed_at?: Date;
  requested_by: string; // User ID of requester
  processed_by?: string; // Admin who processed the request
  details: Record<string, unknown>;
  verification_token?: string;
  expiry_date: Date;
}

/**
 * Data export package
 */
export interface DataExportPackage {
  user_data: any;
  survey_responses: any[];
  audit_logs: any[];
  metadata: {
    export_date: Date;
    data_retention_policy: string;
    contact_info: string;
  };
}

/**
 * Data anonymization result
 */
export interface AnonymizationResult {
  records_processed: number;
  records_anonymized: number;
  records_deleted: number;
  errors: string[];
}

/**
 * GDPR Compliance Service
 */
export class GDPRComplianceService {
  private static instance: GDPRComplianceService;
  private auditService: AuditService;
  private privacyService: DataPrivacyService;

  constructor() {
    this.auditService = AuditService.getInstance();
    this.privacyService = new DataPrivacyService();
  }

  static getInstance(): GDPRComplianceService {
    if (!GDPRComplianceService.instance) {
      GDPRComplianceService.instance = new GDPRComplianceService();
    }
    return GDPRComplianceService.instance;
  }

  /**
   * Handle Right to Access (Article 15)
   * Export all personal data for a user
   */
  async handleAccessRequest(
    user_id: string,
    company_id: string,
    requested_by: string
  ): Promise<DataExportPackage> {
    try {
      await connectDB();

      // Log the access request
      await this.auditService.logEvent({
        action: 'export',
        resource: 'user',
        resource_id: user_id,
        context: { user_id: requested_by, company_id },
        details: { gdpr_right: GDPRRight.ACCESS },
      });

      // Get user data
      const user = await User.findById(user_id).lean();
      if (!user) {
        throw new Error('User not found');
      }

      // Get survey responses
      const responses = await Response.find({ user_id }).lean();

      // Get audit logs (limited to user's own actions)
      const auditLogs = await AuditLog.find({ user_id })
        .sort({ timestamp: -1 })
        .limit(1000)
        .lean();

      // Prepare data for export (decrypt if necessary)
      const exportPackage: DataExportPackage = {
        user_data: this.privacyService.prepareDataForExport(user, false),
        survey_responses: responses.map((response) =>
          this.privacyService.prepareDataForExport(response, false)
        ),
        audit_logs: auditLogs,
        metadata: {
          export_date: new Date(),
          data_retention_policy:
            'Data is retained according to our privacy policy and applicable laws',
          contact_info: 'privacy@company.com',
        },
      };

      return exportPackage;
    } catch (error) {
      console.error('Failed to handle access request:', error);
      throw new Error('Failed to export user data');
    }
  }

  /**
   * Handle Right to Erasure (Article 17) - "Right to be forgotten"
   */
  async handleErasureRequest(
    user_id: string,
    company_id: string,
    requested_by: string,
    preserve_analytics: boolean = true
  ): Promise<AnonymizationResult> {
    try {
      await connectDB();

      const result: AnonymizationResult = {
        records_processed: 0,
        records_anonymized: 0,
        records_deleted: 0,
        errors: [],
      };

      // Log the erasure request
      await this.auditService.logEvent({
        action: 'delete',
        resource: 'user',
        resource_id: user_id,
        context: { user_id: requested_by, company_id },
        details: {
          gdpr_right: GDPRRight.ERASURE,
          preserve_analytics,
        },
      });

      // Check if user exists
      const user = await User.findById(user_id);
      if (!user) {
        result.errors.push('User not found');
        return result;
      }

      // Anonymize or delete user data
      if (preserve_analytics) {
        // Anonymize user data for analytics purposes
        const anonymizedData = this.privacyService.anonymizeForAnalytics(
          user.toObject()
        );
        await User.findByIdAndUpdate(user_id, {
          ...anonymizedData,
          is_active: false,
          gdpr_erased: true,
          erasure_date: new Date(),
        });
        result.records_anonymized++;
      } else {
        // Complete deletion
        await User.findByIdAndDelete(user_id);
        result.records_deleted++;
      }
      result.records_processed++;

      // Handle survey responses
      const responses = await Response.find({ user_id });
      for (const response of responses) {
        if (preserve_analytics) {
          // Anonymize responses
          await Response.findByIdAndUpdate(response._id, {
            user_id: null, // Remove user association
            is_anonymous: true,
            response_text: response.response_text ? '[ANONYMIZED]' : undefined,
            gdpr_anonymized: true,
            anonymization_date: new Date(),
          });
          result.records_anonymized++;
        } else {
          // Delete responses
          await Response.findByIdAndDelete(response._id);
          result.records_deleted++;
        }
        result.records_processed++;
      }

      // Handle audit logs - keep for compliance but anonymize user info
      const auditLogs = await AuditLog.find({ user_id });
      for (const log of auditLogs) {
        await AuditLog.findByIdAndUpdate(log._id, {
          user_id: null,
          details: {
            ...log.details,
            gdpr_anonymized: true,
            original_user_id_hash: this.hashUserId(user_id),
          },
        });
        result.records_anonymized++;
        result.records_processed++;
      }

      return result;
    } catch (error) {
      console.error('Failed to handle erasure request:', error);
      throw new Error('Failed to process erasure request');
    }
  }

  /**
   * Handle Right to Rectification (Article 16)
   * Update incorrect personal data
   */
  async handleRectificationRequest(
    user_id: string,
    company_id: string,
    requested_by: string,
    corrections: Record<string, unknown>
  ): Promise<boolean> {
    try {
      await connectDB();

      // Log the rectification request
      await this.auditService.logEvent({
        action: 'update',
        resource: 'user',
        resource_id: user_id,
        context: { user_id: requested_by, company_id },
        details: {
          gdpr_right: GDPRRight.RECTIFICATION,
          corrections,
        },
      });

      // Update user data
      const user = await User.findById(user_id);
      if (!user) {
        throw new Error('User not found');
      }

      // Apply corrections
      Object.keys(corrections).forEach((key) => {
        if (key in user.toObject()) {
          (user as any)[key] = corrections[key];
        }
      });

      await user.save();
      return true;
    } catch (error) {
      console.error('Failed to handle rectification request:', error);
      return false;
    }
  }

  /**
   * Handle Right to Data Portability (Article 20)
   * Export data in a structured, machine-readable format
   */
  async handlePortabilityRequest(
    user_id: string,
    company_id: string,
    requested_by: string,
    format: 'json' | 'xml' | 'csv' = 'json'
  ): Promise<string> {
    try {
      const exportPackage = await this.handleAccessRequest(
        user_id,
        company_id,
        requested_by
      );

      switch (format) {
        case 'json':
          return JSON.stringify(exportPackage, null, 2);

        case 'csv':
          return this.convertToCSV(exportPackage);

        case 'xml':
          return this.convertToXML(exportPackage);

        default:
          return JSON.stringify(exportPackage, null, 2);
      }
    } catch (error) {
      console.error('Failed to handle portability request:', error);
      throw new Error('Failed to export data for portability');
    }
  }

  /**
   * Check data retention compliance
   */
  async checkRetentionCompliance(company_id?: string): Promise<{
    expired_users: number;
    expired_responses: number;
    expired_audit_logs: number;
    cleanup_recommended: boolean;
  }> {
    try {
      await connectDB();

      const userPrivacy = new DataPrivacyService('user_data');
      const responsePrivacy = new DataPrivacyService('survey_responses');
      const auditPrivacy = new DataPrivacyService('audit_logs');

      const userCutoff = userPrivacy.getRetentionCutoffDate();
      const responseCutoff = responsePrivacy.getRetentionCutoffDate();
      const auditCutoff = auditPrivacy.getRetentionCutoffDate();

      const query = company_id ? { company_id } : {};

      // Count expired records
      const expired_users = await User.countDocuments({
        ...query,
        created_at: { $lt: userCutoff },
        is_active: false,
      });

      const expired_responses = await Response.countDocuments({
        ...query,
        created_at: { $lt: responseCutoff },
      });

      const expired_audit_logs = await AuditLog.countDocuments({
        ...query,
        timestamp: { $lt: auditCutoff },
      });

      const cleanup_recommended =
        expired_users > 0 || expired_responses > 0 || expired_audit_logs > 0;

      return {
        expired_users,
        expired_responses,
        expired_audit_logs,
        cleanup_recommended,
      };
    } catch (error) {
      console.error('Failed to check retention compliance:', error);
      throw new Error('Failed to check retention compliance');
    }
  }

  /**
   * Perform automated data retention cleanup
   */
  async performRetentionCleanup(company_id?: string): Promise<{
    users_cleaned: number;
    responses_cleaned: number;
    audit_logs_cleaned: number;
  }> {
    try {
      await connectDB();

      const userPrivacy = new DataPrivacyService('user_data');
      const responsePrivacy = new DataPrivacyService('survey_responses');
      const auditPrivacy = new DataPrivacyService('audit_logs');

      const userCutoff = userPrivacy.getRetentionCutoffDate();
      const responseCutoff = responsePrivacy.getRetentionCutoffDate();
      const auditCutoff = auditPrivacy.getRetentionCutoffDate();

      const query = company_id ? { company_id } : {};

      // Clean up inactive users
      const userResult = await User.deleteMany({
        ...query,
        created_at: { $lt: userCutoff },
        is_active: false,
      });

      // Clean up old responses
      const responseResult = await Response.deleteMany({
        ...query,
        created_at: { $lt: responseCutoff },
      });

      // Clean up old audit logs
      const auditResult = await AuditLog.deleteMany({
        ...query,
        timestamp: { $lt: auditCutoff },
      });

      // Log the cleanup
      await this.auditService.logEvent({
        action: 'delete',
        resource: 'user',
        context: { company_id: company_id || 'global' },
        details: {
          cleanup_type: 'retention_policy',
          users_cleaned: userResult.deletedCount,
          responses_cleaned: responseResult.deletedCount,
          audit_logs_cleaned: auditResult.deletedCount,
        },
      });

      return {
        users_cleaned: userResult.deletedCount || 0,
        responses_cleaned: responseResult.deletedCount || 0,
        audit_logs_cleaned: auditResult.deletedCount || 0,
      };
    } catch (error) {
      console.error('Failed to perform retention cleanup:', error);
      throw new Error('Failed to perform retention cleanup');
    }
  }

  /**
   * Generate GDPR compliance report
   */
  async generateComplianceReport(company_id?: string): Promise<{
    data_subjects: number;
    active_users: number;
    anonymized_users: number;
    retention_compliance: any;
    recent_requests: any[];
    recommendations: string[];
  }> {
    try {
      await connectDB();

      const query = company_id ? { company_id } : {};

      // Count data subjects
      const data_subjects = await User.countDocuments(query);
      const active_users = await User.countDocuments({
        ...query,
        is_active: true,
      });
      const anonymized_users = await User.countDocuments({
        ...query,
        gdpr_erased: true,
      });

      // Check retention compliance
      const retention_compliance =
        await this.checkRetentionCompliance(company_id);

      // Get recent GDPR requests from audit logs
      const recent_requests = await AuditLog.find({
        ...query,
        'details.gdpr_right': { $exists: true },
        timestamp: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // Last 30 days
      })
        .sort({ timestamp: -1 })
        .limit(10)
        .lean();

      // Generate recommendations
      const recommendations: string[] = [];

      if (retention_compliance.cleanup_recommended) {
        recommendations.push('Data retention cleanup is recommended');
      }

      if (anonymized_users === 0) {
        recommendations.push(
          'Consider implementing data anonymization procedures'
        );
      }

      recommendations.push('Regularly review and update privacy policies');
      recommendations.push('Conduct periodic GDPR compliance audits');

      return {
        data_subjects,
        active_users,
        anonymized_users,
        retention_compliance,
        recent_requests,
        recommendations,
      };
    } catch (error) {
      console.error('Failed to generate compliance report:', error);
      throw new Error('Failed to generate compliance report');
    }
  }

  /**
   * Hash user ID for anonymization
   */
  private hashUserId(user_id: string): string {
    const crypto = require('crypto');
    return crypto
      .createHash('sha256')
      .update(user_id)
      .digest('hex')
      .substring(0, 16);
  }

  /**
   * Convert export package to CSV
   */
  private convertToCSV(exportPackage: DataExportPackage): string {
    // Simple CSV conversion - in production, use a proper CSV library
    const lines: string[] = [];

    // User data
    lines.push('User Data');
    lines.push(Object.keys(exportPackage.user_data).join(','));
    lines.push(Object.values(exportPackage.user_data).join(','));
    lines.push('');

    // Survey responses
    lines.push('Survey Responses');
    if (exportPackage.survey_responses.length > 0) {
      lines.push(Object.keys(exportPackage.survey_responses[0]).join(','));
      exportPackage.survey_responses.forEach((response) => {
        lines.push(Object.values(response).join(','));
      });
    }

    return lines.join('\n');
  }

  /**
   * Convert export package to XML
   */
  private convertToXML(exportPackage: DataExportPackage): string {
    // Simple XML conversion - in production, use a proper XML library
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<gdpr_export>\n';

    xml += '  <user_data>\n';
    Object.entries(exportPackage.user_data).forEach(([key, value]) => {
      xml += `    <${key}>${value}</${key}>\n`;
    });
    xml += '  </user_data>\n';

    xml += '  <survey_responses>\n';
    exportPackage.survey_responses.forEach((response, index) => {
      xml += `    <response id="${index}">\n`;
      Object.entries(response).forEach(([key, value]) => {
        xml += `      <${key}>${value}</${key}>\n`;
      });
      xml += '    </response>\n';
    });
    xml += '  </survey_responses>\n';

    xml += '</gdpr_export>';
    return xml;
  }
}

export default GDPRComplianceService;
