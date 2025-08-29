/**
 * Survey status indicators with color coding and real-time updates
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Play,
  Pause,
  CheckCircle,
  Edit,
  Archive,
  Clock,
  AlertTriangle,
  TrendingUp,
  Users,
  Calendar,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/Progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { getModuleColors } from '@/lib/module-colors';
import { cn } from '@/lib/utils';

export type SurveyStatus =
  | 'draft'
  | 'active'
  | 'paused'
  | 'completed'
  | 'archived'
  | 'scheduled';

interface SurveyStatusConfig {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  textColor: string;
  description: string;
  priority: number;
}

const SURVEY_STATUS_CONFIG: Record<SurveyStatus, SurveyStatusConfig> = {
  draft: {
    label: 'Draft',
    icon: Edit,
    color: 'border-gray-300 bg-gray-50',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-700',
    description: 'Survey is being created or edited',
    priority: 1,
  },
  scheduled: {
    label: 'Scheduled',
    icon: Calendar,
    color: 'border-blue-300 bg-blue-50',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-700',
    description: 'Survey is scheduled to start',
    priority: 2,
  },
  active: {
    label: 'Active',
    icon: Play,
    color: 'border-green-300 bg-green-50',
    bgColor: 'bg-green-100',
    textColor: 'text-green-700',
    description: 'Survey is currently collecting responses',
    priority: 3,
  },
  paused: {
    label: 'Paused',
    icon: Pause,
    color: 'border-yellow-300 bg-yellow-50',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-700',
    description: 'Survey is temporarily paused',
    priority: 4,
  },
  completed: {
    label: 'Completed',
    icon: CheckCircle,
    color: 'border-blue-300 bg-blue-50',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-700',
    description: 'Survey has finished collecting responses',
    priority: 5,
  },
  archived: {
    label: 'Archived',
    icon: Archive,
    color: 'border-gray-300 bg-gray-50',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-500',
    description: 'Survey has been archived',
    priority: 6,
  },
};

interface SurveyStatusIndicatorProps {
  status: SurveyStatus;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  showTooltip?: boolean;
  className?: string;
}

export function SurveyStatusIndicator({
  status,
  size = 'md',
  showLabel = true,
  showTooltip = true,
  className,
}: SurveyStatusIndicatorProps) {
  const config = SURVEY_STATUS_CONFIG[status];
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  const badgeContent = (
    <Badge
      variant="outline"
      className={cn(
        'flex items-center gap-1.5 border-2 transition-all duration-200',
        config.color,
        config.textColor,
        className
      )}
    >
      <Icon className={sizeClasses[size]} />
      {showLabel && config.label}
    </Badge>
  );

  if (showTooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{badgeContent}</TooltipTrigger>
          <TooltipContent>
            <p>{config.description}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return badgeContent;
}

interface SurveyProgressIndicatorProps {
  status: SurveyStatus;
  responseCount: number;
  targetResponses: number;
  completionRate: number;
  endDate?: string;
  className?: string;
}

export function SurveyProgressIndicator({
  status,
  responseCount,
  targetResponses,
  completionRate,
  endDate,
  className,
}: SurveyProgressIndicatorProps) {
  const surveyColors = getModuleColors('survey');
  const isActive = status === 'active';
  const isCompleted = status === 'completed';

  // Calculate days remaining
  const daysRemaining = endDate
    ? Math.ceil(
        (new Date(endDate).getTime() - new Date().getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : null;
  const isOverdue = daysRemaining !== null && daysRemaining < 0;
  const isUrgent =
    daysRemaining !== null && daysRemaining <= 3 && daysRemaining > 0;

  const getProgressColor = () => {
    if (isCompleted) return 'bg-blue-500';
    if (completionRate >= 80) return 'bg-green-500';
    if (completionRate >= 60) return 'bg-yellow-500';
    if (completionRate >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getUrgencyIndicator = () => {
    if (isOverdue) {
      return (
        <div className="flex items-center gap-1 text-red-600">
          <AlertTriangle className="h-3 w-3" />
          <span className="text-xs font-medium">Overdue</span>
        </div>
      );
    }
    if (isUrgent) {
      return (
        <div className="flex items-center gap-1 text-orange-600">
          <Clock className="h-3 w-3" />
          <span className="text-xs font-medium">
            {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} left
          </span>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={cn('space-y-2', className)}>
      {/* Progress Bar */}
      {(isActive || isCompleted) && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{completionRate.toFixed(1)}%</span>
          </div>
          <Progress
            value={completionRate}
            className="h-2"
            style={
              {
                '--progress-background': getProgressColor(),
              } as React.CSSProperties
            }
          />
        </div>
      )}

      {/* Response Count */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1 text-muted-foreground">
          <Users className="h-3 w-3" />
          <span>Responses</span>
        </div>
        <span className="font-medium">
          {responseCount.toLocaleString()} / {targetResponses.toLocaleString()}
        </span>
      </div>

      {/* Urgency Indicator */}
      {getUrgencyIndicator()}
    </div>
  );
}

