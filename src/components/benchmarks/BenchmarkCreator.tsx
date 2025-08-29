'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { FormField } from '@/components/ui/FormField';
import { Badge } from '@/components/ui/Badge';
import { Loading } from '@/components/ui/Loading';

interface BenchmarkMetric {
  metric_name: string;
  value: number;
  unit: string;
  percentile?: number;
  sample_size?: number;
  confidence_interval?: {
    lower: number;
    upper: number;
  };
}

interface BenchmarkCreatorProps {
  onBenchmarkCreated?: (benchmark: any) => void;
  onCancel?: () => void;
}

export default function BenchmarkCreator({
  onBenchmarkCreated,
  onCancel,
}: BenchmarkCreatorProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'internal' as 'internal' | 'industry',
    category: '',
    source: '',
    industry: '',
    company_size: '',
    region: '',
  });

  const [metrics, setMetrics] = useState<BenchmarkMetric[]>([]);
  const [surveyIds, setSurveyIds] = useState<string[]>([]);
  const [availableSurveys, setAvailableSurveys] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoadingData(true);

      // Load available surveys for internal benchmarks
      const surveysResponse = await fetch('/api/surveys');
      if (surveysResponse.ok) {
        const surveysData = await surveysResponse.json();
        setAvailableSurveys(surveysData.surveys || []);
      }

      // Load existing categories
      const categoriesResponse = await fetch('/api/benchmarks/categories');
      if (categoriesResponse.ok) {
        const categoriesData = await categoriesResponse.json();
        setCategories(categoriesData.categories || []);
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const addMetric = () => {
    setMetrics((prev) => [
      ...prev,
      {
        metric_name: '',
        value: 0,
        unit: '',
        sample_size: 0,
      },
    ]);
  };

  const updateMetric = (index: number, field: string, value: any) => {
    setMetrics((prev) =>
      prev.map((metric, i) =>
        i === index ? { ...metric, [field]: value } : metric
      )
    );
  };

  const removeMetric = (index: number) => {
    setMetrics((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleSurveySelection = (surveyId: string) => {
    setSurveyIds((prev) =>
      prev.includes(surveyId)
        ? prev.filter((id) => id !== surveyId)
        : [...prev, surveyId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.description || !formData.category) {
      alert('Please fill in all required fields');
      return;
    }

    if (formData.type === 'internal' && surveyIds.length === 0) {
      alert('Please select at least one survey for internal benchmark');
      return;
    }

    if (formData.type === 'industry' && metrics.length === 0) {
      alert('Please add at least one metric for industry benchmark');
      return;
    }

    try {
      setLoading(true);

      const payload = {
        ...formData,
        metrics: formData.type === 'industry' ? metrics : undefined,
        survey_ids: formData.type === 'internal' ? surveyIds : undefined,
      };

      const response = await fetch('/api/benchmarks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create benchmark');
      }

      const data = await response.json();
      onBenchmarkCreated?.(data.benchmark);
    } catch (error) {
      console.error('Error creating benchmark:', error);
      alert(
        error instanceof Error ? error.message : 'Failed to create benchmark'
      );
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return <Loading message="Loading benchmark data..." />;
  }

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-6">Create New Benchmark</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Name" required>
            <Input
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter benchmark name"
            />
          </FormField>

          <FormField label="Type" required>
            <select
              value={formData.type}
              onChange={(e) => handleInputChange('type', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="internal">Internal</option>
              <option value="industry">Industry</option>
            </select>
          </FormField>
        </div>

        <FormField label="Description" required>
          <textarea
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Enter benchmark description"
            className="w-full p-2 border border-gray-300 rounded-md h-24"
          />
        </FormField>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Category" required>
            <Input
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
              placeholder="e.g., Employee Engagement, Culture"
              list="categories"
            />
            <datalist id="categories">
              {categories.map((category) => (
                <option key={category} value={category} />
              ))}
            </datalist>
          </FormField>

          <FormField label="Source">
            <Input
              value={formData.source}
              onChange={(e) => handleInputChange('source', e.target.value)}
              placeholder="Data source"
            />
          </FormField>
        </div>

        {/* Industry-specific fields */}
        {formData.type === 'industry' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField label="Industry">
              <Input
                value={formData.industry}
                onChange={(e) => handleInputChange('industry', e.target.value)}
                placeholder="e.g., Technology, Healthcare"
              />
            </FormField>

            <FormField label="Company Size">
              <select
                value={formData.company_size}
                onChange={(e) =>
                  handleInputChange('company_size', e.target.value)
                }
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="">Select size</option>
                <option value="startup">Startup (1-50)</option>
                <option value="small">Small (51-200)</option>
                <option value="medium">Medium (201-1000)</option>
                <option value="large">Large (1000+)</option>
              </select>
            </FormField>

            <FormField label="Region">
              <Input
                value={formData.region}
                onChange={(e) => handleInputChange('region', e.target.value)}
                placeholder="e.g., North America, Europe"
              />
            </FormField>
          </div>
        )}

        {/* Survey Selection for Internal Benchmarks */}
        {formData.type === 'internal' && (
          <div>
            <h3 className="text-lg font-semibold mb-3">
              Select Historical Surveys
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
              {availableSurveys.map((survey) => (
                <label
                  key={survey._id}
                  className="flex items-center space-x-2 p-2 border rounded"
                >
                  <input
                    type="checkbox"
                    checked={surveyIds.includes(survey._id)}
                    onChange={() => toggleSurveySelection(survey._id)}
                  />
                  <span className="text-sm">{survey.title}</span>
                  <Badge variant="outline" className="ml-auto">
                    {survey.status}
                  </Badge>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Metrics for Industry Benchmarks */}
        {formData.type === 'industry' && (
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold">Benchmark Metrics</h3>
              <Button type="button" onClick={addMetric} variant="outline">
                Add Metric
              </Button>
            </div>

            <div className="space-y-4">
              {metrics.map((metric, index) => (
                <Card key={index} className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <FormField label="Metric Name">
                      <Input
                        value={metric.metric_name}
                        onChange={(e) =>
                          updateMetric(index, 'metric_name', e.target.value)
                        }
                        placeholder="e.g., Engagement Rate"
                      />
                    </FormField>

                    <FormField label="Value">
                      <Input
                        type="number"
                        step="0.01"
                        value={metric.value}
                        onChange={(e) =>
                          updateMetric(
                            index,
                            'value',
                            parseFloat(e.target.value)
                          )
                        }
                        placeholder="0.00"
                      />
                    </FormField>

                    <FormField label="Unit">
                      <Input
                        value={metric.unit}
                        onChange={(e) =>
                          updateMetric(index, 'unit', e.target.value)
                        }
                        placeholder="e.g., percentage, scale_1_5"
                      />
                    </FormField>

                    <FormField label="Sample Size">
                      <Input
                        type="number"
                        value={metric.sample_size || ''}
                        onChange={(e) =>
                          updateMetric(
                            index,
                            'sample_size',
                            parseInt(e.target.value)
                          )
                        }
                        placeholder="0"
                      />
                    </FormField>
                  </div>

                  <div className="flex justify-end mt-2">
                    <Button
                      type="button"
                      onClick={() => removeMetric(index)}
                      variant="outline"
                      className="text-red-600 hover:text-red-800"
                    >
                      Remove
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4">
          {onCancel && (
            <Button type="button" onClick={onCancel} variant="outline">
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create Benchmark'}
          </Button>
        </div>
      </form>
    </Card>
  );
}
