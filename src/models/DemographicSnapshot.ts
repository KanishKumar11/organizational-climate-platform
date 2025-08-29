import mongoose, { Document, Schema } from 'mongoose';

// Demographic data interface for individual user
export interface DemographicData {
  user_id: string;
  department: string;
  role: string;
  tenure: string;
  location?: string;
  team?: string;
  level?: string;
  custom_attributes: Record<string, any>;
}

// Demographic change interface for audit trail
export interface DemographicChange {
  field: string;
  old_value: any;
  new_value: any;
  changed_by: string;
  timestamp: Date;
  reason?: string;
}

// Main Demographic Snapshot interface
export interface IDemographicSnapshot extends Document {
  survey_id: string;
  company_id: string;
  version: number;
  timestamp: Date;
  demographics: DemographicData[];
  changes: DemographicChange[];
  created_by: string;
  reason: string;
  is_active: boolean;
  metadata: {
    total_users: number;
    departments_count: number;
    roles_distribution: Record<string, number>;
    tenure_distribution: Record<string, number>;
  };
  created_at: Date;
  updated_at: Date;

  // Instance methods
  compareWith(otherSnapshot: IDemographicSnapshot): DemographicChange[];
  getUserDemographics(userId: string): DemographicData | null;
  getDepartmentUsers(department: string): DemographicData[];
  getRoleUsers(role: string): DemographicData[];
}

// Demographic data schema
const DemographicDataSchema = new Schema(
  {
    user_id: { type: String, required: true },
    department: { type: String, required: true },
    role: { type: String, required: true },
    tenure: { type: String, required: true },
    location: { type: String },
    team: { type: String },
    level: { type: String },
    custom_attributes: { type: Schema.Types.Mixed, default: {} },
  },
  { _id: false }
);

// Demographic change schema
const DemographicChangeSchema = new Schema(
  {
    field: { type: String, required: true },
    old_value: { type: Schema.Types.Mixed },
    new_value: { type: Schema.Types.Mixed },
    changed_by: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    reason: { type: String },
  },
  { _id: false }
);

// Metadata schema
const MetadataSchema = new Schema(
  {
    total_users: { type: Number, required: true },
    departments_count: { type: Number, required: true },
    roles_distribution: { type: Schema.Types.Mixed, default: {} },
    tenure_distribution: { type: Schema.Types.Mixed, default: {} },
  },
  { _id: false }
);

