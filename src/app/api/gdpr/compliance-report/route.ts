import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import GDPRComplianceService from '../../../../lib/gdpr-compliance';
import AuditService from '../../../../lib/audit-service';
import { withSecurity } from '../../../../middleware/security';

/**
 * GET /api/gdpr/compliance-report - Generate GDPR compliance report
 */
async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permissions - only admins can generate compliance reports
    const userRole = (session.user as any).role;
    if (!['super_admin', 'company_admin'].includes(userRole)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const requesterId = (session.user as any).id;
    const requesterCompanyId = (session.user as any).company_id;

    // Get company_id parameter
    let company_id = searchParams.get('company_id');
    if (userRole === 'company_admin') {
      // Company admins can only see their company's report
      company_id = requesterCompanyId;
    }

    const gdprService = GDPRComplianceService.getInstance();
    const auditService = AuditService.getInstance();

    // Generate compliance report
    const report = await gdprService.generateComplianceReport(company_id || undefined);

    // Log the report generation
    await auditService.logEvent({
      action: 'read',
      resource: 'user',
      context: auditService.extractContextFromRequest(
        request,
        requesterId,
        requesterCompanyId
      ),
      details: {
        report_type: 'gdpr_compliance',
        company_id,
        requested_by: requesterId,
      },
    });

    return NextResponse.json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error('Failed to generate GDPR compliance report:', error);
    return NextResponse.json(
      { error: 'Failed to generate compliance report' },
      { status: 500 }
    );
  }
}

export { withSecurity(GET) as GET };