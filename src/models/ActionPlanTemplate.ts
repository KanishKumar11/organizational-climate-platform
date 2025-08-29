import mongoose, { Schema, Document } from 'mongoose';
import { IKPI, IQualitativeObjective } from './ActionPlan';

export interface IActionPlanTemplate extends Document {
  name: string;
  description: string;
  category: string;
  company_id?: string; // null for global templates
  created_by: string;
  kpi_templates: Omit<IKPI, 'id' | 'current_value'>[];
  qualitative_objective_templates: Omit<
    IQualitativeObjective,
    'id' | 'current_status' | 'completion_percentage'
  >[];
  ai_recommendation_templates: string[];
  tags: string[];
  usage_count: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

const KPITemplateSchema = new Schema({
  name: { type: String, required: true },
  target_value: { type: Number, required: true },
  unit: { type: String, required: true },
  measurement_frequency: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'quarterly'],
    required: true,
  },
});

const QualitativeObjectiveTemplateSchema = new Schema({
  description: { type: String, required: true },
  success_criteria: { type: String, required: true },
});

const ActionPlanTemplateSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  company_id: { type: String }, // null for global templates
  created_by: { type: String, required: true },
  kpi_templates: [KPITemplateSchema],
  qualitative_objective_templates: [QualitativeObjectiveTemplateSchema],
  ai_recommendation_templates: [{ type: String }],
  tags: [{ type: String }],
  usage_count: { type: Number, default: 0 },
  is_active: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

// Update the updated_at field before saving
ActionPlanTemplateSchema.pre('save', function (next) {
  this.updated_at = new Date();
  next();
});

// Index for efficient queries
ActionPlanTemplateSchema.index({ company_id: 1, category: 1 });
ActionPlanTemplateSchema.index({ is_active: 1 });
ActionPlanTemplateSchema.index({ usage_count: -1 });

export const ActionPlanTemplate =
  mongoose.models.ActionPlanTemplate ||
  mongoose.model<IActionPlanTemplate>(
    'ActionPlanTemplate',
    ActionPlanTemplateSchema
  );
