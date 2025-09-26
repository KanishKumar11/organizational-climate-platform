'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loading } from '@/components/ui/Loading';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Wand2,
  RefreshCw,
  Save,
  Eye,
  BarChart3,
  Lightbulb,
  Target,
  TrendingUp,
  Settings,
  Play,
} from 'lucide-react';

interface AdaptedQuestion {
  originalQuestionId?: string;
  text: string;
  type: string;
  category: string;
  subcategory?: string;
  options?: string[];
  scale_min?: number;
  scale_max?: number;
  scale_labels?: { min: string; max: string };
  tags: string[];
  adaptationType: 'original' | 'combined' | 'reformulated' | 'generated';
  adaptationReason: string;
  confidence: number;
  sourceQuestions?: string[];
}

interface AdaptationContext {
  department?: string;
  role?: string;
  industry?: string;
  companySize?: string;
  surveyType?: string;
  demographics?: Record<string, any>;
}

interface QuestionAdaptationTesterProps {
  userRole: string;
  companyId?: string;
}

export default function QuestionAdaptationTester({
  userRole,
  companyId,
}: QuestionAdaptationTesterProps) {
  const [adaptedQuestions, setAdaptedQuestions] = useState<AdaptedQuestion[]>(
    []
  );
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([
    'Communication',
  ]);
  const [questionsPerCategory, setQuestionsPerCategory] = useState(3);
  const [context, setContext] = useState<AdaptationContext>({
    department: 'Engineering',
    role: 'Developer',
    surveyType: 'general_climate',
  });
  const [adaptationSummary, setAdaptationSummary] = useState<any>(null);

  const availableCategories = [
    'Communication',
    'Collaboration',
    'Leadership',
    'Work Environment',
    'Recognition & Rewards',
    'Professional Development',
    'Work-Life Balance',
    'Innovation & Creativity',
    'Diversity & Inclusion',
    'Job Satisfaction',
    'Organizational Culture',
    'Change Management',
    'Performance Management',
    'Customer Focus',
    'Safety & Well-being',
  ];

  const departments = [
    'Engineering',
    'Sales',
    'Marketing',
    'HR',
    'Finance',
    'Operations',
    'Customer Support',
    'Product',
    'Design',
  ];

  const roles = [
    'Developer',
    'Manager',
    'Team Lead',
    'Individual Contributor',
    'Director',
    'VP',
    'Analyst',
    'Specialist',
  ];

  const handleAdaptQuestions = async () => {
    if (selectedCategories.length === 0) return;

    try {
      setLoading(true);
      const response = await fetch('/api/question-bank/adapt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categories: selectedCategories,
          questionsPerCategory,
          context,
          saveAdaptations: false, // Don't save during testing
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setAdaptedQuestions(data.adapted_questions);
        setAdaptationSummary(data.adaptation_summary);
      }
    } catch (error) {
      console.error('Error adapting questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAdaptations = async () => {
    if (adaptedQuestions.length === 0) return;

    try {
      setSaving(true);
      const response = await fetch('/api/question-bank/adapt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categories: selectedCategories,
          questionsPerCategory,
          context,
          saveAdaptations: true,
          surveyId: 'adaptation_test',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log(
          `Saved ${data.saved_question_ids.length} adapted questions`
        );
      }
    } catch (error) {
      console.error('Error saving adaptations:', error);
    } finally {
      setSaving(false);
    }
  };

  const getAdaptationTypeColor = (type: string) => {
    const colors = {
      original: 'bg-blue-100 text-blue-800',
      combined: 'bg-purple-100 text-purple-800',
      reformulated: 'bg-green-100 text-green-800',
      generated: 'bg-orange-100 text-orange-800',
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const canManageQuestions = ['super_admin', 'company_admin'].includes(
    userRole
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Question Adaptation Tester
          </h1>
          <p className="text-gray-600">
            Test AI-driven question adaptation for different contexts and
            demographics
          </p>
        </div>
      </div>

      {/* Configuration Panel */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Settings className="w-5 h-5 text-blue-600" />
          Adaptation Configuration
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Categories Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categories to Adapt
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border border-gray-200 rounded-md p-3">
              {availableCategories.map((category) => {
                const checkboxId = `category-${category}`;
                return (
                  <div key={category} className="flex items-center gap-2">
                    <Checkbox
                      id={checkboxId}
                      checked={selectedCategories.includes(category)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedCategories([
                            ...selectedCategories,
                            category,
                          ]);
                        } else {
                          setSelectedCategories(
                            selectedCategories.filter((c) => c !== category)
                          );
                        }
                      }}
                    />
                    <Label
                      htmlFor={checkboxId}
                      className="text-sm cursor-pointer"
                    >
                      {category}
                    </Label>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Context Configuration */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Questions per Category
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={questionsPerCategory}
                onChange={(e) =>
                  setQuestionsPerCategory(parseInt(e.target.value))
                }
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Department Context
              </label>
              <select
                value={context.department || ''}
                onChange={(e) =>
                  setContext({ ...context, department: e.target.value })
                }
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="">Select Department</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role Context
              </label>
              <select
                value={context.role || ''}
                onChange={(e) =>
                  setContext({ ...context, role: e.target.value })
                }
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="">Select Role</option>
                {roles.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Survey Type
              </label>
              <select
                value={context.surveyType || 'general_climate'}
                onChange={(e) =>
                  setContext({ ...context, surveyType: e.target.value })
                }
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="general_climate">General Climate</option>
                <option value="microclimate">Microclimate</option>
                <option value="organizational_culture">
                  Organizational Culture
                </option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <Button
            onClick={handleAdaptQuestions}
            disabled={loading || selectedCategories.length === 0}
            className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Wand2 className="w-4 h-4" />
            )}
            {loading ? 'Adapting...' : 'Adapt Questions'}
          </Button>

          {canManageQuestions && adaptedQuestions.length > 0 && (
            <Button
              onClick={handleSaveAdaptations}
              disabled={saving}
              variant="outline"
              className="flex items-center gap-2"
            >
              {saving ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saving ? 'Saving...' : 'Save Adaptations'}
            </Button>
          )}
        </div>
      </Card>

      {/* Adaptation Summary */}
      {adaptationSummary && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-green-600" />
            Adaptation Summary
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {adaptationSummary.total_questions}
              </p>
              <p className="text-sm text-gray-600">Total Questions</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {(adaptationSummary.average_confidence * 100).toFixed(0)}%
              </p>
              <p className="text-sm text-gray-600">Avg Confidence</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {Object.keys(adaptationSummary.by_category).length}
              </p>
              <p className="text-sm text-gray-600">Categories</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">
                {Object.keys(adaptationSummary.by_type).length}
              </p>
              <p className="text-sm text-gray-600">Adaptation Types</p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">By Type</h4>
              <div className="space-y-1">
                {Object.entries(adaptationSummary.by_type).map(
                  ([type, count]) => (
                    <div key={type} className="flex justify-between">
                      <Badge className={getAdaptationTypeColor(type)}>
                        {type}
                      </Badge>
                      <span className="text-sm text-gray-600">
                        {count as number}
                      </span>
                    </div>
                  )
                )}
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">By Category</h4>
              <div className="space-y-1">
                {Object.entries(adaptationSummary.by_category).map(
                  ([category, count]) => (
                    <div key={category} className="flex justify-between">
                      <span className="text-sm text-gray-700">{category}</span>
                      <span className="text-sm text-gray-600">
                        {count as number}
                      </span>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Adapted Questions */}
      {adaptedQuestions.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Adapted Questions ({adaptedQuestions.length})
          </h3>

          {adaptedQuestions.map((question, index) => (
            <Card key={index} className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Badge
                    className={getAdaptationTypeColor(question.adaptationType)}
                  >
                    {question.adaptationType}
                  </Badge>
                  <Badge variant="outline">{question.category}</Badge>
                  {question.subcategory && (
                    <Badge variant="outline" className="text-xs">
                      {question.subcategory}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-gray-400" />
                  <span
                    className={`text-sm font-medium ${getConfidenceColor(question.confidence)}`}
                  >
                    {(question.confidence * 100).toFixed(0)}% confidence
                  </span>
                </div>
              </div>

              <p className="text-gray-900 font-medium mb-3">{question.text}</p>

              <div className="bg-gray-50 rounded-lg p-3 mb-3">
                <p className="text-sm text-gray-700">
                  <strong>Adaptation Reason:</strong>{' '}
                  {question.adaptationReason}
                </p>
                {question.sourceQuestions &&
                  question.sourceQuestions.length > 0 && (
                    <p className="text-sm text-gray-600 mt-1">
                      <strong>Source Questions:</strong>{' '}
                      {question.sourceQuestions.length} question(s)
                    </p>
                  )}
              </div>

              {question.scale_labels && (
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>
                    Scale: {question.scale_min} - {question.scale_max}
                  </span>
                  <span>
                    "{question.scale_labels.min}" to "
                    {question.scale_labels.max}"
                  </span>
                </div>
              )}

              {question.options && (
                <div className="mt-2">
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    Options:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {question.options.map((option, optIndex) => (
                      <Badge
                        key={optIndex}
                        variant="outline"
                        className="text-xs"
                      >
                        {option}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-1 mt-3">
                {question.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      {loading && (
        <Card className="p-8 text-center">
          <Loading />
          <p className="text-gray-600 mt-4">
            Adapting questions for your context...
          </p>
        </Card>
      )}

      {!loading &&
        adaptedQuestions.length === 0 &&
        selectedCategories.length > 0 && (
          <Card className="p-8 text-center">
            <Lightbulb className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">
              Click "Adapt Questions" to see AI-generated question adaptations
            </p>
          </Card>
        )}
    </div>
  );
}
