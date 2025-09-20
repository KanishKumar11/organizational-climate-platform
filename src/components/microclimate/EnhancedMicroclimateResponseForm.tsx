'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/Progress';
import { useWebSocket } from '@/hooks/useWebSocket';
import {
  Send,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Heart,
  Zap,
  Target,
} from 'lucide-react';

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

interface EnhancedMicroclimateResponseFormProps {
  microclimateId: string;
  questions: Question[];
  className?: string;
  invitationToken?: string;
  redirectToLiveResults?: boolean;
}

const LIKERT_OPTIONS = [
  {
    value: 1,
    label: 'Strongly Disagree',
    color: 'bg-red-100 text-red-700 border-red-200',
  },
  {
    value: 2,
    label: 'Disagree',
    color: 'bg-orange-100 text-orange-700 border-orange-200',
  },
  {
    value: 3,
    label: 'Neutral',
    color: 'bg-gray-100 text-gray-700 border-gray-200',
  },
  {
    value: 4,
    label: 'Agree',
    color: 'bg-blue-100 text-blue-700 border-blue-200',
  },
  {
    value: 5,
    label: 'Strongly Agree',
    color: 'bg-green-100 text-green-700 border-green-200',
  },
];

const EMOJI_OPTIONS = [
  { value: 1, emoji: '😞', label: 'Very Unhappy', color: 'hover:bg-red-50' },
  { value: 2, emoji: '😕', label: 'Unhappy', color: 'hover:bg-orange-50' },
  { value: 3, emoji: '😐', label: 'Neutral', color: 'hover:bg-gray-50' },
  { value: 4, emoji: '😊', label: 'Happy', color: 'hover:bg-blue-50' },
  { value: 5, emoji: '😄', label: 'Very Happy', color: 'hover:bg-green-50' },
];

export default function EnhancedMicroclimateResponseForm({
  microclimateId,
  questions,
  className = '',
  invitationToken,
  redirectToLiveResults = false,
}: EnhancedMicroclimateResponseFormProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, Response>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [direction, setDirection] = useState(0);

  const { emitNewResponse } = useWebSocket({ microclimateId });

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const isFirstQuestion = currentQuestionIndex === 0;

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
    if (currentQuestionIndex < questions.length - 1) {
      setDirection(1);
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setError(null);
    }
  };

  const goToPrevious = () => {
    if (currentQuestionIndex > 0) {
      setDirection(-1);
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setError(null);
    }
  };

  const canProceed = () => {
    const response = responses[currentQuestion.id];
    if (!currentQuestion.required) return true;
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

  const renderQuestion = (question: Question) => {
    const response = responses[question.id];

    const questionVariants = {
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

    return (
      <motion.div
        key={question.id}
        custom={direction}
        variants={questionVariants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{
          x: { type: 'spring', stiffness: 300, damping: 30 },
          opacity: { duration: 0.2 },
        }}
        className="w-full"
      >
        <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
          <CardContent className="p-8">
            {/* Question Header */}
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4"
              >
                <span className="text-white font-bold text-lg">
                  {currentQuestionIndex + 1}
                </span>
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
                  {LIKERT_OPTIONS.map((option, index) => (
                    <motion.button
                      key={option.value}
                      type="button"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                      onClick={() =>
                        handleResponseChange(question.id, option.value)
                      }
                      className={`w-full p-4 rounded-xl border-2 transition-all duration-200 text-left font-medium ${
                        response?.answer === option.value
                          ? `${option.color} border-current scale-105 shadow-md`
                          : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{option.label}</span>
                        {response?.answer === option.value && (
                          <CheckCircle className="w-5 h-5" />
                        )}
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}

              {question.type === 'emoji_rating' && (
                <div className="flex justify-center space-x-6">
                  {EMOJI_OPTIONS.map((option, index) => (
                    <motion.button
                      key={option.value}
                      type="button"
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                      onClick={() =>
                        handleResponseChange(question.id, option.value)
                      }
                      className={`p-6 rounded-2xl text-6xl transition-all duration-300 ${
                        response?.answer === option.value
                          ? 'bg-gradient-to-br from-yellow-100 to-orange-100 scale-125 shadow-xl'
                          : `${option.color} hover:scale-110 shadow-md`
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
                  {question.options.map((option, index) => (
                    <motion.button
                      key={index}
                      type="button"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                      onClick={() => handleResponseChange(question.id, index)}
                      className={`w-full p-4 rounded-xl border-2 transition-all duration-200 text-left font-medium ${
                        response?.answer === index
                          ? 'bg-blue-50 text-blue-700 border-blue-200 scale-105 shadow-md'
                          : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{option}</span>
                        {response?.answer === index && (
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
                      handleResponseChange(
                        question.id,
                        undefined,
                        e.target.value
                      )
                    }
                    className="min-h-32 text-lg border-2 border-gray-200 focus:border-blue-400 rounded-xl resize-none"
                  />
                </motion.div>
              )}
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`text-center py-16 ${className}`}
      >
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
            Your response has been submitted successfully and will help improve
            our workplace.
          </motion.p>

          {redirectToLiveResults && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-sm text-gray-500 flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4" />
              Redirecting to live results in a moment...
            </motion.p>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <div className={`max-w-2xl mx-auto ${className}`}>
      {/* Progress Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Target className="w-4 h-4" />
            Question {currentQuestionIndex + 1} of {questions.length}
          </div>
          <div className="text-sm font-medium text-gray-700">
            {Math.round(progress)}% Complete
          </div>
        </div>

        <Progress value={progress} className="h-2 bg-gray-100" />
      </motion.div>

      {/* Question Container */}
      <div className="relative min-h-[400px] mb-8">
        <AnimatePresence mode="wait" custom={direction}>
          {renderQuestion(currentQuestion)}
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
          disabled={isFirstQuestion}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Previous
        </Button>

        {isLastQuestion ? (
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
                <Send className="w-4 h-4" />
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
  );
}
