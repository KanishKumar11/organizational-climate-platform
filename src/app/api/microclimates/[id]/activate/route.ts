import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Microclimate from '@/models/Microclimate';
import User from '@/models/User';
import { microclimateInvitationService } from '@/lib/microclimate-invitation-service';
import { getWebSocketServer } from '@/lib/websocket';
import { logSurveyPublished } from '@/lib/audit';

// POST /api/microclimates/[id]/activate - Activate a microclimate
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;

    const microclimate = await Microclimate.findById(id);
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

    // Log audit trail for activation (non-blocking)
    logSurveyPublished(
      microclimate._id.toString(),
      session.user.id,
      session.user.email || '',
      session.user.name || 'Unknown',
      microclimate.company_id.toString(),
      request
    ).catch((err) => console.error('Audit logging failed:', err));

    // Send invitations to participants
    try {
      const invitations = await microclimateInvitationService.createInvitations(
        {
          microclimate_id: microclimate._id.toString(),
          user_ids: inviteList,
          send_immediately: true,
          expires_at: new Date(
            microclimate.scheduling.start_time.getTime() +
              microclimate.scheduling.duration_minutes * 60 * 1000
          ),
        }
      );

      console.log(`Created ${invitations.length} microclimate invitations`);

      // Set up WebSocket rooms for real-time updates
      const io = getWebSocketServer();
      if (io) {
        // Create a room for this microclimate
        console.log(
          `Setting up WebSocket room for microclimate ${microclimate._id}`
        );

        // Broadcast microclimate activation to all company users
        io.to(`company_${microclimate.company_id}`).emit(
          'microclimate_activated',
          {
            microclimateId: microclimate._id.toString(),
            title: microclimate.title,
            startTime: microclimate.scheduling.start_time,
            duration: microclimate.scheduling.duration_minutes,
            participantCount: inviteList.length,
          }
        );
      }

      return NextResponse.json({
        microclimate,
        message: 'Microclimate activated successfully',
        participants_invited: inviteList.length,
        invitations_sent: invitations.length,
      });
    } catch (invitationError) {
      console.error('Error sending microclimate invitations:', invitationError);

      // Still return success for microclimate activation, but note invitation issues
      return NextResponse.json({
        microclimate,
        message:
          'Microclimate activated successfully, but some invitations may have failed',
        participants_invited: inviteList.length,
        invitation_error: 'Some invitations may not have been sent',
      });
    }
  } catch (error) {
    console.error('Error activating microclimate:', error);
    return NextResponse.json(
      { error: 'Failed to activate microclimate' },
      { status: 500 }
    );
  }
}
