/**
 * SurveyProgressBar Component
 *
 * Displays survey creation progress with visual indicators
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle2, Circle, Lock } from 'lucide-react';
import { Progress } from '@/components/ui/Progress';
import { Badge } from '@/components/ui/badge';

interface SurveyProgressBarProps {
  percentage: number;
  completedRequired: number;
  totalRequired: number;
  completedOptional: number;
  totalOptional: number;
  className?: string;
}

export function SurveyProgressBar({
  percentage,
  completedRequired,
  totalRequired,
  completedOptional,
  totalOptional,
  className,
}: SurveyProgressBarProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {/* Progress Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Survey Setup Progress
          </h3>
          {percentage === 100 && (
            <Badge variant="default" className="bg-green-500">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Ready to Publish
            </Badge>
          )}
        </div>
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          {percentage}%
        </span>
      </div>

      {/* Progress Bar */}
      <Progress value={percentage} className="h-2" />

      {/* Progress Details */}
      <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
        <div className="flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
          <span>
            {completedRequired} of {totalRequired} required steps
          </span>
        </div>
        {totalOptional > 0 && (
          <>
            <span className="text-gray-300 dark:text-gray-600">•</span>
            <div className="flex items-center gap-1">
              <Circle className="w-3.5 h-3.5 text-blue-500" />
              <span>
                {completedOptional} of {totalOptional} optional steps
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
