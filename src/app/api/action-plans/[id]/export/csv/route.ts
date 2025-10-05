import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { ActionPlan } from '@/models/ActionPlan';
import { User } from '@/models/User';
import { CSVExportService } from '@/lib/csv-export-service';

/**
 * GET /api/action-plans/[id]/export/csv
 * Export action plan data as CSV
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;

    // Fetch action plan
    const actionPlan = await (ActionPlan as any)
      .findById(id)
      .populate('created_by', 'name email')
      .populate('assigned_to', 'name email')
      .populate('survey_id', 'title')
      .lean();

    if (!actionPlan) {
      return NextResponse.json({ error: 'Action plan not found' }, { status: 404 });
    }

    // Check permissions
    const user = await (User as any).findById(session.user.id);
    if (
      user.role !== 'super_admin' &&
      user.role !== 'company_admin' &&
      actionPlan.created_by._id.toString() !== session.user.id
    ) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Generate CSV using CSVExportService
    const csvService = new CSVExportService();
    const csvContent = csvService.exportActionPlans([actionPlan]);

    // Return CSV file
    const filename = `action-plan-${actionPlan.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${Date.now()}.csv`;

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv;charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Error exporting action plan to CSV:', error);
    return NextResponse.json(
      { error: 'Failed to export action plan', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
