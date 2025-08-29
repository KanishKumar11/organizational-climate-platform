'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Loading } from '@/components/ui/Loading';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  Clock,
  AlertCircle,
  TrendingDown,
  Calendar,
  Users,
  Filter,
  Refresh,
  Bell,
  X,
  ChevronRight,
  Target,
} from 'lucide-react';

interface Alert {
  id: string;
  type: 'overdue' | 'deadline' | 'stalled' | 'low_progress' | 'high_risk';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  action_plan_id: string;
  action_plan_title: string;
  due_date: string;
  assigned_to: Array<{ name: string; email: string }>;
  created_at: string;
  metadata: any;
}

interface AlertsPanelProps {
  companyId?: string;
  departmentId?: string;
  onActionPlanClick?: (actionPlanId: string) => void;
  onAlertDismiss?: (alertId: string) => void;
}

export function AlertsPanel({
  companyId,
  departmentId,
  onActionPlanClick,
  onAlertDismiss,
}: AlertsPanelProps) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    fetchAlerts();
  }, [companyId, departmentId, typeFilter]);

  const fetchAlerts = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (typeFilter !== 'all') params.append('type', typeFilter);

      const response = await fetch(`/api/action-plans/alerts?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch alerts');
      }

      const data = await response.json();
      setAlerts(data.alerts);
      setSummary(data.summary);
    } catch (error) {
      console.error('Error fetching alerts:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to fetch alerts'
      );
    } finally {
      setLoading(false);
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'overdue':
        return AlertTriangle;
      case 'deadline':
        return Clock;
      case 'stalled':
        return TrendingDown;
      case 'low_progress':
        return Target;
      case 'high_risk':
        return AlertCircle;
      default:
        return Bell;
    }
  };

  const getAlertColor = (priority: string, type: string) => {
    if (priority === 'critical') return 'border-red-500 bg-red-50';
    if (priority === 'high') return 'border-orange-500 bg-orange-50';
    if (priority === 'medium') return 'border-yellow-500 bg-yellow-50';
    return 'border-blue-500 bg-blue-50';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-500 text-white';
      case 'high':
        return 'bg-orange-500 text-white';
      case 'medium':
        return 'bg-yellow-500 text-white';
      case 'low':
        return 'bg-blue-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const handleDismissAlert = (alertId: string) => {
    setDismissedAlerts((prev) => new Set([...prev, alertId]));
    onAlertDismiss?.(alertId);
  };

  const filteredAlerts = alerts.filter((alert) => {
    if (dismissedAlerts.has(alert.id)) return false;
    if (priorityFilter !== 'all' && alert.priority !== priorityFilter)
      return false;
    return true;
  });

  const alertTypes = [
    { value: 'all', label: 'All Alerts', icon: Bell },
    { value: 'overdue', label: 'Overdue', icon: AlertTriangle },
    { value: 'deadline', label: 'Deadline', icon: Clock },
    { value: 'stalled', label: 'Stalled', icon: TrendingDown },
    { value: 'low_progress', label: 'Low Progress', icon: Target },
    { value: 'high_risk', label: 'High Risk', icon: AlertCircle },
  ];

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex justify-center items-center h-32">
          <Loading />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchAlerts} variant="outline">
            Try Again
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Bell className="w-6 h-6 text-orange-600 mr-2" />
          <h2 className="text-xl font-bold text-gray-900">
            Action Plan Alerts
          </h2>
          {summary && (
            <Badge variant="secondary" className="ml-3">
              {summary.total} alerts
            </Badge>
          )}
        </div>
        <Button
          onClick={fetchAlerts}
          variant="outline"
          size="sm"
          className="flex items-center"
        >
          <Refresh className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">
              {summary.critical}
            </div>
            <div className="text-sm text-gray-600">Critical</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">
              {summary.high}
            </div>
            <div className="text-sm text-gray-600">High</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {summary.medium}
            </div>
            <div className="text-sm text-gray-600">Medium</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {summary.low}
            </div>
            <div className="text-sm text-gray-600">Low</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-600">
              {summary.total}
            </div>
            <div className="text-sm text-gray-600">Total</div>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 text-sm"
          >
            {alertTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 text-sm"
        >
          <option value="all">All Priorities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        <AnimatePresence>
          {filteredAlerts.map((alert) => {
            const AlertIcon = getAlertIcon(alert.type);

            return (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                layout
              >
                <Card
                  className={`p-4 border-l-4 ${getAlertColor(alert.priority, alert.type)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <AlertIcon className="w-5 h-5 mt-0.5 text-gray-600" />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-medium text-gray-900">
                            {alert.title}
                          </h4>
                          <Badge
                            className={`text-xs ${getPriorityColor(alert.priority)}`}
                          >
                            {alert.priority}
                          </Badge>
                        </div>

                        <p className="text-sm text-gray-700 mb-3">
                          {alert.message}
                        </p>

                        <div className="flex items-center space-x-4 text-xs text-gray-500 mb-3">
                          <div className="flex items-center">
                            <Target className="w-3 h-3 mr-1" />
                            {alert.action_plan_title}
                          </div>
                          <div className="flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            Due: {new Date(alert.due_date).toLocaleDateString()}
                          </div>
                          <div className="flex items-center">
                            <Users className="w-3 h-3 mr-1" />
                            {alert.assigned_to.length} assigned
                          </div>
                        </div>

                        {/* Metadata */}
                        {alert.metadata && (
                          <div className="text-xs text-gray-600 space-y-1">
                            {alert.metadata.days_overdue && (
                              <div>
                                Days overdue: {alert.metadata.days_overdue}
                              </div>
                            )}
                            {alert.metadata.days_until_due && (
                              <div>
                                Days until due: {alert.metadata.days_until_due}
                              </div>
                            )}
                            {alert.metadata.days_since_update && (
                              <div>
                                Days since update:{' '}
                                {alert.metadata.days_since_update}
                              </div>
                            )}
                            {alert.metadata.progress !== undefined && (
                              <div>Progress: {alert.metadata.progress}%</div>
                            )}
                            {alert.metadata.risk_score && (
                              <div>
                                Risk score:{' '}
                                {Math.round(alert.metadata.risk_score * 100)}%
                              </div>
                            )}
                          </div>
                        )}

                        {/* Recommended Actions */}
                        {alert.metadata?.recommended_actions && (
                          <div className="mt-3 p-3 bg-white rounded border">
                            <h5 className="text-xs font-medium text-gray-700 mb-2">
                              Recommended Actions:
                            </h5>
                            <ul className="text-xs text-gray-600 space-y-1">
                              {alert.metadata.recommended_actions.map(
                                (action: string, index: number) => (
                                  <li key={index} className="flex items-start">
                                    <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-1.5 mr-2 flex-shrink-0" />
                                    {action}
                                  </li>
                                )
                              )}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          onActionPlanClick?.(alert.action_plan_id)
                        }
                        className="flex items-center"
                      >
                        View Plan
                        <ChevronRight className="w-3 h-3 ml-1" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDismissAlert(alert.id)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filteredAlerts.length === 0 && (
          <Card className="p-8 text-center">
            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No alerts
            </h3>
            <p className="text-gray-600">
              {dismissedAlerts.size > 0
                ? 'All alerts have been dismissed or filtered out'
                : 'All action plans are on track!'}
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
