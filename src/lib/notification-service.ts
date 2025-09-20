import Notification, {
  INotification,
  NotificationType,
  NotificationChannel,
  NotificationPriority,
} from '@/models/Notification';
import NotificationTemplate, {
  INotificationTemplate,
} from '@/models/NotificationTemplate';
import User, { IUser } from '@/models/User';
import { emailService } from './email';
import { connectDB } from './mongodb';

// Helper function to safely check if a value is a Date
function isDate(value: any): value is Date {
  return value instanceof Date && !isNaN(value.getTime());
}

// Notification data interface
export interface NotificationData {
  user_id: string;
  company_id: string;
  type: NotificationType;
  channel: NotificationChannel;
  priority?: NotificationPriority;
  title?: string;
  message?: string;
  data?: Record<string, any>;
  template_id?: string;
  scheduled_for?: Date;
  variables?: Record<string, any>;
}

// Send time optimization interface
export interface SendTimeOptimization {
  user_id: string;
  optimal_send_times: {
    email: Date[];
    push: Date[];
    in_app: Date[];
  };
  timezone: string;
  engagement_patterns: {
    best_day_of_week: number; // 0-6, Sunday-Saturday
    best_hour_of_day: number; // 0-23
    response_rate_by_hour: Record<number, number>;
    response_rate_by_day: Record<number, number>;
  };
}

// Participation forecast interface
export interface ParticipationForecast {
  survey_id: string;
  company_id: string;
  total_invitations: number;
  predicted_responses: number;
  predicted_response_rate: number;
  confidence_score: number;
  factors: {
    historical_response_rate: number;
    survey_length: number;
    time_of_year: number;
    department_engagement: Record<string, number>;
  };
  recommendations: string[];
}

// Delivery analytics interface
export interface DeliveryAnalytics {
  total_sent: number;
  total_delivered: number;
  total_opened: number;
  total_failed: number;
  delivery_rate: number;
  open_rate: number;
  failure_rate: number;
  engagement_metrics: {
    by_channel: Record<
      NotificationChannel,
      {
        sent: number;
        delivered: number;
        opened: number;
        engagement_rate: number;
      }
    >;
    by_type: Record<
      NotificationType,
      {
        sent: number;
        delivered: number;
        opened: number;
        engagement_rate: number;
      }
    >;
    by_time: Record<
      string,
      {
        sent: number;
        delivered: number;
        opened: number;
        engagement_rate: number;
      }
    >;
  };
}

class NotificationService {
  // Create and schedule a notification
  async createNotification(data: NotificationData): Promise<INotification> {
    await connectDB();

    let title = data.title;
    let message = data.message;
    let htmlContent: string | undefined;

    // If template is specified or title/message not provided, use template
    if (data.template_id || !title || !message) {
      const template = await this.getTemplate(
        data.type,
        data.channel,
        data.company_id,
        data.template_id
      );
      if (template) {
        const rendered = template.renderContent(data.variables || {});
        title = title || rendered.title;
        message = message || rendered.content;
        htmlContent = rendered.html_content;
      }
    }

    // Optimize send time if not specified
    let scheduledFor = data.scheduled_for;
    if (!scheduledFor) {
      scheduledFor = await this.optimizeSendTime(data.user_id, data.channel);
    }

    const notification = new Notification({
      user_id: data.user_id,
      company_id: data.company_id,
      type: data.type,
      channel: data.channel,
      priority: data.priority || 'medium',
      title: title || 'Notification',
      message: message || '',
      data: {
        ...data.data,
        html_content: htmlContent,
      },
      template_id: data.template_id,
      scheduled_for: scheduledFor,
    });

    return await notification.save();
  }

  // Get appropriate template for notification
  private async getTemplate(
    type: NotificationType,
    channel: NotificationChannel,
    companyId: string,
    templateId?: string
  ): Promise<INotificationTemplate | null> {
    await connectDB();

    if (templateId) {
      return await (NotificationTemplate as any).findById(templateId);
    }

    return await NotificationTemplate.findByTypeAndChannel(
      type,
      channel,
      companyId
    );
  }

  // Optimize send time based on user engagement patterns
  async optimizeSendTime(
    userId: string,
    channel: NotificationChannel
  ): Promise<Date> {
    await connectDB();

    try {
      const optimization = await this.getUserSendTimeOptimization(userId);
      const now = new Date();

      if (
        optimization &&
        optimization.optimal_send_times[channel]?.length > 0
      ) {
        // Find the next optimal send time
        const optimalTimes = optimization.optimal_send_times[channel];
        const nextOptimalTime = optimalTimes.find((time) => time > now);

        if (nextOptimalTime) {
          return nextOptimalTime;
        }

        // If no future optimal time today, use the first optimal time tomorrow
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(
          optimalTimes[0].getHours(),
          optimalTimes[0].getMinutes(),
          0,
          0
        );
        return tomorrow;
      }

      // Fallback to general best practices
      return this.getDefaultOptimalSendTime(channel);
    } catch (error) {
      console.error('Error optimizing send time:', error);
      return this.getDefaultOptimalSendTime(channel);
    }
  }

