import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { reportSharingService } from '@/lib/report-sharing';
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

    const { expiresAt, requireLogin, allowDownload } = await request.json();

    // Check if user has permission to create public link
    const report = await reportService.getReport(params.id, session.user.id);
    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    const canCreateLink =
      report.createdBy === session.user.id ||
      session.user.role === 'super_admin' ||
      session.user.role === 'company_admin';

    if (!canCreateLink) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const publicLink = await reportSharingService.createPublicLink(
      params.id,
      session.user.id,
      {
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
        requireLogin: requireLogin !== false,
        allowDownload: allowDownload !== false,
      }
    );

    return NextResponse.json({
      success: true,
      publicLink,
      expiresAt: expiresAt
        ? new Date(expiresAt)
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
  } catch (error) {
    console.error('Create public link error:', error);
    return NextResponse.json(
      { error: 'Failed to create public link' },
      { status: 500 }
    );
  }
}
