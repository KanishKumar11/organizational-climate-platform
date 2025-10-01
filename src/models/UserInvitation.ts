import mongoose, { Document, Schema } from 'mongoose';
import { UserRole } from '../types/user';

// User invitation status
export type UserInvitationStatus = 
  | 'pending' 
  | 'sent' 
  | 'opened' 
  | 'accepted' 
  | 'expired' 
  | 'cancelled';

// User invitation type
export type UserInvitationType = 
  | 'company_admin_setup' 
  | 'employee_direct' 
  | 'employee_self_signup';

// User invitation interface
export interface IUserInvitation extends Document {
  email: string;
  company_id: string;
  department_id?: string;
  invited_by: string;
  invitation_token: string;
  invitation_type: UserInvitationType;
  role: UserRole;
  status: UserInvitationStatus;
  expires_at: Date;
  sent_at?: Date;
  opened_at?: Date;
  accepted_at?: Date;
  reminder_count: number;
  last_reminder_sent?: Date;
  metadata: {
    user_agent?: string;
    ip_address?: string;
    email_client?: string;
    device_type?: string;
    registration_link?: string; // For shareable links
  };
  invitation_data: {
    company_name: string;
    inviter_name: string;
    custom_message?: string;
    setup_required?: boolean; // For company admin setup
  };
  created_at: Date;
  updated_at: Date;

  // Instance methods
  markSent(): void;
  markOpened(metadata?: any): void;
  markAccepted(): void;
  markExpired(): void;
  sendReminder(): void;
  isExpired(): boolean;
  canSendReminder(): boolean;
  generateRegistrationLink(): string;
}

// User invitation schema
const UserInvitationSchema: Schema = new Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please provide a valid email address',
      ],
    },
    company_id: {
      type: String,
      required: [true, 'Company ID is required'],
      trim: true,
    },
    department_id: {
      type: String,
      trim: true,
    },
    invited_by: {
      type: String,
      required: [true, 'Inviter ID is required'],
      trim: true,
    },
    invitation_token: {
      type: String,
      required: [true, 'Invitation token is required'],
      unique: true,
      trim: true,
    },
    invitation_type: {
      type: String,
      enum: ['company_admin_setup', 'employee_direct', 'employee_self_signup'],
      required: [true, 'Invitation type is required'],
    },
    role: {
      type: String,
      enum: ['employee', 'supervisor', 'leader', 'department_admin', 'company_admin'],
      required: [true, 'Role is required'],
    },
    status: {
      type: String,
      enum: ['pending', 'sent', 'opened', 'accepted', 'expired', 'cancelled'],
      default: 'pending',
    },
    expires_at: {
      type: Date,
      required: [true, 'Expiration date is required'],
    },
    sent_at: {
      type: Date,
    },
    opened_at: {
      type: Date,
    },
    accepted_at: {
      type: Date,
    },
    reminder_count: {
      type: Number,
      default: 0,
      min: [0, 'Reminder count cannot be negative'],
    },
    last_reminder_sent: {
      type: Date,
    },
    metadata: {
      user_agent: { type: String },
      ip_address: { type: String },
      email_client: { type: String },
      device_type: { type: String },
      registration_link: { type: String },
    },
    invitation_data: {
      company_name: { type: String, required: true },
      inviter_name: { type: String, required: true },
      custom_message: { type: String },
      setup_required: { type: Boolean, default: false },
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

// Indexes
UserInvitationSchema.index({ email: 1, company_id: 1 });
UserInvitationSchema.index({ company_id: 1, status: 1 });
UserInvitationSchema.index({ expires_at: 1 });
UserInvitationSchema.index({ invited_by: 1 });

// Instance methods
UserInvitationSchema.methods.markSent = function (): void {
  this.status = 'sent';
  this.sent_at = new Date();
};

UserInvitationSchema.methods.markOpened = function (metadata?: any): void {
  this.status = 'opened';
  this.opened_at = new Date();
  if (metadata) {
    this.metadata = { ...this.metadata, ...metadata };
  }
};

UserInvitationSchema.methods.markAccepted = function (): void {
  this.status = 'accepted';
  this.accepted_at = new Date();
};

UserInvitationSchema.methods.markExpired = function (): void {
  this.status = 'expired';
};

UserInvitationSchema.methods.sendReminder = function (): void {
  this.reminder_count += 1;
  this.last_reminder_sent = new Date();
};

UserInvitationSchema.methods.isExpired = function (): boolean {
  return new Date() > this.expires_at;
};

UserInvitationSchema.methods.canSendReminder = function (): boolean {
  if (this.status !== 'sent' && this.status !== 'opened') return false;
  if (this.reminder_count >= 3) return false;
  if (this.isExpired()) return false;
  
  // Can send reminder if no reminder sent yet, or last reminder was sent more than 3 days ago
  if (!this.last_reminder_sent) return true;
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
  return this.last_reminder_sent < threeDaysAgo;
};

UserInvitationSchema.methods.generateRegistrationLink = function (): string {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  return `${baseUrl}/auth/register?token=${this.invitation_token}`;
};

// Static methods
UserInvitationSchema.statics.findPendingReminders = function () {
  const now = new Date();
  return this.find({
    status: { $in: ['sent', 'opened'] },
    expires_at: { $gt: now },
    $or: [
      { last_reminder_sent: { $exists: false } },
      {
        last_reminder_sent: {
          $lt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
        },
      },
    ],
    reminder_count: { $lt: 3 },
  });
};

UserInvitationSchema.statics.findExpired = function () {
  return this.find({
    status: { $nin: ['accepted', 'expired', 'cancelled'] },
    expires_at: { $lt: new Date() },
  });
};

const UserInvitation = (mongoose.models.UserInvitation ||
  mongoose.model<IUserInvitation>('UserInvitation', UserInvitationSchema)) as mongoose.Model<IUserInvitation>;

export default UserInvitation;
