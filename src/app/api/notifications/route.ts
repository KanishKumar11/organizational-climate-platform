import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { notificationService } from '@/lib/notification-service';
import { connectDB } from '@/lib/mongodb';
import { z } from 'zod';

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
      z.union([z.string(), z.number(), z.boolean(), z.date()])
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
export async function GET(request: NextRequest) {
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

    let notifications;

    if (query.user_id) {
      // Get user-specific notifications
      notifications = await notificationService.getUserNotifications(
        query.user_id,
        limit
      );
    } else if (query.company_id) {
      // Get company-specific notifications
      notifications = await notificationService.getCompanyNotifications(
        query.company_id,
        limit
      );
    } else {
      // Get notifications for current user
      notifications = await notificationService.getUserNotifications(
        session.user.id,
        limit
      );
    }

    return NextResponse.json({
      success: true,
      data: notifications,
      pagination: {
        page,
        limit,
        total: notifications.length,
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

// POST /api/notifications - Create notification
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createNotificationSchema.parse(body);

    await connectDB();

    // Add company_id from session if not provided
    const notificationData = {
      ...validatedData,
      company_id: validatedData.company_id || session.user.companyId,
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
