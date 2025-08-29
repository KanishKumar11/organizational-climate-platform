'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Loading } from '@/components/ui/Loading';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  Star,
  Clock,
  Users,
  MessageSquare,
  Target,
  Plus,
  Check,
  Eye,
  Copy,
} from 'lucide-react';

interface MicroclimateTemplate {
  _id: string;
  name: string;
  description: string;
  category:
    | 'pulse_check'
    | 'team_mood'
    | 'feedback_session'
    | 'project_retrospective'
    | 'custom';
  company_id?: string;
  created_by?: {
    name: string;
    email: string;
  };
  is_system_template: boolean;
  questions: Array<{
    id: string;
    text: string;
    type: 'likert' | 'multiple_choice' | 'open_ended' | 'emoji_rating';
    options?: string[];
    required: boolean;
    order: number;
    category?: string;
  }>;
  settings: {
    default_duration_minutes: number;
    suggested_frequency: 'daily' | 'weekly' | 'bi_weekly' | 'monthly';
    max_participants?: number;
    anonymous_by_default: boolean;
    auto_close: boolean;
    show_live_results: boolean;
  };
  usage_count: number;
  is_active: boolean;
  tags: string[];
  created_at: string;
  updated_at: string;
}

interface TemplateSelectorProps {
  selectedTemplate: MicroclimateTemplate | null;
  onTemplateSelect: (template: MicroclimateTemplate | null) => void;
  onCreateFromScratch: () => void;
  showCreateOption?: boolean;
}

const CATEGORY_LABELS = {
  pulse_check: 'Pulse Check',
  team_mood: 'Team Mood',
  feedback_session: 'Feedback Session',
  project_retrospective: 'Project Retrospective',
  custom: 'Custom',
};

const CATEGORY_COLORS = {
  pulse_check: 'bg-blue-100 text-blue-800',
  team_mood: 'bg-green-100 text-green-800',
  feedback_session: 'bg-purple-100 text-purple-800',
  project_retrospective: 'bg-orange-100 text-orange-800',
  custom: 'bg-gray-100 text-gray-800',
};

const FREQUENCY_LABELS = {
  daily: 'Daily',
  weekly: 'Weekly',
  bi_weekly: 'Bi-weekly',
  monthly: 'Monthly',
};

