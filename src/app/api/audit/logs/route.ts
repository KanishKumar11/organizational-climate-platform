import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import AuditService, { AuditQueryFilters } from '../../../../lib/audit-service';
import AuditLog from '../../../../models/AuditLog';
import { withSecurity } from '../../../../middleware/security';

/**
 * GET /api/audit/logs - Query audit logs
 */
async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
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

    if (searchParams.get('action') && searchParams.get('action') !== 'all') {
      filters.action = searchParams.get('action') as any;
    }

    if (
      searchParams.get('resource') &&
      searchParams.get('resource') !== 'all'
    ) {
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

    // Handle page-based pagination
    const page = searchParams.get('page')
      ? parseInt(searchParams.get('page')!)
      : 1;
    const limit = filters.limit || 50;
    if (!filters.offset && page > 1) {
      filters.offset = (page - 1) * limit;
    }
    filters.limit = limit;

    // Build query for counting (same logic as audit service)
    const countQuery: any = {};
    if (filters.user_id) countQuery.user_id = filters.user_id;
    if (filters.company_id) countQuery.company_id = filters.company_id;
    if (filters.resource_id) countQuery.resource_id = filters.resource_id;
    if (filters.success !== undefined) countQuery.success = filters.success;

    if (filters.action) {
      countQuery.action = Array.isArray(filters.action)
        ? { $in: filters.action }
        : filters.action;
    }

    if (filters.resource) {
      countQuery.resource = Array.isArray(filters.resource)
        ? { $in: filters.resource }
        : filters.resource;
    }

    if (filters.start_date || filters.end_date) {
      countQuery.timestamp = {};
      if (filters.start_date) countQuery.timestamp.$gte = filters.start_date;
      if (filters.end_date) countQuery.timestamp.$lte = filters.end_date;
    }

    const logs = await auditService.queryLogs(filters);
    const totalCount = await (AuditLog as any).countDocuments(countQuery);

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
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
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
