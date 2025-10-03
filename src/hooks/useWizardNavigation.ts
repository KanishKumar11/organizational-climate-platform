import { useState, useCallback, useMemo } from 'react';

/**
 * Wizard Navigation Hook
 * 
 * Manages multi-step wizard state, navigation, and validation.
 * 
 * Features:
 * - Step tracking (current, completed, visited)
 * - Navigation with validation
 * - Progress calculation
 * - Step completion tracking
 * - History management
 */

export interface WizardStep {
  id: string;
  title: string;
  description?: string;
  /** Optional validation function */
  validate?: () => boolean | Promise<boolean>;
  /** Can skip this step */
  optional?: boolean;
}

export interface WizardNavigationOptions {
  /** All wizard steps */
  steps: WizardStep[];
  /** Initial step index (0-based) */
  initialStep?: number;
  /** Allow navigation to any step */
  allowJumpToAny?: boolean;
  /** Callback when step changes */
  onStepChange?: (newStep: number, oldStep: number) => void;
  /** Callback when wizard completes */
  onComplete?: () => void;
  /** Callback when validation fails */
  onValidationFailed?: (step: number, error?: string) => void;
}

export function useWizardNavigation({
  steps,
  initialStep = 0,
  allowJumpToAny = false,
  onStepChange,
  onComplete,
  onValidationFailed,
}: WizardNavigationOptions) {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [visitedSteps, setVisitedSteps] = useState<Set<number>>(
    new Set([initialStep])
  );
  const [validationErrors, setValidationErrors] = useState<Map<number, string>>(
    new Map()
  );

  // Calculate progress
  const progress = useMemo(() => {
    return ((currentStep + 1) / steps.length) * 100;
  }, [currentStep, steps.length]);

  // Check if current step is completed
  const isCurrentStepCompleted = useMemo(() => {
    return completedSteps.has(currentStep);
  }, [completedSteps, currentStep]);

  // Check if current step is valid
  const isCurrentStepValid = useMemo(() => {
    return !validationErrors.has(currentStep);
  }, [validationErrors, currentStep]);

  // Check navigation availability
  const canGoNext = useMemo(() => {
    return currentStep < steps.length - 1;
  }, [currentStep, steps.length]);

  const canGoPrevious = useMemo(() => {
    return currentStep > 0;
  }, [currentStep]);

  const isFirstStep = useMemo(() => {
    return currentStep === 0;
  }, [currentStep]);

  const isLastStep = useMemo(() => {
    return currentStep === steps.length - 1;
  }, [currentStep, steps.length]);

  // Validate current step
  const validateCurrentStep = useCallback(async (): Promise<boolean> => {
    const step = steps[currentStep];
    
    if (!step.validate) {
      // No validation required
      setValidationErrors(prev => {
        const next = new Map(prev);
        next.delete(currentStep);
        return next;
      });
      return true;
    }

    try {
      const isValid = await step.validate();
      
      if (isValid) {
        setValidationErrors(prev => {
          const next = new Map(prev);
          next.delete(currentStep);
          return next;
        });
        return true;
      } else {
        const error = 'Validation failed';
        setValidationErrors(prev => {
          const next = new Map(prev);
          next.set(currentStep, error);
          return next;
        });
        onValidationFailed?.(currentStep, error);
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setValidationErrors(prev => {
        const next = new Map(prev);
        next.set(currentStep, errorMessage);
        return next;
      });
      onValidationFailed?.(currentStep, errorMessage);
      return false;
    }
  }, [currentStep, steps, onValidationFailed]);

  // Mark current step as completed
  const markStepCompleted = useCallback((stepIndex: number = currentStep) => {
    setCompletedSteps(prev => new Set(prev).add(stepIndex));
  }, [currentStep]);

  // Mark current step as incomplete
  const markStepIncomplete = useCallback((stepIndex: number = currentStep) => {
    setCompletedSteps(prev => {
      const next = new Set(prev);
      next.delete(stepIndex);
      return next;
    });
  }, [currentStep]);

  // Navigate to specific step
  const goToStep = useCallback(async (stepIndex: number, skipValidation = false): Promise<boolean> => {
    // Bounds check
    if (stepIndex < 0 || stepIndex >= steps.length) {
      return false;
    }

    // Already on this step
    if (stepIndex === currentStep) {
      return true;
    }

    // Check if jumping ahead is allowed
    if (!allowJumpToAny && stepIndex > currentStep) {
      // Can only jump to next step
      if (stepIndex !== currentStep + 1) {
        return false;
      }
    }

    // Validate current step before moving forward
    if (!skipValidation && stepIndex > currentStep) {
      const isValid = await validateCurrentStep();
      if (!isValid) {
        return false;
      }
      markStepCompleted(currentStep);
    }

    // Update state
    const oldStep = currentStep;
    setCurrentStep(stepIndex);
    setVisitedSteps(prev => new Set(prev).add(stepIndex));
    onStepChange?.(stepIndex, oldStep);

    return true;
  }, [currentStep, steps.length, allowJumpToAny, validateCurrentStep, markStepCompleted, onStepChange]);

  // Go to next step
  const goNext = useCallback(async (skipValidation = false): Promise<boolean> => {
    if (!canGoNext) {
      return false;
    }
    return await goToStep(currentStep + 1, skipValidation);
  }, [canGoNext, currentStep, goToStep]);

  // Go to previous step
  const goPrevious = useCallback(async (): Promise<boolean> => {
    if (!canGoPrevious) {
      return false;
    }
    return await goToStep(currentStep - 1, true); // Skip validation when going back
  }, [canGoPrevious, currentStep, goToStep]);

  // Go to first step
  const goToFirst = useCallback(async (): Promise<boolean> => {
    return await goToStep(0, true);
  }, [goToStep]);

  // Complete wizard
  const complete = useCallback(async (): Promise<boolean> => {
    // Validate final step
    const isValid = await validateCurrentStep();
    if (!isValid) {
      return false;
    }

    markStepCompleted(currentStep);
    onComplete?.();
    return true;
  }, [validateCurrentStep, markStepCompleted, currentStep, onComplete]);

  // Reset wizard
  const reset = useCallback(() => {
    setCurrentStep(initialStep);
    setCompletedSteps(new Set());
    setVisitedSteps(new Set([initialStep]));
    setValidationErrors(new Map());
  }, [initialStep]);

  // Get step status
  const getStepStatus = useCallback((stepIndex: number): 'completed' | 'current' | 'upcoming' | 'error' => {
    if (validationErrors.has(stepIndex)) {
      return 'error';
    }
    if (completedSteps.has(stepIndex)) {
      return 'completed';
    }
    if (stepIndex === currentStep) {
      return 'current';
    }
    return 'upcoming';
  }, [completedSteps, currentStep, validationErrors]);

  return {
    // State
    currentStep,
    currentStepData: steps[currentStep],
    steps,
    completedSteps: Array.from(completedSteps),
    visitedSteps: Array.from(visitedSteps),
    validationErrors: Object.fromEntries(validationErrors),
    progress,
    
    // Status checks
    canGoNext,
    canGoPrevious,
    isFirstStep,
    isLastStep,
    isCurrentStepCompleted,
    isCurrentStepValid,
    
    // Navigation
    goNext,
    goPrevious,
    goToStep,
    goToFirst,
    complete,
    reset,
    
    // Utilities
    validateCurrentStep,
    markStepCompleted,
    markStepIncomplete,
    getStepStatus,
  };
}

/**
 * Get step icon based on status
 */
export function getStepIcon(status: 'completed' | 'current' | 'upcoming' | 'error'): string {
  switch (status) {
    case 'completed':
      return '✓';
    case 'current':
      return '●';
    case 'error':
      return '✕';
    case 'upcoming':
      return '○';
  }
}
