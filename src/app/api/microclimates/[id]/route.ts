import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Microclimate from '@/models/Microclimate';
import User from '@/models/User';
import { validatePermissions } from '@/lib/permissions';
import { z } from 'zod';

// Validation schema for updating microclimates
const updateMicroclimateSchema = z.object({
  title: z.string().min(1).max(150).optional(),
  description: z.string().max(500).optional(),
  targeting: z
    .object({
      department_ids: z.array(z.string()).min(1),
      role_filters: z.array(z.string()).optional(),
      tenure_filters: z.array(z.string()).optional(),
      custom_filters: z.record(z.any()).optional(),
      include_managers: z.boolean().default(true),
      max_participants: z.number().min(1).optional(),
    })
    .optional(),
  scheduling: z
    .object({
      start_time: z.string().datetime(),
      duration_minutes: z.number().min(5).max(480),
      timezone: z.string(),
      auto_close: z.boolean(),
      reminder_settings: z
        .object({
          send_reminders: z.boolean(),
          reminder_minutes_before: z.array(z.number()),
        })
        .optional(),
    })
    .optional(),
  real_time_settings: z
    .object({
      show_live_results: z.boolean().optional(),
      anonymous_responses: z.boolean().optional(),
      allow_comments: z.boolean().optional(),
      word_cloud_enabled: z.boolean().optional(),
      sentiment_analysis_enabled: z.boolean().optional(),
      participation_threshold: z.number().min(1).optional(),
    })
    .optional(),
  questions: z
    .array(
      z.object({
        id: z.string(),
        text: z.string().min(1).max(300),
        type: z.enum([
          'likert',
          'multiple_choice',
          'open_ended',
          'emoji_rating',
        ]),
        options: z.array(z.string()).optional(),
        required: z.boolean(),
        order: z.number(),
      })
    )
    .min(1)
    .max(10)
    .optional(),
  status: z
    .enum(['draft', 'scheduled', 'active', 'completed', 'cancelled'])
    .optional(),
});

// GET /api/microclimates/[id] - Get specific microclimate
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const microclimate = await Microclimate.findById(params.id)
      .populate('created_by', 'name email')
      .lean();

    if (!microclimate) {
      return NextResponse.json(
        { error: 'Microclimate not found' },
        { status: 404 }
      );
    }

    // Check access permissions
    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify user can access this microclimate
    const canAccess =
      user.role === 'super_admin' ||
      (user.role === 'company_admin' &&
        microclimate.company_id === user.company_id) ||
      microclimate.created_by.toString() === session.user.id ||
      (microclimate.targeting.department_ids.includes(user.department_id) &&
        microclimate.company_id === user.company_id);

    if (!canAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json({ microclimate });
  } catch (error) {
    console.error('Error fetching microclimate:', error);
    return NextResponse.json(
      { error: 'Failed to fetch microclimate' },
      { status: 500 }
    );
  }
}

// PATCH /api/microclimates/[id] - Update microclimate
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const microclimate = await Microclimate.findById(params.id);
    if (!microclimate) {
      return NextResponse.json(
        { error: 'Microclimate not found' },
        { status: 404 }
      );
    }

    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check permissions - only creator, company admin, or super admin can update
    const canUpdate =
      user.role === 'super_admin' ||
      (user.role === 'company_admin' &&
        microclimate.company_id === user.company_id) ||
      microclimate.created_by.toString() === session.user.id;

    if (!canUpdate) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Prevent updates to active or completed microclimates (except status changes)
    if (
      microclimate.status === 'active' ||
      microclimate.status === 'completed'
    ) {
      const body = await request.json();
      const allowedFields = ['status'];
      const hasDisallowedFields = Object.keys(body).some(
        (key) => !allowedFields.includes(key)
      );

      if (hasDisallowedFields) {
        return NextResponse.json(
          {
            error:
              'Cannot modify active or completed microclimates except status',
          },
          { status: 400 }
        );
      }
    }

    const body = await request.json();
    const validatedData = updateMicroclimateSchema.parse(body);

    // Update fields
    Object.keys(validatedData).forEach((key) => {
      if (key === 'scheduling' && validatedData.scheduling) {
        microclimate.scheduling = {
          ...microclimate.scheduling,
          ...validatedData.scheduling,
          start_time: new Date(validatedData.scheduling.start_time),
        };
      } else if (key === 'targeting' && validatedData.targeting) {
        microclimate.targeting = {
          ...microclimate.targeting,
          ...validatedData.targeting,
        };
      } else if (
        key === 'real_time_settings' &&
        validatedData.real_time_settings
      ) {
        microclimate.real_time_settings = {
          ...microclimate.real_time_settings,
          ...validatedData.real_time_settings,
        };
      } else {
        (microclimate as any)[key] = (validatedData as any)[key];
      }
    });

    // Recalculate target participant count if targeting changed
    if (validatedData.targeting) {
      const targetUsers = await User.find({
        company_id: microclimate.company_id,
        department_id: { $in: microclimate.targeting.department_ids },
        is_active: true,
      }).countDocuments();

      microclimate.target_participant_count = Math.min(
        targetUsers,
        microclimate.targeting.max_participants || targetUsers
      );
    }

    await microclimate.save();

    return NextResponse.json({ microclimate });
  } catch (error) {
    console.error('Error updating microclimate:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update microclimate' },
      { status: 500 }
    );
  }
}

// DELETE /api/microclimates/[id] - Delete microclimate
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const microclimate = await Microclimate.findById(params.id);
    if (!microclimate) {
      return NextResponse.json(
        { error: 'Microclimate not found' },
        { status: 404 }
      );
    }

    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check permissions - only creator, company admin, or super admin can delete
    const canDelete =
      user.role === 'super_admin' ||
      (user.role === 'company_admin' &&
        microclimate.company_id === user.company_id) ||
      microclimate.created_by.toString() === session.user.id;

    if (!canDelete) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Prevent deletion of active microclimates
    if (microclimate.status === 'active') {
      return NextResponse.json(
        { error: 'Cannot delete active microclimate' },
        { status: 400 }
      );
    }

    await Microclimate.findByIdAndDelete(params.id);

    return NextResponse.json({ message: 'Microclimate deleted successfully' });
  } catch (error) {
    console.error('Error deleting microclimate:', error);
    return NextResponse.json(
      { error: 'Failed to delete microclimate' },
      { status: 500 }
    );
  }
}
