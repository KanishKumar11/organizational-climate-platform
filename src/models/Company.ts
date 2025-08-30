import mongoose, { Document, Schema } from 'mongoose';

// Company branding interface
export interface CompanyBranding {
  logo_url?: string;
  primary_color: string;
  secondary_color: string;
  font_family?: string;
  custom_css?: string;
}

// Company settings interface
export interface CompanySettings {
  survey_frequency: 'monthly' | 'quarterly' | 'semi_annual' | 'annual';
  microclimate_enabled: boolean;
  ai_insights_enabled: boolean;
  anonymous_surveys: boolean;
  data_retention_days: number;
  timezone: string;
  language: string;
}

// Main Company interface
export interface ICompany extends Document {
  name: string;
  domain: string;
  industry: string;
  size: 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
  country: string;
  branding: CompanyBranding;
  settings: CompanySettings;
  is_active: boolean;
  subscription_tier: 'basic' | 'professional' | 'enterprise';
  created_at: Date;
  updated_at: Date;
}

// Company branding schema
const CompanyBrandingSchema = new Schema(
  {
    logo_url: { type: String },
    primary_color: { type: String, default: '#3B82F6' },
    secondary_color: { type: String, default: '#1F2937' },
    font_family: { type: String, default: 'Inter' },
    custom_css: { type: String },
  },
  { _id: false }
);

// Company settings schema
const CompanySettingsSchema = new Schema(
  {
    survey_frequency: {
      type: String,
      enum: ['monthly', 'quarterly', 'semi_annual', 'annual'],
      default: 'quarterly',
    },
    microclimate_enabled: { type: Boolean, default: true },
    ai_insights_enabled: { type: Boolean, default: true },
    anonymous_surveys: { type: Boolean, default: false },
    data_retention_days: { type: Number, default: 2555 }, // 7 years
    timezone: { type: String, default: 'UTC' },
    language: { type: String, default: 'en' },
  },
  { _id: false }
);

// Main Company schema
const CompanySchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
      maxlength: [100, 'Company name cannot exceed 100 characters'],
    },
    domain: {
      type: String,
      required: [true, 'Company domain is required'],
      lowercase: true,
      trim: true,
      match: [
        /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/,
        'Please provide a valid domain',
      ],
    },
    industry: {
      type: String,
      required: [true, 'Industry is required'],
      trim: true,
    },
    size: {
      type: String,
      enum: ['startup', 'small', 'medium', 'large', 'enterprise'],
      required: [true, 'Company size is required'],
    },
    country: {
      type: String,
      required: [true, 'Country is required'],
      trim: true,
    },
    branding: {
      type: CompanyBrandingSchema,
      default: () => ({}),
    },
    settings: {
      type: CompanySettingsSchema,
      default: () => ({}),
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    subscription_tier: {
      type: String,
      enum: ['basic', 'professional', 'enterprise'],
      default: 'basic',
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

// Indexes
CompanySchema.index({ domain: 1 }, { unique: true });
CompanySchema.index({ is_active: 1 });
CompanySchema.index({ subscription_tier: 1 });

// Ensure unique constraint is enforced
CompanySchema.pre('save', async function (next) {
  if (this.isModified('domain')) {
    const existing = await (
      this.constructor as mongoose.Model<ICompany>
    ).findOne({
      domain: this.domain,
      _id: { $ne: this._id },
    });
    if (existing) {
      throw new Error('Domain already exists');
    }
  }
  next();
});

// Static methods
CompanySchema.statics.findActive = function () {
  return this.find({ is_active: true });
};

CompanySchema.statics.findByDomain = function (domain: string) {
  return this.findOne({ domain: domain.toLowerCase(), is_active: true });
};

const Company = (mongoose.models.Company ||
  mongoose.model<ICompany>(
    'Company',
    CompanySchema
  )) as mongoose.Model<ICompany>;

export default Company;
export { Company };
