'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loading } from '@/components/ui/Loading';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/Progress';
import {
  ChevronLeft,
  ChevronRight,
  Lightbulb,
  Target,
  Brain,
  CheckCircle,
  AlertCircle,
  Info,
} from 'lucide-react';

interface AdaptiveQuestion {
  id: string;
  text: string;
  type:
    | 'likert'
    | 'multiple_choice'
    | 'ranking'
    | 'open_ended'
    | 'yes_no'
    | 'yes_no_comment'
    | 'emoji_scale'
    | 'rating';
  category: string;
  subcategory?: string;
  options?: string[];
  scale_min?: number;
  scale_max?: number;
  scale_labels?: { min: string; max: string };
  comment_required?: boolean;
  comment_prompt?: string;
  emoji_options?: Array<{ emoji: string; label: string; value: number }>;
  required: boolean;
  adaptationType: 'original' | 'combined' | 'reformulated' | 'generated';
  adaptationReason?: string;
  confidence: number;
  contextExplanation?: string;
}

interface QuestionResponse {
  questionId: string;
  response: any;
  responseText?: string;
  timestamp: Date;
  category: string;
}

interface AdaptationTrigger {
  type:
    | 'response_pattern'
    | 'category_completion'
    | 'sentiment_shift'
    | 'engagement_drop';
  description: string;
  confidence: number;
}

interface AdaptiveQuestionnaireInterfaceProps {
  surveyId: string;
  userId: string;
  userContext: {
    department?: string;
    role?: string;
    demographics?: Record<string, any>;
  };
  onComplete: (responses: QuestionResponse[]) => void;
  onSave?: (responses: QuestionResponse[]) => void;
}

