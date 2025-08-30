import mongoose, { Schema, Document } from 'mongoose';

export interface IBenchmark extends Document {
  id: string;
  name: string;
  description: string;
  type: 'internal' | 'industry';
  category: string;
  metrics: BenchmarkMetric[];
  source: string;
  industry?: string;
  company_size?: string;
  region?: string;
  created_by: string;
  company_id?: string;
  is_active: boolean;
  validation_status: 'pending' | 'validated' | 'rejected';
  quality_score: number;
  created_at: Date;
  updated_at: Date;
  metadata: Record<string, any>;
}

export interface BenchmarkMetric {
  metric_name: string;
  value: number;
  unit: string;
  percentile?: number;
  sample_size?: number;
  confidence_interval?: {
    lower: number;
    upper: number;
  };
}

const BenchmarkMetricSchema = new Schema({
  metric_name: { type: String, required: true },
  value: { type: Number, required: true },
  unit: { type: String, required: true },
  percentile: { type: Number },
  sample_size: { type: Number },
  confidence_interval: {
    lower: { type: Number },
    upper: { type: Number },
  },
});

const BenchmarkSchema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    type: {
      type: String,
      enum: ['internal', 'industry'],
      required: true,
    },
    category: { type: String, required: true },
    metrics: [BenchmarkMetricSchema],
    source: { type: String, required: true },
    industry: { type: String },
    company_size: { type: String },
    region: { type: String },
    created_by: { type: String, required: true },
    company_id: { type: String },
    is_active: { type: Boolean, default: true },
    validation_status: {
      type: String,
      enum: ['pending', 'validated', 'rejected'],
      default: 'pending',
    },
    quality_score: { type: Number, default: 0 },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

// Indexes for performance
BenchmarkSchema.index({ type: 1, category: 1 });
BenchmarkSchema.index({ company_id: 1, is_active: 1 });
BenchmarkSchema.index({ industry: 1, company_size: 1 });
BenchmarkSchema.index({ validation_status: 1 });

export default (mongoose.models.Benchmark ||
  mongoose.model<IBenchmark>('Benchmark', BenchmarkSchema)) as mongoose.Model<IBenchmark>;


