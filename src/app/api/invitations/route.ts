import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { invitationService } from '@/lib/invitation-service';
import SurveyInvitation from '@/models/SurveyInvitation';
import { connectDB } from '@/lib/mongodb';
import { z } from 'zod';

// Validation schemas
const createInvitationsSchema = z.object({
  survey_id: z.string().min(1, 'Survey ID is required'),
  user_ids: z.array(z.string()).min(1, 'At least one user ID is required'),
  expires_at: z.string().datetime().optional(),
  send_immediately: z.boolean().default(true),
  scheduled_send_time: z.string().datetime().optional(),
  custom_message: z.string().optional(),
});

const querySchema = z.object({
  survey_id: z.string().optional(),
  user_id: z.string().optional(),
  status: z.string().optional(),
  limit: z.string().transform(Number).optional(),
  page: z.string().transform(Number).optional(),
});

// GET /api/invitations - Get invitations
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const query = querySchema.parse(Object.fromEntries(searchParams));

    const limit = query.limit || 50;
    const page = query.page || 1;
    const skip = (page - 1) * limit;

    let filter: any = {};

    // Apply filters
    if (query.survey_id) filter.survey_id = query.survey_id;
    if (query.user_id) filter.user_id = query.user_id;
    if (query.status) filter.status = query.status;

    // Apply company scoping for non-super admins
    if (session.user.role !== 'super_admin') {
      filter.company_id = session.user.companyId;
    }

    const invitations = await SurveyInvitation.find(filter)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user_id', 'name email department_id')
      .populate('survey_id', 'title description');

    const total = await SurveyInvitation.countDocuments(filter);

    return NextResponse.json({
      success: true,
      data: invitations,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching invitations:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch invitations' },
      { status: 500 }
    );
  }
}

// POST /api/invitations - Create invitations
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins and leaders can create invitations
    if (
      !['super_admin', 'company_admin', 'leader'].includes(session.user.role)
    ) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = createInvitationsSchema.parse(body);

    await connectDB();

    const invitationData = {
      ...validatedData,
      expires_at: validatedData.expires_at
        ? new Date(validatedData.expires_at)
        : undefined,
      scheduled_send_time: validatedData.scheduled_send_time
        ? new Date(validatedData.scheduled_send_time)
        : undefined,
    };

    const invitations =
      await invitationService.createInvitations(invitationData);

    return NextResponse.json(
      {
        success: true,
        data: invitations,
        message: `Created ${invitations.length} invitations`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating invitations:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create invitations' },
      { status: 500 }
    );
  }
}
