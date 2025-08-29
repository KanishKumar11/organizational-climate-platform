import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { notificationService } from '@/lib/notification-service';
import Notification from '@/models/Notification';
import { connectDB } from '@/lib/mongodb';

// GET /api/notifications/[id] - Get specific notification
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const notification = await Notification.findById(params.id);
    if (!notification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }

    // Check if user has access to this notification
    if (
      notification.user_id !== session.user.id &&
      notification.company_id !== session.user.company_id
    ) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      data: notification,
    });
  } catch (error) {
    console.error('Error fetching notification:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notification' },
      { status: 500 }
    );
  }
}

// PATCH /api/notifications/[id] - Update notification status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { status, metadata } = body;

    await connectDB();

    const notification = await Notification.findById(params.id);
    if (!notification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }

    // Check if user has access to this notification
    if (
      notification.user_id !== session.user.id &&
      notification.company_id !== session.user.company_id
    ) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Update notification status
    switch (status) {
      case 'opened':
        notification.markOpened(metadata);
        break;
      case 'delivered':
        notification.markDelivered(metadata);
        break;
      case 'failed':
        notification.markFailed(body.failure_reason || 'Unknown error');
        break;
      case 'cancelled':
        notification.markCancelled();
        break;
      default:
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    await notification.save();

    return NextResponse.json({
      success: true,
      data: notification,
    });
  } catch (error) {
    console.error('Error updating notification:', error);
    return NextResponse.json(
      { error: 'Failed to update notification' },
      { status: 500 }
    );
  }
}

// DELETE /api/notifications/[id] - Cancel notification
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const notification = await Notification.findById(params.id);
    if (!notification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }

    // Check if user has access to this notification
    if (
      notification.user_id !== session.user.id &&
      notification.company_id !== session.user.company_id
    ) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Only allow cancellation of pending notifications
    if (notification.status !== 'pending') {
      return NextResponse.json(
        { error: 'Can only cancel pending notifications' },
        { status: 400 }
      );
    }

    notification.markCancelled();
    await notification.save();

    return NextResponse.json({
      success: true,
      message: 'Notification cancelled successfully',
    });
  } catch (error) {
    console.error('Error cancelling notification:', error);
    return NextResponse.json(
      { error: 'Failed to cancel notification' },
      { status: 500 }
    );
  }
}
