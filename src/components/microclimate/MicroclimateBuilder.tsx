'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loading } from '@/components/ui/Loading';
import DepartmentTargeting from './DepartmentTargeting';
import {
  Activity,
  Clock,
  Users,
  MessageSquare,
  Settings,
  Calendar,
  Target,
  Zap,
  Save,
  Play,
  ChevronRight,
  ChevronLeft,
  Plus,
  Trash2,
  Copy,
  Sparkles,
  ChevronUp,
  ChevronDown,
  GripVertical,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import {
  getDefaultMicroclimateStartTime,
  getUserTimezone,
  getMinDateTimeLocal,
  getMaxDateTimeLocal,
  validateSchedulingDateTime,
  validateDuration,
} from '@/lib/datetime-utils';

interface Question {
  id: string;
  text: string;
  type: 'likert' | 'multiple_choice' | 'open_ended' | 'emoji_rating';
  options?: string[];
  required: boolean;
  order: number;
}

interface MicroclimateData {
  title: string;
  description: string;
  targeting: {
    department_ids: string[];
    role_filters: string[];
    include_managers: boolean;
    max_participants?: number;
  };
  scheduling: {
    start_time: string;
    duration_minutes: number;
    timezone: string;
    auto_close: boolean;
  };
  real_time_settings: {
    show_live_results: boolean;
    anonymous_responses: boolean;
    allow_comments: boolean;
    word_cloud_enabled: boolean;
    sentiment_analysis_enabled: boolean;
    participation_threshold: number;
  };
  questions: Question[];
  template_id?: string;
}

const QUESTION_TYPES = [
  {
    type: 'likert' as const,
    label: 'Likert Scale',
    description: '5-point agreement scale',
    icon: '📊',
  },
  {
    type: 'multiple_choice' as const,
    label: 'Multiple Choice',
    description: 'Select from options',
    icon: '☑️',
  },
  {
    type: 'open_ended' as const,
    label: 'Open Text',
    description: 'Free text response',
    icon: '💬',
  },
  {
    type: 'emoji_rating' as const,
    label: 'Emoji Rating',
    description: '5-emoji satisfaction scale',
    icon: '😊',
  },
];

const SAMPLE_QUESTIONS = [
  {
    text: 'How satisfied are you with your current work environment?',
    type: 'likert' as const,
  },
  {
    text: 'How would you rate team collaboration this week?',
    type: 'emoji_rating' as const,
  },
  {
    text: 'What is your current stress level?',
    type: 'likert' as const,
  },
  {
    text: 'How supported do you feel by your manager?',
    type: 'likert' as const,
  },
  {
    text: 'What could be improved in our team processes?',
    type: 'open_ended' as const,
  },
  {
    text: 'Which area needs the most attention?',
    type: 'multiple_choice' as const,
    options: ['Communication', 'Workload', 'Resources', 'Leadership'],
  },
];

export default function MicroclimateBuilder() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [participationThresholdInput, setParticipationThresholdInput] =
    useState('3');
  const [microclimateData, setMicroclimateData] = useState<MicroclimateData>({
    title: '',
    description: '',
    targeting: {
      department_ids: [],
      role_filters: [],
      include_managers: true,
    },
    scheduling: {
      start_time: getDefaultMicroclimateStartTime(), // 1 hour from now in local timezone
      duration_minutes: 30,
      timezone: getUserTimezone(),
      auto_close: true,
    },
    real_time_settings: {
      show_live_results: true,
      anonymous_responses: true,
      allow_comments: true,
      word_cloud_enabled: true,
      sentiment_analysis_enabled: true,
      participation_threshold: 3,
    },
    questions: [],
  });

  const steps = [
    { number: 1, title: 'Basic Info', icon: Activity },
    { number: 2, title: 'Questions', icon: MessageSquare },
    { number: 3, title: 'Targeting', icon: Target },
    { number: 4, title: 'Scheduling', icon: Calendar },
    { number: 5, title: 'Settings', icon: Settings },
  ];

  const addQuestion = (type: Question['type']) => {
    const newQuestion: Question = {
      id: `q_${Date.now()}`,
      text: '',
      type,
      required: true,
      order: microclimateData.questions.length,
      ...(type === 'multiple_choice' && { options: ['Option 1', 'Option 2'] }),
    };

    setMicroclimateData((prev) => ({
      ...prev,
      questions: [...prev.questions, newQuestion],
    }));
  };

  const addSampleQuestion = (sampleQuestion: (typeof SAMPLE_QUESTIONS)[0]) => {
    const newQuestion: Question = {
      id: `q_${Date.now()}`,
      text: sampleQuestion.text,
      type: sampleQuestion.type,
      required: true,
      order: microclimateData.questions.length,
      ...(sampleQuestion.options && { options: sampleQuestion.options }),
    };

    setMicroclimateData((prev) => ({
      ...prev,
      questions: [...prev.questions, newQuestion],
    }));
  };

  const loadSampleQuestions = () => {
    const sampleQuestions: Question[] = SAMPLE_QUESTIONS.slice(0, 3).map(
      (sample, index) => ({
        id: `q_sample_${Date.now()}_${index}`,
        text: sample.text,
        type: sample.type,
        required: true,
        order: index,
        ...(sample.options && { options: sample.options }),
      })
    );

    setMicroclimateData((prev) => ({
      ...prev,
      questions: sampleQuestions,
    }));
  };

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    setMicroclimateData((prev) => ({
      ...prev,
      questions: prev.questions.map((q) =>
        q.id === id ? { ...q, ...updates } : q
      ),
    }));
  };

  const removeQuestion = (id: string) => {
    setMicroclimateData((prev) => ({
      ...prev,
      questions: prev.questions.filter((q) => q.id !== id),
    }));
  };

  const duplicateQuestion = (id: string) => {
    const question = microclimateData.questions.find((q) => q.id === id);
    if (question) {
      const newQuestion = {
        ...question,
        id: `q_${Date.now()}`,
        order: microclimateData.questions.length,
      };
      setMicroclimateData((prev) => ({
        ...prev,
        questions: [...prev.questions, newQuestion],
      }));
    }
  };

  const moveQuestion = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= microclimateData.questions.length) return;

    const questions = [...microclimateData.questions];
    const [movedQuestion] = questions.splice(fromIndex, 1);
    questions.splice(toIndex, 0, movedQuestion);

    // Update order values
    const updatedQuestions = questions.map((q, index) => ({
      ...q,
      order: index,
    }));

    setMicroclimateData((prev) => ({
      ...prev,
      questions: updatedQuestions,
    }));
  };

  const validateQuestions = () => {
    const errors: string[] = [];

    if (microclimateData.questions.length === 0) {
      errors.push('At least one question is required');
    }

    microclimateData.questions.forEach((question, index) => {
      if (!question.text.trim()) {
        errors.push(`Question ${index + 1}: Question text is required`);
      }

      if (
        question.type === 'multiple_choice' &&
        (!question.options || question.options.length < 2)
      ) {
        errors.push(
          `Question ${index + 1}: Multiple choice questions need at least 2 options`
        );
      }

      if (question.type === 'multiple_choice' && question.options) {
        const emptyOptions = question.options.filter((opt) => !opt.trim());
        if (emptyOptions.length > 0) {
          errors.push(`Question ${index + 1}: All options must have text`);
        }
      }
    });

    return errors;
  };

  const handleSave = async (status: 'draft' | 'active' = 'draft') => {
    setSaving(true);
    try {
      console.log('Saving microclimate with data:', {
        ...microclimateData,
        status,
      });

      const response = await fetch('/api/microclimates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...microclimateData,
          status,
        }),
      });

      console.log('API Response status:', response.status);
      console.log('API Response headers:', response.headers);

      if (response.ok) {
        const result = await response.json();
        console.log('API Response data:', result);
        if (status === 'active') {
          router.push(`/microclimates/${result.microclimate._id}/live`);
        } else {
          router.push('/microclimates');
        }
      } else {
        // Get the error response body for better debugging
        const errorData = await response
          .json()
          .catch(() => ({ error: 'Unknown error' }));
        console.error('API Error Response:', errorData);
        console.error('Response status:', response.status);
        console.error('Response statusText:', response.statusText);
        throw new Error(
          `Failed to save microclimate: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`
        );
      }
    } catch (error) {
      console.error('Error saving microclimate:', error);
      // Show user-friendly error message
      alert(
        `Failed to save microclimate: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setSaving(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return microclimateData.title.trim().length > 0;
      case 2:
        const questionErrors = validateQuestions();
        return questionErrors.length === 0;
      case 3:
        return microclimateData.targeting.department_ids.length > 0;
      case 4:
        return (
          microclimateData.scheduling.start_time &&
          microclimateData.scheduling.duration_minutes > 0
        );
      default:
        return true;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Modern Header */}
      <div className="bg-gradient-to-r from-teal-50 to-cyan-50 border-b border-teal-100">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-teal-100 rounded-xl">
                <Activity className="h-8 w-8 text-teal-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Create Microclimate
                </h1>
                <p className="text-gray-600 mt-1">
                  Build real-time feedback sessions for your team
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => router.push('/microclimates')}
                className="bg-white"
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleSave('draft')}
                disabled={saving}
                variant="outline"
                className="bg-white"
              >
                {saving ? (
                  <Loading size="sm" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save Draft
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.number} className="flex items-center">
                  <motion.div
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                      currentStep === step.number
                        ? 'bg-teal-100 text-teal-700'
                        : currentStep > step.number
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-500'
                    }`}
                    whileHover={{ scale: 1.02 }}
                  >
                    <div
                      className={`p-2 rounded-lg ${
                        currentStep === step.number
                          ? 'bg-teal-200'
                          : currentStep > step.number
                            ? 'bg-green-200'
                            : 'bg-gray-200'
                      }`}
                    >
                      <step.icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-medium">{step.title}</div>
                      <div className="text-xs opacity-75">
                        Step {step.number}
                      </div>
                    </div>
                  </motion.div>
                  {index < steps.length - 1 && (
                    <ChevronRight className="w-5 h-5 text-gray-300 mx-2" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Step Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {currentStep === 1 && (
                <Card className="border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <div className="p-2 bg-teal-100 rounded-lg">
                        <Activity className="w-5 h-5 text-teal-600" />
                      </div>
                      Basic Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Microclimate Title *
                      </label>
                      <Input
                        placeholder="e.g., Weekly Team Pulse Check"
                        value={microclimateData.title}
                        onChange={(e) =>
                          setMicroclimateData((prev) => ({
                            ...prev,
                            title: e.target.value,
                          }))
                        }
                        className="text-base h-12"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                      </label>
                      <Textarea
                        placeholder="Brief description of what this microclimate aims to measure..."
                        value={microclimateData.description}
                        onChange={(e) =>
                          setMicroclimateData((prev) => ({
                            ...prev,
                            description: e.target.value,
                          }))
                        }
                        className="min-h-24"
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {currentStep === 2 && (
                <div className="space-y-6">
                  <Card className="border-0 shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <MessageSquare className="w-5 h-5 text-blue-600" />
                        </div>
                        Questions ({microclimateData.questions.length}/10)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {/* Empty State with Actions */}
                      {microclimateData.questions.length === 0 && (
                        <div className="text-center py-8 mb-6">
                          <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            No Questions Added Yet
                          </h3>
                          <p className="text-gray-600 mb-4">
                            Add questions to gather real-time feedback from your
                            team.
                          </p>
                          <div className="flex flex-col sm:flex-row gap-2 justify-center mb-6">
                            <Button
                              onClick={loadSampleQuestions}
                              variant="outline"
                              className="flex items-center gap-2"
                            >
                              <Sparkles className="h-4 w-4" />
                              Load Sample Questions
                            </Button>
                            <Button
                              onClick={() => addQuestion('likert')}
                              className="flex items-center gap-2"
                            >
                              <Plus className="h-4 w-4" />
                              Add First Question
                            </Button>
                          </div>

                          {/* Quick Add Suggestions for Empty State */}
                          <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
                            <CardContent className="p-4">
                              <div className="flex items-center gap-2 mb-3">
                                <Sparkles className="w-4 h-4 text-purple-600" />
                                <span className="text-sm font-medium text-purple-700">
                                  Quick Add Suggestions
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-2 justify-center">
                                {SAMPLE_QUESTIONS.slice(0, 3).map(
                                  (suggestion, index) => (
                                    <Button
                                      key={index}
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        addSampleQuestion(suggestion)
                                      }
                                      className="text-xs bg-white border-purple-200 text-purple-700 hover:bg-purple-50"
                                    >
                                      <Plus className="w-3 h-3 mr-1" />
                                      {suggestion.text.length > 30
                                        ? `${suggestion.text.slice(0, 30)}...`
                                        : suggestion.text}
                                    </Button>
                                  )
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      )}

                      {/* Quick Add Sample Questions (when questions exist but not full) */}
                      {microclimateData.questions.length > 0 &&
                        microclimateData.questions.length < 10 && (
                          <div className="mb-6">
                            <h4 className="text-sm font-medium text-gray-700 mb-3">
                              Quick Add More Questions:
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {SAMPLE_QUESTIONS.slice(0, 4).map(
                                (sample, index) => (
                                  <Button
                                    key={index}
                                    variant="outline"
                                    size="sm"
                                    onClick={() => addSampleQuestion(sample)}
                                    className="text-xs"
                                    disabled={microclimateData.questions.some(
                                      (q) => q.text === sample.text
                                    )}
                                  >
                                    <Plus className="h-3 w-3 mr-1" />
                                    {sample.text.length > 30
                                      ? `${sample.text.substring(0, 30)}...`
                                      : sample.text}
                                  </Button>
                                )
                              )}
                            </div>
                          </div>
                        )}

                      {/* Question Types */}
                      {microclimateData.questions.length > 0 && (
                        <div className="mb-6">
                          <h4 className="text-sm font-medium text-gray-700 mb-3">
                            Add New Question:
                          </h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {QUESTION_TYPES.map((type) => (
                              <motion.button
                                key={type.type}
                                onClick={() => addQuestion(type.type)}
                                disabled={
                                  microclimateData.questions.length >= 10
                                }
                                className="p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-teal-400 hover:bg-teal-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                              >
                                <div className="text-2xl mb-2">{type.icon}</div>
                                <div className="font-medium text-sm">
                                  {type.label}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {type.description}
                                </div>
                              </motion.button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Questions List */}
                      <div className="space-y-4">
                        <AnimatePresence>
                          {microclimateData.questions.map((question, index) => (
                            <motion.div
                              key={question.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -20 }}
                              className="p-4 border border-gray-200 rounded-xl bg-white"
                            >
                              <div className="flex items-start gap-4">
                                <div className="p-2 bg-gray-100 rounded-lg">
                                  <span className="text-sm font-medium">
                                    Q{index + 1}
                                  </span>
                                </div>

                                <div className="flex-1 space-y-3">
                                  <div className="flex items-center gap-2">
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {
                                        QUESTION_TYPES.find(
                                          (t) => t.type === question.type
                                        )?.label
                                      }
                                    </Badge>
                                    {question.required && (
                                      <Badge className="bg-red-100 text-red-700 text-xs">
                                        Required
                                      </Badge>
                                    )}
                                  </div>

                                  <Input
                                    placeholder="Enter your question..."
                                    value={question.text}
                                    onChange={(e) =>
                                      updateQuestion(question.id, {
                                        text: e.target.value,
                                      })
                                    }
                                    className="text-base"
                                  />

                                  {question.type === 'multiple_choice' && (
                                    <div className="space-y-2">
                                      <label className="text-sm font-medium text-gray-700">
                                        Options:
                                      </label>
                                      {question.options?.map(
                                        (option, optionIndex) => (
                                          <div
                                            key={optionIndex}
                                            className="flex items-center gap-2"
                                          >
                                            <Input
                                              placeholder={`Option ${optionIndex + 1}`}
                                              value={option}
                                              onChange={(e) => {
                                                const newOptions = [
                                                  ...(question.options || []),
                                                ];
                                                newOptions[optionIndex] =
                                                  e.target.value;
                                                updateQuestion(question.id, {
                                                  options: newOptions,
                                                });
                                              }}
                                              className="text-sm"
                                            />
                                            {question.options &&
                                              question.options.length > 2 && (
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  onClick={() => {
                                                    const newOptions =
                                                      question.options?.filter(
                                                        (_, i) =>
                                                          i !== optionIndex
                                                      );
                                                    updateQuestion(
                                                      question.id,
                                                      {
                                                        options: newOptions,
                                                      }
                                                    );
                                                  }}
                                                >
                                                  <Trash2 className="w-4 h-4 text-red-500" />
                                                </Button>
                                              )}
                                          </div>
                                        )
                                      )}
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          const newOptions = [
                                            ...(question.options || []),
                                            `Option ${(question.options?.length || 0) + 1}`,
                                          ];
                                          updateQuestion(question.id, {
                                            options: newOptions,
                                          });
                                        }}
                                        className="text-xs"
                                      >
                                        <Plus className="w-3 h-3 mr-1" />
                                        Add Option
                                      </Button>
                                    </div>
                                  )}

                                  {/* Emoji Rating Options */}
                                  {question.type === 'emoji_rating' && (
                                    <div className="space-y-2">
                                      <label className="text-sm font-medium text-gray-700">
                                        Rating Scale
                                      </label>
                                      <div className="flex items-center gap-4">
                                        <select
                                          value={question.options?.[0] || '5'}
                                          onChange={(e) =>
                                            updateQuestion(question.id, {
                                              options: [e.target.value],
                                            })
                                          }
                                          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                          <option value="3">
                                            3-point scale
                                          </option>
                                          <option value="5">
                                            5-point scale
                                          </option>
                                          <option value="7">
                                            7-point scale
                                          </option>
                                        </select>
                                        <div className="text-sm text-gray-500">
                                          😢 → 😐 → 😊 (example)
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {/* Question Controls */}
                                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                                    <div className="flex items-center gap-2">
                                      <label className="flex items-center gap-2 text-sm">
                                        <input
                                          type="checkbox"
                                          checked={question.required}
                                          onChange={(e) =>
                                            updateQuestion(question.id, {
                                              required: e.target.checked,
                                            })
                                          }
                                          className="rounded"
                                        />
                                        Required
                                      </label>
                                    </div>

                                    <div className="flex items-center gap-2">
                                      {/* Move Up */}
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                          moveQuestion(index, index - 1)
                                        }
                                        disabled={index === 0}
                                        className="p-1"
                                      >
                                        <ChevronUp className="w-4 h-4" />
                                      </Button>

                                      {/* Move Down */}
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                          moveQuestion(index, index + 1)
                                        }
                                        disabled={
                                          index ===
                                          microclimateData.questions.length - 1
                                        }
                                        className="p-1"
                                      >
                                        <ChevronDown className="w-4 h-4" />
                                      </Button>

                                      {/* Delete Question */}
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                          removeQuestion(question.id)
                                        }
                                        className="p-1 text-red-500 hover:text-red-700"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-6">
                  <Card className="border-0 shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <Target className="w-5 h-5 text-green-600" />
                        </div>
                        Target Audience
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <DepartmentTargeting
                        selectedDepartmentIds={
                          microclimateData.targeting.department_ids
                        }
                        onDepartmentChange={(departmentIds) =>
                          setMicroclimateData((prev) => ({
                            ...prev,
                            targeting: {
                              ...prev.targeting,
                              department_ids: departmentIds,
                            },
                          }))
                        }
                        roleFilters={microclimateData.targeting.role_filters}
                        onRoleFilterChange={(roles) =>
                          setMicroclimateData((prev) => ({
                            ...prev,
                            targeting: {
                              ...prev.targeting,
                              role_filters: roles,
                            },
                          }))
                        }
                        includeManagers={
                          microclimateData.targeting.include_managers
                        }
                        onIncludeManagersChange={(include) =>
                          setMicroclimateData((prev) => ({
                            ...prev,
                            targeting: {
                              ...prev.targeting,
                              include_managers: include,
                            },
                          }))
                        }
                        maxParticipants={
                          microclimateData.targeting.max_participants
                        }
                        onMaxParticipantsChange={(max) =>
                          setMicroclimateData((prev) => ({
                            ...prev,
                            targeting: {
                              ...prev.targeting,
                              max_participants: max,
                            },
                          }))
                        }
                      />
                    </CardContent>
                  </Card>
                </div>
              )}

              {currentStep === 4 && (
                <Card className="border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <Calendar className="w-5 h-5 text-orange-600" />
                      </div>
                      Scheduling
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Start Time *
                        </label>
                        <div className="space-y-2">
                          <Input
                            type="datetime-local"
                            value={microclimateData.scheduling.start_time}
                            min={getMinDateTimeLocal()} // Prevent past times
                            max={getMaxDateTimeLocal()} // Prevent far future times
                            onChange={(e) => {
                              setMicroclimateData((prev) => ({
                                ...prev,
                                scheduling: {
                                  ...prev.scheduling,
                                  start_time: e.target.value,
                                },
                              }));

                              // Real-time validation feedback
                              if (e.target.value) {
                                const validation = validateSchedulingDateTime(
                                  e.target.value,
                                  microclimateData.scheduling.timezone
                                );
                                if (!validation.isValid) {
                                  console.warn(
                                    'Invalid datetime:',
                                    validation.error
                                  );
                                }
                              }
                            }}
                            className="text-base h-12"
                          />
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            🌍 Timezone: {microclimateData.scheduling.timezone}{' '}
                            (Your local timezone)
                          </p>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Duration (minutes) *
                        </label>
                        <Input
                          type="number"
                          min="5"
                          max="480"
                          value={microclimateData.scheduling.duration_minutes}
                          onChange={(e) =>
                            setMicroclimateData((prev) => ({
                              ...prev,
                              scheduling: {
                                ...prev.scheduling,
                                duration_minutes:
                                  parseInt(e.target.value) || 30,
                              },
                            }))
                          }
                          className="text-base h-12"
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="auto_close"
                        checked={microclimateData.scheduling.auto_close}
                        onChange={(e) =>
                          setMicroclimateData((prev) => ({
                            ...prev,
                            scheduling: {
                              ...prev.scheduling,
                              auto_close: e.target.checked,
                            },
                          }))
                        }
                        className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                      />
                      <label
                        htmlFor="auto_close"
                        className="text-sm font-medium text-gray-700"
                      >
                        Automatically close when time expires
                      </label>
                    </div>
                  </CardContent>
                </Card>
              )}

              {currentStep === 5 && (
                <div className="space-y-6">
                  <Card className="border-0 shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <Settings className="w-5 h-5 text-purple-600" />
                        </div>
                        Real-time Settings
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <h4 className="font-medium text-gray-900">
                            Display Options
                          </h4>

                          <div className="space-y-3">
                            <div className="flex items-center space-x-3">
                              <input
                                type="checkbox"
                                id="show_live_results"
                                checked={
                                  microclimateData.real_time_settings
                                    .show_live_results
                                }
                                onChange={(e) =>
                                  setMicroclimateData((prev) => ({
                                    ...prev,
                                    real_time_settings: {
                                      ...prev.real_time_settings,
                                      show_live_results: e.target.checked,
                                    },
                                  }))
                                }
                                className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                              />
                              <label
                                htmlFor="show_live_results"
                                className="text-sm font-medium text-gray-700"
                              >
                                Show live results to participants
                              </label>
                            </div>

                            <div className="flex items-center space-x-3">
                              <input
                                type="checkbox"
                                id="word_cloud_enabled"
                                checked={
                                  microclimateData.real_time_settings
                                    .word_cloud_enabled
                                }
                                onChange={(e) =>
                                  setMicroclimateData((prev) => ({
                                    ...prev,
                                    real_time_settings: {
                                      ...prev.real_time_settings,
                                      word_cloud_enabled: e.target.checked,
                                    },
                                  }))
                                }
                                className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                              />
                              <label
                                htmlFor="word_cloud_enabled"
                                className="text-sm font-medium text-gray-700"
                              >
                                Enable word cloud visualization
                              </label>
                            </div>

                            <div className="flex items-center space-x-3">
                              <input
                                type="checkbox"
                                id="sentiment_analysis_enabled"
                                checked={
                                  microclimateData.real_time_settings
                                    .sentiment_analysis_enabled
                                }
                                onChange={(e) =>
                                  setMicroclimateData((prev) => ({
                                    ...prev,
                                    real_time_settings: {
                                      ...prev.real_time_settings,
                                      sentiment_analysis_enabled:
                                        e.target.checked,
                                    },
                                  }))
                                }
                                className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                              />
                              <label
                                htmlFor="sentiment_analysis_enabled"
                                className="text-sm font-medium text-gray-700"
                              >
                                Enable sentiment analysis
                              </label>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <h4 className="font-medium text-gray-900">
                            Privacy Options
                          </h4>

                          <div className="space-y-3">
                            <div className="flex items-center space-x-3">
                              <input
                                type="checkbox"
                                id="anonymous_responses"
                                checked={
                                  microclimateData.real_time_settings
                                    .anonymous_responses
                                }
                                onChange={(e) =>
                                  setMicroclimateData((prev) => ({
                                    ...prev,
                                    real_time_settings: {
                                      ...prev.real_time_settings,
                                      anonymous_responses: e.target.checked,
                                    },
                                  }))
                                }
                                className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                              />
                              <label
                                htmlFor="anonymous_responses"
                                className="text-sm font-medium text-gray-700"
                              >
                                Anonymous responses
                              </label>
                            </div>

                            <div className="flex items-center space-x-3">
                              <input
                                type="checkbox"
                                id="allow_comments"
                                checked={
                                  microclimateData.real_time_settings
                                    .allow_comments
                                }
                                onChange={(e) =>
                                  setMicroclimateData((prev) => ({
                                    ...prev,
                                    real_time_settings: {
                                      ...prev.real_time_settings,
                                      allow_comments: e.target.checked,
                                    },
                                  }))
                                }
                                className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                              />
                              <label
                                htmlFor="allow_comments"
                                className="text-sm font-medium text-gray-700"
                              >
                                Allow text comments
                              </label>
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Minimum responses to show results
                            </label>
                            <Input
                              type="number"
                              min="1"
                              max="50"
                              value={participationThresholdInput}
                              onChange={(e) => {
                                const value = e.target.value;
                                setParticipationThresholdInput(value);

                                // Update the actual state only if we have a valid number
                                const numericValue = parseInt(value);
                                if (
                                  !isNaN(numericValue) &&
                                  numericValue >= 1 &&
                                  numericValue <= 50
                                ) {
                                  setMicroclimateData((prev) => ({
                                    ...prev,
                                    real_time_settings: {
                                      ...prev.real_time_settings,
                                      participation_threshold: numericValue,
                                    },
                                  }));
                                }
                              }}
                              onBlur={(e) => {
                                // Ensure we have a valid value when the field loses focus
                                const value = e.target.value;
                                const numericValue = parseInt(value);

                                if (
                                  value === '' ||
                                  isNaN(numericValue) ||
                                  numericValue < 1
                                ) {
                                  setParticipationThresholdInput('1');
                                  setMicroclimateData((prev) => ({
                                    ...prev,
                                    real_time_settings: {
                                      ...prev.real_time_settings,
                                      participation_threshold: 1,
                                    },
                                  }));
                                } else if (numericValue > 50) {
                                  setParticipationThresholdInput('50');
                                  setMicroclimateData((prev) => ({
                                    ...prev,
                                    real_time_settings: {
                                      ...prev.real_time_settings,
                                      participation_threshold: 50,
                                    },
                                  }));
                                }
                              }}
                              className="text-base h-12"
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1}
              className="bg-white"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>

            <div className="flex items-center gap-3">
              {currentStep === steps.length ? (
                <>
                  <Button
                    onClick={() => handleSave('draft')}
                    disabled={saving}
                    variant="outline"
                    className="bg-white"
                  >
                    {saving ? (
                      <Loading size="sm" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Save as Draft
                  </Button>
                  <Button
                    onClick={() => handleSave('active')}
                    disabled={saving || !canProceed()}
                    className="bg-teal-600 hover:bg-teal-700"
                  >
                    {saving ? (
                      <Loading size="sm" />
                    ) : (
                      <Play className="w-4 h-4 mr-2" />
                    )}
                    Launch Microclimate
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() =>
                    setCurrentStep(Math.min(steps.length, currentStep + 1))
                  }
                  disabled={!canProceed()}
                  className="bg-teal-600 hover:bg-teal-700"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
