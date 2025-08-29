'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
// FormField and Loading components removed - not implemented
import { KPIEditor } from './KPIEditor';
import { QualitativeObjectiveEditor } from './QualitativeObjectiveEditor';
import { TemplateSelector } from './TemplateSelector';
import { UserSelector } from './UserSelector';
import { useAuth } from '@/hooks/useAuth';
import { motion } from 'framer-motion';

interface ActionPlanCreatorProps {
  onSuccess?: (actionPlan: any) => void;
  onCancel?: () => void;
  initialData?: any;
  sourceInsight?: any;
  sourceSurvey?: any;
}

export function ActionPlanCreator({
  onSuccess,
  onCancel,
  initialData,
  sourceInsight,
  sourceSurvey,
}: ActionPlanCreatorProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);

  const [formData, setFormData] = useState({
    title: initialData?.title || sourceInsight?.title || '',
    description: initialData?.description || sourceInsight?.description || '',
    assigned_to: initialData?.assigned_to || [],
    due_date: initialData?.due_date || '',
    priority: initialData?.priority || 'medium',
    kpis: initialData?.kpis || [],
    qualitative_objectives: initialData?.qualitative_objectives || [],
    ai_recommendations:
      initialData?.ai_recommendations ||
      sourceInsight?.recommended_actions ||
      [],
    tags: initialData?.tags || [],
    department_id: initialData?.department_id || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Apply template when selected
  useEffect(() => {
    if (selectedTemplate) {
      setFormData((prev) => ({
        ...prev,
        kpis: selectedTemplate.kpi_templates.map((kpi: any) => ({
          ...kpi,
          id: crypto.randomUUID(),
          current_value: 0,
        })),
        qualitative_objectives:
          selectedTemplate.qualitative_objective_templates.map((obj: any) => ({
            ...obj,
            id: crypto.randomUUID(),
            current_status: '',
            completion_percentage: 0,
          })),
        ai_recommendations: [
          ...formData.ai_recommendations,
          ...selectedTemplate.ai_recommendation_templates,
        ],
      }));
    }
  }, [selectedTemplate]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (formData.assigned_to.length === 0) {
      newErrors.assigned_to = 'At least one person must be assigned';
    }

    if (!formData.due_date) {
      newErrors.due_date = 'Due date is required';
    } else {
      const dueDate = new Date(formData.due_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (dueDate < today) {
        newErrors.due_date = 'Due date cannot be in the past';
      }
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
      const payload = {
        ...formData,
        template_id: selectedTemplate?.id,
        source_survey_id: sourceSurvey?.id,
        source_insight_id: sourceInsight?.id,
      };

      const response = await fetch('/api/action-plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create action plan');
      }

      const result = await response.json();
      onSuccess?.(result.action_plan);
    } catch (error) {
      console.error('Error creating action plan:', error);
      setErrors({
        submit:
          error instanceof Error
            ? error.message
            : 'Failed to create action plan',
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

  const addTag = (tag: string) => {
    if (tag && !formData.tags.includes(tag)) {
      handleInputChange('tags', [...formData.tags, tag]);
    }
  };

  const removeTag = (tagToRemove: string) => {
    handleInputChange(
      'tags',
      formData.tags.filter((tag) => tag !== tagToRemove)
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto p-6"
    >
      <Card className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Create Action Plan
          </h2>
          {sourceInsight && (
            <div className="text-sm text-gray-600 mb-4">
              <Badge variant="outline" className="mr-2">
                From AI Insight
              </Badge>
              {sourceInsight.title}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Template Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Use Template (Optional)
            </label>
            <TemplateSelector
              onSelect={setSelectedTemplate}
              selected={selectedTemplate}
            />
          </div>

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField label="Title" error={errors.title} required>
              <Input
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Enter action plan title"
                className={errors.title ? 'border-red-500' : ''}
              />
            </FormField>

            <FormField label="Priority" error={errors.priority}>
              <select
                value={formData.priority}
                onChange={(e) => handleInputChange('priority', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </FormField>
          </div>

          <FormField label="Description" error={errors.description} required>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe the action plan objectives and approach"
              rows={4}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.description ? 'border-red-500' : ''
              }`}
            />
          </FormField>

          {/* Assignment and Timeline */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField label="Assign To" error={errors.assigned_to} required>
              <UserSelector
                selectedUsers={formData.assigned_to}
                onChange={(users) => handleInputChange('assigned_to', users)}
                companyId={user?.company_id}
                departmentId={formData.department_id}
              />
            </FormField>

            <FormField label="Due Date" error={errors.due_date} required>
              <Input
                type="date"
                value={formData.due_date}
                onChange={(e) => handleInputChange('due_date', e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className={errors.due_date ? 'border-red-500' : ''}
              />
            </FormField>
          </div>

          {/* KPIs */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Key Performance Indicators (KPIs)
            </label>
            <KPIEditor
              kpis={formData.kpis}
              onChange={(kpis) => handleInputChange('kpis', kpis)}
            />
          </div>

          {/* Qualitative Objectives */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Qualitative Objectives
            </label>
            <QualitativeObjectiveEditor
              objectives={formData.qualitative_objectives}
              onChange={(objectives) =>
                handleInputChange('qualitative_objectives', objectives)
              }
            />
          </div>

          {/* AI Recommendations */}
          {formData.ai_recommendations.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                AI Recommendations
              </label>
              <div className="bg-violet-50 border border-violet-200 rounded-lg p-4">
                <ul className="space-y-2">
                  {formData.ai_recommendations.map((recommendation, index) => (
                    <li key={index} className="flex items-start">
                      <div className="w-2 h-2 bg-violet-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                      <span className="text-sm text-gray-700">
                        {recommendation}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="cursor-pointer"
                  onClick={() => removeTag(tag)}
                >
                  {tag} ×
                </Badge>
              ))}
            </div>
            <Input
              placeholder="Add tags (press Enter)"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  const input = e.target as HTMLInputElement;
                  addTag(input.value.trim());
                  input.value = '';
                }
              }}
            />
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
              disabled={loading}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {loading ? <Loading size="sm" /> : 'Create Action Plan'}
            </Button>
          </div>
        </form>
      </Card>
    </motion.div>
  );
}
