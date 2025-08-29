import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ActionPlan } from '@/models/ActionPlan';
import { User } from '@/models/User';
import { connectDB } from '@/lib/db';
import { canAccessActionPlan } from '@/lib/permissions';
import { v4 as uuidv4 } from 'uuid';

// GET /api/action-plans/[id]/progress - Get progress history
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const user = await User.findById(session.user.id);
    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    const { id } = await params;
    const actionPlan = await ActionPlan.findById(id).populate(
      'progress_updates.updated_by',
      'name email'
    );

    if (!actionPlan) {
      return Response.json({ error: 'Action plan not found' }, { status: 404 });
    }

    // Check access permissions
    if (!canAccessActionPlan(user, actionPlan)) {
      return Response.json({ error: 'Access denied' }, { status: 403 });
    }

    // Calculate overall progress
    const kpiProgress =
      actionPlan.kpis.length > 0
        ? actionPlan.kpis.reduce((sum, kpi) => {
            const progress =
              kpi.target_value > 0
                ? (kpi.current_value / kpi.target_value) * 100
                : 0;
            return sum + Math.min(100, progress);
          }, 0) / actionPlan.kpis.length
        : 0;

    const qualitativeProgress =
      actionPlan.qualitative_objectives.length > 0
        ? actionPlan.qualitative_objectives.reduce(
            (sum, obj) => sum + obj.completion_percentage,
            0
          ) / actionPlan.qualitative_objectives.length
        : 0;

    const overallProgress =
      actionPlan.kpis.length > 0 && actionPlan.qualitative_objectives.length > 0
        ? (kpiProgress + qualitativeProgress) / 2
        : kpiProgress || qualitativeProgress;

    return Response.json({
      action_plan: actionPlan,
      progress_summary: {
        overall_progress: Math.round(overallProgress),
        kpi_progress: Math.round(kpiProgress),
        qualitative_progress: Math.round(qualitativeProgress),
        total_updates: actionPlan.progress_updates.length,
        last_update:
          actionPlan.progress_updates.length > 0
            ? actionPlan.progress_updates[
                actionPlan.progress_updates.length - 1
              ].update_date
            : null,
      },
    });
  } catch (error) {
    console.error('Error fetching action plan progress:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/action-plans/[id]/progress - Add progress update
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const user = await User.findById(session.user.id);
    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    const { id } = await params;
    const actionPlan = await ActionPlan.findById(id);
    if (!actionPlan) {
      return Response.json({ error: 'Action plan not found' }, { status: 404 });
    }

    // Check access permissions
    if (!canAccessActionPlan(user, actionPlan)) {
      return Response.json({ error: 'Access denied' }, { status: 403 });
    }

    const body = await request.json();
    const {
      kpi_updates = [],
      qualitative_updates = [],
      overall_notes = '',
    } = body;

    // Validate KPI updates
    for (const kpiUpdate of kpi_updates) {
      const kpi = actionPlan.kpis.find((k) => k.id === kpiUpdate.kpi_id);
      if (!kpi) {
        return Response.json(
          {
            error: `KPI with id ${kpiUpdate.kpi_id} not found`,
          },
          { status: 400 }
        );
      }
    }

    // Validate qualitative updates
    for (const qualUpdate of qualitative_updates) {
      const objective = actionPlan.qualitative_objectives.find(
        (o) => o.id === qualUpdate.objective_id
      );
      if (!objective) {
        return Response.json(
          {
            error: `Objective with id ${qualUpdate.objective_id} not found`,
          },
          { status: 400 }
        );
      }
    }

    // Create progress update
    const progressUpdate = {
      id: uuidv4(),
      update_date: new Date(),
      kpi_updates,
      qualitative_updates,
      overall_notes,
      updated_by: user._id,
    };

    // Update KPI current values
    for (const kpiUpdate of kpi_updates) {
      const kpiIndex = actionPlan.kpis.findIndex(
        (k) => k.id === kpiUpdate.kpi_id
      );
      if (kpiIndex !== -1) {
        actionPlan.kpis[kpiIndex].current_value = kpiUpdate.new_value;
      }
    }

    // Update qualitative objective progress
    for (const qualUpdate of qualitative_updates) {
      const objIndex = actionPlan.qualitative_objectives.findIndex(
        (o) => o.id === qualUpdate.objective_id
      );
      if (objIndex !== -1) {
        actionPlan.qualitative_objectives[objIndex].current_status =
          qualUpdate.status_update;
        actionPlan.qualitative_objectives[objIndex].completion_percentage =
          qualUpdate.completion_percentage;
      }
    }

    // Add progress update to history
    actionPlan.progress_updates.push(progressUpdate);

    // Update action plan status based on progress
    const kpiProgress =
      actionPlan.kpis.length > 0
        ? actionPlan.kpis.reduce((sum, kpi) => {
            const progress =
              kpi.target_value > 0
                ? (kpi.current_value / kpi.target_value) * 100
                : 0;
            return sum + Math.min(100, progress);
          }, 0) / actionPlan.kpis.length
        : 0;

    const qualitativeProgress =
      actionPlan.qualitative_objectives.length > 0
        ? actionPlan.qualitative_objectives.reduce(
            (sum, obj) => sum + obj.completion_percentage,
            0
          ) / actionPlan.qualitative_objectives.length
        : 0;

    const overallProgress =
      actionPlan.kpis.length > 0 && actionPlan.qualitative_objectives.length > 0
        ? (kpiProgress + qualitativeProgress) / 2
        : kpiProgress || qualitativeProgress;

    // Auto-update status based on progress
    if (overallProgress >= 100 && actionPlan.status !== 'completed') {
      actionPlan.status = 'completed';
    } else if (overallProgress > 0 && actionPlan.status === 'not_started') {
      actionPlan.status = 'in_progress';
    }

    // Check if overdue
    const now = new Date();
    if (actionPlan.due_date < now && actionPlan.status !== 'completed') {
      actionPlan.status = 'overdue';
    }

    await actionPlan.save();

    // Populate the response
    await actionPlan.populate('progress_updates.updated_by', 'name email');

    return Response.json({
      action_plan: actionPlan,
      progress_update: progressUpdate,
      message: 'Progress updated successfully',
    });
  } catch (error) {
    console.error('Error updating action plan progress:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
