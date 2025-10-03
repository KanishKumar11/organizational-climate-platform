import mongoose, { Schema, Document } from 'mongoose';

/**
 * CLIMA-006: Autosave & Draft Recovery
 * Stores draft surveys with autosave support and session recovery
 */

// Step-specific data types
export interface Step1Data {
  survey_type?: 'climate' | 'microclimate' | 'culture' | 'pulse';
  title?: string;
  description?: string;
  company_id?: mongoose.Types.ObjectId;
  language?: 'es' | 'en';
}

export interface Step2Data {
  questions?: Array<{
    id: string;
    type: string;
    text: { en: string; es: string };
    options?: { en: string[]; es: string[] };
    required: boolean;
    order: number;
    library_id?: mongoose.Types.ObjectId;
  }>;
  question_ids?: mongoose.Types.ObjectId[]; // From library
}

export interface Step3Data {
  targeting_type?: 'master_data' | 'csv_upload' | 'manual';
  department_ids?: mongoose.Types.ObjectId[];
  target_user_ids?: mongoose.Types.ObjectId[];
  demographic_filters?: {
    locations?: string[];
    roles?: string[];
    tenure_min?: number;
    tenure_max?: number;
  };
  csv_data?: {
    filename?: string;
    uploaded_at?: Date;
    total_rows?: number;
    valid_rows?: number;
    column_mapping?: Record<string, string>;
  };
  audience_preview?: {
    total_count: number;
    by_department: Record<string, number>;
    by_location: Record<string, number>;
  };
}

export interface Step4Data {
  schedule?: {
    start_date?: Date;
    end_date?: Date;
    timezone?: string;
    send_reminders?: boolean;
    reminder_schedule?: string[];
  };
  distribution?: {
    method?: 'qr' | 'url' | 'both';
    access_type?: 'tokenized' | 'open' | 'hybrid';
    generate_qr?: boolean;
    qr_format?: 'png' | 'svg' | 'pdf';
  };
}

export interface ISurveyDraft extends Document {
  _id: string;
  user_id: mongoose.Types.ObjectId;
  company_id: mongoose.Types.ObjectId;
  session_id: string; // Browser session identifier

  // Structured step data
  step1_data?: Step1Data;
  step2_data?: Step2Data;
  step3_data?: Step3Data;
  step4_data?: Step4Data;

  // Autosave metadata
  current_step: number; // Current step in creation wizard (1-4)
  last_edited_field?: string;
  auto_save_count: number;

  // Optimistic concurrency control
  version: number;
  last_autosave_at?: Date;

  // Session tracking
  expires_at: Date; // Auto-delete after expiry
  is_recovered: boolean; // Flag when user recovers the draft

  created_at: Date;
  updated_at: Date;

  // Methods
  isRecent(): boolean;
  toSurvey(): any;
}

const SurveyDraftSchema = new Schema<ISurveyDraft>(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User',
      index: true,
    },
    company_id: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Company',
      index: true,
    },
    session_id: {
      type: String,
      required: true,
      index: true,
    },

    // Structured step data
    step1_data: {
      survey_type: {
        type: String,
        enum: ['climate', 'microclimate', 'culture', 'pulse'],
      },
      title: { type: String, trim: true, maxlength: 150 },
      description: { type: String, trim: true, maxlength: 500 },
      company_id: { type: Schema.Types.ObjectId, ref: 'Company' },
      language: {
        type: String,
        enum: ['es', 'en'],
        default: 'es',
      },
    },

    step2_data: {
      questions: [
        {
          id: String,
          type: String,
          text: {
            en: String,
            es: String,
          },
          options: {
            en: [String],
            es: [String],
          },
          required: { type: Boolean, default: false },
          order: Number,
          library_id: { type: Schema.Types.ObjectId, ref: 'QuestionLibrary' },
        },
      ],
      question_ids: [{ type: Schema.Types.ObjectId, ref: 'QuestionLibrary' }],
    },

    step3_data: {
      targeting_type: {
        type: String,
        enum: ['master_data', 'csv_upload', 'manual'],
      },
      department_ids: [{ type: Schema.Types.ObjectId, ref: 'Department' }],
      target_user_ids: [{ type: Schema.Types.ObjectId, ref: 'User' }],
      demographic_filters: {
        locations: [String],
        roles: [String],
        tenure_min: Number,
        tenure_max: Number,
      },
      csv_data: {
        filename: String,
        uploaded_at: Date,
        total_rows: Number,
        valid_rows: Number,
        column_mapping: { type: Map, of: String },
      },
      audience_preview: {
        total_count: Number,
        by_department: { type: Map, of: Number },
        by_location: { type: Map, of: Number },
      },
    },

    step4_data: {
      schedule: {
        start_date: Date,
        end_date: Date,
        timezone: { type: String, default: 'America/Santiago' },
        send_reminders: { type: Boolean, default: false },
        reminder_schedule: [String],
      },
      distribution: {
        method: {
          type: String,
          enum: ['qr', 'url', 'both'],
          default: 'both',
        },
        access_type: {
          type: String,
          enum: ['tokenized', 'open', 'hybrid'],
          default: 'tokenized',
        },
        generate_qr: { type: Boolean, default: true },
        qr_format: {
          type: String,
          enum: ['png', 'svg', 'pdf'],
          default: 'png',
        },
      },
    },

    // Metadata
    current_step: {
      type: Number,
      default: 1,
      min: 1,
      max: 4,
    },
    last_edited_field: { type: String },
    auto_save_count: {
      type: Number,
      default: 0,
    },

    version: {
      type: Number,
      default: 1,
    },

    last_autosave_at: { type: Date },

    // Session tracking
    expires_at: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      index: true,
    },
    is_recovered: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

// Indexes
SurveyDraftSchema.index({ user_id: 1, session_id: 1 });
SurveyDraftSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 }); // TTL index for auto-deletion
SurveyDraftSchema.index({ user_id: 1, company_id: 1, updated_at: -1 });
SurveyDraftSchema.index({ user_id: 1, is_recovered: 1, expires_at: 1 }); // For draft recovery queries

// Pre-save hook to increment version
SurveyDraftSchema.pre('save', function (next) {
  if (!this.isNew && this.isModified()) {
    this.version += 1;
    this.last_autosave_at = new Date();
  }
  next();
});

// Method to check if draft is recent (within last hour)
SurveyDraftSchema.methods.isRecent = function (): boolean {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  return this.updated_at > oneHourAgo;
};

// Convert draft to survey object for final creation
SurveyDraftSchema.methods.toSurvey = function (): any {
  const { step1_data, step2_data, step3_data, step4_data } = this;

  return {
    // From step 1
    type: step1_data?.survey_type,
    title: step1_data?.title,
    description: step1_data?.description,
    company_id: step1_data?.company_id || this.company_id,
    language: step1_data?.language,

    // From step 2
    questions: step2_data?.questions || [],

    // From step 3
    targeting: {
      type: step3_data?.targeting_type,
      department_ids: step3_data?.department_ids,
      target_user_ids: step3_data?.target_user_ids,
      demographic_filters: step3_data?.demographic_filters,
    },

    // From step 4
    schedule: step4_data?.schedule,
    distribution: step4_data?.distribution,

    // Metadata
    created_by: this.user_id,
    status: 'draft',
  };
};

export default mongoose.models.SurveyDraft ||
  mongoose.model<ISurveyDraft>('SurveyDraft', SurveyDraftSchema);
