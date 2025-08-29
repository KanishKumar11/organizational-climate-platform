import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import GDPRComplianceService from '../../../../lib/gdpr-compliance';
import AuditService from '../../../../lib/audit-service';
import { withSecurity } from '../../../../middleware/security';

/**
 * POST /api/gdpr/erasure - Handle GDPR data erasure request (Right to be forgotten)
 */
async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { user_id, preserve_analytics = true, confirmation } = body;

    // Check permissions - only admins can process erasure requests
    const userRole = (session.user as any).role;
    const requesterId = (session.user as any).id;
    const requesterCompanyId = (session.user as any).company_id;

    if (!['super_admin', 'company_admin'].includes(userRole)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Require explicit confirmation for erasure requests
    if (!confirmation || confirmation !== 'I understand this action cannot be undone') {
      return NextResponse.json({ 
        error: 'Explicit confirmation required for data erasure',
        required_confirmation: 'I understand this action cannot be undone'
      }, { status: 400 });
    }

    const gdprService = GDPRComplianceService.getInstance();
    const auditService = AuditService.getInstance();

    // Process the erasure request
    const result = await gdprService.handleErasureRequest(
      user_id,
      requesterCompanyId,
      requesterId,
      preserve_analytics
    );

    // Log the GDPR request
    await auditService.logEvent({
      action: 'delete',
      resource: 'user',
      resource_id: user_id,
      context: auditService.extractContextFromRequest(
        request,
        requesterId,
        requesterCompanyId
      ),
      details: {
        gdpr_request: 'erasure',
        preserve_analytics,
        requested_by: requesterId,
        result,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Data erasure request processed successfully',
      data: result,
    });
  } catch (error) {
    console.error('Failed to process GDPR erasure request:', error);
    return NextResponse.json(
      { error: 'Failed to process data erasure request' },
      { status: 500 }
    );
  }
}

export { withSecurity(POST) as POST };