  // Get user's send time optimization data
  private async getUserSendTimeOptimization(
    userId: string
  ): Promise<SendTimeOptimization | null> {
    await connectDB();

    // Get user's historical notification engagement
    const notifications = await (Notification as any)
      .find({
        user_id: userId,
        status: { $in: ['delivered', 'opened'] },
        sent_at: { $exists: true },
      })
      .sort({ sent_at: -1 })
      .limit(100);

    if (notifications.length < 10) {
      return null; // Not enough data for optimization
    }

    const user = await (User as any).findById(userId);
    const timezone = user?.preferences?.timezone || 'UTC';

    // Analyze engagement patterns
    const hourlyEngagement: Record<number, { sent: number; opened: number }> =
      {};
    const dailyEngagement: Record<number, { sent: number; opened: number }> =
      {};

    for (const notification of notifications) {
      if (!notification.sent_at) continue;

      const hour = notification.sent_at.getHours();
      const day = notification.sent_at.getDay();

      // Initialize if not exists
      if (!hourlyEngagement[hour]) {
        hourlyEngagement[hour] = { sent: 0, opened: 0 };
      }
      if (!dailyEngagement[day]) {
        dailyEngagement[day] = { sent: 0, opened: 0 };
      }

      hourlyEngagement[hour].sent++;
      dailyEngagement[day].sent++;

      if (notification.status === 'opened') {
        hourlyEngagement[hour].opened++;
        dailyEngagement[day].opened++;
      }
    }

    // Calculate response rates
    const responseRateByHour: Record<number, number> = {};
    const responseRateByDay: Record<number, number> = {};

    for (const [hour, data] of Object.entries(hourlyEngagement)) {
      responseRateByHour[parseInt(hour)] =
        data.sent > 0 ? data.opened / data.sent : 0;
    }

    for (const [day, data] of Object.entries(dailyEngagement)) {
      responseRateByDay[parseInt(day)] =
        data.sent > 0 ? data.opened / data.sent : 0;
    }

    // Find best times
    const bestHour = Object.entries(responseRateByHour).sort(
      ([, a], [, b]) => b - a
    )[0]?.[0];
    const bestDay = Object.entries(responseRateByDay).sort(
      ([, a], [, b]) => b - a
    )[0]?.[0];

    // Generate optimal send times for the next week
    const optimalSendTimes = this.generateOptimalSendTimes(
      parseInt(bestHour) || 10,
      parseInt(bestDay) || 2,
      timezone
    );

    return {
      user_id: userId,
      optimal_send_times: optimalSendTimes,
      timezone,
      engagement_patterns: {
        best_day_of_week: parseInt(bestDay) || 2,
        best_hour_of_day: parseInt(bestHour) || 10,
        response_rate_by_hour: responseRateByHour,
        response_rate_by_day: responseRateByDay,
      },
    };
  }

  // Generate optimal send times based on patterns
  private generateOptimalSendTimes(
    bestHour: number,
    bestDay: number,
    timezone: string
  ): SendTimeOptimization['optimal_send_times'] {
    const now = new Date();
    const optimalTimes = {
      email: [] as Date[],
      push: [] as Date[],
      in_app: [] as Date[],
    };

    // Generate times for the next 7 days
    for (let i = 0; i < 7; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() + i);

      // Email: Best hour on best days, slightly earlier on other days
      const emailHour =
        date.getDay() === bestDay ? bestHour : Math.max(9, bestHour - 1);
      const emailTime = new Date(date);
      emailTime.setHours(emailHour, 0, 0, 0);
      optimalTimes.email.push(emailTime);

      // Push: More flexible, can be sent throughout the day
      const pushHour = Math.max(8, Math.min(20, bestHour));
      const pushTime = new Date(date);
      pushTime.setHours(pushHour, 30, 0, 0);
      optimalTimes.push.push(pushTime);

      // In-app: Can be sent anytime during business hours
      const inAppHour = Math.max(9, Math.min(17, bestHour));
      const inAppTime = new Date(date);
      inAppTime.setHours(inAppHour, 15, 0, 0);
      optimalTimes.in_app.push(inAppTime);
    }

