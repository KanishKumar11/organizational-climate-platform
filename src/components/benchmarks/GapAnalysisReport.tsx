'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { AnimatedBarChart } from '@/components/charts/AnimatedBarChart';
import { KPIDisplay } from '@/components/charts/KPIDisplay';

interface ComparisonResult {
  metric_name: string;
  current_value: number;
  benchmark_value: number;
  gap: number;
  gap_percentage: number;
  performance_level: 'above' | 'at' | 'below';
  significance: 'high' | 'medium' | 'low';
  unit: string;
}

interface GapAnalysis {
  overall_score: number;
  total_metrics: number;
  above_benchmark: number;
  at_benchmark: number;
  below_benchmark: number;
  critical_gaps: ComparisonResult[];
  improvement_opportunities: ComparisonResult[];
  strengths: ComparisonResult[];
  comparison_results: ComparisonResult[];
  benchmark_info: {
    id: string;
    name: string;
    type: string;
    category: string;
  };
}

interface StrategicRecommendation {
  priority: 'high' | 'medium' | 'low';
  focus_area: string;
  gap_size: number;
  recommended_actions: string[];
  expected_impact: string;
  timeline: string;
  resources_required: string[];
}

interface GapAnalysisReportProps {
  surveyId: string;
  benchmarkId: string;
  onClose?: () => void;
}

