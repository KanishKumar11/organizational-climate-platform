'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Loading } from '@/components/ui/Loading';
import { motion } from 'framer-motion';
import {
  Calendar,
  Users,
  Target,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  Filter,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface ActionPlan {
  _id: string;
  title: string;
  description: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'overdue' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  due_date: string;
  created_at: string;
  assigned_to: Array<{ name: string; email: string }>;
  kpis: Array<{
    id: string;
    name: string;
    current_value: number;
    target_value: number;
    unit: string;
  }>;
  qualitative_objectives: Array<{
    id: string;
    description: string;
    completion_percentage: number;
  }>;
  progress_updates: Array<{
    update_date: string;
    updated_by: { name: string };
  }>;
}

interface ActionPlanTimelineProps {
  companyId?: string;
  departmentId?: string;
  assignedTo?: string;
  onActionPlanClick?: (actionPlan: ActionPlan) => void;
}

export function ActionPlanTimeline({
  companyId,
  departmentId,
  assignedTo,
  onActionPlanClick,
}: ActionPlanTimelineProps) {
  const [actionPlans, setActionPlans] = useState<ActionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  useEffect(() => {
    fetchActionPlans();
  }, [companyId, departmentId, assignedTo]);

  const fetchActionPlans = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (companyId) params.append('company_id', companyId);
      if (departmentId) params.append('department_id', departmentId);
      if (assignedTo) params.append('assigned_to', assignedTo);
      params.append('limit', '100');

      const response = await fetch(`/api/action-plans?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch action plans');
      }

      const data = await response.json();
      setActionPlans(data.action_plans);
    } catch (error) {
      console.error('Error fetching action plans:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to fetch action plans'
      );
    } finally {
      setLoading(false);
    }
  };

  const getMonthDays = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];

    for (let day = 1; day <= lastDay.getDate(); day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const getActionPlansForDate = (date: Date) => {
    return actionPlans.filter((plan) => {
      const dueDate = new Date(plan.due_date);
      const createdDate = new Date(plan.created_at);

      // Filter by status and priority
      if (statusFilter !== 'all' && plan.status !== statusFilter) return false;
      if (priorityFilter !== 'all' && plan.priority !== priorityFilter)
        return false;

      // Check if action plan is relevant for this date
      return (
        dueDate.toDateString() === date.toDateString() || // Due on this date
        createdDate.toDateString() === date.toDateString() || // Created on this date
        (createdDate <= date && dueDate >= date) // Active during this date
      );
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-500 border-red-600';
      case 'high':
        return 'bg-orange-500 border-orange-600';
      case 'medium':
        return 'bg-yellow-500 border-yellow-600';
      case 'low':
        return 'bg-green-500 border-green-600';
      default:
        return 'bg-gray-500 border-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'in_progress':
        return <Clock className="w-4 h-4 text-blue-600" />;
      case 'overdue':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const calculateProgress = (actionPlan: ActionPlan) => {
    const kpiProgress =
      actionPlan.kpis.length > 0
        ? actionPlan.kpis.reduce((sum, kpi) => {
            const progress =
              kpi.target_value > 0
                ? (kpi.current_value / kpi.target_value) * 100
                : 0;
            return sum + Math.min(100, progress);
          }, 0) / actionPlan.kpis.length
        : 0;

    const qualitativeProgress =
      actionPlan.qualitative_objectives.length > 0
        ? actionPlan.qualitative_objectives.reduce(
            (sum, obj) => sum + obj.completion_percentage,
            0
          ) / actionPlan.qualitative_objectives.length
        : 0;

    return actionPlan.kpis.length > 0 &&
      actionPlan.qualitative_objectives.length > 0
      ? (kpiProgress + qualitativeProgress) / 2
      : kpiProgress || qualitativeProgress;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth((prev) => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const monthDays = getMonthDays(currentMonth);
  const monthName = currentMonth.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loading />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={fetchActionPlans} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Navigation and Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateMonth('prev')}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h2 className="text-xl font-bold text-gray-900">{monthName}</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateMonth('next')}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-sm border border-gray-300 rounded px-2 py-1"
            >
              <option value="all">All Status</option>
              <option value="not_started">Not Started</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="text-sm border border-gray-300 rounded px-2 py-1"
          >
            <option value="all">All Priority</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-4">
        {monthDays.map((date) => {
          const dayPlans = getActionPlansForDate(date);
          const isToday = date.toDateString() === new Date().toDateString();
          const isWeekend = date.getDay() === 0 || date.getDay() === 6;

          if (dayPlans.length === 0) return null;

          return (
            <motion.div
              key={date.toISOString()}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`border-l-4 pl-6 ${isToday ? 'border-blue-500' : 'border-gray-200'}`}
            >
              <div className="flex items-center mb-4">
                <div
                  className={`w-3 h-3 rounded-full -ml-8 mr-4 ${
                    isToday ? 'bg-blue-500' : 'bg-gray-300'
                  }`}
                />
                <div className="flex items-center space-x-3">
                  <h3
                    className={`font-medium ${isToday ? 'text-blue-900' : 'text-gray-900'}`}
                  >
                    {date.toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </h3>
                  {isToday && (
                    <Badge
                      variant="secondary"
                      className="bg-blue-100 text-blue-800"
                    >
                      Today
                    </Badge>
                  )}
                  {isWeekend && (
                    <Badge variant="outline" className="text-xs">
                      Weekend
                    </Badge>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                {dayPlans.map((actionPlan) => {
                  const progress = calculateProgress(actionPlan);
                  const isDue =
                    new Date(actionPlan.due_date).toDateString() ===
                    date.toDateString();
                  const isCreated =
                    new Date(actionPlan.created_at).toDateString() ===
                    date.toDateString();

                  return (
                    <Card
                      key={actionPlan._id}
                      className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => onActionPlanClick?.(actionPlan)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start space-x-3 flex-1">
                          <div
                            className={`w-1 h-16 rounded-full ${getPriorityColor(actionPlan.priority)}`}
                          />
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              {getStatusIcon(actionPlan.status)}
                              <h4 className="font-medium text-gray-900">
                                {actionPlan.title}
                              </h4>
                              {isDue && (
                                <Badge
                                  variant="outline"
                                  className="text-xs border-orange-500 text-orange-700"
                                >
                                  Due Today
                                </Badge>
                              )}
                              {isCreated && (
                                <Badge
                                  variant="outline"
                                  className="text-xs border-green-500 text-green-700"
                                >
                                  Created
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                              {actionPlan.description}
                            </p>

                            {/* Progress */}
                            {(actionPlan.kpis.length > 0 ||
                              actionPlan.qualitative_objectives.length > 0) && (
                              <div className="mb-2">
                                <div className="flex justify-between text-xs text-gray-500 mb-1">
                                  <span>Progress</span>
                                  <span>{Math.round(progress)}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-1.5">
                                  <div
                                    className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                                    style={{
                                      width: `${Math.min(100, progress)}%`,
                                    }}
                                  />
                                </div>
                              </div>
                            )}

                            {/* Metrics */}
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <div className="flex items-center">
                                <Target className="w-3 h-3 mr-1" />
                                {actionPlan.kpis.length} KPIs
                              </div>
                              <div className="flex items-center">
                                <TrendingUp className="w-3 h-3 mr-1" />
                                {actionPlan.qualitative_objectives.length}{' '}
                                Objectives
                              </div>
                              <div className="flex items-center">
                                <Users className="w-3 h-3 mr-1" />
                                {actionPlan.assigned_to.length} Assigned
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <Badge
                            variant="outline"
                            className={`text-xs mb-2 ${
                              actionPlan.priority === 'critical'
                                ? 'border-red-500 text-red-700'
                                : actionPlan.priority === 'high'
                                  ? 'border-orange-500 text-orange-700'
                                  : actionPlan.priority === 'medium'
                                    ? 'border-yellow-500 text-yellow-700'
                                    : 'border-green-500 text-green-700'
                            }`}
                          >
                            {actionPlan.priority}
                          </Badge>
                          <div className="text-xs text-gray-500">
                            Due:{' '}
                            {new Date(actionPlan.due_date).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </div>

      {actionPlans.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-lg mb-2">No action plans found</p>
          <p className="text-sm">
            Create your first action plan to see it on the timeline
          </p>
        </div>
      )}
    </div>
  );
}
