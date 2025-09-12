import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Survey from '@/models/Survey';
import { hasPermission } from '@/lib/permissions';

// Update survey status
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
    if (!hasPermission(session.user.role, 'company_admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();
    const { id } = await params;
    const body = await request.json();

    const surveyId = id;
    const { status, reason } = body;

    // Validate status
    const validStatuses = [
      'draft',
      'active',
      'paused',
      'completed',
      'archived',
    ];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Get survey
    const survey = await Survey.findById(surveyId);
    if (!survey) {
      return NextResponse.json({ error: 'Survey not found' }, { status: 404 });
    }

    // Check ownership
    if (survey.company_id !== session.user.companyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Validate status transitions
    const currentStatus = survey.status;
    const validTransitions: Record<string, string[]> = {
      draft: ['active', 'archived'],
      active: ['paused', 'completed', 'archived'],
      paused: ['active', 'completed', 'archived'],
      completed: ['archived'],
      archived: [], // Cannot transition from archived
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

    // Additional validation for activating survey
    if (status === 'active') {
      if (!survey.questions || survey.questions.length === 0) {
        return NextResponse.json(
          { error: 'Cannot activate survey without questions' },
          { status: 400 }
        );
      }

      const now = new Date();
      if (survey.start_date > now) {
        return NextResponse.json(
          { error: 'Cannot activate survey before start date' },
          { status: 400 }
        );
      }

      if (survey.end_date <= now) {
        return NextResponse.json(
          { error: 'Cannot activate survey after end date' },
          { status: 400 }
        );
      }
    }

    // Update status
    const previousStatus = survey.status;
    survey.status = status;
    survey.updated_at = new Date();

    // Add status change to audit log if reason provided
    if (reason) {
      // TODO: Add to audit log
      console.log(
        `Survey ${surveyId} status changed from ${previousStatus} to ${status}: ${reason}`
      );
    }

    await survey.save();

    return NextResponse.json({
      success: true,
      survey: {
        id: survey._id,
        title: survey.title,
        status: survey.status,
        previous_status: previousStatus,
        updated_at: survey.updated_at,
      },
    });
  } catch (error) {
    console.error('Error updating survey status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
