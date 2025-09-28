import UserInvitation, {
  IUserInvitation,
  UserInvitationStatus,
  UserInvitationType,
} from '@/models/UserInvitation';
import User, { IUser } from '@/models/User';
import Company, { ICompany } from '@/models/Company';
import Department, { IDepartment } from '@/models/Department';
import { notificationService } from './notification-service';
import { emailService } from './email';
import { connectDB } from './mongodb';
import { UserRole } from '@/types/user';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

// Company admin invitation data
export interface CompanyAdminInvitationData {
  email: string;
  company_id: string;
  invited_by: string;
  custom_message?: string;
  expires_in_days?: number;
}

// Employee invitation data
export interface EmployeeInvitationData {
  emails: string[];
  company_id: string;
  department_id?: string;
  role: UserRole;
  invited_by: string;
  custom_message?: string;
  expires_in_days?: number;
  send_immediately?: boolean;
}

// Shareable registration link data
export interface ShareableRegistrationLinkData {
  company_id: string;
  department_id?: string;
  role: UserRole;
  created_by: string;
  expires_in_days?: number;
  max_uses?: number;
}

export class UserInvitationService {
  // Send company admin setup invitation
  async inviteCompanyAdmin(
    data: CompanyAdminInvitationData
  ): Promise<IUserInvitation> {
    await connectDB();

    const company = await Company.findById(data.company_id);
    if (!company) {
      throw new Error('Company not found');
    }

    const inviter = await User.findById(data.invited_by);
    if (!inviter) {
      throw new Error('Inviter not found');
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      email: data.email.toLowerCase(),
    });
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Check if invitation already exists
    const existingInvitation = await UserInvitation.findOne({
      email: data.email.toLowerCase(),
      company_id: data.company_id,
      status: { $nin: ['accepted', 'expired', 'cancelled'] },
    });

    if (existingInvitation) {
      throw new Error('Invitation already exists for this email');
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (data.expires_in_days || 7));

    const invitation = new UserInvitation({
      email: data.email.toLowerCase(),
      company_id: data.company_id,
      invited_by: data.invited_by,
      invitation_token: crypto.randomBytes(32).toString('hex'),
      invitation_type: 'company_admin_setup',
      role: 'company_admin',
      expires_at: expiresAt,
      invitation_data: {
        company_name: company.name,
        inviter_name: inviter.name,
        custom_message: data.custom_message,
        setup_required: true,
      },
    });

    await invitation.save();

    // Send invitation email
    await this.sendInvitationEmail(invitation);

