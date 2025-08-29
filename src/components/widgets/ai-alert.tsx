/**
 * AI Alert Components
 * Displays AI-generated insights and recommendations with priority-based styling and animations
 */

'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { alertVariants } from '@/lib/animations';
import {
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle,
  Zap,
  TrendingUp,
  TrendingDown,
  Users,
  Brain,
  Target,
  Clock,
  X,
} from 'lucide-react';

export interface AIAlert {
  id: string;
  type:
    | 'insight'
    | 'recommendation'
    | 'warning'
    | 'success'
    | 'error'
    | 'prediction';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  confidence?: number;
  category?: string;
  timestamp?: Date;
  actionable?: boolean;
  actions?: Array<{
    label: string;
    action: () => void;
    variant?: 'primary' | 'secondary' | 'outline';
  }>;
  metadata?: Record<string, any>;
  dismissible?: boolean;
}

interface AIAlertProps {
  alert: AIAlert;
  className?: string;
  onDismiss?: (alertId: string) => void;
  onAction?: (alertId: string, actionLabel: string) => void;
  animate?: boolean;
  compact?: boolean;
}

export function AIAlertCard({
  alert,
  className,
  onDismiss,
  onAction,
  animate = true,
  compact = false,
}: AIAlertProps) {
  const [isVisible, setIsVisible] = React.useState(true);

  const handleDismiss = () => {
    if (alert.dismissible && onDismiss) {
      setIsVisible(false);
      setTimeout(() => onDismiss(alert.id), 300);
    }
  };

  const handleAction = (actionLabel: string, actionFn: () => void) => {
    actionFn();
    if (onAction) {
      onAction(alert.id, actionLabel);
    }
  };

  // Icon mapping
  const getIcon = () => {
    switch (alert.type) {
      case 'insight':
        return <Brain className="w-5 h-5" />;
      case 'recommendation':
        return <Target className="w-5 h-5" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5" />;
      case 'success':
        return <CheckCircle className="w-5 h-5" />;
      case 'error':
        return <XCircle className="w-5 h-5" />;
      case 'prediction':
        return <TrendingUp className="w-5 h-5" />;
      default:
        return <Info className="w-5 h-5" />;
    }
  };

  // Priority-based styling
  const getPriorityStyles = () => {
    switch (alert.priority) {
      case 'low':
        return {
          container: 'border-info/30 bg-info/5',
          icon: 'text-info',
          title: 'text-info',
          glow: false,
        };
      case 'medium':
        return {
          container: 'border-warning/30 bg-warning/5',
          icon: 'text-warning',
          title: 'text-warning',
          glow: false,
        };
      case 'high':
        return {
          container: 'border-error/30 bg-error/5',
          icon: 'text-error',
          title: 'text-error',
          glow: false,
        };
      case 'critical':
        return {
          container: 'border-error/50 bg-error/10 shadow-lg shadow-error/20',
          icon: 'text-error',
          title: 'text-error',
          glow: true,
        };
      default:
        return {
          container: 'border-border bg-card',
          icon: 'text-muted-foreground',
          title: 'text-foreground',
          glow: false,
        };
    }
  };

  const styles = getPriorityStyles();

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        variants={animate ? alertVariants : undefined}
        initial={animate ? 'hidden' : undefined}
        animate={animate ? 'visible' : undefined}
        exit={animate ? 'exit' : undefined}
        className={cn(
          'relative border-2 rounded-lg p-4 transition-all duration-300',
          styles.container,
          styles.glow && 'animate-glow',
          compact ? 'p-3' : 'p-4',
          className
        )}
      >
        {/* Dismiss button */}
        {alert.dismissible && (
          <button
            onClick={handleDismiss}
            className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        )}

        <div className="flex items-start space-x-3">
          {/* Icon */}
          <div className={cn('flex-shrink-0 mt-0.5', styles.icon)}>
            {getIcon()}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <h4
                className={cn(
                  'font-semibold',
                  compact ? 'text-sm' : 'text-base',
                  styles.title
                )}
              >
                {alert.title}
              </h4>

              {/* Priority badge */}
              <span
                className={cn(
                  'px-2 py-1 text-xs font-medium rounded-full',
                  alert.priority === 'low' && 'bg-info/20 text-info',
                  alert.priority === 'medium' && 'bg-warning/20 text-warning',
                  alert.priority === 'high' && 'bg-error/20 text-error',
                  alert.priority === 'critical' &&
                    'bg-error/30 text-error animate-pulse'
                )}
              >
                {alert.priority.toUpperCase()}
              </span>
            </div>

            {/* Message */}
            <p
              className={cn(
                'text-muted-foreground mb-3',
                compact ? 'text-sm' : 'text-base'
              )}
            >
              {alert.message}
            </p>

            {/* Metadata */}
            {!compact &&
              (alert.confidence || alert.category || alert.timestamp) && (
                <div className="flex items-center space-x-4 mb-3 text-xs text-muted-foreground">
                  {alert.confidence && (
                    <div className="flex items-center space-x-1">
                      <Zap className="w-3 h-3" />
                      <span>
                        Confidence: {Math.round(alert.confidence * 100)}%
                      </span>
                    </div>
                  )}
                  {alert.category && (
                    <div className="flex items-center space-x-1">
                      <Users className="w-3 h-3" />
                      <span>{alert.category}</span>
                    </div>
                  )}
                  {alert.timestamp && (
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{alert.timestamp.toLocaleTimeString()}</span>
                    </div>
                  )}
                </div>
              )}

            {/* Actions */}
            {alert.actions && alert.actions.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {alert.actions.map((action, index) => (
                  <button
                    key={index}
                    onClick={() => handleAction(action.label, action.action)}
                    className={cn(
                      'px-3 py-1 text-sm font-medium rounded transition-colors',
                      compact ? 'px-2 py-1 text-xs' : 'px-3 py-1 text-sm',
                      action.variant === 'primary' &&
                        'bg-primary text-primary-foreground hover:bg-primary/90',
                      action.variant === 'secondary' &&
                        'bg-secondary text-secondary-foreground hover:bg-secondary/90',
                      (!action.variant || action.variant === 'outline') &&
                        'border border-border hover:bg-muted'
                    )}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * AI Alert List Container
 */
interface AIAlertListProps {
  alerts: AIAlert[];
  className?: string;
  maxAlerts?: number;
  onDismiss?: (alertId: string) => void;
  onAction?: (alertId: string, actionLabel: string) => void;
  animate?: boolean;
  compact?: boolean;
  groupByPriority?: boolean;
}

export function AIAlertList({
  alerts,
  className,
  maxAlerts = 10,
  onDismiss,
  onAction,
  animate = true,
  compact = false,
  groupByPriority = false,
}: AIAlertListProps) {
  const sortedAlerts = React.useMemo(() => {
    const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    return alerts
      .sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority])
      .slice(0, maxAlerts);
  }, [alerts, maxAlerts]);

  const groupedAlerts = React.useMemo(() => {
    if (!groupByPriority) return { all: sortedAlerts };

    return sortedAlerts.reduce(
      (groups, alert) => {
        const priority = alert.priority;
        if (!groups[priority]) groups[priority] = [];
        groups[priority].push(alert);
        return groups;
      },
      {} as Record<string, AIAlert[]>
    );
  }, [sortedAlerts, groupByPriority]);

  if (alerts.length === 0) {
    return (
      <div className={cn('text-center py-8 text-muted-foreground', className)}>
        <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No AI insights available</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {groupByPriority
        ? Object.entries(groupedAlerts).map(([priority, priorityAlerts]) => (
            <div key={priority}>
              <h3 className="text-sm font-medium text-muted-foreground mb-2 capitalize">
                {priority} Priority ({priorityAlerts.length})
              </h3>
              <div className="space-y-3">
                {priorityAlerts.map((alert) => (
                  <AIAlertCard
                    key={alert.id}
                    alert={alert}
                    onDismiss={onDismiss}
                    onAction={onAction}
                    animate={animate}
                    compact={compact}
                  />
                ))}
              </div>
            </div>
          ))
        : sortedAlerts.map((alert) => (
            <AIAlertCard
              key={alert.id}
              alert={alert}
              onDismiss={onDismiss}
              onAction={onAction}
              animate={animate}
              compact={compact}
            />
          ))}
    </div>
  );
}

/**
 * Floating AI Alert Notification
 */
interface FloatingAlertProps {
  alert: AIAlert;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  autoHide?: boolean;
  hideDelay?: number;
  onDismiss?: (alertId: string) => void;
  onAction?: (alertId: string, actionLabel: string) => void;
}

export function FloatingAIAlert({
  alert,
  position = 'top-right',
  autoHide = true,
  hideDelay = 5000,
  onDismiss,
  onAction,
}: FloatingAlertProps) {
  const [isVisible, setIsVisible] = React.useState(true);

  React.useEffect(() => {
    if (autoHide && hideDelay > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => onDismiss?.(alert.id), 300);
      }, hideDelay);

      return () => clearTimeout(timer);
    }
  }, [autoHide, hideDelay, alert.id, onDismiss]);

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
  };

  if (!isVisible) return null;

  return (
    <div className={cn('fixed z-50 max-w-sm', positionClasses[position])}>
      <AIAlertCard
        alert={alert}
        onDismiss={() => {
          setIsVisible(false);
          setTimeout(() => onDismiss?.(alert.id), 300);
        }}
        onAction={onAction}
        animate={true}
        compact={true}
        className="shadow-lg"
      />
    </div>
  );
}

