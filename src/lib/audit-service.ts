import { NextRequest } from 'next/server';
import AuditLog, {
  AuditAction,
  AuditResource,
  IAuditLog,
} from '../models/AuditLog';
import { connectDB } from './db';

/**
 * Audit context information
 */
export interface AuditContext {
  user_id?: string;
  company_id: string;
  ip_address?: string;
  user_agent?: string;
  session_id?: string;
  request_id?: string;
}

/**
 * Audit event data
 */
export interface AuditEvent {
  action: AuditAction;
  resource: AuditResource;
  resource_id?: string;
  details?: Record<string, unknown>;
  success?: boolean;
  error_message?: string;
  context?: AuditContext;
}

/**
 * Audit query filters
 */
export interface AuditQueryFilters {
  user_id?: string;
  company_id?: string;
  action?: AuditAction | AuditAction[];
  resource?: AuditResource | AuditResource[];
  resource_id?: string;
  success?: boolean;
  start_date?: Date;
  end_date?: Date;
  limit?: number;
  offset?: number;
}

/**
 * Audit report data
 */
export interface AuditReport {
  total_events: number;
  success_rate: number;
  failed_events: number;
  events_by_action: Record<AuditAction, number>;
  events_by_resource: Record<AuditResource, number>;
  events_by_user: Record<string, number>;
  recent_failures: IAuditLog[];
  recent_activities: IAuditLog[];
  date_range: {
    start: Date;
    end: Date;
  };
}

/**
 * Comprehensive Audit Service
 */
export class AuditService {
  private static instance: AuditService;

  static getInstance(): AuditService {
    if (!AuditService.instance) {
      AuditService.instance = new AuditService();
    }
    return AuditService.instance;
  }

  /**
   * Log an audit event
   */
  async logEvent(event: AuditEvent): Promise<void> {
    try {
      await connectDB();

      const auditData: Partial<IAuditLog> = {
        user_id: event.context?.user_id,
        company_id: event.context?.company_id || 'unknown',
        action: event.action,
        resource: event.resource,
        resource_id: event.resource_id,
        details: event.details || {},
        ip_address: event.context?.ip_address,
        user_agent: event.context?.user_agent,
        success: event.success !== false, // Default to true unless explicitly false
        error_message: event.error_message,
        timestamp: new Date(),
      };

      const auditLog = new AuditLog(auditData);
      await auditLog.save();
    } catch (error) {
      console.error('Failed to log audit event:', error);
      // Don't throw error to avoid breaking the main application flow
    }
  }

