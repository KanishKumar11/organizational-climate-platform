import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { notificationService } from '@/lib/notification-service';
import { connectDB } from '@/lib/mongodb';
import Notification from '@/models/Notification';
import { z } from 'zod';
import { withRateLimit, notificationApiLimiter } from '@/lib/rate-limiting';

// Validation schemas
const createNotificationSchema = z.object({
  user_id: z.string().min(1, 'User ID is required'),
  type: z.enum([
    'survey_invitation',
    'survey_reminder',
    'survey_completion',
    'microclimate_invitation',
    'action_plan_alert',
    'deadline_reminder',
    'ai_insight_alert',
    'system_notification',
  ]),
  channel: z.enum(['email', 'in_app', 'push', 'sms']),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  title: z.string().optional(),
  message: z.string().optional(),
  data: z
    .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
    .optional(),
  template_id: z.string().optional(),
  scheduled_for: z.string().datetime().optional(),
  variables: z
    .record(
      z.string(),
      z.union([z.string(), z.number(), z.boolean()])
    )
    .optional(),
  company_id: z.string().optional(),
});

const querySchema = z.object({
  user_id: z.string().optional(),
  company_id: z.string().optional(),
  type: z.string().optional(),
  channel: z.string().optional(),
  status: z.string().optional(),
  limit: z.string().transform(Number).optional(),
  page: z.string().transform(Number).optional(),
});

// GET /api/notifications - Get notifications
export const GET = withRateLimit(
  notificationApiLimiter,
  async (request: NextRequest) => {
    try {
      const session = await getServerSession(authOptions);
      if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      await connectDB();

      const { searchParams } = new URL(request.url);
      const query = querySchema.parse(Object.fromEntries(searchParams));

      const limit = query.limit || 50;
      const page = query.page || 1;
      const skip = (page - 1) * limit;
      const statusFilter = query.status
        ? query.status.split(',').map((s) => s.trim())
        : undefined;

      // Authorization checks
      if (query.user_id && query.user_id !== session.user.id) {
        // Only allow users to access their own notifications or if they have admin role
        const isAdmin =
          session.user.role === 'super_admin' ||
          session.user.role === 'company_admin';
        if (!isAdmin) {
          return NextResponse.json(
            { error: "Unauthorized: Cannot access other users' notifications" },
            { status: 403 }
          );
        }
      }

      if (query.company_id && query.company_id !== session.user.companyId) {
        // Only allow users to access their own company notifications or if they have super admin role
        const isSuperAdmin = session.user.role === 'super_admin';
        if (!isSuperAdmin) {
          return NextResponse.json(
            {
              error:
                "Unauthorized: Cannot access other companies' notifications",
            },
            { status: 403 }
          );
        }
      }

      let notifications;
      let total = 0;

      if (query.user_id) {
        // Get user-specific notifications (already validated above)
        notifications = await notificationService.getUserNotifications(
          query.user_id,
          limit,
          statusFilter,
          skip
        );

        // Get total count for pagination
        const statusFilterForCount = statusFilter || ['delivered', 'opened'];
        total = await (Notification as any).countDocuments({
          user_id: query.user_id,
          status: { $in: statusFilterForCount },
        });
      } else if (query.company_id) {
        // Get company-specific notifications (already validated above)
        notifications = await notificationService.getCompanyNotifications(
          query.company_id,
          limit,
          statusFilter,
          skip
        );

        // Get total count for pagination
        const statusFilterForCount = statusFilter || ['delivered', 'opened'];
        total = await (Notification as any).countDocuments({
          company_id: query.company_id,
          status: { $in: statusFilterForCount },
        });
      } else {
        // Get notifications for current user
        notifications = await notificationService.getUserNotifications(
          session.user.id,
          limit,
          statusFilter,
          skip
        );

        // Get total count for pagination
        const statusFilterForCount = statusFilter || ['delivered', 'opened'];
        total = await (Notification as any).countDocuments({
          user_id: session.user.id,
          status: { $in: statusFilterForCount },
        });
      }

      return NextResponse.json({
        success: true,
        data: notifications,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1,
        },
      });
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return NextResponse.json(
        { error: 'Failed to fetch notifications' },
        { status: 500 }
      );
    }
  }
);

// POST /api/notifications - Create notification
export const POST = withRateLimit(
  notificationApiLimiter,
  async (request: NextRequest) => {
    try {
      const session = await getServerSession(authOptions);
      if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const body = await request.json();
      const validatedData = createNotificationSchema.parse(body);

      // Authorization checks for creating notifications
      if (validatedData.user_id && validatedData.user_id !== session.user.id) {
        // Only allow admins to create notifications for other users
        const isAdmin =
          session.user.role === 'super_admin' ||
          session.user.role === 'company_admin';
        if (!isAdmin) {
          return NextResponse.json(
            {
              error:
                'Unauthorized: Cannot create notifications for other users',
            },
            { status: 403 }
          );
        }
      }

      if (
        validatedData.company_id &&
        validatedData.company_id !== session.user.companyId
      ) {
        // Only allow super admins to create notifications for other companies
        const isSuperAdmin = session.user.role === 'super_admin';
        if (!isSuperAdmin) {
          return NextResponse.json(
            {
              error:
                'Unauthorized: Cannot create notifications for other companies',
            },
            { status: 403 }
          );
        }
      }

      await connectDB();

      // Add company_id from session if not provided and user is not super admin
      const notificationData = {
        ...validatedData,
        company_id:
          validatedData.company_id ||
          (session.user.role !== 'super_admin'
            ? session.user.companyId
            : validatedData.company_id),
        scheduled_for: validatedData.scheduled_for
          ? new Date(validatedData.scheduled_for)
          : undefined,
      };

      const notification =
        await notificationService.createNotification(notificationData);

      return NextResponse.json(
        {
          success: true,
          data: notification,
        },
        { status: 201 }
      );
    } catch (error) {
      console.error('Error creating notification:', error);

      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Validation failed', details: error.issues },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to create notification' },
        { status: 500 }
      );
    }
  }
);
