'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Loading } from '@/components/ui/Loading';
import {
  Calendar,
  Filter,
  FileText,
  Download,
  Settings,
  Plus,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import AdvancedFilters from './AdvancedFilters';

interface FilterOption {
  id: string;
  name: string;
  type?: string;
  category?: string;
}

interface ReportFilters {
  time_filter?: {
    start_date: Date;
    end_date: Date;
  };
  demographic_filters?: Array<{
    field: string;
    values: string[];
  }>;
  department_filter?: {
    department_ids: string[];
    include_subdepartments?: boolean;
  };
  survey_types?: string[];
  survey_ids?: string[];
  benchmark_ids?: string[];
}

interface ReportConfig {
  include_charts: boolean;
  include_raw_data: boolean;
  include_ai_insights: boolean;
  include_recommendations: boolean;
  chart_types?: string[];
  custom_sections?: string[];
}

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: string;
  config: ReportConfig;
  default_filters?: ReportFilters;
  is_system_template: boolean;
}

interface ReportBuilderProps {
  onGenerate: (reportData: {
    title: string;
    description?: string;
    type: string;
    template_id?: string;
    filters: ReportFilters;
    config: ReportConfig;
    format: string;
    scheduled_for?: Date;
    is_recurring?: boolean;
    recurrence_pattern?: string;
    comparison_type?: 'department' | 'time_period' | 'benchmark';
  }) => void;
  onCancel: () => void;
}

