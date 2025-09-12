import mongoose, { Schema, Document } from 'mongoose';

// Question Pool Management Schema
export interface IQuestionPool extends Document {
  id: string;
  category: string;
  subcategory?: string;
  originalText: string;
  questionType: 'likert' | 'multiple_choice' | 'ranking' | 'open_ended';
  options?: string[];
  tags: string[];
  effectivenessScore: number;
  usageCount: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  adaptations: IQuestionAdaptation[];
  combinationPotential: string[];
  demographicContext: IDemographicContext[];
  metadata: Record<string, any>;
}

export interface IQuestionAdaptation {
  id: string;
  adaptationType: 'combine' | 'reformulate' | 'generate';
  adaptedText: string;
  sourceQuestionIds?: string[];
  context: IAdaptationContext;
  effectivenessScore: number;
  usageCount: number;
  createdAt: Date;
  isActive: boolean;
}

export interface IAdaptationContext {
  companyId: string;
  departmentId?: string;
  demographicFilters: Record<string, any>;
  surveyType: string;
  previousResponses?: Record<string, any>;
  culturalContext?: string;
  industryContext?: string;
}

export interface IDemographicContext {
  department: string;
  role: string;
  tenure: string;
  customAttributes: Record<string, any>;
  adaptationPreferences: Record<string, any>;
}

// Question Effectiveness Tracking Schema
export interface IQuestionEffectiveness extends Document {
  questionId: string;
  adaptationId?: string;
  surveyId: string;
  companyId: string;
  departmentId?: string;
  responseRate: number;
  completionRate: number;
  insightQuality: number;
  actionPlanGeneration: number;
  demographicBreakdown: Record<string, any>;
  sentimentScores: {
    positive: number;
    neutral: number;
    negative: number;
  };
  engagementMetrics: {
    timeSpent: number;
    skipRate: number;
    clarificationRequests: number;
  };
  measuredAt: Date;
  createdAt: Date;
}

