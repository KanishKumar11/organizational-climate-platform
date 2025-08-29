import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Microclimate from '@/models/Microclimate';
import User from '@/models/User';

// POST /api/microclimates/[id]/activate - Activate a microclimate
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const microclimate = await Microclimate.findById(params.id);
    if (!microclimate) {
      return NextResponse.json(
        { error: 'Microclimate not found' },
        { status: 404 }
      );
    }

    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check permissions - only creator, company admin, or super admin can activate
    const canActivate =
      user.role === 'super_admin' ||
      (user.role === 'company_admin' &&
        microclimate.company_id === user.company_id) ||
      microclimate.created_by.toString() === session.user.id;

    if (!canActivate) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Check if microclimate can be activated
    if (
      microclimate.status !== 'draft' &&
      microclimate.status !== 'scheduled'
    ) {
      return NextResponse.json(
        { error: 'Microclimate cannot be activated from current status' },
        { status: 400 }
      );
    }

    // Validate that start time is appropriate
    const now = new Date();
    const startTime = new Date(microclimate.scheduling.start_time);

    // Allow activation if start time is within 5 minutes of now or in the future
    if (startTime.getTime() < now.getTime() - 5 * 60 * 1000) {
      return NextResponse.json(
        { error: 'Cannot activate microclimate with past start time' },
        { status: 400 }
      );
    }

    // Update status and start time if needed
    microclimate.status = 'active';

    // If start time is in the past but within 5 minutes, update to now
    if (startTime.getTime() < now.getTime()) {
      microclimate.scheduling.start_time = now;
    }

    await microclimate.save();

    // Generate final invite list
    const inviteList = await microclimate.generateInviteList();

    // Update target participant count
    microclimate.target_participant_count = inviteList.length;
    await microclimate.save();

    // TODO: Send invitations to participants
    // This would typically involve:
    // 1. Creating invitation records
    // 2. Sending emails/notifications
    // 3. Setting up WebSocket rooms for real-time updates

    return NextResponse.json({
      microclimate,
      message: 'Microclimate activated successfully',
      participants_invited: inviteList.length,
    });
  } catch (error) {
    console.error('Error activating microclimate:', error);
    return NextResponse.json(
      { error: 'Failed to activate microclimate' },
      { status: 500 }
    );
  }
}
