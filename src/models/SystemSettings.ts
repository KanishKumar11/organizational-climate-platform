import mongoose, { Document, Schema } from 'mongoose';

// System settings interface
export interface ISystemSettings extends Document {
  login_enabled: boolean;
  maintenance_mode: boolean;
  maintenance_message?: string;
  max_login_attempts: number;
  session_timeout: number; // in minutes
  password_policy: {
    min_length: number;
    require_uppercase: boolean;
    require_lowercase: boolean;
    require_numbers: boolean;
    require_special_chars: boolean;
  };
  email_settings: {
    smtp_enabled: boolean;
    from_email?: string;
    smtp_host?: string;
    smtp_port?: number;
  };
  created_at: Date;
  updated_at: Date;
}

// System settings schema
const SystemSettingsSchema = new Schema(
  {
    login_enabled: {
      type: Boolean,
      default: true,
      required: true,
    },
    maintenance_mode: {
      type: Boolean,
      default: false,
      required: true,
    },
    maintenance_message: {
      type: String,
      default: 'System is under maintenance. Please try again later.',
    },
    max_login_attempts: {
      type: Number,
      default: 5,
      min: 1,
      max: 20,
    },
    session_timeout: {
      type: Number,
      default: 1440, // 24 hours in minutes
      min: 30,
      max: 10080, // 1 week in minutes
    },
    password_policy: {
      min_length: {
        type: Number,
        default: 8,
        min: 6,
        max: 128,
      },
      require_uppercase: {
        type: Boolean,
        default: true,
      },
      require_lowercase: {
        type: Boolean,
        default: true,
      },
      require_numbers: {
        type: Boolean,
        default: true,
      },
      require_special_chars: {
        type: Boolean,
        default: false,
      },
    },
    email_settings: {
      smtp_enabled: {
        type: Boolean,
        default: false,
      },
      from_email: {
        type: String,
        validate: {
          validator: function(v: string) {
            return !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
          },
          message: 'Invalid email format',
        },
      },
      smtp_host: {
        type: String,
      },
      smtp_port: {
        type: Number,
        min: 1,
        max: 65535,
      },
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

// Ensure only one settings document exists
SystemSettingsSchema.index({}, { unique: true });

// Static method to get or create settings
SystemSettingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

// Static method to update settings
SystemSettingsSchema.statics.updateSettings = async function(updates: Partial<ISystemSettings>) {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create(updates);
  } else {
    Object.assign(settings, updates);
    await settings.save();
  }
  return settings;
};

const SystemSettings = mongoose.models.SystemSettings || mongoose.model<ISystemSettings>('SystemSettings', SystemSettingsSchema);

export default SystemSettings;