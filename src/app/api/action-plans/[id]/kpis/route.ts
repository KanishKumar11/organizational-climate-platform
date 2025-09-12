import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ActionPlan } from '@/models/ActionPlan';
import { User } from '@/models/User';
import { connectDB } from '@/lib/db';
import { canAccessActionPlan } from '@/lib/permissions';
import { v4 as uuidv4 } from 'uuid';

// GET /api/action-plans/[id]/kpis - Get KPIs for action plan
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

    const user = await (User as any).findById(session.user.id);
    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    const { id } = await params;
    const actionPlan = await (ActionPlan as any).findById(id);

    if (!actionPlan) {
      return Response.json({ error: 'Action plan not found' }, { status: 404 });
    }

    // Check access permissions
    if (!canAccessActionPlan(user, actionPlan)) {
      return Response.json({ error: 'Access denied' }, { status: 403 });
    }

    // Calculate KPI analytics
    const kpiAnalytics = actionPlan.kpis.map((kpi: any) => {
      const progress =
        kpi.target_value > 0 ? (kpi.current_value / kpi.target_value) * 100 : 0;
      const isOnTrack = progress >= 75;
      const isAtRisk = progress < 50;

      // Calculate trend from progress updates
      const kpiUpdates = actionPlan.progress_updates
        .filter((update: any) =>
          update.kpi_updates.some((ku: any) => ku.kpi_id === kpi.id)
        )
        .map((update: any) => ({
          date: update.update_date,
          value:
            update.kpi_updates.find((ku: any) => ku.kpi_id === kpi.id)
              ?.new_value || 0,
        }))
        .sort(
          (a: any, b: any) =>
            new Date(a.date).getTime() - new Date(b.date).getTime()
        );

      let trend = 'stable';
      if (kpiUpdates.length >= 2) {
        const recent = kpiUpdates.slice(-2);
        if (recent[1].value > recent[0].value) trend = 'improving';
        else if (recent[1].value < recent[0].value) trend = 'declining';
      }

      return {
        ...kpi.toObject(),
        progress: Math.round(progress),
        is_on_track: isOnTrack,
        is_at_risk: isAtRisk,
        trend,
        update_history: kpiUpdates,
        last_updated:
          kpiUpdates.length > 0 ? kpiUpdates[kpiUpdates.length - 1].date : null,
      };
    });

    // Overall KPI summary
    const summary = {
      total_kpis: actionPlan.kpis.length,
      on_track: kpiAnalytics.filter((k: any) => k.is_on_track).length,
      at_risk: kpiAnalytics.filter((k: any) => k.is_at_risk).length,
      average_progress:
        kpiAnalytics.length > 0
          ? Math.round(
              kpiAnalytics.reduce(
                (sum: number, k: any) => sum + k.progress,
                0
              ) / kpiAnalytics.length
            )
          : 0,
      improving_trend: kpiAnalytics.filter((k: any) => k.trend === 'improving')
        .length,
      declining_trend: kpiAnalytics.filter((k: any) => k.trend === 'declining')
        .length,
    };

    return Response.json({
      action_plan_id: actionPlan._id,
      action_plan_title: actionPlan.title,
      kpis: kpiAnalytics,
      summary,
    });
  } catch (error) {
    console.error('Error fetching KPIs:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/action-plans/[id]/kpis - Add new KPI to action plan
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

    const user = await (User as any).findById(session.user.id);
    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    const { id } = await params;
    const actionPlan = await (ActionPlan as any).findById(id);

    if (!actionPlan) {
      return Response.json({ error: 'Action plan not found' }, { status: 404 });
    }

    // Check access permissions
    if (!canAccessActionPlan(user, actionPlan)) {
      return Response.json({ error: 'Access denied' }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      target_value,
      unit,
      measurement_frequency,
      current_value = 0,
    } = body;

    // Validate required fields
    if (!name || !target_value || !unit || !measurement_frequency) {
      return Response.json(
        {
          error:
            'Missing required fields: name, target_value, unit, measurement_frequency',
        },
        { status: 400 }
      );
    }

    // Validate measurement frequency
    const validFrequencies = ['daily', 'weekly', 'monthly', 'quarterly'];
    if (!validFrequencies.includes(measurement_frequency)) {
      return Response.json(
        {
          error:
            'Invalid measurement_frequency. Must be one of: daily, weekly, monthly, quarterly',
        },
        { status: 400 }
      );
    }

    // Create new KPI
    const newKPI = {
      id: uuidv4(),
      name,
      target_value: Number(target_value),
      current_value: Number(current_value),
      unit,
      measurement_frequency,
    };

    actionPlan.kpis.push(newKPI);
    await actionPlan.save();

    return Response.json(
      {
        kpi: newKPI,
        message: 'KPI added successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error adding KPI:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/action-plans/[id]/kpis - Update KPI values
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const user = await (User as any).findById(session.user.id);
    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    const { id } = await params;
    const actionPlan = await (ActionPlan as any).findById(id);

    if (!actionPlan) {
      return Response.json({ error: 'Action plan not found' }, { status: 404 });
    }

    // Check access permissions
    if (!canAccessActionPlan(user, actionPlan)) {
      return Response.json({ error: 'Access denied' }, { status: 403 });
    }

    const body = await request.json();
    const { kpi_id, updates } = body;

    if (!kpi_id || !updates) {
      return Response.json(
        { error: 'Missing required fields: kpi_id, updates' },
        { status: 400 }
      );
    }

    // Find and update the KPI
    const kpiIndex = actionPlan.kpis.findIndex((k: any) => k.id === kpi_id);
    if (kpiIndex === -1) {
      return Response.json({ error: 'KPI not found' }, { status: 404 });
    }

    // Update KPI fields
    const kpi = actionPlan.kpis[kpiIndex];
    if (updates.name !== undefined) kpi.name = updates.name;
    if (updates.target_value !== undefined)
      kpi.target_value = Number(updates.target_value);
    if (updates.current_value !== undefined)
      kpi.current_value = Number(updates.current_value);
    if (updates.unit !== undefined) kpi.unit = updates.unit;
    if (updates.measurement_frequency !== undefined) {
      const validFrequencies = ['daily', 'weekly', 'monthly', 'quarterly'];
      if (!validFrequencies.includes(updates.measurement_frequency)) {
        return Response.json(
          {
            error:
              'Invalid measurement_frequency. Must be one of: daily, weekly, monthly, quarterly',
          },
          { status: 400 }
        );
      }
      kpi.measurement_frequency = updates.measurement_frequency;
    }

    await actionPlan.save();

    return Response.json({
      kpi: kpi,
      message: 'KPI updated successfully',
    });
  } catch (error) {
    console.error('Error updating KPI:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/action-plans/[id]/kpis - Remove KPI from action plan
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const user = await (User as any).findById(session.user.id);
    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const kpiId = searchParams.get('kpi_id');

    if (!kpiId) {
      return Response.json(
        { error: 'Missing kpi_id parameter' },
        { status: 400 }
      );
    }

    const actionPlan = await (ActionPlan as any).findById(id);

    if (!actionPlan) {
      return Response.json({ error: 'Action plan not found' }, { status: 404 });
    }

    // Check access permissions
    if (!canAccessActionPlan(user, actionPlan)) {
      return Response.json({ error: 'Access denied' }, { status: 403 });
    }

    // Find and remove the KPI
    const kpiIndex = actionPlan.kpis.findIndex((k: any) => k.id === kpiId);
    if (kpiIndex === -1) {
      return Response.json({ error: 'KPI not found' }, { status: 404 });
    }

    actionPlan.kpis.splice(kpiIndex, 1);
    await actionPlan.save();

    return Response.json({
      message: 'KPI removed successfully',
    });
  } catch (error) {
    console.error('Error removing KPI:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
