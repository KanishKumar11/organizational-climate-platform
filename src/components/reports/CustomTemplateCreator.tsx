'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Loading } from '@/components/ui/Loading';
import {
  Save,
  X,
  Settings,
  FileText,
  BarChart3,
  TrendingUp,
  Users,
  Building,
} from 'lucide-react';

interface CustomTemplateCreatorProps {
  onSave: (template: any) => void;
  onCancel: () => void;
  initialTemplate?: any;
}

export default function CustomTemplateCreator({
  onSave,
  onCancel,
  initialTemplate,
}: CustomTemplateCreatorProps) {
  const [loading, setLoading] = useState(false);
  const [template, setTemplate] = useState({
    name: initialTemplate?.name || '',
    description: initialTemplate?.description || '',
    type: initialTemplate?.type || 'custom',
    config: initialTemplate?.config || {
      include_charts: true,
      include_raw_data: false,
      include_ai_insights: true,
      include_recommendations: true,
      chart_types: [],
      custom_sections: [],
    },
    default_filters: initialTemplate?.default_filters || {},
  });

  const reportTypes = [
    { value: 'survey_analysis', label: 'Survey Analysis', icon: BarChart3 },
    {
      value: 'department_comparison',
      label: 'Department Comparison',
      icon: Building,
    },
    { value: 'trend_analysis', label: 'Trend Analysis', icon: TrendingUp },
    {
      value: 'benchmark_comparison',
      label: 'Benchmark Comparison',
      icon: BarChart3,
    },
    { value: 'executive_summary', label: 'Executive Summary', icon: FileText },
    { value: 'custom', label: 'Custom Report', icon: Settings },
  ];

  const chartTypes = [
    { value: 'response_distribution', label: 'Response Distribution' },
    { value: 'department_comparison', label: 'Department Comparison' },
    { value: 'trend_analysis', label: 'Trend Analysis' },
    { value: 'sentiment_analysis', label: 'Sentiment Analysis' },
    { value: 'benchmark_comparison', label: 'Benchmark Comparison' },
    { value: 'gap_analysis', label: 'Gap Analysis' },
    { value: 'performance_matrix', label: 'Performance Matrix' },
  ];

  const customSections = [
    { value: 'executive_summary', label: 'Executive Summary' },
    { value: 'detailed_analysis', label: 'Detailed Analysis' },
    { value: 'recommendations', label: 'Recommendations' },
    { value: 'appendix', label: 'Appendix' },
    { value: 'methodology', label: 'Methodology' },
    { value: 'glossary', label: 'Glossary' },
  ];

  const handleSave = async () => {
    if (!template.name.trim()) {
      alert('Please enter a template name');
      return;
    }

    if (!template.type) {
      alert('Please select a report type');
      return;
    }

    setLoading(true);
    try {
      await onSave(template);
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Failed to save template. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChartTypeToggle = (chartType: string) => {
    setTemplate((prev) => ({
      ...prev,
      config: {
        ...prev.config,
        chart_types: prev.config.chart_types.includes(chartType)
          ? prev.config.chart_types.filter((type: string) => type !== chartType)
          : [...prev.config.chart_types, chartType],
      },
    }));
  };

  const handleCustomSectionToggle = (section: string) => {
    setTemplate((prev) => ({
      ...prev,
      config: {
        ...prev.config,
        custom_sections: prev.config.custom_sections.includes(section)
          ? prev.config.custom_sections.filter((s: string) => s !== section)
          : [...prev.config.custom_sections, section],
      },
    }));
  };

  if (loading) {
    return (
      <Card className="p-6">
        <Loading message="Saving template..." />
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            {initialTemplate ? 'Edit Template' : 'Create Custom Template'}
          </h2>
          <p className="text-gray-600 mt-1">
            Create a reusable report template with custom configuration
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Template
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card className="p-4">
          <h3 className="font-semibold mb-4">Basic Information</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Template Name *
              </label>
              <Input
                value={template.name}
                onChange={(e) =>
                  setTemplate((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Enter template name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Description
              </label>
              <textarea
                value={template.description}
                onChange={(e) =>
                  setTemplate((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Describe what this template is used for"
                className="w-full p-2 border border-gray-300 rounded-md resize-none"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Report Type *
              </label>
              <div className="grid grid-cols-2 gap-2">
                {reportTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <div
                      key={type.value}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        template.type === type.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() =>
                        setTemplate((prev) => ({ ...prev, type: type.value }))
                      }
                    >
                      <div className="flex items-center">
                        <Icon className="h-4 w-4 mr-2" />
                        <span className="text-sm font-medium">
                          {type.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </Card>

        {/* Configuration */}
        <Card className="p-4">
          <h3 className="font-semibold mb-4">Configuration</h3>
          <div className="space-y-4">
            {/* Basic Options */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Include in Report
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={template.config.include_charts}
                    onChange={(e) =>
                      setTemplate((prev) => ({
                        ...prev,
                        config: {
                          ...prev.config,
                          include_charts: e.target.checked,
                        },
                      }))
                    }
                    className="mr-2"
                  />
                  <span className="text-sm">Charts and Visualizations</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={template.config.include_raw_data}
                    onChange={(e) =>
                      setTemplate((prev) => ({
                        ...prev,
                        config: {
                          ...prev.config,
                          include_raw_data: e.target.checked,
                        },
                      }))
                    }
                    className="mr-2"
                  />
                  <span className="text-sm">Raw Data Tables</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={template.config.include_ai_insights}
                    onChange={(e) =>
                      setTemplate((prev) => ({
                        ...prev,
                        config: {
                          ...prev.config,
                          include_ai_insights: e.target.checked,
                        },
                      }))
                    }
                    className="mr-2"
                  />
                  <span className="text-sm">AI Insights</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={template.config.include_recommendations}
                    onChange={(e) =>
                      setTemplate((prev) => ({
                        ...prev,
                        config: {
                          ...prev.config,
                          include_recommendations: e.target.checked,
                        },
                      }))
                    }
                    className="mr-2"
                  />
                  <span className="text-sm">Recommendations</span>
                </label>
              </div>
            </div>

            {/* Chart Types */}
            {template.config.include_charts && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Chart Types
                </label>
                <div className="flex flex-wrap gap-2">
                  {chartTypes.map((chartType) => (
                    <Button
                      key={chartType.value}
                      variant={
                        template.config.chart_types.includes(chartType.value)
                          ? 'default'
                          : 'outline'
                      }
                      size="sm"
                      onClick={() => handleChartTypeToggle(chartType.value)}
                      className="text-xs"
                    >
                      {chartType.label}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Custom Sections */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Custom Sections
              </label>
              <div className="flex flex-wrap gap-2">
                {customSections.map((section) => (
                  <Button
                    key={section.value}
                    variant={
                      template.config.custom_sections.includes(section.value)
                        ? 'default'
                        : 'outline'
                    }
                    size="sm"
                    onClick={() => handleCustomSectionToggle(section.value)}
                    className="text-xs"
                  >
                    {section.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Preview */}
      <Card className="p-4">
        <h3 className="font-semibold mb-4">Template Preview</h3>
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium">
              {template.name || 'Untitled Template'}
            </h4>
            <Badge variant="secondary">
              {template.type.replace('_', ' ').toUpperCase()}
            </Badge>
          </div>
          {template.description && (
            <p className="text-sm text-gray-600 mb-3">{template.description}</p>
          )}
          <div className="space-y-2">
            <div className="flex items-center text-sm">
              <span className="font-medium mr-2">Includes:</span>
              <div className="flex flex-wrap gap-1">
                {template.config.include_charts && (
                  <Badge variant="outline" size="sm">
                    Charts
                  </Badge>
                )}
                {template.config.include_raw_data && (
                  <Badge variant="outline" size="sm">
                    Raw Data
                  </Badge>
                )}
                {template.config.include_ai_insights && (
                  <Badge variant="outline" size="sm">
                    AI Insights
                  </Badge>
                )}
                {template.config.include_recommendations && (
                  <Badge variant="outline" size="sm">
                    Recommendations
                  </Badge>
                )}
              </div>
            </div>
            {template.config.chart_types.length > 0 && (
              <div className="flex items-center text-sm">
                <span className="font-medium mr-2">Charts:</span>
                <span className="text-gray-600">
                  {template.config.chart_types.length} chart type(s) selected
                </span>
              </div>
            )}
            {template.config.custom_sections.length > 0 && (
              <div className="flex items-center text-sm">
                <span className="font-medium mr-2">Sections:</span>
                <span className="text-gray-600">
                  {template.config.custom_sections.length} custom section(s)
                </span>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
