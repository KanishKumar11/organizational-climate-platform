'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Check, AlertCircle, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Wizard Stepper Component
 * 
 * Beautiful step indicator with animations and status tracking.
 * 
 * Features:
 * - Animated step transitions
 * - Status indicators (completed, current, upcoming, error)
 * - Click to navigate (optional)
 * - Progress bar
 * - Responsive design
 * - Accessibility support
 */

export interface Step {
  id: string;
  title: string;
  description?: string;
}

export interface WizardStepperProps {
  /** All steps */
  steps: Step[];
  /** Current step index (0-based) */
  currentStep: number;
  /** Completed step indices */
  completedSteps?: number[];
  /** Error step indices */
  errorSteps?: number[];
  /** Allow clicking to navigate */
  allowNavigation?: boolean;
  /** Callback when step is clicked */
  onStepClick?: (stepIndex: number) => void;
  /** Orientation */
  orientation?: 'horizontal' | 'vertical';
  /** Size */
  size?: 'sm' | 'md' | 'lg';
  /** Show progress bar */
  showProgress?: boolean;
  /** Language */
  language?: 'es' | 'en';
}

const translations = {
  es: {
    step: 'Paso',
    completed: 'Completado',
    current: 'Actual',
    upcoming: 'Próximo',
    error: 'Error',
  },
  en: {
    step: 'Step',
    completed: 'Completed',
    current: 'Current',
    upcoming: 'Upcoming',
    error: 'Error',
  },
};

