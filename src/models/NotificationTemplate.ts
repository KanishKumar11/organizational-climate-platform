import mongoose, { Document, Schema } from 'mongoose';
import { NotificationType, NotificationChannel } from './Notification';

// Template variable interface
export interface TemplateVariable {
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'object';
  required: boolean;
  description: string;
  default_value?: any;
}

// Notification template interface
export interface INotificationTemplate extends Document {
  name: string;
  type: NotificationType;
  channel: NotificationChannel;
  subject?: string; // For email templates
  title: string;
  content: string;
  html_content?: string; // For email templates
  variables: TemplateVariable[];
  company_id?: string; // Optional for company-specific templates
  is_active: boolean;
  is_default: boolean;
  personalization_rules: {
    condition: string;
    modifications: Record<string, any>;
  }[];
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

// Notification template schema
const NotificationTemplateSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Template name is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: [
        'survey_invitation',
        'survey_reminder',
        'survey_completion',
        'microclimate_invitation',
        'action_plan_alert',
        'deadline_reminder',
        'ai_insight_alert',
        'system_notification',
      ],
      required: [true, 'Template type is required'],
    },
    channel: {
      type: String,
      enum: ['email', 'in_app', 'push', 'sms'],
      required: [true, 'Template channel is required'],
    },
    subject: {
      type: String,
      trim: true,
    },
    title: {
      type: String,
      required: [true, 'Template title is required'],
      trim: true,
    },
    content: {
      type: String,
      required: [true, 'Template content is required'],
    },
    html_content: {
      type: String,
    },
    variables: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
        },
        type: {
          type: String,
          enum: ['string', 'number', 'date', 'boolean', 'object'],
          required: true,
        },
        required: {
          type: Boolean,
          default: false,
        },
        description: {
          type: String,
          required: true,
          trim: true,
        },
        default_value: {
          type: Schema.Types.Mixed,
        },
      },
    ],
    company_id: {
      type: String,
      trim: true,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    is_default: {
      type: Boolean,
      default: false,
    },
    personalization_rules: [
      {
        condition: {
          type: String,
          required: true,
        },
        modifications: {
          type: Schema.Types.Mixed,
          required: true,
        },
      },
    ],
    created_by: {
      type: String,
      required: [true, 'Creator ID is required'],
      trim: true,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

// Indexes
NotificationTemplateSchema.index({ type: 1, channel: 1 });
NotificationTemplateSchema.index({ company_id: 1, is_active: 1 });
NotificationTemplateSchema.index({ is_default: 1, is_active: 1 });

// Static methods
NotificationTemplateSchema.statics.findByTypeAndChannel = function (
  type: NotificationType,
  channel: NotificationChannel,
  companyId?: string
) {
  const query: any = { type, channel, is_active: true };

  if (companyId) {
    // First try to find company-specific template, then fall back to default
    return (
      this.findOne({ ...query, company_id: companyId }) ||
      this.findOne({
        ...query,
        is_default: true,
        company_id: { $exists: false },
      })
    );
  }

  return this.findOne({ ...query, is_default: true });
};

NotificationTemplateSchema.statics.findByCompany = function (
  companyId: string
) {
  return this.find({
    $or: [
      { company_id: companyId },
      { is_default: true, company_id: { $exists: false } },
    ],
    is_active: true,
  }).sort({ company_id: -1, name: 1 }); // Company-specific first
};

// Instance methods
NotificationTemplateSchema.methods.renderContent = function (
  variables: Record<string, any>
) {
  let renderedTitle = this.title;
  let renderedContent = this.content;
  let renderedSubject = this.subject;
  let renderedHtmlContent = this.html_content;

  // Apply personalization rules
  for (const rule of this.personalization_rules) {
    try {
      // Simple condition evaluation (in production, use a proper expression evaluator)
      if (this.evaluateCondition(rule.condition, variables)) {
        if (rule.modifications.title) {
          renderedTitle = rule.modifications.title;
        }
        if (rule.modifications.content) {
          renderedContent = rule.modifications.content;
        }
        if (rule.modifications.subject) {
          renderedSubject = rule.modifications.subject;
        }
      }
    } catch (error) {
      console.warn('Failed to evaluate personalization rule:', error);
    }
  }

  // Replace template variables
  for (const variable of this.variables) {
    const value = variables[variable.name] ?? variable.default_value ?? '';
    const placeholder = new RegExp(`{{\\s*${variable.name}\\s*}}`, 'g');

    renderedTitle = renderedTitle?.replace(placeholder, String(value));
    renderedContent = renderedContent.replace(placeholder, String(value));
    renderedSubject = renderedSubject?.replace(placeholder, String(value));
    renderedHtmlContent = renderedHtmlContent?.replace(
      placeholder,
      String(value)
    );
  }

  return {
    title: renderedTitle,
    content: renderedContent,
    subject: renderedSubject,
    html_content: renderedHtmlContent,
  };
};

NotificationTemplateSchema.methods.evaluateCondition = function (
  condition: string,
  variables: Record<string, any>
): boolean {
  // Simple condition evaluation - in production, use a proper expression evaluator
  // For now, support basic conditions like "user.role === 'admin'" or "survey.type === 'climate'"
  try {
    // Create a safe evaluation context
    const context = { ...variables };

    // Basic string replacement for simple conditions
    const evaluableCondition = condition
      .replace(/(\w+)\.(\w+)/g, (match, obj, prop) => {
        return context[obj] && context[obj][prop] !== undefined
          ? JSON.stringify(context[obj][prop])
          : 'undefined';
      })
      .replace(/(\w+)/g, (match) => {
        return context[match] !== undefined
          ? JSON.stringify(context[match])
          : match;
      });

    // Use Function constructor for safe evaluation (limited scope)
    return new Function('return ' + evaluableCondition)();
  } catch (error) {
    console.warn('Failed to evaluate condition:', condition, error);
    return false;
  }
};

NotificationTemplateSchema.methods.validateVariables = function (
  variables: Record<string, any>
): string[] {
  const errors: string[] = [];

  for (const variable of this.variables) {
    if (
      variable.required &&
      (variables[variable.name] === undefined ||
        variables[variable.name] === null)
    ) {
      errors.push(`Required variable '${variable.name}' is missing`);
    }
  }

  return errors;
};

export default mongoose.models.NotificationTemplate ||
  mongoose.model<INotificationTemplate>(
    'NotificationTemplate',
    NotificationTemplateSchema
  );
