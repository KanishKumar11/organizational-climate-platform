import mongoose, { Schema, Document } from 'mongoose';

/**
 * SurveyAuditLog Model
 * Comprehensive audit trail for survey changes (WHO, WHAT, WHEN)
 */

export interface ISurveyAuditLog extends Document {
  _id: string;
  survey_id: mongoose.Types.ObjectId;
  
  action: 
    | 'created' | 'updated' | 'deleted'
    | 'published' | 'cancelled' | 'completed'
    | 'question_added' | 'question_removed' | 'question_modified'
    | 'audience_updated' | 'schedule_changed' | 'settings_modified'
    | 'draft_saved' | 'draft_recovered';
  
  entity_type: 
    | 'survey' | 'title' | 'description' | 'questions' 
    | 'audience' | 'schedule' | 'distribution' | 'settings' | 'draft';
  
  entity_id?: string; // For specific entities like question ID
  
  changes: {
    before?: any;
    after?: any;
    diff?: any; // Structured diff for large objects
  };
  
  // User information
  user_id: mongoose.Types.ObjectId;
  user_name: string;
  user_email: string;
  user_role: string;
  
  // Request metadata
  timestamp: Date;
  ip_address?: string;
  user_agent?: string;
  session_id?: string;
  
  // Context
  metadata?: {
    reason?: string;
    automated?: boolean;
    api_version?: string;
  };
}

const SurveyAuditLogSchema = new Schema<ISurveyAuditLog>({
  survey_id: { 
    type: Schema.Types.ObjectId, 
    ref: 'Survey', 
    required: true,
    index: true
  },
  
  action: { 
    type: String, 
    enum: [
      'created', 'updated', 'deleted',
      'published', 'cancelled', 'completed',
      'question_added', 'question_removed', 'question_modified',
      'audience_updated', 'schedule_changed', 'settings_modified',
      'draft_saved', 'draft_recovered'
    ],
    required: true,
    index: true
  },
  
  entity_type: { 
    type: String, 
    enum: [
      'survey', 'title', 'description', 'questions', 
      'audience', 'schedule', 'distribution', 'settings', 'draft'
    ],
    required: true,
    index: true
  },
  
  entity_id: { 
    type: String,
    index: true
  },
  
  changes: {
    before: Schema.Types.Mixed,
    after: Schema.Types.Mixed,
    diff: Schema.Types.Mixed,
  },
  
  user_id: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true
  },
  
  user_name: { 
    type: String, 
    required: true 
  },
  
  user_email: { 
    type: String, 
    required: true 
  },
  
  user_role: { 
    type: String, 
    required: true 
  },
  
  timestamp: { 
    type: Date, 
    default: Date.now,
    index: true
  },
  
  ip_address: String,
  user_agent: String,
  session_id: String,
  
  metadata: {
    reason: String,
    automated: Boolean,
    api_version: String,
  },
}, {
  timestamps: false, // We use custom timestamp field
});

// Compound indexes for efficient queries
SurveyAuditLogSchema.index({ survey_id: 1, timestamp: -1 });
SurveyAuditLogSchema.index({ survey_id: 1, entity_type: 1, timestamp: -1 });
SurveyAuditLogSchema.index({ user_id: 1, timestamp: -1 });
SurveyAuditLogSchema.index({ action: 1, timestamp: -1 });

// Static method to log changes
SurveyAuditLogSchema.statics.logChange = async function(params: {
  surveyId: mongoose.Types.ObjectId;
  action: ISurveyAuditLog['action'];
  entityType: ISurveyAuditLog['entity_type'];
  entityId?: string;
  before?: any;
  after?: any;
  userId: mongoose.Types.ObjectId;
  userName: string;
  userEmail: string;
  userRole: string;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  metadata?: any;
}) {
  const entry = new this({
    survey_id: params.surveyId,
    action: params.action,
    entity_type: params.entityType,
    entity_id: params.entityId,
    changes: {
      before: params.before,
      after: params.after,
      diff: params.before && params.after ? calculateDiff(params.before, params.after) : undefined,
    },
    user_id: params.userId,
    user_name: params.userName,
    user_email: params.userEmail,
    user_role: params.userRole,
    ip_address: params.ipAddress,
    user_agent: params.userAgent,
    session_id: params.sessionId,
    metadata: params.metadata,
  });

  return entry.save();
};

// Get audit log with pagination
SurveyAuditLogSchema.statics.getLog = async function(
  surveyId: mongoose.Types.ObjectId,
  options: {
    limit?: number;
    page?: number;
    action?: string;
    entityType?: string;
    userId?: mongoose.Types.ObjectId;
    startDate?: Date;
    endDate?: Date;
  } = {}
) {
  const filter: any = { survey_id: surveyId };
  
  if (options.action) filter.action = options.action;
  if (options.entityType) filter.entity_type = options.entityType;
  if (options.userId) filter.user_id = options.userId;
  if (options.startDate || options.endDate) {
    filter.timestamp = {};
    if (options.startDate) filter.timestamp.$gte = options.startDate;
    if (options.endDate) filter.timestamp.$lte = options.endDate;
  }
  
  const limit = options.limit || 50;
  const page = options.page || 1;
  const skip = (page - 1) * limit;
  
  const [entries, total] = await Promise.all([
    this.find(filter)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user_id', 'name email role')
      .lean(),
    this.countDocuments(filter),
  ]);
  
  return {
    entries,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  };
};

// Get changes timeline
SurveyAuditLogSchema.statics.getTimeline = async function(
  surveyId: mongoose.Types.ObjectId,
  limit = 20
) {
  return this.find({ survey_id: surveyId })
    .sort({ timestamp: -1 })
    .limit(limit)
    .select('action entity_type user_name timestamp metadata')
    .lean();
};

// Helper function to calculate diff
function calculateDiff(before: any, after: any): any {
  if (typeof before !== 'object' || typeof after !== 'object') {
    return { before, after };
  }

  const diff: any = {};
  const allKeys = new Set([...Object.keys(before || {}), ...Object.keys(after || {})]);

  for (const key of allKeys) {
    if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
      diff[key] = {
        before: before[key],
        after: after[key],
      };
    }
  }

  return Object.keys(diff).length > 0 ? diff : undefined;
}

export default mongoose.models.SurveyAuditLog || 
  mongoose.model<ISurveyAuditLog>('SurveyAuditLog', SurveyAuditLogSchema);