export default function ReportBuilder({
  onGenerate,
  onCancel,
}: ReportBuilderProps) {
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [filterOptions, setFilterOptions] = useState<any>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedTemplate, setSelectedTemplate] =
    useState<ReportTemplate | null>(null);
  const [format, setFormat] = useState<'pdf' | 'excel' | 'csv' | 'json'>('pdf');
  const [filters, setFilters] = useState<ReportFilters>({});
  const [config, setConfig] = useState<ReportConfig>({
    include_charts: true,
    include_raw_data: false,
    include_ai_insights: true,
    include_recommendations: true,
  });

  // Additional form state
  const [comparisonType, setComparisonType] = useState<
    'department' | 'time_period' | 'benchmark' | ''
  >('');
  const [selectedChartTypes, setSelectedChartTypes] = useState<string[]>([]);

  // UI state
  const [expandedSections, setExpandedSections] = useState({
    filters: true,
    config: false,
    comparison: false,
    scheduling: false,
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [templatesRes, filtersRes] = await Promise.all([
        fetch('/api/reports/templates'),
        fetch('/api/reports/filters'),
      ]);

      if (templatesRes.ok) {
        const templatesData = await templatesRes.json();
        setTemplates(templatesData.templates);
      }

      if (filtersRes.ok) {
        const filtersData = await filtersRes.json();
        setFilterOptions(filtersData);
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateSelect = (template: ReportTemplate) => {
    setSelectedTemplate(template);
    setConfig(template.config);
    if (template.default_filters) {
      setFilters(template.default_filters);
    }
    if (!title) {
      setTitle(`${template.name} - ${new Date().toLocaleDateString()}`);
    }
  };

  const handleTimeFilterChange = (
    field: 'start_date' | 'end_date',
    value: string
  ) => {
    setFilters((prev) => ({
      ...prev,
      time_filter: {
        ...prev.time_filter,
        start_date: prev.time_filter?.start_date || new Date(),
        end_date: prev.time_filter?.end_date || new Date(),
        [field]: new Date(value),
      },
    }));
  };

  const addDemographicFilter = () => {
    setFilters((prev) => ({
      ...prev,
      demographic_filters: [
        ...(prev.demographic_filters || []),
        { field: '', values: [] },
      ],
    }));
  };

  const updateDemographicFilter = (
    index: number,
    field: string,
    values: string[]
  ) => {
    setFilters((prev) => ({
      ...prev,
      demographic_filters: prev.demographic_filters?.map((filter, i) =>
        i === index ? { field, values } : filter
      ),
    }));
  };

  const removeDemographicFilter = (index: number) => {
    setFilters((prev) => ({
      ...prev,
      demographic_filters: prev.demographic_filters?.filter(
        (_, i) => i !== index
      ),
    }));
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleChartTypeToggle = (chartType: string) => {
    setSelectedChartTypes((prev) => {
      if (prev.includes(chartType)) {
        return prev.filter((type) => type !== chartType);
      } else {
        return [...prev, chartType];
      }
    });

    // Update config with selected chart types
    setConfig((prev) => ({
      ...prev,
      chart_types: selectedChartTypes.includes(chartType)
        ? selectedChartTypes.filter((type) => type !== chartType)
        : [...selectedChartTypes, chartType],
    }));
  };

  const handleGenerate = () => {
    if (!title.trim()) {
      alert('Please enter a report title');
      return;
    }

    // Validate filters based on comparison type
    if (
      comparisonType === 'department' &&
      !filters.department_filter?.department_ids?.length
    ) {
      alert('Please select at least one department for department comparison');
      return;
    }

    if (comparisonType === 'benchmark' && !filters.benchmark_ids?.length) {
      alert('Please select at least one benchmark for benchmark comparison');
      return;
    }

    onGenerate({
      title: title.trim(),
      description: description.trim() || undefined,
      type: selectedTemplate?.type || 'custom',
      template_id: selectedTemplate?.id,
      filters,
      config: {
        ...config,
        chart_types:
          selectedChartTypes.length > 0
            ? selectedChartTypes
            : config.chart_types,
      },
      format,
      comparison_type: comparisonType || undefined,
    });
  };

  if (loading) {
    return (
      <Card className="p-6">
        <Loading message="Loading report builder..." />
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Create New Report</h2>
          <p className="text-gray-600 mt-1">
            Generate comprehensive analytics reports with custom filtering and
            formatting
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            onClick={handleGenerate}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <FileText className="h-4 w-4 mr-2" />
            Generate Report
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Template Selection */}
        <div className="lg:col-span-1">
          <Card className="p-4">
            <h3 className="font-semibold mb-4">Report Templates</h3>
            <div className="space-y-2">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedTemplate?.id === template.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleTemplateSelect(template)}
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{template.name}</h4>
                    {template.is_system_template && (
                      <Badge variant="secondary" size="sm">
                        System
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {template.description}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Main Configuration */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card className="p-4">
            <h3 className="font-semibold mb-4">Basic Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Report Title *
                </label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter report title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional description"
                  className="w-full p-2 border border-gray-300 rounded-md resize-none"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Export Format
                </label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value as any)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="pdf">PDF</option>
                  <option value="excel">Excel</option>
                  <option value="csv">CSV</option>
                  <option value="json">JSON</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Advanced Filters */}
          {expandedSections.filters && (
            <AdvancedFilters
              filters={filters}
              onFiltersChange={setFilters}
              filterOptions={filterOptions}
            />
          )}

          {/* Comparative Analysis */}
          <Card className="p-4">
            <div
              className="flex items-center justify-between cursor-pointer"
              onClick={() => toggleSection('comparison')}
            >
              <h3 className="font-semibold flex items-center">
                <Filter className="h-4 w-4 mr-2" />
                Comparative Analysis
              </h3>
              {expandedSections.comparison ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </div>

            {expandedSections.comparison && (
              <div className="mt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Comparison Type
                  </label>
                  <select
                    value={comparisonType}
                    onChange={(e) => setComparisonType(e.target.value as any)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="">No Comparison</option>
                    <option value="department">Department Comparison</option>
                    <option value="time_period">Time Period Analysis</option>
                    <option value="benchmark">Benchmark Comparison</option>
                  </select>
                  {comparisonType && (
                    <p className="text-xs text-gray-500 mt-1">
                      {comparisonType === 'department' &&
                        'Compare metrics across different departments'}
                      {comparisonType === 'time_period' &&
                        'Analyze trends and changes over time'}
                      {comparisonType === 'benchmark' &&
                        'Compare against industry and internal benchmarks'}
                    </p>
                  )}
                </div>

                {/* Chart Type Selection */}
                {filterOptions?.chart_types && (
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Chart Types
                    </label>
                    <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto">
                      {filterOptions.chart_types.map((chartType: any) => (
                        <label
                          key={chartType.value}
                          className="flex items-start"
                        >
                          <input
                            type="checkbox"
                            checked={selectedChartTypes.includes(
                              chartType.value
                            )}
                            onChange={() =>
                              handleChartTypeToggle(chartType.value)
                            }
                            className="mr-2 mt-1"
                          />
                          <div>
                            <span className="text-sm font-medium">
                              {chartType.label}
                            </span>
                            <p className="text-xs text-gray-500">
                              {chartType.description}
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* Configuration */}
          <Card className="p-4">
            <div
              className="flex items-center justify-between cursor-pointer"
              onClick={() => toggleSection('config')}
            >
              <h3 className="font-semibold flex items-center">
                <Settings className="h-4 w-4 mr-2" />
                Report Configuration
              </h3>
              {expandedSections.config ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </div>

            {expandedSections.config && (
              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={config.include_charts}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          include_charts: e.target.checked,
                        }))
                      }
                      className="mr-2"
                    />
                    <span className="text-sm">Include Charts</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={config.include_raw_data}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          include_raw_data: e.target.checked,
                        }))
                      }
                      className="mr-2"
                    />
                    <span className="text-sm">Include Raw Data</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={config.include_ai_insights}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          include_ai_insights: e.target.checked,
                        }))
                      }
                      className="mr-2"
                    />
                    <span className="text-sm">Include AI Insights</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={config.include_recommendations}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          include_recommendations: e.target.checked,
                        }))
                      }
                      className="mr-2"
                    />
                    <span className="text-sm">Include Recommendations</span>
                  </label>
                </div>

                {/* Custom Sections */}
                {config.custom_sections && (
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Custom Sections
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        'executive_summary',
                        'detailed_analysis',
                        'recommendations',
                        'appendix',
                      ].map((section) => (
                        <label key={section} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={
                              config.custom_sections?.includes(section) || false
                            }
                            onChange={(e) => {
                              if (e.target.checked) {
                                setConfig((prev) => ({
                                  ...prev,
                                  custom_sections: [
                                    ...(prev.custom_sections || []),
                                    section,
                                  ],
                                }));
                              } else {
                                setConfig((prev) => ({
                                  ...prev,
                                  custom_sections: prev.custom_sections?.filter(
                                    (s) => s !== section
                                  ),
                                }));
                              }
                            }}
                            className="mr-2"
                          />
                          <span className="text-sm capitalize">
                            {section.replace('_', ' ')}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
