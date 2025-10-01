import mongoose, { Document, Schema, Model } from 'mongoose';

// Invitation status type
export type MicroclimateInvitationStatus =
  | 'pending'
  | 'sent'
  | 'opened'
  | 'started'
  | 'participated'
  | 'expired'
  | 'bounced';

// Microclimate invitation interface
export interface IMicroclimateInvitation extends Document {
  microclimate_id: string;
  user_id: string;
  company_id: string;
  email: string;
  invitation_token: string;
  status: MicroclimateInvitationStatus;
  sent_at?: Date;
  opened_at?: Date;
  started_at?: Date;
  participated_at?: Date;
  reminder_count: number;
  last_reminder_sent?: Date;
  expires_at: Date;
  metadata: {
    user_agent?: string;
    ip_address?: string;
    email_client?: string;
    device_type?: string;
  };
  created_at: Date;
  updated_at: Date;

  // Instance methods
  markSent(): void;
  markOpened(metadata?: any): void;
  markStarted(): void;
  markParticipated(): void;
  markExpired(): void;
  sendReminder(): void;
  isExpired(): boolean;
  canSendReminder(): boolean;
}

// Model interface with static methods
export interface IMicroclimateInvitationModel
  extends Model<IMicroclimateInvitation> {
  findByMicroclimate(
    microclimateId: string
  ): Promise<IMicroclimateInvitation[]>;
  findByToken(token: string): Promise<IMicroclimateInvitation | null>;
  findByUser(userId: string): Promise<IMicroclimateInvitation[]>;
  findPendingReminders(): Promise<IMicroclimateInvitation[]>;
  findExpired(): Promise<IMicroclimateInvitation[]>;
}

// Microclimate invitation schema
const MicroclimateInvitationSchema: Schema = new Schema(
  {
    microclimate_id: {
      type: String,
      required: [true, 'Microclimate ID is required'],
      trim: true,
    },
    user_id: {
      type: String,
      required: [true, 'User ID is required'],
      trim: true,
    },
    company_id: {
      type: String,
      required: [true, 'Company ID is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
    },
    invitation_token: {
      type: String,
      required: [true, 'Invitation token is required'],
      unique: true,
      trim: true,
    },
    status: {
      type: String,
      enum: [
        'pending',
        'sent',
        'opened',
        'started',
        'participated',
        'expired',
        'bounced',
      ],
      default: 'pending',
    },
    sent_at: {
      type: Date,
    },
    opened_at: {
      type: Date,
    },
    started_at: {
      type: Date,
    },
    participated_at: {
      type: Date,
    },
    reminder_count: {
      type: Number,
      default: 0,
      min: 0,
    },
    last_reminder_sent: {
      type: Date,
    },
    expires_at: {
      type: Date,
      required: [true, 'Expiry date is required'],
    },
    metadata: {
      user_agent: { type: String },
      ip_address: { type: String },
      email_client: { type: String },
      device_type: { type: String },
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

// Indexes
MicroclimateInvitationSchema.index(
  { microclimate_id: 1, user_id: 1 },
  { unique: true }
);
MicroclimateInvitationSchema.index({ status: 1 });
MicroclimateInvitationSchema.index({ expires_at: 1 });
MicroclimateInvitationSchema.index({ company_id: 1 });

// Static methods
MicroclimateInvitationSchema.statics.findByMicroclimate = function (
  microclimateId: string
) {
  return this.find({ microclimate_id: microclimateId });
};

MicroclimateInvitationSchema.statics.findByToken = function (token: string) {
  return this.findOne({ invitation_token: token });
};

MicroclimateInvitationSchema.statics.findByUser = function (userId: string) {
  return this.find({ user_id: userId });
};

// Instance methods
MicroclimateInvitationSchema.methods.markSent = function (): void {
  this.status = 'sent';
  this.sent_at = new Date();
};

MicroclimateInvitationSchema.methods.markOpened = function (
  metadata?: any
): void {
  if (this.status === 'sent') {
    this.status = 'opened';
    this.opened_at = new Date();
    if (metadata) {
      this.metadata = { ...this.metadata, ...metadata };
    }
  }
};

MicroclimateInvitationSchema.methods.markStarted = function (): void {
  if (['sent', 'opened'].includes(this.status)) {
    this.status = 'started';
    this.started_at = new Date();
  }
};

MicroclimateInvitationSchema.methods.markParticipated = function (): void {
  if (['sent', 'opened', 'started'].includes(this.status)) {
    this.status = 'participated';
    this.participated_at = new Date();
  }
};

MicroclimateInvitationSchema.methods.markExpired = function (): void {
  if (!['participated', 'expired'].includes(this.status)) {
    this.status = 'expired';
  }
};

MicroclimateInvitationSchema.methods.sendReminder = function (): void {
  this.reminder_count += 1;
  this.last_reminder_sent = new Date();
};

MicroclimateInvitationSchema.methods.isExpired = function (): boolean {
  return new Date() > this.expires_at;
};

MicroclimateInvitationSchema.methods.canSendReminder = function (): boolean {
  if (this.status === 'participated' || this.status === 'expired') {
    return false;
  }

  if (this.reminder_count >= 2) {
    return false;
  }

  if (this.isExpired()) {
    return false;
  }

  // Can send reminder if no reminder sent yet, or last reminder was sent more than 24 hours ago
  if (!this.last_reminder_sent) {
    return true;
  }

  const hoursSinceLastReminder =
    (new Date().getTime() - this.last_reminder_sent.getTime()) /
    (1000 * 60 * 60);
  return hoursSinceLastReminder >= 24;
};

// Static methods for finding reminders and expired invitations
MicroclimateInvitationSchema.statics.findPendingReminders =
  async function (): Promise<IMicroclimateInvitation[]> {
    const now = new Date();
    return this.find({
      status: { $in: ['sent', 'opened', 'started'] },
      expires_at: { $gt: now },
      $or: [
        { last_reminder_sent: { $exists: false } },
        {
          last_reminder_sent: {
            $lt: new Date(now.getTime() - 24 * 60 * 60 * 1000), // 24 hours ago
          },
        },
      ],
      reminder_count: { $lt: 2 },
    });
  };

MicroclimateInvitationSchema.statics.findExpired = async function (): Promise<
  IMicroclimateInvitation[]
> {
  return this.find({
    status: { $nin: ['participated', 'expired'] },
    expires_at: { $lt: new Date() },
  });
};

export default (mongoose.models.MicroclimateInvitation ||
  mongoose.model<IMicroclimateInvitation>(
    'MicroclimateInvitation',
    MicroclimateInvitationSchema
  )) as IMicroclimateInvitationModel;
