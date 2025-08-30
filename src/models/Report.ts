import mongoose, { Document, Schema } from 'mongoose';

// Report types
export type ReportType =
  | 'survey_analysis'
  | 'department_comparison'
  | 'trend_analysis'
  | 'benchmark_comparison'
  | 'executive_summary'
  | 'custom';

export type ReportFormat = 'pdf' | 'excel' | 'csv' | 'json';
export type ReportStatus = 'generating' | 'completed' | 'failed' | 'scheduled';

// Filter interfaces
export interface ITimeFilter {
  start_date: Date;
  end_date: Date;
}

export interface IDemographicFilter {
  field: string;
  values: string[];
}

export interface IDepartmentFilter {
  department_ids: string[];
  include_subdepartments?: boolean;
}

export interface IReportFilters {
  time_filter?: ITimeFilter;
  demographic_filters?: IDemographicFilter[];
  department_filter?: IDepartmentFilter;
  survey_types?: string[];
  survey_ids?: string[];
  benchmark_ids?: string[];
}

// Report configuration
export interface IReportConfig {
  include_charts: boolean;
  include_raw_data: boolean;
  include_ai_insights: boolean;
  include_recommendations: boolean;
  chart_types?: string[];
  custom_sections?: string[];
}

// Report template interface
export interface IReportTemplate {
  id: string;
  name: string;
  description: string;
  type: ReportType;
  config: IReportConfig;
  default_filters?: IReportFilters;
  is_system_template: boolean;
}

// Main Report interface
export interface IReport extends Document {
  title: string;
  description?: string;
  type: ReportType;
  company_id: string;
  created_by: string;
  template_id?: string;
  filters: IReportFilters;
  config: IReportConfig;
  status: ReportStatus;
  format: ReportFormat;
  file_path?: string;
  file_size?: number;
  generation_started_at?: Date;
  generation_completed_at?: Date;
  generation_error?: string;
  scheduled_for?: Date;
  is_recurring: boolean;
  recurrence_pattern?: string;
  next_generation?: Date;
  shared_with?: string[];
  download_count: number;
  expires_at?: Date;
  created_at: Date;
  updated_at: Date;
  // Additional properties used in components
  dateRange?: {
    start: string;
    end: string;
  };
  sections?: any[];
  metadata?: {
    responseCount?: number;
  };
  metrics?: {
    engagementScore?: number;
    responseRate?: number;
    satisfaction?: number;
  };
  demographics?: {
    departments?: any[];
  };
  insights?: any[];
  companyId?: string;
  // Instance methods
  markAsStarted(): void;
  markAsCompleted(filePath: string, fileSize: number): void;
  markAsFailed(error: string): void;
  incrementDownloadCount(): void;
  isExpired(): boolean;
}

// Time filter schema
const TimeFilterSchema = new Schema(
  {
    start_date: { type: Date, required: true },
    end_date: { type: Date, required: true },
  },
  { _id: false }
);

// Demographic filter schema
const DemographicFilterSchema = new Schema(
  {
    field: { type: String, required: true },
    values: [{ type: String, required: true }],
  },
  { _id: false }
);

// Department filter schema
const DepartmentFilterSchema = new Schema(
  {
    department_ids: [{ type: String, required: true }],
    include_subdepartments: { type: Boolean, default: false },
  },
  { _id: false }
);

// Report filters schema
const ReportFiltersSchema = new Schema(
  {
    time_filter: TimeFilterSchema,
    demographic_filters: [DemographicFilterSchema],
    department_filter: DepartmentFilterSchema,
    survey_types: [{ type: String }],
    survey_ids: [{ type: String }],
    benchmark_ids: [{ type: String }],
  },
  { _id: false }
);

// Report configuration schema
const ReportConfigSchema = new Schema(
  {
    include_charts: { type: Boolean, default: true },
    include_raw_data: { type: Boolean, default: false },
    include_ai_insights: { type: Boolean, default: true },
    include_recommendations: { type: Boolean, default: true },
    chart_types: [{ type: String }],
    custom_sections: [{ type: String }],
  },
  { _id: false }
);

