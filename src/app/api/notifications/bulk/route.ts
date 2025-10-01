import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { notificationService } from '@/lib/notification-service';
import Notification from '@/models/Notification';
import { connectDB } from '@/lib/mongodb';
import { z } from 'zod';
import { withRateLimit, notificationBulkLimiter } from '@/lib/rate-limiting';

// Validation schema for bulk notification operations
const bulkNotificationSchema = z.object({
  operation: z.enum([
    'create',
    'send',
    'cancel',
    'mark_read',
    'mark_unread',
    'delete',
  ]),
  notification_ids: z.array(z.string()).optional(),
  notifications: z.array(z.any()).optional(),
  filters: z
    .object({
      user_id: z.string().optional(),
      company_id: z.string().optional(),
      type: z.string().optional(),
      channel: z.string().optional(),
      status: z.string().optional(),
      priority: z.string().optional(),
      date_range: z
        .object({
          start: z.string().datetime().optional(),
          end: z.string().datetime().optional(),
        })
        .optional(),
    })
    .optional(),
  template_data: z
    .object({
      template_id: z.string().optional(),
      variables: z.record(z.string(), z.any()).optional(),
    })
    .optional(),
});

// PATCH /api/notifications/bulk - Bulk update operations
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const { action, user_id, status, filters } = body;

    // Validate action
    if (
      !['mark_opened', 'mark_delivered', 'cancel', 'delete'].includes(action)
    ) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Build query based on user permissions
    const query: any = {};

    if (user_id && user_id === session.user.id) {
      // User can only update their own notifications
      query.user_id = user_id;
    } else if (['super_admin', 'company_admin'].includes(session.user.role)) {
      // Admins can update notifications for their company
      query.company_id = session.user.companyId;
      if (user_id) query.user_id = user_id;
    } else {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Apply filters
    if (filters) {
      if (filters.status) query.status = filters.status;
      if (filters.type) query.type = filters.type;
      if (filters.priority) query.priority = filters.priority;
    }

    // Apply status filter for mark_opened action
    if (action === 'mark_opened') {
      query.status = 'delivered';
    }

    const updateData: any = {};

    switch (action) {
      case 'mark_opened':
        updateData.status = 'opened';
        updateData.opened_at = new Date();
        break;
      case 'mark_delivered':
        updateData.status = 'delivered';
        updateData.delivered_at = new Date();
        break;
      case 'cancel':
        updateData.status = 'cancelled';
        break;
      case 'delete':
        // For delete, we'll use deleteMany instead of update
        break;
    }

    let result;

    if (action === 'delete') {
      result = await Notification.deleteMany(query);
    } else {
      result = await Notification.updateMany(query, {
        $set: updateData,
        $inc: { retry_count: 1 },
        updated_at: new Date(),
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        matched: result.matchedCount || result.deletedCount,
        modified: result.modifiedCount || result.deletedCount,
      },
    });
  } catch (error) {
    console.error('Error in bulk notification update:', error);
    return NextResponse.json(
      { error: 'Failed to update notifications' },
      { status: 500 }
    );
  }
}
export const POST = withRateLimit(
  notificationBulkLimiter,
  async (request: NextRequest) => {
    try {
      const session = await getServerSession(authOptions);
      if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Only admins can perform bulk notification operations
      if (!['super_admin', 'company_admin'].includes(session.user.role)) {
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        );
      }

      await connectDB();

      const body = await request.json();
      const {
        operation,
        notification_ids,
        notifications,
        filters,
        template_data,
      } = bulkNotificationSchema.parse(body);

      let result;

      switch (operation) {
        case 'create':
          result = await bulkCreateNotifications(
            notifications || [],
            session.user,
            template_data
          );
          break;
        case 'send':
          result = await bulkSendNotifications(
            notification_ids || [],
            session.user
          );
          break;
        case 'cancel':
          result = await bulkCancelNotifications(
            notification_ids || [],
            session.user
          );
          break;
        case 'mark_read':
          result = await bulkMarkNotifications(
            notification_ids || [],
            'read',
            session.user
          );
          break;
        case 'mark_unread':
          result = await bulkMarkNotifications(
            notification_ids || [],
            'unread',
            session.user
          );
          break;
        case 'delete':
          result = await bulkDeleteNotifications(
            notification_ids || [],
            session.user
          );
          break;
        default:
          return NextResponse.json(
            { error: 'Invalid operation' },
            { status: 400 }
          );
      }

      return NextResponse.json({
        success: true,
        operation,
        result,
      });
    } catch (error) {
      console.error('Error performing bulk notification operation:', error);

      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Validation failed', details: error.issues },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to perform bulk operation' },
        { status: 500 }
      );
    }
  }
);

async function bulkCreateNotifications(
  notifications: any[],
  user: any,
  templateData?: any
) {
  const results = {
    created: 0,
    errors: [] as any[],
    notifications: [] as any[],
  };

  for (let i = 0; i < notifications.length; i++) {
    try {
      const notificationData = {
        ...notifications[i],
        company_id: notifications[i].company_id || user.companyId,
        created_by: user.id,
        ...templateData,
      };

      const notification =
        await notificationService.createNotification(notificationData);
      results.notifications.push(notification);
      results.created++;
    } catch (error) {
      results.errors.push({
        index: i,
        error: error instanceof Error ? error.message : 'Creation failed',
        data: notifications[i],
      });
    }
  }

  return results;
}

async function bulkSendNotifications(notificationIds: string[], user: any) {
  const results = {
    sent: 0,
    errors: [] as any[],
  };

  for (const notificationId of notificationIds) {
    try {
      await notificationService.sendNotification(notificationId);
      results.sent++;
    } catch (error) {
      results.errors.push({
        notification_id: notificationId,
        error: error instanceof Error ? error.message : 'Send failed',
      });
    }
  }

  return results;
}

async function bulkCancelNotifications(notificationIds: string[], user: any) {
  const result = await notificationService.bulkUpdateNotifications(
    notificationIds,
    {
      status: 'cancelled',
      cancelled_at: new Date(),
      cancelled_by: user.id,
    },
    user.companyId
  );

  return {
    matched: result.matchedCount,
    cancelled: result.modifiedCount,
  };
}

async function bulkMarkNotifications(
  notificationIds: string[],
  status: 'read' | 'unread',
  user: any
) {
  const updateData =
    status === 'read'
      ? { is_read: true, read_at: new Date() }
      : { is_read: false, read_at: null };

  const result = await notificationService.bulkUpdateNotifications(
    notificationIds,
    updateData,
    user.companyId
  );

  return {
    matched: result.matchedCount,
    updated: result.modifiedCount,
  };
}

async function bulkDeleteNotifications(notificationIds: string[], user: any) {
  const result = await notificationService.bulkDeleteNotifications(
    notificationIds,
    user.companyId
  );

  return {
    matched: result.matchedCount,
    deleted: result.modifiedCount,
  };
}
