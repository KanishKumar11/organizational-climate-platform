/**
 * Audit Logging Utilities
 *
 * Centralized functions for logging all audit events.
 *
 * Features:
 * - Simple API for logging actions
 * - Automatic metadata collection (IP, user agent)
 * - JSON diff for changes
 * - Type-safe entity types and actions
 * - Batch logging support
 * - Error handling
 *
 * Best Practices:
 * - Always call in API routes (server-side only)
 * - Never expose sensitive data in logs
 * - Use descriptive messages
 * - Include relevant context
 */

import { NextRequest } from 'next/server';
import AuditLog from '@/models/AuditLog';
import dbConnect from '@/lib/mongodb';

/**
 * Entity types that can be audited
 */
export type AuditEntityType =
  | 'survey'
  | 'survey_draft'
  | 'question'
  | 'response'
  | 'user'
  | 'company'
  | 'settings';

/**
 * Actions that can be performed
 */
export type AuditAction =
  | 'created'
  | 'updated'
  | 'deleted'
  | 'published'
  | 'closed'
  | 'reopened'
  | 'duplicated'
  | 'archived';

/**
 * Audit log entry data
 */
export interface AuditLogData {
  entityType: AuditEntityType;
  entityId: string;
  action: AuditAction;
  userId: string;
  userEmail: string;
  userName: string;
  fieldName?: string;
  oldValue?: any;
  newValue?: any;
  changes?: Array<{
    field: string;
    old_value: any;
    new_value: any;
  }>;
  description?: string;
  metadata?: Record<string, any>;
  companyId?: string;
  request?: NextRequest; // For extracting IP and user agent
}

/**
 * Log an audit event
 *
 * @param data - Audit log data
 * @returns Created audit log document
 */
export async function logAudit(data: AuditLogData) {
  try {
    await dbConnect();

    // Extract IP and user agent from request if provided
    let ipAddress: string | undefined;
    let userAgent: string | undefined;

    if (data.request) {
      ipAddress = extractIP(data.request);
      userAgent = data.request.headers.get('user-agent') || undefined;
    }

    // Create audit log entry
    const auditLog = await AuditLog.create({
      entity_type: data.entityType,
      entity_id: data.entityId,
      action: data.action,
      user_id: data.userId,
      user_email: data.userEmail,
      user_name: data.userName,
      field_name: data.fieldName,
      old_value: data.oldValue,
      new_value: data.newValue,
      changes: data.changes,
      description: data.description,
      metadata: data.metadata,
      company_id: data.companyId,
      ip_address: ipAddress,
      user_agent: userAgent,
      timestamp: new Date(),
    });

    console.log(
      `[AUDIT] ${data.action} ${data.entityType} ${data.entityId} by ${data.userEmail}`
    );

    return auditLog;
  } catch (error: any) {
    console.error('Error logging audit:', error);
    // Don't throw - audit logging should not break the main flow
    // But you might want to send to error tracking service
    return null;
  }
}

/**
 * Log survey creation
 */
export async function logSurveyCreated(
  surveyId: string,
  userId: string,
  userEmail: string,
  userName: string,
  surveyData: any,
  companyId?: string,
  request?: NextRequest
) {
  return logAudit({
    entityType: 'survey',
    entityId: surveyId,
    action: 'created',
    userId,
    userEmail,
    userName,
    description: `Survey "${surveyData.title}" created`,
    metadata: {
      surveyType: surveyData.type,
      questionCount: surveyData.questions?.length || 0,
      targetCount: surveyData.targets?.length || 0,
    },
    companyId,
    request,
  });
}

/**
 * Log survey update
 */
export async function logSurveyUpdated(
  surveyId: string,
  userId: string,
  userEmail: string,
  userName: string,
  changes: Array<{ field: string; old_value: any; new_value: any }>,
  companyId?: string,
  request?: NextRequest
) {
  return logAudit({
    entityType: 'survey',
    entityId: surveyId,
    action: 'updated',
    userId,
    userEmail,
    userName,
    changes,
    description: `Survey updated: ${changes.map((c) => c.field).join(', ')}`,
    companyId,
    request,
  });
}

/**
 * Log survey field change (simple single field update)
 */
export async function logSurveyFieldChange(
  surveyId: string,
  userId: string,
  userEmail: string,
  userName: string,
  fieldName: string,
  oldValue: any,
  newValue: any,
  companyId?: string,
  request?: NextRequest
) {
  return logAudit({
    entityType: 'survey',
    entityId: surveyId,
    action: 'updated',
    userId,
    userEmail,
    userName,
    fieldName,
    oldValue,
    newValue,
    description: `Survey field "${fieldName}" changed`,
    companyId,
    request,
  });
}

/**
 * Log survey published
 */
