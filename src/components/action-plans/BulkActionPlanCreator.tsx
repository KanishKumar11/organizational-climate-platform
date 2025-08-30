'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { UserSelector } from './UserSelector';
import { TemplateSelector } from './TemplateSelector';
import { useAuth } from '@/hooks/useAuth';
import { motion } from 'framer-motion';
import { Zap, CheckCircle, AlertCircle, Users, Calendar } from 'lucide-react';

interface Insight {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  recommended_actions: string[];
  affected_departments: string[];
  confidence_score: number;
}

interface BulkActionPlanCreatorProps {
  insights: Insight[];
  surveyId: string;
  onSuccess?: (actionPlans: any[]) => void;
  onCancel?: () => void;
}

export function BulkActionPlanCreator({
  insights,
  surveyId,
  onSuccess,
  onCancel,
}: BulkActionPlanCreatorProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedInsights, setSelectedInsights] = useState<string[]>(
    insights.map((insight) => insight.id)
  );
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);

  const [formData, setFormData] = useState({
    default_due_date: '',
    default_assigned_to: [],
    auto_assign_by_department: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [results, setResults] = useState<{
    created_action_plans: any[];
    created_count: number;
    errors: string[];
  } | null>(null);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (selectedInsights.length === 0) {
      newErrors.insights = 'At least one insight must be selected';
    }

    if (!formData.default_due_date) {
      newErrors.default_due_date = 'Default due date is required';
    } else {
      const dueDate = new Date(formData.default_due_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (dueDate < today) {
        newErrors.default_due_date = 'Due date cannot be in the past';
      }
    }

    if (
      !formData.auto_assign_by_department &&
      formData.default_assigned_to.length === 0
    ) {
      newErrors.default_assigned_to =
        'Default assignees are required when auto-assignment is disabled';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const selectedInsightObjects = insights.filter((insight) =>
        selectedInsights.includes(insight.id)
      );

      const payload = {
        survey_id: surveyId,
        insights: selectedInsightObjects.map((insight) => ({
          ...insight,
          template_id: selectedTemplate?.id,
        })),
        default_due_date: formData.default_due_date,
        default_assigned_to: formData.default_assigned_to,
        auto_assign_by_department: formData.auto_assign_by_department,
      };

      const response = await fetch('/api/action-plans/bulk-create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create action plans');
      }

      const result = await response.json();
      setResults(result);

      if (result.created_count > 0) {
        onSuccess?.(result.created_action_plans);
      }
    } catch (error) {
      console.error('Error creating action plans:', error);
      setErrors({
        submit:
          error instanceof Error
            ? error.message
            : 'Failed to create action plans',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const toggleInsightSelection = (insightId: string) => {
    setSelectedInsights((prev) =>
      prev.includes(insightId)
        ? prev.filter((id) => id !== insightId)
        : [...prev, insightId]
    );
  };

  const selectAllInsights = () => {
    setSelectedInsights(insights.map((insight) => insight.id));
  };

  const deselectAllInsights = () => {
    setSelectedInsights([]);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (results) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto p-6"
      >
        <Card className="p-6">
          <div className="text-center mb-6">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Bulk Action Plans Created
            </h2>
            <p className="text-gray-600">
              Successfully created {results.created_count} action plan
              {results.created_count !== 1 ? 's' : ''}
              {results.errors.length > 0 &&
                ` with ${results.errors.length} error${results.errors.length !== 1 ? 's' : ''}`}
            </p>
          </div>

          {results.errors.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-red-900 mb-3">Errors:</h3>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <ul className="space-y-1">
                  {results.errors.map((error, index) => (
                    <li
                      key={index}
                      className="text-sm text-red-700 flex items-start"
                    >
                      <AlertCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                      {error}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <div className="flex justify-center">
            <Button onClick={onCancel}>Done</Button>
          </div>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto p-6"
    >
      <Card className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            <Zap className="w-6 h-6 inline mr-2 text-orange-600" />
            Bulk Create Action Plans
          </h2>
          <p className="text-gray-600">
            Create multiple action plans from AI insights with shared settings
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Template Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Apply Template to All (Optional)
            </label>
            <TemplateSelector
              onSelect={setSelectedTemplate}
              selected={selectedTemplate}
            />
          </div>

          {/* Default Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="default_due_date" className="text-sm font-medium">
                Default Due Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="default_due_date"
                type="date"
                value={formData.default_due_date}
                onChange={(e) =>
                  handleInputChange('default_due_date', e.target.value)
                }
                min={new Date().toISOString().split('T')[0]}
                className={errors.default_due_date ? 'border-red-500' : ''}
              />
              {errors.default_due_date && (
                <p className="text-sm text-red-500">
                  {errors.default_due_date}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Auto-assign by Department
              </Label>
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="auto_assign"
                  checked={formData.auto_assign_by_department}
                  onChange={(e) =>
                    handleInputChange(
                      'auto_assign_by_department',
                      e.target.checked
                    )
                  }
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="auto_assign" className="text-sm text-gray-700">
                  Automatically assign to department admins and leaders
                </label>
              </div>
            </div>
          </div>

          {!formData.auto_assign_by_department && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Default Assignees <span className="text-red-500">*</span>
              </Label>
              <UserSelector
                selectedUsers={formData.default_assigned_to}
                onChange={(users) =>
                  handleInputChange('default_assigned_to', users)
                }
                companyId={user?.companyId}
                placeholder="Select default assignees for all action plans"
              />
              {errors.default_assigned_to && (
                <p className="text-sm text-red-500">
                  {errors.default_assigned_to}
                </p>
              )}
            </div>
          )}

          {/* Insight Selection */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Select Insights ({selectedInsights.length} of {insights.length}{' '}
                selected)
              </label>
              <div className="flex space-x-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={selectAllInsights}
                >
                  Select All
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={deselectAllInsights}
                >
                  Deselect All
                </Button>
              </div>
            </div>

            {errors.insights && (
              <p className="text-red-600 text-sm mb-3">{errors.insights}</p>
            )}

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {insights.map((insight) => (
                <Card
                  key={insight.id}
                  className={`p-4 cursor-pointer transition-all ${
                    selectedInsights.includes(insight.id)
                      ? 'ring-2 ring-blue-500 bg-blue-50'
                      : 'hover:border-blue-300'
                  }`}
                  onClick={() => toggleInsightSelection(insight.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start flex-1">
                      <div
                        className={`w-5 h-5 rounded border-2 mr-3 mt-0.5 flex items-center justify-center ${
                          selectedInsights.includes(insight.id)
                            ? 'bg-blue-500 border-blue-500'
                            : 'border-gray-300'
                        }`}
                      >
                        {selectedInsights.includes(insight.id) && (
                          <div className="w-2 h-2 bg-white rounded-full" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 mb-1">
                          {insight.title}
                        </h4>
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                          {insight.description}
                        </p>
                        <div className="flex items-center space-x-3 text-xs">
                          <Badge className={getPriorityColor(insight.priority)}>
                            {insight.priority}
                          </Badge>
                          <div className="flex items-center text-gray-500">
                            <Users className="w-3 h-3 mr-1" />
                            {insight.affected_departments.length} dept
                            {insight.affected_departments.length !== 1
                              ? 's'
                              : ''}
                          </div>
                          <div className="text-gray-500">
                            {Math.round(insight.confidence_score * 100)}%
                            confidence
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Error Display */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700 text-sm">{errors.submit}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={loading}
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              disabled={loading || selectedInsights.length === 0}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {loading ? (
                <LoadingSpinner size="sm" />
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Create {selectedInsights.length} Action Plan
                  {selectedInsights.length !== 1 ? 's' : ''}
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>
    </motion.div>
  );
}
