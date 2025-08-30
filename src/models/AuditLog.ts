import mongoose, { Document, Schema } from 'mongoose';
import { createPrivacyMiddleware } from '../lib/data-privacy';

// Audit action types
export type AuditAction =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'login'
  | 'logout'
  | 'export'
  | 'import'
  | 'survey_create'
  | 'survey_launch'
  | 'survey_complete'
  | 'response_submit'
  | 'insight_generate'
  | 'action_plan_create'
  | 'ai_reanalysis_triggered'
  | 'ai_reanalysis_failed'
  | 'reanalysis_config_updated'
  | 'demographic_snapshot_created'
  | 'demographic_snapshot_rollback'
  | 'demographic_change_notification';

// Audit resource types
export type AuditResource =
  | 'user'
  | 'company'
  | 'department'
  | 'survey'
  | 'response'
  | 'insight'
  | 'action_plan'
  | 'template'
  | 'audit_log';

// Audit log interface
export interface IAuditLog extends Document {
  user_id?: string;
  company_id: string;
  action: AuditAction;
  resource: AuditResource;
  resource_id?: string;
  details: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  success: boolean;
  error_message?: string;
  timestamp: Date;
}

// Audit log schema
const AuditLogSchema: Schema = new Schema(
  {
    user_id: {
      type: String,
      trim: true,
    },
    company_id: {
      type: String,
      required: [true, 'Company ID is required'],
      trim: true,
    },
    action: {
      type: String,
      enum: [
        'create',
        'read',
        'update',
        'delete',
        'login',
        'logout',
        'export',
        'import',
        'survey_create',
        'survey_launch',
        'survey_complete',
        'response_submit',
        'insight_generate',
        'action_plan_create',
      ],
      required: [true, 'Action is required'],
    },
    resource: {
      type: String,
      enum: [
        'user',
        'company',
        'department',
        'survey',
        'response',
        'insight',
        'action_plan',
        'template',
      ],
      required: [true, 'Resource is required'],
    },
    resource_id: {
      type: String,
      trim: true,
    },
    details: {
      type: Schema.Types.Mixed,
      default: {},
    },
    ip_address: {
      type: String,
      trim: true,
    },
    user_agent: {
      type: String,
      trim: true,
    },
    success: {
      type: Boolean,
      required: [true, 'Success status is required'],
    },
    error_message: {
      type: String,
      trim: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      required: [true, 'Timestamp is required'],
    },
  },
  {
    // No automatic timestamps since we use custom timestamp field
    timestamps: false,
  }
);

// Indexes
AuditLogSchema.index({ company_id: 1, timestamp: -1 });
AuditLogSchema.index({ user_id: 1, timestamp: -1 });
AuditLogSchema.index({ action: 1, resource: 1 });
AuditLogSchema.index({ resource_id: 1 });
AuditLogSchema.index({ success: 1 });
AuditLogSchema.index({ timestamp: -1 });

// Static methods
AuditLogSchema.statics.findByUser = function (
  userId: string,
  limit: number = 100
) {
  return this.find({ user_id: userId }).sort({ timestamp: -1 }).limit(limit);
};

AuditLogSchema.statics.findByCompany = function (
  companyId: string,
  limit: number = 100
) {
  return this.find({ company_id: companyId })
    .sort({ timestamp: -1 })
    .limit(limit);
};

AuditLogSchema.statics.findByResource = function (
  resource: AuditResource,
  resourceId?: string
) {
  const query: { resource: AuditResource; resource_id?: string } = { resource };
  if (resourceId) query.resource_id = resourceId;
  return this.find(query).sort({ timestamp: -1 });
};

AuditLogSchema.statics.findFailures = function (companyId?: string) {
  const query: { success: boolean; company_id?: string } = { success: false };
  if (companyId) query.company_id = companyId;
  return this.find(query).sort({ timestamp: -1 });
};

AuditLogSchema.statics.findByDateRange = function (
  startDate: Date,
  endDate: Date,
  companyId?: string
) {
  const query: {
    timestamp: { $gte: Date; $lte: Date };
    company_id?: string;
  } = {
    timestamp: { $gte: startDate, $lte: endDate },
  };
  if (companyId) query.company_id = companyId;
  return this.find(query).sort({ timestamp: -1 });
};

// Helper method to create audit log entries
AuditLogSchema.statics.log = function (logData: Partial<IAuditLog>) {
  return this.create({
    timestamp: new Date(),
    success: true,
    ...logData,
  });
};

// Privacy middleware for audit logs
const auditPrivacyMiddleware = createPrivacyMiddleware('audit_logs');

// Pre-save middleware for privacy
AuditLogSchema.pre('save', function (next) {
  // Apply data privacy processing
  const processedData = auditPrivacyMiddleware.beforeSave(this.toObject());
  Object.assign(this, processedData);
  next();
});

export default (mongoose.models.AuditLog ||
  mongoose.model<IAuditLog>(
    'AuditLog',
    AuditLogSchema
  )) as mongoose.Model<IAuditLog>;
