import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import MicroclimateInvitation from '@/models/MicroclimateInvitation';
import Microclimate from '@/models/Microclimate';

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    await connectDB();

    const { token } = params;

    // Find invitation by token
    const invitation = await (MicroclimateInvitation as any)
      .findOne({ invitation_token: token })
      .populate({
        path: 'microclimate_id',
        model: 'Microclimate',
        populate: {
          path: 'questions',
        },
      });

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invalid invitation token' },
        { status: 404 }
      );
    }

    // Check if invitation belongs to current user
    if (invitation.user_id !== session.user.id) {
      return NextResponse.json(
        { error: 'This invitation is not for your account' },
        { status: 403 }
      );
    }

    // Check if invitation is expired
    if (invitation.isExpired()) {
      await invitation.markExpired();
      await invitation.save();
      
      return NextResponse.json(
        { error: 'This invitation has expired' },
        { status: 410 }
      );
    }

    // Get microclimate data
    const microclimate = await (Microclimate as any)
      .findById(invitation.microclimate_id)
      .populate('questions');

    if (!microclimate) {
      return NextResponse.json(
        { error: 'Microclimate not found' },
        { status: 404 }
      );
    }

    // Check if user has permission to access this microclimate
    if (microclimate.company_id.toString() !== session.user.company_id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Return invitation and microclimate data
    return NextResponse.json({
      invitation: {
        _id: invitation._id,
        status: invitation.status,
        expires_at: invitation.expires_at,
        microclimate: {
          _id: microclimate._id,
          title: microclimate.title,
          description: microclimate.description,
          scheduling: microclimate.scheduling,
          real_time_settings: microclimate.real_time_settings,
          status: microclimate.status,
          target_participant_count: microclimate.target_participant_count,
          response_count: microclimate.response_count,
          questions: microclimate.questions,
        },
      },
    });
  } catch (error) {
    console.error('Error validating microclimate invitation:', error);
    return NextResponse.json(
      { error: 'Failed to validate invitation' },
      { status: 500 }
    );
  }
}
