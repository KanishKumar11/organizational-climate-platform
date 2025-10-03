import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { notificationService } from '@/lib/notification-service';
import { connectDB } from '@/lib/mongodb';
import { z } from 'zod';
import { TimeConstraints } from '@/types/notifications';

// Validation schema
const optimizationRequestSchema = z.object({
  user_ids: z.array(z.string()).optional(),
  company_id: z.string().optional(),
  notification_type: z.string(),
  content_template: z.string(),
  target_engagement_rate: z.number().min(0).max(1).optional(),
  time_constraints: z
    .object({
      earliest_hour: z.number().min(0).max(23).default(9),
      latest_hour: z.number().min(0).max(23).default(17),
      allowed_days: z.array(z.number().min(0).max(6)).default([1, 2, 3, 4, 5]), // Mon-Fri
      timezone: z.string().default('UTC'),
    })
    .optional(),
});

// GET /api/notifications/delivery-optimization - Get optimal delivery times
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can access delivery optimization
    if (!['super_admin', 'company_admin'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');
    const company_id = searchParams.get('company_id') || session.user.companyId;
    const notification_type = searchParams.get('notification_type');
    const timeframe = searchParams.get('timeframe') || '30'; // days

    const optimizationData = await notificationService.getDeliveryOptimization({
      user_id,
      company_id,
      notification_type,
      timeframe: parseInt(timeframe),
    });

    return NextResponse.json({
      success: true,
      optimization: optimizationData,
    });
  } catch (error) {
    console.error('Error getting delivery optimization:', error);
    return NextResponse.json(
      { error: 'Failed to get delivery optimization' },
      { status: 500 }
    );
  }
}

// POST /api/notifications/delivery-optimization - Optimize notification delivery
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can optimize delivery
    if (!['super_admin', 'company_admin'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = optimizationRequestSchema.parse(body);

    await connectDB();

    const companyId = validatedData.company_id || session.user.companyId;

    // Convert time constraints to proper format
    const timeConstraints: TimeConstraints | undefined = validatedData.time_constraints
      ? {
          timezone: validatedData.time_constraints.timezone,
          business_hours_only: true,
          business_hours_start: `${String(validatedData.time_constraints.earliest_hour).padStart(2, '0')}:00`,
          business_hours_end: `${String(validatedData.time_constraints.latest_hour).padStart(2, '0')}:00`,
          exclude_weekends: validatedData.time_constraints.allowed_days
            ? !validatedData.time_constraints.allowed_days.includes(0) && !validatedData.time_constraints.allowed_days.includes(6)
            : false,
          exclude_holidays: false,
        }
      : undefined;

    // Generate optimized delivery schedule
    const optimizedSchedule =
      await notificationService.optimizeDeliverySchedule({
        user_ids: validatedData.user_ids,
        company_id: companyId,
        notification_type: validatedData.notification_type,
        content_template: validatedData.content_template,
        target_engagement_rate: validatedData.target_engagement_rate,
        time_constraints: timeConstraints,
      });

    return NextResponse.json({
      success: true,
      optimized_schedule: optimizedSchedule,
    });
  } catch (error) {
    console.error('Error optimizing notification delivery:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to optimize notification delivery' },
      { status: 500 }
    );
  }
}
