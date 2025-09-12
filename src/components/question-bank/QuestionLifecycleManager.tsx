'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loading } from '@/components/ui/Loading';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertTriangle,
  Archive,
  RotateCcw,
  Pause,
  Play,
  TrendingDown,
  TrendingUp,
  Clock,
  Users,
  BarChart3,
  CheckCircle,
  XCircle,
} from 'lucide-react';

interface Question {
  _id: string;
  text: string;
  category: string;
  subcategory?: string;
  type: string;
  metrics: {
    usage_count: number;
    response_rate: number;
    insight_score: number;
    last_used?: string;
  };
  is_active: boolean;
  deprecated_at?: string;
  archived_at?: string;
  created_at: string;
  updated_at: string;
}

interface LifecycleStats {
  overview: {
    total: number;
    active: number;
    deprecated: number;
    archived: number;
    ai_generated: number;
    human_created: number;
    avg_effectiveness: number;
    total_usage: number;
  };
  category_breakdown: Array<{
    _id: string;
    total: number;
    active: number;
    deprecated: number;
    archived: number;
  }>;
  recent_changes: Array<{
    _id: string;
    text: string;
    category: string;
    deprecated_at?: string;
    archived_at?: string;
    deprecation_reason?: string;
    archive_reason?: string;
  }>;
}

interface QuestionLifecycleManagerProps {
  userRole: string;
  companyId?: string;
}

