'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Loading } from '@/components/ui/Loading';
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  Target,
  RefreshCw,
  Download,
} from 'lucide-react';

interface QuestionAnalyticsProps {
  category?: string;
  timeframe?: string;
}

interface AnalyticsData {
  overview: {
    totalQuestions: number;
    activeQuestions: number;
    utilizationRate: string;
  };
  effectiveness: {
    distribution: any[];
    categoryPerformance: any[];
    typeAnalysis: any[];
  };
  performance: {
    topQuestions: any[];
    underperformingQuestions: any[];
    recentActivity: any[];
  };
  insights: {
    aiVsHuman: any[];
    optimizationSuggestions: any[];
  };
}

export default function QuestionAnalytics({
  category,
  timeframe = '30',
}: QuestionAnalyticsProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState(timeframe);

  useEffect(() => {
    fetchAnalytics();
  }, [category, selectedTimeframe]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('timeframe', selectedTimeframe);
      if (category) params.append('category', category);

      const response = await fetch(`/api/question-bank/analytics?${params}`);
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getEffectivenessColor = (score: number) => {
    if (score >= 7) return 'text-green-600';
    if (score >= 5) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return <Loading />;
  }

  if (!analytics) {
    return (
      <Card className="p-8 text-center">
        <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">Failed to load analytics data</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            Question Bank Analytics
          </h2>
          <p className="text-gray-600 text-sm mt-1">
            Insights into question effectiveness and optimization opportunities
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
          <Button variant="outline" onClick={fetchAnalytics}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Total Questions
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics.overview.totalQuestions}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Active Questions
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics.overview.activeQuestions}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Utilization Rate
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics.overview.utilizationRate}%
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Target className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Category Performance */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Category Performance
        </h3>
        <div className="space-y-4">
          {analytics.effectiveness.categoryPerformance.map(
            (category, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{category._id}</h4>
                  <p className="text-sm text-gray-600">
                    {category.count} questions
                  </p>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="text-center">
                    <p className="text-gray-600">Effectiveness</p>
                    <p
                      className={`font-medium ${getEffectivenessColor(category.avgEffectiveness)}`}
                    >
                      {category.avgEffectiveness.toFixed(1)}/10
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-600">Usage</p>
                    <p className="font-medium text-gray-900">
                      {category.totalUsage}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-600">Response Rate</p>
                    <p className="font-medium text-gray-900">
                      {category.avgResponseRate.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      </Card>

      {/* Top Performing Questions */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Top Performing Questions
        </h3>
        <div className="space-y-3">
          {analytics.performance.topQuestions
            .slice(0, 5)
            .map((question, index) => (
              <div
                key={question._id}
                className="flex items-start gap-3 p-3 bg-green-50 rounded-lg"
              >
                <div className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="text-gray-900 font-medium">{question.text}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                    <span>Category: {question.category}</span>
                    <span className="text-green-600 font-medium">
                      Effectiveness: {question.metrics.insight_score.toFixed(1)}
                      /10
                    </span>
                    <span>Usage: {question.metrics.usage_count}</span>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </Card>

      {/* Optimization Suggestions */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-yellow-600" />
          Optimization Suggestions
        </h3>
        <div className="space-y-3">
          {analytics.insights.optimizationSuggestions.map(
            (suggestion, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg"
              >
                <div className="flex-shrink-0">
                  <Badge className={getPriorityColor(suggestion.priority)}>
                    {suggestion.priority}
                  </Badge>
                </div>
                <div className="flex-1">
                  <p className="text-gray-900 font-medium capitalize">
                    {suggestion.type.replace('_', ' ')}
                  </p>
                  <p className="text-gray-600 text-sm mt-1">
                    {suggestion.message}
                  </p>
                  {suggestion.actionable && (
                    <Button size="sm" variant="outline" className="mt-2">
                      Take Action
                    </Button>
                  )}
                </div>
              </div>
            )
          )}
        </div>
      </Card>

      {/* AI vs Human Comparison */}
      {analytics.insights.aiVsHuman.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            AI vs Human-Created Questions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {analytics.insights.aiVsHuman.map((comparison, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">
                  {comparison._id ? 'AI-Generated' : 'Human-Created'}
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Count:</span>
                    <span className="font-medium">{comparison.count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Avg Effectiveness:</span>
                    <span
                      className={`font-medium ${getEffectivenessColor(comparison.avgEffectiveness)}`}
                    >
                      {comparison.avgEffectiveness.toFixed(1)}/10
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Avg Usage:</span>
                    <span className="font-medium">
                      {comparison.avgUsage.toFixed(1)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Response Rate:</span>
                    <span className="font-medium">
                      {comparison.avgResponseRate.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Underperforming Questions */}
      {analytics.performance.underperformingQuestions.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            Questions Needing Attention
          </h3>
          <div className="space-y-3">
            {analytics.performance.underperformingQuestions
              .slice(0, 5)
              .map((question, index) => (
                <div
                  key={question._id}
                  className="flex items-start gap-3 p-3 bg-red-50 rounded-lg"
                >
                  <div className="flex-shrink-0 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                    !
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-900 font-medium">{question.text}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                      <span>Category: {question.category}</span>
                      <span className="text-red-600 font-medium">
                        Effectiveness:{' '}
                        {question.metrics.insight_score.toFixed(1)}/10
                      </span>
                      <span>Usage: {question.metrics.usage_count}</span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600 border-red-300"
                  >
                    Review
                  </Button>
                </div>
              ))}
          </div>
        </Card>
      )}
    </div>
  );
}
