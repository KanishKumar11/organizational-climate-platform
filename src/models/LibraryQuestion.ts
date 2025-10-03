import mongoose, { Schema, Document } from 'mongoose';

/**
 * CLIMA-002: Question Library - Library Question Model
 * Reusable questions with bilingual support, categories, tags, and versioning
 */

export interface ILibraryQuestion extends Document {
  _id: string;
  category_id: string;
  text: {
    en: string;
    es: string;
  };
  description?: {
    en: string;
    es: string;
  };
  type:
    | 'likert'
    | 'multiple_choice'
    | 'ranking'
    | 'open_ended'
    | 'yes_no'
    | 'rating'
    | 'emoji_scale';

  // Type-specific configuration
  options?: {
    en: string[];
    es: string[];
  };
  scale_min?: number;
  scale_max?: number;
  scale_labels?: {
    en: { [key: number]: string };
    es: { [key: number]: string };
  };
  emoji_options?: Array<{
    value: number;
    emoji: string;
    label_en: string;
    label_es: string;
  }>;
  binary_comment_config?: {
    enabled: boolean;
    label?: { en: string; es: string };
    placeholder?: { en: string; es: string };
    max_length?: number;
    required?: boolean;
    min_length?: number;
  };

  // Metadata
  tags: string[]; // For filtering and search
  keywords: {
    en: string[];
    es: string[];
  };
  difficulty_level?: 'easy' | 'medium' | 'hard';
  estimated_time_seconds?: number;

  // Usage tracking
  usage_count: number;
  last_used_at?: Date;

  // Versioning
  version: number;
  previous_version_id?: string;
  is_latest: boolean;

  // Scope
  is_global: boolean; // System-wide or company-specific
  company_id?: string;
  created_by: string;

  // Status
  is_active: boolean;
  is_approved: boolean; // For quality control
  approved_by?: string;
  approved_at?: Date;

  created_at: Date;
  updated_at: Date;
}

const LibraryQuestionSchema = new Schema<ILibraryQuestion>(
  {
    category_id: {
      type: String,
      required: true,
      ref: 'QuestionCategory',
    },
    text: {
      en: { type: String, required: true, trim: true },
      es: { type: String, required: true, trim: true },
    },
    description: {
      en: { type: String, trim: true },
      es: { type: String, trim: true },
    },
    type: {
      type: String,
      required: true,
      enum: [
        'likert',
        'multiple_choice',
        'ranking',
        'open_ended',
        'yes_no',
        'rating',
        'emoji_scale',
      ],
    },

    // Type-specific fields
    options: {
      en: [{ type: String }],
      es: [{ type: String }],
    },
    scale_min: { type: Number },
    scale_max: { type: Number },
    scale_labels: {
      en: { type: Map, of: String },
      es: { type: Map, of: String },
    },
    emoji_options: [
      {
        value: Number,
        emoji: String,
        label_en: String,
        label_es: String,
      },
    ],
    binary_comment_config: {
      enabled: { type: Boolean, default: false },
      label: {
        en: { type: String },
        es: { type: String },
      },
      placeholder: {
        en: { type: String },
        es: { type: String },
      },
      max_length: { type: Number, default: 500 },
      required: { type: Boolean, default: false },
      min_length: { type: Number, default: 0 },
    },

    // Metadata
    tags: [{ type: String, trim: true, lowercase: true }],
    keywords: {
      en: [{ type: String, trim: true, lowercase: true }],
      es: [{ type: String, trim: true, lowercase: true }],
    },
    difficulty_level: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
    },
    estimated_time_seconds: {
      type: Number,
      default: 30,
    },

    // Usage tracking
    usage_count: {
      type: Number,
      default: 0,
    },
    last_used_at: { type: Date },

    // Versioning
    version: {
      type: Number,
      default: 1,
    },
    previous_version_id: {
      type: String,
      ref: 'LibraryQuestion',
    },
    is_latest: {
      type: Boolean,
      default: true,
    },

    // Scope
    is_global: {
      type: Boolean,
      default: false,
    },
    company_id: {
      type: String,
      ref: 'Company',
    },
    created_by: {
      type: String,
      required: true,
      ref: 'User',
    },

    // Status
    is_active: {
      type: Boolean,
      default: true,
    },
    is_approved: {
      type: Boolean,
      default: false,
    },
    approved_by: {
      type: String,
      ref: 'User',
    },
    approved_at: { type: Date },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

// Indexes for performance
LibraryQuestionSchema.index({ category_id: 1, is_active: 1, is_latest: 1 });
LibraryQuestionSchema.index({ company_id: 1, is_global: 1 });
LibraryQuestionSchema.index({ tags: 1 });
LibraryQuestionSchema.index({
  'text.en': 'text',
  'text.es': 'text',
  'keywords.en': 'text',
  'keywords.es': 'text',
});
LibraryQuestionSchema.index({ usage_count: -1, last_used_at: -1 });
LibraryQuestionSchema.index({ is_approved: 1, is_active: 1 });

// Prevent duplicates (same text in same category for same company)
LibraryQuestionSchema.index(
  { category_id: 1, 'text.en': 1, company_id: 1 },
  { unique: true, partialFilterExpression: { is_latest: true } }
);

export default mongoose.models.LibraryQuestion ||
  mongoose.model<ILibraryQuestion>('LibraryQuestion', LibraryQuestionSchema);
