import { TransactionalEmailsApi, SendSmtpEmail } from '@getbrevo/brevo';
import {
  EmailService,
  SurveyInvitationData,
  MicroclimateInvitationData,
  UserInvitationEmailData,
  generateSurveyInvitationTemplate,
  generateSurveyReminderTemplate,
  generateMicroclimateInvitationTemplate,
  generateMicroclimateReminderTemplate,
  generateUserInvitationTemplate,
} from '../email';

export class BrevoEmailService implements EmailService {
  private apiInstance: TransactionalEmailsApi;

  constructor() {
    // Configure Brevo API client
    this.apiInstance = new TransactionalEmailsApi();
    (this.apiInstance as any).authentications.apiKey.apiKey =
      process.env.BREVO_API_KEY;
  }

  async sendSurveyInvitation(data: SurveyInvitationData): Promise<boolean> {
    try {
      const template = generateSurveyInvitationTemplate(data);

      const sendSmtpEmail = new SendSmtpEmail();
      sendSmtpEmail.subject = template.subject;
      sendSmtpEmail.htmlContent = template.html;
      sendSmtpEmail.textContent = template.text;
      sendSmtpEmail.sender = {
        name: data.companyName || 'Organizational Climate Platform',
        email:
          process.env.BREVO_FROM_EMAIL ||
          process.env.SMTP_FROM ||
          'noreply@yourcompany.com',
      };
      sendSmtpEmail.to = [
        {
          email: data.recipient.email,
          name: data.recipient.name,
        },
      ];

      // Add custom headers for tracking
      sendSmtpEmail.headers = {
        'X-Survey-ID': data.survey._id?.toString() || '',
        'X-Survey-Type': data.survey.type || 'survey',
        'X-Company-ID': data.survey.company_id?.toString() || '',
      };

      // Add tags for analytics
      sendSmtpEmail.tags = ['survey-invitation', data.survey.type || 'general'];

      const result = await this.apiInstance.sendTransacEmail(sendSmtpEmail);

      console.log('✅ Survey invitation sent via Brevo:', {
        messageId: result.body.messageId,
        to: data.recipient.email,
        subject: template.subject,
      });

      return true;
    } catch (error) {
      console.error('❌ Failed to send survey invitation via Brevo:', error);
      return false;
    }
  }

  async sendSurveyReminder(data: SurveyInvitationData): Promise<boolean> {
    try {
      const template = generateSurveyReminderTemplate(data);

      const sendSmtpEmail = new SendSmtpEmail();
      sendSmtpEmail.subject = template.subject;
      sendSmtpEmail.htmlContent = template.html;
      sendSmtpEmail.textContent = template.text;
      sendSmtpEmail.sender = {
        name: data.companyName || 'Organizational Climate Platform',
        email:
          process.env.BREVO_FROM_EMAIL ||
          process.env.SMTP_FROM ||
          'noreply@yourcompany.com',
      };
      sendSmtpEmail.to = [
        {
          email: data.recipient.email,
          name: data.recipient.name,
        },
      ];

      // Add custom headers for tracking
      sendSmtpEmail.headers = {
        'X-Survey-ID': data.survey._id?.toString() || '',
        'X-Survey-Type': data.survey.type || 'survey',
        'X-Company-ID': data.survey.company_id?.toString() || '',
        'X-Reminder-Count': (data.reminderCount || 1).toString(),
      };

      // Add tags for analytics
      sendSmtpEmail.tags = ['survey-reminder', data.survey.type || 'general'];

      const result = await this.apiInstance.sendTransacEmail(sendSmtpEmail);

      console.log('✅ Survey reminder sent via Brevo:', {
        messageId: result.body.messageId,
        to: data.recipient.email,
        subject: template.subject,
        reminderCount: data.reminderCount || 1,
      });

      return true;
    } catch (error) {
      console.error('❌ Failed to send survey reminder via Brevo:', error);
      return false;
    }
  }

