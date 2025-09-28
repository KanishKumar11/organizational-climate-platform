import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { notificationService } from '@/lib/notification-service';
import { connectDB } from '@/lib/mongodb';

// POST /api/notifications/process - Process pending notifications (for cron jobs)
export async function POST(request: NextRequest) {
  try {
    // This endpoint should be protected by API key or internal access only
    const authHeader = request.headers.get('authorization');
    const apiKey = process.env.INTERNAL_API_KEY;

    if (!apiKey || authHeader !== `Bearer ${apiKey}`) {
      // Fallback to session auth for development
      const session = await getServerSession(authOptions);
      if (!session?.user || session.user.role !== 'super_admin') {
        // TEMPORARY: Allow processing in development without auth
        if (process.env.NODE_ENV !== 'production') {
          console.log(
            'Development mode: allowing notification processing without auth'
          );
        } else {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
      }
    }

    const body = await request.json();
    const { limit = 100 } = body;

    await connectDB();

    // Process pending notifications
    await notificationService.processPendingNotifications(limit);

    return NextResponse.json({
      success: true,
      message: `Processed up to ${limit} pending notifications`,
    });
  } catch (error) {
    console.error('Error processing notifications:', error);
    return NextResponse.json(
      { error: 'Failed to process notifications' },
      { status: 500 }
    );
  }
}
