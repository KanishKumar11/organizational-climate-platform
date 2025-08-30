import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { invitationService } from '@/lib/invitation-service';
import { connectDB } from '@/lib/mongodb';
import { z } from 'zod';

// Validation schema
const optimizeQuerySchema = z.object({
  survey_id: z.string().min(1, 'Survey ID is required'),
});

// GET /api/invitations/optimize - Get communication strategy optimization
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins and leaders can access optimization data
    if (
      !['super_admin', 'company_admin', 'leader'].includes(session.user.role)
    ) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const query = optimizeQuerySchema.parse(Object.fromEntries(searchParams));

    await connectDB();

    const strategy = await invitationService.optimizeCommunicationStrategy(
      query.survey_id
    );

    return NextResponse.json({
      success: true,
      data: strategy,
    });
  } catch (error) {
    console.error('Error optimizing communication strategy:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to optimize communication strategy' },
      { status: 500 }
    );
  }
}


