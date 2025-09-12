import mongoose, { Document, Schema } from 'mongoose';

// Question types
export type QuestionType =
  | 'likert'
  | 'multiple_choice'
  | 'ranking'
  | 'open_ended'
  | 'yes_no'
  | 'rating';

// Conditional logic interface
export interface ConditionalLogic {
  condition_question_id: string;
  condition_operator:
    | 'equals'
    | 'not_equals'
    | 'greater_than'
    | 'less_than'
    | 'contains';
  condition_value: string | number;
  action: 'show' | 'hide' | 'skip_to';
  target_question_id?: string;
}

// Question interface
export interface IQuestion {
  id: string;
  text: string;
  type: QuestionType;
  options?: string[];
  scale_min?: number;
  scale_max?: number;
  scale_labels?: { min: string; max: string };
  required: boolean;
  conditional_logic?: ConditionalLogic;
  order: number;
  category?: string;
}

// Demographic configuration
export interface DemographicConfig {
  field: string;
  label: string;
  type: 'select' | 'text' | 'number';
  options?: string[];
  required: boolean;
}

// Survey settings
export interface SurveySettings {
  anonymous: boolean;
  allow_partial_responses: boolean;
  randomize_questions: boolean;
  show_progress: boolean;
  auto_save: boolean;
  time_limit_minutes?: number;
  response_limit?: number;
  notification_settings: {
    send_invitations: boolean;
    send_reminders: boolean;
    reminder_frequency_days: number;
  };
}

// Main Survey interface
export interface ISurvey extends Document {
  title: string;
  description?: string;
  type:
    | 'general_climate'
    | 'microclimate'
    | 'organizational_culture'
    | 'custom';
  company_id: string;
  created_by: string;
  department_ids?: string[];
  questions: IQuestion[];
  demographics: DemographicConfig[];
  settings: SurveySettings;
  start_date: Date;
  end_date: Date;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'archived';
  response_count: number;
  target_audience_count?: number;
  template_id?: string;
  version: number;
  created_at: Date;
  updated_at: Date;
  // Instance methods
  canAcceptResponses(): boolean;
}

// Question schema
const QuestionSchema = new Schema(
  {
    id: { type: String, required: true },
    text: { type: String, required: true, maxlength: 500 },
    type: {
      type: String,
      enum: [
        'likert',
        'multiple_choice',
        'ranking',
        'open_ended',
        'yes_no',
        'rating',
      ],
      required: true,
    },
    options: [{ type: String }],
    scale_min: { type: Number, min: 1, max: 10 },
    scale_max: { type: Number, min: 1, max: 10 },
    scale_labels: {
      min: { type: String },
      max: { type: String },
    },
    required: { type: Boolean, default: true },
    conditional_logic: {
      condition_question_id: { type: String },
      condition_operator: {
        type: String,
        enum: ['equals', 'not_equals', 'greater_than', 'less_than', 'contains'],
      },
      condition_value: { type: Schema.Types.Mixed },
      action: {
        type: String,
        enum: ['show', 'hide', 'skip_to'],
      },
      target_question_id: { type: String },
    },
    order: { type: Number, required: true },
    category: { type: String },
  },
  { _id: false }
);

// Demographic configuration schema
const DemographicConfigSchema = new Schema(
  {
    field: { type: String, required: true },
    label: { type: String, required: true },
    type: {
      type: String,
      enum: ['select', 'text', 'number'],
      required: true,
    },
    options: [{ type: String }],
    required: { type: Boolean, default: false },
  },
  { _id: false }
);

// Survey settings schema
const SurveySettingsSchema = new Schema(
  {
    anonymous: { type: Boolean, default: false },
    allow_partial_responses: { type: Boolean, default: true },
    randomize_questions: { type: Boolean, default: false },
    show_progress: { type: Boolean, default: true },
    auto_save: { type: Boolean, default: true },
    time_limit_minutes: { type: Number, min: 1 },
    response_limit: { type: Number, min: 1 },
    notification_settings: {
      send_invitations: { type: Boolean, default: true },
      send_reminders: { type: Boolean, default: true },
      reminder_frequency_days: { type: Number, default: 3, min: 1, max: 30 },
    },
  },
  { _id: false }
);

