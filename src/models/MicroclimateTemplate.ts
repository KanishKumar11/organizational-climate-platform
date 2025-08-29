import mongoose, { Document, Schema } from 'mongoose';

// Template question interface
export interface TemplateQuestion {
  id: string;
  text: string;
  type: 'likert' | 'multiple_choice' | 'open_ended' | 'emoji_rating';
  options?: string[];
  required: boolean;
  order: number;
  category?: string;
}

// Template settings interface
export interface TemplateSettings {
  default_duration_minutes: number;
  suggested_frequency: 'daily' | 'weekly' | 'bi_weekly' | 'monthly';
  max_participants?: number;
  anonymous_by_default: boolean;
  auto_close: boolean;
  show_live_results: boolean;
}

// Main MicroclimateTemplate interface
export interface IMicroclimateTemplate extends Document {
  name: string;
  description: string;
  category:
    | 'pulse_check'
    | 'team_mood'
    | 'feedback_session'
    | 'project_retrospective'
    | 'custom';
  company_id?: string; // Optional - null for system templates
  created_by?: string; // Optional - null for system templates
  is_system_template: boolean;
  questions: TemplateQuestion[];
  settings: TemplateSettings;
  usage_count: number;
  is_active: boolean;
  tags: string[];
  created_at: Date;
  updated_at: Date;

  // Instance methods
  clone(): IMicroclimateTemplate;
  getQuestionCount(): number;
  getEstimatedDuration(): number;
}

// Template question schema
const TemplateQuestionSchema = new Schema(
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
    category: { type: String },
  },
  { _id: false }
);

// Template settings schema
const TemplateSettingsSchema = new Schema(
  {
    default_duration_minutes: {
      type: Number,
      required: true,
      min: 5,
      max: 480,
      default: 30,
    },
    suggested_frequency: {
      type: String,
      enum: ['daily', 'weekly', 'bi_weekly', 'monthly'],
      default: 'weekly',
    },
    max_participants: { type: Number, min: 1 },
    anonymous_by_default: { type: Boolean, default: true },
    auto_close: { type: Boolean, default: true },
    show_live_results: { type: Boolean, default: true },
  },
  { _id: false }
);

// Main MicroclimateTemplate schema
const MicroclimateTemplateSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Template name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Template description is required'],
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    category: {
      type: String,
      enum: [
        'pulse_check',
        'team_mood',
        'feedback_session',
        'project_retrospective',
        'custom',
      ],
      required: [true, 'Category is required'],
    },
    company_id: {
      type: String,
      trim: true,
      // Not required for system templates
    },
    created_by: {
      type: String,
      trim: true,
      // Not required for system templates
    },
    is_system_template: {
      type: Boolean,
      default: false,
    },
    questions: {
      type: [TemplateQuestionSchema],
      validate: {
        validator: function (questions: TemplateQuestion[]) {
          return questions.length > 0 && questions.length <= 10;
        },
        message: 'Template must have 1-10 questions',
      },
    },
    settings: {
      type: TemplateSettingsSchema,
      required: true,
    },
    usage_count: {
      type: Number,
      default: 0,
      min: 0,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    tags: [String],
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

// Indexes
MicroclimateTemplateSchema.index({ category: 1, is_active: 1 });
MicroclimateTemplateSchema.index({ company_id: 1, is_active: 1 });
MicroclimateTemplateSchema.index({ is_system_template: 1, is_active: 1 });
MicroclimateTemplateSchema.index({ created_by: 1 });
MicroclimateTemplateSchema.index({ tags: 1 });
MicroclimateTemplateSchema.index({ usage_count: -1 }); // For popular templates

// Instance methods
MicroclimateTemplateSchema.methods.clone = function (): IMicroclimateTemplate {
  const cloned = new (this.constructor as any)({
    name: `${this.name} (Copy)`,
    description: this.description,
    category: this.category,
    company_id: this.company_id,
    created_by: this.created_by,
    is_system_template: false,
    questions: this.questions.map((q: TemplateQuestion) => ({ ...q })),
    settings: { ...this.settings },
    tags: [...this.tags],
  });
  return cloned;
};

MicroclimateTemplateSchema.methods.getQuestionCount = function (): number {
  return this.questions.length;
};

MicroclimateTemplateSchema.methods.getEstimatedDuration = function (): number {
  // Estimate 1-2 minutes per question based on type
  const baseTime = this.questions.reduce(
    (total: number, question: TemplateQuestion) => {
      switch (question.type) {
        case 'open_ended':
          return total + 2; // 2 minutes for open-ended
        case 'multiple_choice':
        case 'likert':
        case 'emoji_rating':
          return total + 1; // 1 minute for quick responses
        default:
          return total + 1;
      }
    },
    0
  );

  // Add buffer time
  return Math.max(baseTime + 5, this.settings.default_duration_minutes);
};

// Static methods
MicroclimateTemplateSchema.statics.findSystemTemplates = function () {
  return this.find({ is_system_template: true, is_active: true });
};

MicroclimateTemplateSchema.statics.findByCompany = function (
  companyId: string
) {
  return this.find({
    $or: [
      { company_id: companyId, is_active: true },
      { is_system_template: true, is_active: true },
    ],
  });
};

MicroclimateTemplateSchema.statics.findByCategory = function (
  category: string,
  companyId?: string
) {
  const query: any = { category, is_active: true };
  if (companyId) {
    query.$or = [{ company_id: companyId }, { is_system_template: true }];
  } else {
    query.is_system_template = true;
  }
  return this.find(query);
};

MicroclimateTemplateSchema.statics.findPopular = function (
  limit: number = 10,
  companyId?: string
) {
  const query: any = { is_active: true };
  if (companyId) {
    query.$or = [{ company_id: companyId }, { is_system_template: true }];
  } else {
    query.is_system_template = true;
  }
  return this.find(query).sort({ usage_count: -1 }).limit(limit);
};

MicroclimateTemplateSchema.statics.findByCreator = function (
  creatorId: string
) {
  return this.find({ created_by: creatorId, is_active: true });
};

// Pre-save middleware for validation
MicroclimateTemplateSchema.pre('save', function (next) {
  // System templates should not have company_id or created_by
  if (this.is_system_template) {
    this.company_id = undefined;
    this.created_by = undefined;
  } else {
    // Non-system templates should have company_id and created_by
    if (!this.company_id || !this.created_by) {
      return next(
        new Error('Company templates must have company_id and created_by')
      );
    }
  }
  next();
});

export default mongoose.models.MicroclimateTemplate ||
  mongoose.model<IMicroclimateTemplate>(
    'MicroclimateTemplate',
    MicroclimateTemplateSchema
  );
