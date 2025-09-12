import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import SurveyTemplate from '@/models/SurveyTemplate';
import Survey from '@/models/Survey';
import { hasFeaturePermission } from '@/lib/permissions';

// Create survey from template
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
    if (!hasFeaturePermission(session.user.role, 'CREATE_SURVEYS')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();
    const { id } = await params;
    const body = await request.json();

    const {
      title,
      description,
      start_date,
      end_date,
      department_ids = [],
      customizations = {},
    } = body;

    // Get template
    const template = await SurveyTemplate.findById(id);
    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    // Check access permissions
    if (
      !template.is_public &&
      template.created_by.toString() !== session.user.id &&
      template.company_id !== session.user.companyId
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Validate required fields
    if (!title || !start_date || !end_date) {
      return NextResponse.json(
        { error: 'Title, start date, and end date are required' },
        { status: 400 }
      );
    }

    // Create survey from template
    const surveyData = {
      title,
      description: description || template.description,
      type: template.category || 'general_climate',
      company_id: session.user.companyId,
      created_by: session.user.id,
      questions: customizations.questions || template.questions,
      demographics: customizations.demographics || template.demographics,
      settings: {
        ...template.default_settings,
        ...customizations.settings,
      },
      start_date: new Date(start_date),
      end_date: new Date(end_date),
      department_ids,
      template_id: template._id,
    };

    const survey = new Survey(surveyData);
    await survey.save();

    // Update template usage count
    await SurveyTemplate.findByIdAndUpdate(id, {
      $inc: { usage_count: 1 },
      $set: { last_used: new Date() },
    });

    return NextResponse.json(
      {
        success: true,
        survey: {
          id: survey._id,
          title: survey.title,
          type: survey.type,
          status: survey.status,
          created_at: survey.created_at,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating survey from template:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
