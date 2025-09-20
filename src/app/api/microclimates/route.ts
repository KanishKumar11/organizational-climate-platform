import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Microclimate from '@/models/Microclimate';
import User from '@/models/User';
import Department from '@/models/Department';
import { hasPermission } from '@/lib/permissions';
import {
  convertLocalDateTimeToUTC,
  validateSchedulingDateTime,
  validateDuration,
  DATETIME_ERROR_MESSAGES,
} from '@/lib/datetime-utils';
import { z } from 'zod';

// Helper function to determine microclimate status based on timing
function determineStatusFromTiming(
  startTime: Date,
  durationMinutes: number
): string {
  const now = new Date();
  const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);

  if (now < startTime) {
    return 'scheduled';
  } else if (now >= startTime && now <= endTime) {
    return 'active';
  } else {
    return 'completed';
  }
}

// Validation schema for creating microclimates
const createMicroclimateSchema = z.object({
  title: z.string().min(1).max(150),
  description: z.string().max(500).optional(),
  targeting: z.object({
    department_ids: z.array(z.string()).min(1),
    role_filters: z.array(z.string()).optional(),
    tenure_filters: z.array(z.string()).optional(),
    custom_filters: z.record(z.string(), z.any()).optional(),
    include_managers: z.boolean().default(true),
    max_participants: z.number().min(1).optional(),
  }),
  scheduling: z.object({
    start_time: z.string().min(1), // Accept any non-empty string, will be converted to Date
    duration_minutes: z.number().min(5).max(480).default(30),
    timezone: z.string().default('UTC'),
    auto_close: z.boolean().default(true),
    reminder_settings: z
      .object({
        send_reminders: z.boolean().default(true),
        reminder_minutes_before: z.array(z.number()).default([60, 15]),
      })
      .optional(),
  }),
  real_time_settings: z
    .object({
      show_live_results: z.boolean().default(true),
      anonymous_responses: z.boolean().default(true),
      allow_comments: z.boolean().default(true),
      word_cloud_enabled: z.boolean().default(true),
      sentiment_analysis_enabled: z.boolean().default(true),
      participation_threshold: z.number().min(1).default(3),
    })
    .optional(),
  template_id: z.string().optional(),
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
        required: z.boolean().default(true),
        order: z.number(),
      })
    )
    .min(1)
    .max(10),
  status: z
    .enum(['draft', 'scheduled', 'active', 'completed', 'cancelled'])
    .default('draft'),
});

// GET /api/microclimates - List microclimates
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const department_id = searchParams.get('department_id');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Build query based on user permissions
    const query: any = {};

    // Apply role-based filtering
    if (session.user.role === 'super_admin') {
      // Super admin can see all microclimates
    } else if (session.user.role === 'company_admin') {
      query.company_id = session.user.companyId;
    } else if (
      session.user.role === 'leader' ||
      session.user.role === 'supervisor'
    ) {
      // Leaders can see microclimates they created or that target their department
      query.$or = [
        { created_by: session.user.id },
        {
          company_id: session.user.companyId,
          'targeting.department_ids': session.user.departmentId,
        },
      ];
    } else {
      // Employees can only see microclimates that target their department
      query.company_id = session.user.companyId;
      query['targeting.department_ids'] = session.user.departmentId;
    }

    // Apply filters
    if (status) {
      query.status = status;
    }
    if (department_id) {
      query['targeting.department_ids'] = department_id;
    }

    const microclimates = await Microclimate.find(query)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .populate('created_by', 'name email');

    // Auto-update microclimate statuses based on current time
    const updatedMicroclimates = [];
    for (const microclimate of microclimates) {
      const currentStatus = microclimate.status;
      const correctStatus = determineStatusFromTiming(
        microclimate.scheduling.start_time,
        microclimate.scheduling.duration_minutes
      );

      // Only update if the status should change and it's a valid transition
      if (currentStatus !== correctStatus) {
        // Valid transitions: scheduled -> active -> completed
        const validTransitions = {
          scheduled: ['active', 'completed'],
          active: ['completed'],
          draft: ['scheduled', 'active', 'completed'],
        };

        if (validTransitions[currentStatus]?.includes(correctStatus)) {
          console.log(
            `Auto-updating microclimate ${microclimate._id} from ${currentStatus} to ${correctStatus}`
          );
          microclimate.status = correctStatus;
          await microclimate.save();
        }
      }
      updatedMicroclimates.push(microclimate.toObject());
    }

    const total = await Microclimate.countDocuments(query);

    return NextResponse.json({
      microclimates: updatedMicroclimates,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching microclimates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch microclimates' },
      { status: 500 }
    );
  }
}

