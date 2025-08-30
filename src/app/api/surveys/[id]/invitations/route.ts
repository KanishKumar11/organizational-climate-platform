import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Survey from '@/models/Survey';
import User from '@/models/User';
import SurveyInvitation from '@/models/SurveyInvitation';
import Company from '@/models/Company';
import { emailService, SurveyInvitationData } from '@/lib/email';
import { hasPermission, hasStringPermission } from '@/lib/permissions';
import crypto from 'crypto';

// Send survey invitations
export async function POST(
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
    const body = await request.json();
    const { user_ids, department_ids, send_immediately = true } = body;

    // Get survey
    const survey = await Survey.findById(surveyId);
    if (!survey) {
      return NextResponse.json({ error: 'Survey not found' }, { status: 404 });
    }

    // Check permissions
    if (
      !hasPermission(session.user.role, 'company_admin') ||
      survey.company_id !== session.user.companyId
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get company info
    const company = await Company.findById(survey.company_id);
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // Build user query
    let userQuery: any = { company_id: survey.company_id };

    if (user_ids && user_ids.length > 0) {
      userQuery._id = { $in: user_ids };
    }

    if (department_ids && department_ids.length > 0) {
      userQuery.department_id = { $in: department_ids };
    }

    // Get target users
    const users = await User.find(userQuery);
    if (users.length === 0) {
      return NextResponse.json({ error: 'No users found' }, { status: 400 });
    }

    const invitations = [];
    const errors = [];

    for (const user of users) {
      try {
        // Check if invitation already exists
        const existingInvitation = await SurveyInvitation.findOne({
          survey_id: surveyId,
          user_id: user._id.toString(),
        });

        if (existingInvitation) {
          errors.push(`Invitation already exists for ${user.email}`);
          continue;
        }

        // Generate invitation token
        const invitationToken = crypto.randomBytes(32).toString('hex');

        // Create invitation
        const invitation = new SurveyInvitation({
          survey_id: surveyId,
          user_id: user._id.toString(),
          company_id: survey.company_id,
          email: user.email,
          invitation_token: invitationToken,
          expires_at: survey.end_date,
        });

        await invitation.save();

        // Send email if requested
        if (
          send_immediately &&
          survey.settings.notification_settings.send_invitations
        ) {
          const invitationLink = `${process.env.NEXTAUTH_URL}/survey/${surveyId}?token=${invitationToken}`;

          const invitationData: SurveyInvitationData = {
            survey,
            recipient: user as any,
            invitationLink,
            companyName: company.name,
            expiryDate: survey.end_date,
          };

          const emailSent =
            await emailService.sendSurveyInvitation(invitationData);

          if (emailSent) {
            invitation.markSent();
            await invitation.save();
          }
        }

        invitations.push({
          id: invitation._id,
          user_id: user._id,
          email: user.email,
          status: invitation.status,
          token: invitationToken,
        });
      } catch (error) {
        console.error('Error creating invitation for user:', user.email, error);
        errors.push(`Failed to create invitation for ${user.email}`);
      }
    }

    return NextResponse.json({
      success: true,
      invitations_sent: invitations.length,
      invitations,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Error sending survey invitations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get survey invitations
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
    if (
      !hasStringPermission(session.user.role, 'view_surveys') ||
      survey.company_id !== session.user.companyId
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get invitations with user details
    const invitations = await SurveyInvitation.aggregate([
      { $match: { survey_id: surveyId } },
      {
        $lookup: {
          from: 'users',
          localField: 'user_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $project: {
          _id: 1,
          user_id: 1,
          email: 1,
          status: 1,
          sent_at: 1,
          opened_at: 1,
          started_at: 1,
          completed_at: 1,
          reminder_count: 1,
          last_reminder_sent: 1,
          expires_at: 1,
          created_at: 1,
          'user.name': 1,
          'user.department_id': 1,
        },
      },
      { $sort: { created_at: -1 } },
    ]);

    // Calculate statistics
    const stats = {
      total: invitations.length,
      pending: invitations.filter((i) => i.status === 'pending').length,
      sent: invitations.filter((i) => i.status === 'sent').length,
      opened: invitations.filter((i) => i.status === 'opened').length,
      started: invitations.filter((i) => i.status === 'started').length,
      completed: invitations.filter((i) => i.status === 'completed').length,
      expired: invitations.filter((i) => i.status === 'expired').length,
    };

    return NextResponse.json({
      invitations,
      stats,
    });
  } catch (error) {
    console.error('Error fetching survey invitations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
