'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Clock,
  Users,
  Target,
  Settings,
  Play,
  Save,
  ArrowLeft,
  ArrowRight,
  Plus,
  Trash2,
} from 'lucide-react';

interface Department {
  _id: string;
  name: string;
  employee_count: number;
  hierarchy: {
    path: string;
  };
}

interface MicroclimateTemplate {
  _id: string;
  name: string;
  description: string;
  category: string;
  questions: Array<{
    id: string;
    text: string;
    type: string;
    options?: string[];
    required: boolean;
    order: number;
  }>;
  settings: {
    default_duration_minutes: number;
    suggested_frequency: string;
    anonymous_by_default: boolean;
    show_live_results: boolean;
  };
  usage_count: number;
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
    reminder_settings: {
      send_reminders: boolean;
      reminder_minutes_before: number[];
    };
  };
  real_time_settings: {
    show_live_results: boolean;
    anonymous_responses: boolean;
    allow_comments: boolean;
    word_cloud_enabled: boolean;
    sentiment_analysis_enabled: boolean;
    participation_threshold: number;
  };
  questions: Array<{
    id: string;
    text: string;
    type: 'likert' | 'multiple_choice' | 'open_ended' | 'emoji_rating';
    options?: string[];
    required: boolean;
    order: number;
  }>;
  template_id?: string;
}

const STEPS = [
  { id: 'template', title: 'Choose Template', icon: Target },
  { id: 'basic', title: 'Basic Info', icon: Settings },
  { id: 'targeting', title: 'Targeting', icon: Users },
  { id: 'scheduling', title: 'Scheduling', icon: Calendar },
  { id: 'questions', title: 'Questions', icon: Plus },
  { id: 'review', title: 'Review', icon: Play },
];

const QUESTION_TYPES = [
  {
    value: 'likert',
    label: 'Likert Scale (1-5)',
    description: 'Agreement scale from strongly disagree to strongly agree',
  },
  {
    value: 'multiple_choice',
    label: 'Multiple Choice',
    description: 'Select one option from multiple choices',
  },
  {
    value: 'open_ended',
    label: 'Open Text',
    description: 'Free text response for detailed feedback',
  },
  {
    value: 'emoji_rating',
    label: 'Emoji Rating',
    description: 'Rate using emoji reactions',
  },
];

