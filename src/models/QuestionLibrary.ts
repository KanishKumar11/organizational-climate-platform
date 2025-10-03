import mongoose, { Schema, Document } from 'mongoose';

/**
 * QuestionLibrary Model
 * Hierarchical catalog of reusable survey questions with multilingual support
 */

export interface IQuestionLibrary extends Document {
  _id: string;
  company_id: mongoose.Types.ObjectId;
  category_id: mongoose.Types.ObjectId;

  // Multilingual content
  text_es: string;
  text_en: string;

  // Question type and configuration
  type:
    | 'likert'
    | 'multiple_choice'
    | 'open_ended'
    | 'scale'
    | 'binary'
    | 'matrix'
    | 'emoji_rating';

  options_es?: string[];
  options_en?: string[];

  scale?: {
    min: number;
    max: number;
    labels_es?: Map<number, string>;
    labels_en?: Map<number, string>;
  };

  // Categorization
  dimension?: string; // e.g., 'engagement', 'satisfaction', 'leadership'
  tags: string[];

  // Analysis configuration
  reverse_coded: boolean; // For sentiment analysis

  // Version control
  version: number;
  previous_version_id?: mongoose.Types.ObjectId;

  // Usage tracking
  usage_count: number;
  last_used?: Date;

  // Metadata
  created_by: mongoose.Types.ObjectId;
  last_modified_by?: mongoose.Types.ObjectId;
  is_active: boolean;
  is_global: boolean; // Available to all companies

  created_at: Date;
  last_modified?: Date;
}

const QuestionLibrarySchema = new Schema<IQuestionLibrary>(
  {
    company_id: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
    },
    category_id: {
      type: Schema.Types.ObjectId,
      ref: 'QuestionCategory',
      required: true,
      index: true,
    },

    text_es: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    text_en: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },

    type: {
      type: String,
      enum: [
        'likert',
        'multiple_choice',
        'open_ended',
        'scale',
        'binary',
        'matrix',
        'emoji_rating',
      ],
      required: true,
    },

    options_es: [
      {
        type: String,
        trim: true,
      },
    ],
    options_en: [
      {
        type: String,
        trim: true,
      },
    ],

    scale: {
      min: { type: Number, min: 1 },
      max: { type: Number, max: 10 },
      labels_es: { type: Map, of: String },
      labels_en: { type: Map, of: String },
    },

    dimension: {
      type: String,
      trim: true,
    },

    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],

    reverse_coded: {
      type: Boolean,
      default: false,
    },

    version: {
      type: Number,
      default: 1,
    },
    previous_version_id: {
      type: Schema.Types.ObjectId,
      ref: 'QuestionLibrary',
    },

    usage_count: {
      type: Number,
      default: 0,
      index: true,
    },
    last_used: Date,

    created_by: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    last_modified_by: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },

    is_active: {
      type: Boolean,
      default: true,
      index: true,
    },
    is_global: {
      type: Boolean,
      default: false,
      index: true,
    },

    created_at: {
      type: Date,
      default: Date.now,
    },
    last_modified: Date,
  },
  {
    timestamps: true,
  }
);

// Text search index for multilingual search
QuestionLibrarySchema.index(
  {
    text_es: 'text',
    text_en: 'text',
    tags: 'text',
  },
  {
    weights: {
      text_es: 10,
      text_en: 10,
      tags: 5,
    },
    name: 'question_text_search',
  }
);

// Compound indexes for efficient queries
QuestionLibrarySchema.index({ company_id: 1, category_id: 1, is_active: 1 });
QuestionLibrarySchema.index({ company_id: 1, usage_count: -1, last_used: -1 });
QuestionLibrarySchema.index({ is_global: 1, category_id: 1, is_active: 1 });
QuestionLibrarySchema.index({ company_id: 1, dimension: 1, is_active: 1 });

// Update last_modified timestamp
QuestionLibrarySchema.pre('save', function (next) {
  if (this.isModified()) {
    this.last_modified = new Date();
  }
  next();
});

// Increment usage count when question is used
QuestionLibrarySchema.methods.incrementUsage = async function () {
  this.usage_count += 1;
  this.last_used = new Date();
  return this.save();
};

// Create new version of question
QuestionLibrarySchema.methods.createVersion = async function (
  updates: Partial<IQuestionLibrary>,
  userId: mongoose.Types.ObjectId
) {
  const newVersion = new (this.constructor as typeof mongoose.Model)({
    ...this.toObject(),
    _id: new mongoose.Types.ObjectId(),
    version: this.version + 1,
    previous_version_id: this._id,
    last_modified_by: userId,
    created_at: new Date(),
  });

  Object.assign(newVersion, updates);
  return newVersion.save();
};

export default mongoose.models.QuestionLibrary ||
  mongoose.model<IQuestionLibrary>('QuestionLibrary', QuestionLibrarySchema);
