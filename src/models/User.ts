/* eslint-disable @typescript-eslint/no-unused-vars */
import mongoose, { Document, Schema } from 'mongoose';
import {
  USER_ROLES,
  UserRole,
  NotificationSettings,
  UserPreferences,
  IUserBase,
  UserDemographics,
} from '../types/user';
import { createPrivacyMiddleware } from '../lib/data-privacy';

// Re-export types for backward compatibility
export { USER_ROLES } from '../types/user';
export type {
  UserRole,
  NotificationSettings,
  UserPreferences,
} from '../types/user';

// Main User interface extending base interface with Mongoose Document
export interface IUser extends Omit<IUserBase, '_id'>, Document {
  password_hash?: string; // Optional for OAuth users

  // Instance methods
  hasPermission(requiredRole: UserRole): boolean;
  canAccessCompany(companyId: string): boolean;
  canAccessDepartment(departmentId: string): boolean;
  getPermissionLevel(): number;
}

// Notification settings schema
const NotificationSettingsSchema = new Schema(
  {
    email_surveys: { type: Boolean, default: true },
    email_microclimates: { type: Boolean, default: true },
    email_action_plans: { type: Boolean, default: true },
    email_reminders: { type: Boolean, default: true },
    push_notifications: { type: Boolean, default: false },
    digest_frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'never'],
      default: 'weekly',
    },
  },
  { _id: false }
);

// User preferences schema
const UserPreferencesSchema = new Schema(
  {
    language: { type: String, default: 'en' },
    timezone: { type: String, default: 'UTC' },
    notification_settings: {
      type: NotificationSettingsSchema,
      default: () => ({}),
    },
    dashboard_layout: { type: String, default: 'default' },
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'light',
    },
  },
  { _id: false }
);

// User demographics schema
const UserDemographicsSchema = new Schema(
  {
    gender: {
      type: String,
      enum: ['male', 'female', 'non_binary', 'prefer_not_to_say', 'other'],
    },
    education_level: {
      type: String,
      enum: [
        'high_school',
        'associate',
        'bachelor',
        'master',
        'doctorate',
        'other',
      ],
    },
    job_title: { type: String, trim: true },
    hierarchy_level: {
      type: String,
      enum: ['entry', 'mid', 'senior', 'executive', 'c_level'],
    },
    work_location: {
      type: String,
      enum: ['remote', 'hybrid', 'onsite'],
    },
    site_location: { type: String, trim: true },
    tenure_months: { type: Number, min: 0 },
    previous_experience_years: { type: Number, min: 0 },
    team_size: { type: Number, min: 0 },
    reports_count: { type: Number, min: 0, default: 0 },
    custom_attributes: { type: Schema.Types.Mixed, default: {} },
  },
  { _id: false }
);

// Consent preferences schema
const ConsentPreferencesSchema = new Schema(
  {
    essential: { type: Boolean, default: true }, // Always required
    analytics: { type: Boolean, default: false },
    marketing: { type: Boolean, default: false },
    personalization: { type: Boolean, default: false },
    thirdParty: { type: Boolean, default: false },
    demographics: { type: Boolean, default: false },
  },
  { _id: false }
);

// Main User schema
const UserSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please provide a valid email address',
      ],
    },
    password_hash: {
      type: String,
      // Not required as OAuth users won't have passwords
      select: false, // Don't include in queries by default for security
    },
    role: {
      type: String,
      enum: Object.keys(USER_ROLES),
      required: [true, 'Role is required'],
      default: 'employee',
    },
    company_id: {
      type: String,
      required: function () {
        return this.role !== 'super_admin';
      },
      trim: true,
    },
    department_id: {
      type: String,
      required: function () {
        return this.role !== 'super_admin';
      },
      trim: true,
    },
    preferences: {
      type: UserPreferencesSchema,
      default: () => ({}),
    },
    demographics: {
      type: UserDemographicsSchema,
      default: () => ({}),
    },
    consent_preferences: {
      type: ConsentPreferencesSchema,
      default: () => ({}),
    },
    consent_updated_at: {
      type: Date,
      default: Date.now,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    last_login: {
      type: Date,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

// Indexes for performance
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ company_id: 1, role: 1 });
UserSchema.index({ department_id: 1 });
UserSchema.index({ company_id: 1, department_id: 1 });
UserSchema.index({ is_active: 1 });

// Instance methods
UserSchema.methods.hasPermission = function (requiredRole: UserRole): boolean {
  const userLevel = USER_ROLES[this.role as UserRole];
  const requiredLevel = USER_ROLES[requiredRole];
  return userLevel >= requiredLevel;
};

UserSchema.methods.canAccessCompany = function (companyId: string): boolean {
  // Super admins can access any company
  if (this.role === 'super_admin') {
    return true;
  }
  // Other roles can only access their own company
  return this.company_id === companyId;
};

UserSchema.methods.canAccessDepartment = function (
  departmentId: string
): boolean {
  // Super admins and company admins can access any department in their scope
  if (this.role === 'super_admin') {
    return true;
  }
  if (this.role === 'company_admin') {
    return true; // Company admins can access all departments in their company
  }
  // Other roles can only access their own department
  return this.department_id === departmentId;
};

UserSchema.methods.getPermissionLevel = function (): number {
  return USER_ROLES[this.role as UserRole];
};

// Static methods for role-based queries
UserSchema.statics.findByRole = function (role: UserRole) {
  return this.find({ role, is_active: true });
};

UserSchema.statics.findByCompany = function (companyId: string) {
  return this.find({ company_id: companyId, is_active: true });
};

UserSchema.statics.findByDepartment = function (departmentId: string) {
  return this.find({ department_id: departmentId, is_active: true });
};

// Privacy middleware
const userPrivacyMiddleware = createPrivacyMiddleware('user_data');

// Pre-save middleware for validation and privacy
UserSchema.pre('save', function (next) {
  // Ensure super_admin doesn't have company/department restrictions
  if (this.role === 'super_admin') {
    // Super admins can have empty company_id and department_id for global access
    if (!this.company_id || this.company_id === '') this.company_id = 'global';
    if (!this.department_id || this.department_id === '')
      this.department_id = 'global';
  }

  // Skip privacy processing during save - we only want to process data for retrieval/display
  // The beforeSave middleware was corrupting the actual data in the database
  // Privacy processing should only happen on retrieval, not storage

  next();
});

// Post-find middleware for privacy
UserSchema.post(['find', 'findOne', 'findOneAndUpdate'], function (docs) {
  if (!docs) return;

  // Skip privacy processing during authentication
  // Check if this query is for authentication by looking at the query context
  const isAuthQuery = this.getOptions()?.skipPrivacy === true;
  if (isAuthQuery) {
    return;
  }

  const processDoc = (doc: Document) => {
    if (doc && typeof doc.toObject === 'function') {
      const processed = userPrivacyMiddleware.afterRetrieve(doc.toObject());
      Object.assign(doc, processed);
    }
  };

  if (Array.isArray(docs)) {
    docs.forEach(processDoc);
  } else {
    processDoc(docs);
  }
});

// Export the model
const User = (mongoose.models.User ||
  mongoose.model<IUser>('User', UserSchema)) as mongoose.Model<IUser>;

export default User;
export { User };
