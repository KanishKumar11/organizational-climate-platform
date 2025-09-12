import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ActionPlan } from '@/models/ActionPlan';
import { User } from '@/models/User';
import { connectDB } from '@/lib/db';
import { canAccessActionPlan } from '@/lib/permissions';

// POST /api/action-plans/bulk - Perform bulk operations on action plans
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

    // Check permissions - only admins and leaders can perform bulk operations
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
    const { operation, action_plan_ids, data } = body;

    if (!operation || !action_plan_ids || !Array.isArray(action_plan_ids)) {
      return Response.json(
        {
          error: 'Missing required fields: operation, action_plan_ids (array)',
        },
        { status: 400 }
      );
    }

    // Validate action plans exist and user has access
    const actionPlans = await (ActionPlan as any).find({
      _id: { $in: action_plan_ids },
    });

    if (actionPlans.length !== action_plan_ids.length) {
      return Response.json(
        { error: 'Some action plans not found' },
        { status: 404 }
      );
    }

    // Check access permissions for all action plans
    for (const actionPlan of actionPlans) {
      if (!canAccessActionPlan(user, actionPlan)) {
        return Response.json(
          { error: `Access denied for action plan: ${actionPlan.title}` },
          { status: 403 }
        );
      }
    }

    let results = [];

    switch (operation) {
      case 'update_status':
        results = await bulkUpdateStatus(actionPlans, data.status);
        break;
      case 'update_priority':
        results = await bulkUpdatePriority(actionPlans, data.priority);
        break;
      case 'extend_deadline':
        results = await bulkExtendDeadline(actionPlans, data.days);
        break;
      case 'assign_users':
        results = await bulkAssignUsers(actionPlans, data.user_ids, user);
        break;
      case 'add_tags':
        results = await bulkAddTags(actionPlans, data.tags);
        break;
      case 'remove_tags':
        results = await bulkRemoveTags(actionPlans, data.tags);
        break;
      case 'archive':
        results = await bulkArchive(actionPlans);
        break;
      case 'delete':
        results = await bulkDelete(actionPlans, user);
        break;
      default:
        return Response.json(
          {
            error:
              'Invalid operation. Supported: update_status, update_priority, extend_deadline, assign_users, add_tags, remove_tags, archive, delete',
          },
          { status: 400 }
        );
    }

    return Response.json({
      operation,
      processed_count: results.length,
      results,
      message: `Bulk ${operation} completed successfully`,
    });
  } catch (error) {
    console.error('Error performing bulk operation:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Bulk update status
async function bulkUpdateStatus(actionPlans: any[], status: string) {
  const validStatuses = [
    'not_started',
    'in_progress',
    'completed',
    'overdue',
    'cancelled',
  ];
  if (!validStatuses.includes(status)) {
    throw new Error('Invalid status');
  }

  const results = [];
  for (const plan of actionPlans) {
    plan.status = status;
    await plan.save();
    results.push({
      id: plan._id,
      title: plan.title,
      old_status: plan.status,
      new_status: status,
      success: true,
    });
  }
  return results;
}

// Bulk update priority
async function bulkUpdatePriority(actionPlans: any[], priority: string) {
  const validPriorities = ['low', 'medium', 'high', 'critical'];
  if (!validPriorities.includes(priority)) {
    throw new Error('Invalid priority');
  }

  const results = [];
  for (const plan of actionPlans) {
    const oldPriority = plan.priority;
    plan.priority = priority;
    await plan.save();
    results.push({
      id: plan._id,
      title: plan.title,
      old_priority: oldPriority,
      new_priority: priority,
      success: true,
    });
  }
  return results;
}

// Bulk extend deadline
async function bulkExtendDeadline(actionPlans: any[], days: number) {
  if (!days || days <= 0) {
    throw new Error('Invalid days value');
  }

  const results = [];
  for (const plan of actionPlans) {
    const oldDueDate = new Date(plan.due_date);
    const newDueDate = new Date(oldDueDate);
    newDueDate.setDate(newDueDate.getDate() + days);

    plan.due_date = newDueDate;

    // Update status if was overdue and now isn't
    if (plan.status === 'overdue' && newDueDate > new Date()) {
      plan.status = 'in_progress';
    }

    await plan.save();
    results.push({
      id: plan._id,
      title: plan.title,
      old_due_date: oldDueDate,
      new_due_date: newDueDate,
      days_extended: days,
      success: true,
    });
  }
  return results;
}

// Bulk assign users
async function bulkAssignUsers(
  actionPlans: any[],
  userIds: string[],
  currentUser: any
) {
  if (!userIds || !Array.isArray(userIds)) {
    throw new Error('Invalid user_ids');
  }

  // Validate users exist and are in scope
  const users = await (User as any).find({
    _id: { $in: userIds },
    company_id: currentUser.company_id,
  });

  if (users.length !== userIds.length) {
    throw new Error('Some users not found or not in scope');
  }

  const results = [];
  for (const plan of actionPlans) {
    const oldAssigned = [...plan.assigned_to];

    // Add new users (avoid duplicates)
    const newAssigned = [
      ...new Set([
        ...plan.assigned_to.map((u: any) => u.toString()),
        ...userIds,
      ]),
    ];
    plan.assigned_to = newAssigned;

    await plan.save();
    results.push({
      id: plan._id,
      title: plan.title,
      old_assigned_count: oldAssigned.length,
      new_assigned_count: newAssigned.length,
      added_users: userIds,
      success: true,
    });
  }
  return results;
}

// Bulk add tags
async function bulkAddTags(actionPlans: any[], tags: string[]) {
  if (!tags || !Array.isArray(tags)) {
    throw new Error('Invalid tags');
  }

  const results = [];
  for (const plan of actionPlans) {
    const oldTags = [...plan.tags];

    // Add new tags (avoid duplicates)
    const newTags = [...new Set([...plan.tags, ...tags])];
    plan.tags = newTags;

    await plan.save();
    results.push({
      id: plan._id,
      title: plan.title,
      old_tags: oldTags,
      new_tags: newTags,
      added_tags: tags,
      success: true,
    });
  }
  return results;
}

// Bulk remove tags
async function bulkRemoveTags(actionPlans: any[], tags: string[]) {
  if (!tags || !Array.isArray(tags)) {
    throw new Error('Invalid tags');
  }

  const results = [];
  for (const plan of actionPlans) {
    const oldTags = [...plan.tags];

    // Remove specified tags
    const newTags = plan.tags.filter((tag: string) => !tags.includes(tag));
    plan.tags = newTags;

    await plan.save();
    results.push({
      id: plan._id,
      title: plan.title,
      old_tags: oldTags,
      new_tags: newTags,
      removed_tags: tags,
      success: true,
    });
  }
  return results;
}

// Bulk archive (set status to cancelled)
async function bulkArchive(actionPlans: any[]) {
  const results = [];
  for (const plan of actionPlans) {
    const oldStatus = plan.status;
    plan.status = 'cancelled';
    await plan.save();
    results.push({
      id: plan._id,
      title: plan.title,
      old_status: oldStatus,
      new_status: 'cancelled',
      success: true,
    });
  }
  return results;
}

// Bulk delete
async function bulkDelete(actionPlans: any[], currentUser: any) {
  const results = [];

  for (const plan of actionPlans) {
    // Additional permission check for deletion
    const canDelete =
      currentUser.role === 'super_admin' ||
      (currentUser.role === 'company_admin' &&
        plan.company_id === currentUser.company_id) ||
      (currentUser.role === 'department_admin' &&
        plan.department_id === currentUser.department_id) ||
      plan.created_by.toString() === currentUser._id.toString();

    if (!canDelete) {
      results.push({
        id: plan._id,
        title: plan.title,
        success: false,
        error: 'Insufficient permissions to delete',
      });
      continue;
    }

    try {
      await (ActionPlan as any).findByIdAndDelete(plan._id);
      results.push({
        id: plan._id,
        title: plan.title,
        success: true,
      });
    } catch (error) {
      results.push({
        id: plan._id,
        title: plan.title,
        success: false,
        error: 'Failed to delete',
      });
    }
  }

  return results;
}

// GET /api/action-plans/bulk - Get bulk operation status or templates
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'operations';

    if (type === 'operations') {
      return Response.json({
        available_operations: [
          {
            operation: 'update_status',
            description: 'Update status for multiple action plans',
            required_data: {
              status:
                'string (not_started|in_progress|completed|overdue|cancelled)',
            },
          },
          {
            operation: 'update_priority',
            description: 'Update priority for multiple action plans',
            required_data: { priority: 'string (low|medium|high|critical)' },
          },
          {
            operation: 'extend_deadline',
            description: 'Extend deadline for multiple action plans',
            required_data: { days: 'number (positive integer)' },
          },
          {
            operation: 'assign_users',
            description: 'Assign additional users to multiple action plans',
            required_data: { user_ids: 'array of user IDs' },
          },
          {
            operation: 'add_tags',
            description: 'Add tags to multiple action plans',
            required_data: { tags: 'array of strings' },
          },
          {
            operation: 'remove_tags',
            description: 'Remove tags from multiple action plans',
            required_data: { tags: 'array of strings' },
          },
          {
            operation: 'archive',
            description:
              'Archive multiple action plans (set status to cancelled)',
            required_data: {},
          },
          {
            operation: 'delete',
            description: 'Delete multiple action plans (permanent)',
            required_data: {},
          },
        ],
      });
    }

    return Response.json({ error: 'Invalid type parameter' }, { status: 400 });
  } catch (error) {
    console.error('Error fetching bulk operations info:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
