import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import NotificationTemplate from '@/models/NotificationTemplate';
import { connectDB } from '@/lib/mongodb';
import { z } from 'zod';

// Validation schemas
const createTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required'),
  type: z.enum([
    'survey_invitation',
    'survey_reminder',
    'survey_completion',
    'microclimate_invitation',
    'action_plan_alert',
    'deadline_reminder',
    'ai_insight_alert',
    'system_notification',
  ]),
  channel: z.enum(['email', 'in_app', 'push', 'sms']),
  subject: z.string().optional(),
  title: z.string().min(1, 'Template title is required'),
  content: z.string().min(1, 'Template content is required'),
  html_content: z.string().optional(),
  variables: z
    .array(
      z.object({
        name: z.string(),
        type: z.enum(['string', 'number', 'date', 'boolean', 'object']),
        required: z.boolean().default(false),
        description: z.string(),
        default_value: z.any().optional(),
      })
    )
    .default([]),
  company_id: z.string().optional(),
  is_active: z.boolean().default(true),
  is_default: z.boolean().default(false),
  personalization_rules: z
    .array(
      z.object({
        condition: z.string(),
        modifications: z.record(z.string(), z.any()),
      })
    )
    .default([]),
});

const querySchema = z.object({
  type: z.string().optional(),
  channel: z.string().optional(),
  company_id: z.string().optional(),
  is_active: z
    .string()
    .transform((val) => val === 'true')
    .optional(),
  is_default: z
    .string()
    .transform((val) => val === 'true')
    .optional(),
});

// GET /api/notifications/templates - Get notification templates
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const query = querySchema.parse(Object.fromEntries(searchParams));

    let filter: any = {};

    if (query.type) filter.type = query.type;
    if (query.channel) filter.channel = query.channel;
    if (query.is_active !== undefined) filter.is_active = query.is_active;
    if (query.is_default !== undefined) filter.is_default = query.is_default;

    // Include company-specific and default templates
    const companyId = query.company_id || session.user.companyId;
    filter.$or = [
      { company_id: companyId },
      { is_default: true, company_id: { $exists: false } },
    ];

    const templates = await NotificationTemplate.find(filter).sort({
      company_id: -1,
      name: 1,
    }); // Company-specific first

    return NextResponse.json({
      success: true,
      data: templates,
    });
  } catch (error) {
    console.error('Error fetching notification templates:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}

// POST /api/notifications/templates - Create notification template
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can create templates
    if (!['super_admin', 'company_admin'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = createTemplateSchema.parse(body);

    await connectDB();

    // Set company_id and created_by
    const templateData = {
      ...validatedData,
      company_id: validatedData.company_id || session.user.companyId,
      created_by: session.user.id,
    };

    // If setting as default, unset other defaults for same type/channel
    if (templateData.is_default) {
      await NotificationTemplate.updateMany(
        {
          type: templateData.type,
          channel: templateData.channel,
          company_id: templateData.company_id,
        },
        { is_default: false }
      );
    }

    const template = new NotificationTemplate(templateData);
    await template.save();

    return NextResponse.json(
      {
        success: true,
        data: template,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating notification template:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    );
  }
}


