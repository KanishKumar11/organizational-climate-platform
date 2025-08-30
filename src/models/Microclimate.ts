import mongoose, { Document, Schema } from 'mongoose';

// Microclimate targeting interface
export interface MicroclimateTargeting {
  department_ids: string[];
  role_filters?: string[];
  tenure_filters?: string[];
  custom_filters?: Record<string, any>;
  include_managers: boolean;
  max_participants?: number;
}

// Microclimate scheduling interface
export interface MicroclimateScheduling {
  start_time: Date;
  duration_minutes: number;
  timezone: string;
  auto_close: boolean;
  reminder_settings: {
    send_reminders: boolean;
    reminder_minutes_before: number[];
  };
}

// Real-time settings interface
export interface RealTimeSettings {
  show_live_results: boolean;
  anonymous_responses: boolean;
  allow_comments: boolean;
  word_cloud_enabled: boolean;
  sentiment_analysis_enabled: boolean;
  participation_threshold: number; // Minimum responses before showing results
}

// Microclimate template interface
export interface MicroclimateTemplate {
  id: string;
  name: string;
  description: string;
  category: 'pulse_check' | 'team_mood' | 'feedback_session' | 'custom';
  questions: Array<{
    id: string;
    text: string;
    type: 'likert' | 'multiple_choice' | 'open_ended' | 'emoji_rating';
    options?: string[];
    required: boolean;
  }>;
  default_duration_minutes: number;
  suggested_frequency: 'daily' | 'weekly' | 'bi_weekly' | 'monthly';
}

// Main Microclimate interface
export interface IMicroclimate extends Document {
  title: string;
  description?: string;
  company_id: string;
  created_by: string;
  targeting: MicroclimateTargeting;
  scheduling: MicroclimateScheduling;
  real_time_settings: RealTimeSettings;
  template_id?: string;
  questions: Array<{
    id: string;
    text: string;
    type: 'likert' | 'multiple_choice' | 'open_ended' | 'emoji_rating';
    options?: string[];
    required: boolean;
    order: number;
  }>;
  status: 'draft' | 'scheduled' | 'active' | 'completed' | 'cancelled';
  response_count: number;
  target_participant_count: number;
  participation_rate: number;
  live_results: {
    sentiment_score: number;
    engagement_level: 'low' | 'medium' | 'high';
    top_themes: string[];
    word_cloud_data: Array<{ text: string; value: number }>;
    response_distribution: Record<string, number>;
  };
  ai_insights: Array<{
    type: 'pattern' | 'alert' | 'recommendation';
    message: string;
    confidence: number;
    timestamp: Date;
  }>;
  created_at: Date;
  updated_at: Date;

  // Instance methods
  isActive(): boolean;
  canAcceptResponses(): boolean;
  calculateParticipationRate(): number;
  generateInviteList(): Promise<string[]>;
}

// Microclimate targeting schema
const MicroclimateTargetingSchema = new Schema(
  {
    department_ids: {
      type: [String],
      required: [true, 'At least one department must be targeted'],
      validate: {
        validator: function (departments: string[]) {
          return departments.length > 0;
        },
        message: 'At least one department must be selected',
      },
    },
    role_filters: [String],
    tenure_filters: [String],
    custom_filters: { type: Schema.Types.Mixed },
    include_managers: { type: Boolean, default: true },
    max_participants: { type: Number, min: 1 },
  },
  { _id: false }
);

// Microclimate scheduling schema
const MicroclimateSchedulingSchema = new Schema(
  {
    start_time: {
      type: Date,
      required: [true, 'Start time is required'],
    },
    duration_minutes: {
      type: Number,
      required: [true, 'Duration is required'],
      min: [5, 'Duration must be at least 5 minutes'],
      max: [480, 'Duration cannot exceed 8 hours'],
      default: 30,
    },
    timezone: {
      type: String,
      required: [true, 'Timezone is required'],
      default: 'UTC',
    },
    auto_close: { type: Boolean, default: true },
    reminder_settings: {
      send_reminders: { type: Boolean, default: true },
      reminder_minutes_before: {
        type: [Number],
        default: [60, 15], // 1 hour and 15 minutes before
      },
    },
  },
  { _id: false }
);

// Real-time settings schema
const RealTimeSettingsSchema = new Schema(
  {
    show_live_results: { type: Boolean, default: true },
    anonymous_responses: { type: Boolean, default: true },
    allow_comments: { type: Boolean, default: true },
    word_cloud_enabled: { type: Boolean, default: true },
    sentiment_analysis_enabled: { type: Boolean, default: true },
    participation_threshold: { type: Number, default: 3, min: 1 },
  },
  { _id: false }
);

// Question schema for microclimates
const MicroclimateQuestionSchema = new Schema(
  {
    id: { type: String, required: true },
    text: { type: String, required: true, maxlength: 300 },
    type: {
      type: String,
      enum: ['likert', 'multiple_choice', 'open_ended', 'emoji_rating'],
      required: true,
    },
    options: [String],
    required: { type: Boolean, default: true },
    order: { type: Number, required: true },
  },
  { _id: false }
);

