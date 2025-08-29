import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import MicroclimateTemplate from '@/models/MicroclimateTemplate';
import User from '@/models/User';
import { validatePermissions } from '@/lib/permissions';
import { z } from 'zod';

// Validation schema for creating templates
const createTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  category: z.enum([
    'pulse_check',
    'team_mood',
    'feedback_session',
    'project_retrospective',
    'custom',
  ]),
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
        category: z.string().optional(),
      })
    )
    .min(1)
    .max(10),
  settings: z.object({
    default_duration_minutes: z.number().min(5).max(480).default(30),
    suggested_frequency: z
      .enum(['daily', 'weekly', 'bi_weekly', 'monthly'])
      .default('weekly'),
    max_participants: z.number().min(1).optional(),
    anonymous_by_default: z.boolean().default(true),
    auto_close: z.boolean().default(true),
    show_live_results: z.boolean().default(true),
  }),
  tags: z.array(z.string()).default([]),
});

// GET /api/microclimates/templates - List templates
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const popular = searchParams.get('popular') === 'true';
    const system_only = searchParams.get('system_only') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let query: any = { is_active: true };

    // Build query based on filters
    if (system_only) {
      query.is_system_template = true;
    } else {
      // Include both system templates and company templates
      query.$or = [
        { is_system_template: true },
        { company_id: user.company_id, is_system_template: false },
      ];
    }

    if (category) {
      query.category = category;
    }

    let templatesQuery = MicroclimateTemplate.find(query);

    // Sort by popularity or creation date
    if (popular) {
      templatesQuery = templatesQuery.sort({ usage_count: -1, created_at: -1 });
    } else {
      templatesQuery = templatesQuery.sort({ created_at: -1 });
    }

    const templates = await templatesQuery
      .skip(skip)
      .limit(limit)
      .populate('created_by', 'name email')
      .lean();

    const total = await MicroclimateTemplate.countDocuments(query);

    return NextResponse.json({
      templates,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}

// POST /api/microclimates/templates - Create new template
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permissions - only leaders and above can create templates
    if (!validatePermissions(session.user.role, 'leader')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    await connectDB();

    const body = await request.json();
    const validatedData = createTemplateSchema.parse(body);

    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Create template
    const template = new MicroclimateTemplate({
      ...validatedData,
      company_id: user.company_id,
      created_by: session.user.id,
      is_system_template: false,
    });

    await template.save();

    return NextResponse.json({ template }, { status: 201 });
  } catch (error) {
    console.error('Error creating template:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    );
  }
}
