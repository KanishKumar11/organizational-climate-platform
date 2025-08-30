import mongoose, { Document, Schema } from 'mongoose';
import { createPrivacyMiddleware } from '../lib/data-privacy';

// Response value types
export type ResponseValue = string | number | string[] | boolean;

// Individual question response
export interface IQuestionResponse {
  question_id: string;
  response_value: ResponseValue;
  response_text?: string;
  time_spent_seconds?: number;
}

// Demographic response
export interface IDemographicResponse {
  field: string;
  value: string | number;
}

// Main Response interface
export interface IResponse extends Document {
  survey_id: string;
  user_id?: string; // Optional for anonymous surveys
  session_id: string;
  company_id: string;
  department_id?: string;
  responses: IQuestionResponse[];
  demographics: IDemographicResponse[];
  is_complete: boolean;
  is_anonymous: boolean;
  start_time: Date;
  completion_time?: Date;
  total_time_seconds?: number;
  ip_address?: string;
  user_agent?: string;
  created_at: Date;
  updated_at: Date;
  // Instance methods
  complete(): void;
}

// Question response schema
const QuestionResponseSchema = new Schema(
  {
    question_id: { type: String, required: true },
    response_value: { type: Schema.Types.Mixed, required: true },
    response_text: { type: String },
    time_spent_seconds: { type: Number, min: 0 },
  },
  { _id: false }
);

// Demographic response schema
const DemographicResponseSchema = new Schema(
  {
    field: { type: String, required: true },
    value: { type: Schema.Types.Mixed, required: true },
  },
  { _id: false }
);

// Main Response schema
const ResponseSchema: Schema = new Schema(
  {
    survey_id: {
      type: String,
      required: [true, 'Survey ID is required'],
      trim: true,
    },
    user_id: {
      type: String,
      trim: true,
    },
    session_id: {
      type: String,
      required: [true, 'Session ID is required'],
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
    responses: {
      type: [QuestionResponseSchema],
      default: [],
    },
    demographics: {
      type: [DemographicResponseSchema],
      default: [],
    },
    is_complete: {
      type: Boolean,
      default: false,
    },
    is_anonymous: {
      type: Boolean,
      default: false,
    },
    start_time: {
      type: Date,
      required: [true, 'Start time is required'],
    },
    completion_time: {
      type: Date,
    },
    total_time_seconds: {
      type: Number,
      min: 0,
    },
    ip_address: {
      type: String,
      trim: true,
    },
    user_agent: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

// Indexes
ResponseSchema.index({ survey_id: 1, is_complete: 1 });
ResponseSchema.index({ user_id: 1 });
ResponseSchema.index({ session_id: 1 });
ResponseSchema.index({ company_id: 1, department_id: 1 });
ResponseSchema.index({ completion_time: 1 });
ResponseSchema.index({ is_anonymous: 1 });

// Static methods
ResponseSchema.statics.findBySurvey = function (surveyId: string) {
  return this.find({ survey_id: surveyId });
};

ResponseSchema.statics.findCompleted = function (surveyId?: string) {
  const query: any = { is_complete: true };
  if (surveyId) query.survey_id = surveyId;
  return this.find(query);
};

ResponseSchema.statics.findByUser = function (userId: string) {
  return this.find({ user_id: userId, is_complete: true });
};

ResponseSchema.statics.findByCompany = function (companyId: string) {
  return this.find({ company_id: companyId, is_complete: true });
};

ResponseSchema.statics.findByDepartment = function (departmentId: string) {
  return this.find({ department_id: departmentId, is_complete: true });
};

// Instance methods
ResponseSchema.methods.addResponse = function (
  questionId: string,
  value: ResponseValue,
  text?: string
) {
  const existingIndex = this.responses.findIndex(
    (r: IQuestionResponse) => r.question_id === questionId
  );
  const response: IQuestionResponse = {
    question_id: questionId,
    response_value: value,
    response_text: text,
  };

  if (existingIndex > -1) {
    this.responses[existingIndex] = response;
  } else {
    this.responses.push(response);
  }
};

ResponseSchema.methods.complete = function () {
  this.is_complete = true;
  this.completion_time = new Date();
  if (this.start_time) {
    this.total_time_seconds = Math.floor(
      (this.completion_time.getTime() - this.start_time.getTime()) / 1000
    );
  }
};

ResponseSchema.methods.getResponseByQuestion = function (
  questionId: string
): IQuestionResponse | undefined {
  return this.responses.find(
    (r: IQuestionResponse) => r.question_id === questionId
  );
};

// Privacy middleware for survey responses
const responsePrivacyMiddleware = createPrivacyMiddleware('survey_responses');

// Pre-save middleware for privacy
ResponseSchema.pre('save', function (next) {
  // Apply data privacy processing
  const processedData = responsePrivacyMiddleware.beforeSave(this.toObject());
  Object.assign(this, processedData);
  next();
});

// Post-find middleware for privacy
ResponseSchema.post(['find', 'findOne', 'findOneAndUpdate'], function (docs) {
  if (!docs) return;

  const processDoc = (doc: any) => {
    if (doc && typeof doc.toObject === 'function') {
      const processed = responsePrivacyMiddleware.afterRetrieve(doc.toObject());
      Object.assign(doc, processed);
    }
  };

  if (Array.isArray(docs)) {
    docs.forEach(processDoc);
  } else {
    processDoc(docs);
  }
});

const Response = (mongoose.models.Response ||
  mongoose.model<IResponse>('Response', ResponseSchema)) as mongoose.Model<IResponse>;

export default Response;
export { Response };


