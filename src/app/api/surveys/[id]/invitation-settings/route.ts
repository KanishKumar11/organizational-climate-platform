import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import Survey from '@/models/Survey';
import { hasFeaturePermission } from '@/lib/permissions';

export interface InvitationSettings {
  custom_message?: string;
  include_credentials: boolean;
  send_immediately: boolean;
  reminder_enabled: boolean;
  reminder_frequency_days: number;
  custom_subject?: string;
  branding_enabled: boolean;
}

// GET /api/surveys/[id]/invitation-settings - Get invitation settings
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasFeaturePermission(session.user.role, 'VIEW_SURVEY_RESULTS')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();

    const survey = await Survey.findById(params.id);
    if (!survey) {
      return NextResponse.json({ error: 'Survey not found' }, { status: 404 });
    }

    // Check if user can access this survey
    if (
      session.user.role !== 'super_admin' &&
      survey.company_id !== session.user.companyId
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const invitationSettings: InvitationSettings = {
      custom_message:
        survey.settings?.invitation_settings?.custom_message || '',
      include_credentials:
        survey.settings?.invitation_settings?.include_credentials ?? true,
      send_immediately:
        survey.settings?.invitation_settings?.send_immediately ?? true,
      reminder_enabled:
        survey.settings?.notification_settings?.send_reminders ?? true,
      reminder_frequency_days:
        survey.settings?.notification_settings?.reminder_frequency_days || 3,
      custom_subject:
        survey.settings?.invitation_settings?.custom_subject || '',
      branding_enabled:
        survey.settings?.invitation_settings?.branding_enabled ?? true,
    };

    return NextResponse.json({
      success: true,
      data: invitationSettings,
    });
  } catch (error) {
    console.error('Error fetching invitation settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/surveys/[id]/invitation-settings - Update invitation settings
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasFeaturePermission(session.user.role, 'EDIT_SURVEYS')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();

    const survey = await Survey.findById(params.id);
    if (!survey) {
      return NextResponse.json({ error: 'Survey not found' }, { status: 404 });
    }

    // Check if user can access this survey
    if (
      session.user.role !== 'super_admin' &&
      survey.company_id !== session.user.companyId
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const {
      custom_message,
      include_credentials,
      send_immediately,
      reminder_enabled,
      reminder_frequency_days,
      custom_subject,
      branding_enabled,
    }: InvitationSettings = body;

    // Update survey settings
    survey.settings = {
      ...survey.settings,
      invitation_settings: {
        custom_message: custom_message || '',
        include_credentials: include_credentials ?? true,
        send_immediately: send_immediately ?? true,
        custom_subject: custom_subject || '',
        branding_enabled: branding_enabled ?? true,
      },
      notification_settings: {
        ...survey.settings.notification_settings,
        send_reminders: reminder_enabled ?? true,
        reminder_frequency_days: reminder_frequency_days || 3,
      },
    };

    await survey.save();

    return NextResponse.json({
      success: true,
      message: 'Invitation settings updated successfully',
      data: {
        custom_message,
        include_credentials,
        send_immediately,
        reminder_enabled,
        reminder_frequency_days,
        custom_subject,
        branding_enabled,
      },
    });
  } catch (error) {
    console.error('Error updating invitation settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/surveys/[id]/invitation-settings/preview - Preview invitation email
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasFeaturePermission(session.user.role, 'VIEW_SURVEY_RESULTS')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();

    const survey = await Survey.findById(params.id);
    if (!survey) {
      return NextResponse.json({ error: 'Survey not found' }, { status: 404 });
    }

    const body = await request.json();
    const { settings, recipient_name, recipient_email } = body;

    // Import email template function
    const { generateSurveyInvitationTemplate } = await import('@/lib/email');

    // Create preview data
    const previewData = {
      survey,
      recipient: {
        _id: 'preview-user-id',
        name: recipient_name || 'John Doe',
        email: recipient_email || 'john.doe@example.com',
        role: 'employee' as const,
        company_id: 'preview-company-id',
        department_id: 'preview-department-id',
        preferences: {
          language: 'en',
          timezone: 'UTC',
          notification_settings: {
            email_surveys: true,
            email_microclimates: true,
            email_action_plans: true,
            email_reminders: true,
            push_notifications: false,
            digest_frequency: 'weekly' as const,
          },
          dashboard_layout: 'default',
          theme: 'light' as const,
        },
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      invitationLink: `${process.env.NEXTAUTH_URL}/survey/${params.id}?token=preview-token`,
      companyName: 'Your Company',
      expiryDate: survey.end_date,
      customMessage: settings.custom_message,
      credentials: settings.include_credentials
        ? {
            username: recipient_email || 'john.doe@example.com',
            password: 'TempPass123!',
            temporaryPassword: true,
          }
        : undefined,
    };

    const emailTemplate = generateSurveyInvitationTemplate(previewData);

    return NextResponse.json({
      success: true,
      data: {
        subject: settings.custom_subject || emailTemplate.subject,
        html: emailTemplate.html,
        text: emailTemplate.text,
      },
    });
  } catch (error) {
    console.error('Error generating email preview:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
