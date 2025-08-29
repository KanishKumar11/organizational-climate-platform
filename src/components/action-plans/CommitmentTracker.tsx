'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Loading } from '@/components/ui/Loading';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  MessageSquare,
  Calendar,
  Filter,
  Refresh,
  Send,
  User,
} from 'lucide-react';

interface Commitment {
  id: string;
  action_plan_id: string;
  action_plan_title: string;
  action_plan_priority: string;
  action_plan_status: string;
  assigned_user: {
    _id: string;
    name: string;
    email: string;
  };
  due_date: string;
  created_at: string;
  progress: number;
  commitment_score: number;
  is_overdue: boolean;
  days_until_due: number;
  last_update: string | null;
  nudges: string[];
  success_prediction: {
    likelihood: number;
    confidence: number;
    factors: string[];
  };
  recommended_interventions: string[];
}

interface CommitmentTrackerProps {
  companyId?: string;
  departmentId?: string;
  userId?: string;
  onActionPlanClick?: (actionPlanId: string) => void;
  onSendNudge?: (
    commitment: Commitment,
    nudgeType: string,
    message: string
  ) => void;
}

export function CommitmentTracker({
  companyId,
  departmentId,
  userId,
  onActionPlanClick,
  onSendNudge,
}: CommitmentTrackerProps) {
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState('30');
  const [sortBy, setSortBy] = useState('commitment_score');
  const [selectedCommitment, setSelectedCommitment] =
    useState<Commitment | null>(null);
  const [nudgeMessage, setNudgeMessage] = useState('');
  const [sendingNudge, setSendingNudge] = useState(false);

  useEffect(() => {
    fetchCommitments();
  }, [companyId, departmentId, userId, timeframe]);

  const fetchCommitments = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (userId) params.append('user_id', userId);
      if (timeframe) params.append('timeframe', timeframe);

      const response = await fetch(`/api/action-plans/commitments?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch commitments');
      }

      const data = await response.json();
      setCommitments(data.commitments);
      setSummary(data.summary);
    } catch (error) {
      console.error('Error fetching commitments:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to fetch commitments'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSendNudge = async (nudgeType: string) => {
    if (!selectedCommitment || !nudgeMessage.trim()) return;

    setSendingNudge(true);
    try {
      const response = await fetch('/api/action-plans/commitments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action_plan_id: selectedCommitment.action_plan_id,
          user_id: selectedCommitment.assigned_user._id,
          nudge_type: nudgeType,
          message: nudgeMessage,
          auto_generated: false,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send nudge');
      }

      onSendNudge?.(selectedCommitment, nudgeType, nudgeMessage);
      setSelectedCommitment(null);
      setNudgeMessage('');
    } catch (error) {
      console.error('Error sending nudge:', error);
    } finally {
      setSendingNudge(false);
    }
  };

  const getCommitmentScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600 bg-green-100';
    if (score >= 0.6) return 'text-yellow-600 bg-yellow-100';
    if (score >= 0.4) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getSuccessLikelihoodColor = (likelihood: number) => {
    if (likelihood >= 0.8) return 'text-green-600';
    if (likelihood >= 0.6) return 'text-yellow-600';
    if (likelihood >= 0.4) return 'text-orange-600';
    return 'text-red-600';
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

  const sortedCommitments = [...commitments].sort((a, b) => {
    switch (sortBy) {
      case 'commitment_score':
        return a.commitment_score - b.commitment_score; // Lowest first (needs attention)
      case 'due_date':
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      case 'progress':
        return b.progress - a.progress; // Highest first
      case 'success_likelihood':
        return (
          a.success_prediction.likelihood - b.success_prediction.likelihood
        ); // Lowest first
      default:
        return 0;
    }
  });

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
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchCommitments} variant="outline">
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
          <Users className="w-6 h-6 text-blue-600 mr-2" />
          <h2 className="text-xl font-bold text-gray-900">
            Commitment Tracking
          </h2>
          {summary && (
            <Badge variant="secondary" className="ml-3">
              {summary.total_commitments} commitments
            </Badge>
          )}
        </div>
        <Button
          onClick={fetchCommitments}
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
              {summary.overdue}
            </div>
            <div className="text-sm text-gray-600">Overdue</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">
              {summary.at_risk}
            </div>
            <div className="text-sm text-gray-600">At Risk</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {summary.on_track}
            </div>
            <div className="text-sm text-gray-600">On Track</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {summary.needs_nudge}
            </div>
            <div className="text-sm text-gray-600">Needs Nudge</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-600">
              {summary.average_progress}%
            </div>
            <div className="text-sm text-gray-600">Avg Progress</div>
          </Card>
        </div>
      )}

      {/* Filters and Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 text-sm"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="60">Last 60 days</option>
            <option value="90">Last 90 days</option>
          </select>
        </div>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 text-sm"
        >
          <option value="commitment_score">
            Commitment Score (Low to High)
          </option>
          <option value="due_date">Due Date</option>
          <option value="progress">Progress (High to Low)</option>
          <option value="success_likelihood">
            Success Likelihood (Low to High)
          </option>
        </select>
      </div>

      {/* Commitments List */}
      <div className="space-y-4">
        <AnimatePresence>
          {sortedCommitments.map((commitment) => (
            <motion.div
              key={commitment.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              layout
            >
              <Card className="p-4">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="flex items-center">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                          commitment.commitment_score >= 0.8
                            ? 'bg-green-500'
                            : commitment.commitment_score >= 0.6
                              ? 'bg-yellow-500'
                              : commitment.commitment_score >= 0.4
                                ? 'bg-orange-500'
                                : 'bg-red-500'
                        }`}
                      >
                        {commitment.assigned_user.name.charAt(0).toUpperCase()}
                      </div>
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-medium text-gray-900">
                          {commitment.assigned_user.name}
                        </h4>
                        <div
                          className={`w-2 h-2 rounded-full ${getPriorityColor(commitment.action_plan_priority)}`}
                        />
                        <Badge variant="outline" className="text-xs">
                          {commitment.action_plan_status.replace('_', ' ')}
                        </Badge>
                      </div>

                      <p className="text-sm text-gray-600 mb-2">
                        {commitment.action_plan_title}
                      </p>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-gray-500 mb-3">
                        <div className="flex items-center">
                          <Target className="w-3 h-3 mr-1" />
                          {commitment.progress}% complete
                        </div>
                        <div className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {commitment.is_overdue
                            ? 'Overdue'
                            : commitment.days_until_due === 0
                              ? 'Due today'
                              : commitment.days_until_due === 1
                                ? 'Due tomorrow'
                                : `${commitment.days_until_due} days left`}
                        </div>
                        <div className="flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {commitment.last_update
                            ? `Updated ${new Date(commitment.last_update).toLocaleDateString()}`
                            : 'No updates'}
                        </div>
                        <div
                          className={`flex items-center font-medium ${getSuccessLikelihoodColor(commitment.success_prediction.likelihood)}`}
                        >
                          {commitment.success_prediction.likelihood >= 0.6 ? (
                            <TrendingUp className="w-3 h-3 mr-1" />
                          ) : (
                            <TrendingDown className="w-3 h-3 mr-1" />
                          )}
                          {Math.round(
                            commitment.success_prediction.likelihood * 100
                          )}
                          % success
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-3">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Progress</span>
                          <span>{commitment.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${
                              commitment.progress >= 80
                                ? 'bg-green-600'
                                : commitment.progress >= 60
                                  ? 'bg-blue-600'
                                  : commitment.progress >= 40
                                    ? 'bg-yellow-600'
                                    : 'bg-red-600'
                            }`}
                            style={{ width: `${commitment.progress}%` }}
                          />
                        </div>
                      </div>

                      {/* Nudges */}
                      {commitment.nudges.length > 0 && (
                        <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <h5 className="text-xs font-medium text-yellow-800 mb-2">
                            Suggested Nudges:
                          </h5>
                          <ul className="text-xs text-yellow-700 space-y-1">
                            {commitment.nudges.map((nudge, index) => (
                              <li key={index} className="flex items-start">
                                <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full mt-1.5 mr-2 flex-shrink-0" />
                                {nudge}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Interventions */}
                      {commitment.recommended_interventions.length > 0 && (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <h5 className="text-xs font-medium text-blue-800 mb-2">
                            Recommended Interventions:
                          </h5>
                          <ul className="text-xs text-blue-700 space-y-1">
                            {commitment.recommended_interventions
                              .slice(0, 2)
                              .map((intervention, index) => (
                                <li key={index} className="flex items-start">
                                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 mr-2 flex-shrink-0" />
                                  {intervention}
                                </li>
                              ))}
                            {commitment.recommended_interventions.length >
                              2 && (
                              <li className="text-blue-600">
                                +
                                {commitment.recommended_interventions.length -
                                  2}{' '}
                                more interventions
                              </li>
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end space-y-2">
                    <Badge
                      className={`text-xs ${getCommitmentScoreColor(commitment.commitment_score)}`}
                    >
                      Score: {Math.round(commitment.commitment_score * 100)}%
                    </Badge>

                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          onActionPlanClick?.(commitment.action_plan_id)
                        }
                      >
                        View Plan
                      </Button>

                      {commitment.nudges.length > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedCommitment(commitment)}
                          className="flex items-center"
                        >
                          <MessageSquare className="w-3 h-3 mr-1" />
                          Send Nudge
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>

        {sortedCommitments.length === 0 && (
          <Card className="p-8 text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              All commitments on track!
            </h3>
            <p className="text-gray-600">
              No commitments need attention at this time.
            </p>
          </Card>
        )}
      </div>

      {/* Nudge Modal */}
      <AnimatePresence>
        {selectedCommitment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg p-6 max-w-md w-full"
            >
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Send Nudge to {selectedCommitment.assigned_user.name}
              </h3>

              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  Action Plan: {selectedCommitment.action_plan_title}
                </p>
                <p className="text-sm text-gray-600">
                  Progress: {selectedCommitment.progress}% • Commitment Score:{' '}
                  {Math.round(selectedCommitment.commitment_score * 100)}%
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message
                </label>
                <textarea
                  value={nudgeMessage}
                  onChange={(e) => setNudgeMessage(e.target.value)}
                  placeholder="Enter your message..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setSelectedCommitment(null)}
                  disabled={sendingNudge}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handleSendNudge('reminder')}
                  disabled={!nudgeMessage.trim() || sendingNudge}
                  className="flex items-center"
                >
                  {sendingNudge ? (
                    <Loading size="sm" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  Send Nudge
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