// Main Survey schema
const SurveySchema: Schema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Survey title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    type: {
      type: String,
      enum: [
        'general_climate',
        'microclimate',
        'organizational_culture',
        'custom',
      ],
      required: [true, 'Survey type is required'],
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
    department_ids: [{ type: String }],
    questions: {
      type: [QuestionSchema],
      validate: {
        validator: function (questions: IQuestion[]) {
          return questions.length > 0;
        },
        message: 'Survey must have at least one question',
      },
    },
    demographics: [DemographicConfigSchema],
    settings: {
      type: SurveySettingsSchema,
      default: () => ({}),
    },
    start_date: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    end_date: {
      type: Date,
      required: [true, 'End date is required'],
      validate: {
        validator: function (endDate: Date) {
          return endDate > this.start_date;
        },
        message: 'End date must be after start date',
      },
    },
    status: {
      type: String,
      enum: ['draft', 'active', 'paused', 'completed', 'archived'],
      default: 'draft',
    },
    response_count: {
      type: Number,
      default: 0,
      min: 0,
    },
    target_audience_count: {
      type: Number,
      min: 0,
    },
    template_id: {
      type: String,
      trim: true,
    },
    version: {
      type: Number,
      default: 1,
      min: 1,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

// Indexes
SurveySchema.index({ company_id: 1, status: 1 });
SurveySchema.index({ created_by: 1 });
SurveySchema.index({ type: 1 });
SurveySchema.index({ start_date: 1, end_date: 1 });
SurveySchema.index({ department_ids: 1 });

// Static methods
SurveySchema.statics.findByCompany = function (companyId: string) {
  return this.find({ company_id: companyId });
};

SurveySchema.statics.findActive = function (companyId?: string) {
  const query: any = { status: 'active' };
  if (companyId) query.company_id = companyId;
  return this.find(query);
};

SurveySchema.statics.findByType = function (type: string, companyId?: string) {
  const query: any = { type };
  if (companyId) query.company_id = companyId;
  return this.find(query);
};

SurveySchema.statics.findByCreator = function (creatorId: string) {
  return this.find({ created_by: creatorId });
};

// Instance methods
SurveySchema.methods.isActive = function (): boolean {
  const now = new Date();
  return (
    this.status === 'active' && this.start_date <= now && this.end_date >= now
  );
};

SurveySchema.methods.canAcceptResponses = function (): boolean {
  return (
    this.isActive() &&
    (!this.settings.response_limit ||
      this.response_count < this.settings.response_limit)
  );
};

SurveySchema.methods.getQuestionById = function (
  questionId: string
): IQuestion | undefined {
  return this.questions.find((q: IQuestion) => q.id === questionId);
};

SurveySchema.methods.addQuestion = function (
  question: Omit<IQuestion, 'id' | 'order'>
): void {
  const newQuestion: IQuestion = {
    ...question,
    id: new mongoose.Types.ObjectId().toString(),
    order: this.questions.length,
  };
  this.questions.push(newQuestion);
};

SurveySchema.methods.removeQuestion = function (questionId: string): boolean {
  const index = this.questions.findIndex((q: IQuestion) => q.id === questionId);
  if (index > -1) {
    this.questions.splice(index, 1);
    // Reorder remaining questions
    this.questions.forEach((q: IQuestion, i: number) => {
      q.order = i;
    });
    return true;
  }
  return false;
};

const Survey = (mongoose.models.Survey ||
  mongoose.model<ISurvey>('Survey', SurveySchema)) as mongoose.Model<ISurvey>;

export default Survey;
export { Survey };