export default function QuestionLifecycleManager({
  userRole,
  companyId,
}: QuestionLifecycleManagerProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [stats, setStats] = useState<LifecycleStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(
    new Set()
  );
  const [bulkAction, setBulkAction] = useState<string>('');
  const [bulkReason, setBulkReason] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [processing, setProcessing] = useState(false);

  const statusOptions = [
    { value: 'all', label: 'All Questions' },
    { value: 'active', label: 'Active' },
    { value: 'deprecated', label: 'Deprecated' },
    { value: 'archived', label: 'Archived' },
  ];

  const bulkActions = [
    {
      value: 'activate',
      label: 'Activate',
      icon: Play,
      color: 'text-green-600',
    },
    {
      value: 'deprecate',
      label: 'Deprecate',
      icon: Pause,
      color: 'text-yellow-600',
    },
    {
      value: 'archive',
      label: 'Archive',
      icon: Archive,
      color: 'text-red-600',
    },
    {
      value: 'restore',
      label: 'Restore',
      icon: RotateCcw,
      color: 'text-blue-600',
    },
  ];

  useEffect(() => {
    fetchQuestions();
  }, [statusFilter, categoryFilter, currentPage]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
      });

      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (categoryFilter) params.append('category', categoryFilter);

      const response = await fetch(`/api/question-bank/lifecycle?${params}`);
      if (response.ok) {
        const data = await response.json();
        setQuestions(data.questions);
        setTotalPages(data.pagination.pages);
        setStats(data.statistics);
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuestionSelect = (questionId: string, selected: boolean) => {
    const newSelected = new Set(selectedQuestions);
    if (selected) {
      newSelected.add(questionId);
    } else {
      newSelected.delete(questionId);
    }
    setSelectedQuestions(newSelected);
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedQuestions(new Set(questions.map((q) => q._id)));
    } else {
      setSelectedQuestions(new Set());
    }
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedQuestions.size === 0) return;

    try {
      setProcessing(true);
      const response = await fetch('/api/question-bank/lifecycle', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question_ids: Array.from(selectedQuestions),
          action: bulkAction,
          reason: bulkReason,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log(
          `Successfully ${bulkAction}d ${result.modified_count} questions`
        );
        setSelectedQuestions(new Set());
        setBulkAction('');
        setBulkReason('');
        fetchQuestions();
      }
    } catch (error) {
      console.error('Error performing bulk action:', error);
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (question: Question) => {
    if (question.archived_at) {
      return <Badge className="bg-red-100 text-red-800">Archived</Badge>;
    }
    if (question.deprecated_at) {
      return (
        <Badge className="bg-yellow-100 text-yellow-800">Deprecated</Badge>
      );
    }
    if (question.is_active) {
      return <Badge className="bg-green-100 text-green-800">Active</Badge>;
    }
    return <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>;
  };

  const getEffectivenessIcon = (score: number) => {
    if (score >= 7) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (score >= 5) return <BarChart3 className="w-4 h-4 text-yellow-600" />;
    return <TrendingDown className="w-4 h-4 text-red-600" />;
  };

  const getUsageIcon = (count: number) => {
    if (count === 0) return <XCircle className="w-4 h-4 text-red-600" />;
    if (count > 20) return <CheckCircle className="w-4 h-4 text-green-600" />;
    return <Users className="w-4 h-4 text-yellow-600" />;
  };

  const canManageLifecycle = ['super_admin', 'company_admin'].includes(
    userRole
  );

  if (loading && questions.length === 0) {
    return <Loading />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Question Lifecycle Management
          </h1>
          <p className="text-gray-600">
            Manage question status, track effectiveness, and optimize your
            question pool
          </p>
        </div>
      </div>

      {/* Statistics Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Questions
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.overview.total}
                </p>
              </div>
              <BarChart3 className="w-8 h-8 text-blue-600" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.overview.active}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Deprecated</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {stats.overview.deprecated}
                </p>
              </div>
              <Pause className="w-8 h-8 text-yellow-600" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Archived</p>
                <p className="text-2xl font-bold text-red-600">
                  {stats.overview.archived}
                </p>
              </div>
              <Archive className="w-8 h-8 text-red-600" />
            </div>
          </Card>
        </div>
      )}

      {/* Filters and Bulk Actions */}
      <Card className="p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status Filter
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category Filter
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="">All Categories</option>
                {stats?.category_breakdown.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat._id} ({cat.total})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {canManageLifecycle && selectedQuestions.size > 0 && (
            <div className="border-l border-gray-200 pl-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bulk Actions ({selectedQuestions.size} selected)
              </label>
              <div className="flex gap-2">
                <select
                  value={bulkAction}
                  onChange={(e) => setBulkAction(e.target.value)}
                  className="p-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select Action</option>
                  {bulkActions.map((action) => (
                    <option key={action.value} value={action.value}>
                      {action.label}
                    </option>
                  ))}
                </select>
                <Button
                  onClick={handleBulkAction}
                  disabled={!bulkAction || processing}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {processing ? 'Processing...' : 'Apply'}
                </Button>
              </div>
            </div>
          )}
        </div>

        {bulkAction && ['deprecate', 'archive'].includes(bulkAction) && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason (optional)
            </label>
            <Textarea
              value={bulkReason}
              onChange={(e) => setBulkReason(e.target.value)}
              placeholder={`Reason for ${bulkAction}ing these questions...`}
              className="w-full"
            />
          </div>
        )}
      </Card>

      {/* Questions List */}
      <div className="space-y-4">
        {canManageLifecycle && (
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
            <Checkbox
              checked={
                selectedQuestions.size === questions.length &&
                questions.length > 0
              }
              onCheckedChange={handleSelectAll}
            />
            <span className="text-sm font-medium text-gray-700">
              Select All ({questions.length} questions)
            </span>
          </div>
        )}

        {questions.map((question) => (
          <Card key={question._id} className="p-6">
            <div className="flex items-start gap-4">
              {canManageLifecycle && (
                <Checkbox
                  checked={selectedQuestions.has(question._id)}
                  onCheckedChange={(checked) =>
                    handleQuestionSelect(question._id, checked as boolean)
                  }
                />
              )}

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {getStatusBadge(question)}
                  <Badge variant="outline">{question.category}</Badge>
                  {question.subcategory && (
                    <Badge variant="outline" className="text-xs">
                      {question.subcategory}
                    </Badge>
                  )}
                </div>

                <p className="text-gray-900 font-medium mb-3">
                  {question.text}
                </p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    {getEffectivenessIcon(question.metrics.insight_score)}
                    <span className="text-gray-600">Effectiveness:</span>
                    <span className="font-medium">
                      {question.metrics.insight_score.toFixed(1)}/10
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getUsageIcon(question.metrics.usage_count)}
                    <span className="text-gray-600">Usage:</span>
                    <span className="font-medium">
                      {question.metrics.usage_count}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-blue-600" />
                    <span className="text-gray-600">Response Rate:</span>
                    <span className="font-medium">
                      {question.metrics.response_rate}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-600" />
                    <span className="text-gray-600">Last Used:</span>
                    <span className="font-medium">
                      {question.metrics.last_used
                        ? new Date(
                            question.metrics.last_used
                          ).toLocaleDateString()
                        : 'Never'}
                    </span>
                  </div>
                </div>

                {(question.deprecated_at || question.archived_at) && (
                  <div className="mt-3 p-3 bg-yellow-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-600" />
                      <span className="text-sm font-medium text-yellow-800">
                        {question.archived_at ? 'Archived' : 'Deprecated'} on{' '}
                        {new Date(
                          question.archived_at || question.deprecated_at!
                        ).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <span className="px-4 py-2 text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() =>
              setCurrentPage((prev) => Math.min(totalPages, prev + 1))
            }
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}

      {questions.length === 0 && !loading && (
        <Card className="p-8 text-center">
          <p className="text-gray-500">
            No questions found matching your criteria.
          </p>
        </Card>
      )}

      {/* Recent Changes */}
      {stats?.recent_changes && stats.recent_changes.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Lifecycle Changes
          </h3>
          <div className="space-y-3">
            {stats.recent_changes.slice(0, 5).map((change) => (
              <div
                key={change._id}
                className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex-shrink-0">
                  {change.archived_at ? (
                    <Archive className="w-4 h-4 text-red-600" />
                  ) : (
                    <Pause className="w-4 h-4 text-yellow-600" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-gray-900 font-medium">{change.text}</p>
                  <p className="text-sm text-gray-600">
                    {change.archived_at ? 'Archived' : 'Deprecated'} •{' '}
                    {change.category}
                  </p>
                  {(change.archive_reason || change.deprecation_reason) && (
                    <p className="text-sm text-gray-500 mt-1">
                      Reason:{' '}
                      {change.archive_reason || change.deprecation_reason}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
