import mongoose, { Document, Schema } from 'mongoose';
import { IQuestion, DemographicConfig, SurveySettings } from './Survey';

// Survey version interface
export interface ISurveyVersion extends Document {
  survey_id: string;
  version_number: number;
  title: string;
  description?: string;
  questions: IQuestion[];
  demographics: DemographicConfig[];
  settings: SurveySettings;
  changes: string[];
  reason: string;
  created_by: string;
  created_at: Date;
}

// Survey version schema
const SurveyVersionSchema: Schema = new Schema(
  {
    survey_id: {
      type: String,
      required: [true, 'Survey ID is required'],
      trim: true,
    },
    version_number: {
      type: Number,
      required: [true, 'Version number is required'],
      min: 1,
    },
    title: {
      type: String,
      required: [true, 'Survey title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    questions: {
      type: Schema.Types.Mixed,
      required: [true, 'Questions are required'],
    },
    demographics: {
      type: Schema.Types.Mixed,
      default: [],
    },
    settings: {
      type: Schema.Types.Mixed,
      required: [true, 'Settings are required'],
    },
    changes: {
      type: [String],
      default: [],
    },
    reason: {
      type: String,
      required: [true, 'Reason for version creation is required'],
      trim: true,
      maxlength: [500, 'Reason cannot exceed 500 characters'],
    },
    created_by: {
      type: String,
      required: [true, 'Creator ID is required'],
      trim: true,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false },
  }
);

// Indexes
SurveyVersionSchema.index({ survey_id: 1, version_number: -1 });
SurveyVersionSchema.index({ created_by: 1 });
SurveyVersionSchema.index({ created_at: -1 });

// Compound unique index to prevent duplicate versions
SurveyVersionSchema.index(
  { survey_id: 1, version_number: 1 },
  { unique: true }
);

// Static methods
SurveyVersionSchema.statics.findBySurvey = function (surveyId: string) {
  return this.find({ survey_id: surveyId }).sort({ version_number: -1 });
};

SurveyVersionSchema.statics.findLatestVersion = function (surveyId: string) {
  return this.findOne({ survey_id: surveyId }).sort({ version_number: -1 });
};

SurveyVersionSchema.statics.findByVersion = function (
  surveyId: string,
  versionNumber: number
) {
  return this.findOne({ survey_id: surveyId, version_number: versionNumber });
};

const SurveyVersion = (mongoose.models.SurveyVersion ||
  mongoose.model<ISurveyVersion>(
    'SurveyVersion',
    SurveyVersionSchema
  )) as mongoose.Model<ISurveyVersion>;

export default SurveyVersion;
export { SurveyVersion };
