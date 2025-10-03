import mongoose, { Document, Schema } from 'mongoose';

// Notification types
export type NotificationType =
  | 'survey_invitation'
  | 'survey_reminder'
  | 'survey_completion'
  | 'microclimate_invitation'
  | 'user_invitation'
  | 'action_plan_alert'
  | 'deadline_reminder'
  | 'ai_insight_alert'
  | 'system_notification';

// Notification priority levels
export type NotificationPriority = 'low' | 'medium' | 'high' | 'critical';

// Notification status
export type NotificationStatus =
  | 'pending'
  | 'sent'
  | 'delivered'
  | 'opened'
  | 'failed'
  | 'cancelled';

// Notification channel
export type NotificationChannel = 'email' | 'in_app' | 'push' | 'sms';

// Metadata type for notification tracking
export interface NotificationMetadata {
  user_agent?: string;
  ip_address?: string;
  email_client?: string;
  device_type?: string;
  [key: string]: string | number | boolean | undefined;
}

// Notification interface
export interface INotification extends Document {
  user_id: string;
  company_id: string;
  type: NotificationType;
  channel: NotificationChannel;
  priority: NotificationPriority;
  status: NotificationStatus;
  title: string;
  message: string;
  data: Record<string, string | number | boolean | null>;
  template_id?: string;
  scheduled_for: Date;
  sent_at?: Date;
  delivered_at?: Date;
  opened_at?: Date;
  failed_at?: Date;
  failure_reason?: string;
  retry_count: number;
  max_retries: number;
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
  markDelivered(metadata?: NotificationMetadata): void;
  markOpened(metadata?: NotificationMetadata): void;
  markFailed(reason: string): void;
  markCancelled(): void;
  canRetry(): boolean;
  scheduleRetry(delayMinutes?: number): void;
}

// Notification schema
const NotificationSchema: Schema = new Schema(
  {
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
    type: {
      type: String,
      enum: [
        'survey_invitation',
        'survey_reminder',
        'survey_completion',
        'microclimate_invitation',
        'user_invitation',
        'action_plan_alert',
        'deadline_reminder',
        'ai_insight_alert',
        'system_notification',
      ],
      required: [true, 'Notification type is required'],
    },
    channel: {
      type: String,
      enum: ['email', 'in_app', 'push', 'sms'],
      required: [true, 'Notification channel is required'],
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['pending', 'sent', 'delivered', 'opened', 'failed', 'cancelled'],
      default: 'pending',
    },
    title: {
      type: String,
      required: [true, 'Notification title is required'],
      trim: true,
    },
    message: {
      type: String,
      required: [true, 'Notification message is required'],
      trim: true,
    },
    data: {
      type: Schema.Types.Mixed,
      default: {},
    },
    template_id: {
      type: String,
      trim: true,
    },
    scheduled_for: {
      type: Date,
      required: [true, 'Scheduled time is required'],
    },
    sent_at: {
      type: Date,
    },
    delivered_at: {
      type: Date,
    },
    opened_at: {
      type: Date,
    },
    failed_at: {
      type: Date,
    },
    failure_reason: {
      type: String,
      trim: true,
    },
    retry_count: {
      type: Number,
      default: 0,
      min: 0,
    },
    max_retries: {
      type: Number,
      default: 3,
      min: 0,
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
NotificationSchema.index({ user_id: 1, created_at: -1 });
NotificationSchema.index({ company_id: 1, created_at: -1 });
NotificationSchema.index({ status: 1, scheduled_for: 1 });
NotificationSchema.index({ type: 1, status: 1 });
NotificationSchema.index({ priority: 1, scheduled_for: 1 });
// Compound indexes for common queries to improve performance
NotificationSchema.index({ user_id: 1, status: 1, created_at: -1 });
NotificationSchema.index({ company_id: 1, status: 1, created_at: -1 });

// Static methods
NotificationSchema.statics.findPendingNotifications = function (limit = 100) {
  return this.find({
    status: 'pending',
    scheduled_for: { $lte: new Date() },
    retry_count: { $lt: 3 }, // Use default max_retries value
  })
    .sort({ priority: -1, scheduled_for: 1 })
    .limit(limit);
};

NotificationSchema.statics.findByUser = function (userId: string, limit = 50) {
  return this.find({ user_id: userId }).sort({ created_at: -1 }).limit(limit);
};

NotificationSchema.statics.findByCompany = function (
  companyId: string,
  limit = 100
) {
  return this.find({ company_id: companyId })
    .sort({ created_at: -1 })
    .limit(limit);
};

NotificationSchema.statics.getDeliveryStats = function (
  companyId: string,
  startDate: Date,
  endDate: Date
) {
  return this.aggregate([
    {
      $match: {
        company_id: companyId,
        created_at: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: {
          type: '$type',
          channel: '$channel',
          status: '$status',
        },
        count: { $sum: 1 },
      },
    },
    {
      $group: {
        _id: {
          type: '$_id.type',
          channel: '$_id.channel',
        },
        statuses: {
          $push: {
            status: '$_id.status',
            count: '$count',
          },
        },
        total: { $sum: '$count' },
      },
    },
  ]);
};

// Instance methods
NotificationSchema.methods.markSent = function () {
  this.status = 'sent';
  this.sent_at = new Date();
};

NotificationSchema.methods.markDelivered = function (
  metadata?: NotificationMetadata
) {
  this.status = 'delivered';
  this.delivered_at = new Date();
  if (metadata) {
    this.metadata = { ...this.metadata, ...metadata };
  }
};

NotificationSchema.methods.markOpened = function (
  metadata?: NotificationMetadata
) {
  this.status = 'opened';
  this.opened_at = new Date();
  if (metadata) {
    this.metadata = { ...this.metadata, ...metadata };
  }
};

NotificationSchema.methods.markFailed = function (reason: string) {
  this.status = 'failed';
  this.failed_at = new Date();
  this.failure_reason = reason;
  this.retry_count += 1;
};

NotificationSchema.methods.markCancelled = function () {
  this.status = 'cancelled';
};

NotificationSchema.methods.canRetry = function (): boolean {
  return this.status === 'failed' && this.retry_count < this.max_retries;
};

NotificationSchema.methods.scheduleRetry = function (delayMinutes = 30) {
  if (this.canRetry()) {
    this.status = 'pending';
    this.scheduled_for = new Date(Date.now() + delayMinutes * 60 * 1000);
  }
};

export default (mongoose.models.Notification ||
  mongoose.model<INotification>(
    'Notification',
    NotificationSchema
  )) as mongoose.Model<INotification>;