export function WizardStepper({
  steps,
  currentStep,
  completedSteps = [],
  errorSteps = [],
  allowNavigation = false,
  onStepClick,
  orientation = 'horizontal',
  size = 'md',
  showProgress = true,
  language = 'es',
}: WizardStepperProps) {
  const t = translations[language];

  // Calculate progress percentage
  const progress = ((currentStep + 1) / steps.length) * 100;

  // Get step status
  const getStatus = (index: number): 'completed' | 'current' | 'upcoming' | 'error' => {
    if (errorSteps.includes(index)) return 'error';
    if (completedSteps.includes(index)) return 'completed';
    if (index === currentStep) return 'current';
    return 'upcoming';
  };

  // Handle step click
  const handleStepClick = (index: number) => {
    if (allowNavigation && onStepClick) {
      onStepClick(index);
    }
  };

  // Size configurations
  const sizeConfig = {
    sm: {
      circle: 'w-8 h-8',
      icon: 'w-4 h-4',
      text: 'text-xs',
      gap: 'gap-2',
    },
    md: {
      circle: 'w-10 h-10',
      icon: 'w-5 h-5',
      text: 'text-sm',
      gap: 'gap-3',
    },
    lg: {
      circle: 'w-12 h-12',
      icon: 'w-6 h-6',
      text: 'text-base',
      gap: 'gap-4',
    },
  };

  const config = sizeConfig[size];

  if (orientation === 'vertical') {
    return (
      <div className="flex flex-col" role="navigation" aria-label="Wizard steps">
        {steps.map((step, index) => {
          const status = getStatus(index);
          const isClickable = allowNavigation && !!onStepClick;

          return (
            <div key={step.id} className="flex items-start gap-4">
              {/* Step indicator */}
              <div className="flex flex-col items-center">
                <StepCircle
                  status={status}
                  index={index}
                  size={config.circle}
                  iconSize={config.icon}
                  onClick={() => handleStepClick(index)}
                  clickable={isClickable}
                />
                
                {/* Connector line */}
                {index < steps.length - 1 && (
                  <div className={cn(
                    'w-0.5 flex-1 my-2',
                    status === 'completed' 
                      ? 'bg-gradient-to-b from-green-500 to-emerald-500'
                      : 'bg-gray-300'
                  )} />
                )}
              </div>

              {/* Step content */}
              <div
                className={cn(
                  'flex-1 pb-8',
                  isClickable && 'cursor-pointer',
                )}
                onClick={() => handleStepClick(index)}
              >
                <div className={cn(
                  'font-medium',
                  status === 'current' && 'text-blue-700',
                  status === 'completed' && 'text-green-700',
                  status === 'error' && 'text-red-700',
                  status === 'upcoming' && 'text-gray-500',
                  config.text,
                )}>
                  {step.title}
                </div>
                
                {step.description && (
                  <div className="text-xs text-gray-600 mt-1">
                    {step.description}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Horizontal orientation
  return (
    <div className="w-full" role="navigation" aria-label="Wizard steps">
      {/* Progress bar */}
      {showProgress && (
        <div className="mb-8">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-500"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <div className="text-xs text-gray-600 mt-2 text-center">
            {t.step} {currentStep + 1} {language === 'es' ? 'de' : 'of'} {steps.length}
          </div>
        </div>
      )}

      {/* Steps */}
      <div className="flex items-start justify-between">
        {steps.map((step, index) => {
          const status = getStatus(index);
          const isClickable = allowNavigation && !!onStepClick;

          return (
            <div
              key={step.id}
              className="flex flex-col items-center flex-1 relative"
            >
              {/* Connector line (before step) */}
              {index > 0 && (
                <div
                  className={cn(
                    'absolute top-5 right-1/2 h-0.5 w-full',
                    getStatus(index - 1) === 'completed'
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                      : 'bg-gray-300'
                  )}
                  style={{ transform: 'translateY(-50%)' }}
                />
              )}

              {/* Step circle */}
              <div className="relative z-10">
                <StepCircle
                  status={status}
                  index={index}
                  size={config.circle}
                  iconSize={config.icon}
                  onClick={() => handleStepClick(index)}
                  clickable={isClickable}
                />
              </div>

              {/* Step label */}
              <div
                className={cn(
                  'text-center mt-3 px-2',
                  isClickable && 'cursor-pointer',
                )}
                onClick={() => handleStepClick(index)}
              >
                <div className={cn(
                  'font-medium',
                  status === 'current' && 'text-blue-700',
                  status === 'completed' && 'text-green-700',
                  status === 'error' && 'text-red-700',
                  status === 'upcoming' && 'text-gray-500',
                  config.text,
                )}>
                  {step.title}
                </div>
                
                {step.description && (
                  <div className="text-xs text-gray-600 mt-1 hidden md:block">
                    {step.description}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Step Circle Component
 */
interface StepCircleProps {
  status: 'completed' | 'current' | 'upcoming' | 'error';
  index: number;
  size: string;
  iconSize: string;
  onClick?: () => void;
  clickable?: boolean;
}

function StepCircle({ status, index, size, iconSize, onClick, clickable }: StepCircleProps) {
  // Status configurations
  const statusConfig = {
    completed: {
      bg: 'bg-gradient-to-br from-green-500 to-emerald-500',
      ring: 'ring-green-200',
      icon: <Check className={iconSize} />,
      shadow: 'shadow-lg shadow-green-200',
    },
    current: {
      bg: 'bg-gradient-to-br from-blue-500 to-indigo-500',
      ring: 'ring-blue-300 ring-4',
      icon: <Circle className={cn(iconSize, 'fill-current')} />,
      shadow: 'shadow-lg shadow-blue-200',
    },
    error: {
      bg: 'bg-gradient-to-br from-red-500 to-rose-500',
      ring: 'ring-red-200',
      icon: <AlertCircle className={iconSize} />,
      shadow: 'shadow-lg shadow-red-200',
    },
    upcoming: {
      bg: 'bg-gray-300',
      ring: 'ring-gray-200',
      icon: <span className="font-semibold">{index + 1}</span>,
      shadow: '',
    },
  };

  const config = statusConfig[status];

  return (
    <motion.div
      className={cn(
        size,
        config.bg,
        config.ring,
        config.shadow,
        'rounded-full flex items-center justify-center text-white',
        'transition-all duration-200',
        clickable && 'cursor-pointer hover:scale-110',
      )}
      onClick={onClick}
      whileHover={clickable ? { scale: 1.1 } : undefined}
      whileTap={clickable ? { scale: 0.95 } : undefined}
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{
        type: 'spring',
        stiffness: 260,
        damping: 20,
      }}
      role="button"
      aria-label={`Step ${index + 1}`}
      tabIndex={clickable ? 0 : -1}
    >
      {config.icon}
    </motion.div>
  );
}

/**
 * Compact Stepper (for mobile)
 */
export function CompactWizardStepper({
  steps,
  currentStep,
  language = 'es',
}: Pick<WizardStepperProps, 'steps' | 'currentStep' | 'language'>) {
  const t = translations[language];
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="w-full">
      {/* Progress bar */}
      <div className="flex items-center gap-3 mb-2">
        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <div className="text-sm font-medium text-gray-700 whitespace-nowrap">
          {currentStep + 1}/{steps.length}
        </div>
      </div>

      {/* Current step */}
      <div className="text-sm">
        <span className="text-gray-600">{t.step} {currentStep + 1}: </span>
        <span className="font-medium text-gray-900">
          {steps[currentStep].title}
        </span>
      </div>
    </div>
  );
}
