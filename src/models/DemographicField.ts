import mongoose, { Document, Schema } from 'mongoose';

// Demographic field definition
export interface IDemographicField extends Document {
  company_id: string;
  field: string; // e.g., 'gender', 'tenure', 'department'
  label: string; // e.g., 'Gender', 'Tenure in Company', 'Department'
  type: 'select' | 'text' | 'number' | 'date';
  options?: string[]; // For select type
  required: boolean;
  order: number; // For display order
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

// Demographic field schema
const DemographicFieldSchema = new Schema(
  {
    company_id: {
      type: String,
      required: true,
      index: true,
    },
    field: {
      type: String,
      required: true,
      trim: true,
    },
    label: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['select', 'text', 'number', 'date'],
      required: true,
    },
    options: [
      {
        type: String,
        trim: true,
      },
    ],
    required: {
      type: Boolean,
      default: false,
    },
    order: {
      type: Number,
      default: 0,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

// Indexes
DemographicFieldSchema.index({ company_id: 1, field: 1 }, { unique: true });
DemographicFieldSchema.index({ company_id: 1, order: 1 });

// Static methods
DemographicFieldSchema.statics.findByCompany = function (companyId: string) {
  return this.find({ company_id: companyId, is_active: true }).sort({
    order: 1,
  });
};

DemographicFieldSchema.statics.findActiveByCompany = function (
  companyId: string
) {
  return this.find({ company_id: companyId, is_active: true }).sort({
    order: 1,
  });
};

// Demographic field interface with static methods
interface IDemographicFieldModel extends mongoose.Model<IDemographicField> {
  findByCompany(companyId: string): Promise<IDemographicField[]>;
  findActiveByCompany(companyId: string): Promise<IDemographicField[]>;
}

const DemographicField = (mongoose.models.DemographicField ||
  mongoose.model<IDemographicField>(
    'DemographicField',
    DemographicFieldSchema
  )) as IDemographicFieldModel;

export default DemographicField;
export { DemographicField };
