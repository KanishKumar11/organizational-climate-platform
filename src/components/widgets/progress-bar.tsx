/**
 * Animated Progress Bar Components
 * Provides various progress indicators with smooth animations and counters
 */

'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { progressVariants, counterVariants } from '@/lib/animations';
import { AnimatedCounter } from '@/components/ui/animated';

interface ProgressBarProps {
  value: number;
  max?: number;
  className?: string;
  showLabel?: boolean;
  showValue?: boolean;
  label?: string;
  color?:
    | 'default'
    | 'survey'
    | 'microclimate'
    | 'ai'
    | 'action'
    | 'success'
    | 'warning'
    | 'error';
  size?: 'sm' | 'md' | 'lg';
  animate?: boolean;
  striped?: boolean;
  pulse?: boolean;
}

export function ProgressBar({
  value,
  max = 100,
  className,
  showLabel = false,
  showValue = false,
  label,
  color = 'default',
  size = 'md',
  animate = true,
  striped = false,
  pulse = false,
}: ProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const colorClasses = {
    default: 'bg-primary',
    survey: 'bg-survey',
    microclimate: 'bg-microclimate',
    ai: 'bg-ai',
    action: 'bg-action',
    success: 'bg-success',
    warning: 'bg-warning',
    error: 'bg-error',
  };

  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
  };

  return (
    <div className={cn('w-full', className)}>
      {(showLabel || label) && (
        <div className="flex justify-between items-center mb-2">
          {label && (
            <span className="text-sm font-medium text-foreground">{label}</span>
          )}
          {showValue && (
            <span className="text-sm text-muted-foreground">
              {animate ? (
                <AnimatedCounter value={Math.round(percentage)} />
              ) : (
                Math.round(percentage)
              )}
              %
            </span>
          )}
        </div>
      )}

      <div
        className={cn(
          'w-full bg-muted rounded-full overflow-hidden',
          sizeClasses[size]
        )}
      >
        <motion.div
          className={cn(
            'h-full rounded-full transition-colors duration-300',
            colorClasses[color],
            striped && 'bg-stripes',
            pulse && 'animate-pulse'
          )}
          initial={animate ? { width: 0 } : undefined}
          animate={
            animate ? { width: `${percentage}%` } : { width: `${percentage}%` }
          }
          transition={
            animate ? { duration: 1, ease: 'easeOut', delay: 0.2 } : undefined
          }
        />
      </div>
    </div>
  );
}

/**
 * Circular Progress Bar
 */
interface CircularProgressProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  showValue?: boolean;
  label?: string;
  color?:
    | 'default'
    | 'survey'
    | 'microclimate'
    | 'ai'
    | 'action'
    | 'success'
    | 'warning'
    | 'error';
  animate?: boolean;
}

