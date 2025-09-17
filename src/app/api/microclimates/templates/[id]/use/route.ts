import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import MicroclimateTemplate from '@/models/MicroclimateTemplate';
import Microclimate from '@/models/Microclimate';
import { hasPermission } from '@/lib/permissions';

// Create microclimate from template
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permissions
    if (!hasPermission(session.user.role, 'leader')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();
    const { id } = await params;
    const body = await request.json();

    const {
      title,
      description,
      targeting,
      scheduling,
      real_time_settings,
      customizations = {},
    } = body;

    // Get template
    const template = await MicroclimateTemplate.findById(id);
    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    // Check access permissions
    if (
      !template.is_system_template &&
      template.company_id !== session.user.companyId &&
      session.user.role !== 'super_admin'
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Validate required fields
    if (!title || !targeting || !scheduling) {
      return NextResponse.json(
        { error: 'Title, targeting, and scheduling are required' },
        { status: 400 }
      );
    }

    // Create microclimate from template
    const microclimateData = {
      title,
      description: description || template.description,
      template_id: template._id,
      company_id: session.user.companyId,
      created_by: session.user.id,
      targeting: {
        ...targeting,
        max_participants:
          targeting.max_participants || template.settings.max_participants,
      },
      scheduling: {
        ...scheduling,
        duration_minutes:
          scheduling.duration_minutes ||
          template.settings.default_duration_minutes,
        auto_close:
          scheduling.auto_close !== undefined
            ? scheduling.auto_close
            : template.settings.auto_close,
        timezone: scheduling.timezone || 'UTC',
      },
      real_time_settings: {
        show_live_results: template.settings.show_live_results,
        anonymous_responses: template.settings.anonymous_by_default,
        allow_comments: true,
        word_cloud_enabled: true,
        sentiment_analysis_enabled: true,
        participation_threshold: 3,
        ...real_time_settings,
      },
      questions: customizations.questions || template.questions,
      status: 'draft',
    };

    const microclimate = new Microclimate(microclimateData);
    await microclimate.save();

    // Update template usage count
    await MicroclimateTemplate.findByIdAndUpdate(id, {
      $inc: { usage_count: 1 },
      $set: { last_used: new Date() },
    });

    return NextResponse.json(
      {
        success: true,
        microclimate: {
          id: microclimate._id,
          title: microclimate.title,
          status: microclimate.status,
          created_at: microclimate.created_at,
          template_name: template.name,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating microclimate from template:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
