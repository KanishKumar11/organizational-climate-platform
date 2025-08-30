import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Survey from '@/models/Survey';
import SurveyInvitation from '@/models/SurveyInvitation';
import { hasPermission } from '@/lib/permissions';

// Get individual survey
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    const surveyId = id;
    const { searchParams } = new URL(request.url);
    const invitationToken = searchParams.get('token');

    // Get survey
    const survey = await Survey.findById(surveyId);
    if (!survey) {
      return NextResponse.json({ error: 'Survey not found' }, { status: 404 });
    }

    // If using invitation token, validate it
    if (invitationToken) {
      const invitation = await SurveyInvitation.findOne({
        invitation_token: invitationToken,
      });
      if (!invitation || invitation.survey_id !== surveyId) {
        return NextResponse.json(
          { error: 'Invalid invitation token' },
          { status: 400 }
        );
      }

      if (invitation.isExpired()) {
        return NextResponse.json(
          { error: 'Invitation has expired' },
          { status: 400 }
        );
      }

      // Mark invitation as opened
      if (invitation.status === 'sent') {
        invitation.markOpened({
          user_agent: request.headers.get('user-agent'),
          ip_address:
            request.headers.get('x-forwarded-for') ||
            request.headers.get('x-real-ip'),
        });
        await invitation.save();
      }

      // Return survey for invitation-based access
      return NextResponse.json({
        survey: {
          _id: survey._id,
          title: survey.title,
          description: survey.description,
          type: survey.type,
          questions: survey.questions,
          demographics: survey.demographics,
          settings: survey.settings,
          start_date: survey.start_date,
          end_date: survey.end_date,
        },
      });
    }

    // For authenticated access, check session and permissions
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has access to this survey
    if (survey.company_id !== session.user.companyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Return full survey data for authenticated users
    return NextResponse.json({ survey });
  } catch (error) {
    console.error('Error fetching survey:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Update survey
export async function PATCH(
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

    const surveyId = id;
    const body = await request.json();

    // Get survey
    const survey = await Survey.findById(surveyId);
    if (!survey) {
      return NextResponse.json({ error: 'Survey not found' }, { status: 404 });
    }

    // Check ownership
    if (survey.company_id !== session.user.companyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Update survey
    Object.assign(survey, body);
    await survey.save();

    return NextResponse.json({
      success: true,
      survey: {
        id: survey._id,
        title: survey.title,
        status: survey.status,
        updated_at: survey.updated_at,
      },
    });
  } catch (error) {
    console.error('Error updating survey:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Delete survey
export async function DELETE(
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

    // Only allow deletion of draft surveys
    if (survey.status !== 'draft') {
      return NextResponse.json(
        { error: 'Only draft surveys can be deleted' },
        { status: 400 }
      );
    }

    await Survey.findByIdAndDelete(surveyId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting survey:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