export async function logSurveyPublished(
  surveyId: string,
  userId: string,
  userEmail: string,
  userName: string,
  companyId?: string,
  request?: NextRequest
) {
  return logAudit({
    entityType: 'survey',
    entityId: surveyId,
    action: 'published',
    userId,
    userEmail,
    userName,
    description: 'Survey published',
    companyId,
    request,
  });
}

/**
 * Log survey closed
 */
export async function logSurveyClosed(
  surveyId: string,
  userId: string,
  userEmail: string,
  userName: string,
  companyId?: string,
  request?: NextRequest
) {
  return logAudit({
    entityType: 'survey',
    entityId: surveyId,
    action: 'closed',
    userId,
    userEmail,
    userName,
    description: 'Survey closed',
    companyId,
    request,
  });
}

/**
 * Log survey draft autosave
 */
export async function logDraftSaved(
  draftId: string,
  userId: string,
  userEmail: string,
  userName: string,
  step: number,
  companyId?: string,
  request?: NextRequest
) {
  return logAudit({
    entityType: 'survey_draft',
    entityId: draftId,
    action: 'updated',
    userId,
    userEmail,
    userName,
    description: `Draft autosaved at step ${step}`,
    metadata: { step, autosave: true },
    companyId,
    request,
  });
}

/**
 * Log question created
 */
export async function logQuestionCreated(
  questionId: string,
  userId: string,
  userEmail: string,
  userName: string,
  questionData: any,
  companyId?: string,
  request?: NextRequest
) {
  return logAudit({
    entityType: 'question',
    entityId: questionId,
    action: 'created',
    userId,
    userEmail,
    userName,
    description: `Question created: "${questionData.text_es || questionData.text_en}"`,
    metadata: {
      type: questionData.type,
      category: questionData.category_id,
    },
    companyId,
    request,
  });
}

/**
 * Log question updated
 */
export async function logQuestionUpdated(
  questionId: string,
  userId: string,
  userEmail: string,
  userName: string,
  changes: Array<{ field: string; old_value: any; new_value: any }>,
  companyId?: string,
  request?: NextRequest
) {
  return logAudit({
    entityType: 'question',
    entityId: questionId,
    action: 'updated',
    userId,
    userEmail,
    userName,
    changes,
    description: `Question updated: ${changes.map((c) => c.field).join(', ')}`,
    companyId,
    request,
  });
}

/**
 * Calculate diff between two objects
 * Returns array of changes
 */
export function calculateDiff(
  oldObj: Record<string, any>,
  newObj: Record<string, any>
): Array<{ field: string; old_value: any; new_value: any }> {
  const changes: Array<{ field: string; old_value: any; new_value: any }> = [];

  // Check all keys in new object
  for (const key of Object.keys(newObj)) {
    // Skip internal fields
    if (key.startsWith('_') || key === 'updated_at' || key === 'created_at') {
      continue;
    }

    const oldValue = oldObj[key];
    const newValue = newObj[key];

    // Deep comparison (simple version - can be enhanced)
    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      changes.push({
        field: key,
        old_value: oldValue,
        new_value: newValue,
      });
    }
  }

  return changes;
}

/**
 * Extract IP address from request
 * Handles various proxy headers
 */
function extractIP(request: NextRequest): string | undefined {
  // Try various headers (in order of preference)
  const headers = [
    'x-forwarded-for',
    'x-real-ip',
    'cf-connecting-ip', // Cloudflare
    'x-client-ip',
    'x-cluster-client-ip',
  ];

  for (const header of headers) {
    const value = request.headers.get(header);
    if (value) {
      // x-forwarded-for can contain multiple IPs, take the first
      return value.split(',')[0].trim();
    }
  }

  // Fallback to remote address (if available)
  return undefined;
}

/**
 * Get audit trail for an entity
 */
export async function getEntityAuditTrail(
  entityType: AuditEntityType,
  entityId: string,
  limit: number = 50
) {
  try {
    await dbConnect();
    return await (AuditLog as any).getEntityHistory(
      entityType,
      entityId,
      limit
    );
  } catch (error) {
    console.error('Error fetching audit trail:', error);
    return [];
  }
}

/**
 * Get user activity log
 */
export async function getUserAuditTrail(userId: string, limit: number = 50) {
  try {
    await dbConnect();
    return await (AuditLog as any).getUserActivity(userId, limit);
  } catch (error) {
    console.error('Error fetching user activity:', error);
    return [];
  }
}

/**
 * Get company audit trail
 */
export async function getCompanyAuditTrail(
  companyId: string,
  options: {
    entityType?: AuditEntityType;
    action?: AuditAction;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  } = {}
) {
  try {
    await dbConnect();
    return await (AuditLog as any).getCompanyAuditTrail(companyId, options);
  } catch (error) {
    console.error('Error fetching company audit trail:', error);
    return [];
  }
}
