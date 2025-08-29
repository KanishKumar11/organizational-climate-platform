import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { reportSharingService, ShareOptions } from '@/lib/report-sharing';
import { reportService } from '@/lib/report-service';
import { connectDB } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const {
      recipients,
      message,
      permissions,
      expiresAt,
      requireLogin,
      allowDownload,
    } = await request.json();

    // Validate input
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json(
        { error: 'Recipients are required' },
        { status: 400 }
      );
    }

    if (!['view', 'comment', 'edit'].includes(permissions)) {
      return NextResponse.json(
        { error: 'Invalid permissions' },
        { status: 400 }
      );
    }

    // Check if user has permission to share this report
    const report = await reportService.getReport(params.id, session.user.id);
    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Check if user can share (must be owner or have edit permissions)
    const canShare =
      report.createdBy === session.user.id ||
      session.user.role === 'super_admin' ||
      session.user.role === 'company_admin';

    if (!canShare) {
      return NextResponse.json(
        { error: 'Insufficient permissions to share' },
        { status: 403 }
      );
    }

    const shareOptions: ShareOptions = {
      recipients,
      message,
      permissions,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      requireLogin: requireLogin !== false,
      allowDownload: allowDownload !== false,
    };

    const sharedReport = await reportSharingService.shareReport(
      params.id,
      session.user.id,
      shareOptions
    );

    return NextResponse.json({
      success: true,
      shareId: sharedReport.id,
      shareToken: sharedReport.shareToken,
      shareUrl: `${process.env.NEXT_PUBLIC_APP_URL}/shared/reports/${sharedReport.shareToken}`,
      expiresAt: sharedReport.expiresAt,
    });
  } catch (error) {
    console.error('Share report error:', error);
    return NextResponse.json(
      { error: 'Failed to share report' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Get sharing analytics for this report
    const analytics = await reportSharingService.getSharingAnalytics(params.id);

    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Get sharing analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to get sharing analytics' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const shareToken = searchParams.get('token');

    if (!shareToken) {
      return NextResponse.json(
        { error: 'Share token is required' },
        { status: 400 }
      );
    }

    // Check permissions
    const report = await reportService.getReport(params.id, session.user.id);
    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    const canRevoke =
      report.createdBy === session.user.id ||
      session.user.role === 'super_admin' ||
      session.user.role === 'company_admin';

    if (!canRevoke) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    await reportSharingService.revokeAccess(shareToken);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Revoke share error:', error);
    return NextResponse.json(
      { error: 'Failed to revoke share access' },
      { status: 500 }
    );
  }
}
