import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { invitationService } from '@/lib/invitation-service';
import SurveyInvitation from '@/models/SurveyInvitation';
import { connectDB } from '@/lib/mongodb';

// POST /api/invitations/[id]/resend - Resend invitation
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins and leaders can resend invitations
    if (
      !['super_admin', 'company_admin', 'leader'].includes(session.user.role)
    ) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    await connectDB();

    const invitation = await SurveyInvitation.findById(params.id);
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

    // Check if invitation can be resent
    if (invitation.status === 'completed') {
      return NextResponse.json(
        { error: 'Cannot resend invitation for completed survey' },
        { status: 400 }
      );
    }

    if (invitation.isExpired()) {
      return NextResponse.json(
        { error: 'Cannot resend expired invitation' },
        { status: 400 }
      );
    }

    await invitationService.resendInvitation(params.id);

    return NextResponse.json({
      success: true,
      message: 'Invitation resent successfully',
    });
  } catch (error) {
    console.error('Error resending invitation:', error);
    return NextResponse.json(
      { error: 'Failed to resend invitation' },
      { status: 500 }
    );
  }
}
