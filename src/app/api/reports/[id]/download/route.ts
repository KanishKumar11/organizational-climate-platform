import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import Report from '@/models/Report';
import { checkPermissions } from '@/lib/permissions';

// GET /api/reports/[id]/download - Download report file
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permissions
    if (!checkPermissions(session.user.role, 'EXPORT_REPORTS')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    await connectDB();
    const { id } = await params;

    // Build query based on user role
    let query: any = { _id: id };
    if (session.user.role !== 'super_admin') {
      query.company_id = session.user.company_id;
    }

    const report = await Report.findOne(query);

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    if (report.status !== 'completed') {
      return NextResponse.json(
        { error: 'Report is not ready for download' },
        { status: 400 }
      );
    }

    if (report.isExpired()) {
      return NextResponse.json(
        { error: 'Report has expired' },
        { status: 410 }
      );
    }

    // Check if user has access to this report
    const hasAccess =
      report.created_by === session.user.id ||
      report.shared_with?.includes(session.user.id) ||
      session.user.role === 'super_admin' ||
      (session.user.role === 'company_admin' &&
        report.company_id === session.user.company_id);

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Increment download count
    await report.incrementDownloadCount();

    // In a real implementation, you would:
    // 1. Read the file from storage (S3, local filesystem, etc.)
    // 2. Return the file with appropriate headers

    // For now, we'll return a mock response
    const mockFileContent = JSON.stringify(
      {
        report_id: report._id,
        title: report.title,
        generated_at: report.generation_completed_at,
        format: report.format,
        message:
          'This is a mock report file. In production, this would be the actual report content.',
      },
      null,
      2
    );

    const headers = new Headers();
    headers.set('Content-Type', getContentType(report.format));
    headers.set(
      'Content-Disposition',
      `attachment; filename="${report.title}.${report.format}"`
    );
    headers.set('Content-Length', mockFileContent.length.toString());

    return new NextResponse(mockFileContent, { headers });
  } catch (error) {
    console.error('Error downloading report:', error);
    return NextResponse.json(
      { error: 'Failed to download report' },
      { status: 500 }
    );
  }
}

function getContentType(format: string): string {
  switch (format) {
    case 'pdf':
      return 'application/pdf';
    case 'excel':
      return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    case 'csv':
      return 'text/csv';
    case 'json':
      return 'application/json';
    default:
      return 'application/octet-stream';
  }
}
