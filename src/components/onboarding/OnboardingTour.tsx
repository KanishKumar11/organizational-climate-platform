'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/Progress';
import {
  X,
  ArrowRight,
  ArrowLeft,
  SkipForward,
  CheckCircle,
  Lightbulb,
  Target,
  Zap,
} from 'lucide-react';

interface OnboardingStep {
  id: string;
  title: string;
  content: string;
  target_element?: string;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action_required: boolean;
  action_text?: string;
  action_path?: string;
  skip_allowed: boolean;
}

interface OnboardingTour {
  id: string;
  name: string;
  description: string;
  steps: OnboardingStep[];
}

interface OnboardingTourProps {
  tourId?: string;
  onComplete?: () => void;
  onSkip?: () => void;
}

const OnboardingTour: React.FC<OnboardingTourProps> = ({
  tourId,
  onComplete,
  onSkip,
}) => {
  const { data: session } = useSession();
  const router = useRouter();
  const [currentTour, setCurrentTour] = useState<OnboardingTour | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (session?.user && tourId) {
      fetchTourData();
    }
  }, [session, tourId]);

  useEffect(() => {
    if (currentTour && isVisible) {
      updateTargetElement();
      window.addEventListener('resize', updateTargetElement);
      return () => window.removeEventListener('resize', updateTargetElement);
    }
  }, [currentTour, currentStepIndex, isVisible]);

  const fetchTourData = async () => {
    try {
      const response = await fetch(`/api/onboarding?action=tours`);
      const data = await response.json();

      if (data.success) {
        const tour = data.data.available_tours.find(
          (t: OnboardingTour) => t.id === tourId
        );
        if (tour) {
          setCurrentTour(tour);
          setIsVisible(true);
        }
      }
    } catch (error) {
      console.error('Error fetching tour data:', error);
    }
  };

  const updateTargetElement = () => {
    if (!currentTour) return;

    const currentStep = currentTour.steps[currentStepIndex];
    if (!currentStep.target_element) {
      setTargetElement(null);
      return;
    }

    const element = document.querySelector(
      currentStep.target_element
    ) as HTMLElement;
    if (element) {
      setTargetElement(element);

      const rect = element.getBoundingClientRect();
      const position = calculateTooltipPosition(rect, currentStep.position);
      setTooltipPosition(position);

      // Highlight the target element
      element.style.position = 'relative';
      element.style.zIndex = '1001';
      element.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.5)';
      element.style.borderRadius = '8px';
    } else {
      setTargetElement(null);
    }
  };

  const calculateTooltipPosition = (
    targetRect: DOMRect,
    position: string
  ): { x: number; y: number } => {
    const tooltipWidth = 320;
    const tooltipHeight = 200;
    const offset = 16;

    switch (position) {
      case 'top':
        return {
          x: targetRect.left + targetRect.width / 2 - tooltipWidth / 2,
          y: targetRect.top - tooltipHeight - offset,
        };
      case 'bottom':
        return {
          x: targetRect.left + targetRect.width / 2 - tooltipWidth / 2,
          y: targetRect.bottom + offset,
        };
      case 'left':
        return {
          x: targetRect.left - tooltipWidth - offset,
          y: targetRect.top + targetRect.height / 2 - tooltipHeight / 2,
        };
      case 'right':
        return {
          x: targetRect.right + offset,
          y: targetRect.top + targetRect.height / 2 - tooltipHeight / 2,
        };
      default:
        return {
          x: window.innerWidth / 2 - tooltipWidth / 2,
          y: window.innerHeight / 2 - tooltipHeight / 2,
        };
    }
  };

  const clearTargetHighlight = () => {
    if (targetElement) {
      targetElement.style.position = '';
      targetElement.style.zIndex = '';
      targetElement.style.boxShadow = '';
      targetElement.style.borderRadius = '';
    }
  };

  const handleNext = async () => {
    if (!currentTour) return;

    const currentStep = currentTour.steps[currentStepIndex];

    // Complete current step
    await completeStep(currentStep.id);

    if (currentStep.action_required && currentStep.action_path) {
      // Navigate to required action
      router.push(currentStep.action_path);
      return;
    }

    clearTargetHighlight();

    if (currentStepIndex < currentTour.steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      clearTargetHighlight();
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const handleSkip = async () => {
    if (!currentTour) return;

    try {
      await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'skip_tour',
          tour_id: currentTour.id,
        }),
      });

      clearTargetHighlight();
      setIsVisible(false);
      onSkip?.();
    } catch (error) {
      console.error('Error skipping tour:', error);
    }
  };

  const handleComplete = async () => {
    if (!currentTour) return;

    clearTargetHighlight();
    setIsVisible(false);
    onComplete?.();
  };

  const completeStep = async (stepId: string) => {
    try {
      await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'complete_step',
          step_id: stepId,
        }),
      });
    } catch (error) {
      console.error('Error completing step:', error);
    }
  };

  if (!isVisible || !currentTour) {
    return null;
  }

  const currentStep = currentTour.steps[currentStepIndex];
  const progress = ((currentStepIndex + 1) / currentTour.steps.length) * 100;

  return (
    <AnimatePresence>
      <motion.div
        ref={overlayRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-1000 bg-black/50 backdrop-blur-sm"
        onClick={(e) => {
          if (e.target === overlayRef.current) {
            handleSkip();
          }
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="absolute"
          style={{
            left: currentStep.position === 'center' ? '50%' : tooltipPosition.x,
            top: currentStep.position === 'center' ? '50%' : tooltipPosition.y,
            transform:
              currentStep.position === 'center'
                ? 'translate(-50%, -50%)'
                : 'none',
            maxWidth: '320px',
            zIndex: 1001,
          }}
        >
          <Card className="shadow-2xl border-0 bg-white">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-blue-100 to-purple-100">
                    <Lightbulb className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">
                      {currentStep.title}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      Step {currentStepIndex + 1} of {currentTour.steps.length}
                    </CardDescription>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSkip}
                  className="h-8 w-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="mt-3">
                <Progress value={progress} className="h-2" />
                <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                  <span>{currentTour.name}</span>
                  <span>{Math.round(progress)}% complete</span>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              <div className="mb-4">
                <p className="text-sm text-gray-700 leading-relaxed">
                  {currentStep.content}
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex space-x-2">
                  {currentStepIndex > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePrevious}
                      className="flex items-center space-x-1"
                    >
                      <ArrowLeft className="w-3 h-3" />
                      <span>Previous</span>
                    </Button>
                  )}

                  {currentStep.skip_allowed && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleSkip}
                      className="flex items-center space-x-1 text-gray-500"
                    >
                      <SkipForward className="w-3 h-3" />
                      <span>Skip Tour</span>
                    </Button>
                  )}
                </div>

                <div className="flex space-x-2">
                  {currentStep.action_required && currentStep.action_text ? (
                    <Button
                      onClick={handleNext}
                      className="flex items-center space-x-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                      <Target className="w-3 h-3" />
                      <span>{currentStep.action_text}</span>
                    </Button>
                  ) : currentStepIndex === currentTour.steps.length - 1 ? (
                    <Button
                      onClick={handleNext}
                      className="flex items-center space-x-1 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                    >
                      <CheckCircle className="w-3 h-3" />
                      <span>Complete</span>
                    </Button>
                  ) : (
                    <Button
                      onClick={handleNext}
                      className="flex items-center space-x-1"
                    >
                      <span>Next</span>
                      <ArrowRight className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Spotlight effect for targeted elements */}
        {targetElement && currentStep.position !== 'center' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute pointer-events-none"
            style={{
              left: targetElement.getBoundingClientRect().left - 8,
              top: targetElement.getBoundingClientRect().top - 8,
              width: targetElement.getBoundingClientRect().width + 16,
              height: targetElement.getBoundingClientRect().height + 16,
              background:
                'radial-gradient(circle, transparent 0%, rgba(0,0,0,0.7) 100%)',
              borderRadius: '12px',
              zIndex: 999,
            }}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default OnboardingTour;
