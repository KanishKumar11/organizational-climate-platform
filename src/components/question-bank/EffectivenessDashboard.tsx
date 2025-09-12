'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loading } from '@/components/ui/Loading';
import { Progress } from '@/components/ui/Progress';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Target,
  TestTube,
  Lightbulb,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Download,
  Settings,
  Eye,
} from 'lucide-react';

interface EffectivenessMetrics {
  questionId: string;
  questionText: string;
  category: string;
  adaptationType: string;
  responseRate: number;
  completionRate: number;
  insightScore: number;
  engagementScore: number;
  relevanceScore: number;
  overallEffectiveness: number;
  sampleSize: number;
  confidenceInterval: number;
  trend: 'improving' | 'declining' | 'stable';
  recommendations: string[];
}

interface ABTestResult {
  testId: string;
  questionA: {
    id: string;
    text: string;
    metrics: EffectivenessMetrics;
  };
  questionB: {
    id: string;
    text: string;
    metrics: EffectivenessMetrics;
  };
  winner: 'A' | 'B' | 'tie';
  confidence: number;
  statisticalSignificance: boolean;
  sampleSizeA: number;
  sampleSizeB: number;
  testDuration: number;
  status: 'running' | 'completed' | 'paused';
}

interface ImprovementSuggestion {
  questionId: string;
  currentText: string;
  suggestedText: string;
  improvementType: 'clarity' | 'relevance' | 'engagement' | 'specificity';
  expectedImpact: number;
  confidence: number;
  reasoning: string;
  testRecommendation: boolean;
}

interface EffectivenessDashboardProps {
  userRole: string;
  companyId?: string;
}

