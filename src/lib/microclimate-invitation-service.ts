import MicroclimateInvitation, {
  IMicroclimateInvitation,
  MicroclimateInvitationStatus,
} from '@/models/MicroclimateInvitation';
import Microclimate, { IMicroclimate } from '@/models/Microclimate';
import User, { IUser } from '@/models/User';
import Company, { ICompany } from '@/models/Company';
import { notificationService } from './notification-service';
import { connectDB } from './mongodb';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

// Microclimate invitation creation data
export interface MicroclimateInvitationData {
  microclimate_id: string;
  user_ids: string[];
  expires_at?: Date;
  send_immediately?: boolean;
  scheduled_send_time?: Date;
  custom_message?: string;
}

// Microclimate invitation email data
export interface MicroclimateInvitationEmailData {
  microclimate: IMicroclimate;
  recipient: IUser;
  invitationLink: string;
  companyName: string;
  expiryDate: Date;
  company?: ICompany;
  reminderCount?: number;
}

// Participation tracking data
export interface MicroclimateParticipationTracking {
  microclimate_id: string;
  total_invitations: number;
  sent_invitations: number;
  opened_invitations: number;
  started_responses: number;
  participated_responses: number;
  bounced_invitations: number;
  expired_invitations: number;
  participation_rate: number;
  response_rate: number;
  average_time_to_participate: number;
  department_breakdown: Record<
    string,
    {
      invited: number;
      participated: number;
      rate: number;
    }
  >;
}

class MicroclimateInvitationService {
  // Create and send microclimate invitations
  async createInvitations(data: MicroclimateInvitationData): Promise<IMicroclimateInvitation[]> {
    await connectDB();

    const microclimate = await (Microclimate as any)
      .findById(data.microclimate_id)
      .populate('company_id');
    if (!microclimate) {
      throw new Error('Microclimate not found');
    }

    const users = await (User as any).find({ _id: { $in: data.user_ids } });
    if (users.length === 0) {
      throw new Error('No valid users found');
    }

    const company = await (Company as any).findById(microclimate.company_id);
    
    // Calculate expiry time based on microclimate duration
    const expiresAt = data.expires_at || new Date(
      microclimate.scheduling.start_time.getTime() + 
      microclimate.scheduling.duration_minutes * 60 * 1000
    );

    const invitations: IMicroclimateInvitation[] = [];

    for (const user of users) {
      // Check if invitation already exists
      const existingInvitation = await (MicroclimateInvitation as any).findOne({
        microclimate_id: data.microclimate_id,
        user_id: user._id.toString(),
      });

      if (existingInvitation) {
        console.log(`Microclimate invitation already exists for user ${user._id}`);
        continue;
      }

      // Create invitation
      const invitation = new MicroclimateInvitation({
        microclimate_id: data.microclimate_id,
        user_id: user._id.toString(),
        company_id: microclimate.company_id.toString(),
        email: user.email,
        invitation_token: crypto.randomBytes(32).toString('hex'),
        expires_at: expiresAt,
        status: 'pending',
      });

      await invitation.save();

      // Schedule notification
      const sendTime = data.scheduled_send_time || 
        (data.send_immediately !== false ? new Date() : await this.optimizeSendTime(user._id.toString()));

      await notificationService.createNotification({
        user_id: user._id.toString(),
        company_id: microclimate.company_id.toString(),
        type: 'microclimate_invitation',
        channel: 'email',
        priority: 'medium',
        scheduled_for: sendTime,
        data: {
          microclimate_id: data.microclimate_id,
          invitation_id: invitation._id.toString(),
          microclimate_id_ref: microclimate._id.toString(),
          companyName: company?.name || 'Your Organization',
          expiryDate: expiresAt.toISOString(),
          link: this.generateInvitationLink(invitation.invitation_token),
          custom_message: data.custom_message || null,
        },
        variables: {
          recipientName: user.name,
          recipientEmail: user.email,
          microclimateName: microclimate.name,
          companyName: company?.name || 'Your Organization',
          invitationLink: this.generateInvitationLink(invitation.invitation_token),
          expiryDate: expiresAt.toISOString(),
        },
      });

      // Also create in-app notification
      await notificationService.createNotification({
        user_id: user._id.toString(),
        company_id: microclimate.company_id.toString(),
        type: 'microclimate_invitation',
        channel: 'in_app',
        priority: 'medium',
        scheduled_for: sendTime,
        data: {
          microclimate_id: data.microclimate_id,
          invitation_id: invitation._id.toString(),
          microclimate: microclimate,
          link: this.generateInvitationLink(invitation.invitation_token),
        },
        variables: {
          recipient: user,
          microclimate: microclimate,
          invitationLink: this.generateInvitationLink(invitation.invitation_token),
        },
      });

      invitations.push(invitation);
    }

    // Schedule automatic reminders if enabled
    await this.scheduleReminders(data.microclimate_id, invitations);

    return invitations;
  }