  async sendSurveyCompletion(data: SurveyInvitationData): Promise<boolean> {
    try {
      const sendSmtpEmail = new SendSmtpEmail();
      sendSmtpEmail.subject = `Thank you for completing: ${data.survey.title}`;
      sendSmtpEmail.htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Thank You!</h2>
          <p>Dear ${data.recipient.name},</p>
          <p>Thank you for completing the survey "${data.survey.title}". Your feedback is valuable and will help ${data.companyName} improve our organizational climate.</p>
          <p>We appreciate your time and input.</p>
          <p>Best regards,<br>${data.companyName} Team</p>
        </div>
      `;
      sendSmtpEmail.textContent = `
        Thank You!
        
        Dear ${data.recipient.name},
        
        Thank you for completing the survey "${data.survey.title}". Your feedback is valuable and will help ${data.companyName} improve our organizational climate.
        
        We appreciate your time and input.
        
        Best regards,
        ${data.companyName} Team
      `;
      sendSmtpEmail.sender = {
        name: data.companyName || 'Organizational Climate Platform',
        email:
          process.env.BREVO_FROM_EMAIL ||
          process.env.SMTP_FROM ||
          'noreply@yourcompany.com',
      };
      sendSmtpEmail.to = [
        {
          email: data.recipient.email,
          name: data.recipient.name,
        },
      ];

      // Add tags for analytics
      sendSmtpEmail.tags = ['survey-completion', data.survey.type || 'general'];

      const result = await this.apiInstance.sendTransacEmail(sendSmtpEmail);

      console.log('✅ Survey completion confirmation sent via Brevo:', {
        messageId: result.body.messageId,
        to: data.recipient.email,
      });

      return true;
    } catch (error) {
      console.error(
        '❌ Failed to send survey completion confirmation via Brevo:',
        error
      );
      return false;
    }
  }

  async sendMicroclimateInvitation(
    data: MicroclimateInvitationData
  ): Promise<boolean> {
    try {
      const template = generateMicroclimateInvitationTemplate(data);

      const sendSmtpEmail = new SendSmtpEmail();
      sendSmtpEmail.subject = template.subject;
      sendSmtpEmail.htmlContent = template.html;
      sendSmtpEmail.textContent = template.text;
      sendSmtpEmail.sender = {
        name: data.companyName || 'Organizational Climate Platform',
        email:
          process.env.BREVO_FROM_EMAIL ||
          process.env.SMTP_FROM ||
          'noreply@yourcompany.com',
      };
      sendSmtpEmail.to = [
        {
          email: data.recipient.email,
          name: data.recipient.name,
        },
      ];

      // Add custom headers for tracking
      sendSmtpEmail.headers = {
        'X-Microclimate-ID': data.microclimate._id?.toString() || '',
        'X-Company-ID': data.microclimate.company_id?.toString() || '',
      };

      // Add tags for analytics
      sendSmtpEmail.tags = ['microclimate-invitation', 'real-time-feedback'];

      const result = await this.apiInstance.sendTransacEmail(sendSmtpEmail);

      console.log('✅ Microclimate invitation sent via Brevo:', {
        messageId: result.body.messageId,
        to: data.recipient.email,
        subject: template.subject,
      });

      return true;
    } catch (error) {
      console.error(
        '❌ Failed to send microclimate invitation via Brevo:',
        error
      );
      return false;
    }
  }

  async sendMicroclimateReminder(
    data: MicroclimateInvitationData
  ): Promise<boolean> {
    try {
      const template = generateMicroclimateReminderTemplate(data);

      const sendSmtpEmail = new SendSmtpEmail();
      sendSmtpEmail.subject = template.subject;
      sendSmtpEmail.htmlContent = template.html;
      sendSmtpEmail.textContent = template.text;
      sendSmtpEmail.sender = {
        name: data.companyName || 'Organizational Climate Platform',
        email:
          process.env.BREVO_FROM_EMAIL ||
          process.env.SMTP_FROM ||
          'noreply@yourcompany.com',
      };
      sendSmtpEmail.to = [
        {
          email: data.recipient.email,
          name: data.recipient.name,
        },
      ];

      // Add custom headers for tracking
      sendSmtpEmail.headers = {
        'X-Microclimate-ID': data.microclimate._id?.toString() || '',
        'X-Company-ID': data.microclimate.company_id?.toString() || '',
        'X-Reminder-Count': (data.reminderCount || 1).toString(),
      };

      // Add tags for analytics
      sendSmtpEmail.tags = ['microclimate-reminder', 'real-time-feedback'];

      const result = await this.apiInstance.sendTransacEmail(sendSmtpEmail);

      console.log('✅ Microclimate reminder sent via Brevo:', {
        messageId: result.body.messageId,
        to: data.recipient.email,
        subject: template.subject,
        reminderCount: data.reminderCount || 1,
      });

      return true;
    } catch (error) {
      console.error(
        '❌ Failed to send microclimate reminder via Brevo:',
        error
      );
      return false;
    }
  }

  async sendUserInvitation(data: UserInvitationEmailData): Promise<boolean> {
    try {
      // Convert company branding to corporate branding format
      const corporateBranding = data.company?.branding
        ? {
            ...data.company.branding,
            company_name: data.company_name,
          }
        : undefined;

      const template = generateUserInvitationTemplate(data, corporateBranding);

      const sendSmtpEmail = new SendSmtpEmail();
      sendSmtpEmail.subject = template.subject;
      sendSmtpEmail.htmlContent = template.html;
      sendSmtpEmail.textContent = template.text;
      sendSmtpEmail.sender = {
        name: data.company_name || 'Organizational Climate Platform',
        email:
          process.env.BREVO_FROM_EMAIL ||
          process.env.SMTP_FROM ||
          'noreply@yourcompany.com',
      };
      sendSmtpEmail.to = [
        {
          email: data.recipient_email,
          name: data.recipient_email.split('@')[0], // Use email prefix as name fallback
        },
      ];

      // Add tags for tracking
      sendSmtpEmail.tags = ['user_invitation', data.invitation_type, data.role];

      const result = await this.apiInstance.sendTransacEmail(sendSmtpEmail);
      console.log('User invitation sent successfully:', result);
      return true;
    } catch (error) {
      console.error('Failed to send user invitation:', error);
      return false;
    }
  }
}
