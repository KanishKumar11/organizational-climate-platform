import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import MicroclimateInvitation from '@/models/MicroclimateInvitation';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const { id } = params;

    // Find invitation
    const invitation = await (MicroclimateInvitation as any).findById(id);
    if (!invitation) {
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      );
    }

    // Check if invitation belongs to current user
    if (invitation.user_id !== session.user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Mark as participated
    invitation.markParticipated();
    await invitation.save();

    return NextResponse.json({
      message: 'Invitation marked as participated',
      status: invitation.status,
    });
  } catch (error) {
    console.error('Error marking invitation as participated:', error);
    return NextResponse.json(
      { error: 'Failed to update invitation status' },
      { status: 500 }
    );
  }
}
