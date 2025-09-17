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

    // Microclimate Invitation Email Template
    {
      name: 'Default Microclimate Invitation Email',
      type: 'microclimate_invitation',
      channel: 'email',
      subject: 'Quick feedback needed: {{microclimate.title}}',
      title: 'Microclimate Invitation',
      content: `Hello {{recipient.name}},

You've been invited to participate in a quick microclimate feedback session: {{microclimate.title}}

{{microclimate.description}}

This is a brief, real-time feedback opportunity that will help us understand the current pulse of our team and make immediate improvements.

Session Details:
• Duration: {{microclimate.scheduling.duration_minutes}} minutes
• Starts: {{microclimate.scheduling.start_time}}
• Responses are {{#if microclimate.real_time_settings.anonymous_responses}}anonymous{{else}}confidential{{/if}}
• {{#if microclimate.real_time_settings.show_live_results}}Live results will be shared{{else}}Results will be shared after completion{{/if}}

Join the session: {{invitationLink}}

Your quick input makes a big difference in creating a better workplace for everyone.

Questions? Contact {{companyName}} support team.

Best regards,
{{companyName}} Team`,
      html_content: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Microclimate Invitation</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="margin: 0; font-size: 28px;">Quick Feedback Needed</h1>
        <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">{{microclimate.title}}</p>
    </div>

    <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px; margin-bottom: 20px;">Hello <strong>{{recipient.name}}</strong>,</p>

        <p style="font-size: 16px; margin-bottom: 20px;">You've been invited to participate in a quick microclimate feedback session that will help us understand the current pulse of our team.</p>

        {{#if microclimate.description}}
        <div style="background: white; padding: 20px; border-left: 4px solid #4CAF50; margin: 20px 0;">
            <p style="margin: 0; font-style: italic;">{{microclimate.description}}</p>
        </div>
        {{/if}}

        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #4CAF50; margin-top: 0;">Session Details:</h3>
            <ul style="list-style: none; padding: 0;">
                <li style="padding: 5px 0;"><strong>Duration:</strong> {{microclimate.scheduling.duration_minutes}} minutes</li>
                <li style="padding: 5px 0;"><strong>Starts:</strong> {{microclimate.scheduling.start_time}}</li>
                <li style="padding: 5px 0;"><strong>Privacy:</strong> {{#if microclimate.real_time_settings.anonymous_responses}}Anonymous responses{{else}}Confidential responses{{/if}}</li>
                <li style="padding: 5px 0;"><strong>Results:</strong> {{#if microclimate.real_time_settings.show_live_results}}Live results shared{{else}}Results shared after completion{{/if}}</li>
            </ul>
        </div>

        <div style="text-align: center; margin: 30px 0;">
            <a href="{{invitationLink}}" style="background: #4CAF50; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block; font-size: 16px;">Join Session</a>
        </div>

        <p style="font-size: 14px; color: #666; text-align: center; margin-top: 30px;">
            Your quick input makes a big difference in creating a better workplace for everyone.
        </p>

        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

        <p style="font-size: 12px; color: #999; text-align: center;">
            Questions? Contact {{companyName}} support team.<br>
            This invitation expires on {{expiryDate}}.
        </p>
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
          name: 'microclimate',
          type: 'object',
          required: true,
          description: 'Microclimate object',
        },
        {
          name: 'invitationLink',
          type: 'string',
          required: true,
          description: 'Link to join the microclimate',
        },
        {
          name: 'companyName',
          type: 'string',
          required: true,
          description: 'Company name',
        },
        {
          name: 'expiryDate',
          type: 'date',
          required: true,
          description: 'Invitation expiry date',
        },
      ],
      is_active: true,
      is_default: true,
      personalization_rules: [],
      created_by: 'system',
    },

    // Microclimate Invitation In-App Template
    {
      name: 'Default Microclimate Invitation In-App',
      type: 'microclimate_invitation',
      channel: 'in_app',
      title: 'Quick Feedback: {{microclimate.title}}',
      content:
        "You've been invited to participate in a quick microclimate feedback session. Your input will help improve our team dynamics in real-time.",
      variables: [
        {
          name: 'microclimate',
          type: 'object',
          required: true,
          description: 'Microclimate object',
        },
        {
          name: 'invitationLink',
          type: 'string',
          required: true,
          description: 'Link to join the microclimate',
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
    const existingTemplate = await (NotificationTemplate as any).findOne({
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
