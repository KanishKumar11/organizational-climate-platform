import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ActionPlan } from '@/models/ActionPlan';
import { ActionPlanTemplate } from '@/models/ActionPlanTemplate';
import { User } from '@/models/User';
import { connectDB } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

// POST /api/action-plans/bulk-create - Create multiple action plans from insights
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
      survey_id,
      insights,
      default_due_date,
      default_assigned_to = [],
      auto_assign_by_department = false,
    } = body;

    // Validate required fields
    if (!insights || !Array.isArray(insights) || insights.length === 0) {
      return Response.json(
        {
          error: 'Missing or invalid insights array',
        },
        { status: 400 }
      );
    }

    if (!default_due_date) {
      return Response.json(
        {
          error: 'Missing default_due_date',
        },
        { status: 400 }
      );
    }

    const createdActionPlans = [];
    const errors = [];

    for (const insight of insights) {
      try {
        const {
          title,
          description,
          priority = 'medium',
          recommended_actions = [],
          affected_departments = [],
          template_id,
        } = insight;

        if (!title || !description) {
          errors.push(`Skipping insight: missing title or description`);
          continue;
        }

        // Determine assigned users
        let assigned_to = default_assigned_to;

        if (auto_assign_by_department && affected_departments.length > 0) {
          // Find department admins and leaders for affected departments
          const departmentUsers = await (User as any)
            .find({
              company_id: user.company_id,
              department_id: { $in: affected_departments },
              role: { $in: ['department_admin', 'leader'] },
              is_active: true,
            })
            .select('_id');

          assigned_to = [
            ...new Set([
              ...default_assigned_to,
              ...departmentUsers.map((u) => u._id.toString()),
            ]),
          ];
        }

        if (assigned_to.length === 0) {
          assigned_to = [user._id.toString()]; // Assign to creator if no one else
        }

        // Get template if specified
        let kpis = [];
        let qualitative_objectives = [];
        let ai_recommendations = recommended_actions;

        if (template_id) {
          const template = await (ActionPlanTemplate as any).findById(
            template_id
          );
          if (template) {
            kpis = template.kpi_templates.map((kpi) => ({
              ...kpi.toObject(),
              id: uuidv4(),
              current_value: 0,
            }));

            qualitative_objectives =
              template.qualitative_objective_templates.map((obj) => ({
                ...obj.toObject(),
                id: uuidv4(),
                current_status: '',
                completion_percentage: 0,
              }));

            ai_recommendations = [
              ...ai_recommendations,
              ...template.ai_recommendation_templates,
            ];
          }
        }

        // Create action plan
        const actionPlan = new ActionPlan({
          title,
          description,
          company_id: user.company_id,
          department_id:
            affected_departments.length === 1
              ? affected_departments[0]
              : user.department_id,
          created_by: user._id,
          assigned_to,
          due_date: new Date(default_due_date),
          priority,
          kpis,
          qualitative_objectives,
          ai_recommendations,
          tags: ['bulk-created', 'ai-generated'],
          template_id,
          source_survey_id: survey_id,
          source_insight_id: insight.id,
        });

        await actionPlan.save();

        // Populate the response
        await actionPlan.populate('created_by', 'name email');
        await actionPlan.populate('assigned_to', 'name email');

        createdActionPlans.push(actionPlan);

        // Increment template usage if used
        if (template_id) {
          await (ActionPlanTemplate as any).findByIdAndUpdate(template_id, {
            $inc: { usage_count: 1 },
          });
        }
      } catch (error) {
        console.error('Error creating action plan for insight:', error);
        errors.push(
          `Failed to create action plan for insight "${insight.title}": ${error.message}`
        );
      }
    }

    return Response.json(
      {
        created_action_plans: createdActionPlans,
        created_count: createdActionPlans.length,
        errors,
        message: `Successfully created ${createdActionPlans.length} action plans${errors.length > 0 ? ` with ${errors.length} errors` : ''}`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error bulk creating action plans:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}