  // Generate invitation link
  private generateInvitationLink(token: string): string {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    return `${baseUrl}/microclimates/invitation/${token}`;
  }

  // Optimize send time for user
  private async optimizeSendTime(userId: string): Promise<Date> {
    // Use notification service's optimization
    return await notificationService.optimizeSendTime(userId, 'email');
  }

  // Schedule automatic reminders
  private async scheduleReminders(
    microclimateId: string,
    invitations: IMicroclimateInvitation[]
  ): Promise<void> {
    const microclimate = await (Microclimate as any).findById(microclimateId);
    if (!microclimate || !microclimate.scheduling.reminder_settings.send_reminders) {
      return;
    }

    const reminderMinutes = microclimate.scheduling.reminder_settings.reminder_minutes_before || [60, 15];

    for (const invitation of invitations) {
      const user = await (User as any).findById(invitation.user_id);
      if (!user) continue;

      // Schedule reminders based on microclimate start time
      for (let i = 0; i < reminderMinutes.length && i < 2; i++) {
        const reminderTime = new Date(
          microclimate.scheduling.start_time.getTime() - 
          reminderMinutes[i] * 60 * 1000
        );

        // Don't schedule if past expiry or already started
        if (reminderTime >= invitation.expires_at || reminderTime <= new Date()) continue;

        await notificationService.createNotification({
          user_id: invitation.user_id,
          company_id: invitation.company_id,
          type: 'microclimate_invitation',
          channel: 'email',
          priority: i >= 1 ? 'high' : 'medium', // Escalate priority for later reminders
          scheduled_for: reminderTime,
          data: {
            microclimate_id: microclimateId,
            invitation_id: invitation._id.toString(),
            microclimate: microclimate,
            reminder_count: i + 1,
            link: this.generateInvitationLink(invitation.invitation_token),
            is_reminder: true,
          },
          variables: {
            recipient: user,
            microclimate: microclimate,
            invitationLink: this.generateInvitationLink(invitation.invitation_token),
            reminderCount: i + 1,
          },
        });
      }
    }
  }

