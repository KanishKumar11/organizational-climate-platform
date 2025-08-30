import { ISurvey } from '@/models/Survey';
import { IUserBase } from '@/types/user';
import { ICompany } from '@/models/Company';

// Email template types
export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

// Survey invitation data
export interface SurveyInvitationData {
  survey: ISurvey;
  recipient: IUserBase;
  invitationLink: string;
  companyName: string;
  expiryDate: Date;
  company?: ICompany;
  reminderCount?: number;
}

// Corporate branding interface
export interface CorporateBranding {
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
  company_name: string;
  website_url?: string;
  support_email?: string;
}

// Email service interface
export interface EmailService {
  sendSurveyInvitation(data: SurveyInvitationData): Promise<boolean>;
  sendSurveyReminder(data: SurveyInvitationData): Promise<boolean>;
  sendSurveyCompletion(data: SurveyInvitationData): Promise<boolean>;
}

// Generate survey invitation email template with corporate branding
export function generateSurveyInvitationTemplate(
  data: SurveyInvitationData,
  branding?: CorporateBranding
): EmailTemplate {
  const { survey, recipient, invitationLink, companyName, expiryDate } = data;

  const subject = `Your feedback is needed: ${survey.title}`;
  const primaryColor = branding?.primary_color || '#007bff';
  const logoHtml = branding?.logo_url
    ? `<img src="${branding.logo_url}" alt="${companyName}" style="max-height: 60px; margin-bottom: 20px;">`
    : '';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      <style>
        body { 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
          line-height: 1.6; 
          color: #333; 
          margin: 0; 
          padding: 0; 
          background-color: #f5f5f5; 
        }
        .container { 
          max-width: 600px; 
          margin: 0 auto; 
          background: white; 
          border-radius: 12px; 
          overflow: hidden; 
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); 
        }
        .header { 
          background: linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd); 
          color: white; 
          padding: 30px 20px; 
          text-align: center; 
        }
        .header h1 { 
          margin: 0; 
          font-size: 24px; 
          font-weight: 600; 
        }
        .content { 
          padding: 30px 20px; 
        }
        .survey-card {
          background: #f8f9fa;
          border-left: 4px solid ${primaryColor};
          padding: 20px;
          margin: 20px 0;
          border-radius: 8px;
        }
        .button { 
          display: inline-block; 
          background: ${primaryColor}; 
          color: white; 
          padding: 14px 28px; 
          text-decoration: none; 
          border-radius: 8px; 
          margin: 20px 0; 
          font-weight: 600;
          text-align: center;
          transition: background-color 0.3s ease;
        }
        .button:hover {
          background: ${primaryColor}dd;
        }
        .details {
          background: #f8f9fa;
          padding: 15px;
          border-radius: 8px;
          margin: 15px 0;
        }
        .footer { 
          font-size: 12px; 
          color: #666; 
          margin-top: 30px; 
          padding-top: 20px;
          border-top: 1px solid #eee;
          text-align: center;
        }
        .footer a {
          color: ${primaryColor};
          text-decoration: none;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          ${logoHtml}
          <h1>Survey Invitation</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Hello ${recipient.name},</p>
        </div>
        
        <div class="content">
          <div class="survey-card">
            <h2 style="margin-top: 0; color: ${primaryColor};">${survey.title}</h2>
            ${survey.description ? `<p style="margin-bottom: 0;">${survey.description}</p>` : ''}
          </div>
          
          <p>Your feedback is valuable and will help ${companyName} improve our organizational climate and culture. This survey is designed to gather insights that will drive positive change in our workplace.</p>
          
          <div class="details">
            <strong>Survey Details:</strong><br>
            📊 Estimated time: ${survey.settings?.time_limit_minutes || 10} minutes<br>
            🔒 Responses are ${survey.settings?.anonymous ? 'anonymous' : 'confidential'}<br>
            📅 Survey closes: ${expiryDate.toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${invitationLink}" class="button">Take Survey Now</a>
          </div>
          
          <p style="font-size: 14px; color: #666;">If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="word-break: break-all; background: #f8f9fa; padding: 10px; border-radius: 4px; font-family: monospace; font-size: 12px;">
            <a href="${invitationLink}" style="color: ${primaryColor};">${invitationLink}</a>
          </p>
        </div>
        
        <div class="footer">
          <p>This survey is part of ${companyName}'s commitment to creating a better workplace for everyone.</p>
          <p>Questions? Contact ${branding?.support_email || 'your HR department'}</p>
          ${branding?.website_url ? `<p><a href="${branding.website_url}">${companyName}</a></p>` : ''}
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    Survey Invitation
    
    Hello ${recipient.name},
    
    You've been invited to participate in a survey: ${survey.title}
    
    ${survey.description || ''}
    
    Your feedback is valuable and will help ${companyName} improve our organizational climate and culture.
    
    Survey Details:
    • Estimated time: ${survey.settings?.time_limit_minutes || 10} minutes
    • Responses are ${survey.settings?.anonymous ? 'anonymous' : 'confidential'}
    • Survey closes: ${expiryDate.toLocaleDateString()}
    
    Take the survey: ${invitationLink}
    
    This survey is part of ${companyName}'s commitment to creating a better workplace for everyone.
    Questions? Contact ${branding?.support_email || 'your HR department'}
  `;

  return { subject, html, text };
}

// Generate survey reminder email template with escalation
export function generateSurveyReminderTemplate(
  data: SurveyInvitationData,
  branding?: CorporateBranding
): EmailTemplate {
  const {
    survey,
    recipient,
    invitationLink,
    companyName,
    expiryDate,
    reminderCount = 1,
  } = data;

  const urgencyLevel =
    reminderCount >= 3 ? 'final' : reminderCount >= 2 ? 'urgent' : 'gentle';
  const subjectPrefix =
    urgencyLevel === 'final'
      ? 'Final Reminder'
      : urgencyLevel === 'urgent'
        ? 'Urgent Reminder'
        : 'Friendly Reminder';

  const subject = `${subjectPrefix}: ${survey.title} - Your input is still needed`;
  const primaryColor = branding?.primary_color || '#ffc107';
  const urgencyColor =
    urgencyLevel === 'final'
      ? '#dc3545'
      : urgencyLevel === 'urgent'
        ? '#fd7e14'
        : '#ffc107';

  const logoHtml = branding?.logo_url
    ? `<img src="${branding.logo_url}" alt="${companyName}" style="max-height: 60px; margin-bottom: 20px;">`
    : '';

  const urgencyMessage =
    urgencyLevel === 'final'
      ? 'This is your final reminder - the survey closes soon!'
      : urgencyLevel === 'urgent'
        ? 'Time is running out - please complete the survey soon.'
        : "We haven't heard from you yet and would love your input.";

  const daysRemaining = Math.ceil(
    (expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  const timeRemainingText =
    daysRemaining <= 1
      ? 'Survey closes today!'
      : daysRemaining <= 3
        ? `Only ${daysRemaining} days remaining`
        : `${daysRemaining} days remaining`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      <style>
        body { 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
          line-height: 1.6; 
          color: #333; 
          margin: 0; 
          padding: 0; 
          background-color: #f5f5f5; 
        }
        .container { 
          max-width: 600px; 
          margin: 0 auto; 
          background: white; 
          border-radius: 12px; 
          overflow: hidden; 
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); 
        }
        .header { 
          background: linear-gradient(135deg, ${urgencyColor}, ${urgencyColor}dd); 
          color: white; 
          padding: 30px 20px; 
          text-align: center; 
        }
        .header h1 { 
          margin: 0; 
          font-size: 24px; 
          font-weight: 600; 
        }
        .urgency-banner {
          background: ${urgencyColor}22;
          border-left: 4px solid ${urgencyColor};
          padding: 15px;
          margin: 20px 0;
          border-radius: 8px;
          font-weight: 600;
          color: ${urgencyColor === '#dc3545' ? '#721c24' : '#856404'};
        }
        .content { 
          padding: 30px 20px; 
        }
        .survey-card {
          background: #f8f9fa;
          border-left: 4px solid ${primaryColor};
          padding: 20px;
          margin: 20px 0;
          border-radius: 8px;
        }
        .button { 
          display: inline-block; 
          background: ${urgencyColor}; 
          color: white; 
          padding: 16px 32px; 
          text-decoration: none; 
          border-radius: 8px; 
          margin: 20px 0; 
          font-weight: 600;
          text-align: center;
          font-size: 16px;
          transition: background-color 0.3s ease;
        }
        .button:hover {
          background: ${urgencyColor}dd;
        }
        .time-remaining {
          background: ${urgencyColor}11;
          border: 2px solid ${urgencyColor};
          padding: 15px;
          border-radius: 8px;
          margin: 15px 0;
          text-align: center;
          font-weight: 600;
          color: ${urgencyColor === '#dc3545' ? '#721c24' : '#856404'};
        }
        .footer { 
          font-size: 12px; 
          color: #666; 
          margin-top: 30px; 
          padding-top: 20px;
          border-top: 1px solid #eee;
          text-align: center;
        }
        .footer a {
          color: ${primaryColor};
          text-decoration: none;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          ${logoHtml}
          <h1>Survey Reminder</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Hello ${recipient.name},</p>
        </div>
        
        <div class="content">
          <div class="urgency-banner">
            ⏰ ${urgencyMessage}
          </div>
          
          <div class="survey-card">
            <h2 style="margin-top: 0; color: ${primaryColor};">${survey.title}</h2>
            <p style="margin-bottom: 0;">Your feedback is important to us and will help shape improvements at ${companyName}.</p>
          </div>
          
          <div class="time-remaining">
            📅 ${timeRemainingText}
          </div>
          
          <p>We understand you're busy, but your perspective matters. This survey takes just ${survey.settings?.time_limit_minutes || 10} minutes and will help us create a better workplace for everyone.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${invitationLink}" class="button">Complete Survey Now</a>
          </div>
          
          <p style="font-size: 14px; color: #666;">If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="word-break: break-all; background: #f8f9fa; padding: 10px; border-radius: 4px; font-family: monospace; font-size: 12px;">
            <a href="${invitationLink}" style="color: ${primaryColor};">${invitationLink}</a>
          </p>
        </div>
        
        <div class="footer">
          <p>Thank you for taking the time to share your feedback.</p>
          <p>Questions? Contact ${branding?.support_email || 'your HR department'}</p>
          ${branding?.website_url ? `<p><a href="${branding.website_url}">${companyName}</a></p>` : ''}
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    ${subjectPrefix}: Survey Reminder
    
    Hello ${recipient.name},
    
    ${urgencyMessage}
    
    Survey: ${survey.title}
    
    Your feedback is important to us and will help shape improvements at ${companyName}.
    
    ${timeRemainingText}
    Estimated time: ${survey.settings?.time_limit_minutes || 10} minutes
    
    Complete the survey: ${invitationLink}
    
    Thank you for taking the time to share your feedback.
    Questions? Contact ${branding?.support_email || 'your HR department'}
  `;

  return { subject, html, text };
}

// Mock email service implementation (replace with actual email service)
export class MockEmailService implements EmailService {
  async sendSurveyInvitation(data: SurveyInvitationData): Promise<boolean> {
    const template = generateSurveyInvitationTemplate(data);
    console.log('Sending survey invitation:', {
      to: data.recipient.email,
      subject: template.subject,
      // In production, send actual email
    });
    return true;
  }

  async sendSurveyReminder(data: SurveyInvitationData): Promise<boolean> {
    const template = generateSurveyReminderTemplate(data);
    console.log('Sending survey reminder:', {
      to: data.recipient.email,
      subject: template.subject,
      // In production, send actual email
    });
    return true;
  }

  async sendSurveyCompletion(data: SurveyInvitationData): Promise<boolean> {
    console.log('Sending survey completion confirmation:', {
      to: data.recipient.email,
      // In production, send actual email
    });
    return true;
  }
}

// Email service singleton
export const emailService = new MockEmailService();


