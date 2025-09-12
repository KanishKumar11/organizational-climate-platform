import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { notificationService } from '@/lib/notification-service';
import { connectDB } from '@/lib/mongodb';
import { z } from 'zod';

// Validation schema for notification scheduling
const scheduleNotificationSchema = z.object({
  notifications: z.array(
    z.object({
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
      template_id: z.string().optional(),
      variables: z.record(z.string(), z.any()).optional(),
      scheduled_for: z.string().datetime(),
    })
  ),
  recurrence: z
    .object({
      enabled: z.boolean().default(false),
      pattern: z.enum(['daily', 'weekly', 'monthly', 'quarterly']).optional(),
      interval: z.number().min(1).optional(),
      end_date: z.string().datetime().optional(),
      max_occurrences: z.number().min(1).optional(),
    })
    .optional(),
  optimization: z
    .object({
      enabled: z.boolean().default(false),
      optimize_send_time: z.boolean().default(false),
      respect_user_timezone: z.boolean().default(true),
      avoid_weekends: z.boolean().default(false),
      avoid_holidays: z.boolean().default(false),
    })
    .optional(),
});

// POST /api/notifications/schedule - Schedule notifications with optimization
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can schedule notifications
    if (!['super_admin', 'company_admin'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    await connectDB();

    const body = await request.json();
    const { notifications, recurrence, optimization } =
      scheduleNotificationSchema.parse(body);

    const schedulingResults = {
      scheduled: 0,
      errors: [] as any[],
      scheduled_notifications: [] as any[],
    };

    for (let i = 0; i < notifications.length; i++) {
      const notificationData = notifications[i];

      try {
        // Apply optimization if enabled
        let scheduledFor = new Date(notificationData.scheduled_for);

        if (optimization?.enabled) {
          scheduledFor = await optimizeScheduleTime(
            scheduledFor,
            notificationData.user_id,
            optimization
          );
        }

        // Create the scheduled notification
        const scheduledNotification =
          await notificationService.createNotification({
            ...notificationData,
            company_id: session.user.companyId,
            scheduled_for: scheduledFor,
          });

        // If recurrence is enabled, create recurring schedule
        if (recurrence?.enabled && recurrence.pattern) {
          await createRecurringSchedule(
            scheduledNotification,
            recurrence,
            optimization
          );
        }

        schedulingResults.scheduled_notifications.push(scheduledNotification);
        schedulingResults.scheduled++;
      } catch (error) {
        schedulingResults.errors.push({
          index: i,
          error: error instanceof Error ? error.message : 'Scheduling failed',
          data: notificationData,
        });
      }
    }

    return NextResponse.json({
      success: true,
      results: schedulingResults,
    });
  } catch (error) {
    console.error('Error scheduling notifications:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to schedule notifications' },
      { status: 500 }
    );
  }
}

// GET /api/notifications/schedule - Get scheduled notifications
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'scheduled';
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');

    const scheduledNotifications =
      await notificationService.getScheduledNotifications({
        company_id: session.user.companyId,
        status,
        limit,
        page,
      });

    return NextResponse.json({
      success: true,
      data: scheduledNotifications,
    });
  } catch (error) {
    console.error('Error fetching scheduled notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scheduled notifications' },
      { status: 500 }
    );
  }
}

async function optimizeScheduleTime(
  originalTime: Date,
  userId: string,
  optimization: any
): Promise<Date> {
  let optimizedTime = new Date(originalTime);

  // Get user's timezone and preferences
  if (optimization.respect_user_timezone) {
    const userPreferences =
      await notificationService.getUserPreferences(userId);
    if (userPreferences?.timezone) {
      // Adjust for user's timezone
      // This is a simplified implementation
      optimizedTime = adjustForTimezone(
        optimizedTime,
        userPreferences.timezone
      );
    }
  }

  // Optimize send time based on user's historical engagement
  if (optimization.optimize_send_time) {
    const optimalTime = await notificationService.getOptimalSendTime(userId);
    if (optimalTime) {
      optimizedTime.setHours(optimalTime.hour, optimalTime.minute, 0, 0);
    }
  }

  // Avoid weekends if requested
  if (optimization.avoid_weekends) {
    const dayOfWeek = optimizedTime.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      // Sunday or Saturday
      // Move to next Monday
      const daysToAdd = dayOfWeek === 0 ? 1 : 2;
      optimizedTime.setDate(optimizedTime.getDate() + daysToAdd);
    }
  }

  // Avoid holidays if requested
  if (optimization.avoid_holidays) {
    // This would integrate with a holiday API or database
    // For now, just a placeholder
    const isHoliday = await checkIfHoliday(optimizedTime);
    if (isHoliday) {
      optimizedTime.setDate(optimizedTime.getDate() + 1);
    }
  }

  return optimizedTime;
}

async function createRecurringSchedule(
  baseNotification: any,
  recurrence: any,
  optimization?: any
) {
  const recurringNotifications = [];
  let currentDate = new Date(baseNotification.scheduled_for);
  let occurrenceCount = 0;

  while (true) {
    // Calculate next occurrence
    switch (recurrence.pattern) {
      case 'daily':
        currentDate.setDate(currentDate.getDate() + (recurrence.interval || 1));
        break;
      case 'weekly':
        currentDate.setDate(
          currentDate.getDate() + 7 * (recurrence.interval || 1)
        );
        break;
      case 'monthly':
        currentDate.setMonth(
          currentDate.getMonth() + (recurrence.interval || 1)
        );
        break;
      case 'quarterly':
        currentDate.setMonth(
          currentDate.getMonth() + 3 * (recurrence.interval || 1)
        );
        break;
    }

    occurrenceCount++;

    // Check end conditions
    if (recurrence.end_date && currentDate > new Date(recurrence.end_date)) {
      break;
    }
    if (
      recurrence.max_occurrences &&
      occurrenceCount >= recurrence.max_occurrences
    ) {
      break;
    }

    // Apply optimization to recurring notifications
    let scheduledFor = new Date(currentDate);
    if (optimization?.enabled) {
      scheduledFor = await optimizeScheduleTime(
        scheduledFor,
        baseNotification.user_id,
        optimization
      );
    }

    // Create recurring notification
    const recurringNotification = await notificationService.createNotification({
      ...baseNotification,
      scheduled_for: scheduledFor,
      parent_notification_id: baseNotification._id,
      occurrence_number: occurrenceCount,
    });

    recurringNotifications.push(recurringNotification);
  }

  return recurringNotifications;
}

function adjustForTimezone(date: Date, timezone: string): Date {
  // Simplified timezone adjustment
  // In a real implementation, you'd use a proper timezone library
  const adjustedDate = new Date(date);
  // This is a placeholder - implement proper timezone conversion
  return adjustedDate;
}

async function checkIfHoliday(date: Date): Promise<boolean> {
  // Placeholder for holiday checking
  // In a real implementation, you'd check against a holiday database or API
  return false;
}
