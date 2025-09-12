'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/Progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Brain,
  Target,
  Users,
  Lightbulb,
} from 'lucide-react';

interface EffectivenessMetrics {
  questionId: string;
  adaptationId?: string;
  responseRate: number;
  completionRate: number;
  insightQuality: number;
  actionPlanGeneration: number;
  engagementMetrics: {
    averageTimeSpent: number;
    skipRate: number;
    clarificationRequests: number;
  };
  sentimentDistribution: {
    positive: number;
    neutral: number;
    negative: number;
  };
}

interface EffectivenessAnalysis {
  overallScore: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  trendAnalysis: {
    direction: 'improving' | 'declining' | 'stable';
    changeRate: number;
    confidence: number;
  };
}

interface AdaptiveQuestionAnalyticsProps {
  companyId: string;
  departmentId?: string;
}

export default function AdaptiveQuestionAnalytics({
  companyId,
  departmentId,
}: AdaptiveQuestionAnalyticsProps) {
  const [effectivenessData, setEffectivenessData] = useState<any>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<string>('');
  const [timeRange, setTimeRange] = useState<string>('30d');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEffectivenessData();
  }, [companyId, departmentId, timeRange]);

  const fetchEffectivenessData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        companyId,
        timeRange,
        limit: '20',
      });

      if (departmentId) params.append('departmentId', departmentId);
      if (selectedQuestion) params.append('questionId', selectedQuestion);

      const response = await fetch(
        `/api/question-pool/effectiveness?${params}`
      );
      if (!response.ok) throw new Error('Failed to fetch effectiveness data');

      const data = await response.json();
      setEffectivenessData(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'improving':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'declining':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const COLORS = ['#10B981', '#F59E0B', '#EF4444'];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p>Error loading analytics: {error}</p>
            <Button onClick={fetchEffectivenessData} className="mt-4">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Question Pool Analytics
          </h2>
          <p className="text-gray-600">
            AI-driven question effectiveness and adaptation insights
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Overview Metrics */}
      {effectivenessData?.overallStatistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Questions
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {effectivenessData.overallStatistics.uniqueQuestions}
                  </p>
                </div>
                <Brain className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Avg Response Rate
                  </p>
                  <p
                    className={`text-2xl font-bold ${getScoreColor(effectivenessData.overallStatistics.averageResponseRate)}`}
                  >
                    {effectivenessData.overallStatistics.averageResponseRate.toFixed(
                      1
                    )}
                    %
                  </p>
                </div>
                <Users className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Insight Quality
                  </p>
                  <p
                    className={`text-2xl font-bold ${getScoreColor(effectivenessData.overallStatistics.averageInsightQuality)}`}
                  >
                    {effectivenessData.overallStatistics.averageInsightQuality.toFixed(
                      1
                    )}
                    %
                  </p>
                </div>
                <Lightbulb className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Action Plans
                  </p>
                  <p
                    className={`text-2xl font-bold ${getScoreColor(effectivenessData.overallStatistics.averageActionPlanGeneration)}`}
                  >
                    {effectivenessData.overallStatistics.averageActionPlanGeneration.toFixed(
                      1
                    )}
                    %
                  </p>
                </div>
                <Target className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="top-performers">Top Performers</TabsTrigger>
          <TabsTrigger value="adaptations">Adaptations</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Effectiveness Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Question Effectiveness Distribution</CardTitle>
                <CardDescription>
                  Distribution of questions by effectiveness score ranges
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={[
                      { range: '90-100%', count: 15, color: '#10B981' },
                      { range: '80-89%', count: 25, color: '#059669' },
                      { range: '70-79%', count: 30, color: '#F59E0B' },
                      { range: '60-69%', count: 20, color: '#D97706' },
                      { range: '<60%', count: 10, color: '#EF4444' },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="range" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Adaptation Types */}
            <Card>
              <CardHeader>
                <CardTitle>Question Adaptation Types</CardTitle>
                <CardDescription>
                  Breakdown of AI-driven question adaptations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Original', value: 60, color: '#3B82F6' },
                        { name: 'Combined', value: 20, color: '#10B981' },
                        { name: 'Reformulated', value: 15, color: '#F59E0B' },
                        { name: 'Generated', value: 5, color: '#8B5CF6' },
                      ]}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="value"
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {[
                        { name: 'Original', value: 60, color: '#3B82F6' },
                        { name: 'Combined', value: 20, color: '#10B981' },
                        { name: 'Reformulated', value: 15, color: '#F59E0B' },
                        { name: 'Generated', value: 5, color: '#8B5CF6' },
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Category Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Performance by Category</CardTitle>
              <CardDescription>
                Average effectiveness scores across question categories
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart
                  data={[
                    {
                      category: 'Leadership',
                      effectiveness: 85,
                      responseRate: 78,
                      insightQuality: 82,
                    },
                    {
                      category: 'Communication',
                      effectiveness: 82,
                      responseRate: 85,
                      insightQuality: 79,
                    },
                    {
                      category: 'Collaboration',
                      effectiveness: 88,
                      responseRate: 82,
                      insightQuality: 85,
                    },
                    {
                      category: 'Innovation',
                      effectiveness: 75,
                      responseRate: 70,
                      insightQuality: 80,
                    },
                    {
                      category: 'Work-Life Balance',
                      effectiveness: 90,
                      responseRate: 88,
                      insightQuality: 87,
                    },
                    {
                      category: 'Recognition',
                      effectiveness: 83,
                      responseRate: 80,
                      insightQuality: 78,
                    },
                    {
                      category: 'Development',
                      effectiveness: 86,
                      responseRate: 83,
                      insightQuality: 84,
                    },
                    {
                      category: 'Trust',
                      effectiveness: 89,
                      responseRate: 85,
                      insightQuality: 88,
                    },
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="category"
                    angle={-45}
                    textAnchor="end"
                    height={100}
                  />
                  <YAxis />
                  <Tooltip />
                  <Bar
                    dataKey="effectiveness"
                    fill="#3B82F6"
                    name="Overall Effectiveness"
                  />
                  <Bar
                    dataKey="responseRate"
                    fill="#10B981"
                    name="Response Rate"
                  />
                  <Bar
                    dataKey="insightQuality"
                    fill="#F59E0B"
                    name="Insight Quality"
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="top-performers" className="space-y-4">
          {effectivenessData?.topPerformingQuestions && (
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Questions</CardTitle>
                <CardDescription>
                  Questions with highest effectiveness scores in the selected
                  time period
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {effectivenessData.topPerformingQuestions.map(
                    (question: any, index: number) => (
                      <div
                        key={question.questionId}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline">#{index + 1}</Badge>
                            <span className="text-sm text-gray-600">
                              ID: {question.questionId}
                            </span>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-medium">
                                  Effectiveness Score
                                </span>
                                <span
                                  className={`text-sm font-bold ${getScoreColor(question.score)}`}
                                >
                                  {question.score.toFixed(1)}%
                                </span>
                              </div>
                              <Progress
                                value={question.score}
                                className="h-2"
                              />
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-600">
                                Usage Count
                              </p>
                              <p className="text-lg font-semibold">
                                {question.usageCount}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="adaptations" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Adaptation Success Rate */}
            <Card>
              <CardHeader>
                <CardTitle>Adaptation Success Rates</CardTitle>
                <CardDescription>
                  Effectiveness of different adaptation strategies
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    {
                      type: 'Question Combination',
                      successRate: 85,
                      count: 45,
                      color: 'bg-green-500',
                    },
                    {
                      type: 'Reformulation',
                      successRate: 78,
                      count: 32,
                      color: 'bg-blue-500',
                    },
                    {
                      type: 'New Generation',
                      successRate: 65,
                      count: 18,
                      color: 'bg-purple-500',
                    },
                    {
                      type: 'Demographic Adaptation',
                      successRate: 82,
                      count: 28,
                      color: 'bg-orange-500',
                    },
                  ].map((adaptation) => (
                    <div key={adaptation.type} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">
                          {adaptation.type}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">
                            {adaptation.count} adaptations
                          </span>
                          <span
                            className={`text-sm font-bold ${getScoreColor(adaptation.successRate)}`}
                          >
                            {adaptation.successRate}%
                          </span>
                        </div>
                      </div>
                      <Progress
                        value={adaptation.successRate}
                        className="h-2"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Demographic Context Impact */}
            <Card>
              <CardHeader>
                <CardTitle>Demographic Context Impact</CardTitle>
                <CardDescription>
                  How demographic targeting affects question effectiveness
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={[
                      { demographic: 'Engineering', targeted: 88, generic: 75 },
                      { demographic: 'Sales', targeted: 85, generic: 72 },
                      { demographic: 'Marketing', targeted: 82, generic: 74 },
                      { demographic: 'HR', targeted: 90, generic: 78 },
                      { demographic: 'Leadership', targeted: 87, generic: 80 },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="demographic" />
                    <YAxis />
                    <Tooltip />
                    <Bar
                      dataKey="targeted"
                      fill="#10B981"
                      name="Targeted Questions"
                    />
                    <Bar
                      dataKey="generic"
                      fill="#6B7280"
                      name="Generic Questions"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* AI Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle>AI Adaptation Recommendations</CardTitle>
              <CardDescription>
                Current recommendations for improving question effectiveness
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    type: 'High Priority',
                    recommendation:
                      'Combine leadership and trust questions for better insight generation',
                    impact:
                      'Expected 15% improvement in action plan generation',
                    confidence: 85,
                  },
                  {
                    type: 'Medium Priority',
                    recommendation:
                      'Reformulate work-life balance questions for remote workers',
                    impact: 'Expected 12% improvement in response rate',
                    confidence: 78,
                  },
                  {
                    type: 'Low Priority',
                    recommendation:
                      'Generate new innovation questions based on successful patterns',
                    impact: 'Expected 8% improvement in insight quality',
                    confidence: 65,
                  },
                ].map((rec, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <Badge
                        variant={
                          rec.type === 'High Priority'
                            ? 'destructive'
                            : rec.type === 'Medium Priority'
                              ? 'default'
                              : 'secondary'
                        }
                      >
                        {rec.type}
                      </Badge>
                      <span className="text-sm text-gray-600">
                        Confidence: {rec.confidence}%
                      </span>
                    </div>
                    <h4 className="font-medium mb-1">{rec.recommendation}</h4>
                    <p className="text-sm text-gray-600">{rec.impact}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          {/* Effectiveness Trends */}
          <Card>
            <CardHeader>
              <CardTitle>Effectiveness Trends Over Time</CardTitle>
              <CardDescription>
                Question effectiveness trends across different metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart
                  data={[
                    {
                      date: '2024-01',
                      responseRate: 75,
                      completionRate: 82,
                      insightQuality: 78,
                      actionPlans: 65,
                    },
                    {
                      date: '2024-02',
                      responseRate: 78,
                      completionRate: 84,
                      insightQuality: 80,
                      actionPlans: 68,
                    },
                    {
                      date: '2024-03',
                      responseRate: 80,
                      completionRate: 85,
                      insightQuality: 82,
                      actionPlans: 72,
                    },
                    {
                      date: '2024-04',
                      responseRate: 82,
                      completionRate: 87,
                      insightQuality: 84,
                      actionPlans: 75,
                    },
                    {
                      date: '2024-05',
                      responseRate: 85,
                      completionRate: 88,
                      insightQuality: 86,
                      actionPlans: 78,
                    },
                    {
                      date: '2024-06',
                      responseRate: 83,
                      completionRate: 89,
                      insightQuality: 87,
                      actionPlans: 80,
                    },
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="responseRate"
                    stroke="#3B82F6"
                    name="Response Rate"
                  />
                  <Line
                    type="monotone"
                    dataKey="completionRate"
                    stroke="#10B981"
                    name="Completion Rate"
                  />
                  <Line
                    type="monotone"
                    dataKey="insightQuality"
                    stroke="#F59E0B"
                    name="Insight Quality"
                  />
                  <Line
                    type="monotone"
                    dataKey="actionPlans"
                    stroke="#EF4444"
                    name="Action Plan Generation"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Trend Analysis */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Key Trends</CardTitle>
                <CardDescription>
                  Significant trends in question effectiveness
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    {
                      metric: 'Response Rate',
                      trend: 'improving',
                      change: '+8.2%',
                      description: 'Steady improvement over 6 months',
                    },
                    {
                      metric: 'Insight Quality',
                      trend: 'improving',
                      change: '+11.5%',
                      description: 'AI adaptations showing strong results',
                    },
                    {
                      metric: 'Action Plan Generation',
                      trend: 'improving',
                      change: '+23.1%',
                      description: 'Significant improvement in actionability',
                    },
                    {
                      metric: 'Skip Rate',
                      trend: 'declining',
                      change: '-15.3%',
                      description: 'Questions becoming more engaging',
                    },
                  ].map((trend, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded"
                    >
                      <div className="flex items-center gap-3">
                        {getTrendIcon(trend.trend)}
                        <div>
                          <p className="font-medium">{trend.metric}</p>
                          <p className="text-sm text-gray-600">
                            {trend.description}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`font-bold ${trend.trend === 'improving' ? 'text-green-600' : 'text-red-600'}`}
                      >
                        {trend.change}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Predictive Insights</CardTitle>
                <CardDescription>
                  AI predictions for question effectiveness
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">
                      Next Month Forecast
                    </h4>
                    <p className="text-sm text-blue-800">
                      Expected 5-7% improvement in overall effectiveness based
                      on current adaptation trends.
                    </p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-medium text-green-900 mb-2">
                      Optimization Opportunity
                    </h4>
                    <p className="text-sm text-green-800">
                      Leadership questions show highest potential for
                      combination adaptations.
                    </p>
                  </div>
                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <h4 className="font-medium text-yellow-900 mb-2">
                      Attention Needed
                    </h4>
                    <p className="text-sm text-yellow-800">
                      Innovation category questions may need reformulation for
                      better engagement.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
