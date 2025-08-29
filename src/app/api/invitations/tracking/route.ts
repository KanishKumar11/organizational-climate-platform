import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { invitationService } from '@/lib/invitation-service';
import { connectDB } from '@/lib/mongodb';
import { z } from 'zod';

// Validation schema
const trackingQuerySchema = z.object({
  survey_id: z.string().min(1, 'Survey ID is required'),
});

// GET /api/invitations/tracking - Get participation tracking
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = trackingQuerySchema.parse(Object.fromEntries(searchParams));

    await connectDB();

    const tracking = await invitationService.getParticipationTracking(
      query.survey_id
    );

    return NextResponse.json({
      success: true,
      data: tracking,
    });
  } catch (error) {
    console.error('Error fetching participation tracking:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch tracking data' },
      { status: 500 }
    );
  }
}
