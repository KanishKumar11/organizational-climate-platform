'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/Progress';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Send,
  Clock,
  AlertCircle,
} from 'lucide-react';

/**
 * Survey Response Flow Component
 * Handles the user-facing survey response experience
 */

interface Question {
  id: string;
  text: string;
  type: string;
  options?: string[];
  scale_min?: number;
  scale_max?: number;
  scale_labels?: { min: string; max: string };
  emoji_options?: Array<{ emoji: string; label: string; value: number }>;
  required: boolean;
  comment_required?: boolean;
  comment_prompt?: string;
  binary_comment_config?: any;
}

interface SurveyData {
  id: string;
  title: string;
  description?: string;
  response_count: number;
  target_audience_count: number;
  time_remaining?: number;
  questions: Question[];
  settings: {
    anonymous: boolean;
    show_progress: boolean;
    allow_partial_responses: boolean;
  };
  demographics?: any[];
}

interface SurveyResponseFlowProps {
  surveyId: string;
  surveyData: SurveyData;
  invitationToken?: string;
}

export default function SurveyResponseFlow({
  surveyId,
  surveyData,
  invitationToken,
}: SurveyResponseFlowProps) {
  const router = useRouter();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  const currentQuestion = surveyData.questions[currentQuestionIndex];
  const progress =
    ((currentQuestionIndex + 1) / surveyData.questions.length) * 100;

  const handleResponse = (questionId: string, value: any) => {
    setResponses((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleNext = () => {
    if (currentQuestion.required && !responses[currentQuestion.id]) {
      toast.error('Please answer this question before continuing');
      return;
    }

    if (currentQuestionIndex < surveyData.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    // Validate all required questions are answered
    const unansweredRequired = surveyData.questions.filter(
      (q) => q.required && !responses[q.id]
    );

    if (unansweredRequired.length > 0) {
      toast.error('Please answer all required questions');
      return;
    }

    setIsSubmitting(true);

    try {
      const responseData = {
        survey_id: surveyId,
        responses: surveyData.questions.map((q) => ({
          question_id: q.id,
          response_value: responses[q.id],
        })),
        is_complete: true,
        invitation_token: invitationToken,
      };

      const response = await fetch(`/api/surveys/${surveyId}/responses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(responseData),
      });

      if (!response.ok) {
        throw new Error('Failed to submit survey');
      }

      toast.success('Survey submitted successfully!');
      router.push(`/surveys/${surveyId}/results`);
    } catch (error) {
      console.error('Error submitting survey:', error);
      toast.error('Failed to submit survey. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderQuestion = (question: Question) => {
    const value = responses[question.id];

    switch (question.type) {
      case 'likert':
      case 'rating':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center gap-2">
              {Array.from(
                {
                  length:
                    (question.scale_max || 5) - (question.scale_min || 1) + 1,
                },
                (_, i) => {
                  const scaleValue = (question.scale_min || 1) + i;
                  return (
                    <button
                      key={scaleValue}
                      onClick={() => handleResponse(question.id, scaleValue)}
                      className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all ${
                        value === scaleValue
                          ? 'border-blue-600 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-semibold">{scaleValue}</div>
                    </button>
                  );
                }
              )}
            </div>
            {question.scale_labels && (
              <div className="flex justify-between text-sm text-gray-600">
                <span>{question.scale_labels.min}</span>
                <span>{question.scale_labels.max}</span>
              </div>
            )}
          </div>
        );

      case 'multiple_choice':
        return (
          <RadioGroup
            value={value?.toString()}
            onValueChange={(val) => handleResponse(question.id, val)}
          >
            <div className="space-y-3">
              {question.options?.map((option, idx) => (
                <div
                  key={idx}
                  className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-gray-50"
                >
                  <RadioGroupItem value={option} id={`${question.id}-${idx}`} />
                  <Label
                    htmlFor={`${question.id}-${idx}`}
                    className="flex-1 cursor-pointer"
                  >
                    {option}
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        );

      case 'yes_no':
        return (
          <RadioGroup
            value={value?.toString()}
            onValueChange={(val) => handleResponse(question.id, val === 'true')}
          >
            <div className="space-y-3">
              <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-gray-50">
                <RadioGroupItem value="true" id={`${question.id}-yes`} />
                <Label
                  htmlFor={`${question.id}-yes`}
                  className="flex-1 cursor-pointer"
                >
                  Yes
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-gray-50">
                <RadioGroupItem value="false" id={`${question.id}-no`} />
                <Label
                  htmlFor={`${question.id}-no`}
                  className="flex-1 cursor-pointer"
                >
                  No
                </Label>
              </div>
            </div>
          </RadioGroup>
        );

      case 'emoji_scale':
        return (
          <div className="flex justify-center gap-4">
            {question.emoji_options?.map((option) => (
              <button
                key={option.value}
                onClick={() => handleResponse(question.id, option.value)}
                className={`flex flex-col items-center p-4 rounded-lg border-2 transition-all ${
                  value === option.value
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className="text-4xl mb-2">{option.emoji}</span>
                <span className="text-sm text-gray-600">{option.label}</span>
              </button>
            ))}
          </div>
        );

      case 'open_ended':
        return (
          <Textarea
            value={value || ''}
            onChange={(e) => handleResponse(question.id, e.target.value)}
            placeholder="Type your answer here..."
            className="min-h-[120px]"
          />
        );

      case 'ranking':
        return (
          <div className="space-y-2">
            {question.options?.map((option, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 p-3 rounded-lg border"
              >
                <Checkbox
                  checked={value?.includes(option)}
                  onCheckedChange={(checked) => {
                    const current = value || [];
                    if (checked) {
                      handleResponse(question.id, [...current, option]);
                    } else {
                      handleResponse(
                        question.id,
                        current.filter((v: string) => v !== option)
                      );
                    }
                  }}
                />
                <Label className="flex-1">{option}</Label>
              </div>
            ))}
          </div>
        );

      default:
        return (
          <div className="text-gray-500">
            Question type "{question.type}" not supported
          </div>
        );
    }
  };

  if (!hasStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12">
        <div className="container mx-auto px-4 max-w-3xl">
          <Card className="shadow-lg">
            <CardHeader>
              <div className="text-center space-y-4">
                <h1 className="text-3xl font-bold text-gray-900">
                  {surveyData.title}
                </h1>
                {surveyData.description && (
                  <p className="text-gray-600">{surveyData.description}</p>
                )}
                <div className="flex justify-center gap-4 text-sm">
                  <Badge variant="outline">
                    {surveyData.questions.length} Questions
                  </Badge>
                  {surveyData.time_remaining !== undefined && (
                    <Badge variant="outline">
                      <Clock className="w-3 h-3 mr-1" />
                      {surveyData.time_remaining} days remaining
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h3 className="font-semibold text-blue-900 mb-2">
                    Before you begin:
                  </h3>
                  <ul className="space-y-2 text-sm text-blue-800">
                    <li>• This survey will take approximately 5-10 minutes</li>
                    <li>
                      • Your responses are{' '}
                      {surveyData.settings.anonymous
                        ? 'anonymous'
                        : 'confidential'}
                    </li>
                    <li>• You can navigate back and forth between questions</li>
                    {surveyData.settings.allow_partial_responses && (
                      <li>• You can save your progress and return later</li>
                    )}
                  </ul>
                </div>

                <Button
                  onClick={() => setHasStarted(true)}
                  className="w-full"
                  size="lg"
                >
                  Start Survey
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8">
      <div className="container mx-auto px-4 max-w-3xl">
        {surveyData.settings.show_progress && (
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>
                Question {currentQuestionIndex + 1} of{' '}
                {surveyData.questions.length}
              </span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestionIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl">
                  {currentQuestion.text}
                  {currentQuestion.required && (
                    <span className="text-red-500 ml-1">*</span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {renderQuestion(currentQuestion)}

                <div className="flex justify-between pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={handlePrevious}
                    disabled={currentQuestionIndex === 0}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Previous
                  </Button>

                  {currentQuestionIndex < surveyData.questions.length - 1 ? (
                    <Button onClick={handleNext}>
                      Next
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  ) : (
                    <Button
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {isSubmitting ? (
                        <>Submitting...</>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Submit Survey
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
