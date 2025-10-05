import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { ActionPlan } from '@/models/ActionPlan';
import { User } from '@/models/User';
import {
  exportActionPlanToPDF,
  ActionPlanPDFData,
} from '@/lib/pdf-export-service';

/**
 * GET /api/action-plans/[id]/export/pdf
 * Export action plan as PDF
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
      return NextResponse.json(
        { error: 'Action plan not found' },
        { status: 404 }
      );
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

    // Calculate overall progress
    const totalObjectives = actionPlan.objectives?.length || 0;
    const completedObjectives =
      actionPlan.objectives?.filter((obj: any) => obj.status === 'completed')
        .length || 0;
    const overallProgress =
      totalObjectives > 0 ? (completedObjectives / totalObjectives) * 100 : 0;

    // Prepare PDF data
    const pdfData: ActionPlanPDFData = {
      actionPlan: {
        title: actionPlan.title,
        description: actionPlan.description,
        status: actionPlan.status,
        priority: actionPlan.priority,
        due_date: actionPlan.due_date,
        progress_percentage: overallProgress,
      },
      kpis: (actionPlan.kpis || []).map((kpi: any) => ({
        name: kpi.name,
        target_value: kpi.target_value,
        current_value: kpi.current_value,
        unit: kpi.unit,
        progress_percentage:
          kpi.target_value > 0
            ? (kpi.current_value / kpi.target_value) * 100
            : 0,
      })),
      qualitativeObjectives: (actionPlan.qualitative_objectives || []).map(
        (obj: any) => ({
          description: obj.description,
          success_criteria: obj.success_criteria,
          completion_percentage: obj.completion_percentage || 0,
        })
      ),
      progressUpdates: (actionPlan.progress_updates || []).map(
        (update: any) => ({
          date: update.update_date || update.created_at,
          notes: update.overall_notes || '',
          updated_by: update.updated_by || 'Unknown',
        })
      ),
    };

    // Generate PDF
    const pdfBlob = await exportActionPlanToPDF(pdfData, {
      companyName: user.company_id?.name || 'Organizational Climate Platform',
      brandColor: '#4F46E5',
    });

    // Convert Blob to Buffer for Next.js response
    const buffer = await pdfBlob.arrayBuffer();

    // Return PDF file
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="action-plan-${actionPlan.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${Date.now()}.pdf"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Error exporting action plan to PDF:', error);
    return NextResponse.json(
      {
        error: 'Failed to export action plan',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
