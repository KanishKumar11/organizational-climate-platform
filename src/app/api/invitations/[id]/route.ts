import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { invitationService } from '@/lib/invitation-service';
import SurveyInvitation from '@/models/SurveyInvitation';
import { connectDB } from '@/lib/mongodb';

// GET /api/invitations/[id] - Get specific invitation
export async function GET(
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

    const invitation = await SurveyInvitation.findById(id)
      .populate('user_id', 'name email department_id')
      .populate('survey_id', 'title description');

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      );
    }

    // Check access permissions
    if (
      session.user.role !== 'super_admin' &&
      invitation.company_id !== session.user.company_id
    ) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      data: invitation,
    });
  } catch (error) {
    console.error('Error fetching invitation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invitation' },
      { status: 500 }
    );
  }
}

// PATCH /api/invitations/[id] - Update invitation status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { status, metadata } = body;

    await connectDB();
    const { id } = await params;

    const invitation = await SurveyInvitation.findById(id);
    if (!invitation) {
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      );
    }

    // Check access permissions
    if (
      session.user.role !== 'super_admin' &&
      invitation.company_id !== session.user.company_id
    ) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Update invitation status using service
    await invitationService.trackInvitationStatus(
      invitation.invitation_token,
      status,
      metadata
    );

    // Fetch updated invitation
    const updatedInvitation = await SurveyInvitation.findById(id);

    return NextResponse.json({
      success: true,
      data: updatedInvitation,
    });
  } catch (error) {
    console.error('Error updating invitation:', error);
    return NextResponse.json(
      { error: 'Failed to update invitation' },
      { status: 500 }
    );
  }
}

// DELETE /api/invitations/[id] - Cancel invitation
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins and leaders can cancel invitations
    if (
      !['super_admin', 'company_admin', 'leader'].includes(session.user.role)
    ) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    await connectDB();
    const { id } = await params;

    const invitation = await SurveyInvitation.findById(id);
    if (!invitation) {
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      );
    }

    // Check access permissions
    if (
      session.user.role !== 'super_admin' &&
      invitation.company_id !== session.user.company_id
    ) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    await invitationService.cancelInvitation(id);

    return NextResponse.json({
      success: true,
      message: 'Invitation cancelled successfully',
    });
  } catch (error) {
    console.error('Error cancelling invitation:', error);
    return NextResponse.json(
      { error: 'Failed to cancel invitation' },
      { status: 500 }
    );
  }
}
