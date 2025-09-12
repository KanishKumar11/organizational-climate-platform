'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loading } from '@/components/ui/Loading';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Target,
  AlertTriangle,
  CheckCircle,
  Clock,
  Lightbulb,
  RefreshCw,
  Download,
  Settings,
} from 'lucide-react';

interface PoolStats {
  totalQuestions: number;
  activeQuestions: number;
  categoriesCount: number;
  averageEffectiveness: number;
  utilizationRate: number;
  aiGeneratedCount: number;
  humanCreatedCount: number;
}

interface CategoryStats {
  category: string;
  subcategories: string[];
  totalQuestions: number;
  activeQuestions: number;
  averageEffectiveness: number;
  totalUsage: number;
  averageResponseRate: number;
  lastUsed?: Date;
}

interface AttentionItem {
  id: string;
  text: string;
  category: string;
  recommendation: string;
  priority: 'high' | 'medium' | 'low';
  type:
    | 'never_used'
    | 'low_effectiveness'
    | 'low_response_rate'
    | 'overused'
    | 'outdated';
}

interface OptimizationRecommendation {
  type: string;
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  action: string;
  impact: string;
}

interface QuestionPoolDashboardProps {
  userRole: string;
  companyId?: string;
}

export default function QuestionPoolDashboard({
  userRole,
  companyId,
}: QuestionPoolDashboardProps) {
  const [poolStats, setPoolStats] = useState<PoolStats | null>(null);
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([]);
  const [attentionItems, setAttentionItems] = useState<{
    neverUsed: AttentionItem[];
    lowEffectiveness: AttentionItem[];
    lowResponseRate: AttentionItem[];
    overused: AttentionItem[];
    outdated: AttentionItem[];
  } | null>(null);
  const [recommendations, setRecommendations] = useState<
    OptimizationRecommendation[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const [statsResponse, attentionResponse, recommendationsResponse] =
        await Promise.all([
          fetch('/api/question-bank/analytics'),
          fetch('/api/question-bank/attention'),
          fetch('/api/question-bank/recommendations'),
        ]);

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setPoolStats(statsData.overview);
        setCategoryStats(statsData.effectiveness.categoryPerformance);
      }

      if (attentionResponse.ok) {
        const attentionData = await attentionResponse.json();
        setAttentionItems(attentionData);
      }

      if (recommendationsResponse.ok) {
        const recommendationsData = await recommendationsResponse.json();
        setRecommendations(recommendationsData.recommendations || []);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getEffectivenessColor = (score: number) => {
    if (score >= 7) return 'text-green-600';
    if (score >= 5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getUtilizationColor = (rate: number) => {
    if (rate >= 70) return 'text-green-600';
    if (rate >= 50) return 'text-yellow-600';
    return 'text-red-600';
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
            Question Pool Dashboard
          </h1>
          <p className="text-gray-600">
            Monitor question effectiveness, usage patterns, and optimization
            opportunities
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw
              className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`}
            />
            Refresh
          </Button>
          {canManageQuestions && (
            <>
              <Button variant="outline" className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                Export
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Optimize
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Key Metrics */}
      {poolStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Questions
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {poolStats.totalQuestions}
                </p>
                <p className="text-sm text-gray-500">
                  {poolStats.activeQuestions} active
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
                  Avg Effectiveness
                </p>
                <p
                  className={`text-2xl font-bold ${getEffectivenessColor(poolStats.averageEffectiveness)}`}
                >
                  {poolStats.averageEffectiveness.toFixed(1)}/10
                </p>
                <p className="text-sm text-gray-500">
                  Insight generation score
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Target className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Utilization Rate
                </p>
                <p
                  className={`text-2xl font-bold ${getUtilizationColor(poolStats.utilizationRate)}`}
                >
                  {poolStats.utilizationRate.toFixed(1)}%
                </p>
                <p className="text-sm text-gray-500">Questions being used</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Categories</p>
                <p className="text-2xl font-bold text-gray-900">
                  {poolStats.categoriesCount}
                </p>
                <p className="text-sm text-gray-500">
                  {poolStats.aiGeneratedCount} AI-generated
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <Lightbulb className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Optimization Recommendations */}
      {recommendations.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-600" />
            Optimization Recommendations
          </h3>
          <div className="space-y-4">
            {recommendations.slice(0, 3).map((rec, index) => (
              <div
                key={index}
                className={`p-4 border rounded-lg ${getPriorityColor(rec.priority)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={getPriorityColor(rec.priority)}>
                        {rec.priority.toUpperCase()}
                      </Badge>
                      <h4 className="font-medium text-gray-900">{rec.title}</h4>
                    </div>
                    <p className="text-gray-700 mb-2">{rec.description}</p>
                    <p className="text-sm text-gray-600">
                      <strong>Action:</strong> {rec.action}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Impact:</strong> {rec.impact}
                    </p>
                  </div>
                  {canManageQuestions && (
                    <Button size="sm" variant="outline">
                      Take Action
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Category Performance */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Category Performance
        </h3>
        <div className="space-y-4">
          {categoryStats.slice(0, 8).map((category) => (
            <div
              key={category.category}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
            >
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">
                  {category.category}
                </h4>
                <p className="text-sm text-gray-600">
                  {category.totalQuestions} questions •{' '}
                  {category.activeQuestions} active
                </p>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <div className="text-center">
                  <p className="text-gray-600">Effectiveness</p>
                  <p
                    className={`font-medium ${getEffectivenessColor(category.averageEffectiveness)}`}
                  >
                    {category.averageEffectiveness.toFixed(1)}/10
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
                    {category.averageResponseRate.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Questions Needing Attention */}
      {attentionItems && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Never Used Questions */}
          {attentionItems.neverUsed.length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-gray-600" />
                Never Used Questions ({attentionItems.neverUsed.length})
              </h3>
              <div className="space-y-3">
                {attentionItems.neverUsed.slice(0, 5).map((item) => (
                  <div key={item.id} className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-gray-900 font-medium text-sm line-clamp-2">
                      {item.text}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <Badge variant="outline" className="text-xs">
                        {item.category}
                      </Badge>
                      <p className="text-xs text-gray-500">
                        {item.recommendation}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Low Effectiveness Questions */}
          {attentionItems.lowEffectiveness.length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-red-600" />
                Low Effectiveness ({attentionItems.lowEffectiveness.length})
              </h3>
              <div className="space-y-3">
                {attentionItems.lowEffectiveness.slice(0, 5).map((item) => (
                  <div key={item.id} className="p-3 bg-red-50 rounded-lg">
                    <p className="text-gray-900 font-medium text-sm line-clamp-2">
                      {item.text}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <Badge variant="outline" className="text-xs">
                        {item.category}
                      </Badge>
                      <p className="text-xs text-red-600">
                        {item.recommendation}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Low Response Rate Questions */}
          {attentionItems.lowResponseRate.length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                Low Response Rate ({attentionItems.lowResponseRate.length})
              </h3>
              <div className="space-y-3">
                {attentionItems.lowResponseRate.slice(0, 5).map((item) => (
                  <div key={item.id} className="p-3 bg-yellow-50 rounded-lg">
                    <p className="text-gray-900 font-medium text-sm line-clamp-2">
                      {item.text}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <Badge variant="outline" className="text-xs">
                        {item.category}
                      </Badge>
                      <p className="text-xs text-yellow-600">
                        {item.recommendation}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Overused Questions */}
          {attentionItems.overused.length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Overused Questions ({attentionItems.overused.length})
              </h3>
              <div className="space-y-3">
                {attentionItems.overused.slice(0, 5).map((item) => (
                  <div key={item.id} className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-gray-900 font-medium text-sm line-clamp-2">
                      {item.text}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <Badge variant="outline" className="text-xs">
                        {item.category}
                      </Badge>
                      <p className="text-xs text-blue-600">
                        {item.recommendation}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Quick Actions */}
      {canManageQuestions && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              className="flex items-center gap-2 p-4 h-auto"
            >
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div className="text-left">
                <p className="font-medium">Optimize Pool</p>
                <p className="text-sm text-gray-600">
                  Run comprehensive optimization
                </p>
              </div>
            </Button>
            <Button
              variant="outline"
              className="flex items-center gap-2 p-4 h-auto"
            >
              <Settings className="w-5 h-5 text-blue-600" />
              <div className="text-left">
                <p className="font-medium">Manage Lifecycle</p>
                <p className="text-sm text-gray-600">
                  Archive or deprecate questions
                </p>
              </div>
            </Button>
            <Button
              variant="outline"
              className="flex items-center gap-2 p-4 h-auto"
            >
              <Lightbulb className="w-5 h-5 text-purple-600" />
              <div className="text-left">
                <p className="font-medium">Generate Questions</p>
                <p className="text-sm text-gray-600">
                  AI-powered question creation
                </p>
              </div>
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
