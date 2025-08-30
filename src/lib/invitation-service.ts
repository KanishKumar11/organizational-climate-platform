import SurveyInvitation, {
  ISurveyInvitation,
  InvitationStatus,
} from '@/models/SurveyInvitation';
import Survey, { ISurvey } from '@/models/Survey';
import User, { IUser } from '@/models/User';
import Company, { ICompany } from '@/models/Company';
import { notificationService } from './notification-service';
import { emailService, CorporateBranding } from './email';
import { connectDB } from './mongodb';
import { v4 as uuidv4 } from 'uuid';

// Invitation creation data
export interface InvitationData {
  survey_id: string;
  user_ids: string[];
  expires_at?: Date;
  send_immediately?: boolean;
  scheduled_send_time?: Date;
  custom_message?: string;
}

// Reminder schedule configuration
export interface ReminderSchedule {
  enabled: boolean;
  intervals: number[]; // Days after initial invitation
  max_reminders: number;
  escalation_enabled: boolean;
}

// Participation tracking data
export interface ParticipationTracking {
  survey_id: string;
  total_invitations: number;
  sent_invitations: number;
  opened_invitations: number;
  started_responses: number;
  completed_responses: number;
  bounced_invitations: number;
  expired_invitations: number;
  participation_rate: number;
  completion_rate: number;
  response_rate: number;
  average_time_to_complete: number;
  department_breakdown: Record<
    string,
    {
      invited: number;
      completed: number;
      rate: number;
    }
  >;
}

// Communication strategy optimization
export interface CommunicationStrategy {
  survey_id: string;
  company_id: string;
  optimal_send_times: {
    initial: Date;
    reminders: Date[];
  };
  channel_preferences: Record<string, string>; // user_id -> preferred channel
  personalization_data: Record<string, any>; // user_id -> personalization data
  response_rate_predictions: Record<string, number>; // user_id -> predicted response rate
  recommendations: string[];
}

class InvitationService {
  // Create and send survey invitations
  async createInvitations(data: InvitationData): Promise<ISurveyInvitation[]> {
    await connectDB();

    const survey = await (Survey as any)
      .findById(data.survey_id)
      .populate('company_id');
    if (!survey) {
      throw new Error('Survey not found');
    }

    const users = await (User as any).find({ _id: { $in: data.user_ids } });
    if (users.length === 0) {
      throw new Error('No valid users found');
    }

    const company = await (Company as any).findById(survey.company_id);
    const expiresAt =
      data.expires_at || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 days default

    const invitations: ISurveyInvitation[] = [];

    for (const user of users) {
      // Check if invitation already exists
      const existingInvitation = await (SurveyInvitation as any).findOne({
        survey_id: data.survey_id,
        user_id: user._id.toString(),
      });

      if (existingInvitation) {
        console.log(`Invitation already exists for user ${user._id}`);
        continue;
      }

      // Create invitation
      const invitation = new SurveyInvitation({
        survey_id: data.survey_id,
        user_id: user._id.toString(),
        company_id: survey.company_id.toString(),
        email: user.email,
        invitation_token: uuidv4(),
        expires_at: expiresAt,
        status: 'pending',
      });

      await invitation.save();
      invitations.push(invitation);

      // Schedule notification
      const sendTime = data.send_immediately
        ? new Date()
        : data.scheduled_send_time ||
          (await this.optimizeSendTime(user._id.toString()));

      await notificationService.createNotification({
        user_id: user._id.toString(),
        company_id: survey.company_id.toString(),
        type: 'survey_invitation',
        channel: 'email',
        priority: 'medium',
        scheduled_for: sendTime,
        data: {
          survey_id: data.survey_id,
          invitation_id: invitation._id.toString(),
          survey: survey,
          companyName: company?.name || 'Your Organization',
          expiryDate: expiresAt,
          link: this.generateInvitationLink(invitation.invitation_token),
          custom_message: data.custom_message,
        },
        variables: {
          recipient: user,
          survey: survey,
          company: company,
          invitationLink: this.generateInvitationLink(
            invitation.invitation_token
          ),
          companyName: company?.name || 'Your Organization',
          expiryDate: expiresAt,
        },
      });
    }

    // Schedule automatic reminders if enabled
    await this.scheduleReminders(data.survey_id, invitations);

    return invitations;
  }

