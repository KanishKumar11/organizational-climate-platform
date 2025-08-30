import mongoose, { Document, Schema } from 'mongoose';
import { IQuestion, DemographicConfig, SurveySettings } from './Survey';

// Template category
export type TemplateCategory =
  | 'climate'
  | 'culture'
  | 'engagement'
  | 'leadership'
  | 'wellbeing'
  | 'custom';

// Template interface
export interface ISurveyTemplate extends Document {
  name: string;
  description: string;
  category: TemplateCategory;
  industry?: string;
  company_size?: 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
  questions: IQuestion[];
  demographics: DemographicConfig[];
  default_settings: SurveySettings;
  is_public: boolean;
  created_by?: string;
  company_id?: string;
  usage_count: number;
  rating: number;
  tags: string[];
  created_at: Date;
  updated_at: Date;
}

// Survey template schema
const SurveyTemplateSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Template name is required'],
      trim: true,
      maxlength: [200, 'Name cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Template description is required'],
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    category: {
      type: String,
      enum: [
        'climate',
        'culture',
        'engagement',
        'leadership',
        'wellbeing',
        'custom',
      ],
      required: [true, 'Category is required'],
    },
    industry: {
      type: String,
      trim: true,
    },
    company_size: {
      type: String,
      enum: ['startup', 'small', 'medium', 'large', 'enterprise'],
    },
    questions: {
      type: [Schema.Types.Mixed], // Reuse Question schema from Survey
      required: [true, 'Template must have questions'],
    },
    demographics: [Schema.Types.Mixed], // Reuse DemographicConfig schema
    default_settings: {
      type: Schema.Types.Mixed, // Reuse SurveySettings schema
      default: () => ({
        anonymous: false,
        allow_partial_responses: true,
        randomize_questions: false,
        show_progress: true,
        auto_save: true,
        notification_settings: {
          send_invitations: true,
          send_reminders: true,
          reminder_frequency_days: 3,
        },
      }),
    },
    is_public: {
      type: Boolean,
      default: false,
    },
    created_by: {
      type: String,
      trim: true,
    },
    company_id: {
      type: String,
      trim: true,
    },
    usage_count: {
      type: Number,
      default: 0,
      min: 0,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    tags: [{ type: String, trim: true }],
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

// Indexes
SurveyTemplateSchema.index({ category: 1, is_public: 1 });
SurveyTemplateSchema.index({ industry: 1, company_size: 1 });
SurveyTemplateSchema.index({ tags: 1 });
SurveyTemplateSchema.index({ created_by: 1 });
SurveyTemplateSchema.index({ company_id: 1 });
SurveyTemplateSchema.index({ rating: -1, usage_count: -1 });

// Static methods
SurveyTemplateSchema.statics.findPublic = function () {
  return this.find({ is_public: true });
};

SurveyTemplateSchema.statics.findByCategory = function (
  category: TemplateCategory
) {
  return this.find({ category, is_public: true });
};

SurveyTemplateSchema.statics.findByIndustry = function (industry: string) {
  return this.find({ industry, is_public: true });
};

SurveyTemplateSchema.statics.findByCompany = function (companyId: string) {
  return this.find({
    $or: [{ company_id: companyId }, { is_public: true }],
  });
};

SurveyTemplateSchema.statics.findPopular = function (limit: number = 10) {
  return this.find({ is_public: true })
    .sort({ rating: -1, usage_count: -1 })
    .limit(limit);
};

// Instance methods
SurveyTemplateSchema.methods.incrementUsage = function () {
  this.usage_count += 1;
  return this.save();
};

SurveyTemplateSchema.methods.updateRating = function (newRating: number) {
  // Simple rating update - in production, this would be more sophisticated
  this.rating = Math.max(0, Math.min(5, newRating));
  return this.save();
};

export default (mongoose.models.SurveyTemplate ||
  mongoose.model<ISurveyTemplate>(
    'SurveyTemplate',
    SurveyTemplateSchema
  )) as mongoose.Model<ISurveyTemplate>;
