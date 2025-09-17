import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Microclimate from '@/models/Microclimate';
import { hasPermission } from '@/lib/permissions';

// Update microclimate status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permissions
    if (!hasPermission(session.user.role, 'leader')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();
    const { id } = await params;
    const body = await request.json();

    const microclimateId = id;
    const { status, reason } = body;

    // Validate status
    const validStatuses = [
      'draft',
      'scheduled',
      'active',
      'completed',
      'cancelled',
    ];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Get microclimate
    const microclimate = await Microclimate.findById(microclimateId);
    if (!microclimate) {
      return NextResponse.json(
        { error: 'Microclimate not found' },
        { status: 404 }
      );
    }

    // Check ownership/permissions
    if (
      microclimate.created_by.toString() !== session.user.id &&
      microclimate.company_id !== session.user.companyId &&
      session.user.role !== 'super_admin'
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Validate status transitions
    const currentStatus = microclimate.status;
    const validTransitions: Record<string, string[]> = {
      draft: ['scheduled', 'cancelled'],
      scheduled: ['active', 'cancelled'],
      active: ['completed', 'cancelled'],
      completed: [], // Cannot transition from completed
      cancelled: [], // Cannot transition from cancelled
    };

    if (!validTransitions[currentStatus]?.includes(status)) {
      return NextResponse.json(
        {
          error: `Cannot transition from ${currentStatus} to ${status}`,
          valid_transitions: validTransitions[currentStatus] || [],
        },
        { status: 400 }
      );
    }

    // Additional validation for specific status changes
    if (status === 'active') {
      // Check if microclimate can be activated
      if (!microclimate.questions || microclimate.questions.length === 0) {
        return NextResponse.json(
          { error: 'Cannot activate microclimate without questions' },
          { status: 400 }
        );
      }

      const now = new Date();
      const startTime = new Date(microclimate.scheduling.start_time);

      // Allow activation up to 15 minutes before scheduled time
      if (startTime.getTime() - now.getTime() > 15 * 60 * 1000) {
        return NextResponse.json(
          {
            error:
              'Cannot activate microclimate more than 15 minutes before scheduled time',
          },
          { status: 400 }
        );
      }

      // Set actual start time when activating
      (microclimate as any).actual_start_time = now;
    }

    if (status === 'completed') {
      // Set actual end time when completing
      (microclimate as any).actual_end_time = new Date();

      // Calculate final participation rate
      microclimate.participation_rate =
        microclimate.calculateParticipationRate();

      // Generate final insights if not already done
      if (!(microclimate as any).final_insights_generated) {
        // This would trigger AI analysis for final insights
        (microclimate as any).final_insights_generated = true;
      }
    }

    // Update status
    const previousStatus = microclimate.status;
    microclimate.status = status;
    microclimate.updated_at = new Date();

    // Add status change to history
    if (!(microclimate as any).status_history) {
      (microclimate as any).status_history = [];
    }

    (microclimate as any).status_history.push({
      from_status: previousStatus,
      to_status: status,
      changed_by: session.user.id,
      changed_at: new Date(),
      reason: reason || `Status changed from ${previousStatus} to ${status}`,
    });

    await microclimate.save();

    // Broadcast status change via WebSocket if available
    if (global.io) {
      global.io.to(`microclimate_${microclimateId}`).emit('status_change', {
        microclimate_id: microclimateId,
        previous_status: previousStatus,
        new_status: status,
        changed_by: session.user.id,
        changed_at: new Date(),
      });
    }

    return NextResponse.json({
      success: true,
      microclimate: {
        id: microclimate._id,
        title: microclimate.title,
        status: microclimate.status,
        previous_status: previousStatus,
        updated_at: microclimate.updated_at,
        actual_start_time: (microclimate as any).actual_start_time,
        actual_end_time: (microclimate as any).actual_end_time,
      },
    });
  } catch (error) {
    console.error('Error updating microclimate status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
