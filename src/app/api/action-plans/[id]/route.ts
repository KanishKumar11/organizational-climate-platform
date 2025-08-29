import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ActionPlan } from '@/models/ActionPlan';
import { User } from '@/models/User';
import { connectDB } from '@/lib/db';
import { canAccessActionPlan } from '@/lib/permissions';
import { v4 as uuidv4 } from 'uuid';

// GET /api/action-plans/[id] - Get specific action plan
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const actionPlan = await ActionPlan.findById(params.id)
      .populate('created_by', 'name email')
      .populate('assigned_to', 'name email');

    if (!actionPlan) {
      return Response.json({ error: 'Action plan not found' }, { status: 404 });
    }

    // Check access permissions
    if (!canAccessActionPlan(user, actionPlan)) {
      return Response.json({ error: 'Access denied' }, { status: 403 });
    }

    return Response.json({ action_plan: actionPlan });
  } catch (error) {
    console.error('Error fetching action plan:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/action-plans/[id] - Update action plan
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const actionPlan = await ActionPlan.findById(params.id);
    if (!actionPlan) {
      return Response.json({ error: 'Action plan not found' }, { status: 404 });
    }

    // Check access permissions
    if (!canAccessActionPlan(user, actionPlan)) {
      return Response.json({ error: 'Access denied' }, { status: 403 });
    }

    const body = await request.json();
    const {
      title,
      description,
      assigned_to,
      due_date,
      status,
      priority,
      kpis,
      qualitative_objectives,
      ai_recommendations,
      tags,
    } = body;

    // Update fields if provided
    if (title !== undefined) actionPlan.title = title;
    if (description !== undefined) actionPlan.description = description;
    if (assigned_to !== undefined) {
      // Validate assigned users exist and are in scope
      const assignedUsers = await User.find({
        _id: { $in: assigned_to },
        company_id: user.company_id,
      });

      if (assignedUsers.length !== assigned_to.length) {
        return Response.json(
          { error: 'Some assigned users not found or not in scope' },
          { status: 400 }
        );
      }
      actionPlan.assigned_to = assigned_to;
    }
    if (due_date !== undefined) actionPlan.due_date = new Date(due_date);
    if (status !== undefined) actionPlan.status = status;
    if (priority !== undefined) actionPlan.priority = priority;
    if (ai_recommendations !== undefined)
      actionPlan.ai_recommendations = ai_recommendations;
    if (tags !== undefined) actionPlan.tags = tags;

    // Update KPIs if provided
    if (kpis !== undefined) {
      actionPlan.kpis = kpis.map((kpi: any) => ({
        ...kpi,
        id: kpi.id || uuidv4(),
      }));
    }

    // Update qualitative objectives if provided
    if (qualitative_objectives !== undefined) {
      actionPlan.qualitative_objectives = qualitative_objectives.map(
        (obj: any) => ({
          ...obj,
          id: obj.id || uuidv4(),
        })
      );
    }

    await actionPlan.save();

    // Populate the response
    await actionPlan.populate('created_by', 'name email');
    await actionPlan.populate('assigned_to', 'name email');

    return Response.json({
      action_plan: actionPlan,
      message: 'Action plan updated successfully',
    });
  } catch (error) {
    console.error('Error updating action plan:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/action-plans/[id] - Delete action plan
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const actionPlan = await ActionPlan.findById(params.id);
    if (!actionPlan) {
      return Response.json({ error: 'Action plan not found' }, { status: 404 });
    }

    // Check access permissions - only creator or admins can delete
    const canDelete =
      user.role === 'super_admin' ||
      (user.role === 'company_admin' &&
        actionPlan.company_id === user.company_id) ||
      (user.role === 'department_admin' &&
        actionPlan.department_id === user.department_id) ||
      actionPlan.created_by.toString() === user._id.toString();

    if (!canDelete) {
      return Response.json(
        { error: 'Insufficient permissions to delete' },
        { status: 403 }
      );
    }

    await ActionPlan.findByIdAndDelete(params.id);

    return Response.json({ message: 'Action plan deleted successfully' });
  } catch (error) {
    console.error('Error deleting action plan:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
