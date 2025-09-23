'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Users,
  Target,
  AlertCircle,
  CheckCircle,
  Clock,
  Play,
  MoreHorizontal,
  TrendingUp,
} from 'lucide-react';

interface ActionPlan {
  _id: string;
  title: string;
  description: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'overdue' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  due_date: string;
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
  created_at: string;
}

interface ActionPlanKanbanProps {
  companyId?: string;
  departmentId?: string;
  assignedTo?: string;
  onActionPlanClick?: (actionPlan: ActionPlan) => void;
}

const statusColumns = [
  {
    id: 'not_started',
    title: 'Not Started',
    icon: Clock,
    color: 'bg-gray-100 border-gray-300',
    headerColor: 'bg-gray-50',
  },
  {
    id: 'in_progress',
    title: 'In Progress',
    icon: Play,
    color: 'bg-blue-100 border-blue-300',
    headerColor: 'bg-blue-50',
  },
  {
    id: 'completed',
    title: 'Completed',
    icon: CheckCircle,
    color: 'bg-green-100 border-green-300',
    headerColor: 'bg-green-50',
  },
  {
    id: 'overdue',
    title: 'Overdue',
    icon: AlertCircle,
    color: 'bg-red-100 border-red-300',
    headerColor: 'bg-red-50',
  },
];

export function ActionPlanKanban({
  companyId,
  departmentId,
  assignedTo,
  onActionPlanClick,
}: ActionPlanKanbanProps) {
  const [actionPlans, setActionPlans] = useState<ActionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      params.append('limit', '100'); // Get more for Kanban view

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

  const getActionPlansByStatus = (status: string) => {
    return actionPlans.filter((plan) => plan.status === status);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-500';
      case 'high':
        return 'bg-orange-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
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

  const isOverdue = (dueDate: string, status: string) => {
    return new Date(dueDate) < new Date() && status !== 'completed';
  };

  const getDaysUntilDue = (dueDate: string) => {
    const due = new Date(dueDate);
    const now = new Date();
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
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
    <div className="h-full overflow-hidden">
      <div className="flex gap-3 sm:gap-4 lg:gap-6 h-full overflow-x-auto pb-4 px-1">
        {statusColumns.map((column) => {
          const columnPlans = getActionPlansByStatus(column.id);
          const ColumnIcon = column.icon;

          return (
            <div
              key={column.id}
              className="flex-shrink-0 w-64 sm:w-72 lg:w-80 min-w-[250px] max-w-[320px]"
            >
              <div
                className={`${column.headerColor} rounded-t-lg p-4 border-b`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <ColumnIcon className="w-5 h-5 mr-2 text-gray-600" />
                    <h3 className="font-medium text-gray-900">
                      {column.title}
                    </h3>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {columnPlans.length}
                  </Badge>
                </div>
              </div>

              <div
                className={`${column.color} min-h-96 p-4 rounded-b-lg space-y-3 overflow-y-auto`}
              >
                <AnimatePresence>
                  {columnPlans.map((actionPlan) => {
                    const progress = calculateProgress(actionPlan);
                    const daysUntilDue = getDaysUntilDue(actionPlan.due_date);
                    const overdue = isOverdue(
                      actionPlan.due_date,
                      actionPlan.status
                    );

                    return (
                      <motion.div
                        key={actionPlan._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        layout
                      >
                        <Card
                          className="p-4 cursor-pointer hover:shadow-md transition-shadow bg-white"
                          onClick={() => onActionPlanClick?.(actionPlan)}
                        >
                          {/* Header */}
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900 text-sm line-clamp-2 mb-1">
                                {actionPlan.title}
                              </h4>
                              <p className="text-xs text-gray-600 line-clamp-2">
                                {actionPlan.description}
                              </p>
                            </div>
                            <div className="flex items-center space-x-1 ml-2">
                              <div
                                className={`w-2 h-2 rounded-full ${getPriorityColor(actionPlan.priority)}`}
                              />
                              <Button variant="ghost" size="sm" className="p-1">
                                <MoreHorizontal className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>

                          {/* Progress Bar */}
                          {(actionPlan.kpis.length > 0 ||
                            actionPlan.qualitative_objectives.length > 0) && (
                            <div className="mb-3">
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
                          <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                            <div className="flex items-center text-gray-600">
                              <Target className="w-3 h-3 mr-1" />
                              {actionPlan.kpis.length} KPIs
                            </div>
                            <div className="flex items-center text-gray-600">
                              <TrendingUp className="w-3 h-3 mr-1" />
                              {actionPlan.qualitative_objectives.length} Obj
                            </div>
                          </div>

                          {/* Assigned Users */}
                          {actionPlan.assigned_to.length > 0 && (
                            <div className="flex items-center mb-3">
                              <Users className="w-3 h-3 text-gray-500 mr-1" />
                              <div className="flex -space-x-1">
                                {actionPlan.assigned_to
                                  .slice(0, 3)
                                  .map((user, index) => (
                                    <div
                                      key={index}
                                      className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs border-2 border-white"
                                      title={user.name}
                                    >
                                      {user.name.charAt(0).toUpperCase()}
                                    </div>
                                  ))}
                                {actionPlan.assigned_to.length > 3 && (
                                  <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center text-white text-xs border-2 border-white">
                                    +{actionPlan.assigned_to.length - 3}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Due Date */}
                          <div className="flex items-center justify-between text-xs">
                            <div
                              className={`flex items-center ${overdue ? 'text-red-600' : 'text-gray-500'}`}
                            >
                              <Calendar className="w-3 h-3 mr-1" />
                              {overdue
                                ? 'Overdue'
                                : daysUntilDue === 0
                                  ? 'Due today'
                                  : daysUntilDue === 1
                                    ? 'Due tomorrow'
                                    : daysUntilDue > 0
                                      ? `${daysUntilDue} days left`
                                      : `${Math.abs(daysUntilDue)} days overdue`}
                            </div>
                            {actionPlan.progress_updates.length > 0 && (
                              <div className="text-gray-400">
                                Last update:{' '}
                                {new Date(
                                  actionPlan.progress_updates[
                                    actionPlan.progress_updates.length - 1
                                  ].update_date
                                ).toLocaleDateString()}
                              </div>
                            )}
                          </div>

                          {/* Priority Badge */}
                          <div className="mt-2">
                            <Badge
                              variant="outline"
                              className={`text-xs ${
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
                          </div>
                        </Card>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {columnPlans.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <ColumnIcon className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No action plans</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
