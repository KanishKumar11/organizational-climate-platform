import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getEntityAuditTrail, AuditEntityType } from '@/lib/audit';

/**
 * GET /api/audit/[entityType]/[entityId]
 *
 * Fetches audit trail for a specific entity.
 *
 * Access Control:
 * - Super Admin: Can view all audit logs
 * - Company Admin: Can view logs for their company's entities
 * - Others: Cannot access audit logs
 *
 * Query Parameters:
 * - limit: Number of records to return (default: 50, max: 100)
 *
 * Returns:
 * - Array of audit log entries
 * - Each entry includes user info, timestamp, action, and changes
 */

export async function GET(
  req: NextRequest,
  { params }: { params: { entityType: string; entityId: string } }
) {
  try {
    // Authenticate
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Access control - only admins can view audit logs
    if (
      session.user.role !== 'super_admin' &&
      session.user.role !== 'company_admin'
    ) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    const { entityType, entityId } = params;
    const { searchParams } = new URL(req.url);
    const limit = Math.min(
      parseInt(searchParams.get('limit') || '50'),
      100
    );

    // Validate entity type
    const validEntityTypes: AuditEntityType[] = [
      'survey',
      'survey_draft',
      'question',
      'response',
      'user',
      'company',
      'settings',
    ];

    if (!validEntityTypes.includes(entityType as AuditEntityType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid entity type' },
        { status: 400 }
      );
    }

    // Fetch audit trail
    const auditLogs = await getEntityAuditTrail(
      entityType as AuditEntityType,
      entityId,
      limit
    );

    return NextResponse.json({
      success: true,
      auditLogs,
      count: auditLogs.length,
    });
  } catch (error: any) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
