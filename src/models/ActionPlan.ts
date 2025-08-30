import mongoose, { Schema, Document } from 'mongoose';

export interface IKPI {
  id: string;
  name: string;
  target_value: number;
  current_value: number;
  unit: string;
  measurement_frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
}

export interface IQualitativeObjective {
  id: string;
  description: string;
  success_criteria: string;
  current_status: string;
  completion_percentage: number;
}

export interface IProgressUpdate {
  id: string;
  update_date: Date;
  kpi_updates: {
    kpi_id: string;
    new_value: number;
    notes?: string;
  }[];
  qualitative_updates: {
    objective_id: string;
    status_update: string;
    completion_percentage: number;
    notes?: string;
  }[];
  overall_notes: string;
  updated_by: string;
}

export interface IActionPlan extends Document {
  title: string;
  description: string;
  company_id: string;
  department_id?: string;
  created_by: string;
  assigned_to: string[];
  due_date: Date;
  status: 'not_started' | 'in_progress' | 'completed' | 'overdue' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  kpis: IKPI[];
  qualitative_objectives: IQualitativeObjective[];
  progress_updates: IProgressUpdate[];
  ai_recommendations: string[];
  tags: string[];
  template_id?: string;
  source_survey_id?: string;
  source_insight_id?: string;
  created_at: Date;
  updated_at: Date;
}

const KPISchema = new Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  target_value: { type: Number, required: true },
  current_value: { type: Number, default: 0 },
  unit: { type: String, required: true },
  measurement_frequency: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'quarterly'],
    required: true,
  },
});

const QualitativeObjectiveSchema = new Schema({
  id: { type: String, required: true },
  description: { type: String, required: true },
  success_criteria: { type: String, required: true },
  current_status: { type: String, default: '' },
  completion_percentage: { type: Number, default: 0, min: 0, max: 100 },
});

const ProgressUpdateSchema = new Schema({
  id: { type: String, required: true },
  update_date: { type: Date, default: Date.now },
  kpi_updates: [
    {
      kpi_id: { type: String, required: true },
      new_value: { type: Number, required: true },
      notes: { type: String },
    },
  ],
  qualitative_updates: [
    {
      objective_id: { type: String, required: true },
      status_update: { type: String, required: true },
      completion_percentage: { type: Number, min: 0, max: 100 },
      notes: { type: String },
    },
  ],
  overall_notes: { type: String, default: '' },
  updated_by: { type: String, required: true },
});

const ActionPlanSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  company_id: { type: String, required: true },
  department_id: { type: String },
  created_by: { type: String, required: true },
  assigned_to: [{ type: String, required: true }],
  due_date: { type: Date, required: true },
  status: {
    type: String,
    enum: ['not_started', 'in_progress', 'completed', 'overdue', 'cancelled'],
    default: 'not_started',
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
  },
  kpis: [KPISchema],
  qualitative_objectives: [QualitativeObjectiveSchema],
  progress_updates: [ProgressUpdateSchema],
  ai_recommendations: [{ type: String }],
  tags: [{ type: String }],
  template_id: { type: String },
  source_survey_id: { type: String },
  source_insight_id: { type: String },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

// Update the updated_at field before saving
ActionPlanSchema.pre('save', function (next) {
  this.updated_at = new Date();
  next();
});

// Index for efficient queries
ActionPlanSchema.index({ company_id: 1, status: 1 });
ActionPlanSchema.index({ assigned_to: 1 });
ActionPlanSchema.index({ due_date: 1 });
ActionPlanSchema.index({ created_by: 1 });

export const ActionPlan = (mongoose.models.ActionPlan ||
  mongoose.model<IActionPlan>(
    'ActionPlan',
    ActionPlanSchema
  )) as mongoose.Model<IActionPlan>;
