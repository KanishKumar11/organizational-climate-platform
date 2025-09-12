import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { notificationService } from '@/lib/notification-service';
import { connectDB } from '@/lib/mongodb';
import { z } from 'zod';

// Validation schema
const engagementTrackingSchema = z.object({
  notification_id: z.string(),
  event_type: z.enum([
    'delivered',
    'opened',
    'clicked',
    'dismissed',
    'converted',
  ]),
  timestamp: z.string().datetime().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

// GET /api/notifications/engagement-tracking - Get engagement metrics
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can view engagement tracking
    if (!['super_admin', 'company_admin'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const company_id = searchParams.get('company_id') || session.user.companyId;
    const notification_type = searchParams.get('notification_type');
    const timeframe = searchParams.get('timeframe') || '30'; // days
    const user_id = searchParams.get('user_id');
    const campaign_id = searchParams.get('campaign_id');

    const engagementMetrics = await notificationService.getEngagementMetrics({
      company_id,
      notification_type,
      timeframe: parseInt(timeframe),
      user_id,
      campaign_id,
    });

    return NextResponse.json({
      success: true,
      metrics: engagementMetrics,
    });
  } catch (error) {
    console.error('Error getting engagement tracking:', error);
    return NextResponse.json(
      { error: 'Failed to get engagement tracking' },
      { status: 500 }
    );
  }
}

// POST /api/notifications/engagement-tracking - Track engagement event
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = engagementTrackingSchema.parse(body);

    await connectDB();

    // Track engagement event
    const trackingResult = await notificationService.trackEngagementEvent({
      notification_id: validatedData.notification_id,
      user_id: session.user.id,
      event_type: validatedData.event_type,
      timestamp: validatedData.timestamp
        ? new Date(validatedData.timestamp)
        : new Date(),
      metadata: validatedData.metadata,
    });

    return NextResponse.json({
      success: true,
      tracking_result: trackingResult,
    });
  } catch (error) {
    console.error('Error tracking engagement:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to track engagement' },
      { status: 500 }
    );
  }
}

// PUT /api/notifications/engagement-tracking - Update engagement preferences
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { user_id, preferences } = body;

    // Users can only update their own preferences, admins can update any
    const targetUserId = user_id || session.user.id;
    if (
      targetUserId !== session.user.id &&
      !['super_admin', 'company_admin'].includes(session.user.role)
    ) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    await connectDB();

    const updatedPreferences =
      await notificationService.updateEngagementPreferences(
        targetUserId,
        preferences
      );

    return NextResponse.json({
      success: true,
      preferences: updatedPreferences,
    });
  } catch (error) {
    console.error('Error updating engagement preferences:', error);
    return NextResponse.json(
      { error: 'Failed to update engagement preferences' },
      { status: 500 }
    );
  }
}
