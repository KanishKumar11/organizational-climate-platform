'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ISurvey, IQuestion } from '@/models/Survey';
import { IQuestionResponse } from '@/models/Response';
import { QuestionRenderer } from './QuestionRenderer';
import { ProgressBar } from './ProgressBar';
import { SurveyNavigation } from './SurveyNavigation';
import { SurveyCompletion } from './SurveyCompletion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { shouldShowQuestion } from '@/lib/validation';
import { useOfflineSync } from '@/hooks/useOfflineSync';

interface SurveyInterfaceProps {
  survey: ISurvey;
  invitationToken?: string | null;
}

export function SurveyInterface({
  survey,
  invitationToken,
}: SurveyInterfaceProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState<IQuestionResponse[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random()}`);
  const [startTime] = useState(() => new Date());
  const [questionStartTime, setQuestionStartTime] = useState<Date>(new Date());

  // Offline sync hook
  const { isOnline, syncPendingData } = useOfflineSync();

  // Filter questions based on conditional logic
  const visibleQuestions = survey.questions.filter((question) =>
    shouldShowQuestion(question, responses)
  );

  const totalSteps = visibleQuestions.length;
  const currentQuestion =
    currentStep < visibleQuestions.length
      ? visibleQuestions[currentStep]
      : null;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  // Auto-save functionality
  const autoSave = useCallback(async () => {
    if (!survey.settings.auto_save || responses.length === 0) return;

    try {
      const payload = {
        responses,
        is_complete: false,
        session_id: sessionId,
        invitation_token: invitationToken,
      };

      if (isOnline) {
        await fetch(`/api/surveys/${survey._id}/responses`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        // Store offline for later sync
        localStorage.setItem(
          `survey_draft_${survey._id}`,
          JSON.stringify(payload)
        );
      }
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  }, [
    survey.settings.auto_save,
    survey._id,
    responses,
    sessionId,
    invitationToken,
    isOnline,
  ]);

  // Auto-save every 30 seconds
  useEffect(() => {
    const interval = setInterval(autoSave, 30000);
    return () => clearInterval(interval);
  }, [autoSave]);

  // Load saved draft on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem(`survey_draft_${survey._id}`);
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        setResponses(draft.responses || []);
      } catch (error) {
        console.error('Failed to load saved draft:', error);
      }
    }
  }, [survey._id]);

  // Sync offline data when coming back online
  useEffect(() => {
    if (isOnline) {
      syncPendingData();
    }
  }, [isOnline, syncPendingData]);

  const handleQuestionResponse = (
    questionId: string,
    value: any,
    text?: string
  ) => {
    const timeSpent = Math.floor(
      (new Date().getTime() - questionStartTime.getTime()) / 1000
    );

    setResponses((prev) => {
      const existing = prev.find((r) => r.question_id === questionId);
      const newResponse: IQuestionResponse = {
        question_id: questionId,
        response_value: value,
        response_text: text,
        time_spent_seconds: timeSpent,
      };

      if (existing) {
        return prev.map((r) =>
          r.question_id === questionId ? newResponse : r
        );
      } else {
        return [...prev, newResponse];
      }
    });
  };

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep((prev) => prev + 1);
      setQuestionStartTime(new Date());
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
      setQuestionStartTime(new Date());
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      const payload = {
        responses,
        is_complete: true,
        session_id: sessionId,
        invitation_token: invitationToken,
      };

      const response = await fetch(`/api/surveys/${survey._id}/responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit survey');
      }

      // Clear saved draft
      localStorage.removeItem(`survey_draft_${survey._id}`);

      setIsCompleted(true);
    } catch (error) {
      console.error('Survey submission failed:', error);
      alert('Failed to submit survey. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isCompleted) {
    return <SurveyCompletion survey={survey} />;
  }

  const currentResponse = currentQuestion
    ? responses.find((r) => r.question_id === currentQuestion.id)
    : null;

  const canProceed = () => {
    if (currentQuestion) {
      // Check if current question is answered (if required)
      return (
        !currentQuestion.required ||
        (currentResponse &&
          currentResponse.response_value !== undefined &&
          currentResponse.response_value !== '')
      );
    }
    return true;
  };

  return (
    <div className="max-w-4xl mx-auto p-6 flex flex-col justify-between  min-h-[90vh]">
      {/* Survey Header */}
      <div className="mb-8 justify-self-start">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {survey.title}
        </h1>
        {survey.description && (
          <p className="text-gray-600 mb-4">{survey.description}</p>
        )}

        {/* Progress Bar */}
        <ProgressBar
          progress={progress}
          currentStep={currentStep + 1}
          totalSteps={totalSteps}
          showStepNumbers={survey.settings.show_progress}
        />

        {/* Offline Indicator */}
        {!isOnline && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center">
              <svg
                className="w-5 h-5 text-yellow-600 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
              <span className="text-yellow-800 text-sm">
                You're offline. Your responses will be saved and submitted when
                you reconnect.
              </span>
            </div>
          </div>
        )}
      </div>
      <div>
        {/* Survey Content */}
        <Card className="p-8 ">
          <AnimatePresence mode="wait">
            {currentQuestion ? (
              <motion.div
                key={currentQuestion.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <QuestionRenderer
                  question={currentQuestion}
                  response={currentResponse || undefined}
                  onResponse={handleQuestionResponse}
                  questionNumber={currentStep + 1}
                />
              </motion.div>
            ) : (
              <motion.div
                key="completion"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <div className="text-center py-8">
                  <h3 className="text-xl font-semibold mb-4">
                    Ready to submit your survey?
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Please review your answers before submitting.
                  </p>
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Survey'}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <SurveyNavigation
              currentStep={currentStep}
              totalSteps={totalSteps}
              canProceed={canProceed() || false}
              isSubmitting={isSubmitting}
              onPrevious={handlePrevious}
              onNext={handleNext}
              onSubmit={handleSubmit}
              isLastStep={currentStep === totalSteps - 1}
            />
          </div>
        </Card>

        {/* Survey Info */}
        <div className="mt-6 text-center text-sm text-gray-500">
          {survey.settings.anonymous ? (
            <p>
              This survey is anonymous. Your responses cannot be traced back to
              you.
            </p>
          ) : (
            <p>
              Your responses are confidential and will only be used for
              organizational improvement.
            </p>
          )}
          {survey.settings.time_limit_minutes && (
            <p className="mt-1">
              Estimated time: {survey.settings.time_limit_minutes} minutes
            </p>
          )}
        </div>
      </div>
      <div />
    </div>
  );
}