    return invitation;
  }

  // Send employee invitations
  async inviteEmployees(
    data: EmployeeInvitationData
  ): Promise<IUserInvitation[]> {
    await connectDB();

    const company = await Company.findById(data.company_id);
    if (!company) {
      throw new Error('Company not found');
    }

    const inviter = await User.findById(data.invited_by);
    if (!inviter) {
      throw new Error('Inviter not found');
    }

    let department: IDepartment | null = null;
    if (data.department_id) {
      department = await Department.findById(data.department_id);
      if (!department) {
        throw new Error('Department not found');
      }
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (data.expires_in_days || 14));

    const invitations: IUserInvitation[] = [];

    for (const email of data.emails) {
      // Check if user already exists
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        console.log(`User with email ${email} already exists, skipping`);
        continue;
      }

      // Check if invitation already exists
      const existingInvitation = await UserInvitation.findOne({
        email: email.toLowerCase(),
        company_id: data.company_id,
        status: { $nin: ['accepted', 'expired', 'cancelled'] },
      });

      if (existingInvitation) {
        console.log(`Invitation already exists for ${email}, skipping`);
        continue;
      }

      const invitation = new UserInvitation({
        email: email.toLowerCase(),
        company_id: data.company_id,
        department_id: data.department_id,
        invited_by: data.invited_by,
        invitation_token: crypto.randomBytes(32).toString('hex'),
        invitation_type: 'employee_direct',
        role: data.role,
        expires_at: expiresAt,
        invitation_data: {
          company_name: company.name,
          inviter_name: inviter.name,
          custom_message: data.custom_message,
          setup_required: false,
        },
      });

      await invitation.save();

      if (data.send_immediately !== false) {
        await this.sendInvitationEmail(invitation);
      }

      invitations.push(invitation);
    }

    return invitations;
  }

  // Create shareable registration link
  async createShareableRegistrationLink(
    data: ShareableRegistrationLinkData
  ): Promise<IUserInvitation> {
    await connectDB();

    const company = await Company.findById(data.company_id);
    if (!company) {
      throw new Error('Company not found');
    }

    const creator = await User.findById(data.created_by);
    if (!creator) {
      throw new Error('Creator not found');
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (data.expires_in_days || 30));

    const invitation = new UserInvitation({
      email: `shareable-link-${uuidv4()}@${company.domain}`, // Placeholder email
      company_id: data.company_id,
      department_id: data.department_id,
      invited_by: data.created_by,
      invitation_token: crypto.randomBytes(32).toString('hex'),
      invitation_type: 'employee_self_signup',
      role: data.role,
      expires_at: expiresAt,
      invitation_data: {
        company_name: company.name,
        inviter_name: creator.name,
        setup_required: false,
      },
      metadata: {
        registration_link: '',
      },
    });

    // Generate the registration link
    const registrationLink = invitation.generateRegistrationLink();
    invitation.metadata.registration_link = registrationLink;

    await invitation.save();

    return invitation;
  }

  // Send invitation email
  private async sendInvitationEmail(
    invitation: IUserInvitation
  ): Promise<void> {
    const registrationLink = invitation.generateRegistrationLink();

    // For critical emails like company admin setup, send immediately
    if (invitation.invitation_type === 'company_admin_setup') {
      console.log(
        '📤 Sending critical company admin invitation immediately...'
      );

      try {
        const emailData = {
          recipient_email: invitation.email,
          company_name: invitation.invitation_data.company_name,
          inviter_name: invitation.invitation_data.inviter_name,
          role: invitation.role,
          registration_link: registrationLink,
          expires_at: invitation.expires_at,
          custom_message: invitation.invitation_data.custom_message,
          setup_required: invitation.invitation_data.setup_required,
          invitation_type: invitation.invitation_type as
            | 'company_admin_setup'
            | 'employee_direct'
            | 'employee_self_signup',
        };

        const emailSent = await emailService.sendUserInvitation(emailData);

        if (emailSent) {
          console.log(
            '✅ Company admin invitation sent immediately to:',
            invitation.email
          );
          invitation.markSent();
          await invitation.save();
          return;
        } else {
          console.error(
            '❌ Failed to send company admin invitation immediately, falling back to queue'
          );
        }
      } catch (error) {
        console.error(
          '❌ Error sending company admin invitation immediately:',
          error
        );
      }
    }

    // Fallback to notification queue for all other invitation types or if immediate sending failed
    console.log('📋 Queueing invitation email via notification service...');
    await notificationService.createNotification({
      user_id: 'system', // System notification
      company_id: invitation.company_id,
      type: 'user_invitation',
      channel: 'email',
      priority: 'high',
      scheduled_for: new Date(),
      data: {
        invitation_id: invitation._id.toString(),
        invitation_type: invitation.invitation_type,
        role: invitation.role,
        company_name: invitation.invitation_data.company_name,
        inviter_name: invitation.invitation_data.inviter_name,
        custom_message: invitation.invitation_data.custom_message,
        registration_link: registrationLink,
        expires_at: invitation.expires_at,
        setup_required: invitation.invitation_data.setup_required,
        recipient_email: invitation.email,
      },
      variables: {
        recipient_email: invitation.email,
        company_name: invitation.invitation_data.company_name,
        inviter_name: invitation.invitation_data.inviter_name,
        registration_link: registrationLink,
        expires_at: invitation.expires_at,
        role: invitation.role,
      },
    });

    invitation.markSent();
    await invitation.save();
  }

  // Get invitation by token
  async getInvitationByToken(token: string): Promise<IUserInvitation | null> {
    await connectDB();
    return await UserInvitation.findOne({ invitation_token: token });
  }

  // Validate invitation
  async validateInvitation(token: string): Promise<{
    valid: boolean;
    invitation?: IUserInvitation;
    error?: string;
  }> {
    const invitation = await this.getInvitationByToken(token);

    if (!invitation) {
      return { valid: false, error: 'Invalid invitation token' };
    }

    if (invitation.status === 'accepted') {
      return { valid: false, error: 'Invitation has already been accepted' };
    }

    if (invitation.status === 'expired' || invitation.isExpired()) {
      return { valid: false, error: 'Invitation has expired' };
    }

    if (invitation.status === 'cancelled') {
      return { valid: false, error: 'Invitation has been cancelled' };
    }

    return { valid: true, invitation };
  }

  // Accept invitation (mark as accepted)
  async acceptInvitation(token: string): Promise<IUserInvitation> {
    const validation = await this.validateInvitation(token);
    if (!validation.valid || !validation.invitation) {
      throw new Error(validation.error || 'Invalid invitation');
    }

    validation.invitation.markAccepted();
    await validation.invitation.save();

    return validation.invitation;
  }

  // Send reminder for pending invitations
  async sendReminders(): Promise<void> {
    await connectDB();

    const pendingInvitations = await (
      UserInvitation as any
    ).findPendingReminders();

    for (const invitation of pendingInvitations) {
      if (invitation.canSendReminder()) {
        await this.sendInvitationEmail(invitation);
        invitation.sendReminder();
        await invitation.save();
      }
    }
  }

  // Mark expired invitations
  async markExpiredInvitations(): Promise<void> {
    await connectDB();

    const expiredInvitations = await (UserInvitation as any).findExpired();

    for (const invitation of expiredInvitations) {
      invitation.markExpired();
      await invitation.save();
    }
  }

  // Resend an existing invitation
  async resendInvitation(invitationId: string): Promise<IUserInvitation> {
    await connectDB();

    const invitation = await UserInvitation.findById(invitationId);
    if (!invitation) {
      throw new Error('Invitation not found');
    }

    // Send the invitation email
    await this.sendInvitationEmail(invitation);

    // Update invitation status and reminder count
    invitation.status = 'sent';
    invitation.sent_at = new Date();
    invitation.reminder_count = (invitation.reminder_count || 0) + 1;
    invitation.last_reminder_sent = new Date();

    await invitation.save();
    return invitation;
  }
}

export const userInvitationService = new UserInvitationService();
