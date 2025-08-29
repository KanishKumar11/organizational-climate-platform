import mongoose, { Schema, Document } from 'mongoose';

export interface IAIInsight extends Document {
  id: string;
  surveyId: string;
  companyId: string;
  type: 'pattern' | 'risk' | 'recommendation' | 'prediction';
  category: string;
  title: string;
  description: string;
  confidenceScore: number;
  affectedSegments: string[];
  recommendedActions: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const AIInsightSchema = new Schema<IAIInsight>(
  {
    surveyId: {
      type: String,
      required: true,
      index: true,
    },
    companyId: {
      type: String,
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['pattern', 'risk', 'recommendation', 'prediction'],
      required: true,
    },
    category: {
      type: String,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    confidenceScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    affectedSegments: [
      {
        type: String,
      },
    ],
    recommendedActions: [
      {
        type: String,
      },
    ],
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      required: true,
      index: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for performance
AIInsightSchema.index({ surveyId: 1, priority: -1 });
AIInsightSchema.index({ companyId: 1, createdAt: -1 });
AIInsightSchema.index({ category: 1, type: 1 });

// Virtual for ID
AIInsightSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

export const AIInsight =
  mongoose.models.AIInsight ||
  mongoose.model<IAIInsight>('AIInsight', AIInsightSchema);
