import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import SurveyInvitation from '@/models/SurveyInvitation';
import Survey from '@/models/Survey';
import User from '@/models/User';
import Company from '@/models/Company';
import { emailService, SurveyInvitationData } from '@/lib/email';

// Send survey reminders (typically called by a cron job)
export async function POST(request: NextRequest) {
  try {
    // Verify this is an internal request (add authentication as needed)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Find invitations that need reminders
    const pendingInvitations = await SurveyInvitation.find({
      status: { $in: ['sent', 'opened'] },
      expires_at: { $gt: new Date() },
      $or: [
        { last_reminder_sent: { $exists: false } },
        {
          last_reminder_sent: {
            $lt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          },
        },
      ],
      reminder_count: { $lt: 3 },
    });

    let remindersSent = 0;
    const errors: string[] = [];

    for (const invitation of pendingInvitations) {
      try {
        // Get survey, user, and company data
        const [survey, user, company] = await Promise.all([
          Survey.findById(invitation.survey_id),
          User.findById(invitation.user_id),
          Company.findById(invitation.company_id),
        ]);

        if (!survey || !user || !company) {
          errors.push(`Missing data for invitation ${invitation._id}`);
          continue;
        }

        // Check if survey is still active
        if (!survey.canAcceptResponses()) {
          // Mark invitation as expired
          invitation.markExpired();
          await invitation.save();
          continue;
        }

        // Send reminder email
        const invitationLink = `${process.env.NEXTAUTH_URL}/survey/${survey._id}?token=${invitation.invitation_token}`;

        const reminderData: SurveyInvitationData = {
          survey,
          recipient: user as any,
          invitationLink,
          companyName: company.name,
          expiryDate: survey.end_date,
        };

        const emailSent = await emailService.sendSurveyReminder(reminderData);

        if (emailSent) {
          invitation.sendReminder();
          await invitation.save();
          remindersSent++;
        } else {
          errors.push(`Failed to send reminder to ${user.email}`);
        }
      } catch (error) {
        console.error('Error sending reminder:', error);
        errors.push(`Error processing invitation ${invitation._id}`);
      }
    }

    return NextResponse.json({
      success: true,
      reminders_sent: remindersSent,
      invitations_processed: pendingInvitations.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Error in reminder system:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get reminder statistics
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const stats = await SurveyInvitation.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          avg_reminders: { $avg: '$reminder_count' },
        },
      },
    ]);

    const pendingReminders = await SurveyInvitation.find({
      status: { $in: ['sent', 'opened'] },
      expires_at: { $gt: new Date() },
      $or: [
        { last_reminder_sent: { $exists: false } },
        {
          last_reminder_sent: {
            $lt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          },
        },
      ],
      reminder_count: { $lt: 3 },
    });

    return NextResponse.json({
      stats,
      pending_reminders: pendingReminders.length,
    });
  } catch (error) {
    console.error('Error fetching reminder stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
