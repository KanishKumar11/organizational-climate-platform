'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { motion } from 'framer-motion';
import {
  Target,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  Plus,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

interface ActionPlanSummary {
  total: number;
  active: number;
  completed: number;
  overdue: number;
  due_this_week: number;
  completion_rate: number;
  recent_plans: Array<{
    _id: string;
    title: string;
    status: string;
    priority: string;
    due_date: string;
    assigned_to: Array<{ name: string }>;
  }>;
}

interface ActionPlanSummaryWidgetProps {
  companyId?: string;
  departmentId?: string;
  className?: string;
  showRecentPlans?: boolean;
  maxRecentPlans?: number;
}

export function ActionPlanSummaryWidget({
  companyId,
  departmentId,
  className = '',
  showRecentPlans = true,
  maxRecentPlans = 3,
}: ActionPlanSummaryWidgetProps) {
  const { canCreateActionPlans } = useAuth();
  const [summary, setSummary] = useState<ActionPlanSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSummary();
  }, [companyId, departmentId]);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (companyId) params.append('company_id', companyId);
      if (departmentId) params.append('department_id', departmentId);
      params.append('summary', 'true');
      params.append('recent_limit', maxRecentPlans.toString());

      const response = await fetch(`/api/action-plans?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch action plan summary');
      }

      const data = await response.json();
      setSummary(data.summary);
    } catch (err) {
      console.error('Error fetching action plan summary:', err);
      setError('Failed to load action plan data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'in_progress':
        return <Clock className="w-4 h-4 text-blue-600" />;
      case 'overdue':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default:
        return <Target className="w-4 h-4 text-gray-600" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-green-100 text-green-800';
    }
  };

  if (!canCreateActionPlans) {
    return null;
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Action Plans
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner size="md" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Action Plans
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <p className="text-sm text-gray-600">{error}</p>
            <Button
              onClick={fetchSummary}
              variant="outline"
              size="sm"
              className="mt-3"
            >
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Action Plans
          </CardTitle>
          <Button asChild variant="ghost" size="sm">
            <Link href="/action-plans">
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Stats */}
        {summary && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {summary.active}
                </div>
                <div className="text-xs text-blue-800">Active</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {Math.round(summary.completion_rate)}%
                </div>
                <div className="text-xs text-green-800">Completion</div>
              </div>
            </div>

            {/* Alert indicators */}
            {(summary.overdue > 0 || summary.due_this_week > 0) && (
              <div className="flex gap-2">
                {summary.overdue > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {summary.overdue} overdue
                  </Badge>
                )}
                {summary.due_this_week > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {summary.due_this_week} due this week
                  </Badge>
                )}
              </div>
            )}

            {/* Recent Plans */}
            {showRecentPlans && summary.recent_plans.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700">Recent Plans</h4>
                {summary.recent_plans.slice(0, maxRecentPlans).map((plan) => (
                  <motion.div
                    key={plan._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 p-2 bg-gray-50 rounded text-xs"
                  >
                    {getStatusIcon(plan.status)}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{plan.title}</p>
                      <div className="flex items-center gap-1 text-gray-500">
                        <Users className="w-3 h-3" />
                        <span>{plan.assigned_to.length}</span>
                        <Badge
                          className={`${getPriorityColor(plan.priority)} text-xs px-1 py-0`}
                        >
                          {plan.priority}
                        </Badge>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <Button asChild size="sm" className="flex-1">
                <Link href="/action-plans">
                  View All
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href="/action-plans/create">
                  <Plus className="w-4 h-4 mr-1" />
                  Create
                </Link>
              </Button>
            </div>
          </>
        )}

        {/* Empty State */}
        {summary && summary.total === 0 && (
          <div className="text-center py-6">
            <Target className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-600 mb-3">No action plans yet</p>
            <Button asChild size="sm">
              <Link href="/action-plans/create">
                <Plus className="w-4 h-4 mr-2" />
                Create First Plan
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