// Question Combination Tracking Schema
export interface IQuestionCombination extends Document {
  id: string;
  sourceQuestionIds: string[];
  combinedText: string;
  combinationType: 'merge' | 'hybrid' | 'contextual';
  effectivenessScore: number;
  usageCount: number;
  successfulAdaptations: number;
  companyContexts: string[];
  departmentContexts: string[];
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

// Question Generation History Schema
export interface IQuestionGeneration extends Document {
  id: string;
  generationType: 'ai_generated' | 'admin_added' | 'hybrid';
  sourceData: {
    historicalQuestions: string[];
    adminInput?: string;
    contextualData: Record<string, any>;
  };
  generatedText: string;
  validationScore: number;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  effectivenessScore?: number;
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const QuestionAdaptationSchema = new Schema<IQuestionAdaptation>({
  id: { type: String, required: true },
  adaptationType: {
    type: String,
    enum: ['combine', 'reformulate', 'generate'],
    required: true,
  },
  adaptedText: { type: String, required: true },
  sourceQuestionIds: [{ type: String }],
  context: {
    companyId: { type: String, required: true },
    departmentId: { type: String },
    demographicFilters: { type: Schema.Types.Mixed, default: {} },
    surveyType: { type: String, required: true },
    previousResponses: { type: Schema.Types.Mixed },
    culturalContext: { type: String },
    industryContext: { type: String },
  },
  effectivenessScore: { type: Number, default: 0, min: 0, max: 100 },
  usageCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
});

const DemographicContextSchema = new Schema<IDemographicContext>({
  department: { type: String, required: true },
  role: { type: String, required: true },
  tenure: { type: String, required: true },
  customAttributes: { type: Schema.Types.Mixed, default: {} },
  adaptationPreferences: { type: Schema.Types.Mixed, default: {} },
});

const QuestionPoolSchema = new Schema<IQuestionPool>({
  id: { type: String, required: true, unique: true },
  category: { type: String, required: true, index: true },
  subcategory: { type: String, index: true },
  originalText: { type: String, required: true },
  questionType: {
    type: String,
    enum: ['likert', 'multiple_choice', 'ranking', 'open_ended'],
    required: true,
  },
  options: [{ type: String }],
  tags: [{ type: String, index: true }],
  effectivenessScore: { type: Number, default: 0, min: 0, max: 100 },
  usageCount: { type: Number, default: 0 },
  createdBy: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
  adaptations: [QuestionAdaptationSchema],
  combinationPotential: [{ type: String }],
  demographicContext: [DemographicContextSchema],
  metadata: { type: Schema.Types.Mixed, default: {} },
});

const QuestionEffectivenessSchema = new Schema<IQuestionEffectiveness>({
  questionId: { type: String, required: true, index: true },
  adaptationId: { type: String, index: true },
  surveyId: { type: String, required: true, index: true },
  companyId: { type: String, required: true, index: true },
  departmentId: { type: String, index: true },
  responseRate: { type: Number, required: true, min: 0, max: 100 },
  completionRate: { type: Number, required: true, min: 0, max: 100 },
  insightQuality: { type: Number, required: true, min: 0, max: 100 },
  actionPlanGeneration: { type: Number, required: true, min: 0, max: 100 },
  demographicBreakdown: { type: Schema.Types.Mixed, default: {} },
  sentimentScores: {
    positive: { type: Number, default: 0, min: 0, max: 100 },
    neutral: { type: Number, default: 0, min: 0, max: 100 },
    negative: { type: Number, default: 0, min: 0, max: 100 },
  },
  engagementMetrics: {
    timeSpent: { type: Number, default: 0 },
    skipRate: { type: Number, default: 0, min: 0, max: 100 },
    clarificationRequests: { type: Number, default: 0 },
  },
  measuredAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
});

const QuestionCombinationSchema = new Schema<IQuestionCombination>({
  id: { type: String, required: true, unique: true },
  sourceQuestionIds: [{ type: String, required: true }],
  combinedText: { type: String, required: true },
  combinationType: {
    type: String,
    enum: ['merge', 'hybrid', 'contextual'],
    required: true,
  },
  effectivenessScore: { type: Number, default: 0, min: 0, max: 100 },
  usageCount: { type: Number, default: 0 },
  successfulAdaptations: { type: Number, default: 0 },
  companyContexts: [{ type: String }],
  departmentContexts: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
});

const QuestionGenerationSchema = new Schema<IQuestionGeneration>({
  id: { type: String, required: true, unique: true },
  generationType: {
    type: String,
    enum: ['ai_generated', 'admin_added', 'hybrid'],
    required: true,
  },
  sourceData: {
    historicalQuestions: [{ type: String }],
    adminInput: { type: String },
    contextualData: { type: Schema.Types.Mixed, default: {} },
  },
  generatedText: { type: String, required: true },
  validationScore: { type: Number, default: 0, min: 0, max: 100 },
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  approvedBy: { type: String },
  effectivenessScore: { type: Number, min: 0, max: 100 },
  usageCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Indexes for performance
QuestionPoolSchema.index({ category: 1, isActive: 1 });
QuestionPoolSchema.index({ effectivenessScore: -1 });
QuestionPoolSchema.index({ tags: 1 });
QuestionPoolSchema.index({ 'adaptations.adaptationType': 1 });

QuestionEffectivenessSchema.index({ questionId: 1, measuredAt: -1 });
QuestionEffectivenessSchema.index({ companyId: 1, departmentId: 1 });
QuestionEffectivenessSchema.index({ responseRate: -1, insightQuality: -1 });

QuestionCombinationSchema.index({ effectivenessScore: -1 });
QuestionCombinationSchema.index({ companyContexts: 1 });

QuestionGenerationSchema.index({ approvalStatus: 1, createdAt: -1 });
QuestionGenerationSchema.index({ effectivenessScore: -1 });

export const QuestionPool =
  mongoose.models.QuestionPool ||
  mongoose.model<IQuestionPool>('QuestionPool', QuestionPoolSchema);
export const QuestionEffectiveness =
  mongoose.models.QuestionEffectiveness ||
  mongoose.model<IQuestionEffectiveness>(
    'QuestionEffectiveness',
    QuestionEffectivenessSchema
  );
export const QuestionCombination =
  mongoose.models.QuestionCombination ||
  mongoose.model<IQuestionCombination>(
    'QuestionCombination',
    QuestionCombinationSchema
  );
export const QuestionGeneration =
  mongoose.models.QuestionGeneration ||
  mongoose.model<IQuestionGeneration>(
    'QuestionGeneration',
    QuestionGenerationSchema
  );