export default function TemplateSelector({
  selectedTemplate,
  onTemplateSelect,
  onCreateFromScratch,
  showCreateOption = true,
}: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<MicroclimateTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showSystemOnly, setShowSystemOnly] = useState(false);
  const [showPopularOnly, setShowPopularOnly] = useState(false);
  const [previewTemplate, setPreviewTemplate] =
    useState<MicroclimateTemplate | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, [categoryFilter, showSystemOnly, showPopularOnly]);

  const fetchTemplates = async () => {
    try {
      const params = new URLSearchParams();
      if (categoryFilter !== 'all') params.append('category', categoryFilter);
      if (showSystemOnly) params.append('system_only', 'true');
      if (showPopularOnly) params.append('popular', 'true');

      const response = await fetch(
        `/api/microclimates/templates?${params.toString()}`
      );
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || []);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTemplates = templates.filter(
    (template) =>
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.tags.some((tag) =>
        tag.toLowerCase().includes(searchTerm.toLowerCase())
      )
  );

  const getQuestionTypeIcon = (type: string) => {
    switch (type) {
      case 'likert':
        return '📊';
      case 'multiple_choice':
        return '☑️';
      case 'open_ended':
        return '💬';
      case 'emoji_rating':
        return '😊';
      default:
        return '❓';
    }
  };

  const handleTemplatePreview = (template: MicroclimateTemplate) => {
    setPreviewTemplate(template);
  };

  const handleCloneTemplate = async (template: MicroclimateTemplate) => {
    try {
      const response = await fetch(
        `/api/microclimates/templates/${template._id}/clone`,
        {
          method: 'POST',
        }
      );

      if (response.ok) {
        const data = await response.json();
        fetchTemplates(); // Refresh the list
        onTemplateSelect(data.template);
      }
    } catch (error) {
      console.error('Error cloning template:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loading size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Choose a Template
        </h2>
        <p className="text-gray-600">
          Start with a pre-built template or create from scratch
        </p>
      </div>

      {/* Search and Filters */}
      <Card className="p-4">
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="all">All Categories</option>
                {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={showSystemOnly}
                onChange={(e) => setShowSystemOnly(e.target.checked)}
                className="rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <span>System templates only</span>
            </label>

            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={showPopularOnly}
                onChange={(e) => setShowPopularOnly(e.target.checked)}
                className="rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <span>Popular templates</span>
            </label>
          </div>
        </div>
      </Card>

      {/* Create from Scratch Option */}
      {showCreateOption && (
        <Card
          className={`p-4 cursor-pointer border-2 transition-all duration-200 ${
            !selectedTemplate
              ? 'border-green-500 bg-green-50 shadow-md'
              : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
          }`}
          onClick={() => {
            onTemplateSelect(null);
            onCreateFromScratch();
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <Plus className="w-6 h-6 text-gray-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  Start from Scratch
                </h3>
                <p className="text-sm text-gray-600">
                  Create a completely custom microclimate
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline">Custom</Badge>
              {!selectedTemplate && (
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Templates Grid */}
      {filteredTemplates.length === 0 ? (
        <Card className="p-8 text-center">
          <Target className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No templates found
          </h3>
          <p className="text-gray-600">
            {searchTerm ||
            categoryFilter !== 'all' ||
            showSystemOnly ||
            showPopularOnly
              ? 'Try adjusting your search or filters'
              : 'No templates available'}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((template) => (
            <motion.div
              key={template._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Card
                className={`p-4 cursor-pointer border-2 transition-all duration-200 ${
                  selectedTemplate?._id === template._id
                    ? 'border-green-500 bg-green-50 shadow-md'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                }`}
                onClick={() => onTemplateSelect(template)}
              >
                <div className="space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-semibold text-gray-900 line-clamp-1">
                          {template.name}
                        </h3>
                        {template.is_system_template && (
                          <Star className="w-4 h-4 text-yellow-500" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                        {template.description}
                      </p>
                    </div>
                    {selectedTemplate?._id === template._id && (
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center ml-2">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Category and Tags */}
                  <div className="flex items-center space-x-2">
                    <Badge className={CATEGORY_COLORS[template.category]}>
                      {CATEGORY_LABELS[template.category]}
                    </Badge>
                    {template.usage_count > 0 && (
                      <Badge variant="outline" className="text-xs">
                        Used {template.usage_count}x
                      </Badge>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <MessageSquare className="w-4 h-4" />
                      <span>{template.questions.length} questions</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>{template.settings.default_duration_minutes}m</span>
                    </div>
                  </div>

                  {/* Question Types Preview */}
                  <div className="flex items-center space-x-1">
                    {Array.from(
                      new Set(template.questions.map((q) => q.type))
                    ).map((type) => (
                      <span key={type} className="text-lg" title={type}>
                        {getQuestionTypeIcon(type)}
                      </span>
                    ))}
                  </div>

                  {/* Settings Preview */}
                  <div className="text-xs text-gray-500 space-y-1">
                    <div>
                      Frequency:{' '}
                      {FREQUENCY_LABELS[template.settings.suggested_frequency]}
                    </div>
                    <div>
                      {template.settings.anonymous_by_default
                        ? 'Anonymous'
                        : 'Named'}{' '}
                      •
                      {template.settings.show_live_results
                        ? ' Live results'
                        : ' No live results'}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTemplatePreview(template);
                      }}
                      className="flex-1"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Preview
                    </Button>
                    {!template.is_system_template && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCloneTemplate(template);
                        }}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  {/* Creator Info */}
                  {template.created_by && (
                    <div className="pt-2 border-t border-gray-100">
                      <p className="text-xs text-gray-500">
                        Created by {template.created_by.name}
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Template Preview Modal */}
      <AnimatePresence>
        {previewTemplate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setPreviewTemplate(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">
                    {previewTemplate.name}
                  </h3>
                  <Button
                    variant="ghost"
                    onClick={() => setPreviewTemplate(null)}
                  >
                    ×
                  </Button>
                </div>

                <div className="space-y-4">
                  <p className="text-gray-600">{previewTemplate.description}</p>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Category:</span>{' '}
                      {CATEGORY_LABELS[previewTemplate.category]}
                    </div>
                    <div>
                      <span className="font-medium">Duration:</span>{' '}
                      {previewTemplate.settings.default_duration_minutes}{' '}
                      minutes
                    </div>
                    <div>
                      <span className="font-medium">Frequency:</span>{' '}
                      {
                        FREQUENCY_LABELS[
                          previewTemplate.settings.suggested_frequency
                        ]
                      }
                    </div>
                    <div>
                      <span className="font-medium">Questions:</span>{' '}
                      {previewTemplate.questions.length}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">
                      Questions:
                    </h4>
                    <div className="space-y-2">
                      {previewTemplate.questions.map((question, index) => (
                        <div
                          key={question.id}
                          className="p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-start space-x-2">
                            <span className="text-sm font-medium text-gray-500">
                              {index + 1}.
                            </span>
                            <div className="flex-1">
                              <p className="text-sm text-gray-900">
                                {question.text}
                              </p>
                              <div className="flex items-center space-x-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {question.type.replace('_', ' ')}
                                </Badge>
                                {question.required && (
                                  <Badge
                                    variant="outline"
                                    className="text-xs text-red-600"
                                  >
                                    Required
                                  </Badge>
                                )}
                              </div>
                              {question.options && (
                                <div className="mt-2 text-xs text-gray-600">
                                  Options: {question.options.join(', ')}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <Button
                      onClick={() => {
                        onTemplateSelect(previewTemplate);
                        setPreviewTemplate(null);
                      }}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      Use This Template
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setPreviewTemplate(null)}
                      className="flex-1"
                    >
                      Close
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