  // Generate invitation link
  private generateInvitationLink(token: string): string {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    return `${baseUrl}/survey/invitation/${token}`;
  }

  // Optimize send time for user
  private async optimizeSendTime(userId: string): Promise<Date> {
    // Use notification service's optimization
    return await notificationService.optimizeSendTime(userId, 'email');
  }

  // Schedule automatic reminders
  async scheduleReminders(
    surveyId: string,
    invitations: ISurveyInvitation[]
  ): Promise<void> {
    const survey = await (Survey as any).findById(surveyId);
    if (!survey) return;

    // Default reminder schedule: 3 days, 7 days, 1 day before expiry
    const reminderSchedule: ReminderSchedule = {
      enabled: true,
      intervals: [3, 7], // Days after initial invitation
      max_reminders: 3,
      escalation_enabled: true,
    };

    for (const invitation of invitations) {
      const user = await (User as any).findById(invitation.user_id);
      if (!user) continue;

      // Schedule reminders
      for (let i = 0; i < reminderSchedule.intervals.length; i++) {
        const reminderDate = new Date();
        reminderDate.setDate(
          reminderDate.getDate() + reminderSchedule.intervals[i]
        );

        // Don't schedule if past expiry
        if (reminderDate >= invitation.expires_at) continue;

        await notificationService.createNotification({
          user_id: invitation.user_id,
          company_id: invitation.company_id,
          type: 'survey_reminder',
          channel: 'email',
          priority: i >= 2 ? 'high' : 'medium', // Escalate priority for later reminders
          scheduled_for: reminderDate,
          data: {
            survey_id: surveyId,
            invitation_id: invitation._id.toString(),
            survey: survey,
            reminder_count: i + 1,
            link: this.generateInvitationLink(invitation.invitation_token),
          },
          variables: {
            recipient: user,
            survey: survey,
            invitationLink: this.generateInvitationLink(
              invitation.invitation_token
            ),
            reminderCount: i + 1,
          },
        });
      }

      // Schedule final reminder 1 day before expiry
      const finalReminderDate = new Date(invitation.expires_at);
      finalReminderDate.setDate(finalReminderDate.getDate() - 1);

      if (finalReminderDate > new Date()) {
        await notificationService.createNotification({
          user_id: invitation.user_id,
          company_id: invitation.company_id,
          type: 'survey_reminder',
          channel: 'email',
          priority: 'high',
          scheduled_for: finalReminderDate,
          data: {
            survey_id: surveyId,
            invitation_id: invitation._id.toString(),
            survey: survey,
            reminder_count: 3,
            is_final_reminder: true,
            link: this.generateInvitationLink(invitation.invitation_token),
          },
          variables: {
            recipient: user,
            survey: survey,
            invitationLink: this.generateInvitationLink(
              invitation.invitation_token
            ),
            reminderCount: 3,
          },
        });
      }
    }
  }

  // Track invitation status
  async trackInvitationStatus(
    token: string,
    status: InvitationStatus,
    metadata?: any
  ): Promise<void> {
    await connectDB();

    const invitation = await (SurveyInvitation as any).findByToken(token);
    if (!invitation) return;

    switch (status) {
      case 'opened':
        invitation.markOpened(metadata);
        break;
      case 'started':
        invitation.markStarted();
        break;
      case 'completed':
        invitation.markCompleted();
        break;
      case 'expired':
        invitation.markExpired();
        break;
    }

    await invitation.save();
  }

