'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/Progress';
import { useWebSocket } from '@/hooks/useWebSocket';
import {
  ArrowLeft,
  ArrowRight,
  Play,
  BookOpen,
  MessageSquare,
  Target,
  CheckCircle,
  Sparkles,
} from 'lucide-react';

// Import existing components
import EnhancedResponseHeader from './EnhancedResponseHeader';
import EnhancedInstructions from './EnhancedInstructions';

interface Question {
  id: string;
  text: string;
  type: 'likert' | 'multiple_choice' | 'open_ended' | 'emoji_rating';
  options?: string[];
  required: boolean;
}

interface Response {
  answer?: unknown;
  answer_text?: string;
}

interface MicroclimateData {
  title: string;
  description?: string;
  response_count: number;
  target_participant_count: number;
  time_remaining?: number;
  questions: Question[];
  real_time_settings?: {
    anonymous_responses?: boolean;
    show_live_results?: boolean;
  };
}

interface UnifiedResponseFlowProps {
  microclimateId: string;
  microclimateData: MicroclimateData;
  invitationToken?: string;
  redirectToLiveResults?: boolean;
}

// Context-aware response scales
const RESPONSE_SCALES = {
  satisfaction: [
    {
      value: 1,
      label: 'Very Dissatisfied',
      color: 'bg-red-50 text-red-700 border-red-200',
    },
    {
      value: 2,
      label: 'Dissatisfied',
      color: 'bg-orange-50 text-orange-700 border-orange-200',
    },
    {
      value: 3,
      label: 'Neutral',
      color: 'bg-gray-50 text-gray-700 border-gray-200',
    },
    {
      value: 4,
      label: 'Satisfied',
      color: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    {
      value: 5,
      label: 'Very Satisfied',
      color: 'bg-green-50 text-green-700 border-green-200',
    },
  ],
  stress: [
    {
      value: 1,
      label: 'Very Low',
      color: 'bg-green-50 text-green-700 border-green-200',
    },
    {
      value: 2,
      label: 'Low',
      color: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    {
      value: 3,
      label: 'Moderate',
      color: 'bg-gray-50 text-gray-700 border-gray-200',
    },
    {
      value: 4,
      label: 'High',
      color: 'bg-orange-50 text-orange-700 border-orange-200',
    },
    {
      value: 5,
      label: 'Very High',
      color: 'bg-red-50 text-red-700 border-red-200',
    },
  ],
  agreement: [
    {
      value: 1,
      label: 'Strongly Disagree',
      color: 'bg-red-50 text-red-700 border-red-200',
    },
    {
      value: 2,
      label: 'Disagree',
      color: 'bg-orange-50 text-orange-700 border-orange-200',
    },
    {
      value: 3,
      label: 'Neutral',
      color: 'bg-gray-50 text-gray-700 border-gray-200',
    },
    {
      value: 4,
      label: 'Agree',
      color: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    {
      value: 5,
      label: 'Strongly Agree',
      color: 'bg-green-50 text-green-700 border-green-200',
    },
  ],
  quality: [
    {
      value: 1,
      label: 'Very Poor',
      color: 'bg-red-50 text-red-700 border-red-200',
    },
    {
      value: 2,
      label: 'Poor',
      color: 'bg-orange-50 text-orange-700 border-orange-200',
    },
    {
      value: 3,
      label: 'Average',
      color: 'bg-gray-50 text-gray-700 border-gray-200',
    },
    {
      value: 4,
      label: 'Good',
      color: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    {
      value: 5,
      label: 'Excellent',
      color: 'bg-green-50 text-green-700 border-green-200',
    },
  ],
  likelihood: [
    {
      value: 1,
      label: 'Very Unlikely',
      color: 'bg-red-50 text-red-700 border-red-200',
    },
    {
      value: 2,
      label: 'Unlikely',
      color: 'bg-orange-50 text-orange-700 border-orange-200',
    },
    {
      value: 3,
      label: 'Neutral',
      color: 'bg-gray-50 text-gray-700 border-gray-200',
    },
    {
      value: 4,
      label: 'Likely',
      color: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    {
      value: 5,
      label: 'Very Likely',
      color: 'bg-green-50 text-green-700 border-green-200',
    },
  ],
  support: [
    {
      value: 1,
      label: 'Not Supported',
      color: 'bg-red-50 text-red-700 border-red-200',
    },
    {
      value: 2,
      label: 'Poorly Supported',
      color: 'bg-orange-50 text-orange-700 border-orange-200',
    },
    {
      value: 3,
      label: 'Adequately Supported',
      color: 'bg-gray-50 text-gray-700 border-gray-200',
    },
    {
      value: 4,
      label: 'Well Supported',
      color: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    {
      value: 5,
      label: 'Excellently Supported',
      color: 'bg-green-50 text-green-700 border-green-200',
    },
  ],
  engagement: [
    {
      value: 1,
      label: 'Not Engaged',
      color: 'bg-red-50 text-red-700 border-red-200',
    },
    {
      value: 2,
      label: 'Slightly Engaged',
      color: 'bg-orange-50 text-orange-700 border-orange-200',
    },
    {
      value: 3,
      label: 'Moderately Engaged',
      color: 'bg-gray-50 text-gray-700 border-gray-200',
    },
    {
      value: 4,
      label: 'Highly Engaged',
      color: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    {
      value: 5,
      label: 'Extremely Engaged',
      color: 'bg-green-50 text-green-700 border-green-200',
    },
  ],
};

const EMOJI_OPTIONS = [
  { value: 1, emoji: '😞', label: 'Very Unhappy', color: 'hover:bg-red-50' },
  { value: 2, emoji: '😕', label: 'Unhappy', color: 'hover:bg-orange-50' },
  { value: 3, emoji: '😐', label: 'Neutral', color: 'hover:bg-gray-50' },
  { value: 4, emoji: '😊', label: 'Happy', color: 'hover:bg-blue-50' },
  { value: 5, emoji: '😄', label: 'Very Happy', color: 'hover:bg-green-50' },
];

export default function UnifiedResponseFlow({
  microclimateId,
  microclimateData,
  invitationToken,
  redirectToLiveResults = false,
}: UnifiedResponseFlowProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState<Record<string, Response>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [direction, setDirection] = useState(0);

  const { emitNewResponse } = useWebSocket({ microclimateId });

  // Intelligent scale detection based on question text
  const detectQuestionScale = (
    questionText: string
  ): keyof typeof RESPONSE_SCALES => {
    const text = questionText.toLowerCase();

    if (text.includes('satisfied') || text.includes('satisfaction'))
      return 'satisfaction';
    if (text.includes('stress') || text.includes('stressed')) return 'stress';
    if (text.includes('support') || text.includes('supported'))
      return 'support';
    if (text.includes('engaged') || text.includes('engagement'))
      return 'engagement';
    if (text.includes('likely') || text.includes('recommend'))
      return 'likelihood';
    if (
      text.includes('quality') ||
      text.includes('rate') ||
      text.includes('how would you rate')
    )
      return 'quality';

    // Default to agreement for general statements
    return 'agreement';
  };

  // Calculate total steps: Overview + Instructions + Questions
  const totalSteps = 2 + microclimateData.questions.length;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  // Step definitions
  const getStepInfo = (step: number) => {
    if (step === 0) {
      return {
        title: 'Overview',
        icon: Target,
        description: 'Learn about this microclimate survey',
      };
    } else if (step === 1) {
      return {
        title: 'Instructions',
        icon: BookOpen,
        description: 'How to complete the survey',
      };
    } else {
      const questionIndex = step - 2;
      return {
        title: `Question ${questionIndex + 1}`,
        icon: MessageSquare,
        description: microclimateData.questions[questionIndex]?.text || '',
      };
    }
  };

  const currentStepInfo = getStepInfo(currentStep);
  const isLastStep = currentStep === totalSteps - 1;
  const isFirstStep = currentStep === 0;

  const handleResponseChange = (
    questionId: string,
    value: unknown,
    textValue?: string
  ) => {
    setResponses((prev) => ({
      ...prev,
      [questionId]: {
        answer: value,
        answer_text: textValue,
      },
    }));
  };

  const goToNext = () => {
    if (currentStep < totalSteps - 1) {
      setDirection(1);
      setCurrentStep(currentStep + 1);
      setError(null);
    }
  };

  const goToPrevious = () => {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep(currentStep - 1);
      setError(null);
    }
  };

  const canProceed = () => {
    // Overview and Instructions steps can always proceed
    if (currentStep <= 1) return true;

    // For question steps, check if required questions are answered
    const questionIndex = currentStep - 2;
    const question = microclimateData.questions[questionIndex];
    if (!question) return true;

    const response = responses[question.id];
    if (!question.required) return true;
    return response && (response.answer !== undefined || response.answer_text);
  };

  const handleNext = () => {
    if (!canProceed()) {
      setError('Please answer this question to continue');
      return;
    }
    goToNext();
  };

  const handleSubmit = async () => {
    if (!canProceed()) {
      setError('Please answer this question to continue');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const formattedResponses = Object.entries(responses).map(
        ([questionId, response]) => ({
          question_id: questionId,
          answer: response.answer,
          answer_text: response.answer_text,
        })
      );

      const response = await fetch(
        `/api/microclimates/${microclimateId}/responses`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            responses: formattedResponses,
            user_metadata: {
              timestamp: new Date().toISOString(),
            },
            invitation_token: invitationToken,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit response');
      }

      const result = await response.json();

      emitNewResponse(microclimateId, {
        responses: formattedResponses,
        participationData: {
          response_count: result.data.response_count,
          participation_rate: result.data.participation_rate,
        },
      });

      setSubmitted(true);

      if (redirectToLiveResults) {
        setTimeout(() => {
          window.location.href = `/microclimates/${microclimateId}/live`;
        }, 3000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const renderQuestion = (question: Question, index: number) => {
    const response = responses[question.id];

    return (
      <Card className="border border-gray-200 bg-white">
        <CardContent className="p-6">
          {/* Question Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4"
            >
              <span className="text-white font-bold text-lg">{index + 1}</span>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-2xl font-bold text-gray-900 mb-2 leading-tight"
            >
              {question.text}
              {question.required && (
                <span className="text-red-500 ml-1">*</span>
              )}
            </motion.h2>
          </div>

          {/* Question Content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            {question.type === 'likert' && (
              <div className="space-y-3">
                {RESPONSE_SCALES[detectQuestionScale(question.text)].map(
                  (option, optionIndex) => (
                    <motion.button
                      key={option.value}
                      type="button"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + optionIndex * 0.1 }}
                      onClick={() =>
                        handleResponseChange(question.id, option.value)
                      }
                      className={`w-full p-3 rounded-lg border transition-all duration-200 text-left text-sm ${
                        response?.answer === option.value
                          ? `${option.color} border-current`
                          : 'bg-white border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{option.label}</span>
                        {response?.answer === option.value && (
                          <CheckCircle className="w-5 h-5" />
                        )}
                      </div>
                    </motion.button>
                  )
                )}
              </div>
            )}

            {question.type === 'emoji_rating' && (
              <div className="flex justify-center space-x-4">
                {EMOJI_OPTIONS.map((option, optionIndex) => (
                  <motion.button
                    key={option.value}
                    type="button"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 + optionIndex * 0.1 }}
                    onClick={() =>
                      handleResponseChange(question.id, option.value)
                    }
                    className={`p-4 rounded-xl text-4xl transition-all duration-300 ${
                      response?.answer === option.value
                        ? 'bg-gradient-to-br from-yellow-100 to-orange-100 scale-110'
                        : `${option.color} hover:scale-105`
                    }`}
                    title={option.label}
                  >
                    {option.emoji}
                  </motion.button>
                ))}
              </div>
            )}

            {question.type === 'multiple_choice' && question.options && (
              <div className="space-y-3">
                {question.options.map((option, optionIndex) => (
                  <motion.button
                    key={optionIndex}
                    type="button"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + optionIndex * 0.1 }}
                    onClick={() =>
                      handleResponseChange(question.id, optionIndex)
                    }
                    className={`w-full p-3 rounded-lg border transition-all duration-200 text-left text-sm ${
                      response?.answer === optionIndex
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : 'bg-white border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{option}</span>
                      {response?.answer === optionIndex && (
                        <CheckCircle className="w-5 h-5" />
                      )}
                    </div>
                  </motion.button>
                ))}
              </div>
            )}

            {question.type === 'open_ended' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Textarea
                  placeholder="Share your thoughts... ✨"
                  value={response?.answer_text || ''}
                  onChange={(e) =>
                    handleResponseChange(question.id, undefined, e.target.value)
                  }
                  className="min-h-32 text-lg border-2 border-gray-200 focus:border-blue-400 rounded-xl resize-none"
                />
              </motion.div>
            )}
          </motion.div>
        </CardContent>
      </Card>
    );
  };

  const stepVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 300 : -300,
      opacity: 0,
    }),
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center"
      >
        <div className="text-center py-16 max-w-2xl mx-auto px-4">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl p-12 border border-green-200 shadow-xl">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            >
              <div className="relative inline-block mb-6">
                <CheckCircle className="w-20 h-20 text-green-600" />
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5 }}
                  className="absolute -top-2 -right-2"
                >
                  <Sparkles className="w-8 h-8 text-yellow-500" />
                </motion.div>
              </div>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-3xl font-bold text-gray-900 mb-4"
            >
              Thank You! 🎉
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-gray-600 mb-6 text-lg"
            >
              Your response has been submitted successfully and will help
              improve our workplace.
            </motion.p>

            {redirectToLiveResults && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-sm text-gray-500 flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4" />
                Redirecting to live results in a moment...
              </motion.p>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Progress Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                  <currentStepInfo.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {currentStepInfo.title}
                  </h2>
                  <p className="text-sm text-gray-600">
                    Step {currentStep + 1} of {totalSteps}
                  </p>
                </div>
              </div>
              <div className="text-sm font-medium text-gray-700">
                {Math.round(progress)}% Complete
              </div>
            </div>

            <Progress value={progress} className="h-2 bg-gray-100" />
          </motion.div>

          {/* Step Content Container */}
          <div className="relative min-h-[500px] mb-8">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={currentStep}
                custom={direction}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: 'spring', stiffness: 300, damping: 30 },
                  opacity: { duration: 0.2 },
                }}
                className="w-full"
              >
                {/* Step 0: Overview */}
                {currentStep === 0 && (
                  <EnhancedResponseHeader microclimateData={microclimateData} />
                )}

                {/* Step 1: Instructions */}
                {currentStep === 1 && (
                  <EnhancedInstructions microclimateData={microclimateData} />
                )}

                {/* Step 2+: Questions */}
                {currentStep >= 2 && (
                  <div>
                    {renderQuestion(
                      microclimateData.questions[currentStep - 2],
                      currentStep - 2
                    )}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6"
              >
                <p className="text-red-800 text-sm font-medium">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex items-center justify-between"
          >
            <Button
              type="button"
              variant="outline"
              onClick={goToPrevious}
              disabled={isFirstStep}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Previous
            </Button>

            {isLastStep ? (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 px-8 flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Submit Response
                  </>
                )}
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleNext}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-8 flex items-center gap-2"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </Button>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
