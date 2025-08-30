import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { reportSharingService } from '@/lib/report-sharing';
import { reportService } from '@/lib/report-service';
import { connectDB } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    await connectDB();
    const { token } = await params;

    // Get shared report by token
    // This would fetch from database
    const sharedReport = null; // Placeholder - would fetch from DB

    if (!sharedReport || !sharedReport.isActive) {
      return NextResponse.json(
        { error: 'Invalid or expired share link' },
        { status: 404 }
      );
    }

    // Check if link has expired
    if (sharedReport.expiresAt && new Date() > sharedReport.expiresAt) {
      return NextResponse.json(
        { error: 'Share link has expired' },
        { status: 410 }
      );
    }

    // Check if login is required
    if (sharedReport.requireLogin) {
      const session = await getServerSession(authOptions);
      if (!session?.user) {
        return NextResponse.json({ error: 'Login required' }, { status: 401 });
      }

      // Check if user is in the shared list (if not public)
      if (
        sharedReport.sharedWith.length > 0 &&
        !sharedReport.sharedWith.includes(session.user.email)
      ) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    // Track access
    const session = await getServerSession(authOptions);
    await reportSharingService.trackAccess(token, session?.user?.id);

    // Get the actual report
    const report = await reportService.getReportById(sharedReport.reportId);
    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Return report with sharing context
    return NextResponse.json({
      report: {
        ...report,
        // Remove sensitive information for shared access
        createdBy: undefined,
        companyId: sharedReport.requireLogin ? report.companyId : undefined,
      },
      shareInfo: {
        permissions: sharedReport.permissions,
        allowDownload: sharedReport.allowDownload,
        expiresAt: sharedReport.expiresAt,
        accessCount: sharedReport.accessCount + 1,
      },
    });
  } catch (error) {
    console.error('Access shared report error:', error);
    return NextResponse.json(
      { error: 'Failed to access shared report' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    await connectDB();
    const { token } = await params;

    const { action } = await request.json();

    if (action === 'download') {
      // Handle download request for shared report
      const session = await getServerSession(authOptions);

      // Get shared report info
      const sharedReport = null; // Would fetch from DB

      if (
        !sharedReport ||
        !sharedReport.isActive ||
        !sharedReport.allowDownload
      ) {
        return NextResponse.json(
          { error: 'Download not allowed' },
          { status: 403 }
        );
      }

      // Track download
      await reportSharingService.trackAccess(token, session?.user?.id);

      return NextResponse.json({
        success: true,
        downloadUrl: `/api/reports/${sharedReport.reportId}/export?token=${token}`,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Shared report action error:', error);
    return NextResponse.json(
      { error: 'Failed to process action' },
      { status: 500 }
    );
  }
}
