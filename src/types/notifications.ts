// Notification system types and interfaces
// This file centralizes all notification-related type definitions

import { Document } from 'mongoose';
import {
  NotificationType,
  NotificationPriority,
  NotificationStatus,
  NotificationChannel,
  NotificationMetadata,
  INotification,
} from '@/models/Notification';

// Notification item for frontend use (extends INotification with string dates)
export interface NotificationItem
  extends Omit<
    INotification,
    | 'scheduled_for'
    | 'sent_at'
    | 'delivered_at'
    | 'opened_at'
    | 'created_at'
    | 'updated_at'
  > {
  scheduled_for: string;
  sent_at?: string;
  delivered_at?: string;
  opened_at?: string;
  created_at: string;
  updated_at: string;
}

// Notification data for creation
export interface NotificationData {
  user_id: string;
  company_id: string;
  type: NotificationType;
  channel: NotificationChannel;
  priority?: NotificationPriority;
  title?: string;
  message?: string;
  data?: Record<string, string | number | boolean | null>;
  template_id?: string;
  scheduled_for?: Date;
  variables?: Record<string, string | number | boolean>;
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

// Channel metrics interface
export interface ChannelMetrics {
  sent: number;
  delivered: number;
  opened: number;
  engagement_rate: number;
}

// Type metrics interface
export interface TypeMetrics {
  sent: number;
  delivered: number;
  opened: number;
  engagement_rate: number;
}

// Time metrics interface
export interface TimeMetrics {
  sent: number;
  delivered: number;
  opened: number;
  engagement_rate: number;
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
    by_channel: Record<NotificationChannel, ChannelMetrics>;
    by_type: Record<NotificationType, TypeMetrics>;
    by_time: Record<string, TimeMetrics>;
  };
}

// Notification query filters
export interface NotificationFilters {
  user_id?: string;
  company_id?: string;
  type?: NotificationType[];
  channel?: NotificationChannel[];
  priority?: NotificationPriority[];
  status?: NotificationStatus[];
  date_from?: Date;
  date_to?: Date;
}

// Bulk operation interfaces
export interface BulkNotificationOperation {
  notificationIds: string[];
  user_id: string;
  action: 'send' | 'cancel' | 'delete' | 'mark_opened';
  filters?: NotificationFilters;
}

// Notification template data
export interface NotificationTemplateData {
  subject?: string;
  html_content?: string;
  text_content?: string;
  variables?: Record<string, string | number | boolean>;
}

// Notification preferences
export interface NotificationPreferences {
  email_enabled: boolean;
  push_enabled: boolean;
  in_app_enabled: boolean;
  sms_enabled: boolean;
  types: Record<
    NotificationType,
    {
      email: boolean;
      push: boolean;
      in_app: boolean;
      sms: boolean;
    }
  >;
  quiet_hours: {
    enabled: boolean;
    start: string; // HH:MM format
    end: string; // HH:MM format
    timezone: string;
  };
  frequency_limits: {
    max_per_day: number;
    max_per_hour: number;
  };
}

// Performance metrics
export interface PerformanceMetrics {
  total_notifications: number;
  delivery_success_rate: number;
  average_response_time: number;
  engagement_rate: number;
  failure_rate: number;
  channel_performance: Record<NotificationChannel, ChannelMetrics>;
  hourly_performance: Record<number, TimeMetrics>;
  daily_performance: Record<string, TimeMetrics>;
}

// Notification update data
export interface NotificationUpdateData {
  status?: NotificationStatus;
  sent_at?: Date;
  delivered_at?: Date;
  opened_at?: Date;
  cancelled_at?: Date;
  cancelled_by?: string;
  is_read?: boolean;
  read_at?: Date | null;
  metadata?: NotificationMetadata;
  error_message?: string;
}

// API response interfaces
export interface NotificationApiResponse {
  success: boolean;
  data?: INotification[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  error?: string;
}

export interface BulkOperationResponse {
  success: boolean;
  processed: number;
  failed: number;
  errors?: string[];
}

// Database query interfaces
export interface NotificationQuery {
  _id?: string | { $in: string[] };
  user_id?: string | { $in: string[] };
  company_id?: string;
  type?: { $in: NotificationType[] } | NotificationType | string;
  channel?: { $in: NotificationChannel[] };
  priority?: { $in: NotificationPriority[] };
  status?: { $in: NotificationStatus[] } | NotificationStatus | string;
  created_at?: {
    $gte?: Date;
    $lte?: Date;
  };
  scheduled_for?: {
    $gte?: Date;
    $lte?: Date;
  };
}

// Time constraints for scheduling
export interface TimeConstraints {
  timezone: string;
  business_hours_only: boolean;
  business_hours_start: string; // HH:MM
  business_hours_end: string; // HH:MM
  exclude_weekends: boolean;
  exclude_holidays: boolean;
}

// Notification scheduling options
export interface SchedulingOptions {
  send_immediately: boolean;
  scheduled_for?: Date;
  time_constraints?: TimeConstraints;
  priority_boost?: boolean;
}

// Content analysis result
export interface ContentAnalysisResult {
  sentiment_score: number; // -1 to 1
  urgency_level: number; // 0 to 1
  recommended_channel: NotificationChannel;
  recommended_priority: NotificationPriority;
  keywords: string[];
  suggested_title?: string;
  suggested_message?: string;
}

// Notification batch data
export interface NotificationBatch {
  notifications: NotificationData[];
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  templateData?: NotificationTemplateData;
}