  // Get participation tracking data
  async getParticipationTracking(
    surveyId: string
  ): Promise<ParticipationTracking> {
    await connectDB();

    const invitations = await (SurveyInvitation as any).find({
      survey_id: surveyId,
    });
    const users = await (User as any).find({
      _id: { $in: invitations.map((inv) => inv.user_id) },
    });

    const totalInvitations = invitations.length;
    const sentInvitations = invitations.filter((inv) =>
      ['sent', 'opened', 'started', 'completed'].includes(inv.status)
    ).length;
    const openedInvitations = invitations.filter((inv) =>
      ['opened', 'started', 'completed'].includes(inv.status)
    ).length;
    const startedResponses = invitations.filter((inv) =>
      ['started', 'completed'].includes(inv.status)
    ).length;
    const completedResponses = invitations.filter(
      (inv) => inv.status === 'completed'
    ).length;
    const bouncedInvitations = invitations.filter(
      (inv) => inv.status === 'bounced'
    ).length;
    const expiredInvitations = invitations.filter(
      (inv) => inv.status === 'expired'
    ).length;

    const participationRate =
      totalInvitations > 0 ? (startedResponses / totalInvitations) * 100 : 0;
    const completionRate =
      startedResponses > 0 ? (completedResponses / startedResponses) * 100 : 0;
    const responseRate =
      totalInvitations > 0 ? (completedResponses / totalInvitations) * 100 : 0;

    // Calculate average time to complete
    const completedInvitations = invitations.filter(
      (inv) => inv.completed_at && inv.sent_at
    );
    const averageTimeToComplete =
      completedInvitations.length > 0
        ? completedInvitations.reduce((sum, inv) => {
            const timeDiff =
              inv.completed_at!.getTime() - inv.sent_at!.getTime();
            return sum + timeDiff;
          }, 0) /
          completedInvitations.length /
          (1000 * 60 * 60) // Convert to hours
        : 0;

    // Department breakdown
    const departmentBreakdown: Record<
      string,
      { invited: number; completed: number; rate: number }
    > = {};

    for (const user of users) {
      const department = user.department_id || 'Unknown';
      if (!departmentBreakdown[department]) {
        departmentBreakdown[department] = { invited: 0, completed: 0, rate: 0 };
      }

      departmentBreakdown[department].invited++;

      const userInvitation = invitations.find(
        (inv) => inv.user_id === user._id.toString()
      );
      if (userInvitation?.status === 'completed') {
        departmentBreakdown[department].completed++;
      }
    }

    // Calculate department rates
    Object.values(departmentBreakdown).forEach((dept) => {
      dept.rate = dept.invited > 0 ? (dept.completed / dept.invited) * 100 : 0;
    });

    return {
      survey_id: surveyId,
      total_invitations: totalInvitations,
      sent_invitations: sentInvitations,
      opened_invitations: openedInvitations,
      started_responses: startedResponses,
      completed_responses: completedResponses,
      bounced_invitations: bouncedInvitations,
      expired_invitations: expiredInvitations,
      participation_rate: participationRate,
      completion_rate: completionRate,
      response_rate: responseRate,
      average_time_to_complete: averageTimeToComplete,
      department_breakdown: departmentBreakdown,
    };
  }

  // Optimize communication strategy
  async optimizeCommunicationStrategy(
    surveyId: string
  ): Promise<CommunicationStrategy> {
    await connectDB();

    const survey = await (Survey as any).findById(surveyId);
    if (!survey) {
      throw new Error('Survey not found');
    }

    const invitations = await (SurveyInvitation as any).find({
      survey_id: surveyId,
    });
    const users = await (User as any).find({
      _id: { $in: invitations.map((inv) => inv.user_id) },
    });

    // Analyze historical response patterns
    const historicalData = await this.analyzeHistoricalResponsePatterns(
      survey.company_id.toString()
    );

    // Generate optimal send times
    const optimalSendTimes = {
      initial: this.calculateOptimalInitialSendTime(historicalData),
      reminders: this.calculateOptimalReminderTimes(historicalData),
    };

    // Determine channel preferences
    const channelPreferences: Record<string, string> = {};
    for (const user of users) {
      channelPreferences[user._id.toString()] =
        await this.getUserPreferredChannel(user._id.toString());
    }

    // Generate personalization data
    const personalizationData: Record<string, any> = {};
    for (const user of users) {
      personalizationData[user._id.toString()] = {
        name: user.name,
        department: user.department_id,
        role: user.role,
        timezone: user.preferences?.timezone || 'UTC',
        language: user.preferences?.language || 'en',
      };
    }

    // Predict response rates
    const responseRatePredictions: Record<string, number> = {};
    for (const user of users) {
      responseRatePredictions[user._id.toString()] =
        await this.predictUserResponseRate(user._id.toString(), survey);
    }

    // Generate recommendations
    const recommendations = this.generateCommunicationRecommendations(
      historicalData,
      responseRatePredictions
    );

    return {
      survey_id: surveyId,
      company_id: survey.company_id.toString(),
      optimal_send_times: optimalSendTimes,
      channel_preferences: channelPreferences,
      personalization_data: personalizationData,
      response_rate_predictions: responseRatePredictions,
      recommendations,
    };
  }