// Report template schema
const ReportTemplateSchema = new Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String },
    type: {
      type: String,
      enum: [
        'survey_analysis',
        'department_comparison',
        'trend_analysis',
        'benchmark_comparison',
        'executive_summary',
        'custom',
      ],
      required: true,
    },
    config: { type: ReportConfigSchema, required: true },
    default_filters: ReportFiltersSchema,
    is_system_template: { type: Boolean, default: false },
  },
  { _id: false }
);

// Main Report schema
const ReportSchema: Schema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Report title is required'],
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
        'survey_analysis',
        'department_comparison',
        'trend_analysis',
        'benchmark_comparison',
        'executive_summary',
        'custom',
      ],
      required: [true, 'Report type is required'],
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
    template_id: {
      type: String,
      trim: true,
    },
    filters: {
      type: ReportFiltersSchema,
      required: [true, 'Filters are required'],
    },
    config: {
      type: ReportConfigSchema,
      default: () => ({
        include_charts: true,
        include_raw_data: false,
        include_ai_insights: true,
        include_recommendations: true,
      }),
    },
    status: {
      type: String,
      enum: ['generating', 'completed', 'failed', 'scheduled'],
      default: 'generating',
    },
    format: {
      type: String,
      enum: ['pdf', 'excel', 'csv', 'json'],
      required: [true, 'Format is required'],
    },
    file_path: {
      type: String,
      trim: true,
    },
    file_size: {
      type: Number,
      min: 0,
    },
    generation_started_at: {
      type: Date,
    },
    generation_completed_at: {
      type: Date,
    },
    generation_error: {
      type: String,
      trim: true,
    },
    scheduled_for: {
      type: Date,
    },
    is_recurring: {
      type: Boolean,
      default: false,
    },
    recurrence_pattern: {
      type: String,
      trim: true,
    },
    next_generation: {
      type: Date,
    },
    shared_with: [{ type: String, trim: true }],
    download_count: {
      type: Number,
      default: 0,
      min: 0,
    },
    expires_at: {
      type: Date,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

// Indexes
ReportSchema.index({ company_id: 1, status: 1 });
ReportSchema.index({ created_by: 1 });
ReportSchema.index({ type: 1 });
ReportSchema.index({ scheduled_for: 1 });
ReportSchema.index({ expires_at: 1 });
ReportSchema.index({ is_recurring: 1, next_generation: 1 });

// Static methods
ReportSchema.statics.findByCompany = function (companyId: string) {
  return this.find({ company_id: companyId });
};

ReportSchema.statics.findCompleted = function (companyId?: string) {
  const query: any = { status: 'completed' };
  if (companyId) query.company_id = companyId;
  return this.find(query);
};

ReportSchema.statics.findScheduled = function () {
  return this.find({
    status: 'scheduled',
    scheduled_for: { $lte: new Date() },
  });
};

ReportSchema.statics.findRecurring = function () {
  return this.find({
    is_recurring: true,
    next_generation: { $lte: new Date() },
  });
};

// Instance methods
ReportSchema.methods.markAsStarted = function () {
  this.status = 'generating';
  this.generation_started_at = new Date();
  return this.save();
};

ReportSchema.methods.markAsCompleted = function (
  filePath: string,
  fileSize: number
) {
  this.status = 'completed';
  this.generation_completed_at = new Date();
  this.file_path = filePath;
  this.file_size = fileSize;
  this.generation_error = undefined;
  return this.save();
};

ReportSchema.methods.markAsFailed = function (error: string) {
  this.status = 'failed';
  this.generation_error = error;
  return this.save();
};

ReportSchema.methods.incrementDownloadCount = function () {
  this.download_count += 1;
  return this.save();
};

ReportSchema.methods.isExpired = function (): boolean {
  return this.expires_at && this.expires_at < new Date();
};

export default (mongoose.models.Report ||
  mongoose.model<IReport>('Report', ReportSchema)) as mongoose.Model<IReport>;