export default function AdaptiveQuestionnaireInterface({
  surveyId,
  userId,
  userContext,
  onComplete,
  onSave,
}: AdaptiveQuestionnaireInterfaceProps) {
  const [questions, setQuestions] = useState<AdaptiveQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<QuestionResponse[]>([]);
  const [currentResponse, setCurrentResponse] = useState<any>(null);
  const [currentResponseText, setCurrentResponseText] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [adapting, setAdapting] = useState(false);
  const [adaptationTriggers, setAdaptationTriggers] = useState<
    AdaptationTrigger[]
  >([]);
  const [showAdaptationInfo, setShowAdaptationInfo] = useState(false);
  const [progress, setProgress] = useState(0);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState(0);

  // Initialize questionnaire with adaptive questions
  useEffect(() => {
    initializeQuestionnaire();
  }, [surveyId, userContext]);

  // Update progress and time estimation
  useEffect(() => {
    if (questions.length > 0) {
      const progressPercent = (currentQuestionIndex / questions.length) * 100;
      setProgress(progressPercent);

      // Estimate time remaining (assuming 30 seconds per question)
      const remainingQuestions = questions.length - currentQuestionIndex;
      setEstimatedTimeRemaining(remainingQuestions * 0.5); // 30 seconds = 0.5 minutes
    }
  }, [currentQuestionIndex, questions.length]);

  const initializeQuestionnaire = async () => {
    try {
      setLoading(true);

      // Get initial adaptive questions based on survey and user context
      const response = await fetch('/api/surveys/adaptive-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          surveyId,
          userContext,
          initialLoad: true,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setQuestions(data.questions);
      }
    } catch (error) {
      console.error('Error initializing questionnaire:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResponseChange = (value: any) => {
    setCurrentResponse(value);
  };

  const handleNext = async () => {
    if (currentResponse === null || currentResponse === undefined) return;

    const currentQuestion = questions[currentQuestionIndex];
    const newResponse: QuestionResponse = {
      questionId: currentQuestion.id,
      response: currentResponse,
      responseText: currentResponseText || (
        typeof currentResponse === 'string' ? currentResponse : undefined
      ),
      timestamp: new Date(),
      category: currentQuestion.category,
    };

    const updatedResponses = [...responses, newResponse];
    setResponses(updatedResponses);
    setCurrentResponse(null);
    setCurrentResponseText('');

    // Check if we need to adapt questions based on the response
    await checkForAdaptation(updatedResponses, currentQuestionIndex + 1);

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Questionnaire complete
      onComplete(updatedResponses);
    }

    // Auto-save progress
    if (onSave) {
      onSave(updatedResponses);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      // Restore previous response
      const previousResponse = responses[currentQuestionIndex - 1];
      if (previousResponse) {
        setCurrentResponse(previousResponse.response);
        setCurrentResponseText(previousResponse.responseText || '');
        // Remove the response from the array since we're going back
        setResponses(responses.slice(0, -1));
      }
    }
  };

  const checkForAdaptation = async (
    currentResponses: QuestionResponse[],
    nextIndex: number
  ) => {
    // Don't adapt if we're at the end
    if (nextIndex >= questions.length) return;

    try {
      setAdapting(true);

      const response = await fetch('/api/surveys/check-adaptation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          surveyId,
          userContext,
          responses: currentResponses,
          currentQuestionIndex: nextIndex,
          remainingQuestions: questions.slice(nextIndex),
        }),
      });

      if (response.ok) {
        const data = await response.json();

        if (data.shouldAdapt) {
          // Replace remaining questions with adapted ones
          const adaptedQuestions = [
            ...questions.slice(0, nextIndex),
            ...data.adaptedQuestions,
          ];
          setQuestions(adaptedQuestions);
          setAdaptationTriggers(data.triggers || []);
          setShowAdaptationInfo(true);

          // Auto-hide adaptation info after 3 seconds
          setTimeout(() => setShowAdaptationInfo(false), 3000);
        }
      }
    } catch (error) {
      console.error('Error checking for adaptation:', error);
    } finally {
      setAdapting(false);
    }
  };

  const renderQuestion = (question: AdaptiveQuestion) => {
    switch (question.type) {
      case 'likert':
        return (
          <div className="space-y-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>{question.scale_labels?.min}</span>
              <span>{question.scale_labels?.max}</span>
            </div>
            <div className="flex justify-center gap-4">
              {Array.from(
                {
                  length:
                    (question.scale_max || 5) - (question.scale_min || 1) + 1,
                },
                (_, i) => {
                  const value = (question.scale_min || 1) + i;
                  return (
                    <button
                      key={value}
                      onClick={() => handleResponseChange(value)}
                      className={`w-12 h-12 rounded-full border-2 flex items-center justify-center font-medium transition-colors ${
                        currentResponse === value
                          ? 'border-blue-500 bg-blue-500 text-white'
                          : 'border-gray-300 hover:border-blue-300'
                      }`}
                    >
                      {value}
                    </button>
                  );
                }
              )}
            </div>
          </div>
        );

      case 'multiple_choice':
        return (
          <div className="space-y-3">
            {question.options?.map((option, index) => (
              <button
                key={index}
                onClick={() => handleResponseChange(option)}
                className={`w-full p-4 text-left border rounded-lg transition-colors ${
                  currentResponse === option
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        );

      case 'yes_no':
        return (
          <div className="flex gap-4 justify-center">
            {['Yes', 'No'].map((option) => (
              <button
                key={option}
                onClick={() => handleResponseChange(option)}
                className={`px-8 py-4 rounded-lg border-2 font-medium transition-colors ${
                  currentResponse === option
                    ? 'border-blue-500 bg-blue-500 text-white'
                    : 'border-gray-300 hover:border-blue-300'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        );

      case 'yes_no_comment':
        return (
          <div className="space-y-4">
            <div className="flex gap-4 justify-center">
              {['Yes', 'No'].map((option) => (
                <button
                  key={option}
                  onClick={() => handleResponseChange(option)}
                  className={`px-8 py-4 rounded-lg border-2 font-medium transition-colors ${
                    currentResponse === option
                      ? 'border-blue-500 bg-blue-500 text-white'
                      : 'border-gray-300 hover:border-blue-300'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
            {currentResponse && (
              <div className="mt-4">
                <Textarea
                  value={currentResponseText || ''}
                  onChange={(e) => setCurrentResponseText(e.target.value)}
                  placeholder={
                    question.comment_prompt || 'Please add your comment...'
                  }
                  className="resize-none h-24"
                  required={question.comment_required}
                />
              </div>
            )}
          </div>
        );

      case 'emoji_scale':
        return (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-4 justify-center">
              {question.emoji_options?.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleResponseChange(option.value)}
                  className={`flex flex-col items-center p-4 rounded-lg border-2 transition-all ${
                    currentResponse === option.value
                      ? 'border-pink-500 bg-pink-50 scale-110'
                      : 'border-gray-300 hover:border-pink-300 hover:scale-105'
                  }`}
                >
                  <span className="text-4xl mb-2">{option.emoji}</span>
                  <span className="text-sm font-medium">{option.label}</span>
                </button>
              ))}
            </div>
          </div>
        );

      case 'rating':
        return (
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="flex gap-2">
                {Array.from({ length: question.scale_max || 10 }, (_, i) => {
                  const value = i + 1;
                  return (
                    <button
                      key={value}
                      onClick={() => handleResponseChange(value)}
                      className={`w-8 h-8 rounded border flex items-center justify-center text-sm transition-colors ${
                        currentResponse === value
                          ? 'border-blue-500 bg-blue-500 text-white'
                          : 'border-gray-300 hover:border-blue-300'
                      }`}
                    >
                      {value}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="text-center text-sm text-gray-600">
              Rate from 1 to {question.scale_max || 10}
            </div>
          </div>
        );

      case 'open_ended':
        return (
          <Textarea
            value={currentResponse || ''}
            onChange={(e) => handleResponseChange(e.target.value)}
            placeholder="Please share your thoughts..."
            className="resize-none h-32"
          />
        );

      case 'ranking':
        return (
          <div className="space-y-2">
            <p className="text-sm text-gray-600 mb-3">
              Drag to reorder from most important (top) to least important
              (bottom)
            </p>
            {/* Simplified ranking - in a real implementation, this would have drag-and-drop */}
            <div className="space-y-2">
              {question.options?.map((option, index) => (
                <div
                  key={index}
                  className="p-3 border border-gray-200 rounded-lg cursor-move"
                >
                  <span className="text-sm font-medium text-gray-600 mr-2">
                    {index + 1}.
                  </span>
                  {option}
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return <div>Unsupported question type</div>;
    }
  };

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const canProceed =
    currentResponse !== null &&
    currentResponse !== undefined &&
    (typeof currentResponse !== 'string' || currentResponse.trim() !== '');

  if (loading) {
    return (
      <Card className="p-8 text-center">
        <Loading />
        <p className="text-gray-600 mt-4">
          Preparing your personalized questionnaire...
        </p>
      </Card>
    );
  }

  if (!currentQuestion) {
    return (
      <Card className="p-8 text-center">
        <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Questionnaire Complete!
        </h3>
        <p className="text-gray-600">
          Thank you for your responses. Your feedback is valuable to us.
        </p>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Progress Header */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-600">
              Question {currentQuestionIndex + 1} of {questions.length}
            </span>
            {currentQuestion.adaptationType !== 'original' && (
              <Badge className="bg-purple-100 text-purple-800 text-xs">
                AI-Adapted
              </Badge>
            )}
          </div>
          <div className="text-sm text-gray-600">
            ~{Math.ceil(estimatedTimeRemaining)} min remaining
          </div>
        </div>
        <Progress value={progress} className="h-2" />
      </Card>

      {/* Adaptation Notification */}
      {showAdaptationInfo && adaptationTriggers.length > 0 && (
        <Card className="p-4 border-purple-200 bg-purple-50">
          <div className="flex items-start gap-3">
            <Brain className="w-5 h-5 text-purple-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-purple-900 mb-1">
                Questions Adapted for You
              </h4>
              <p className="text-sm text-purple-700">
                Based on your responses, we've personalized the remaining
                questions to be more relevant to your experience.
              </p>
              {adaptationTriggers.map((trigger, index) => (
                <p key={index} className="text-xs text-purple-600 mt-1">
                  • {trigger.description}
                </p>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Main Question Card */}
      <Card className="p-8">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="outline">{currentQuestion.category}</Badge>
            {currentQuestion.subcategory && (
              <Badge variant="outline" className="text-xs">
                {currentQuestion.subcategory}
              </Badge>
            )}
            {currentQuestion.required && (
              <Badge className="bg-red-100 text-red-800 text-xs">
                Required
              </Badge>
            )}
          </div>

          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {currentQuestion.text}
          </h2>

          {currentQuestion.contextExplanation && (
            <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg mb-4">
              <Info className="w-4 h-4 text-blue-600 mt-0.5" />
              <p className="text-sm text-blue-700">
                {currentQuestion.contextExplanation}
              </p>
            </div>
          )}

          {currentQuestion.adaptationReason &&
            currentQuestion.adaptationType !== 'original' && (
              <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg mb-4">
                <Lightbulb className="w-4 h-4 text-gray-600 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-700">
                    <strong>Why this question:</strong>{' '}
                    {currentQuestion.adaptationReason}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <Target className="w-3 h-3 text-gray-500" />
                    <span className="text-xs text-gray-500">
                      Confidence:{' '}
                      {(currentQuestion.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>
            )}
        </div>

        {/* Question Input */}
        <div className="mb-8">{renderQuestion(currentQuestion)}</div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </Button>

          <div className="flex items-center gap-2">
            {adapting && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                Adapting...
              </div>
            )}

            <Button
              onClick={handleNext}
              disabled={!canProceed || adapting}
              className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
            >
              {isLastQuestion ? 'Complete' : 'Next'}
              {!isLastQuestion && <ChevronRight className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </Card>

      {/* Response Summary (for debugging/testing) */}
      {responses.length > 0 && (
        <Card className="p-4">
          <h4 className="font-medium text-gray-900 mb-2">
            Your Responses ({responses.length})
          </h4>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {responses.map((response, index) => (
              <div key={index} className="text-sm text-gray-600">
                <span className="font-medium">{response.category}:</span>{' '}
                {typeof response.response === 'string'
                  ? response.response.substring(0, 50) +
                    (response.response.length > 50 ? '...' : '')
                  : response.response}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
