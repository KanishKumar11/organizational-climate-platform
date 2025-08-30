import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import Report from '@/models/Report';
import { checkPermissions } from '@/lib/permissions';

// GET /api/reports/[id] - Get specific report
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
      query.company_id = session.user.companyId;
    }

    const report = await Report.findOne(query).lean();

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    return NextResponse.json(report);
  } catch (error) {
    console.error('Error fetching report:', error);
    return NextResponse.json(
      { error: 'Failed to fetch report' },
      { status: 500 }
    );
  }
}

// DELETE /api/reports/[id] - Delete report
export async function DELETE(
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
      query.company_id = session.user.companyId;
    }

    const report = await Report.findOneAndDelete(query);

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // In a real implementation, you would also delete the actual file
    // from storage (S3, local filesystem, etc.)

    return NextResponse.json({ message: 'Report deleted successfully' });
  } catch (error) {
    console.error('Error deleting report:', error);
    return NextResponse.json(
      { error: 'Failed to delete report' },
      { status: 500 }
    );
  }
}

// PATCH /api/reports/[id] - Update report (e.g., share settings)
export async function PATCH(
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

    const body = await request.json();
    const { shared_with, expires_at } = body;

    await connectDB();
    const { id } = await params;

    // Build query based on user role
    let query: any = { _id: id };
    if (session.user.role !== 'super_admin') {
      query.company_id = session.user.companyId;
    }

    const updateData: any = {};
    if (shared_with !== undefined) updateData.shared_with = shared_with;
    if (expires_at !== undefined)
      updateData.expires_at = expires_at ? new Date(expires_at) : null;

    const report = await Report.findOneAndUpdate(query, updateData, {
      new: true,
    });

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    return NextResponse.json(report);
  } catch (error) {
    console.error('Error updating report:', error);
    return NextResponse.json(
      { error: 'Failed to update report' },
      { status: 500 }
    );
  }
}
