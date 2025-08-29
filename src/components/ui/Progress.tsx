'use client';

import { forwardRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { CheckCircle, Circle, Clock } from 'lucide-react';

interface ProgressProps {
  value: number;
  max?: number;
  className?: string;
  showLabel?: boolean;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'destructive';
  animated?: boolean;
}

interface StepProgressProps {
  steps: Array<{
    id: string;
    label: string;
    status: 'completed' | 'current' | 'pending';
    description?: string;
  }>;
  className?: string;
  orientation?: 'horizontal' | 'vertical';
}

interface CircularProgressProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  showLabel?: boolean;
  label?: string;
  variant?: 'default' | 'success' | 'warning' | 'destructive';
}

const sizeClasses = {
  sm: 'h-2',
  md: 'h-3',
  lg: 'h-4',
};

const variantClasses = {
  default: 'bg-primary',
  success: 'bg-green-500',
  warning: 'bg-yellow-500',
  destructive: 'bg-red-500',
};

export const Progress = forwardRef<HTMLDivElement, ProgressProps>(
  (
    {
      value,
      max = 100,
      className,
      showLabel = false,
      label,
      size = 'md',
      variant = 'default',
      animated = true,
      ...props
    },
    ref
  ) => {
    const [displayValue, setDisplayValue] = useState(0);
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

    useEffect(() => {
      if (animated) {
        const timer = setTimeout(() => setDisplayValue(percentage), 100);
        return () => clearTimeout(timer);
      } else {
        setDisplayValue(percentage);
      }
    }, [percentage, animated]);

    return (
      <div className={cn('space-y-2', className)} ref={ref} {...props}>
        {(showLabel || label) && (
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">{label || 'Progress'}</span>
            <span className="text-sm text-muted-foreground">
              {Math.round(percentage)}%
            </span>
          </div>
        )}
        <div
          className={cn(
            'w-full bg-secondary rounded-full overflow-hidden',
            sizeClasses[size]
          )}
        >
          <motion.div
            className={cn('h-full rounded-full', variantClasses[variant])}
            initial={{ width: 0 }}
            animate={{ width: `${displayValue}%` }}
            transition={{
              duration: animated ? 0.8 : 0,
              ease: [0.25, 0.25, 0, 1],
            }}
          />
        </div>
      </div>
    );
  }
);

Progress.displayName = 'Progress';

export function StepProgress({
  steps,
  className,
  orientation = 'horizontal',
}: StepProgressProps) {
  const currentStepIndex = steps.findIndex((step) => step.status === 'current');
  const completedSteps = steps.filter(
    (step) => step.status === 'completed'
  ).length;

  if (orientation === 'vertical') {
    return (
      <div className={cn('space-y-4', className)}>
        {steps.map((step, index) => (
          <motion.div
            key={step.id}
            className="flex items-start gap-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors',
                  step.status === 'completed' &&
                    'bg-primary border-primary text-primary-foreground',
                  step.status === 'current' &&
                    'border-primary text-primary bg-background',
                  step.status === 'pending' &&
                    'border-muted-foreground text-muted-foreground bg-background'
                )}
              >
                {step.status === 'completed' ? (
                  <CheckCircle className="w-4 h-4" />
                ) : step.status === 'current' ? (
                  <Clock className="w-4 h-4" />
                ) : (
                  <Circle className="w-4 h-4" />
                )}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'w-0.5 h-8 mt-2',
                    index < currentStepIndex ? 'bg-primary' : 'bg-muted'
                  )}
                />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4
                className={cn(
                  'text-sm font-medium',
                  step.status === 'pending' && 'text-muted-foreground'
                )}
              >
                {step.label}
              </h4>
              {step.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {step.description}
                </p>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center flex-1">
            <motion.div
              className="flex flex-col items-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors',
                  step.status === 'completed' &&
                    'bg-primary border-primary text-primary-foreground',
                  step.status === 'current' &&
                    'border-primary text-primary bg-background',
                  step.status === 'pending' &&
                    'border-muted-foreground text-muted-foreground bg-background'
                )}
              >
                {step.status === 'completed' ? (
                  <CheckCircle className="w-4 h-4" />
                ) : step.status === 'current' ? (
                  <Clock className="w-4 h-4" />
                ) : (
                  <span className="text-xs font-medium">{index + 1}</span>
                )}
              </div>
              <span
                className={cn(
                  'text-xs font-medium mt-2 text-center',
                  step.status === 'pending' && 'text-muted-foreground'
                )}
              >
                {step.label}
              </span>
            </motion.div>
            {index < steps.length - 1 && (
              <div className="flex-1 mx-4">
                <div
                  className={cn(
                    'h-0.5 w-full transition-colors',
                    index < currentStepIndex ? 'bg-primary' : 'bg-muted'
                  )}
                />
              </div>
            )}
          </div>
        ))}
      </div>
      <Progress
        value={completedSteps}
        max={steps.length}
        showLabel
        label="Overall Progress"
        animated
      />
    </div>
  );
}

export function CircularProgress({
  value,
  max = 100,
  size = 120,
  strokeWidth = 8,
  className,
  showLabel = true,
  label,
  variant = 'default',
}: CircularProgressProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (displayValue / 100) * circumference;

  const colors = {
    default: '#3b82f6',
    success: '#10b981',
    warning: '#f59e0b',
    destructive: '#ef4444',
  };

  useEffect(() => {
    const timer = setTimeout(() => setDisplayValue(percentage), 100);
    return () => clearTimeout(timer);
  }, [percentage]);

  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <div className="relative">
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="transparent"
            className="text-muted"
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={colors[variant]}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeLinecap="round"
            strokeDasharray={strokeDasharray}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 0.8, ease: [0.25, 0.25, 0, 1] }}
          />
        </svg>
        {showLabel && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold">
                {Math.round(displayValue)}%
              </div>
              {label && (
                <div className="text-xs text-muted-foreground">{label}</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
