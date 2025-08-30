import mongoose, { Document, Schema } from 'mongoose';
import { QuestionType } from './Survey';

// Question effectiveness metrics
export interface QuestionMetrics {
  usage_count: number;
  response_rate: number;
  insight_score: number; // AI-generated score for how insightful responses are
  last_used: Date;
}

// Question bank item interface
export interface IQuestionBankItem extends Document {
  text: string;
  type: QuestionType;
  category: string;
  subcategory?: string;
  options?: string[];
  scale_min?: number;
  scale_max?: number;
  scale_labels?: { min: string; max: string };
  tags: string[];
  industry?: string;
  company_size?: 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
  metrics: QuestionMetrics;
  is_active: boolean;
  is_ai_generated: boolean;
  created_by?: string;
  company_id?: string; // null for global questions
  version: number;
  parent_question_id?: string; // for question variations
  created_at: Date;
  updated_at: Date;
  // Instance methods
  incrementUsage(): void;
  updateMetrics(responseRate: number, insightScore: number): void;
  createVariation(text: string, createdBy: string): Promise<IQuestionBankItem>;
  getVariations(): Promise<IQuestionBankItem[]>;
}

// Question metrics schema
const QuestionMetricsSchema = new Schema(
  {
    usage_count: { type: Number, default: 0, min: 0 },
    response_rate: { type: Number, default: 0, min: 0, max: 100 },
    insight_score: { type: Number, default: 0, min: 0, max: 10 },
    last_used: { type: Date },
  },
  { _id: false }
);

// Question bank schema
const QuestionBankSchema: Schema = new Schema(
  {
    text: {
      type: String,
      required: [true, 'Question text is required'],
      trim: true,
      maxlength: [500, 'Question text cannot exceed 500 characters'],
    },
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
      required: [true, 'Question type is required'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    subcategory: {
      type: String,
      trim: true,
    },
    options: [{ type: String, trim: true }],
    scale_min: { type: Number, min: 1, max: 10 },
    scale_max: { type: Number, min: 1, max: 10 },
    scale_labels: {
      min: { type: String, trim: true },
      max: { type: String, trim: true },
    },
    tags: [{ type: String, trim: true }],
    industry: {
      type: String,
      trim: true,
    },
    company_size: {
      type: String,
      enum: ['startup', 'small', 'medium', 'large', 'enterprise'],
    },
    metrics: {
      type: QuestionMetricsSchema,
      default: () => ({}),
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    is_ai_generated: {
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
    version: {
      type: Number,
      default: 1,
      min: 1,
    },
    parent_question_id: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

// Indexes
QuestionBankSchema.index({ category: 1, subcategory: 1 });
QuestionBankSchema.index({ type: 1 });
QuestionBankSchema.index({ tags: 1 });
QuestionBankSchema.index({ industry: 1, company_size: 1 });
QuestionBankSchema.index({ company_id: 1, is_active: 1 });
QuestionBankSchema.index({
  'metrics.usage_count': -1,
  'metrics.insight_score': -1,
});
QuestionBankSchema.index({ is_ai_generated: 1 });
QuestionBankSchema.index({ parent_question_id: 1 });

// Static methods
QuestionBankSchema.statics.findByCategory = function (
  category: string,
  subcategory?: string
) {
  const query: any = { category, is_active: true };
  if (subcategory) query.subcategory = subcategory;
  return this.find(query);
};

QuestionBankSchema.statics.findByType = function (type: QuestionType) {
  return this.find({ type, is_active: true });
};

QuestionBankSchema.statics.findByTags = function (tags: string[]) {
  return this.find({
    tags: { $in: tags },
    is_active: true,
  });
};

QuestionBankSchema.statics.findGlobal = function () {
  return this.find({
    company_id: { $exists: false },
    is_active: true,
  });
};

QuestionBankSchema.statics.findByCompany = function (companyId: string) {
  return this.find({
    $or: [{ company_id: companyId }, { company_id: { $exists: false } }],
    is_active: true,
  });
};

QuestionBankSchema.statics.findPopular = function (limit: number = 20) {
  return this.find({ is_active: true })
    .sort({ 'metrics.usage_count': -1, 'metrics.insight_score': -1 })
    .limit(limit);
};

QuestionBankSchema.statics.findRecommended = function (
  category: string,
  industry?: string,
  companySize?: string,
  limit: number = 10
) {
  const query: any = {
    category,
    is_active: true,
  };

  if (industry) query.industry = industry;
  if (companySize) query.company_size = companySize;

  return this.find(query)
    .sort({ 'metrics.insight_score': -1, 'metrics.usage_count': -1 })
    .limit(limit);
};

QuestionBankSchema.statics.searchQuestions = function (searchTerm: string) {
  return this.find({
    $and: [
      { is_active: true },
      {
        $or: [
          { text: { $regex: searchTerm, $options: 'i' } },
          { category: { $regex: searchTerm, $options: 'i' } },
          { subcategory: { $regex: searchTerm, $options: 'i' } },
          { tags: { $in: [new RegExp(searchTerm, 'i')] } },
        ],
      },
    ],
  });
};

// Instance methods
QuestionBankSchema.methods.incrementUsage = function () {
  this.metrics.usage_count += 1;
  this.metrics.last_used = new Date();
  return this.save();
};

QuestionBankSchema.methods.updateMetrics = function (
  responseRate: number,
  insightScore: number
) {
  this.metrics.response_rate = Math.max(0, Math.min(100, responseRate));
  this.metrics.insight_score = Math.max(0, Math.min(10, insightScore));
  return this.save();
};

QuestionBankSchema.methods.createVariation = function (
  newText: string,
  createdBy?: string
) {
  const variation = new this.constructor({
    text: newText,
    type: this.type,
    category: this.category,
    subcategory: this.subcategory,
    options: this.options,
    scale_min: this.scale_min,
    scale_max: this.scale_max,
    scale_labels: this.scale_labels,
    tags: this.tags,
    industry: this.industry,
    company_size: this.company_size,
    created_by: createdBy,
    company_id: this.company_id,
    parent_question_id: this._id.toString(),
    version: this.version + 1,
  });

  return variation.save();
};

QuestionBankSchema.methods.getVariations = function () {
  return this.constructor.find({
    parent_question_id: this._id.toString(),
    is_active: true,
  });
};

export default (mongoose.models.QuestionBank ||
  mongoose.model<IQuestionBankItem>('QuestionBank', QuestionBankSchema)) as mongoose.Model<IQuestionBankItem>;


