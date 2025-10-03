import mongoose, { Schema, Document } from 'mongoose';

/**
 * SurveyDistribution Model
 * Manages URLs, QR codes, and access rules for survey distribution
 */

export interface ISurveyDistribution extends Document {
  _id: string;
  survey_id: mongoose.Types.ObjectId;

  // Access configuration
  access_type: 'tokenized' | 'open' | 'hybrid';

  // URLs
  public_url?: string; // For open access
  tokenized_links_generated: number;

  // QR Codes
  qr_code_svg?: string;
  qr_code_png?: string;
  qr_code_pdf_url?: string;
  qr_code_url: string;

  // Access rules
  access_rules: {
    require_login: boolean;
    allow_anonymous: boolean;
    single_response: boolean;
    active_outside_schedule: boolean;
    allowed_domains?: string[];
    blocked_ips?: string[];
    max_responses?: number;
  };

  // QR Code customization
  qr_customization?: {
    size: number;
    color: string;
    background_color: string;
    logo_url?: string;
    error_correction: 'L' | 'M' | 'Q' | 'H';
  };

  // Tracking
  generated_at?: Date;
  regenerated_count: number;
  last_regenerated_at?: Date;
  last_regenerated_by?: mongoose.Types.ObjectId;

  // Stats
  total_accesses: number;
  unique_visitors: number;
  last_accessed_at?: Date;

  created_at: Date;
  updated_at: Date;
}

const SurveyDistributionSchema = new Schema<ISurveyDistribution>(
  {
    survey_id: {
      type: Schema.Types.ObjectId,
      ref: 'Survey',
      required: true,
      unique: true,
      index: true,
    },

    access_type: {
      type: String,
      enum: ['tokenized', 'open', 'hybrid'],
      default: 'tokenized',
    },

    public_url: {
      type: String,
      unique: true,
      sparse: true, // Allow null values
    },

    tokenized_links_generated: {
      type: Number,
      default: 0,
    },

    qr_code_svg: String,
    qr_code_png: String,
    qr_code_pdf_url: String,

    qr_code_url: {
      type: String,
      required: true,
    },

    access_rules: {
      require_login: {
        type: Boolean,
        default: true,
      },
      allow_anonymous: {
        type: Boolean,
        default: false,
      },
      single_response: {
        type: Boolean,
        default: true,
      },
      active_outside_schedule: {
        type: Boolean,
        default: false,
      },
      allowed_domains: [
        {
          type: String,
          lowercase: true,
        },
      ],
      blocked_ips: [String],
      max_responses: Number,
    },

    qr_customization: {
      size: {
        type: Number,
        default: 300,
        min: 100,
        max: 1000,
      },
      color: {
        type: String,
        default: '#000000',
        match: /^#[0-9A-F]{6}$/i,
      },
      background_color: {
        type: String,
        default: '#FFFFFF',
        match: /^#[0-9A-F]{6}$/i,
      },
      logo_url: String,
      error_correction: {
        type: String,
        enum: ['L', 'M', 'Q', 'H'],
        default: 'H', // High error correction for better scanning
      },
    },

    generated_at: Date,

    regenerated_count: {
      type: Number,
      default: 0,
    },

    last_regenerated_at: Date,

    last_regenerated_by: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },

    total_accesses: {
      type: Number,
      default: 0,
    },

    unique_visitors: {
      type: Number,
      default: 0,
    },

    last_accessed_at: Date,

    created_at: {
      type: Date,
      default: Date.now,
    },

    updated_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Update timestamp on save
SurveyDistributionSchema.pre('save', function (next) {
  this.updated_at = new Date();
  next();
});

// Track QR code regeneration
SurveyDistributionSchema.methods.regenerateQR = async function (
  userId: mongoose.Types.ObjectId
) {
  this.regenerated_count += 1;
  this.last_regenerated_at = new Date();
  this.last_regenerated_by = userId;
  return this.save();
};

// Track access
SurveyDistributionSchema.methods.trackAccess = async function (
  isUnique: boolean = false
) {
  this.total_accesses += 1;
  if (isUnique) {
    this.unique_visitors += 1;
  }
  this.last_accessed_at = new Date();
  return this.save();
};

// Generate public URL
SurveyDistributionSchema.methods.generatePublicURL = function (
  baseUrl: string
): string {
  const shortCode = this.survey_id.toString().substring(0, 8);
  return `${baseUrl}/s/${shortCode}`;
};

// Check if access is allowed
SurveyDistributionSchema.methods.isAccessAllowed = function (params: {
  isLoggedIn: boolean;
  userEmail?: string;
  ipAddress?: string;
  currentResponses?: number;
}): { allowed: boolean; reason?: string } {
  const { isLoggedIn, userEmail, ipAddress, currentResponses } = params;

  // Check login requirement
  if (this.access_rules.require_login && !isLoggedIn) {
    return { allowed: false, reason: 'Login required' };
  }

  // Check anonymous access
  if (!this.access_rules.allow_anonymous && !userEmail) {
    return { allowed: false, reason: 'Anonymous access not allowed' };
  }

  // Check domain restrictions
  if (this.access_rules.allowed_domains?.length && userEmail) {
    const domain = userEmail.split('@')[1];
    if (!this.access_rules.allowed_domains.includes(domain)) {
      return { allowed: false, reason: 'Domain not allowed' };
    }
  }

  // Check IP blocks
  if (this.access_rules.blocked_ips?.length && ipAddress) {
    if (this.access_rules.blocked_ips.includes(ipAddress)) {
      return { allowed: false, reason: 'IP address blocked' };
    }
  }

  // Check max responses
  if (this.access_rules.max_responses && currentResponses !== undefined) {
    if (currentResponses >= this.access_rules.max_responses) {
      return { allowed: false, reason: 'Maximum responses reached' };
    }
  }

  return { allowed: true };
};

export default mongoose.models.SurveyDistribution ||
  mongoose.model<ISurveyDistribution>(
    'SurveyDistribution',
    SurveyDistributionSchema
  );
