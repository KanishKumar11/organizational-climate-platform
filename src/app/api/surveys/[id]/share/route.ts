import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Survey from '@/models/Survey';
import SurveyTemplate from '@/models/SurveyTemplate';
import { hasPermission } from '@/lib/permissions';

// Share survey as template
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
    if (!hasPermission(session.user.role, 'company_admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();
    const { id } = await params;
    const body = await request.json();

    const surveyId = id;
    const {
      name,
      description,
      category = 'custom',
      is_public = false,
      tags = [],
    } = body;

    // Get survey
    const survey = await Survey.findById(surveyId);
    if (!survey) {
      return NextResponse.json({ error: 'Survey not found' }, { status: 404 });
    }

    // Check ownership
    if (survey.company_id !== session.user.companyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: 'Template name is required' },
        { status: 400 }
      );
    }

    // Check if template with same name already exists
    const existingTemplate = await SurveyTemplate.findOne({
      name,
      $or: [
        { created_by: session.user.id },
        { company_id: session.user.companyId },
      ],
    });

    if (existingTemplate) {
      return NextResponse.json(
        { error: 'Template with this name already exists' },
        { status: 409 }
      );
    }

    // Create template from survey
    const template = new SurveyTemplate({
      name,
      description: description || survey.description,
      category,
      questions: survey.questions,
      demographics: survey.demographics,
      settings: survey.settings,
      is_public,
      tags,
      created_by: session.user.id,
      company_id: session.user.companyId,
      source_survey_id: survey._id,
    });

    await template.save();

    return NextResponse.json(
      {
        success: true,
        template: {
          id: template._id,
          name: template.name,
          category: template.category,
          is_public: template.is_public,
          created_at: template.created_at,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error sharing survey as template:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get survey sharing information
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;

    const surveyId = id;

    // Get survey
    const survey = await Survey.findById(surveyId);
    if (!survey) {
      return NextResponse.json({ error: 'Survey not found' }, { status: 404 });
    }

    // Check permissions
    if (survey.company_id !== session.user.companyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Find templates created from this survey
    const templates = await SurveyTemplate.find({
      source_survey_id: surveyId,
    }).select('name category is_public created_at created_by');

    const sharingInfo = {
      survey: {
        id: survey._id,
        title: survey.title,
        status: survey.status,
      },
      templates: templates,
      can_share: hasPermission(session.user.role, 'company_admin'),
    };

    return NextResponse.json(sharingInfo);
  } catch (error) {
    console.error('Error fetching survey sharing info:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