    return optimalTimes;
  }

  // Get default optimal send time based on channel
  private getDefaultOptimalSendTime(channel: NotificationChannel): Date {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    switch (channel) {
      case 'email':
        // Tuesday-Thursday, 10 AM
        const emailDay = tomorrow.getDay();
        if (emailDay < 2 || emailDay > 4) {
          // Move to next Tuesday
          const daysToAdd = emailDay === 0 ? 2 : emailDay === 6 ? 3 : 2;
          tomorrow.setDate(tomorrow.getDate() + daysToAdd);
        }
        tomorrow.setHours(10, 0, 0, 0);
        break;

      case 'push':
        // Any day, 2 PM
        tomorrow.setHours(14, 0, 0, 0);
        break;

      case 'in_app':
        // Any day, 11 AM
        tomorrow.setHours(11, 0, 0, 0);
        break;

      default:
        tomorrow.setHours(10, 0, 0, 0);
    }

    return tomorrow;
  }

  // Process pending notifications
  async processPendingNotifications(limit = 100): Promise<void> {
    await connectDB();

    const pendingNotifications = await (
      Notification as any
    ).findPendingNotifications(limit);

    for (const notification of pendingNotifications) {
      try {
        await this.sendNotification(notification);
      } catch (error) {
        console.error('Failed to send notification:', notification._id, error);
        notification.markFailed(
          error instanceof Error ? error.message : 'Unknown error'
        );
        await notification.save();
      }
    }
  }

  // Send email notification
  private async sendEmailNotification(
    notification: INotification
  ): Promise<void> {
    const user = await (User as any).findById(notification.user_id);
    if (!user) {
      throw new Error('User not found');
    }

    // Use existing email service
    const emailData = {
      survey:
        notification.data.survey ||
        ({
          _id: '',
          title: 'Survey',
          type: 'general_climate',
          company_id: notification.company_id,
          created_by: '',
          questions: [],
          demographics: [],
          settings: {},
          start_date: new Date(),
          end_date: new Date(),
          status: 'draft',
          response_count: 0,
          version: 1,
          created_at: new Date(),
          updated_at: new Date(),
        } as any), // Fallback survey object
      recipient: user,
      invitationLink: String(notification.data.link || ''),
      companyName: String(notification.data.companyName || 'Your Organization'),
      expiryDate: isDate(notification.data.expiryDate)
        ? notification.data.expiryDate
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    };

    switch (notification.type) {
      case 'survey_invitation':
        await emailService.sendSurveyInvitation(emailData);
        break;
      case 'survey_reminder':
        await emailService.sendSurveyReminder(emailData);
        break;
      case 'microclimate_invitation':
        const microclimateEmailData = {
          microclimate: notification.data.microclimate || {},
          recipient: user,
          invitationLink: String(notification.data.link || ''),
          companyName: String(
            notification.data.companyName || 'Your Organization'
          ),
          expiryDate: isDate(notification.data.expiryDate)
            ? notification.data.expiryDate
            : new Date(Date.now() + 24 * 60 * 60 * 1000),
          reminderCount: Number(notification.data.reminder_count || 0),
        };
        if (notification.data.is_reminder) {
          await emailService.sendMicroclimateReminder(microclimateEmailData);
        } else {
          await emailService.sendMicroclimateInvitation(microclimateEmailData);
        }
        break;
      default:
        // For other types, send generic email
        console.log('Sending email notification:', {
          to: user.email,
          subject: notification.title,
          content: notification.message,
        });
    }
  }

  // Send push notification (placeholder)
  private async sendPushNotification(
    notification: INotification
  ): Promise<void> {
    // Implement push notification logic here
    console.log('Sending push notification:', {
      user_id: notification.user_id,
      title: notification.title,
      message: notification.message,
    });
  }

  // Send in-app notification
  private async sendInAppNotification(
    notification: INotification
  ): Promise<void> {
    // In-app notifications are stored in database and shown in UI
    console.log('In-app notification created:', {
      user_id: notification.user_id,
      title: notification.title,
      message: notification.message,
    });
  }

  // Send SMS notification (placeholder)
  private async sendSMSNotification(
    notification: INotification
  ): Promise<void> {
    // Implement SMS notification logic here
    console.log('Sending SMS notification:', {
      user_id: notification.user_id,
      message: notification.message,
    });
  }

  // Generate participation forecast
  async generateParticipationForecast(
    surveyId: string,
    companyId: string
  ): Promise<ParticipationForecast> {
    await connectDB();

    // Get survey invitations
    const invitations = await (Notification as any).find({
      company_id: companyId,
      type: 'survey_invitation',
      'data.survey_id': surveyId,
    });

    const totalInvitations = invitations.length;

    // Get historical response rates for this company
    const historicalNotifications = await (Notification as any).find({
      company_id: companyId,
      type: 'survey_invitation',
      created_at: { $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) }, // Last year
    });

    const historicalResponseRate = this.calculateHistoricalResponseRate(
      historicalNotifications
    );

    // Simple prediction model (in production, use more sophisticated ML)
    const baseResponseRate = historicalResponseRate || 0.3; // Default 30%
    const seasonalFactor = this.getSeasonalFactor();
    const lengthFactor = this.getSurveyLengthFactor(10); // Assume 10 questions

    const predictedResponseRate = Math.min(
      0.9,
      Math.max(0.1, baseResponseRate * seasonalFactor * lengthFactor)
    );

    const predictedResponses = Math.round(
      totalInvitations * predictedResponseRate
    );

    return {
      survey_id: surveyId,
      company_id: companyId,
      total_invitations: totalInvitations,
      predicted_responses: predictedResponses,
      predicted_response_rate: predictedResponseRate,
      confidence_score: historicalNotifications.length > 50 ? 0.8 : 0.6,
      factors: {
        historical_response_rate: historicalResponseRate,
        survey_length: 10,
        time_of_year: seasonalFactor,
        department_engagement: {},
      },
      recommendations: this.generateParticipationRecommendations(
        predictedResponseRate
      ),
    };
  }

  // Calculate historical response rate
  private calculateHistoricalResponseRate(
    notifications: INotification[]
  ): number {
    if (notifications.length === 0) return 0;

    const opened = notifications.filter((n) => n.status === 'opened').length;
    return opened / notifications.length;
  }

  // Get seasonal factor for participation
  private getSeasonalFactor(): number {
    const month = new Date().getMonth();

    // Lower participation in summer (June-August) and December
    if (month >= 5 && month <= 7) return 0.85; // Summer
    if (month === 11) return 0.8; // December

    // Higher participation in fall and early spring
    if (month >= 8 && month <= 10) return 1.1; // Fall
    if (month >= 1 && month <= 3) return 1.05; // Early spring

    return 1.0; // Normal
  }

  // Get survey length factor
  private getSurveyLengthFactor(questionCount: number): number {
    if (questionCount <= 5) return 1.2;
    if (questionCount <= 10) return 1.0;
    if (questionCount <= 20) return 0.9;
    return 0.8;
  }

  // Generate participation recommendations
  private generateParticipationRecommendations(
    predictedRate: number
  ): string[] {
    const recommendations: string[] = [];

    if (predictedRate < 0.3) {
      recommendations.push(
        'Consider shortening the survey to improve response rates'
      );
      recommendations.push('Add incentives for participation');
      recommendations.push('Send personalized invitations from leadership');
    } else if (predictedRate < 0.5) {
      recommendations.push('Send reminder notifications after 3 days');
      recommendations.push(
        'Highlight the importance of feedback in communications'
      );
    } else {
      recommendations.push(
        'Current approach looks good for achieving target response rate'
      );
    }

    return recommendations;
  }

  // Get delivery analytics
  async getDeliveryAnalytics(
    companyId: string,
    startDate: Date,
    endDate: Date
  ): Promise<DeliveryAnalytics> {
    await connectDB();

    const notifications = await (Notification as any).find({
      company_id: companyId,
      created_at: { $gte: startDate, $lte: endDate },
    });

    const totalSent = notifications.filter((n) =>
      ['sent', 'delivered', 'opened'].includes(n.status)
    ).length;
    const totalDelivered = notifications.filter((n) =>
      ['delivered', 'opened'].includes(n.status)
    ).length;
    const totalOpened = notifications.filter(
      (n) => n.status === 'opened'
    ).length;
    const totalFailed = notifications.filter(
      (n) => n.status === 'failed'
    ).length;

    const deliveryRate = totalSent > 0 ? totalDelivered / totalSent : 0;
    const openRate = totalDelivered > 0 ? totalOpened / totalDelivered : 0;
    const failureRate =
      notifications.length > 0 ? totalFailed / notifications.length : 0;

    // Calculate engagement metrics by channel and type
    const byChannel: Record<string, any> = {};
    const byType: Record<string, any> = {};
    const byTime: Record<string, any> = {};

    for (const notification of notifications) {
      // By channel
      if (!byChannel[notification.channel]) {
        byChannel[notification.channel] = {
          sent: 0,
          delivered: 0,
          opened: 0,
          engagement_rate: 0,
        };
      }
      if (['sent', 'delivered', 'opened'].includes(notification.status)) {
        byChannel[notification.channel].sent++;
      }
      if (['delivered', 'opened'].includes(notification.status)) {
        byChannel[notification.channel].delivered++;
      }
      if (notification.status === 'opened') {
        byChannel[notification.channel].opened++;
      }

      // By type
      if (!byType[notification.type]) {
        byType[notification.type] = {
          sent: 0,
          delivered: 0,
          opened: 0,
          engagement_rate: 0,
        };
      }
      if (['sent', 'delivered', 'opened'].includes(notification.status)) {
        byType[notification.type].sent++;
      }
      if (['delivered', 'opened'].includes(notification.status)) {
        byType[notification.type].delivered++;
      }
      if (notification.status === 'opened') {
        byType[notification.type].opened++;
      }

      // By time (hour of day)
      const hour = notification.created_at.getHours();
      if (!byTime[hour]) {
        byTime[hour] = { sent: 0, delivered: 0, opened: 0, engagement_rate: 0 };
      }
      if (['sent', 'delivered', 'opened'].includes(notification.status)) {
        byTime[hour].sent++;
      }
      if (['delivered', 'opened'].includes(notification.status)) {
        byTime[hour].delivered++;
      }
      if (notification.status === 'opened') {
        byTime[hour].opened++;
      }
    }

    // Calculate engagement rates
    Object.values(byChannel).forEach((metrics: any) => {
      metrics.engagement_rate =
        metrics.delivered > 0 ? metrics.opened / metrics.delivered : 0;
    });
    Object.values(byType).forEach((metrics: any) => {
      metrics.engagement_rate =
        metrics.delivered > 0 ? metrics.opened / metrics.delivered : 0;
    });
    Object.values(byTime).forEach((metrics: any) => {
      metrics.engagement_rate =
        metrics.delivered > 0 ? metrics.opened / metrics.delivered : 0;
    });

    return {
      total_sent: totalSent,
      total_delivered: totalDelivered,
      total_opened: totalOpened,
      total_failed: totalFailed,
      delivery_rate: deliveryRate,
      open_rate: openRate,
      failure_rate: failureRate,
      engagement_metrics: {
        by_channel: byChannel,
        by_type: byType,
        by_time: byTime,
      },
    };
  }

  // Mark notification as opened (for tracking)
  async markNotificationOpened(
    notificationId: string,
    metadata?: any
  ): Promise<void> {
    await connectDB();

    const notification = await (Notification as any).findById(notificationId);
    if (notification) {
      notification.markOpened(metadata);
      await notification.save();
    }
  }

  // Get user notifications
  async getUserNotifications(
    userId: string,
    limit = 50
  ): Promise<INotification[]> {
    await connectDB();
    return await (Notification as any).findByUser(userId, limit);
  }

  // Get company notifications
  async getCompanyNotifications(
    companyId: string,
    limit = 100
  ): Promise<INotification[]> {
    await connectDB();
    return await (Notification as any).findByCompany(companyId, limit);
  }

  // Send notification immediately
  async sendNotification(notificationId: string): Promise<void> {
    await connectDB();
    const notification = await (Notification as any).findById(notificationId);
    if (!notification) {
      throw new Error('Notification not found');
    }
    await this.sendNotificationInternal(notification);
  }

  // Rename the private method to avoid conflict
  private async sendNotificationInternal(
    notification: INotification
  ): Promise<void> {
    switch (notification.channel) {
      case 'email':
        await this.sendEmailNotification(notification);
        break;
      case 'push':
        await this.sendPushNotification(notification);
        break;
      case 'in_app':
        await this.sendInAppNotification(notification);
        break;
      case 'sms':
        await this.sendSMSNotification(notification);
        break;
      default:
        throw new Error(
          `Unsupported notification channel: ${notification.channel}`
        );
    }

    notification.markSent();
    await notification.save();
  }

  // Bulk update notifications
  async bulkUpdateNotifications(
    notificationIds: string[],
    updates: any,
    companyId?: string
  ): Promise<any> {
    await connectDB();

    let query: any = { _id: { $in: notificationIds } };
    if (companyId) {
      query.company_id = companyId;
    }

    return await (Notification as any).updateMany(query, { $set: updates });
  }

  // Bulk delete notifications
  async bulkDeleteNotifications(
    notificationIds: string[],
    companyId?: string
  ): Promise<any> {
    await connectDB();

    let query: any = { _id: { $in: notificationIds } };
    if (companyId) {
      query.company_id = companyId;
    }

    return await (Notification as any).deleteMany(query);
  }

  // Get scheduled notifications
  async getScheduledNotifications(filters: {
    company_id: string;
    status?: string;
    limit?: number;
    page?: number;
  }): Promise<INotification[]> {
    await connectDB();

    const query: any = { company_id: filters.company_id };
    if (filters.status) {
      query.status = filters.status;
    }

    const limit = filters.limit || 50;
    const skip = ((filters.page || 1) - 1) * limit;

    return await (Notification as any)
      .find(query)
      .sort({ scheduled_for: 1 })
      .skip(skip)
      .limit(limit);
  }

  // Get user preferences
  async getUserPreferences(userId: string): Promise<any> {
    await connectDB();
    const user = await (User as any).findById(userId);
    return user?.preferences || null;
  }

  // Get optimal send time for user
  async getOptimalSendTime(
    userId: string
  ): Promise<{ hour: number; minute: number } | null> {
    const optimization = await this.getUserSendTimeOptimization(userId);
    if (optimization) {
      return {
        hour: optimization.engagement_patterns.best_hour_of_day,
        minute: 0,
      };
    }
    return null;
  }

  // Get delivery optimization data
  async getDeliveryOptimization(options: {
    user_id?: string;
    company_id: string;
    notification_type?: string;
    timeframe: number;
  }): Promise<any> {
    await connectDB();

    const { user_id, company_id, notification_type, timeframe } = options;

    // Calculate date range
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - timeframe);

    // Build query
    let query: any = {
      company_id,
      created_at: { $gte: startDate },
    };

    if (user_id) query.user_id = user_id;
    if (notification_type) query.type = notification_type;

    const notifications = await (Notification as any).find(query);

    // Analyze optimal delivery times
    const hourlyPerformance: Record<
      number,
      { sent: number; opened: number; rate: number }
    > = {};
    const dailyPerformance: Record<
      number,
      { sent: number; opened: number; rate: number }
    > = {};
    const channelPerformance: Record<
      string,
      { sent: number; opened: number; rate: number }
    > = {};

    for (const notification of notifications) {
      const hour = notification.created_at.getHours();
      const day = notification.created_at.getDay();
      const channel = notification.channel;

      // Initialize if not exists
      if (!hourlyPerformance[hour]) {
        hourlyPerformance[hour] = { sent: 0, opened: 0, rate: 0 };
      }
      if (!dailyPerformance[day]) {
        dailyPerformance[day] = { sent: 0, opened: 0, rate: 0 };
      }
      if (!channelPerformance[channel]) {
        channelPerformance[channel] = { sent: 0, opened: 0, rate: 0 };
      }

      // Count sent notifications
      if (['sent', 'delivered', 'opened'].includes(notification.status)) {
        hourlyPerformance[hour].sent++;
        dailyPerformance[day].sent++;
        channelPerformance[channel].sent++;
      }

      // Count opened notifications
      if (notification.status === 'opened') {
        hourlyPerformance[hour].opened++;
        dailyPerformance[day].opened++;
        channelPerformance[channel].opened++;
      }
    }

    // Calculate rates
    Object.values(hourlyPerformance).forEach((perf: any) => {
      perf.rate = perf.sent > 0 ? perf.opened / perf.sent : 0;
    });
    Object.values(dailyPerformance).forEach((perf: any) => {
      perf.rate = perf.sent > 0 ? perf.opened / perf.sent : 0;
    });
    Object.values(channelPerformance).forEach((perf: any) => {
      perf.rate = perf.sent > 0 ? perf.opened / perf.sent : 0;
    });

    // Find optimal times
    const bestHour = Object.entries(hourlyPerformance).sort(
      ([, a], [, b]) => b.rate - a.rate
    )[0];
    const bestDay = Object.entries(dailyPerformance).sort(
      ([, a], [, b]) => b.rate - a.rate
    )[0];
    const bestChannel = Object.entries(channelPerformance).sort(
      ([, a], [, b]) => b.rate - a.rate
    )[0];

    return {
      timeframe_days: timeframe,
      total_notifications: notifications.length,
      optimal_delivery_times: {
        best_hour: bestHour
          ? { hour: parseInt(bestHour[0]), performance: bestHour[1] }
          : null,
        best_day: bestDay
          ? { day: parseInt(bestDay[0]), performance: bestDay[1] }
          : null,
        best_channel: bestChannel
          ? { channel: bestChannel[0], performance: bestChannel[1] }
          : null,
      },
      performance_by_hour: hourlyPerformance,
      performance_by_day: dailyPerformance,
      performance_by_channel: channelPerformance,
      recommendations: this.generateDeliveryRecommendations(
        hourlyPerformance,
        dailyPerformance,
        channelPerformance
      ),
    };
  }

  // Optimize delivery schedule
  async optimizeDeliverySchedule(options: {
    user_ids?: string[];
    company_id: string;
    notification_type: string;
    content_template: string;
    target_engagement_rate?: number;
    time_constraints?: any;
  }): Promise<any> {
    await connectDB();

    const {
      user_ids,
      company_id,
      notification_type,
      content_template,
      target_engagement_rate,
      time_constraints,
    } = options;

    // Get users to optimize for
    let users;
    if (user_ids) {
      users = await (User as any).find({ _id: { $in: user_ids }, company_id });
    } else {
      users = await (User as any).find({ company_id });
    }

    const optimizedSchedule = [];

    for (const user of users) {
      // Get user's optimal send time
      const userOptimization = await this.getUserSendTimeOptimization(
        user._id.toString()
      );

      let optimalTime;
      if (userOptimization) {
        optimalTime = new Date();
        optimalTime.setHours(
          userOptimization.engagement_patterns.best_hour_of_day,
          0,
          0,
          0
        );

        // Apply time constraints if provided
        if (time_constraints) {
          const constraints = time_constraints;
          if (optimalTime.getHours() < constraints.earliest_hour) {
            optimalTime.setHours(constraints.earliest_hour);
          }
          if (optimalTime.getHours() > constraints.latest_hour) {
            optimalTime.setHours(constraints.latest_hour);
          }

          // Check if day is allowed
          if (
            constraints.allowed_days &&
            !constraints.allowed_days.includes(optimalTime.getDay())
          ) {
            // Move to next allowed day
            const nextAllowedDay =
              constraints.allowed_days.find(
                (day: number) => day > optimalTime.getDay()
              ) || constraints.allowed_days[0];
            const daysToAdd =
              nextAllowedDay > optimalTime.getDay()
                ? nextAllowedDay - optimalTime.getDay()
                : 7 - optimalTime.getDay() + nextAllowedDay;
            optimalTime.setDate(optimalTime.getDate() + daysToAdd);
          }
        }
      } else {
        // Use default optimal time
        optimalTime = this.getDefaultOptimalSendTime('email');
      }

      optimizedSchedule.push({
        user_id: user._id.toString(),
        user_email: user.email,
        user_name: user.name,
        optimal_send_time: optimalTime,
        predicted_engagement_rate:
          userOptimization?.engagement_patterns.response_rate_by_hour[
            optimalTime.getHours()
          ] || 0.3,
        notification_type,
        content_template,
      });
    }

    // Sort by optimal send time
    optimizedSchedule.sort(
      (a, b) => a.optimal_send_time.getTime() - b.optimal_send_time.getTime()
    );

    return {
      total_recipients: optimizedSchedule.length,
      schedule: optimizedSchedule,
      estimated_engagement_rate:
        optimizedSchedule.reduce(
          (sum, item) => sum + item.predicted_engagement_rate,
          0
        ) / optimizedSchedule.length,
      delivery_window: {
        start: optimizedSchedule[0]?.optimal_send_time,
        end: optimizedSchedule[optimizedSchedule.length - 1]?.optimal_send_time,
      },
    };
  }

  // Get engagement metrics
  async getEngagementMetrics(options: {
    company_id: string;
    notification_type?: string;
    timeframe: number;
    user_id?: string;
    campaign_id?: string;
  }): Promise<any> {
    await connectDB();

    const { company_id, notification_type, timeframe, user_id, campaign_id } =
      options;

    // Calculate date range
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - timeframe);

    // Build query
    let query: any = {
      company_id,
      created_at: { $gte: startDate },
    };

    if (notification_type) query.type = notification_type;
    if (user_id) query.user_id = user_id;
    if (campaign_id) query['data.campaign_id'] = campaign_id;

    const notifications = await (Notification as any).find(query);

    // Calculate engagement metrics
    const totalSent = notifications.filter((n) =>
      ['sent', 'delivered', 'opened'].includes(n.status)
    ).length;
    const totalDelivered = notifications.filter((n) =>
      ['delivered', 'opened'].includes(n.status)
    ).length;
    const totalOpened = notifications.filter(
      (n) => n.status === 'opened'
    ).length;
    const totalClicked = notifications.filter((n) => n.data?.clicked).length;
    const totalConverted = notifications.filter(
      (n) => n.data?.converted
    ).length;

    // Calculate rates
    const deliveryRate = totalSent > 0 ? totalDelivered / totalSent : 0;
    const openRate = totalDelivered > 0 ? totalOpened / totalDelivered : 0;
    const clickRate = totalOpened > 0 ? totalClicked / totalOpened : 0;
    const conversionRate = totalSent > 0 ? totalConverted / totalSent : 0;

    // Engagement over time
    const engagementOverTime = this.calculateEngagementOverTime(
      notifications,
      timeframe
    );

    return {
      timeframe_days: timeframe,
      total_notifications: notifications.length,
      metrics: {
        sent: totalSent,
        delivered: totalDelivered,
        opened: totalOpened,
        clicked: totalClicked,
        converted: totalConverted,
        delivery_rate: deliveryRate,
        open_rate: openRate,
        click_rate: clickRate,
        conversion_rate: conversionRate,
      },
      engagement_over_time: engagementOverTime,
      top_performing_content: this.getTopPerformingContent(notifications),
    };
  }

  // Track engagement event
  async trackEngagementEvent(options: {
    notification_id: string;
    user_id: string;
    event_type: 'delivered' | 'opened' | 'clicked' | 'dismissed' | 'converted';
    timestamp: Date;
    metadata?: any;
  }): Promise<any> {
    await connectDB();

    const { notification_id, user_id, event_type, timestamp, metadata } =
      options;

    const notification = await (Notification as any).findById(notification_id);
    if (!notification) {
      throw new Error('Notification not found');
    }

    // Update notification status and data
    if (event_type === 'delivered' && notification.status === 'sent') {
      notification.status = 'delivered';
      notification.delivered_at = timestamp;
    } else if (
      event_type === 'opened' &&
      ['sent', 'delivered'].includes(notification.status)
    ) {
      notification.status = 'opened';
      notification.opened_at = timestamp;
    }

    // Track additional engagement data
    if (!notification.data) notification.data = {};
    if (event_type === 'clicked') notification.data.clicked = true;
    if (event_type === 'converted') notification.data.converted = true;
    if (event_type === 'dismissed') notification.data.dismissed = true;

    // Add engagement event to history
    if (!notification.data.engagement_events)
      notification.data.engagement_events = [];
    notification.data.engagement_events.push({
      event_type,
      timestamp,
      metadata,
    });

    await notification.save();

    return {
      notification_id,
      event_type,
      timestamp,
      status: 'tracked',
    };
  }

  // Update engagement preferences
  async updateEngagementPreferences(
    userId: string,
    preferences: any
  ): Promise<any> {
    await connectDB();

    const user = await (User as any).findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Update user preferences
    if (!user.preferences) user.preferences = {};
    user.preferences.notifications = {
      ...user.preferences.notifications,
      ...preferences,
    };

    await user.save();

    return user.preferences.notifications;
  }

  // Generate delivery recommendations
  private generateDeliveryRecommendations(
    hourlyPerformance: Record<number, any>,
    dailyPerformance: Record<number, any>,
    channelPerformance: Record<string, any>
  ): string[] {
    const recommendations: string[] = [];

    // Find best performing hour
    const bestHourEntry = Object.entries(hourlyPerformance).sort(
      ([, a], [, b]) => b.rate - a.rate
    )[0];

    if (bestHourEntry && bestHourEntry[1].rate > 0.3) {
      recommendations.push(
        `Best engagement occurs at ${bestHourEntry[0]}:00. Consider scheduling notifications around this time.`
      );
    }

    // Find best performing day
    const bestDayEntry = Object.entries(dailyPerformance).sort(
      ([, a], [, b]) => b.rate - a.rate
    )[0];

    if (bestDayEntry && bestDayEntry[1].rate > 0.3) {
      const dayNames = [
        'Sunday',
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
      ];
      recommendations.push(
        `${dayNames[parseInt(bestDayEntry[0])]} shows the highest engagement rates.`
      );
    }

    // Find best performing channel
    const bestChannelEntry = Object.entries(channelPerformance).sort(
      ([, a], [, b]) => b.rate - a.rate
    )[0];

    if (bestChannelEntry && bestChannelEntry[1].rate > 0.3) {
      recommendations.push(
        `${bestChannelEntry[0]} channel shows the best engagement rates.`
      );
    }

    // General recommendations
    if (recommendations.length === 0) {
      recommendations.push(
        'Consider A/B testing different send times to optimize engagement.'
      );
      recommendations.push(
        'Try personalizing notification content based on user preferences.'
      );
    }

    return recommendations;
  }

  // Calculate engagement over time
  private calculateEngagementOverTime(
    notifications: any[],
    timeframe: number
  ): any[] {
    const dailyEngagement: Record<
      string,
      { sent: number; opened: number; rate: number }
    > = {};

    for (const notification of notifications) {
      const dateKey = notification.created_at.toISOString().split('T')[0];

      if (!dailyEngagement[dateKey]) {
        dailyEngagement[dateKey] = { sent: 0, opened: 0, rate: 0 };
      }

      if (['sent', 'delivered', 'opened'].includes(notification.status)) {
        dailyEngagement[dateKey].sent++;
      }
      if (notification.status === 'opened') {
        dailyEngagement[dateKey].opened++;
      }
    }

    // Calculate rates and return sorted by date
    return Object.entries(dailyEngagement)
      .map(([date, data]) => ({
        date,
        sent: data.sent,
        opened: data.opened,
        rate: data.sent > 0 ? data.opened / data.sent : 0,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  // Get top performing content
  private getTopPerformingContent(notifications: any[]): unknown[] {
    const contentPerformance: Record<
      string,
      { sent: number; opened: number; rate: number; title: string }
    > = {};

    for (const notification of notifications) {
      const contentKey = notification.title || 'Untitled';

      if (!contentPerformance[contentKey]) {
        contentPerformance[contentKey] = {
          sent: 0,
          opened: 0,
          rate: 0,
          title: contentKey,
        };
      }

      if (['sent', 'delivered', 'opened'].includes(notification.status)) {
        contentPerformance[contentKey].sent++;
      }
      if (notification.status === 'opened') {
        contentPerformance[contentKey].opened++;
      }
    }

    // Calculate rates and return top 10
    return Object.values(contentPerformance)
      .map((data) => ({
        ...data,
        rate: data.sent > 0 ? data.opened / data.sent : 0,
      }))
      .sort((a, b) => b.rate - a.rate)
      .slice(0, 10);
  }
}

export const notificationService = new NotificationService();

// Export the class for direct instantiation if needed
export { NotificationService };