// Main Demographic Snapshot schema
const DemographicSnapshotSchema: Schema = new Schema(
  {
    survey_id: {
      type: String,
      required: [true, 'Survey ID is required'],
      trim: true,
    },
    company_id: {
      type: String,
      required: [true, 'Company ID is required'],
      trim: true,
    },
    version: {
      type: Number,
      required: [true, 'Version is required'],
      min: [1, 'Version must be at least 1'],
    },
    timestamp: {
      type: Date,
      required: [true, 'Timestamp is required'],
      default: Date.now,
    },
    demographics: {
      type: [DemographicDataSchema],
      required: true,
      validate: {
        validator: function (demographics: DemographicData[]) {
          return demographics.length > 0;
        },
        message: 'Demographics array cannot be empty',
      },
    },
    changes: [DemographicChangeSchema],
    created_by: {
      type: String,
      required: [true, 'Creator ID is required'],
      trim: true,
    },
    reason: {
      type: String,
      required: [true, 'Reason is required'],
      trim: true,
      maxlength: [500, 'Reason cannot exceed 500 characters'],
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    metadata: {
      type: MetadataSchema,
      required: true,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

// Indexes for performance
DemographicSnapshotSchema.index({ survey_id: 1, version: 1 }, { unique: true });
DemographicSnapshotSchema.index({ company_id: 1, timestamp: -1 });
DemographicSnapshotSchema.index({ survey_id: 1, is_active: 1 });
DemographicSnapshotSchema.index({ created_by: 1 });
DemographicSnapshotSchema.index({ 'demographics.user_id': 1 });
DemographicSnapshotSchema.index({ 'demographics.department': 1 });
DemographicSnapshotSchema.index({ 'demographics.role': 1 });

// Instance methods
DemographicSnapshotSchema.methods.compareWith = function (
  otherSnapshot: IDemographicSnapshot
): DemographicChange[] {
  const changes: DemographicChange[] = [];
  const thisUserMap = new Map(
    this.demographics.map((d: DemographicData) => [d.user_id, d])
  );
  const otherUserMap = new Map(
    otherSnapshot.demographics.map((d: DemographicData) => [d.user_id, d])
  );

  // Check for changes in existing users
  for (const [userId, thisData] of thisUserMap) {
    const otherData = otherUserMap.get(userId);
    if (otherData) {
      // Compare each field
      const fields = [
        'department',
        'role',
        'tenure',
        'location',
        'team',
        'level',
      ];
      for (const field of fields) {
        if (
          thisData[field as keyof DemographicData] !==
          otherData[field as keyof DemographicData]
        ) {
          changes.push({
            field: `${userId}.${field}`,
            old_value: otherData[field as keyof DemographicData],
            new_value: thisData[field as keyof DemographicData],
            changed_by: this.created_by,
            timestamp: this.timestamp,
            reason: `Field ${field} changed for user ${userId}`,
          });
        }
      }
    } else {
      // User added
      changes.push({
        field: `user.${userId}`,
        old_value: null,
        new_value: thisData,
        changed_by: this.created_by,
        timestamp: this.timestamp,
        reason: `User ${userId} added`,
      });
    }
  }

  // Check for removed users
  for (const [userId, otherData] of otherUserMap) {
    if (!thisUserMap.has(userId)) {
      changes.push({
        field: `user.${userId}`,
        old_value: otherData,
        new_value: null,
        changed_by: this.created_by,
        timestamp: this.timestamp,
        reason: `User ${userId} removed`,
      });
    }
  }

  return changes;
};

DemographicSnapshotSchema.methods.getUserDemographics = function (
  userId: string
): DemographicData | null {
  return (
    this.demographics.find((d: DemographicData) => d.user_id === userId) || null
  );
};

DemographicSnapshotSchema.methods.getDepartmentUsers = function (
  department: string
): DemographicData[] {
  return this.demographics.filter(
    (d: DemographicData) => d.department === department
  );
};

DemographicSnapshotSchema.methods.getRoleUsers = function (
  role: string
): DemographicData[] {
  return this.demographics.filter((d: DemographicData) => d.role === role);
};

// Static methods
DemographicSnapshotSchema.statics.findBySurvey = function (surveyId: string) {
  return this.find({ survey_id: surveyId, is_active: true }).sort({
    version: -1,
  });
};

DemographicSnapshotSchema.statics.findLatestBySurvey = function (
  surveyId: string
) {
  return this.findOne({ survey_id: surveyId, is_active: true }).sort({
    version: -1,
  });
};

DemographicSnapshotSchema.statics.findByCompany = function (companyId: string) {
  return this.find({ company_id: companyId, is_active: true }).sort({
    timestamp: -1,
  });
};

DemographicSnapshotSchema.statics.findByVersion = function (
  surveyId: string,
  version: number
) {
  return this.findOne({ survey_id: surveyId, version, is_active: true });
};

DemographicSnapshotSchema.statics.getNextVersion = async function (
  surveyId: string
): Promise<number> {
  const latest = await this.findLatestBySurvey(surveyId);
  return latest ? latest.version + 1 : 1;
};

// Pre-save middleware to calculate metadata
DemographicSnapshotSchema.pre('save', function (next) {
  if (this.isModified('demographics') || this.isNew) {
    const demographics = this.demographics as DemographicData[];

    // Calculate metadata
    this.metadata = {
      total_users: demographics.length,
      departments_count: new Set(demographics.map((d) => d.department)).size,
      roles_distribution: demographics.reduce(
        (acc, d) => {
          acc[d.role] = (acc[d.role] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      ),
      tenure_distribution: demographics.reduce(
        (acc, d) => {
          acc[d.tenure] = (acc[d.tenure] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      ),
    };
  }
  next();
});

export default mongoose.models.DemographicSnapshot ||
  mongoose.model<IDemographicSnapshot>(
    'DemographicSnapshot',
    DemographicSnapshotSchema
  );
