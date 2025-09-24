'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { redirect } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import {
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar,
  ArrowRight,
  Filter,
  Search,
  RefreshCw,
} from 'lucide-react';
import { Input } from '@/components/ui/input';

interface Survey {
  _id: string;
  title: string;
  description?: string;
  status: 'draft' | 'active' | 'completed' | 'archived';
  type: 'engagement' | 'pulse' | 'exit' | 'onboarding' | 'custom';
  created_at: string;
  expires_at?: string;
  response_count: number;
  target_responses: number;
  completion_rate: number;
  is_assigned_to_me: boolean;
  my_response_status: 'not_started' | 'in_progress' | 'completed';
  my_response_id?: string;
  estimated_duration: number;
  priority: 'low' | 'medium' | 'high';
}

export default function MySurveysPage() {
  const { user } = useAuth();
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Redirect if user is not an employee
  if (!user || user.role !== 'employee') {
    redirect('/dashboard');
  }

  const loadMySurveys = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/surveys/my');
      if (!response.ok) throw new Error('Failed to load surveys');

      const data = await response.json();
      setSurveys(data.surveys || []);
    } catch (error) {
      console.error('Error loading my surveys:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMySurveys();
  }, [loadMySurveys]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadMySurveys();
    setRefreshing(false);
  };

  const filteredSurveys = surveys.filter((survey) => {
    const matchesSearch =
      survey.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      survey.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' || survey.my_response_status === statusFilter;
    const matchesType = typeFilter === 'all' || survey.type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            Completed
          </Badge>
        );
      case 'in_progress':
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            In Progress
          </Badge>
        );
      case 'not_started':
        return <Badge variant="outline">Not Started</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive">High Priority</Badge>;
      case 'medium':
        return <Badge variant="secondary">Medium Priority</Badge>;
      case 'low':
        return <Badge variant="outline">Low Priority</Badge>;
      default:
        return null;
    }
  };

  const getTypeIcon = (type: string) => {
    return FileText; // Could be expanded with different icons per type
  };

  const handleStartSurvey = (surveyId: string) => {
    window.location.href = `/survey/${surveyId}`;
  };

  const handleContinueSurvey = (surveyId: string, responseId: string) => {
    window.location.href = `/survey/${surveyId}?response=${responseId}`;
  };

  const handleViewResults = (surveyId: string) => {
    window.location.href = `/surveys/${surveyId}/results`;
  };

  const pendingSurveys = filteredSurveys.filter(
    (s) => s.my_response_status !== 'completed'
  );
  const completedSurveys = filteredSurveys.filter(
    (s) => s.my_response_status === 'completed'
  );

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <LoadingSpinner />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
                <FileText className="h-8 w-8" />
                My Surveys
              </h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1">
                Surveys assigned to you and your participation history
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={refreshing}
                className="w-full sm:w-auto"
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`}
                />
                Refresh
              </Button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6">
            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-600">
                      Pending Surveys
                    </p>
                    <p className="text-xl sm:text-2xl font-bold text-orange-600">
                      {pendingSurveys.length}
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-600">
                      Completed
                    </p>
                    <p className="text-xl sm:text-2xl font-bold text-green-600">
                      {completedSurveys.length}
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-600">
                      Total Surveys
                    </p>
                    <p className="text-xl sm:text-2xl font-bold text-blue-600">
                      {filteredSurveys.length}
                    </p>
                  </div>
                  <FileText className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search surveys..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="not_started">Not Started</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Types</option>
                  <option value="engagement">Engagement</option>
                  <option value="pulse">Pulse</option>
                  <option value="exit">Exit</option>
                  <option value="onboarding">Onboarding</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Surveys List */}
          {filteredSurveys.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No surveys found
                </h3>
                <p className="text-gray-600">
                  {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                    ? 'Try adjusting your filters to see more surveys.'
                    : "You don't have any surveys assigned at the moment."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredSurveys.map((survey) => {
                const TypeIcon = getTypeIcon(survey.type);
                const isExpiringSoon =
                  survey.expires_at &&
                  new Date(survey.expires_at) <
                    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

                return (
                  <Card
                    key={survey._id}
                    className="hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          <TypeIcon className="h-6 w-6 text-blue-600 mt-1" />
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900">
                                {survey.title}
                              </h3>
                              {getStatusBadge(survey.my_response_status)}
                              {getPriorityBadge(survey.priority)}
                              {isExpiringSoon && (
                                <Badge
                                  variant="destructive"
                                  className="flex items-center gap-1"
                                >
                                  <AlertCircle className="h-3 w-3" />
                                  Expires Soon
                                </Badge>
                              )}
                            </div>
                            {survey.description && (
                              <p className="text-sm text-gray-600 mb-2">
                                {survey.description}
                              </p>
                            )}
                            <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Created{' '}
                                {new Date(
                                  survey.created_at
                                ).toLocaleDateString()}
                              </span>
                              {survey.expires_at && (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  Expires{' '}
                                  {new Date(
                                    survey.expires_at
                                  ).toLocaleDateString()}
                                </span>
                              )}
                              <span>Est. {survey.estimated_duration} min</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2 sm:ml-4">
                          {survey.my_response_status === 'not_started' && (
                            <Button
                              onClick={() => handleStartSurvey(survey._id)}
                              className="w-full sm:w-auto"
                            >
                              Start Survey
                              <ArrowRight className="h-4 w-4 ml-2" />
                            </Button>
                          )}
                          {survey.my_response_status === 'in_progress' && (
                            <Button
                              onClick={() =>
                                handleContinueSurvey(
                                  survey._id,
                                  survey.my_response_id!
                                )
                              }
                              className="w-full sm:w-auto"
                            >
                              Continue
                              <ArrowRight className="h-4 w-4 ml-2" />
                            </Button>
                          )}
                          {survey.my_response_status === 'completed' && (
                            <Button
                              variant="outline"
                              onClick={() => handleViewResults(survey._id)}
                              className="w-full sm:w-auto"
                            >
                              View Results
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