interface SurveyStatusSummaryProps {
  surveys: Array<{
    status: SurveyStatus;
    response_count: number;
    target_responses: number;
    completion_rate: number;
  }>;
  className?: string;
}

export function SurveyStatusSummary({
  surveys,
  className,
}: SurveyStatusSummaryProps) {
  const statusCounts = surveys.reduce(
    (acc, survey) => {
      acc[survey.status] = (acc[survey.status] || 0) + 1;
      return acc;
    },
    {} as Record<SurveyStatus, number>
  );

  const totalResponses = surveys.reduce(
    (sum, survey) => sum + survey.response_count,
    0
  );
  const averageCompletion =
    surveys.length > 0
      ? surveys.reduce((sum, survey) => sum + survey.completion_rate, 0) /
        surveys.length
      : 0;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Status Distribution */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
        {Object.entries(SURVEY_STATUS_CONFIG)
          .sort(([, a], [, b]) => a.priority - b.priority)
          .map(([status, config]) => {
            const count = statusCounts[status as SurveyStatus] || 0;
            const Icon = config.icon;

            return (
              <motion.div
                key={status}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={cn(
                  'flex flex-col items-center p-3 rounded-lg border-2 transition-all duration-200',
                  config.color,
                  count > 0 ? 'hover:shadow-md' : 'opacity-50'
                )}
              >
                <Icon className={cn('h-5 w-5 mb-1', config.textColor)} />
                <span className={cn('text-lg font-bold', config.textColor)}>
                  {count}
                </span>
                <span className={cn('text-xs text-center', config.textColor)}>
                  {config.label}
                </span>
              </motion.div>
            );
          })}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
          <div className="p-2 bg-primary/10 rounded-lg">
            <TrendingUp className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Responses</p>
            <p className="text-lg font-semibold">
              {totalResponses.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
          <div className="p-2 bg-green-100 rounded-lg">
            <CheckCircle className="h-4 w-4 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Avg. Completion</p>
            <p className="text-lg font-semibold">
              {averageCompletion.toFixed(1)}%
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Play className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Active Surveys</p>
            <p className="text-lg font-semibold">{statusCounts.active || 0}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

interface RealTimeStatusUpdaterProps {
  surveyId: string;
  onStatusUpdate: (status: SurveyStatus, data: any) => void;
}

export function RealTimeStatusUpdater({
  surveyId,
  onStatusUpdate,
}: RealTimeStatusUpdaterProps) {
  React.useEffect(() => {
    // Set up WebSocket connection for real-time updates
    const ws = new WebSocket(
      `${process.env.NEXT_PUBLIC_WS_URL}/survey-status/${surveyId}`
    );

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      onStatusUpdate(data.status, data);
    };

    return () => {
      ws.close();
    };
  }, [surveyId, onStatusUpdate]);

  return null; // This component doesn't render anything
}
