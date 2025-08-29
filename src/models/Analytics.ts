import mongoose, { Document, Schema } from 'mongoose';

// Analytics aggregation types
export type AggregationType =
  | 'survey'
  | 'department'
  | 'company'
  | 'question'
  | 'demographic';
export type MetricType =
  | 'average'
  | 'count'
  | 'percentage'
  | 'distribution'
  | 'trend';

// Metric data point
export interface IMetricData {
  label: string;
  value: number;
  count?: number;
  percentage?: number;
}

// Time series data point
export interface ITimeSeriesData {
  date: Date;
  value: number;
  count: number;
}

// Analytics insight interface
export interface IAnalyticsInsight extends Document {
  survey_id?: string;
  company_id: string;
  department_id?: string;
  aggregation_type: AggregationType;
  metric_type: MetricType;
  metric_name: string;
  metric_description?: string;
  data: IMetricData[];
  time_series?: ITimeSeriesData[];
  total_responses: number;
  calculation_date: Date;
  is_current: boolean;
  created_at: Date;
  updated_at: Date;
}

// AI Insight types
export type InsightType =
  | 'pattern'
  | 'risk'
  | 'recommendation'
  | 'prediction'
  | 'alert';
export type InsightPriority = 'low' | 'medium' | 'high' | 'critical';

// AI Insight interface
export interface IAIInsight extends Document {
  survey_id?: string;
  company_id: string;
  department_id?: string;
  type: InsightType;
  category: string;
  title: string;
  description: string;
  confidence_score: number;
  priority: InsightPriority;
  affected_segments: string[];
  recommended_actions: string[];
  supporting_data: Record<string, unknown>;
  is_acknowledged: boolean;
  acknowledged_by?: string;
  acknowledged_at?: Date;
  expires_at?: Date;
  created_at: Date;
  updated_at: Date;
}

// Metric data schema
const MetricDataSchema = new Schema(
  {
    label: { type: String, required: true },
    value: { type: Number, required: true },
    count: { type: Number },
    percentage: { type: Number, min: 0, max: 100 },
  },
  { _id: false }
);

// Time series data schema
const TimeSeriesDataSchema = new Schema(
  {
    date: { type: Date, required: true },
    value: { type: Number, required: true },
    count: { type: Number, required: true },
  },
  { _id: false }
);

// Analytics insight schema
const AnalyticsInsightSchema: Schema = new Schema(
  {
    survey_id: {
      type: String,
      trim: true,
    },
    company_id: {
      type: String,
      required: [true, 'Company ID is required'],
      trim: true,
    },
    department_id: {
      type: String,
      trim: true,
    },
    aggregation_type: {
      type: String,
      enum: ['survey', 'department', 'company', 'question', 'demographic'],
      required: [true, 'Aggregation type is required'],
    },
    metric_type: {
      type: String,
      enum: ['average', 'count', 'percentage', 'distribution', 'trend'],
      required: [true, 'Metric type is required'],
    },
    metric_name: {
      type: String,
      required: [true, 'Metric name is required'],
      trim: true,
    },
    metric_description: {
      type: String,
      trim: true,
    },
    data: {
      type: [MetricDataSchema],
      required: [true, 'Data is required'],
    },
    time_series: [TimeSeriesDataSchema],
    total_responses: {
      type: Number,
      required: [true, 'Total responses is required'],
      min: 0,
    },
    calculation_date: {
      type: Date,
      required: [true, 'Calculation date is required'],
    },
    is_current: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

// AI Insight schema
const AIInsightSchema: Schema = new Schema(
  {
    survey_id: {
      type: String,
      trim: true,
    },
    company_id: {
      type: String,
      required: [true, 'Company ID is required'],
      trim: true,
    },
    department_id: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      enum: ['pattern', 'risk', 'recommendation', 'prediction', 'alert'],
      required: [true, 'Insight type is required'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    confidence_score: {
      type: Number,
      required: [true, 'Confidence score is required'],
      min: 0,
      max: 1,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      required: [true, 'Priority is required'],
    },
    affected_segments: [{ type: String, trim: true }],
    recommended_actions: [{ type: String, trim: true }],
    supporting_data: {
      type: Schema.Types.Mixed,
      default: {},
    },
    is_acknowledged: {
      type: Boolean,
      default: false,
    },
    acknowledged_by: {
      type: String,
      trim: true,
    },
    acknowledged_at: {
      type: Date,
    },
    expires_at: {
      type: Date,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

// Indexes for Analytics
AnalyticsInsightSchema.index({ company_id: 1, is_current: 1 });
AnalyticsInsightSchema.index({ survey_id: 1 });
AnalyticsInsightSchema.index({ department_id: 1 });
AnalyticsInsightSchema.index({ aggregation_type: 1, metric_type: 1 });
AnalyticsInsightSchema.index({ calculation_date: -1 });

// Indexes for AI Insights
AIInsightSchema.index({ company_id: 1, is_acknowledged: 1 });
AIInsightSchema.index({ survey_id: 1 });
AIInsightSchema.index({ department_id: 1 });
AIInsightSchema.index({ type: 1, priority: 1 });
AIInsightSchema.index({ expires_at: 1 });
AIInsightSchema.index({ created_at: -1 });

// Static methods for Analytics
AnalyticsInsightSchema.statics.findCurrent = function (companyId: string) {
  return this.find({ company_id: companyId, is_current: true });
};

AnalyticsInsightSchema.statics.findBySurvey = function (surveyId: string) {
  return this.find({ survey_id: surveyId, is_current: true });
};

AnalyticsInsightSchema.statics.findByDepartment = function (
  departmentId: string
) {
  return this.find({ department_id: departmentId, is_current: true });
};

// Static methods for AI Insights
AIInsightSchema.statics.findUnacknowledged = function (companyId: string) {
  return this.find({
    company_id: companyId,
    is_acknowledged: false,
    $or: [
      { expires_at: { $exists: false } },
      { expires_at: { $gt: new Date() } },
    ],
  });
};

AIInsightSchema.statics.findByPriority = function (
  priority: InsightPriority,
  companyId?: string
) {
  const query: {
    priority: InsightPriority;
    is_acknowledged: boolean;
    company_id?: string;
  } = {
    priority,
    is_acknowledged: false,
  };
  if (companyId) query.company_id = companyId;
  return this.find(query);
};

AIInsightSchema.statics.findBySurvey = function (surveyId: string) {
  return this.find({ survey_id: surveyId });
};

// Instance methods for AI Insights
AIInsightSchema.methods.acknowledge = function (userId: string) {
  this.is_acknowledged = true;
  this.acknowledged_by = userId;
  this.acknowledged_at = new Date();
  return this.save();
};

AIInsightSchema.methods.isExpired = function (): boolean {
  return this.expires_at && this.expires_at < new Date();
};

export const AnalyticsInsight =
  mongoose.models.AnalyticsInsight ||
  mongoose.model<IAnalyticsInsight>('AnalyticsInsight', AnalyticsInsightSchema);
export const AIInsight =
  mongoose.models.AIInsight ||
  mongoose.model<IAIInsight>('AIInsight', AIInsightSchema);

const AnalyticsModels = { AnalyticsInsight, AIInsight };
export default AnalyticsModels;
