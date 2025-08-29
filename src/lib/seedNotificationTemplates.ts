import NotificationTemplate from '@/models/NotificationTemplate';
import { connectDB } from './mongodb';

export async function seedNotificationTemplates() {
  await connectDB();

  const templates = [
    // Survey Invitation Email Template
    {
      name: 'Default Survey Invitation Email',
      type: 'survey_invitation',
      channel: 'email',
      subject: 'Your feedback is needed: {{survey.title}}',
      title: 'Survey Invitation',
      content: `Hello {{recipient.name}},

You've been invited to participate in a survey: {{survey.title}}

{{survey.description}}

Your feedback is valuable and will help {{companyName}} improve our organizational climate and culture.

Survey Details:
• Estimated time: {{survey.settings.time_limit_minutes}} minutes
• Responses are {{#if survey.settings.anonymous}}anonymous{{else}}confidential{{/if}}
• Survey closes: {{expiryDate}}

Take the survey: {{invitationLink}}

This survey is part of {{companyName}}'s commitment to creating a better workplace for everyone.`,
      html_content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{subject}}</title>
</head>
<body style="font-family: 'Segoe UI', sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
    <div style="background: linear-gradient(135deg, #007bff, #007bffdd); color: white; padding: 30px 20px; text-align: center;">
      <h1 style="margin: 0; font-size: 24px; font-weight: 600;">Survey Invitation</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9;">Hello {{recipient.name}},</p>
    </div>
    
    <div style="padding: 30px 20px;">
      <div style="background: #f8f9fa; border-left: 4px solid #007bff; padding: 20px; margin: 20px 0; border-radius: 8px;">
        <h2 style="margin-top: 0; color: #007bff;">{{survey.title}}</h2>
        <p style="margin-bottom: 0;">{{survey.description}}</p>
      </div>
      
      <p>Your feedback is valuable and will help {{companyName}} improve our organizational climate and culture.</p>
      
      <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0;">
        <strong>Survey Details:</strong><br>
        📊 Estimated time: {{survey.settings.time_limit_minutes}} minutes<br>
        🔒 Responses are {{#if survey.settings.anonymous}}anonymous{{else}}confidential{{/if}}<br>
        📅 Survey closes: {{expiryDate}}
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="{{invitationLink}}" style="display: inline-block; background: #007bff; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600;">Take Survey Now</a>
      </div>
    </div>
    
    <div style="font-size: 12px; color: #666; margin-top: 30px; padding: 20px; border-top: 1px solid #eee; text-align: center;">
      <p>This survey is part of {{companyName}}'s commitment to creating a better workplace for everyone.</p>
    </div>
  </div>
</body>
</html>`,
      variables: [
        {
          name: 'recipient',
          type: 'object',
          required: true,
          description: 'Recipient user object',
        },
        {
          name: 'survey',
          type: 'object',
          required: true,
          description: 'Survey object',
        },
        {
          name: 'companyName',
          type: 'string',
          required: true,
          description: 'Company name',
        },
        {
          name: 'invitationLink',
          type: 'string',
          required: true,
          description: 'Survey invitation link',
        },
        {
          name: 'expiryDate',
          type: 'date',
          required: true,
          description: 'Survey expiry date',
        },
      ],
      is_active: true,
      is_default: true,
      personalization_rules: [],
      created_by: 'system',
    },

    // Survey Reminder Email Template
    {
      name: 'Default Survey Reminder Email',
      type: 'survey_reminder',
      channel: 'email',
      subject: 'Reminder: {{survey.title}} - Your input is still needed',
      title: 'Survey Reminder',
      content: `Hello {{recipient.name}},

This is a friendly reminder that you haven't completed the survey: {{survey.title}}

Your feedback is important to us and will help shape improvements at {{companyName}}.

Time remaining: Survey closes on {{expiryDate}}
Estimated time: {{survey.settings.time_limit_minutes}} minutes

Complete the survey: {{invitationLink}}

Thank you for taking the time to share your feedback.`,
      html_content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{subject}}</title>
</head>
<body style="font-family: 'Segoe UI', sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
    <div style="background: linear-gradient(135deg, #ffc107, #ffc107dd); color: white; padding: 30px 20px; text-align: center;">
      <h1 style="margin: 0; font-size: 24px; font-weight: 600;">Survey Reminder</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9;">Hello {{recipient.name}},</p>
    </div>
    
    <div style="padding: 30px 20px;">
      <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 8px; font-weight: 600; color: #856404;">
        ⏰ We haven't heard from you yet and would love your input.
      </div>
      
      <div style="background: #f8f9fa; border-left: 4px solid #007bff; padding: 20px; margin: 20px 0; border-radius: 8px;">
        <h2 style="margin-top: 0; color: #007bff;">{{survey.title}}</h2>
        <p style="margin-bottom: 0;">Your feedback is important to us and will help shape improvements at {{companyName}}.</p>
      </div>
      
      <div style="background: #fff3cd; border: 2px solid #ffc107; padding: 15px; border-radius: 8px; margin: 15px 0; text-align: center; font-weight: 600; color: #856404;">
        📅 Survey closes on {{expiryDate}}
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="{{invitationLink}}" style="display: inline-block; background: #ffc107; color: #212529; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">Complete Survey Now</a>
      </div>
    </div>
    
    <div style="font-size: 12px; color: #666; margin-top: 30px; padding: 20px; border-top: 1px solid #eee; text-align: center;">
      <p>Thank you for taking the time to share your feedback.</p>
    </div>
  </div>
</body>
</html>`,
      variables: [
        {
          name: 'recipient',
          type: 'object',
          required: true,
          description: 'Recipient user object',
        },
        {
          name: 'survey',
          type: 'object',
          required: true,
          description: 'Survey object',
        },
        {
          name: 'companyName',
          type: 'string',
          required: true,
          description: 'Company name',
        },
        {
          name: 'invitationLink',
          type: 'string',
          required: true,
          description: 'Survey invitation link',
        },
        {
          name: 'expiryDate',
          type: 'date',
          required: true,
          description: 'Survey expiry date',
        },
        {
          name: 'reminderCount',
          type: 'number',
          required: false,
          description: 'Reminder count',
          default_value: 1,
        },
      ],
      is_active: true,
      is_default: true,
      personalization_rules: [
        {
          condition: 'reminderCount >= 3',
          modifications: {
            subject: 'Final Reminder: {{survey.title}} - Survey closes soon!',
            title: 'Final Reminder',
          },
        },
      ],
      created_by: 'system',
    },

    // In-App Notification Templates
    {
      name: 'Default Survey Invitation In-App',
      type: 'survey_invitation',
      channel: 'in_app',
      title: 'New Survey: {{survey.title}}',
      content:
        'You have been invited to participate in a survey. Your feedback will help improve our workplace.',
      variables: [
        {
          name: 'survey',
          type: 'object',
          required: true,
          description: 'Survey object',
        },
      ],
      is_active: true,
      is_default: true,
      personalization_rules: [],
      created_by: 'system',
    },

    {
      name: 'Default Survey Reminder In-App',
      type: 'survey_reminder',
      channel: 'in_app',
      title: 'Survey Reminder: {{survey.title}}',
      content:
        "Don't forget to complete your survey. Your input is valuable to us.",
      variables: [
        {
          name: 'survey',
          type: 'object',
          required: true,
          description: 'Survey object',
        },
      ],
      is_active: true,
      is_default: true,
      personalization_rules: [],
      created_by: 'system',
    },

    // Action Plan Alert Template
    {
      name: 'Default Action Plan Alert Email',
      type: 'action_plan_alert',
      channel: 'email',
      subject: 'Action Required: {{actionPlan.title}}',
      title: 'Action Plan Alert',
      content: `Hello {{recipient.name}},

You have been assigned to an action plan: {{actionPlan.title}}

{{actionPlan.description}}

Due Date: {{actionPlan.due_date}}
Priority: {{actionPlan.priority}}

Please review and take the necessary actions.

View Action Plan: {{actionPlanLink}}`,
      variables: [
        {
          name: 'recipient',
          type: 'object',
          required: true,
          description: 'Recipient user object',
        },
        {
          name: 'actionPlan',
          type: 'object',
          required: true,
          description: 'Action plan object',
        },
        {
          name: 'actionPlanLink',
          type: 'string',
          required: true,
          description: 'Action plan link',
        },
      ],
      is_active: true,
      is_default: true,
      personalization_rules: [],
      created_by: 'system',
    },
  ];

  for (const templateData of templates) {
    const existingTemplate = await NotificationTemplate.findOne({
      type: templateData.type,
      channel: templateData.channel,
      is_default: true,
    });

    if (!existingTemplate) {
      const template = new NotificationTemplate(templateData);
      await template.save();
      console.log(`Created notification template: ${templateData.name}`);
    }
  }

  console.log('Notification templates seeded successfully');
}

// Run seeding if called directly
if (require.main === module) {
  seedNotificationTemplates()
    .then(() => {
      console.log('Seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
}