// Live results schema
const LiveResultsSchema = new Schema(
  {
    sentiment_score: { type: Number, default: 0, min: -1, max: 1 },
    engagement_level: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    top_themes: [String],
    word_cloud_data: [
      {
        text: String,
        value: Number,
      },
    ],
    response_distribution: { type: Schema.Types.Mixed, default: {} },
  },
  { _id: false }
);

// AI insights schema
const AIInsightSchema = new Schema(
  {
    type: {
      type: String,
      enum: ['pattern', 'alert', 'recommendation'],
      required: true,
    },
    message: { type: String, required: true },
    confidence: { type: Number, min: 0, max: 1, required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

// Main Microclimate schema
const MicroclimateSchema: Schema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Microclimate title is required'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    company_id: {
      type: String,
      required: [true, 'Company ID is required'],
      trim: true,
    },
    created_by: {
      type: String,
      required: [true, 'Creator ID is required'],
      trim: true,
    },
    targeting: {
      type: MicroclimateTargetingSchema,
      required: true,
    },
    scheduling: {
      type: MicroclimateSchedulingSchema,
      required: true,
    },
    real_time_settings: {
      type: RealTimeSettingsSchema,
      default: () => ({}),
    },
    template_id: {
      type: String,
      trim: true,
    },
    questions: {
      type: [MicroclimateQuestionSchema],
      validate: {
        validator: function (questions: any[]) {
          return questions.length > 0 && questions.length <= 10;
        },
        message: 'Microclimate must have 1-10 questions',
      },
    },
    status: {
      type: String,
      enum: ['draft', 'scheduled', 'active', 'completed', 'cancelled'],
      default: 'draft',
    },
    response_count: {
      type: Number,
      default: 0,
      min: 0,
    },
    target_participant_count: {
      type: Number,
      default: 0,
      min: 0,
    },
    participation_rate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    live_results: {
      type: LiveResultsSchema,
      default: () => ({}),
    },
    ai_insights: [AIInsightSchema],
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

// Indexes
MicroclimateSchema.index({ company_id: 1, status: 1 });
MicroclimateSchema.index({ created_by: 1 });
MicroclimateSchema.index({ 'targeting.department_ids': 1 });
MicroclimateSchema.index({ 'scheduling.start_time': 1 });
MicroclimateSchema.index({ status: 1, 'scheduling.start_time': 1 });

// Instance methods
MicroclimateSchema.methods.isActive = function (): boolean {
  const now = new Date();
  const endTime = new Date(
    this.scheduling.start_time.getTime() +
      this.scheduling.duration_minutes * 60 * 1000
  );
  return (
    this.status === 'active' &&
    now >= this.scheduling.start_time &&
    now <= endTime
  );
};

MicroclimateSchema.methods.canAcceptResponses = function (): boolean {
  return this.isActive() && this.status !== 'completed';
};

MicroclimateSchema.methods.calculateParticipationRate = function (): number {
  if (this.target_participant_count === 0) return 0;
  return Math.round(
    (this.response_count / this.target_participant_count) * 100
  );
};

MicroclimateSchema.methods.generateInviteList = async function (): Promise<
  string[]
> {
  const User = mongoose.model('User');

  // Build query based on targeting criteria
  const query: any = {
    company_id: this.company_id,
    is_active: true,
    department_id: { $in: this.targeting.department_ids },
  };

  // Add role filters if specified
  if (this.targeting.role_filters && this.targeting.role_filters.length > 0) {
    query.role = { $in: this.targeting.role_filters };
  }

  // Exclude managers if specified
  if (!this.targeting.include_managers) {
    query.role = { $nin: ['company_admin', 'leader', 'supervisor'] };
  }

  const users = await User.find(query).select('_id email').lean();
  let userIds = users.map((user: any) => user._id.toString());

  // Apply max participants limit if specified
  if (
    this.targeting.max_participants &&
    userIds.length > this.targeting.max_participants
  ) {
    // Randomly select participants
    userIds = userIds
      .sort(() => 0.5 - Math.random())
      .slice(0, this.targeting.max_participants);
  }

  return userIds;
};

// Static methods
MicroclimateSchema.statics.findByCompany = function (companyId: string) {
  return this.find({ company_id: companyId });
};

MicroclimateSchema.statics.findActive = function (companyId?: string) {
  const query: any = { status: 'active' };
  if (companyId) query.company_id = companyId;
  return this.find(query);
};

MicroclimateSchema.statics.findScheduled = function (companyId?: string) {
  const query: any = { status: 'scheduled' };
  if (companyId) query.company_id = companyId;
  return this.find(query);
};

MicroclimateSchema.statics.findByCreator = function (creatorId: string) {
  return this.find({ created_by: creatorId });
};

MicroclimateSchema.statics.findByDepartment = function (departmentId: string) {
  return this.find({ 'targeting.department_ids': departmentId });
};

// Pre-save middleware to update participation rate
MicroclimateSchema.pre('save', function (next) {
  (this as unknown as IMicroclimate).participation_rate = (
    this as unknown as IMicroclimate
  ).calculateParticipationRate();
  next();
});

const Microclimate = (mongoose.models.Microclimate ||
  mongoose.model<IMicroclimate>(
    'Microclimate',
    MicroclimateSchema
  )) as mongoose.Model<IMicroclimate>;

export default Microclimate;
export { Microclimate };
