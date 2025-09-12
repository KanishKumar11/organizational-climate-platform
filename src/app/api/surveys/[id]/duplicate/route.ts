import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Survey from '@/models/Survey';
import { hasFeaturePermission } from '@/lib/permissions';

// Duplicate survey
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

    const surveyId = id;
    const { title, description } = body;

    // Get original survey
    const originalSurvey = await Survey.findById(surveyId);
    if (!originalSurvey) {
      return NextResponse.json({ error: 'Survey not found' }, { status: 404 });
    }

    // Check permissions
    if (originalSurvey.company_id !== session.user.companyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Create duplicate survey
    const duplicateData = {
      title: title || `${originalSurvey.title} (Copy)`,
      description: description || originalSurvey.description,
      type: originalSurvey.type,
      company_id: originalSurvey.company_id,
      created_by: session.user.id,
      department_ids: originalSurvey.department_ids,
      questions: originalSurvey.questions,
      demographics: originalSurvey.demographics,
      settings: originalSurvey.settings,
      start_date: new Date(),
      end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      status: 'draft',
      template_id: originalSurvey.template_id,
    };

    const duplicateSurvey = new Survey(duplicateData);
    await duplicateSurvey.save();

    return NextResponse.json(
      {
        success: true,
        survey: {
          id: duplicateSurvey._id,
          title: duplicateSurvey.title,
          type: duplicateSurvey.type,
          status: duplicateSurvey.status,
          created_at: duplicateSurvey.created_at,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error duplicating survey:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
