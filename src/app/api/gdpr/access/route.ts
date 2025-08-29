import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import GDPRComplianceService from '../../../../lib/gdpr-compliance';
import AuditService from '../../../../lib/audit-service';
import { withSecurity } from '../../../../middleware/security';

/**
 * POST /api/gdpr/access - Handle GDPR data access request
 */
async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { user_id, format = 'json' } = body;

    // Users can only request their own data, admins can request any user's data
    const userRole = (session.user as any).role;
    const requesterId = (session.user as any).id;
    const requesterCompanyId = (session.user as any).company_id;

    if (userRole === 'employee' && user_id !== requesterId) {
      return NextResponse.json({ error: 'Can only request your own data' }, { status: 403 });
    }

    if (!['super_admin', 'company_admin'].includes(userRole) && user_id !== requesterId) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const gdprService = GDPRComplianceService.getInstance();
    const auditService = AuditService.getInstance();

    // Handle the access request
    const exportPackage = await gdprService.handleAccessRequest(
      user_id,
      requesterCompanyId,
      requesterId
    );

    // Log the GDPR request
    await auditService.logEvent({
      action: 'export',
      resource: 'user',
      resource_id: user_id,
      context: auditService.extractContextFromRequest(
        request,
        requesterId,
        requesterCompanyId
      ),
      details: {
        gdpr_request: 'access',
        format,
        requested_by: requesterId,
      },
    });

    if (format === 'download') {
      // Return as downloadable file
      const jsonData = JSON.stringify(exportPackage, null, 2);
      const headers = new Headers();
      headers.set('Content-Type', 'application/json');
      headers.set('Content-Disposition', `attachment; filename="gdpr-data-export-${user_id}.json"`);
      
      return new NextResponse(jsonData, { headers });
    }

    return NextResponse.json({
      success: true,
      message: 'Data access request processed successfully',
      data: exportPackage,
    });
  } catch (error) {
    console.error('Failed to process GDPR access request:', error);
    return NextResponse.json(
      { error: 'Failed to process data access request' },
      { status: 500 }
    );
  }
}

export { withSecurity(POST) as POST };