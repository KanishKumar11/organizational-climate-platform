import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Survey from '@/models/Survey';
import SurveyVersion from '@/models/SurveyVersion';
import { hasPermission } from '@/lib/permissions';

// Get survey version history
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

    // Get version history
    const versions = await SurveyVersion.find({ survey_id: surveyId })
      .sort({ version_number: -1 })
      .populate('created_by', 'name email');

    return NextResponse.json({
      survey: {
        id: survey._id,
        title: survey.title,
        current_version: survey.version || 1,
      },
      versions,
    });
  } catch (error) {
    console.error('Error fetching survey versions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Create new survey version
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
    const { changes, reason } = body;

    // Get survey
    const survey = await Survey.findById(surveyId);
    if (!survey) {
      return NextResponse.json({ error: 'Survey not found' }, { status: 404 });
    }

    // Check ownership
    if (survey.company_id !== session.user.companyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Only allow versioning of draft surveys
    if (survey.status !== 'draft') {
      return NextResponse.json(
        { error: 'Only draft surveys can be versioned' },
        { status: 400 }
      );
    }

    // Create version snapshot of current survey
    const currentVersion = survey.version || 1;
    const versionSnapshot = new SurveyVersion({
      survey_id: surveyId,
      version_number: currentVersion,
      title: survey.title,
      description: survey.description,
      questions: survey.questions,
      demographics: survey.demographics,
      settings: survey.settings,
      changes: changes || [],
      reason: reason || 'Version created',
      created_by: session.user.id,
      created_at: new Date(),
    });

    await versionSnapshot.save();

    // Update survey version number
    survey.version = currentVersion + 1;
    survey.updated_at = new Date();
    await survey.save();

    return NextResponse.json(
      {
        success: true,
        version: {
          id: versionSnapshot._id,
          version_number: versionSnapshot.version_number,
          created_at: versionSnapshot.created_at,
        },
        new_version: survey.version,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating survey version:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
