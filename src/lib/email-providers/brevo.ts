import * as nodemailer from 'nodemailer';
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
  private transporter: nodemailer.Transporter;

  constructor() {
    console.log('🔧 Initializing Gmail SMTP Email Service...');

    // Configure Gmail SMTP transporter
    this.transporter = nodemailer.createTransport({
      host: process.env.BREVO_SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.BREVO_SMTP_PORT || '587'),
      secure: process.env.BREVO_SMTP_PORT === '465', // true for 465 (SSL), false for 587 (TLS)
      auth: {
        user: process.env.BREVO_SMTP_USER,
        pass: process.env.BREVO_SMTP_PASS,
      },
    });

    console.log('📧 Gmail SMTP configuration:', {
      host: process.env.BREVO_SMTP_HOST || 'smtp.gmail.com',
      port: process.env.BREVO_SMTP_PORT || '587',
      secure: process.env.BREVO_SMTP_PORT === '465',
      fromEmail: process.env.BREVO_FROM_EMAIL || 'noreply@yourcompany.com',
      hasAuth: !!(process.env.BREVO_SMTP_USER && process.env.BREVO_SMTP_PASS),
    });
  }

  async sendSurveyInvitation(data: SurveyInvitationData): Promise<boolean> {
    console.log('📤 Preparing to send survey invitation via Zoho SMTP:', {
      surveyId: data.survey._id?.toString(),
      surveyTitle: data.survey.title,
      recipient: data.recipient.email,
      company: data.companyName,
    });

    try {
      const template = generateSurveyInvitationTemplate(data);
      console.log('📝 Generated survey invitation template:', {
        subject: template.subject,
        hasHtml: !!template.html,
        hasText: !!template.text,
      });

      const mailOptions = {
        from: {
          name: data.companyName || 'Organizational Climate Platform',
          address: process.env.BREVO_FROM_EMAIL || 'noreply@yourcompany.com',
        },
        to: {
          name: data.recipient.name,
          address: data.recipient.email,
        },
        subject: template.subject,
        html: template.html,
        text: template.text,
        headers: {
          'X-Survey-ID': data.survey._id?.toString() || '',
          'X-Survey-Type': data.survey.type || 'survey',
          'X-Company-ID': data.survey.company_id?.toString() || '',
        },
      };

      console.log('🚀 Sending survey invitation email...');
      const result = await this.transporter.sendMail(mailOptions);

      console.log('✅ Survey invitation sent successfully via Zoho SMTP:', {
        messageId: result.messageId,
        envelope: result.envelope,
        accepted: result.accepted,
        rejected: result.rejected,
        pending: result.pending,
        to: data.recipient.email,
        subject: template.subject,
        surveyId: data.survey._id?.toString(),
      });

      return true;
    } catch (error) {
      console.error('❌ Failed to send survey invitation via Zoho SMTP:', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        recipient: data.recipient.email,
        surveyId: data.survey._id?.toString(),
        surveyTitle: data.survey.title,
      });
      return false;
    }
  }

  async sendSurveyReminder(data: SurveyInvitationData): Promise<boolean> {
    console.log('📤 Preparing to send survey reminder via Zoho SMTP:', {
      surveyId: data.survey._id?.toString(),
      surveyTitle: data.survey.title,
      recipient: data.recipient.email,
      company: data.companyName,
      reminderCount: data.reminderCount || 1,
    });

    try {
      const template = generateSurveyReminderTemplate(data);
      console.log('📝 Generated survey reminder template:', {
        subject: template.subject,
        hasHtml: !!template.html,
        hasText: !!template.text,
        reminderCount: data.reminderCount || 1,
      });

      const mailOptions = {
        from: {
          name: data.companyName || 'Organizational Climate Platform',
          address: process.env.BREVO_FROM_EMAIL || 'noreply@yourcompany.com',
        },
        to: {
          name: data.recipient.name,
          address: data.recipient.email,
        },
        subject: template.subject,
        html: template.html,
        text: template.text,
        headers: {
          'X-Survey-ID': data.survey._id?.toString() || '',
          'X-Survey-Type': data.survey.type || 'survey',
          'X-Company-ID': data.survey.company_id?.toString() || '',
          'X-Reminder-Count': (data.reminderCount || 1).toString(),
        },
      };

      console.log('🚀 Sending survey reminder email...');
      const result = await this.transporter.sendMail(mailOptions);

      console.log('✅ Survey reminder sent successfully via Zoho SMTP:', {
        messageId: result.messageId,
        envelope: result.envelope,
        accepted: result.accepted,
        rejected: result.rejected,
        pending: result.pending,
        to: data.recipient.email,
        subject: template.subject,
        surveyId: data.survey._id?.toString(),
        reminderCount: data.reminderCount || 1,
      });

      return true;
    } catch (error) {
      console.error('❌ Failed to send survey reminder via Zoho SMTP:', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        recipient: data.recipient.email,
        surveyId: data.survey._id?.toString(),
        surveyTitle: data.survey.title,
        reminderCount: data.reminderCount || 1,
      });
      return false;
    }
  }

  async sendSurveyCompletion(data: SurveyInvitationData): Promise<boolean> {
    console.log(
      '📤 Preparing to send survey completion confirmation via Zoho SMTP:',
      {
        surveyId: data.survey._id?.toString(),
        surveyTitle: data.survey.title,
        recipient: data.recipient.email,
        company: data.companyName,
      }
    );

    try {
      const mailOptions = {
        from: {
          name: data.companyName || 'Organizational Climate Platform',
          address: process.env.BREVO_FROM_EMAIL || 'noreply@yourcompany.com',
        },
        to: {
          name: data.recipient.name,
          address: data.recipient.email,
        },
        subject: `Thank you for completing: ${data.survey.title}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Thank You!</h2>
            <p>Dear ${data.recipient.name},</p>
            <p>Thank you for completing the survey "${data.survey.title}". Your feedback is valuable and will help ${data.companyName} improve our organizational climate.</p>
            <p>We appreciate your time and input.</p>
            <p>Best regards,<br>${data.companyName} Team</p>
          </div>
        `,
        text: `
          Thank You!

          Dear ${data.recipient.name},

          Thank you for completing the survey "${data.survey.title}". Your feedback is valuable and will help ${data.companyName} improve our organizational climate.

          We appreciate your time and input.

          Best regards,
          ${data.companyName} Team
        `,
        headers: {
          'X-Survey-ID': data.survey._id?.toString() || '',
          'X-Survey-Type': data.survey.type || 'survey',
          'X-Company-ID': data.survey.company_id?.toString() || '',
          'X-Completion-Confirmation': 'true',
        },
      };

      console.log('🚀 Sending survey completion confirmation email...');
      const result = await this.transporter.sendMail(mailOptions);

      console.log(
        '✅ Survey completion confirmation sent successfully via Zoho SMTP:',
        {
          messageId: result.messageId,
          envelope: result.envelope,
          accepted: result.accepted,
          rejected: result.rejected,
          pending: result.pending,
          to: data.recipient.email,
          subject: `Thank you for completing: ${data.survey.title}`,
          surveyId: data.survey._id?.toString(),
        }
      );

      return true;
    } catch (error) {
      console.error(
        '❌ Failed to send survey completion confirmation via Zoho SMTP:',
        {
          error: error instanceof Error ? error.message : error,
          stack: error instanceof Error ? error.stack : undefined,
          recipient: data.recipient.email,
          surveyId: data.survey._id?.toString(),
          surveyTitle: data.survey.title,
        }
      );
      return false;
    }
  }

  async sendMicroclimateInvitation(
    data: MicroclimateInvitationData
  ): Promise<boolean> {
    console.log('📤 Preparing to send microclimate invitation via Zoho SMTP:', {
      microclimateId: data.microclimate._id?.toString(),
      recipient: data.recipient.email,
      company: data.companyName,
    });

    try {
      const template = generateMicroclimateInvitationTemplate(data);
      console.log('📝 Generated microclimate invitation template:', {
        subject: template.subject,
        hasHtml: !!template.html,
        hasText: !!template.text,
      });

      const mailOptions = {
        from: {
          name: data.companyName || 'Organizational Climate Platform',
          address: process.env.BREVO_FROM_EMAIL || 'noreply@yourcompany.com',
        },
        to: {
          name: data.recipient.name,
          address: data.recipient.email,
        },
        subject: template.subject,
        html: template.html,
        text: template.text,
        headers: {
          'X-Microclimate-ID': data.microclimate._id?.toString() || '',
          'X-Company-ID': data.microclimate.company_id?.toString() || '',
        },
      };

      console.log('🚀 Sending microclimate invitation email...');
      const result = await this.transporter.sendMail(mailOptions);

      console.log(
        '✅ Microclimate invitation sent successfully via Zoho SMTP:',
        {
          messageId: result.messageId,
          envelope: result.envelope,
          accepted: result.accepted,
          rejected: result.rejected,
          pending: result.pending,
          to: data.recipient.email,
          subject: template.subject,
          microclimateId: data.microclimate._id?.toString(),
        }
      );

      return true;
    } catch (error) {
      console.error(
        '❌ Failed to send microclimate invitation via Zoho SMTP:',
        {
          error: error instanceof Error ? error.message : error,
          stack: error instanceof Error ? error.stack : undefined,
          recipient: data.recipient.email,
          microclimateId: data.microclimate._id?.toString(),
        }
      );
      return false;
    }
  }

  async sendMicroclimateReminder(
    data: MicroclimateInvitationData
  ): Promise<boolean> {
    console.log('📤 Preparing to send microclimate reminder via Zoho SMTP:', {
      microclimateId: data.microclimate._id?.toString(),
      recipient: data.recipient.email,
      company: data.companyName,
      reminderCount: data.reminderCount || 1,
    });

    try {
      const template = generateMicroclimateReminderTemplate(data);
      console.log('📝 Generated microclimate reminder template:', {
        subject: template.subject,
        hasHtml: !!template.html,
        hasText: !!template.text,
        reminderCount: data.reminderCount || 1,
      });

      const mailOptions = {
        from: {
          name: data.companyName || 'Organizational Climate Platform',
          address: process.env.BREVO_FROM_EMAIL || 'noreply@yourcompany.com',
        },
        to: {
          name: data.recipient.name,
          address: data.recipient.email,
        },
        subject: template.subject,
        html: template.html,
        text: template.text,
        headers: {
          'X-Microclimate-ID': data.microclimate._id?.toString() || '',
          'X-Company-ID': data.microclimate.company_id?.toString() || '',
          'X-Reminder-Count': (data.reminderCount || 1).toString(),
        },
      };

      console.log('🚀 Sending microclimate reminder email...');
      const result = await this.transporter.sendMail(mailOptions);

      console.log('✅ Microclimate reminder sent successfully via Zoho SMTP:', {
        messageId: result.messageId,
        envelope: result.envelope,
        accepted: result.accepted,
        rejected: result.rejected,
        pending: result.pending,
        to: data.recipient.email,
        subject: template.subject,
        microclimateId: data.microclimate._id?.toString(),
        reminderCount: data.reminderCount || 1,
      });

      return true;
    } catch (error) {
      console.error('❌ Failed to send microclimate reminder via Zoho SMTP:', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        recipient: data.recipient.email,
        microclimateId: data.microclimate._id?.toString(),
        reminderCount: data.reminderCount || 1,
      });
      return false;
    }
  }

  async sendUserInvitation(data: UserInvitationEmailData): Promise<boolean> {
    console.log('📤 Preparing to send user invitation via Zoho SMTP:', {
      recipient: data.recipient_email,
      company: data.company_name,
      invitationType: data.invitation_type,
      role: data.role,
      hasCompanyBranding: !!data.company?.branding,
    });

    try {
      // Convert company branding to corporate branding format
      const corporateBranding = data.company?.branding
        ? {
            ...data.company.branding,
            company_name: data.company_name,
          }
        : undefined;

      const template = generateUserInvitationTemplate(data, corporateBranding);
      console.log('📝 Generated user invitation template:', {
        subject: template.subject,
        hasHtml: !!template.html,
        hasText: !!template.text,
        invitationType: data.invitation_type,
        role: data.role,
      });

      const mailOptions = {
        from: {
          name: data.company_name || 'Organizational Climate Platform',
          address: process.env.BREVO_FROM_EMAIL || 'noreply@yourcompany.com',
        },
        to: {
          name: data.recipient_email.split('@')[0], // Use email prefix as name fallback
          address: data.recipient_email,
        },
        subject: template.subject,
        html: template.html,
        text: template.text,
        headers: {
          'X-Invitation-Type': data.invitation_type,
          'X-User-Role': data.role,
        },
      };

      console.log('🚀 Sending user invitation email...');
      const result = await this.transporter.sendMail(mailOptions);

      console.log('✅ User invitation sent successfully via Brevo SMTP:', {
        messageId: result.messageId,
        envelope: result.envelope,
        accepted: result.accepted,
        rejected: result.rejected,
        pending: result.pending,
        to: data.recipient_email,
        subject: template.subject,
        invitationType: data.invitation_type,
        role: data.role,
      });

      return true;
    } catch (error) {
      console.error('❌ Failed to send user invitation via Zoho SMTP:', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        recipient: data.recipient_email,
        invitationType: data.invitation_type,
        role: data.role,
        company: data.company_name,
      });
      return false;
    }
  }
}