/**
 * AI Alert Summary Widget
 */
interface AlertSummaryProps {
  alerts: AIAlert[];
  className?: string;
  showCounts?: boolean;
  onClick?: () => void;
}

export function AIAlertSummary({
  alerts,
  className,
  showCounts = true,
  onClick,
}: AlertSummaryProps) {
  const counts = React.useMemo(() => {
    return alerts.reduce(
      (acc, alert) => {
        acc[alert.priority] = (acc[alert.priority] || 0) + 1;
        acc.total += 1;
        return acc;
      },
      { critical: 0, high: 0, medium: 0, low: 0, total: 0 }
    );
  }, [alerts]);

  const hasAlerts = counts.total > 0;
  const hasCritical = counts.critical > 0;

  return (
    <motion.div
      className={cn(
        'p-4 border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md',
        hasCritical && 'border-error/30 bg-error/5',
        !hasCritical && hasAlerts && 'border-warning/30 bg-warning/5',
        !hasAlerts && 'border-border bg-card',
        className
      )}
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div
            className={cn(
              'p-2 rounded-full',
              hasCritical && 'bg-error/20 text-error',
              !hasCritical && hasAlerts && 'bg-warning/20 text-warning',
              !hasAlerts && 'bg-muted text-muted-foreground'
            )}
          >
            <Brain className="w-5 h-5" />
          </div>

          <div>
            <h3 className="font-medium">AI Insights</h3>
            <p className="text-sm text-muted-foreground">
              {hasAlerts
                ? `${counts.total} active insights`
                : 'No active insights'}
            </p>
          </div>
        </div>

        {showCounts && hasAlerts && (
          <div className="flex space-x-2">
            {counts.critical > 0 && (
              <span className="px-2 py-1 text-xs font-medium bg-error/20 text-error rounded-full">
                {counts.critical}
              </span>
            )}
            {counts.high > 0 && (
              <span className="px-2 py-1 text-xs font-medium bg-error/10 text-error rounded-full">
                {counts.high}
              </span>
            )}
            {counts.medium > 0 && (
              <span className="px-2 py-1 text-xs font-medium bg-warning/20 text-warning rounded-full">
                {counts.medium}
              </span>
            )}
            {counts.low > 0 && (
              <span className="px-2 py-1 text-xs font-medium bg-info/20 text-info rounded-full">
                {counts.low}
              </span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
