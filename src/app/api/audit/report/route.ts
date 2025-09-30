import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import AuditService from '../../../../lib/audit-service';
import { withSecurity } from '../../../../middleware/security';

/**
 * GET /api/audit/report - Generate audit report
 */
async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permissions - only admins can generate audit reports
    const userRole = (session.user as any).role;
    if (!['super_admin', 'company_admin'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const auditService = AuditService.getInstance();

    // Get parameters
    let company_id = searchParams.get('company_id');
    if (userRole === 'company_admin') {
      // Company admins can only see their company's report
      company_id = (session.user as any).company_id;
    }

    const start_date = searchParams.get('start_date')
      ? new Date(searchParams.get('start_date')!)
      : undefined;

    const end_date = searchParams.get('end_date')
      ? new Date(searchParams.get('end_date')!)
      : undefined;

    const report = await auditService.generateReport(
      company_id || undefined,
      start_date,
      end_date
    );

    // Log the report generation
    await auditService.logEvent({
      action: 'read',
      resource: 'audit_log',
      context: auditService.extractContextFromRequest(
        request,
        (session.user as any).id,
        (session.user as any).company_id
      ),
      details: {
        report_type: 'audit_report',
        company_id,
        date_range: { start_date, end_date },
      },
    });

    return NextResponse.json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error('Failed to generate audit report:', error);
    return NextResponse.json(
      { error: 'Failed to generate audit report' },
      { status: 500 }
    );
  }
}

const secureGET = withSecurity(GET);
export { secureGET as GET };
