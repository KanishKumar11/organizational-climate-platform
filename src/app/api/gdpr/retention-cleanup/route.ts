import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import GDPRComplianceService from '../../../../lib/gdpr-compliance';
import AuditService from '../../../../lib/audit-service';
import { withSecurity } from '../../../../middleware/security';

/**
 * POST /api/gdpr/retention-cleanup - Perform data retention cleanup
 */
async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permissions - only super admins can perform retention cleanup
    const userRole = (session.user as any).role;
    if (userRole !== 'super_admin') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { company_id, confirmation } = body;

    // Require explicit confirmation for cleanup
    if (
      !confirmation ||
      confirmation !== 'I understand this will permanently delete old data'
    ) {
      return NextResponse.json(
        {
          error: 'Explicit confirmation required for data cleanup',
          required_confirmation:
            'I understand this will permanently delete old data',
        },
        { status: 400 }
      );
    }

    const requesterId = (session.user as any).id;
    const requesterCompanyId = (session.user as any).company_id;

    const gdprService = GDPRComplianceService.getInstance();
    const auditService = AuditService.getInstance();

    // Perform retention cleanup
    const result = await gdprService.performRetentionCleanup(company_id);

    // Log the cleanup
    await auditService.logEvent({
      action: 'delete',
      resource: 'user',
      context: auditService.extractContextFromRequest(
        request,
        requesterId,
        requesterCompanyId
      ),
      details: {
        cleanup_type: 'retention_policy',
        company_id,
        requested_by: requesterId,
        result,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Data retention cleanup completed successfully',
      data: result,
    });
  } catch (error) {
    console.error('Failed to perform retention cleanup:', error);
    return NextResponse.json(
      { error: 'Failed to perform retention cleanup' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/gdpr/retention-cleanup - Check retention compliance status
 */
async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permissions - only admins can check retention status
    const userRole = (session.user as any).role;
    if (!['super_admin', 'company_admin'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const requesterId = (session.user as any).id;
    const requesterCompanyId = (session.user as any).company_id;

    // Get company_id parameter
    let company_id = searchParams.get('company_id');
    if (userRole === 'company_admin') {
      // Company admins can only check their company's status
      company_id = requesterCompanyId;
    }

    const gdprService = GDPRComplianceService.getInstance();
    const auditService = AuditService.getInstance();

    // Check retention compliance
    const status = await gdprService.checkRetentionCompliance(
      company_id || undefined
    );

    // Log the status check
    await auditService.logEvent({
      action: 'read',
      resource: 'user',
      context: auditService.extractContextFromRequest(
        request,
        requesterId,
        requesterCompanyId
      ),
      details: {
        check_type: 'retention_compliance',
        company_id,
        requested_by: requesterId,
      },
    });

    return NextResponse.json({
      success: true,
      data: status,
    });
  } catch (error) {
    console.error('Failed to check retention compliance:', error);
    return NextResponse.json(
      { error: 'Failed to check retention compliance' },
      { status: 500 }
    );
  }
}

const securePOST = withSecurity(POST);
const secureGET = withSecurity(GET);
export { securePOST as POST, secureGET as GET };