export default function MicroclimateCreator() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [templates, setTemplates] = useState<MicroclimateTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] =
    useState<MicroclimateTemplate | null>(null);

  const [microclimateData, setMicroclimateData] = useState<MicroclimateData>({
    title: '',
    description: '',
    targeting: {
      department_ids: [],
      role_filters: [],
      include_managers: true,
    },
    scheduling: {
      start_time: new Date(Date.now() + 60 * 60 * 1000)
        .toISOString()
        .slice(0, 16), // 1 hour from now
      duration_minutes: 30,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      auto_close: true,
      reminder_settings: {
        send_reminders: true,
        reminder_minutes_before: [60, 15],
      },
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

  useEffect(() => {
    fetchDepartments();
    fetchTemplates();
  }, []);

  const fetchDepartments = async () => {
    try {
      const response = await fetch('/api/departments');
      if (response.ok) {
        const data = await response.json();
        setDepartments(data.departments || []);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/microclimates/templates?popular=true');
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || []);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const handleTemplateSelect = (template: MicroclimateTemplate) => {
    setSelectedTemplate(template);
    setMicroclimateData((prev) => ({
      ...prev,
      title: template.name,
      description: template.description,
      template_id: template._id,
      questions: template.questions.map((q) => ({
        ...q,
        id: `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: q.type as 'likert' | 'multiple_choice' | 'open_ended' | 'emoji_rating',
      })),
      scheduling: {
        ...prev.scheduling,
        duration_minutes: template.settings.default_duration_minutes,
      },
      real_time_settings: {
        ...prev.real_time_settings,
        anonymous_responses: template.settings.anonymous_by_default,
        show_live_results: template.settings.show_live_results,
      },
    }));
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSave = async (activate: boolean = false) => {
    setLoading(true);
    try {
      const response = await fetch('/api/microclimates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(microclimateData),
      });

      if (response.ok) {
        const data = await response.json();

        if (activate) {
          // Activate the microclimate immediately
          const activateResponse = await fetch(
            `/api/microclimates/${data.microclimate._id}/activate`,
            {
              method: 'POST',
            }
          );

          if (activateResponse.ok) {
            router.push(`/microclimates/${data.microclimate._id}/live`);
          } else {
            router.push(`/microclimates/${data.microclimate._id}`);
          }
        } else {
          router.push(`/microclimates/${data.microclimate._id}`);
        }
      } else {
        const error = await response.json();
        console.error('Error creating microclimate:', error);
        // TODO: Show error message to user
      }
    } catch (error) {
      console.error('Error creating microclimate:', error);
      // TODO: Show error message to user
    } finally {
      setLoading(false);
    }
  };

  const addQuestion = () => {
    const newQuestion = {
      id: `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      text: '',
      type: 'likert' as const,
      required: true,
      order: microclimateData.questions.length,
    };

    setMicroclimateData((prev) => ({
      ...prev,
      questions: [...prev.questions, newQuestion],
    }));
  };

  const updateQuestion = (
    index: number,
    updates: Partial<(typeof microclimateData.questions)[0]>
  ) => {
    setMicroclimateData((prev) => ({
      ...prev,
      questions: prev.questions.map((q, i) =>
        i === index ? { ...q, ...updates } : q
      ),
    }));
  };

  const removeQuestion = (index: number) => {
    setMicroclimateData((prev) => ({
      ...prev,
      questions: prev.questions
        .filter((_, i) => i !== index)
        .map((q, i) => ({ ...q, order: i })),
    }));
  };

  const renderStepContent = () => {
    switch (STEPS[currentStep].id) {
      case 'template':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Choose a Template
              </h3>
              <p className="text-gray-600 mb-6">
                Start with a pre-built template or create from scratch
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card
                className={`p-4 cursor-pointer border-2 transition-colors ${
                  !selectedTemplate
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedTemplate(null)}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">Start from Scratch</h4>
                  <Badge variant="outline">Custom</Badge>
                </div>
                <p className="text-sm text-gray-600">
                  Create a completely custom microclimate
                </p>
              </Card>

              {templates.map((template) => (
                <Card
                  key={template._id}
                  className={`p-4 cursor-pointer border-2 transition-colors ${
                    selectedTemplate?._id === template._id
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleTemplateSelect(template)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{template.name}</h4>
                    <Badge variant="outline">
                      {template.category?.replace('_', ' ') || 'Custom'}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    {template.description}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{template.questions.length} questions</span>
                    <span>Used {template.usage_count} times</span>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );

      case 'basic':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Basic Information
              </h3>
              <p className="text-gray-600 mb-6">
                Set the title and description for your microclimate
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Title <span className="text-red-500">*</span>
              </Label>
              <Input
                value={microclimateData.title}
                onChange={(e) =>
                  setMicroclimateData((prev) => ({
                    ...prev,
                    title: e.target.value,
                  }))
                }
                placeholder="e.g., Weekly Team Pulse Check"
                maxLength={150}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Description</Label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                rows={3}
                value={microclimateData.description}
                onChange={(e) =>
                  setMicroclimateData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Brief description of what this microclimate is about..."
                maxLength={500}
              />
            </div>
          </div>
        );

      case 'targeting':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Target Audience
              </h3>
              <p className="text-gray-600 mb-6">
                Select which departments and roles to include
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Departments <span className="text-red-500">*</span>
              </Label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {departments.map((dept) => (
                  <label
                    key={dept._id}
                    className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded"
                  >
                    <input
                      type="checkbox"
                      checked={microclimateData.targeting.department_ids.includes(
                        dept._id
                      )}
                      onChange={(e) => {
                        const deptIds = e.target.checked
                          ? [
                              ...microclimateData.targeting.department_ids,
                              dept._id,
                            ]
                          : microclimateData.targeting.department_ids.filter(
                              (id) => id !== dept._id
                            );
                        setMicroclimateData((prev) => ({
                          ...prev,
                          targeting: {
                            ...prev.targeting,
                            department_ids: deptIds,
                          },
                        }));
                      }}
                      className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <div className="flex-1">
                      <div className="font-medium">{dept.name}</div>
                      <div className="text-sm text-gray-500">
                        {dept.employee_count} employees • {dept.hierarchy.path}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="include_managers"
                checked={microclimateData.targeting.include_managers}
                onChange={(e) =>
                  setMicroclimateData((prev) => ({
                    ...prev,
                    targeting: {
                      ...prev.targeting,
                      include_managers: e.target.checked,
                    },
                  }))
                }
                className="rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <label
                htmlFor="include_managers"
                className="text-sm font-medium text-gray-700"
              >
                Include managers and supervisors
              </label>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Maximum Participants (optional)
              </Label>
              <Input
                type="number"
                min="1"
                value={microclimateData.targeting.max_participants || ''}
                onChange={(e) =>
                  setMicroclimateData((prev) => ({
                    ...prev,
                    targeting: {
                      ...prev.targeting,
                      max_participants: e.target.value
                        ? parseInt(e.target.value)
                        : undefined,
                    },
                  }))
                }
                placeholder="Leave empty for no limit"
              />
            </div>
          </div>
        );

      case 'scheduling':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Schedule & Timing
              </h3>
              <p className="text-gray-600 mb-6">
                Set when the microclimate will run
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Start Time <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="datetime-local"
                  value={microclimateData.scheduling.start_time}
                  onChange={(e) =>
                    setMicroclimateData((prev) => ({
                      ...prev,
                      scheduling: {
                        ...prev.scheduling,
                        start_time: e.target.value,
                      },
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Duration (minutes) <span className="text-red-500">*</span>
                </Label>
                <select
                  value={microclimateData.scheduling.duration_minutes}
                  onChange={(e) =>
                    setMicroclimateData((prev) => ({
                      ...prev,
                      scheduling: {
                        ...prev.scheduling,
                        duration_minutes: parseInt(e.target.value),
                      },
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>1 hour</option>
                  <option value={90}>1.5 hours</option>
                  <option value={120}>2 hours</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
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
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <label
                  htmlFor="auto_close"
                  className="text-sm font-medium text-gray-700"
                >
                  Automatically close when duration expires
                </label>
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="send_reminders"
                  checked={
                    microclimateData.scheduling.reminder_settings.send_reminders
                  }
                  onChange={(e) =>
                    setMicroclimateData((prev) => ({
                      ...prev,
                      scheduling: {
                        ...prev.scheduling,
                        reminder_settings: {
                          ...prev.scheduling.reminder_settings,
                          send_reminders: e.target.checked,
                        },
                      },
                    }))
                  }
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <label
                  htmlFor="send_reminders"
                  className="text-sm font-medium text-gray-700"
                >
                  Send reminder notifications
                </label>
              </div>
            </div>
          </div>
        );

      case 'questions':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Questions
                </h3>
                <p className="text-gray-600">
                  Add up to 10 questions for your microclimate
                </p>
              </div>
              <Button
                onClick={addQuestion}
                disabled={microclimateData.questions.length >= 10}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Question
              </Button>
            </div>

            <div className="space-y-4">
              {microclimateData.questions.map((question, index) => (
                <Card key={question.id} className="p-4">
                  <div className="flex items-start justify-between mb-4">
                    <h4 className="font-medium text-gray-900">
                      Question {index + 1}
                    </h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeQuestion(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        Question Text <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        value={question.text}
                        onChange={(e) =>
                          updateQuestion(index, { text: e.target.value })
                        }
                        placeholder="Enter your question..."
                        maxLength={300}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        Question Type
                      </Label>
                      <select
                        value={question.type}
                        onChange={(e) =>
                          updateQuestion(index, {
                            type: e.target.value as 'likert' | 'multiple_choice' | 'open_ended' | 'emoji_rating',
                            options:
                              e.target.value === 'multiple_choice'
                                ? ['Option 1', 'Option 2']
                                : undefined,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        {QUESTION_TYPES.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {question.type === 'multiple_choice' && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Options</Label>
                        <div className="space-y-2">
                          {(question.options || []).map((option, optIndex) => (
                            <div
                              key={optIndex}
                              className="flex items-center space-x-2"
                            >
                              <Input
                                value={option}
                                onChange={(e) => {
                                  const newOptions = [
                                    ...(question.options || []),
                                  ];
                                  newOptions[optIndex] = e.target.value;
                                  updateQuestion(index, {
                                    options: newOptions,
                                  });
                                }}
                                placeholder={`Option ${optIndex + 1}`}
                              />
                              {(question.options?.length || 0) > 2 && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    const newOptions = (
                                      question.options || []
                                    ).filter((_, i) => i !== optIndex);
                                    updateQuestion(index, {
                                      options: newOptions,
                                    });
                                  }}
                                  className="text-red-600"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          ))}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const newOptions = [
                                ...(question.options || []),
                                `Option ${(question.options?.length || 0) + 1}`,
                              ];
                              updateQuestion(index, { options: newOptions });
                            }}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Option
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              ))}

              {microclimateData.questions.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Plus className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>
                    No questions added yet. Click "Add Question" to get started.
                  </p>
                </div>
              )}
            </div>
          </div>
        );

      case 'review':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Review & Launch
              </h3>
              <p className="text-gray-600 mb-6">
                Review your microclimate settings before launching
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-4">
                <h4 className="font-medium text-gray-900 mb-3">
                  Basic Information
                </h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Title:</span>{' '}
                    {microclimateData.title}
                  </div>
                  <div>
                    <span className="font-medium">Description:</span>{' '}
                    {microclimateData.description || 'None'}
                  </div>
                  <div>
                    <span className="font-medium">Template:</span>{' '}
                    {selectedTemplate?.name || 'Custom'}
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <h4 className="font-medium text-gray-900 mb-3">Targeting</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Departments:</span>{' '}
                    {microclimateData.targeting.department_ids.length}
                  </div>
                  <div>
                    <span className="font-medium">Include Managers:</span>{' '}
                    {microclimateData.targeting.include_managers ? 'Yes' : 'No'}
                  </div>
                  <div>
                    <span className="font-medium">Max Participants:</span>{' '}
                    {microclimateData.targeting.max_participants || 'No limit'}
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <h4 className="font-medium text-gray-900 mb-3">Scheduling</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Start Time:</span>{' '}
                    {new Date(
                      microclimateData.scheduling.start_time
                    ).toLocaleString()}
                  </div>
                  <div>
                    <span className="font-medium">Duration:</span>{' '}
                    {microclimateData.scheduling.duration_minutes} minutes
                  </div>
                  <div>
                    <span className="font-medium">Auto Close:</span>{' '}
                    {microclimateData.scheduling.auto_close ? 'Yes' : 'No'}
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <h4 className="font-medium text-gray-900 mb-3">Questions</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Total Questions:</span>{' '}
                    {microclimateData.questions.length}
                  </div>
                  <div>
                    <span className="font-medium">Anonymous:</span>{' '}
                    {microclimateData.real_time_settings.anonymous_responses
                      ? 'Yes'
                      : 'No'}
                  </div>
                  <div>
                    <span className="font-medium">Live Results:</span>{' '}
                    {microclimateData.real_time_settings.show_live_results
                      ? 'Yes'
                      : 'No'}
                  </div>
                </div>
              </Card>
            </div>

            <div className="flex space-x-4">
              <Button
                onClick={() => handleSave(false)}
                disabled={loading}
                variant="outline"
                className="flex-1"
              >
                {loading ? (
                  <LoadingSpinner />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save as Draft
              </Button>
              <Button
                onClick={() => handleSave(true)}
                disabled={loading}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {loading ? (
                  <LoadingSpinner />
                ) : (
                  <Play className="w-4 h-4 mr-2" />
                )}
                Launch Now
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (STEPS[currentStep].id) {
      case 'template':
        return true; // Can always proceed from template selection
      case 'basic':
        return microclimateData.title.trim().length > 0;
      case 'targeting':
        return microclimateData.targeting.department_ids.length > 0;
      case 'scheduling':
        return (
          microclimateData.scheduling.start_time &&
          microclimateData.scheduling.duration_minutes > 0
        );
      case 'questions':
        return (
          microclimateData.questions.length > 0 &&
          microclimateData.questions.every((q) => q.text.trim().length > 0)
        );
      case 'review':
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-4">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Create Microclimate
            </h1>
            <p className="text-gray-600">Launch a real-time feedback session</p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center space-x-4 overflow-x-auto pb-2">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;

            return (
              <div
                key={step.id}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg whitespace-nowrap ${
                  isActive
                    ? 'bg-green-100 text-green-700'
                    : isCompleted
                      ? 'bg-gray-100 text-gray-700'
                      : 'text-gray-400'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{step.title}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {renderStepContent()}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      {currentStep < STEPS.length - 1 && (
        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>
          <Button
            onClick={handleNext}
            disabled={!canProceed()}
            className="bg-green-600 hover:bg-green-700"
          >
            Next
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
}
