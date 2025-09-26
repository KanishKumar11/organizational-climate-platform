import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { createApiResponse } from '@/lib/api-middleware';
import { userInvitationService } from '@/lib/user-invitation-service';

// GET /api/auth/validate-invitation - Validate invitation token
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        createApiResponse(false, null, 'Invitation token is required'),
        { status: 400 }
      );
    }

    console.log('Validating invitation token:', token.substring(0, 8) + '...');

    // Validate the invitation
    const validation = await userInvitationService.validateInvitation(token);

    if (!validation.valid || !validation.invitation) {
      return NextResponse.json(
        createApiResponse(false, null, validation.error || 'Invalid invitation'),
        { status: 400 }
      );
    }

    const invitation = validation.invitation;

    // Mark invitation as opened if not already
    if (invitation.status === 'sent') {
      invitation.markOpened();
      await invitation.save();
    }

    // Return invitation details
    return NextResponse.json(
      createApiResponse(
        true,
        {
          email: invitation.email,
          company_name: invitation.invitation_data.company_name,
          inviter_name: invitation.invitation_data.inviter_name,
          role: invitation.role,
          invitation_type: invitation.invitation_type,
          setup_required: invitation.invitation_data.setup_required || false,
          expires_at: invitation.expires_at.toISOString(),
          department_id: invitation.department_id,
        },
        'Invitation is valid'
      )
    );
  } catch (error) {
    console.error('Error validating invitation:', error);
    return NextResponse.json(
      createApiResponse(false, null, 'Failed to validate invitation'),
      { status: 500 }
    );
  }
}