// POST /api/microclimates - Create new microclimate
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permissions - only leaders and above can create microclimates
    if (!hasPermission(session.user.role, 'leader')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    await connectDB();

    const body = await request.json();
    const validatedData = createMicroclimateSchema.parse(body);

    // Verify user can access the targeted departments
    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check department access permissions
    for (const deptId of validatedData.targeting.department_ids) {
      if (
        !user.canAccessDepartment(deptId) &&
        user.role !== 'company_admin' &&
        user.role !== 'super_admin'
      ) {
        return NextResponse.json(
          { error: `Access denied to department ${deptId}` },
          { status: 403 }
        );
      }
    }

    // Verify departments exist and belong to user's company
    const departments = await Department.find({
      _id: { $in: validatedData.targeting.department_ids },
      company_id: user.company_id,
      is_active: true,
    });

    if (departments.length !== validatedData.targeting.department_ids.length) {
      return NextResponse.json(
        { error: 'One or more departments not found or inactive' },
        { status: 400 }
      );
    }

    // Calculate target participant count
    const targetUsers = await User.find({
      company_id: user.company_id,
      department_id: { $in: validatedData.targeting.department_ids },
      is_active: true,
    }).countDocuments();

    // Validate scheduling datetime using centralized validation
    const datetimeValidation = validateSchedulingDateTime(
      validatedData.scheduling.start_time,
      validatedData.scheduling.timezone
    );

    if (!datetimeValidation.isValid) {
      return NextResponse.json(
        {
          error: 'Invalid start time',
          message: datetimeValidation.error,
          errorCode: datetimeValidation.errorCode,
        },
        { status: 400 }
      );
    }

    // Validate duration
    const durationValidation = validateDuration(
      validatedData.scheduling.duration_minutes
    );
    if (!durationValidation.isValid) {
      return NextResponse.json(
        {
          error: 'Invalid duration',
          message: durationValidation.error,
          errorCode: durationValidation.errorCode,
        },
        { status: 400 }
      );
    }

    // Create microclimate with proper timezone conversion
    const startTimeUTC = convertLocalDateTimeToUTC(
      validatedData.scheduling.start_time,
      validatedData.scheduling.timezone
    );

    // Determine the correct initial status based on timing
    const initialStatus = determineStatusFromTiming(
      startTimeUTC,
      validatedData.scheduling.duration_minutes
    );

    console.log('Creating microclimate with:', {
      startTimeUTC: startTimeUTC.toISOString(),
      currentTime: new Date().toISOString(),
      durationMinutes: validatedData.scheduling.duration_minutes,
      initialStatus,
    });

    const microclimate = new Microclimate({
      ...validatedData,
      company_id: user.company_id,
      created_by: session.user.id,
      status: initialStatus,
      target_participant_count: Math.min(
        targetUsers,
        validatedData.targeting.max_participants || targetUsers
      ),
      scheduling: {
        ...validatedData.scheduling,
        start_time: startTimeUTC,
      },
    });

    await microclimate.save();

    // Generate invite list
    const inviteList = await microclimate.generateInviteList();

    // Update target participant count with actual invite list
    microclimate.target_participant_count = inviteList.length;
    await microclimate.save();

    return NextResponse.json(
      {
        microclimate,
        invite_count: inviteList.length,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating microclimate:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create microclimate' },
      { status: 500 }
    );
  }
}
