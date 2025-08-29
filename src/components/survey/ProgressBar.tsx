'use client';

import { motion } from 'framer-motion';

interface ProgressBarProps {
  progress: number;
  currentStep: number;
  totalSteps: number;
  showStepNumbers?: boolean;
}

export function ProgressBar({
  progress,
  currentStep,
  totalSteps,
  showStepNumbers = true,
}: ProgressBarProps) {
  return (
    <div className="space-y-2">
      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <motion.div
          className="bg-blue-500 h-2 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>

      {/* Step Information */}
      {showStepNumbers && (
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">
            Step {currentStep} of {totalSteps}
          </span>
          <span className="text-blue-600 font-medium">
            {Math.round(progress)}% Complete
          </span>
        </div>
      )}
    </div>
  );
}
