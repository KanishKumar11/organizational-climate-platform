import mongoose, { Document, Schema } from 'mongoose';

// Survey invitation status
export type InvitationStatus =
  | 'pending'
  | 'sent'
  | 'opened'
  | 'started'
  | 'completed'
  | 'expired'
  | 'bounced';

// Survey invitation interface
export interface ISurveyInvitation extends Document {
  survey_id: string;
  user_id: string;
  company_id: string;
  email: string;
  invitation_token: string;
  status: InvitationStatus;
  sent_at?: Date;
  opened_at?: Date;
  started_at?: Date;
  completed_at?: Date;
  reminder_count: number;
  last_reminder_sent?: Date;
  expires_at: Date;
  metadata: {
    user_agent?: string;
    ip_address?: string;
    email_client?: string;
  };
  created_at: Date;
  updated_at: Date;
  // Instance methods
  markSent(): void;
  markOpened(metadata?: any): void;
  markStarted(): void;
  markCompleted(): void;
  markExpired(): void;
  sendReminder(): void;
  isExpired(): boolean;
  canSendReminder(): boolean;
}

// Static methods interface
export interface ISurveyInvitationModel
  extends mongoose.Model<ISurveyInvitation> {
  findPendingReminders(): Promise<ISurveyInvitation[]>;
  findExpired(): Promise<ISurveyInvitation[]>;
}

// Survey invitation schema
const SurveyInvitationSchema: Schema = new Schema(
  {
    survey_id: {
      type: String,
      required: [true, 'Survey ID is required'],
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
        'completed',
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
    completed_at: {
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
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

// Indexes
SurveyInvitationSchema.index({ survey_id: 1, user_id: 1 }, { unique: true });
SurveyInvitationSchema.index({ invitation_token: 1 }, { unique: true });
SurveyInvitationSchema.index({ status: 1 });
SurveyInvitationSchema.index({ expires_at: 1 });
SurveyInvitationSchema.index({ company_id: 1 });

// Static methods
SurveyInvitationSchema.statics.findBySurvey = function (surveyId: string) {
  return this.find({ survey_id: surveyId });
};

SurveyInvitationSchema.statics.findByToken = function (token: string) {
  return this.findOne({ invitation_token: token });
};

SurveyInvitationSchema.statics.findPendingReminders = function () {
  const now = new Date();
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

  return this.find({
    status: { $in: ['sent', 'opened'] },
    expires_at: { $gt: now },
    $or: [
      { last_reminder_sent: { $exists: false } },
      { last_reminder_sent: { $lt: threeDaysAgo } },
    ],
    reminder_count: { $lt: 3 },
  });
};

SurveyInvitationSchema.statics.findExpired = function () {
  return this.find({
    expires_at: { $lt: new Date() },
    status: { $nin: ['completed', 'expired'] },
  });
};

// Instance methods
SurveyInvitationSchema.methods.markSent = function () {
  this.status = 'sent';
  this.sent_at = new Date();
};

SurveyInvitationSchema.methods.markOpened = function (metadata?: any) {
  if (this.status === 'sent') {
    this.status = 'opened';
    this.opened_at = new Date();
    if (metadata) {
      this.metadata = { ...this.metadata, ...metadata };
    }
  }
};

SurveyInvitationSchema.methods.markStarted = function () {
  if (['sent', 'opened'].includes(this.status)) {
    this.status = 'started';
    this.started_at = new Date();
  }
};

SurveyInvitationSchema.methods.markCompleted = function () {
  this.status = 'completed';
  this.completed_at = new Date();
};

SurveyInvitationSchema.methods.markExpired = function () {
  this.status = 'expired';
};

SurveyInvitationSchema.methods.sendReminder = function () {
  this.reminder_count += 1;
  this.last_reminder_sent = new Date();
};

SurveyInvitationSchema.methods.isExpired = function (): boolean {
  return new Date() > this.expires_at;
};

SurveyInvitationSchema.methods.canSendReminder = function (): boolean {
  if (
    this.isExpired() ||
    this.status === 'completed' ||
    this.reminder_count >= 3
  ) {
    return false;
  }

  if (!this.last_reminder_sent) {
    return true;
  }

  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
  return this.last_reminder_sent < threeDaysAgo;
};

// Static methods
SurveyInvitationSchema.statics.findPendingReminders =
  async function (): Promise<ISurveyInvitation[]> {
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

SurveyInvitationSchema.statics.findExpired = async function (): Promise<
  ISurveyInvitation[]
> {
  return this.find({
    status: { $nin: ['completed', 'expired'] },
    expires_at: { $lt: new Date() },
  });
};

export default (mongoose.models.SurveyInvitation ||
  mongoose.model<ISurveyInvitation>(
    'SurveyInvitation',
    SurveyInvitationSchema
  )) as ISurveyInvitationModel;
