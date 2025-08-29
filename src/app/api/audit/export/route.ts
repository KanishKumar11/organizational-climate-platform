import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import AuditService, { AuditQueryFilters } from '../../../../lib/audit-service';
import { withSecurity } from '../../../../middleware/security';

/**
 * GET /api/audit/export - Export audit logs
 */
async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permissions - only admins can export audit logs
    const userRole = (session.user as any).role;
    if (!['super_admin', 'company_admin'].includes(userRole)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
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
      // Company admins can only export their company's logs
      filters.company_id = (session.user as any).company_id;
    }
    
    if (searchParams.get('action')) {
      filters.action = searchParams.get('action') as any;
    }
    
    if (searchParams.get('resource')) {
      filters.resource = searchParams.get('resource') as any;
    }
    
    if (searchParams.get('start_date')) {
      filters.start_date = new Date(searchParams.get('start_date')!);
    }
    
    if (searchParams.get('end_date')) {
      filters.end_date = new Date(searchParams.get('end_date')!);
    }

    // Remove limit for export
    delete filters.limit;
    delete filters.offset;

    const format = (searchParams.get('format') || 'json') as 'json' | 'csv';
    const exportData = await auditService.exportLogs(filters, format);

    // Log the export
    await auditService.logEvent({
      action: 'export',
      resource: 'audit_log',
      context: auditService.extractContextFromRequest(
        request,
        (session.user as any).id,
        (session.user as any).company_id
      ),
      details: { filters, format },
    });

    // Set appropriate headers for download
    const headers = new Headers();
    headers.set('Content-Type', format === 'csv' ? 'text/csv' : 'application/json');
    headers.set('Content-Disposition', `attachment; filename="audit-logs.${format}"`);

    return new NextResponse(exportData, { headers });
  } catch (error) {
    console.error('Failed to export audit logs:', error);
    return NextResponse.json(
      { error: 'Failed to export audit logs' },
      { status: 500 }
    );
  }
}

export { withSecurity(GET) as GET };