export default function EffectivenessDashboard({
  userRole,
  companyId,
}: EffectivenessDashboardProps) {
  const [effectiveness, setEffectiveness] = useState<EffectivenessMetrics[]>(
    []
  );
  const [abTests, setAbTests] = useState<ABTestResult[]>([]);
  const [improvements, setImprovements] = useState<ImprovementSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [timeframe, setTimeframe] = useState(90);
  const [activeTab, setActiveTab] = useState<
    'effectiveness' | 'ab_tests' | 'improvements'
  >('effectiveness');

  const categories = [
    'Communication',
    'Collaboration',
    'Leadership',
    'Work Environment',
    'Job Satisfaction',
  ];

  useEffect(() => {
    fetchData();
  }, [selectedCategory, timeframe]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        timeframe: timeframe.toString(),
        limit: '20',
      });

      if (selectedCategory) {
        params.append('category', selectedCategory);
      }

      const [effectivenessResponse, abTestsResponse, improvementsResponse] =
        await Promise.all([
          fetch(`/api/question-bank/effectiveness-measurement?${params}`),
          fetch('/api/question-bank/ab-tests'),
          fetch('/api/question-bank/improvements'),
        ]);

      if (effectivenessResponse.ok) {
        const data = await effectivenessResponse.json();
        setEffectiveness(data.effectiveness);
      }

      // Note: These endpoints would need to be implemented
      if (abTestsResponse.ok) {
        const data = await abTestsResponse.json();
        setAbTests(data.tests || []);
      }

      if (improvementsResponse.ok) {
        const data = await improvementsResponse.json();
        setImprovements(data.suggestions || []);
      }
    } catch (error) {
      console.error('Error fetching effectiveness data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSetupABTest = async (questionId: string) => {
    try {
      const response = await fetch(
        '/api/question-bank/effectiveness-measurement',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'setup_ab_test',
            questionAId: questionId,
            questionBId: 'alternative_question_id', // This would come from a form
            testName: 'Effectiveness Test',
            targetSampleSize: 100,
          }),
        }
      );

      if (response.ok) {
        fetchData(); // Refresh data
      }
    } catch (error) {
      console.error('Error setting up A/B test:', error);
    }
  };

  const getEffectivenessColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'declining':
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      default:
        return <BarChart3 className="w-4 h-4 text-gray-600" />;
    }
  };

  const getImprovementTypeColor = (type: string) => {
    const colors = {
      clarity: 'bg-blue-100 text-blue-800',
      relevance: 'bg-green-100 text-green-800',
      engagement: 'bg-purple-100 text-purple-800',
      specificity: 'bg-orange-100 text-orange-800',
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const canManageQuestions = ['super_admin', 'company_admin'].includes(
    userRole
  );

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Question Effectiveness Dashboard
          </h1>
          <p className="text-gray-600">
            Measure and optimize question performance with A/B testing and
            improvement suggestions
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={fetchData}
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category Filter
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Timeframe
            </label>
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(parseInt(e.target.value))}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
              <option value={180}>Last 6 months</option>
              <option value={365}>Last year</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            {
              id: 'effectiveness',
              label: 'Effectiveness Metrics',
              icon: BarChart3,
            },
            { id: 'ab_tests', label: 'A/B Tests', icon: TestTube },
            {
              id: 'improvements',
              label: 'Improvement Suggestions',
              icon: Lightbulb,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Effectiveness Metrics Tab */}
      {activeTab === 'effectiveness' && (
        <div className="space-y-4">
          {effectiveness.map((metric) => (
            <Card key={metric.questionId} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline">{metric.category}</Badge>
                    <Badge
                      className={
                        metric.adaptationType === 'ai_generated'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-blue-100 text-blue-800'
                      }
                    >
                      {metric.adaptationType}
                    </Badge>
                    {getTrendIcon(metric.trend)}
                  </div>
                  <p className="text-gray-900 font-medium mb-2 line-clamp-2">
                    {metric.questionText}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <div className="text-right">
                    <p
                      className={`text-2xl font-bold ${getEffectivenessColor(metric.overallEffectiveness)}`}
                    >
                      {(metric.overallEffectiveness * 100).toFixed(0)}%
                    </p>
                    <p className="text-xs text-gray-500">Overall Score</p>
                  </div>
                </div>
              </div>

              {/* Detailed Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-600">Response Rate</p>
                  <div className="flex items-center gap-2">
                    <Progress
                      value={metric.responseRate * 100}
                      className="h-2 flex-1"
                    />
                    <span className="text-sm font-medium">
                      {(metric.responseRate * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Completion</p>
                  <div className="flex items-center gap-2">
                    <Progress
                      value={metric.completionRate * 100}
                      className="h-2 flex-1"
                    />
                    <span className="text-sm font-medium">
                      {(metric.completionRate * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Insights</p>
                  <div className="flex items-center gap-2">
                    <Progress
                      value={metric.insightScore * 100}
                      className="h-2 flex-1"
                    />
                    <span className="text-sm font-medium">
                      {(metric.insightScore * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Engagement</p>
                  <div className="flex items-center gap-2">
                    <Progress
                      value={metric.engagementScore * 100}
                      className="h-2 flex-1"
                    />
                    <span className="text-sm font-medium">
                      {(metric.engagementScore * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Relevance</p>
                  <div className="flex items-center gap-2">
                    <Progress
                      value={metric.relevanceScore * 100}
                      className="h-2 flex-1"
                    />
                    <span className="text-sm font-medium">
                      {(metric.relevanceScore * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Sample Size and Confidence */}
              <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                <span>Sample Size: {metric.sampleSize}</span>
                <span>
                  Confidence Interval: ±
                  {(metric.confidenceInterval * 100).toFixed(1)}%
                </span>
              </div>

              {/* Recommendations */}
              {metric.recommendations.length > 0 && (
                <div className="bg-yellow-50 rounded-lg p-3 mb-4">
                  <h4 className="font-medium text-yellow-900 mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Recommendations
                  </h4>
                  <ul className="text-sm text-yellow-800 space-y-1">
                    {metric.recommendations.map((rec, index) => (
                      <li key={index}>• {rec}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Actions */}
              {canManageQuestions && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSetupABTest(metric.questionId)}
                    className="flex items-center gap-2"
                  >
                    <TestTube className="w-4 h-4" />
                    A/B Test
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    View Details
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Settings className="w-4 h-4" />
                    Optimize
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* A/B Tests Tab */}
      {activeTab === 'ab_tests' && (
        <div className="space-y-4">
          {abTests.length === 0 ? (
            <Card className="p-8 text-center">
              <TestTube className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No A/B Tests Running
              </h3>
              <p className="text-gray-600 mb-4">
                Set up A/B tests to compare question variations and optimize
                effectiveness.
              </p>
              {canManageQuestions && (
                <Button className="bg-blue-600 hover:bg-blue-700">
                  Create A/B Test
                </Button>
              )}
            </Card>
          ) : (
            abTests.map((test) => (
              <Card key={test.testId} className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      A/B Test: {test.testId}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Running for {test.testDuration} days •{' '}
                      {test.sampleSizeA + test.sampleSizeB} participants
                    </p>
                  </div>
                  <Badge
                    className={
                      test.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : test.status === 'running'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                    }
                  >
                    {test.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Question A */}
                  <div
                    className={`p-4 rounded-lg border-2 ${
                      test.winner === 'A'
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">Question A</h4>
                      {test.winner === 'A' && (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      )}
                    </div>
                    <p className="text-sm text-gray-700 mb-3">
                      {test.questionA.text}
                    </p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Effectiveness:</span>
                        <span className="font-medium">
                          {(
                            test.questionA.metrics.overallEffectiveness * 100
                          ).toFixed(0)}
                          %
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Sample Size:</span>
                        <span className="font-medium">{test.sampleSizeA}</span>
                      </div>
                    </div>
                  </div>

                  {/* Question B */}
                  <div
                    className={`p-4 rounded-lg border-2 ${
                      test.winner === 'B'
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">Question B</h4>
                      {test.winner === 'B' && (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      )}
                    </div>
                    <p className="text-sm text-gray-700 mb-3">
                      {test.questionB.text}
                    </p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Effectiveness:</span>
                        <span className="font-medium">
                          {(
                            test.questionB.metrics.overallEffectiveness * 100
                          ).toFixed(0)}
                          %
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Sample Size:</span>
                        <span className="font-medium">{test.sampleSizeB}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {test.statisticalSignificance && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Result:</strong> Question {test.winner} is
                      statistically significantly better with{' '}
                      {(test.confidence * 100).toFixed(0)}% confidence.
                    </p>
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      )}

      {/* Improvement Suggestions Tab */}
      {activeTab === 'improvements' && (
        <div className="space-y-4">
          {improvements.length === 0 ? (
            <Card className="p-8 text-center">
              <Lightbulb className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Improvement Suggestions
              </h3>
              <p className="text-gray-600">
                Improvement suggestions will appear here based on question
                performance analysis.
              </p>
            </Card>
          ) : (
            improvements.map((suggestion, index) => (
              <Card key={index} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge
                        className={getImprovementTypeColor(
                          suggestion.improvementType
                        )}
                      >
                        {suggestion.improvementType}
                      </Badge>
                      <Badge variant="outline">
                        {(suggestion.expectedImpact * 100).toFixed(0)}% expected
                        impact
                      </Badge>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">
                      Question Improvement
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      {suggestion.reasoning}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Confidence</p>
                    <p className="text-lg font-bold text-blue-600">
                      {(suggestion.confidence * 100).toFixed(0)}%
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">
                      Current Question:
                    </h4>
                    <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                      {suggestion.currentText}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">
                      Suggested Improvement:
                    </h4>
                    <p className="text-gray-700 bg-green-50 p-3 rounded-lg border border-green-200">
                      {suggestion.suggestedText}
                    </p>
                  </div>
                </div>

                {canManageQuestions && (
                  <div className="flex gap-2 mt-4">
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Apply Suggestion
                    </Button>
                    {suggestion.testRecommendation && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex items-center gap-2"
                      >
                        <TestTube className="w-4 h-4" />
                        A/B Test
                      </Button>
                    )}
                    <Button size="sm" variant="outline">
                      Dismiss
                    </Button>
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
