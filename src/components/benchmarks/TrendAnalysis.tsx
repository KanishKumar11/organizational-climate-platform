'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { AnimatedLineChart } from '@/components/charts/AnimatedLineChart';

interface Survey {
  _id: string;
  title: string;
  created_at: string;
  status: string;
}

interface TrendAnalysis {
  metric_name: string;
  historical_values: Array<{
    date: string;
    value: number;
  }>;
  trend_direction: 'improving' | 'stable' | 'declining';
  trend_strength: number;
  forecast: Array<{
    date: string;
    predicted_value: number;
    confidence_interval: {
      lower: number;
      upper: number;
    };
  }>;
}

interface TrendAnalysisProps {
  onClose?: () => void;
}

export default function TrendAnalysisComponent({
  onClose,
}: TrendAnalysisProps) {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [selectedSurveys, setSelectedSurveys] = useState<string[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<string>('');
  const [trendAnalysis, setTrendAnalysis] = useState<TrendAnalysis | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  const availableMetrics = [
    'Engagement Rate',
    'Average Satisfaction Score',
    'Completion Rate',
    'Overall Engagement',
    'Manager Satisfaction',
    'Career Development Score',
    'Cultural Alignment',
    'Values Integration',
  ];

  useEffect(() => {
    loadSurveys();
  }, []);

  const loadSurveys = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/surveys');

      if (response.ok) {
        const data = await response.json();
        const completedSurveys =
          data.surveys?.filter((s: Survey) => s.status === 'completed') || [];
        setSurveys(completedSurveys);
      }
    } catch (error) {
      console.error('Error loading surveys:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSurveySelection = (surveyId: string) => {
    setSelectedSurveys((prev) =>
      prev.includes(surveyId)
        ? prev.filter((id) => id !== surveyId)
        : [...prev, surveyId]
    );
  };

  const handleAnalyzeTrends = async () => {
    if (selectedSurveys.length < 2 || !selectedMetric) {
      alert('Please select at least 2 surveys and a metric for trend analysis');
      return;
    }

    try {
      setAnalyzing(true);

      const response = await fetch('/api/benchmarks/trends', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          survey_ids: selectedSurveys,
          metric_name: selectedMetric,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze trends');
      }

      const data = await response.json();
      setTrendAnalysis(data.trend_analysis);
    } catch (error) {
      console.error('Error analyzing trends:', error);
      alert('Failed to analyze trends');
    } finally {
      setAnalyzing(false);
    }
  };

  const getTrendBadgeVariant = (direction: string) => {
    switch (direction) {
      case 'improving':
        return 'success';
      case 'stable':
        return 'secondary';
      case 'declining':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'improving':
        return '📈';
      case 'stable':
        return '➡️';
      case 'declining':
        return '📉';
      default:
        return '➡️';
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Trend Analysis</h1>
          <p className="text-gray-600 mt-1">
            Analyze metric trends over time and generate forecasts
          </p>
        </div>
        {onClose && (
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        )}
      </div>

      {/* Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Survey Selection */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Select Surveys</h2>
          <p className="text-sm text-gray-600 mb-4">
            Choose at least 2 completed surveys for trend analysis
          </p>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {surveys.map((survey) => (
              <label
                key={survey._id}
                className="flex items-center space-x-3 p-2 border rounded hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  checked={selectedSurveys.includes(survey._id)}
                  onChange={() => toggleSurveySelection(survey._id)}
                  className="rounded"
                />
                <div className="flex-1">
                  <p className="font-medium text-sm">{survey.title}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(survey.created_at).toLocaleDateString()}
                  </p>
                </div>
              </label>
            ))}
          </div>

          {surveys.length === 0 && (
            <p className="text-gray-500 text-center py-8">
              No completed surveys available
            </p>
          )}

          <div className="mt-4 text-sm text-gray-600">
            Selected: {selectedSurveys.length} surveys
          </div>
        </Card>

        {/* Metric Selection */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Select Metric</h2>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Metric to Analyze</Label>
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="">Choose a metric...</option>
              {availableMetrics.map((metric) => (
                <option key={metric} value={metric}>
                  {metric}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-6">
            <Button
              onClick={handleAnalyzeTrends}
              disabled={
                selectedSurveys.length < 2 || !selectedMetric || analyzing
              }
              className="w-full"
            >
              {analyzing ? 'Analyzing...' : 'Analyze Trends'}
            </Button>
          </div>
        </Card>
      </div>

      {/* Results */}
      {trendAnalysis && (
        <div className="space-y-6">
          {/* Trend Summary */}
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                Trend Summary: {trendAnalysis.metric_name}
              </h2>
              <div className="flex items-center space-x-2">
                <span className="text-2xl">
                  {getTrendIcon(trendAnalysis.trend_direction)}
                </span>
                <Badge
                  variant={getTrendBadgeVariant(trendAnalysis.trend_direction)}
                >
                  {trendAnalysis.trend_direction}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {(trendAnalysis.trend_strength * 100).toFixed(1)}%
                </p>
                <p className="text-sm text-gray-600">Trend Strength</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {trendAnalysis.historical_values.length}
                </p>
                <p className="text-sm text-gray-600">Data Points</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">
                  {trendAnalysis.forecast.length}
                </p>
                <p className="text-sm text-gray-600">Forecast Months</p>
              </div>
            </div>
          </Card>

          {/* Historical Chart */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Historical Trend</h3>
            <AnimatedLineChart
              data={trendAnalysis.historical_values.map((point) => ({
                date: new Date(point.date).toLocaleDateString(),
                value: point.value,
              }))}
              xKey="date"
              yKeys={['value']}
              colors={['#3B82F6']}
              height={300}
            />
          </Card>

          {/* Forecast Chart */}
          {trendAnalysis.forecast.length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Forecast</h3>
              <AnimatedLineChart
                data={trendAnalysis.forecast.map((point) => ({
                  date: new Date(point.date).toLocaleDateString(),
                  predicted: point.predicted_value,
                  lower: point.confidence_interval.lower,
                  upper: point.confidence_interval.upper,
                }))}
                xKey="date"
                yKeys={['predicted', 'lower', 'upper']}
                colors={['#10B981', '#F59E0B', '#F59E0B']}
                height={300}
              />

              <div className="mt-4 text-sm text-gray-600">
                <p>• Green line: Predicted values</p>
                <p>• Yellow lines: Confidence interval (90%)</p>
              </div>
            </Card>
          )}

          {/* Historical Data Table */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Historical Data</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Date</th>
                    <th className="text-right py-2">Value</th>
                    <th className="text-right py-2">Change</th>
                  </tr>
                </thead>
                <tbody>
                  {trendAnalysis.historical_values.map((point, index) => {
                    const prevValue =
                      index > 0
                        ? trendAnalysis.historical_values[index - 1].value
                        : null;
                    const change = prevValue ? point.value - prevValue : null;
                    const changePercent = prevValue
                      ? (change! / prevValue) * 100
                      : null;

                    return (
                      <tr key={index} className="border-b">
                        <td className="py-2">
                          {new Date(point.date).toLocaleDateString()}
                        </td>
                        <td className="text-right py-2">
                          {point.value.toFixed(2)}
                        </td>
                        <td className="text-right py-2">
                          {change !== null ? (
                            <span
                              className={
                                change >= 0 ? 'text-green-600' : 'text-red-600'
                              }
                            >
                              {change >= 0 ? '+' : ''}
                              {change.toFixed(2)} ({changePercent!.toFixed(1)}%)
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
