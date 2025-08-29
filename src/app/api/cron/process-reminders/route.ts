import { NextRequest, NextResponse } from 'next/server';
import SurveyInvitation from '@/models/SurveyInvitation';
import Survey from '@/models/Survey';
import User from '@/models/User';
import Company from '@/models/Company';
import { notificationService } from '@/lib/notification-service';
import { connectDB } from '@/lib/mongodb';

// POST /api/cron/process-reminders - Process pending reminders (for cron jobs)
export async function POST(request: NextRequest) {
  try {
    // This endpoint should be protected by API key or internal access only
    const authHeader = request.headers.get('authorization');
    const apiKey = process.env.INTERNAL_API_KEY;

    if (!apiKey || authHeader !== `Bearer ${apiKey}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Find invitations that need reminders
    const invitationsNeedingReminders =
      await SurveyInvitation.findPendingReminders();

    let processedCount = 0;

    for (const invitation of invitationsNeedingReminders) {
      try {
        // Check if we can send reminder
        if (!invitation.canSendReminder()) {
          continue;
        }

        // Get survey and user data
        const survey = await Survey.findById(invitation.survey_id);
        const user = await User.findById(invitation.user_id);
        const company = await Company.findById(invitation.company_id);

        if (!survey || !user || !company) {
          continue;
        }

        // Create reminder notification
        await notificationService.createNotification({
          user_id: invitation.user_id,
          company_id: invitation.company_id,
          type: 'survey_reminder',
          channel: 'email',
          priority: invitation.reminder_count >= 2 ? 'high' : 'medium',
          scheduled_for: new Date(),
          data: {
            survey_id: invitation.survey_id,
            invitation_id: invitation._id.toString(),
            survey: survey,
            reminder_count: invitation.reminder_count + 1,
            link: `${process.env.NEXTAUTH_URL}/survey/invitation/${invitation.invitation_token}`,
          },
          variables: {
            recipient: user,
            survey: survey,
            company: company,
            invitationLink: `${process.env.NEXTAUTH_URL}/survey/invitation/${invitation.invitation_token}`,
            companyName: company.name,
            expiryDate: invitation.expires_at,
            reminderCount: invitation.reminder_count + 1,
          },
        });

        // Update invitation reminder count
        invitation.sendReminder();
        await invitation.save();

        processedCount++;
      } catch (error) {
        console.error(
          'Error processing reminder for invitation:',
          invitation._id,
          error
        );
      }
    }

    // Mark expired invitations
    const expiredInvitations = await SurveyInvitation.findExpired();
    for (const invitation of expiredInvitations) {
      invitation.markExpired();
      await invitation.save();
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${processedCount} reminders and marked ${expiredInvitations.length} invitations as expired`,
      data: {
        reminders_sent: processedCount,
        expired_invitations: expiredInvitations.length,
      },
    });
  } catch (error) {
    console.error('Error processing reminders:', error);
    return NextResponse.json(
      { error: 'Failed to process reminders' },
      { status: 500 }
    );
  }
}
