import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import { createApiResponse } from '@/lib/api-middleware';
import { userInvitationService } from '@/lib/user-invitation-service';
import User from '@/models/User';

// POST /api/admin/invitations/resend - Resend invitation
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        createApiResponse(false, null, 'Authentication required'),
        { status: 401 }
      );
    }

    // Check if user is super admin
    const user = await User.findById(session.user.id);
    if (!user || user.role !== 'super_admin') {
      return NextResponse.json(
        createApiResponse(false, null, 'Super admin access required'),
        { status: 403 }
      );
    }

    const body = await req.json();
    const { invitation_id } = body;

    // Validate required fields
    if (!invitation_id) {
      return NextResponse.json(
        createApiResponse(false, null, 'invitation_id is required'),
        { status: 400 }
      );
    }

    console.log('Resending invitation:', {
      invitation_id,
      resent_by: session.user.id,
    });

    // Resend invitation
    const invitation =
      await userInvitationService.resendInvitation(invitation_id);

    return NextResponse.json(
      createApiResponse(
        true,
        {
          invitation_id: invitation._id,
          email: invitation.email,
          status: invitation.status,
          sent_at: invitation.sent_at,
          reminder_count: invitation.reminder_count,
        },
        'Invitation resent successfully'
      )
    );
  } catch (error) {
    console.error('Error resending invitation:', error);

    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json(
          createApiResponse(false, null, error.message),
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      createApiResponse(false, null, 'Failed to resend invitation'),
      { status: 500 }
    );
  }
}