export default function GapAnalysisReport({
  surveyId,
  benchmarkId,
  onClose,
}: GapAnalysisReportProps) {
  const [gapAnalysis, setGapAnalysis] = useState<GapAnalysis | null>(null);
  const [recommendations, setRecommendations] = useState<
    StrategicRecommendation[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    'overview' | 'details' | 'recommendations'
  >('overview');

  useEffect(() => {
    loadGapAnalysis();
  }, [surveyId, benchmarkId]);

  const loadGapAnalysis = async () => {
    try {
      setLoading(true);

      // Load gap analysis
      const gapResponse = await fetch('/api/benchmarks/compare', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          survey_id: surveyId,
          benchmark_id: benchmarkId,
        }),
      });

      if (!gapResponse.ok) {
        throw new Error('Failed to load gap analysis');
      }

      const gapData = await gapResponse.json();
      setGapAnalysis(gapData.gap_analysis);

      // Load recommendations
      const recResponse = await fetch('/api/benchmarks/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gap_analysis: gapData.gap_analysis,
        }),
      });

      if (recResponse.ok) {
        const recData = await recResponse.json();
        setRecommendations(recData.recommendations || []);
      }
    } catch (error) {
      console.error('Error loading gap analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPerformanceBadgeVariant = (level: string) => {
    switch (level) {
      case 'above':
        return 'success';
      case 'at':
        return 'secondary';
      case 'below':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getSignificanceBadgeVariant = (significance: string) => {
    switch (significance) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'warning';
      case 'low':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'warning';
      case 'low':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const formatValue = (value: number, unit: string) => {
    if (unit === 'percentage') {
      return `${value.toFixed(1)}%`;
    } else if (unit.startsWith('scale_')) {
      return value.toFixed(2);
    }
    return value.toFixed(2);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!gapAnalysis) {
    return (
      <Card className="p-8 text-center">
        <p className="text-red-600">Failed to load gap analysis</p>
        {onClose && (
          <Button onClick={onClose} className="mt-4">
            Close
          </Button>
        )}
      </Card>
    );
  }

  const chartData = gapAnalysis.comparison_results.map((result) => ({
    name: result.metric_name,
    current: result.current_value,
    benchmark: result.benchmark_value,
    gap: result.gap_percentage,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gap Analysis Report</h1>
          <p className="text-gray-600 mt-1">
            Comparison with: {gapAnalysis.benchmark_info.name}
          </p>
        </div>
        {onClose && (
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'details', label: 'Detailed Analysis' },
            { id: 'recommendations', label: 'Recommendations' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* KPI Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <KPIDisplay
              title="Overall Score"
              value={gapAnalysis.overall_score}
              suffix="%"
              trend={
                gapAnalysis.overall_score >= 75
                  ? 'up'
                  : gapAnalysis.overall_score >= 50
                    ? 'stable'
                    : 'down'
              }
              color={
                gapAnalysis.overall_score >= 75
                  ? 'green'
                  : gapAnalysis.overall_score >= 50
                    ? 'orange'
                    : 'purple'
              }
            />
            <KPIDisplay
              title="Above Benchmark"
              value={gapAnalysis.above_benchmark}
              suffix=" metrics"
              trend="up"
              color="green"
            />
            <KPIDisplay
              title="At Benchmark"
              value={gapAnalysis.at_benchmark}
              suffix=" metrics"
              trend="stable"
              color="blue"
            />
            <KPIDisplay
              title="Below Benchmark"
              value={gapAnalysis.below_benchmark}
              suffix=" metrics"
              trend="down"
              color="purple"
            />
          </div>

          {/* Performance Chart */}
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4">
              Performance Comparison
            </h3>
            <AnimatedBarChart
              data={chartData}
              xKey="name"
              yKeys={['current', 'benchmark']}
              colors={['#3B82F6', '#10B981']}
              height={400}
            />
          </Card>

          {/* Critical Issues */}
          {gapAnalysis.critical_gaps.length > 0 && (
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4 text-red-600">
                Critical Gaps
              </h3>
              <div className="space-y-4">
                {gapAnalysis.critical_gaps.map((gap, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center p-4 bg-red-50 rounded-lg"
                  >
                    <div>
                      <h4 className="font-medium">{gap.metric_name}</h4>
                      <p className="text-sm text-gray-600">
                        Current: {formatValue(gap.current_value, gap.unit)} |
                        Benchmark: {formatValue(gap.benchmark_value, gap.unit)}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant="destructive">
                        {gap.gap_percentage.toFixed(1)}% below
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Strengths */}
          {gapAnalysis.strengths.length > 0 && (
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4 text-green-600">
                Strengths
              </h3>
              <div className="space-y-4">
                {gapAnalysis.strengths.map((strength, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center p-4 bg-green-50 rounded-lg"
                  >
                    <div>
                      <h4 className="font-medium">{strength.metric_name}</h4>
                      <p className="text-sm text-gray-600">
                        Current:{' '}
                        {formatValue(strength.current_value, strength.unit)} |
                        Benchmark:{' '}
                        {formatValue(strength.benchmark_value, strength.unit)}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant="success">
                        {strength.gap_percentage.toFixed(1)}% above
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Details Tab */}
      {activeTab === 'details' && (
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4">
              Detailed Comparison Results
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Metric</th>
                    <th className="text-right py-2">Current</th>
                    <th className="text-right py-2">Benchmark</th>
                    <th className="text-right py-2">Gap</th>
                    <th className="text-center py-2">Performance</th>
                    <th className="text-center py-2">Significance</th>
                  </tr>
                </thead>
                <tbody>
                  {gapAnalysis.comparison_results.map((result, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-3 font-medium">{result.metric_name}</td>
                      <td className="text-right py-3">
                        {formatValue(result.current_value, result.unit)}
                      </td>
                      <td className="text-right py-3">
                        {formatValue(result.benchmark_value, result.unit)}
                      </td>
                      <td className="text-right py-3">
                        <span
                          className={
                            result.gap >= 0 ? 'text-green-600' : 'text-red-600'
                          }
                        >
                          {result.gap_percentage.toFixed(1)}%
                        </span>
                      </td>
                      <td className="text-center py-3">
                        <Badge
                          variant={getPerformanceBadgeVariant(
                            result.performance_level
                          )}
                        >
                          {result.performance_level}
                        </Badge>
                      </td>
                      <td className="text-center py-3">
                        <Badge
                          variant={getSignificanceBadgeVariant(
                            result.significance
                          )}
                        >
                          {result.significance}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Recommendations Tab */}
      {activeTab === 'recommendations' && (
        <div className="space-y-6">
          {recommendations.length > 0 ? (
            recommendations.map((rec, index) => (
              <Card key={index} className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold">{rec.focus_area}</h3>
                    <p className="text-gray-600">
                      Gap size: {rec.gap_size.toFixed(1)}%
                    </p>
                  </div>
                  <Badge variant={getPriorityBadgeVariant(rec.priority)}>
                    {rec.priority} priority
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-2">Recommended Actions</h4>
                    <ul className="space-y-1">
                      {rec.recommended_actions.map((action, actionIndex) => (
                        <li
                          key={actionIndex}
                          className="text-sm text-gray-600 flex items-start"
                        >
                          <span className="text-blue-500 mr-2">•</span>
                          {action}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Implementation Details</h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium">Expected Impact:</span>{' '}
                        {rec.expected_impact}
                      </div>
                      <div>
                        <span className="font-medium">Timeline:</span>{' '}
                        {rec.timeline}
                      </div>
                      <div>
                        <span className="font-medium">Resources Required:</span>
                        <ul className="mt-1 ml-4">
                          {rec.resources_required.map(
                            (resource, resourceIndex) => (
                              <li key={resourceIndex} className="text-gray-600">
                                • {resource}
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <Card className="p-8 text-center">
              <p className="text-gray-500">
                No specific recommendations available at this time.
              </p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
