import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Notification, { INotification } from '@/models/Notification';
import { emailService } from '@/lib/email';
import { User } from '@/models/User';

/**
 * POST /api/cron/send-reminders
 * Cron job to process and send pending reminder notifications
 * 
 * This should be triggered by a cron service (e.g., Vercel Cron, node-cron, or external scheduler)
 * Recommended schedule: Every 15 minutes
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authorization (use a secret key for cron jobs)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'your-cron-secret-key-change-in-production';
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const startTime = Date.now();
    let processedCount = 0;
    let successCount = 0;
    let failureCount = 0;

    // Find pending email notifications scheduled for now or earlier
    const now = new Date();
    const pendingNotifications = await (Notification as any)
      .find({
        channel: 'email',
        status: 'pending',
        scheduled_for: { $lte: now },
      })
      .populate('user_id', 'name email')
      .limit(100)
      .lean();

    console.log(`[CRON] Found ${pendingNotifications.length} pending email notifications to process`);

    // Process each notification
    for (const notification of pendingNotifications) {
      processedCount++;
      
      try {
        // Skip if user not found
        if (!notification.user_id) {
          console.warn(`[CRON] Skipping notification ${notification._id}: User not found`);
          await (Notification as any).findByIdAndUpdate(notification._id, {
            status: 'failed',
            error_message: 'User not found',
          });
          failureCount++;
          continue;
        }

        // Determine notification type and send appropriate email
        let emailSent = false;

        switch (notification.type) {
          case 'survey_reminder':
            if (notification.data?.survey && notification.data?.link) {
              await emailService.sendSurveyReminder({
                survey: notification.data.survey,
                recipient: notification.user_id,
                invitationLink: notification.data.link,
                companyName: notification.data.companyName || 'Your Organization',
                expiryDate: notification.data.expiryDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                reminderCount: notification.data.reminder_count || 1,
              });
              emailSent = true;
            }
            break;

          case 'survey_invitation':
            if (notification.data?.survey && notification.data?.link) {
              await emailService.sendSurveyInvitation({
                survey: notification.data.survey,
                recipient: notification.user_id,
                invitationLink: notification.data.link,
                companyName: notification.data.companyName || 'Your Organization',
                expiryDate: notification.data.expiryDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
              });
              emailSent = true;
            }
            break;

          case 'microclimate_invitation':
            if (notification.data?.microclimate && notification.data?.link) {
              await emailService.sendMicroclimateInvitation({
                microclimate: notification.data.microclimate,
                recipient: notification.user_id,
                invitationLink: notification.data.link,
                companyName: notification.data.companyName || 'Your Organization',
                expiryDate: notification.data.expiryDate || new Date(Date.now() + 24 * 60 * 60 * 1000),
              });
              emailSent = true;
            }
            break;

          case 'microclimate_reminder':
            if (notification.data?.microclimate && notification.data?.link) {
              await emailService.sendMicroclimateReminder({
                microclimate: notification.data.microclimate,
                recipient: notification.user_id,
                invitationLink: notification.data.link,
                companyName: notification.data.companyName || 'Your Organization',
                expiryDate: notification.data.expiryDate || new Date(Date.now() + 24 * 60 * 60 * 1000),
                reminderCount: notification.data.reminder_count || 1,
              });
              emailSent = true;
            }
            break;

          default:
            console.log(`[CRON] Unsupported notification type: ${notification.type}`);
        }

        if (emailSent) {
          // Update notification status to sent
          await (Notification as any).findByIdAndUpdate(notification._id, {
            status: 'sent',
            sent_at: new Date(),
          });
          successCount++;
          console.log(`[CRON] ✅ Sent ${notification.type} to ${notification.user_id.email}`);
        } else {
          // Mark as failed if email wasn't sent
          await (Notification as any).findByIdAndUpdate(notification._id, {
            status: 'failed',
            error_message: 'Insufficient data to send email',
          });
          failureCount++;
        }

      } catch (error) {
        console.error(`[CRON] ❌ Failed to send notification ${notification._id}:`, error);
        
        // Update notification with error
        await (Notification as any).findByIdAndUpdate(notification._id, {
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error',
        });
        failureCount++;
      }

      // Add small delay between emails to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const duration = Date.now() - startTime;

    const result = {
      success: true,
      processed: processedCount,
      succeeded: successCount,
      failed: failureCount,
      duration_ms: duration,
      timestamp: new Date().toISOString(),
    };

    console.log('[CRON] Reminder processing complete:', result);

    return NextResponse.json(result);

  } catch (error) {
    console.error('[CRON] Error processing reminders:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to process reminders',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/cron/send-reminders
 * Test endpoint to check cron job status
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Get pending notifications count
    const pendingCount = await (Notification as any).countDocuments({
      channel: 'email',
      status: 'pending',
      scheduled_for: { $lte: new Date() },
    });

    // Get recent processed notifications
    const recentProcessed = await (Notification as any)
      .find({
        channel: 'email',
        status: { $in: ['sent', 'failed'] },
      })
      .sort({ sent_at: -1 })
      .limit(10)
      .select('type status sent_at error_message')
      .lean();

    return NextResponse.json({
      status: 'active',
      pending_notifications: pendingCount,
      recent_processed: recentProcessed,
      cron_schedule: 'Every 15 minutes',
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error checking cron status:', error);
    return NextResponse.json(
      { error: 'Failed to check cron status' },
      { status: 500 }
    );
  }
}