  // Get participation tracking data
  async getParticipationTracking(microclimateId: string): Promise<MicroclimateParticipationTracking> {
    await connectDB();

    const invitations = await (MicroclimateInvitation as any).find({
      microclimate_id: microclimateId,
    });

    const users = await (User as any).find({
      _id: { $in: invitations.map((inv: any) => inv.user_id) },
    });

    const totalInvitations = invitations.length;
    const sentInvitations = invitations.filter((inv: any) => 
      ['sent', 'opened', 'started', 'participated'].includes(inv.status)
    ).length;
    const openedInvitations = invitations.filter((inv: any) => 
      ['opened', 'started', 'participated'].includes(inv.status)
    ).length;
    const startedResponses = invitations.filter((inv: any) => 
      ['started', 'participated'].includes(inv.status)
    ).length;
    const participatedResponses = invitations.filter((inv: any) => 
      inv.status === 'participated'
    ).length;
    const bouncedInvitations = invitations.filter((inv: any) => 
      inv.status === 'bounced'
    ).length;
    const expiredInvitations = invitations.filter((inv: any) => 
      inv.status === 'expired'
    ).length;

    const participationRate = totalInvitations > 0 ? 
      (participatedResponses / totalInvitations) * 100 : 0;
    const responseRate = sentInvitations > 0 ? 
      (participatedResponses / sentInvitations) * 100 : 0;

    // Calculate average time to participate
    const participatedInvitations = invitations.filter((inv: any) => 
      inv.status === 'participated' && inv.sent_at && inv.participated_at
    );
    const averageTimeToParticipate = participatedInvitations.length > 0 ?
      participatedInvitations.reduce((sum: number, inv: any) => {
        return sum + (inv.participated_at.getTime() - inv.sent_at.getTime());
      }, 0) / participatedInvitations.length / (1000 * 60) : 0; // in minutes

    // Department breakdown
    const departmentBreakdown: Record<
      string,
      { invited: number; participated: number; rate: number }
    > = {};

    for (const user of users) {
      const department = user.department_id || 'Unknown';
      if (!departmentBreakdown[department]) {
        departmentBreakdown[department] = { invited: 0, participated: 0, rate: 0 };
      }

      departmentBreakdown[department].invited++;

      const userInvitation = invitations.find(
        (inv: any) => inv.user_id === user._id.toString()
      );
      if (userInvitation?.status === 'participated') {
        departmentBreakdown[department].participated++;
      }
    }

    // Calculate department rates
    Object.values(departmentBreakdown).forEach((dept) => {
      dept.rate = dept.invited > 0 ? (dept.participated / dept.invited) * 100 : 0;
    });

    return {
      microclimate_id: microclimateId,
      total_invitations: totalInvitations,
      sent_invitations: sentInvitations,
      opened_invitations: openedInvitations,
      started_responses: startedResponses,
      participated_responses: participatedResponses,
      bounced_invitations: bouncedInvitations,
      expired_invitations: expiredInvitations,
      participation_rate: Math.round(participationRate * 100) / 100,
      response_rate: Math.round(responseRate * 100) / 100,
      average_time_to_participate: Math.round(averageTimeToParticipate * 100) / 100,
      department_breakdown: departmentBreakdown,
    };
  }

  // Resend invitation
  async resendInvitation(invitationId: string): Promise<void> {
    await connectDB();

    const invitation = await (MicroclimateInvitation as any).findById(invitationId);
    if (!invitation) {
      throw new Error('Invitation not found');
    }

    if (invitation.status === 'participated') {
      throw new Error('Cannot resend invitation - user has already participated');
    }

    if (invitation.isExpired()) {
      throw new Error('Cannot resend invitation - invitation has expired');
    }

    const microclimate = await (Microclimate as any).findById(invitation.microclimate_id);
    const user = await (User as any).findById(invitation.user_id);
    const company = await (Company as any).findById(invitation.company_id);

    if (!microclimate || !user || !company) {
      throw new Error('Required data not found');
    }

    // Create new notification
    await notificationService.createNotification({
      user_id: invitation.user_id,
      company_id: invitation.company_id,
      type: 'microclimate_invitation',
      channel: 'email',
      priority: 'medium',
      scheduled_for: new Date(),
      data: {
        microclimate_id: invitation.microclimate_id,
        invitation_id: invitation._id.toString(),
        microclimate: microclimate,
        companyName: company.name,
        expiryDate: invitation.expires_at,
        link: this.generateInvitationLink(invitation.invitation_token),
        is_resend: true,
      },
      variables: {
        recipient: user,
        microclimate: microclimate,
        company: company,
        invitationLink: this.generateInvitationLink(invitation.invitation_token),
        companyName: company.name,
        expiryDate: invitation.expires_at,
      },
    });
  }
}

export const microclimateInvitationService = new MicroclimateInvitationService();
