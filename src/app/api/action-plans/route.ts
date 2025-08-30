import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ActionPlan } from '@/models/ActionPlan';
import { ActionPlanTemplate } from '@/models/ActionPlanTemplate';
import { User } from '@/models/User';
import { connectDB } from '@/lib/db';
import { applyDataScoping } from '@/lib/permissions';
import { v4 as uuidv4 } from 'uuid';

// GET /api/action-plans - Retrieve action plans with scoping
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const assignedTo = searchParams.get('assigned_to');
    const companyId = searchParams.get('company_id');
    const departmentId = searchParams.get('department_id');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Build base query
    let query: any = {};

    // Apply role-based scoping
    const user = await (User as any).findById(session.user.id);
    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    query = applyDataScoping(query, user);

    // Apply filters
    if (status) query.status = status;
    if (assignedTo) query.assigned_to = { $in: [assignedTo] };
    if (companyId && user.role === 'super_admin') query.company_id = companyId;
    if (
      departmentId &&
      ['company_admin', 'department_admin'].includes(user.role)
    ) {
      query.department_id = departmentId;
    }

    const skip = (page - 1) * limit;

    const [actionPlans, total] = await Promise.all([
      (ActionPlan as any)
        .find(query)
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .populate('created_by', 'name email')
        .populate('assigned_to', 'name email'),
      (ActionPlan as any).countDocuments(query),
    ]);

    return Response.json({
      action_plans: actionPlans,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching action plans:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/action-plans - Create new action plan
export async function POST(request: NextRequest) {
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

    // Check permissions - only admins and leaders can create action plans
    if (
      !['super_admin', 'company_admin', 'department_admin', 'leader'].includes(
        user.role
      )
    ) {
      return Response.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      title,
      description,
      assigned_to,
      due_date,
      priority = 'medium',
      kpis = [],
      qualitative_objectives = [],
      ai_recommendations = [],
      tags = [],
      template_id,
      source_survey_id,
      source_insight_id,
      department_id,
    } = body;

    // Validate required fields
    if (!title || !description || !assigned_to || !due_date) {
      return Response.json(
        {
          error:
            'Missing required fields: title, description, assigned_to, due_date',
        },
        { status: 400 }
      );
    }

    // Validate assigned users exist and are in scope
    const assignedUsers = await (User as any).find({
      _id: { $in: assigned_to },
      company_id: user.company_id,
    });

    if (assignedUsers.length !== assigned_to.length) {
      return Response.json(
        { error: 'Some assigned users not found or not in scope' },
        { status: 400 }
      );
    }

    // Generate IDs for KPIs and objectives
    const processedKPIs = kpis.map((kpi: any) => ({
      ...kpi,
      id: uuidv4(),
      current_value: kpi.current_value || 0,
    }));

    const processedObjectives = qualitative_objectives.map((obj: any) => ({
      ...obj,
      id: uuidv4(),
      current_status: obj.current_status || '',
      completion_percentage: obj.completion_percentage || 0,
    }));

    // Create action plan
    const actionPlan = new ActionPlan({
      title,
      description,
      company_id: user.company_id,
      department_id: department_id || user.department_id,
      created_by: user._id,
      assigned_to,
      due_date: new Date(due_date),
      priority,
      kpis: processedKPIs,
      qualitative_objectives: processedObjectives,
      ai_recommendations,
      tags,
      template_id,
      source_survey_id,
      source_insight_id,
      progress_updates: [],
    });

    await actionPlan.save();

    // If created from template, increment usage count
    if (template_id) {
      await (ActionPlanTemplate as any).findByIdAndUpdate(template_id, {
        $inc: { usage_count: 1 },
      });
    }

    // Populate the response
    await actionPlan.populate('created_by', 'name email');
    await actionPlan.populate('assigned_to', 'name email');

    return Response.json(
      {
        action_plan: actionPlan,
        message: 'Action plan created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating action plan:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}


