import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import AuditService, { AuditQueryFilters } from '../../../../lib/audit-service';
import { withSecurity } from '../../../../middleware/security';

/**
 * GET /api/audit/logs - Query audit logs
 */
async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permissions - only admins can view audit logs
    const userRole = (session.user as any).role;
    if (!['super_admin', 'company_admin'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const auditService = AuditService.getInstance();

    // Build filters from query parameters
    const filters: AuditQueryFilters = {};

    if (searchParams.get('user_id')) {
      filters.user_id = searchParams.get('user_id')!;
    }

    if (searchParams.get('company_id')) {
      filters.company_id = searchParams.get('company_id')!;
    } else if (userRole === 'company_admin') {
      // Company admins can only see their company's logs
      filters.company_id = (session.user as any).company_id;
    }

    if (searchParams.get('action')) {
      filters.action = searchParams.get('action') as any;
    }

    if (searchParams.get('resource')) {
      filters.resource = searchParams.get('resource') as any;
    }

    if (searchParams.get('resource_id')) {
      filters.resource_id = searchParams.get('resource_id')!;
    }

    if (searchParams.get('success')) {
      filters.success = searchParams.get('success') === 'true';
    }

    if (searchParams.get('start_date')) {
      filters.start_date = new Date(searchParams.get('start_date')!);
    }

    if (searchParams.get('end_date')) {
      filters.end_date = new Date(searchParams.get('end_date')!);
    }

    if (searchParams.get('limit')) {
      filters.limit = parseInt(searchParams.get('limit')!);
    }

    if (searchParams.get('offset')) {
      filters.offset = parseInt(searchParams.get('offset')!);
    }

    const logs = await auditService.queryLogs(filters);

    // Log the audit log access
    await auditService.logEvent({
      action: 'read',
      resource: 'audit_log',
      context: auditService.extractContextFromRequest(
        request,
        (session.user as any).id,
        (session.user as any).company_id
      ),
      details: { filters },
    });

    return NextResponse.json({
      success: true,
      data: logs,
      count: logs.length,
    });
  } catch (error) {
    console.error('Failed to query audit logs:', error);
    return NextResponse.json(
      { error: 'Failed to query audit logs' },
      { status: 500 }
    );
  }
}

const secureGET = withSecurity(GET);
export { secureGET as GET };
