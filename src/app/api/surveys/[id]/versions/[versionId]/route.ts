import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Survey from '@/models/Survey';
import SurveyVersion from '@/models/SurveyVersion';
import { hasPermission } from '@/lib/permissions';

// Get specific survey version
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { id, versionId } = await params;

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

    // Get version
    const version = await SurveyVersion.findById(versionId).populate(
      'created_by',
      'name email'
    );

    if (!version || version.survey_id !== surveyId) {
      return NextResponse.json({ error: 'Version not found' }, { status: 404 });
    }

    return NextResponse.json({ version });
  } catch (error) {
    console.error('Error fetching survey version:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Restore survey to specific version
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string }> }
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
    const { id, versionId } = await params;

    const surveyId = id;

    // Get survey
    const survey = await Survey.findById(surveyId);
    if (!survey) {
      return NextResponse.json({ error: 'Survey not found' }, { status: 404 });
    }

    // Check ownership
    if (survey.company_id !== session.user.companyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Only allow restoration of draft surveys
    if (survey.status !== 'draft') {
      return NextResponse.json(
        { error: 'Only draft surveys can be restored to previous versions' },
        { status: 400 }
      );
    }

    // Get version to restore
    const version = await SurveyVersion.findById(versionId);
    if (!version || version.survey_id !== surveyId) {
      return NextResponse.json({ error: 'Version not found' }, { status: 404 });
    }

    // Create current version snapshot before restoring
    const currentVersion = new SurveyVersion({
      survey_id: surveyId,
      version_number: survey.version || 1,
      title: survey.title,
      description: survey.description,
      questions: survey.questions,
      demographics: survey.demographics,
      settings: survey.settings,
      changes: [`Restored to version ${version.version_number}`],
      reason: `Backup before restoring to version ${version.version_number}`,
      created_by: session.user.id,
      created_at: new Date(),
    });

    await currentVersion.save();

    // Restore survey to selected version
    survey.title = version.title;
    survey.description = version.description;
    survey.questions = version.questions;
    survey.demographics = version.demographics;
    survey.settings = version.settings;
    survey.version = (survey.version || 1) + 1;
    survey.updated_at = new Date();

    await survey.save();

    return NextResponse.json({
      success: true,
      message: `Survey restored to version ${version.version_number}`,
      new_version: survey.version,
    });
  } catch (error) {
    console.error('Error restoring survey version:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