  // Analyze historical response patterns
  private async analyzeHistoricalResponsePatterns(
    companyId: string
  ): Promise<any> {
    const historicalInvitations = await (SurveyInvitation as any).find({
      company_id: companyId,
      created_at: { $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) }, // Last year
    });

    // Analyze by hour of day, day of week, etc.
    const hourlyResponse: Record<number, { sent: number; completed: number }> =
      {};
    const dailyResponse: Record<number, { sent: number; completed: number }> =
      {};

    for (const invitation of historicalInvitations) {
      if (!invitation.sent_at) continue;

      const hour = invitation.sent_at.getHours();
      const day = invitation.sent_at.getDay();

      if (!hourlyResponse[hour])
        hourlyResponse[hour] = { sent: 0, completed: 0 };
      if (!dailyResponse[day]) dailyResponse[day] = { sent: 0, completed: 0 };

      hourlyResponse[hour].sent++;
      dailyResponse[day].sent++;

      if (invitation.status === 'completed') {
        hourlyResponse[hour].completed++;
        dailyResponse[day].completed++;
      }
    }

    return {
      hourly_response: hourlyResponse,
      daily_response: dailyResponse,
      total_invitations: historicalInvitations.length,
      overall_response_rate:
        historicalInvitations.length > 0
          ? historicalInvitations.filter((inv) => inv.status === 'completed')
              .length / historicalInvitations.length
          : 0,
    };
  }

  // Calculate optimal initial send time
  private calculateOptimalInitialSendTime(historicalData: any): Date {
    // Find the hour with highest response rate
    let bestHour = 10; // Default to 10 AM
    let bestRate = 0;

    for (const [hour, data] of Object.entries(historicalData.hourly_response)) {
      const rate = (data as any).sent > 0 ? (data as any).completed / (data as any).sent : 0;
      if (rate > bestRate) {
        bestRate = rate;
        bestHour = parseInt(hour);
      }
    }

    // Find the best day (Tuesday-Thursday typically best)
    let bestDay = 2; // Default to Tuesday
    let bestDayRate = 0;

    for (const [day, data] of Object.entries(historicalData.daily_response)) {
      const rate = (data as any).sent > 0 ? (data as any).completed / (data as any).sent : 0;
      if (rate > bestDayRate && parseInt(day) >= 1 && parseInt(day) <= 4) {
        // Mon-Thu
        bestDayRate = rate;
        bestDay = parseInt(day);
      }
    }

    // Calculate next optimal send time
    const now = new Date();
    const nextSendTime = new Date(now);

    // Move to next occurrence of best day
    const daysUntilBestDay = (bestDay - now.getDay() + 7) % 7;
    nextSendTime.setDate(now.getDate() + (daysUntilBestDay || 7)); // If today is best day, schedule for next week
    nextSendTime.setHours(bestHour, 0, 0, 0);

    return nextSendTime;
  }

  // Calculate optimal reminder times
  private calculateOptimalReminderTimes(historicalData: any): Date[] {
    const reminders: Date[] = [];
    const baseTime = this.calculateOptimalInitialSendTime(historicalData);

    // Schedule reminders at optimal intervals
    const intervals = [3, 7, 12]; // Days after initial send

    for (const interval of intervals) {
      const reminderTime = new Date(baseTime);
      reminderTime.setDate(baseTime.getDate() + interval);
      reminders.push(reminderTime);
    }

    return reminders;
  }

  // Get user's preferred communication channel
  private async getUserPreferredChannel(userId: string): Promise<string> {
    // For now, default to email. In the future, analyze user engagement patterns
    return 'email';
  }

  // Predict user response rate
  private async predictUserResponseRate(
    userId: string,
    survey: ISurvey
  ): Promise<number> {
    // Simple prediction based on historical data
    const userInvitations = await (SurveyInvitation as any).find({
      user_id: userId,
    });

    if (userInvitations.length === 0) {
      return 0.3; // Default 30% for new users
    }

    const completedCount = userInvitations.filter(
      (inv) => inv.status === 'completed'
    ).length;
    const baseRate = completedCount / userInvitations.length;

    // Adjust based on survey characteristics
    let adjustedRate = baseRate;

    // Shorter surveys get higher predicted response rates
    if (survey.questions && survey.questions.length <= 10) {
      adjustedRate *= 1.2;
    } else if (survey.questions && survey.questions.length > 20) {
      adjustedRate *= 0.8;
    }

    // Anonymous surveys get higher response rates
    if (survey.settings?.anonymous) {
      adjustedRate *= 1.1;
    }

    return Math.min(1.0, Math.max(0.1, adjustedRate));
  }

  // Generate communication recommendations
  private generateCommunicationRecommendations(
    historicalData: any,
    responseRatePredictions: Record<string, number>
  ): string[] {
    const recommendations: string[] = [];

    const averagePredictedRate =
      Object.values(responseRatePredictions).reduce(
        (sum, rate) => sum + rate,
        0
      ) / Object.values(responseRatePredictions).length;

    if (averagePredictedRate < 0.3) {
      recommendations.push(
        'Consider shortening the survey to improve response rates'
      );
      recommendations.push('Add incentives for participation');
      recommendations.push('Send personalized invitations from leadership');
    }

    if (historicalData.overall_response_rate < 0.4) {
      recommendations.push('Schedule follow-up reminders at 3-day intervals');
      recommendations.push('Use escalating urgency in reminder messages');
    }

    recommendations.push(
      'Send initial invitations on Tuesday-Thursday between 10-11 AM for best response rates'
    );
    recommendations.push(
      'Limit to maximum 3 reminders to avoid survey fatigue'
    );

    return recommendations;
  }

  // Get survey invitations
  async getSurveyInvitations(surveyId: string): Promise<ISurveyInvitation[]> {
    await connectDB();
    return await (SurveyInvitation as any).findBySurvey(surveyId);
  }

  // Resend invitation
  async resendInvitation(invitationId: string): Promise<void> {
    await connectDB();

    const invitation = await (SurveyInvitation as any).findById(invitationId);
    if (!invitation) {
      throw new Error('Invitation not found');
    }

    const user = await (User as any).findById(invitation.user_id);
    const survey = await (Survey as any).findById(invitation.survey_id);
    const company = await (Company as any).findById(invitation.company_id);

    if (!user || !survey || !company) {
      throw new Error('Required data not found');
    }

    // Create new notification
    await notificationService.createNotification({
      user_id: invitation.user_id,
      company_id: invitation.company_id,
      type: 'survey_invitation',
      channel: 'email',
      priority: 'medium',
      scheduled_for: new Date(),
      data: {
        survey_id: invitation.survey_id,
        invitation_id: invitation._id.toString(),
        survey: survey,
        companyName: company.name,
        expiryDate: invitation.expires_at,
        link: this.generateInvitationLink(invitation.invitation_token),
        is_resend: true,
      },
      variables: {
        recipient: user,
        survey: survey,
        company: company,
        invitationLink: this.generateInvitationLink(
          invitation.invitation_token
        ),
        companyName: company.name,
        expiryDate: invitation.expires_at,
      },
    });
  }

  // Cancel invitation
  async cancelInvitation(invitationId: string): Promise<void> {
    await connectDB();

    const invitation = await (SurveyInvitation as any).findById(invitationId);
    if (!invitation) {
      throw new Error('Invitation not found');
    }

    invitation.status = 'cancelled' as InvitationStatus;
    await invitation.save();
  }
}

export const invitationService = new InvitationService();