  /**
   * Log user authentication events
   */
  async logAuth(
    action: 'login' | 'logout',
    user_id: string,
    context: AuditContext,
    success: boolean = true,
    error?: string
  ): Promise<void> {
    await this.logEvent({
      action,
      resource: 'user',
      resource_id: user_id,
      success,
      error_message: error,
      context,
      details: {
        authentication_method: 'nextauth',
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Log data access events
   */
  async logDataAccess(
    action: 'read' | 'export',
    resource: AuditResource,
    resource_id: string,
    context: AuditContext,
    details?: Record<string, unknown>
  ): Promise<void> {
    await this.logEvent({
      action,
      resource,
      resource_id,
      context,
      details: {
        ...details,
        access_time: new Date().toISOString(),
      },
    });
  }

  /**
   * Log data modification events
   */
  async logDataModification(
    action: 'create' | 'update' | 'delete',
    resource: AuditResource,
    resource_id: string,
    context: AuditContext,
    changes?: Record<string, { old?: unknown; new?: unknown }>,
    success: boolean = true,
    error?: string
  ): Promise<void> {
    await this.logEvent({
      action,
      resource,
      resource_id,
      success,
      error_message: error,
      context,
      details: {
        changes,
        modification_time: new Date().toISOString(),
      },
    });
  }

  /**
   * Log survey-specific events
   */
  async logSurveyEvent(
    action:
      | 'survey_create'
      | 'survey_launch'
      | 'survey_complete'
      | 'response_submit',
    survey_id: string,
    context: AuditContext,
    details?: Record<string, unknown>
  ): Promise<void> {
    await this.logEvent({
      action,
      resource: action.includes('response') ? 'response' : 'survey',
      resource_id: survey_id,
      context,
      details,
    });
  }

  /**
   * Query audit logs with filters
   */
  async queryLogs(filters: AuditQueryFilters): Promise<IAuditLog[]> {
    try {
      await connectDB();

      const query: any = {};

      // Apply filters
      if (filters.user_id) query.user_id = filters.user_id;
      if (filters.company_id) query.company_id = filters.company_id;
      if (filters.resource_id) query.resource_id = filters.resource_id;
      if (filters.success !== undefined) query.success = filters.success;

      if (filters.action) {
        query.action = Array.isArray(filters.action)
          ? { $in: filters.action }
          : filters.action;
      }

      if (filters.resource) {
        query.resource = Array.isArray(filters.resource)
          ? { $in: filters.resource }
          : filters.resource;
      }

      if (filters.start_date || filters.end_date) {
        query.timestamp = {};
        if (filters.start_date) query.timestamp.$gte = filters.start_date;
        if (filters.end_date) query.timestamp.$lte = filters.end_date;
      }

      return await (AuditLog as any)
        .find(query)
        .sort({ timestamp: -1 })
        .limit(filters.limit || 100)
        .skip(filters.offset || 0)
        .lean();
    } catch (error) {
      console.error('Failed to query audit logs:', error);
      return [];
    }
  }

  /**
   * Generate audit report
   */
  async generateReport(
    company_id?: string,
    start_date?: Date,
    end_date?: Date
  ): Promise<AuditReport> {
    try {
      await connectDB();

      const query: any = {};
      if (company_id) query.company_id = company_id;

      const dateRange = {
        start: start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        end: end_date || new Date(),
      };

      query.timestamp = { $gte: dateRange.start, $lte: dateRange.end };

      // Get all events in date range
      const events = await (AuditLog as any).find(query).lean();

      // Calculate metrics
      const total_events = events.length;
      const failed_events = events.filter((e) => !e.success).length;
      const success_rate =
        total_events > 0
          ? ((total_events - failed_events) / total_events) * 100
          : 100;

      // Group by action
      const events_by_action = events.reduce(
        (acc, event) => {
          acc[event.action] = (acc[event.action] || 0) + 1;
          return acc;
        },
        {} as Record<AuditAction, number>
      );

      // Group by resource
      const events_by_resource = events.reduce(
        (acc, event) => {
          acc[event.resource] = (acc[event.resource] || 0) + 1;
          return acc;
        },
        {} as Record<AuditResource, number>
      );

      // Group by user
      const events_by_user = events.reduce(
        (acc, event) => {
          if (event.user_id) {
            acc[event.user_id] = (acc[event.user_id] || 0) + 1;
          }
          return acc;
        },
        {} as Record<string, number>
      );

      // Get recent failures
      const recent_failures = await (AuditLog as any)
        .find({
          ...query,
          success: false,
        })
        .sort({ timestamp: -1 })
        .limit(10)
        .lean();

      // Get recent activities (both successful and failed)
      const recent_activities = await (AuditLog as any)
        .find(query)
        .sort({ timestamp: -1 })
        .limit(20)
        .lean();

      return {
        total_events,
        success_rate,
        failed_events,
        events_by_action,
        events_by_resource,
        events_by_user,
        recent_failures,
        recent_activities,
        date_range: dateRange,
      };
    } catch (error) {
      console.error('Failed to generate audit report:', error);
      throw new Error('Failed to generate audit report');
    }
  }

  /**
   * Export audit logs for compliance
   */
  async exportLogs(
    filters: AuditQueryFilters,
    format: 'json' | 'csv' = 'json'
  ): Promise<string> {
    const logs = await this.queryLogs(filters);

    if (format === 'csv') {
      return this.convertToCSV(logs);
    }

    return JSON.stringify(logs, null, 2);
  }

  /**
   * Convert audit logs to CSV format
   */
  private convertToCSV(logs: IAuditLog[]): string {
    if (logs.length === 0) return '';

    const headers = [
      'timestamp',
      'user_id',
      'company_id',
      'action',
      'resource',
      'resource_id',
      'success',
      'ip_address',
      'error_message',
    ];

    const csvRows = [headers.join(',')];

    logs.forEach((log) => {
      const row = headers.map((header) => {
        let value = (log as any)[header];
        if (value === null || value === undefined) value = '';
        if (typeof value === 'string' && value.includes(',')) {
          value = `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      });
      csvRows.push(row.join(','));
    });

    return csvRows.join('\n');
  }

  /**
   * Clean up old audit logs based on retention policy
   */
  async cleanupOldLogs(retentionDays: number = 2555): Promise<number> {
    try {
      await connectDB();

      const cutoffDate = new Date(
        Date.now() - retentionDays * 24 * 60 * 60 * 1000
      );
      const result = await (AuditLog as any).deleteMany({
        timestamp: { $lt: cutoffDate },
      });

      console.log(`Cleaned up ${result.deletedCount} old audit log entries`);
      return result.deletedCount || 0;
    } catch (error) {
      console.error('Failed to cleanup old audit logs:', error);
      return 0;
    }
  }

  /**
   * Extract audit context from request
   */
  extractContextFromRequest(
    req: NextRequest,
    user_id?: string,
    company_id?: string
  ): AuditContext {
    return {
      user_id,
      company_id: company_id || 'unknown',
      ip_address: this.getClientIP(req),
      user_agent: req.headers.get('user-agent') || undefined,
      request_id: req.headers.get('x-request-id') || undefined,
    };
  }

  /**
   * Get client IP address from request
   */
  private getClientIP(req: NextRequest): string {
    // Check various headers for the real IP
    const forwarded = req.headers.get('x-forwarded-for');
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }

    const realIP = req.headers.get('x-real-ip');
    if (realIP) return realIP;

    const cfConnectingIP = req.headers.get('cf-connecting-ip');
    if (cfConnectingIP) return cfConnectingIP;

    // Fallback to connection IP (may not be available in serverless)
    return (req as any).ip || 'unknown';
  }
}

/**
 * Audit middleware for automatic logging
 */
export function createAuditMiddleware() {
  const auditService = AuditService.getInstance();

  return {
    /**
     * Log API request
     */
    logRequest: async (
      req: NextRequest,
      action: AuditAction,
      resource: AuditResource,
      resource_id?: string,
      user_id?: string,
      company_id?: string,
      details?: Record<string, unknown>
    ) => {
      const context = auditService.extractContextFromRequest(
        req,
        user_id,
        company_id
      );
      await auditService.logEvent({
        action,
        resource,
        resource_id,
        context,
        details,
      });
    },

    /**
     * Log API response
     */
    logResponse: async (
      req: NextRequest,
      action: AuditAction,
      resource: AuditResource,
      resource_id: string,
      success: boolean,
      user_id?: string,
      company_id?: string,
      error?: string,
      details?: Record<string, unknown>
    ) => {
      const context = auditService.extractContextFromRequest(
        req,
        user_id,
        company_id
      );
      await auditService.logEvent({
        action,
        resource,
        resource_id,
        success,
        error_message: error,
        context,
        details,
      });
    },
  };
}

export default AuditService;
// Export a default instance for convenience
export const auditLog = new AuditService();
