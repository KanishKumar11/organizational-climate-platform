'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useWebSocket } from '@/hooks/useWebSocket';
import { Send, CheckCircle } from 'lucide-react';

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

interface MicroclimateResponseFormProps {
  microclimateId: string;
  questions: Question[];
  onSubmit?: () => void;
  className?: string;
}

const LIKERT_OPTIONS = [
  { value: 1, label: 'Strongly Disagree' },
  { value: 2, label: 'Disagree' },
  { value: 3, label: 'Neutral' },
  { value: 4, label: 'Agree' },
  { value: 5, label: 'Strongly Agree' },
];

const EMOJI_OPTIONS = [
  { value: 1, emoji: '😞', label: 'Very Unhappy' },
  { value: 2, emoji: '😕', label: 'Unhappy' },
  { value: 3, emoji: '😐', label: 'Neutral' },
  { value: 4, emoji: '😊', label: 'Happy' },
  { value: 5, emoji: '😄', label: 'Very Happy' },
];

export default function MicroclimateResponseForm({
  microclimateId,
  questions,
  onSubmit,
  className = '',
}: MicroclimateResponseFormProps) {
  const [responses, setResponses] = useState<Record<string, Response>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { emitNewResponse } = useWebSocket({ microclimateId });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required questions
    const missingRequired = questions
      .filter((q) => q.required)
      .find(
        (q) =>
          !responses[q.id] ||
          (responses[q.id].answer === undefined && !responses[q.id].answer_text)
      );

    if (missingRequired) {
      setError('Please answer all required questions');
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
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit response');
      }

      const result = await response.json();

      // Emit WebSocket event for real-time updates
      emitNewResponse(microclimateId, {
        responses: formattedResponses,
        participationData: {
          response_count: result.data.response_count,
          participation_rate: result.data.participation_rate,
        },
      });

      setSubmitted(true);
      onSubmit?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const renderQuestion = (question: Question, index: number) => {
    const response = responses[question.id];

    return (
      <motion.div
        key={question.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
      >
        <Card className="mb-6 border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-start gap-3">
              <div className="p-2 bg-gray-100 rounded-lg mt-1">
                <span className="text-sm font-medium">Q{index + 1}</span>
              </div>
              <div className="flex-1">
                {question.text}
                {question.required && (
                  <span className="text-red-500 ml-1">*</span>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {question.type === 'likert' && (
              <div className="space-y-2">
                {LIKERT_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name={question.id}
                      value={option.value}
                      checked={response?.answer === option.value}
                      onChange={(e) =>
                        handleResponseChange(
                          question.id,
                          parseInt(e.target.value)
                        )
                      }
                      className="text-green-600 focus:ring-green-500"
                    />
                    <span className="flex-1">{option.label}</span>
                  </label>
                ))}
              </div>
            )}

            {question.type === 'multiple_choice' && question.options && (
              <div className="space-y-2">
                {question.options.map((option, optionIndex) => (
                  <label
                    key={optionIndex}
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name={question.id}
                      value={optionIndex}
                      checked={response?.answer === optionIndex}
                      onChange={(e) =>
                        handleResponseChange(
                          question.id,
                          parseInt(e.target.value)
                        )
                      }
                      className="text-green-600 focus:ring-green-500"
                    />
                    <span className="flex-1">{option}</span>
                  </label>
                ))}
              </div>
            )}

            {question.type === 'emoji_rating' && (
              <div className="flex justify-center space-x-4">
                {EMOJI_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() =>
                      handleResponseChange(question.id, option.value)
                    }
                    className={`p-4 rounded-lg text-4xl transition-all ${
                      response?.answer === option.value
                        ? 'bg-green-100 scale-110 shadow-lg'
                        : 'hover:bg-gray-100 hover:scale-105'
                    }`}
                    title={option.label}
                  >
                    {option.emoji}
                  </button>
                ))}
              </div>
            )}

            {question.type === 'open_ended' && (
              <Textarea
                placeholder="Share your thoughts..."
                value={response?.answer_text || ''}
                onChange={(e) =>
                  handleResponseChange(question.id, undefined, e.target.value)
                }
                className="min-h-24"
              />
            )}
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`text-center py-12 ${className}`}
      >
        <div className="bg-green-50 rounded-2xl p-8 border border-green-200">
          <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-600" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h2>
          <p className="text-gray-600 mb-4">
            Your response has been submitted successfully.
          </p>
          <p className="text-sm text-gray-500">
            You can now view the live results as they update in real-time.
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <div className={className}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {questions.map((question, index) => renderQuestion(question, index))}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 rounded-lg p-4"
          >
            <p className="text-red-800 text-sm">{error}</p>
          </motion.div>
        )}

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={submitting}
            className="bg-green-600 hover:bg-green-700 px-8"
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Submit Response
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