export function CircularProgress({
  value,
  max = 100,
  size = 120,
  strokeWidth = 8,
  className,
  showValue = true,
  label,
  color = 'default',
  animate = true,
}: CircularProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const colorClasses = {
    default: 'stroke-primary',
    survey: 'stroke-survey',
    microclimate: 'stroke-microclimate',
    ai: 'stroke-ai',
    action: 'stroke-action',
    success: 'stroke-success',
    warning: 'stroke-warning',
    error: 'stroke-error',
  };

  return (
    <div
      className={cn(
        'relative inline-flex items-center justify-center',
        className
      )}
    >
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-muted opacity-20"
        />

        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          className={colorClasses[color]}
          initial={animate ? { strokeDashoffset: circumference } : undefined}
          animate={animate ? { strokeDashoffset } : { strokeDashoffset }}
          transition={
            animate ? { duration: 1, ease: 'easeOut', delay: 0.2 } : undefined
          }
          style={{
            strokeDasharray,
            strokeDashoffset: animate ? undefined : strokeDashoffset,
          }}
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {showValue && (
          <motion.div
            variants={animate ? counterVariants : undefined}
            initial={animate ? 'hidden' : undefined}
            animate={animate ? 'visible' : undefined}
            className="text-2xl font-bold text-foreground"
          >
            {animate ? (
              <AnimatedCounter value={Math.round(percentage)} />
            ) : (
              Math.round(percentage)
            )}
            %
          </motion.div>
        )}
        {label && (
          <div className="text-sm text-muted-foreground text-center mt-1">
            {label}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Multi-segment Progress Bar
 */
export interface ProgressSegment {
  value: number;
  color: string;
  label?: string;
}

interface MultiProgressProps {
  segments: ProgressSegment[];
  max?: number;
  className?: string;
  showLabels?: boolean;
  size?: 'sm' | 'md' | 'lg';
  animate?: boolean;
}

export function MultiProgress({
  segments,
  max = 100,
  className,
  showLabels = false,
  size = 'md',
  animate = true,
}: MultiProgressProps) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);
  const normalizedSegments = segments.map((segment) => ({
    ...segment,
    percentage: (segment.value / Math.max(total, max)) * 100,
  }));

  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
  };

  return (
    <div className={cn('w-full', className)}>
      <div
        className={cn(
          'w-full bg-muted rounded-full overflow-hidden flex',
          sizeClasses[size]
        )}
      >
        {normalizedSegments.map((segment, index) => (
          <motion.div
            key={index}
            className="h-full first:rounded-l-full last:rounded-r-full"
            style={{ backgroundColor: segment.color }}
            initial={animate ? { width: 0 } : undefined}
            animate={
              animate
                ? { width: `${segment.percentage}%` }
                : { width: `${segment.percentage}%` }
            }
            transition={
              animate
                ? { duration: 1, ease: 'easeOut', delay: index * 0.1 + 0.2 }
                : undefined
            }
          />
        ))}
      </div>

      {showLabels && (
        <div className="mt-2 flex flex-wrap gap-2">
          {segments.map((segment, index) => (
            <div key={index} className="flex items-center space-x-2 text-sm">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: segment.color }}
              />
              <span className="text-muted-foreground">
                {segment.label}: {segment.value}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Step Progress Bar
 */
interface StepProgressProps {
  currentStep: number;
  totalSteps: number;
  steps?: string[];
  className?: string;
  color?: 'default' | 'survey' | 'microclimate' | 'ai' | 'action';
  animate?: boolean;
}

export function StepProgress({
  currentStep,
  totalSteps,
  steps,
  className,
  color = 'default',
  animate = true,
}: StepProgressProps) {
  const colorClasses = {
    default: 'bg-primary border-primary text-primary-foreground',
    survey: 'bg-survey border-survey text-survey-foreground',
    microclimate:
      'bg-microclimate border-microclimate text-microclimate-foreground',
    ai: 'bg-ai border-ai text-ai-foreground',
    action: 'bg-action border-action text-action-foreground',
  };

  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center">
        {Array.from({ length: totalSteps }).map((_, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber <= currentStep;
          const isCurrent = stepNumber === currentStep;

          return (
            <React.Fragment key={index}>
              <motion.div
                className={cn(
                  'flex items-center justify-center w-8 h-8 rounded-full border-2 text-sm font-medium transition-all duration-300',
                  isCompleted
                    ? colorClasses[color]
                    : 'bg-muted border-muted-foreground text-muted-foreground',
                  isCurrent && 'ring-2 ring-offset-2',
                  isCurrent && color === 'default' && 'ring-primary',
                  isCurrent && color === 'survey' && 'ring-survey',
                  isCurrent && color === 'microclimate' && 'ring-microclimate',
                  isCurrent && color === 'ai' && 'ring-ai',
                  isCurrent && color === 'action' && 'ring-action'
                )}
                initial={animate ? { scale: 0.8, opacity: 0 } : undefined}
                animate={animate ? { scale: 1, opacity: 1 } : undefined}
                transition={
                  animate ? { duration: 0.3, delay: index * 0.1 } : undefined
                }
              >
                {stepNumber}
              </motion.div>

              {index < totalSteps - 1 && (
                <motion.div
                  className={cn(
                    'flex-1 h-0.5 mx-2 transition-colors duration-300',
                    stepNumber < currentStep
                      ? color === 'default'
                        ? 'bg-primary'
                        : `bg-${color}`
                      : 'bg-muted'
                  )}
                  initial={animate ? { scaleX: 0 } : undefined}
                  animate={
                    animate
                      ? { scaleX: stepNumber < currentStep ? 1 : 0 }
                      : undefined
                  }
                  transition={
                    animate
                      ? { duration: 0.5, delay: index * 0.1 + 0.2 }
                      : undefined
                  }
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {steps && (
        <div className="flex justify-between mt-2">
          {steps.map((step, index) => (
            <div
              key={index}
              className={cn(
                'text-xs text-center transition-colors duration-300',
                index + 1 <= currentStep
                  ? 'text-foreground font-medium'
                  : 'text-muted-foreground'
              )}
              style={{ width: `${100 / totalSteps}%` }}
            >
              {step}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
