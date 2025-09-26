/* eslint-disable react-hooks/exhaustive-deps */
/**
 * Enhanced survey management interface with comprehensive features
 */

'use client';

import React, { useState, useEffect, useCallback, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  FileText,
  Search,
  Calendar,
  Users,
  BarChart3,
  Eye,
  Edit,
  Copy,
  Archive,
  Download,
  Clock,
  CheckCircle,
  AlertCircle,
  Pause,
  Play,
  MoreHorizontal,
  SortAsc,
  SortDesc,
  Target,
  ArrowLeft,
  Share2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Pagination } from '@/components/ui/pagination';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/Progress';

import { getModuleColors } from '@/lib/module-colors';
import { cn } from '@/lib/utils';
import SurveyResultsComponent from '@/components/survey/SurveyResults';
import RealTimeTracker from '@/components/survey/RealTimeTracker';

// Survey Results Component
interface SurveyResultsProps {
  surveyId: string;
  onBack: () => void;
}

function SurveyResults({ surveyId, onBack }: SurveyResultsProps) {
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSurvey();
  }, [surveyId]);

  const fetchSurvey = async () => {
    try {
      const response = await fetch(`/api/surveys/${surveyId}`);
      if (response.ok) {
        const data = await response.json();
        setSurvey(data.survey);
      }
    } catch (error) {
      console.error('Failed to fetch survey:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportSurvey = async (surveyId: string) => {
    try {
      const response = await fetch(
        `/api/surveys/${surveyId}/export?format=csv&include_open_text=true`
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `survey_${surveyId}_results.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        console.error('Failed to export survey');
      }
    } catch (error) {
      console.error('Failed to export survey:', error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!survey) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Survey not found
        </h2>
        <p className="text-gray-600 mb-4">
          The survey you&apos;re looking for doesn&apos;t exist.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{survey.title}</h1>
          <p className="text-gray-600">Survey Results</p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline">
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button
            variant="outline"
            onClick={() => handleExportSurvey(surveyId)}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Survey Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Responses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {survey.response_count || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Completion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {survey.completion_rate?.toFixed(1) || '0.0'}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600 capitalize">
              {survey.status}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Results Content */}
      <Tabs
        defaultValue={survey.status === 'active' ? 'real-time' : 'results'}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-2">
          {survey.status === 'active' && (
            <TabsTrigger value="real-time" className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              Real-Time Tracking
            </TabsTrigger>
          )}
          <TabsTrigger value="results">
            Detailed Results & Analytics
          </TabsTrigger>
        </TabsList>

        {survey.status === 'active' && (
          <TabsContent value="real-time" className="space-y-6">
            <Card className="p-6">
              <RealTimeTracker surveyId={surveyId} />
            </Card>
          </TabsContent>
        )}

        <TabsContent value="results" className="space-y-6">
          <SurveyResultsComponent surveyId={surveyId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface Survey {
  _id: string;
  title: string;
  description: string;
  type: 'general_climate' | 'microclimate' | 'organizational_culture';
  status: 'draft' | 'active' | 'paused' | 'completed' | 'archived';
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at: string;
  created_by: {
    name: string;
    id: string;
  };
  target_departments: string[];
  target_responses: number;
  response_count: number;
  completion_rate: number;
  question_count: number;
  estimated_duration: number;
  tags: string[];
}

interface SurveyFilters {
  status: string;
  type: string;
  dateRange: string;
  department: string;
  createdBy: string;
}

interface SurveyManagementProps {
  userRole: string;
  companyId: string;
  departmentId?: string;
}

const SURVEY_TYPES = {
  general_climate: 'General Climate',
  microclimate: 'Microclimate',
  organizational_culture: 'Organizational Culture',
};

const SURVEY_STATUSES = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-800', icon: Edit },
  active: { label: 'Active', color: 'bg-green-100 text-green-800', icon: Play },
  paused: {
    label: 'Paused',
    color: 'bg-yellow-100 text-yellow-800',
    icon: Pause,
  },
  completed: {
    label: 'Completed',
    color: 'bg-blue-100 text-blue-800',
    icon: CheckCircle,
  },
  archived: {
    label: 'Archived',
    color: 'bg-gray-100 text-gray-600',
    icon: Archive,
  },
};

type SortField =
  | 'title'
  | 'created_at'
  | 'end_date'
  | 'response_count'
  | 'completion_rate';
type SortOrder = 'asc' | 'desc';

export function SurveyManagement({
  companyId,
  departmentId,
}: SurveyManagementProps) {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [filters, setFilters] = useState<SurveyFilters>({
    status: 'all',
    type: 'all',
    dateRange: 'all',
    department: 'all',
    createdBy: 'all',
  });
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [selectedSurveys, setSelectedSurveys] = useState<string[]>([]);
  const [currentView, setCurrentView] = useState<'list' | 'results'>('list');
  const [selectedSurveyId, setSelectedSurveyId] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  });

  const surveyColors = getModuleColors('survey');

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, [debouncedSearchQuery, filters.status, filters.type, filters.dateRange]);

  const fetchSurveys = useCallback(async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (companyId) params.append('company_id', companyId);
      if (departmentId) params.append('department_id', departmentId);
      if (debouncedSearchQuery) params.append('search', debouncedSearchQuery);
      if (filters.status !== 'all') params.append('status', filters.status);
      if (filters.type !== 'all') params.append('type', filters.type);

      const response = await fetch(`/api/surveys?${params.toString()}`);

      if (response.ok) {
        const data = await response.json();
        setSurveys(data.surveys || []);
        setPagination((prev) => ({
          ...prev,
          total: data.pagination.total,
          totalPages: data.pagination.pages,
        }));
      } else {
        console.error('Failed to fetch surveys');
      }
    } catch (error) {
      console.error('Failed to fetch surveys:', error);
    } finally {
      setLoading(false);
    }
  }, [
    companyId,
    departmentId,
    pagination.page,
    pagination.limit,
    debouncedSearchQuery,
    filters.status,
    filters.type,
  ]);

  // Fetch surveys when pagination or filters change
  useEffect(() => {
    fetchSurveys();
  }, [fetchSurveys]);

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  };

  const handleLimitChange = (limit: number) => {
    setPagination((prev) => ({ ...prev, limit, page: 1 }));
  };

  const handleCreateSurvey = () => {
    // Navigate to survey creation page
    window.location.href = '/surveys/create';
  };

  const handleSurveyAction = async (surveyId: string, action: string) => {
    // Handle navigation actions
    if (action === 'view') {
      window.location.href = `/surveys/${surveyId}`;
      return;
    }

    if (action === 'results') {
      setSelectedSurveyId(surveyId);
      setCurrentView('results');
      return;
    }

    // Handle export action
    if (action === 'export') {
      try {
        const response = await fetch(
          `/api/surveys/${surveyId}/export?format=csv&include_open_text=true`
        );

        if (response.ok) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `survey_${surveyId}_results.csv`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        } else {
          console.error('Failed to export survey:', await response.text());
        }
      } catch (error) {
        console.error('Failed to export survey:', error);
      }
      return;
    }

    // Handle API actions for other operations
    try {
      const response = await fetch(`/api/surveys/${surveyId}/${action}`, {
        method: 'POST',
      });

      if (response.ok) {
        fetchSurveys(); // Refresh the list
      }
    } catch (error) {
      console.error(`Failed to ${action} survey:`, error);
    }
  };

  const handleBackToList = () => {
    setCurrentView('list');
    setSelectedSurveyId(null);
  };

  const handleBulkAction = async (action: string) => {
    if (selectedSurveys.length === 0) return;

    // Handle bulk export separately
    if (action === 'export') {
      try {
        // Export each survey individually and combine
        const exportPromises = selectedSurveys.map(async (surveyId) => {
          const response = await fetch(
            `/api/surveys/${surveyId}/export?format=json&include_open_text=true`
          );
          if (response.ok) {
            return await response.json();
          }
          throw new Error(`Failed to export survey ${surveyId}`);
        });

        const exportData = await Promise.all(exportPromises);

        // Create combined export
        const combinedData = {
          export_type: 'bulk_export',
          exported_at: new Date(),
          surveys: exportData,
          total_surveys: exportData.length,
        };

        // Download as JSON file
        const blob = new Blob([JSON.stringify(combinedData, null, 2)], {
          type: 'application/json',
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bulk_survey_export_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        setSelectedSurveys([]);
      } catch (error) {
        console.error('Failed to export surveys:', error);
      }
      return;
    }

    try {
      const response = await fetch('/api/surveys/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: action,
          survey_ids: selectedSurveys,
        }),
      });

      if (response.ok) {
        setSelectedSurveys([]);
        fetchSurveys();
      }
    } catch (error) {
      console.error(`Failed to ${action} surveys:`, error);
    }
  };

  const toggleSurveySelection = (surveyId: string) => {
    setSelectedSurveys((prev) =>
      prev.includes(surveyId)
        ? prev.filter((id) => id !== surveyId)
        : [...prev, surveyId]
    );
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const getStatusIcon = (status: string) => {
    const statusConfig =
      SURVEY_STATUSES[status as keyof typeof SURVEY_STATUSES];
    const Icon = statusConfig?.icon || AlertCircle;
    return <Icon className="h-4 w-4" />;
  };

  const ongoingSurveys = surveys.filter((s) => s.status === 'active');
  const pastSurveys = surveys.filter((s) =>
    ['completed', 'archived'].includes(s.status)
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Render results view if selected
  if (currentView === 'results' && selectedSurveyId) {
    return (
      <SurveyResults surveyId={selectedSurveyId} onBack={handleBackToList} />
    );
  }

  return (
    <div className="space-y-6">
      {/* Modern Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-xl">
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Survey Management
                </h1>
                <p className="text-gray-600 mt-1">
                  Create, manage, and track your organizational surveys
                </p>
              </div>
            </div>

            <div className="flex items-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>{ongoingSurveys.length} Active</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span>{pastSurveys.length} Completed</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                <span>{pagination.total} Total</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              className="flex items-center gap-2 bg-white"
              onClick={() => handleBulkAction('export')}
            >
              <Download className="h-4 w-4" />
              Export Data
            </Button>
            <Button
              onClick={handleCreateSurvey}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Create New Survey
            </Button>
          </div>
        </div>
      </div>

      {/* Enhanced Search and Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Enhanced Search */}
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search surveys by title, description, or tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-12 text-base border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              {/* Modern Filters */}
              <div className="flex flex-wrap gap-3">
                <Select
                  value={filters.status}
                  onValueChange={(value) =>
                    setFilters((prev) => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger className="w-40 h-12 border-gray-200">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    {Object.entries(SURVEY_STATUSES).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(key)}
                          {config.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={filters.type}
                  onValueChange={(value) =>
                    setFilters((prev) => ({ ...prev, type: value }))
                  }
                >
                  <SelectTrigger className="w-48 h-12 border-gray-200">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {Object.entries(SURVEY_TYPES).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={filters.dateRange}
                  onValueChange={(value) =>
                    setFilters((prev) => ({ ...prev, dateRange: value }))
                  }
                >
                  <SelectTrigger className="w-40 h-12 border-gray-200">
                    <SelectValue placeholder="All Time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="week">Last Week</SelectItem>
                    <SelectItem value="month">Last Month</SelectItem>
                    <SelectItem value="quarter">Last Quarter</SelectItem>
                    <SelectItem value="year">Last Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Active Filters Display */}
            {(searchQuery ||
              Object.values(filters).some((f) => f !== 'all')) && (
              <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-100">
                {searchQuery && (
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-2 px-3 py-1"
                  >
                    <Search className="h-3 w-3" />
                    &quot;{searchQuery}&quot;
                    <button
                      onClick={() => setSearchQuery('')}
                      className="ml-1 hover:bg-gray-200 rounded-full w-4 h-4 flex items-center justify-center text-xs"
                    >
                      ×
                    </button>
                  </Badge>
                )}
                {Object.entries(filters).map(
                  ([key, value]) =>
                    value !== 'all' && (
                      <Badge
                        key={key}
                        variant="outline"
                        className="flex items-center gap-2 px-3 py-1"
                      >
                        {key.charAt(0).toUpperCase() + key.slice(1)}: {value}
                        <button
                          onClick={() =>
                            setFilters((prev) => ({ ...prev, [key]: 'all' }))
                          }
                          className="ml-1 hover:bg-gray-200 rounded-full w-4 h-4 flex items-center justify-center text-xs"
                        >
                          ×
                        </button>
                      </Badge>
                    )
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('');
                    setFilters({
                      status: 'all',
                      type: 'all',
                      dateRange: 'all',
                      department: 'all',
                      createdBy: 'all',
                    });
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  Clear all
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedSurveys.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg"
        >
          <span className="text-sm font-medium">
            {selectedSurveys.length} survey
            {selectedSurveys.length > 1 ? 's' : ''} selected
          </span>
          <div className="flex gap-2 ml-auto">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBulkAction('archive')}
            >
              <Archive className="h-3 w-3 mr-1" />
              Archive
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBulkAction('export')}
            >
              <Download className="h-3 w-3 mr-1" />
              Export
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSelectedSurveys([])}
            >
              Cancel
            </Button>
          </div>
        </motion.div>
      )}

      {/* Enhanced Survey Tabs */}
      <Tabs defaultValue="ongoing" className="space-y-8">
        <div className="border-b border-gray-200">
          <TabsList className="bg-transparent h-auto p-0 space-x-8">
            <TabsTrigger
              value="ongoing"
              className="bg-transparent border-b-2 border-transparent data-[state=active]:border-green-500 data-[state=active]:bg-transparent rounded-none px-0 pb-4"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Play className="h-4 w-4 text-green-600" />
                </div>
                <div className="text-left">
                  <div className="font-medium">Active Surveys</div>
                  <div className="text-sm text-gray-500">
                    {ongoingSurveys.length} ongoing
                  </div>
                </div>
              </div>
            </TabsTrigger>
            <TabsTrigger
              value="past"
              className="bg-transparent border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent rounded-none px-0 pb-4"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                </div>
                <div className="text-left">
                  <div className="font-medium">Completed</div>
                  <div className="text-sm text-gray-500">
                    {pastSurveys.length} finished
                  </div>
                </div>
              </div>
            </TabsTrigger>
            <TabsTrigger
              value="all"
              className="bg-transparent border-b-2 border-transparent data-[state=active]:border-purple-500 data-[state=active]:bg-transparent rounded-none px-0 pb-4"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <FileText className="h-4 w-4 text-purple-600" />
                </div>
                <div className="text-left">
                  <div className="font-medium">All Surveys</div>
                  <div className="text-sm text-gray-500">
                    {pagination.total} total
                  </div>
                </div>
              </div>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="ongoing" className="space-y-4">
          <SurveyGrid
            surveys={ongoingSurveys}
            selectedSurveys={selectedSurveys}
            onToggleSelection={toggleSurveySelection}
            onSurveyAction={handleSurveyAction}
            sortField={sortField}
            sortOrder={sortOrder}
            onSort={toggleSort}
            showProgress={true}
            onCreateSurvey={handleCreateSurvey}
          />
        </TabsContent>

        <TabsContent value="past" className="space-y-4">
          <SurveyGrid
            surveys={pastSurveys}
            selectedSurveys={selectedSurveys}
            onToggleSelection={toggleSurveySelection}
            onSurveyAction={handleSurveyAction}
            sortField={sortField}
            sortOrder={sortOrder}
            onSort={toggleSort}
            showProgress={false}
            onCreateSurvey={handleCreateSurvey}
          />
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          <SurveyGrid
            surveys={surveys}
            selectedSurveys={selectedSurveys}
            onToggleSelection={toggleSurveySelection}
            onSurveyAction={handleSurveyAction}
            sortField={sortField}
            sortOrder={sortOrder}
            onSort={toggleSort}
            showProgress={true}
            onCreateSurvey={handleCreateSurvey}
          />

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="mt-6">
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={handlePageChange}
                loading={loading}
                totalItems={pagination.total}
                itemsPerPage={pagination.limit}
              />
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface SurveyGridProps {
  surveys: Survey[];
  selectedSurveys: string[];
  onToggleSelection: (id: string) => void;
  onSurveyAction: (id: string, action: string) => void;
  sortField: SortField;
  sortOrder: SortOrder;
  onSort: (field: SortField) => void;
  showProgress: boolean;
  onCreateSurvey: () => void;
}

function SurveyGrid({
  surveys,
  selectedSurveys,
  onToggleSelection,
  onSurveyAction,
  sortField,
  sortOrder,
  onSort,
  showProgress,
  onCreateSurvey,
}: SurveyGridProps) {
  if (surveys.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="p-16 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <FileText className="h-10 w-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-3">
            No surveys found
          </h3>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            Try adjusting your filters or create a new survey to get started
            with collecting organizational insights.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={onCreateSurvey}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Create New Survey
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Sort Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-700">Sort by:</span>
          <div className="flex items-center gap-2">
            {(
              [
                'title',
                'created_at',
                'end_date',
                'response_count',
              ] as SortField[]
            ).map((field) => (
              <Button
                key={field}
                variant="ghost"
                size="sm"
                onClick={() => onSort(field)}
                className={cn(
                  'flex items-center gap-2 text-sm',
                  sortField === field && 'bg-blue-50 text-blue-600'
                )}
              >
                {field
                  .replace('_', ' ')
                  .replace(/\b\w/g, (l) => l.toUpperCase())}
                {sortField === field &&
                  (sortOrder === 'asc' ? (
                    <SortAsc className="h-3 w-3" />
                  ) : (
                    <SortDesc className="h-3 w-3" />
                  ))}
              </Button>
            ))}
          </div>
        </div>

        <div className="text-sm text-gray-500">
          Showing {surveys.length} survey{surveys.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Enhanced Survey Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <AnimatePresence>
          {surveys.map((survey, index) => (
            <motion.div
              key={survey._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.05 }}
            >
              <SurveyCard
                survey={survey}
                isSelected={selectedSurveys.includes(survey._id)}
                onToggleSelection={() => onToggleSelection(survey._id)}
                onAction={onSurveyAction}
                showProgress={showProgress}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

interface SurveyCardProps {
  survey: Survey;
  isSelected: boolean;
  onToggleSelection: () => void;
  onAction: (id: string, action: string) => void;
  showProgress: boolean;
}

function SurveyCard({
  survey,
  isSelected,
  onToggleSelection,
  onAction,
  showProgress,
}: SurveyCardProps) {
  const statusConfig =
    SURVEY_STATUSES[survey.status as keyof typeof SURVEY_STATUSES];

  const getStatusGradient = (status: string) => {
    switch (status) {
      case 'active':
        return 'from-green-50 to-green-100 border-green-200';
      case 'draft':
        return 'from-gray-50 to-gray-100 border-gray-200';
      case 'paused':
        return 'from-yellow-50 to-yellow-100 border-yellow-200';
      case 'completed':
        return 'from-blue-50 to-blue-100 border-blue-200';
      case 'archived':
        return 'from-gray-50 to-gray-100 border-gray-200';
      default:
        return 'from-gray-50 to-gray-100 border-gray-200';
    }
  };

  return (
    <Card
      className={cn(
        'group cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-0 shadow-sm bg-gradient-to-br',
        getStatusGradient(survey.status),
        isSelected && 'ring-2 ring-blue-500 ring-offset-2 shadow-lg'
      )}
    >
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4 flex-1">
            <SurveySelectionCheckbox
              checked={isSelected}
              onCheckedChange={(checked) => {
                const event = {
                  target: { checked },
                } as React.ChangeEvent<HTMLInputElement>;
                onToggleSelection();
              }}
              onClick={(e) => e.stopPropagation()}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <Badge
                  className={cn(
                    'flex items-center gap-1 text-xs',
                    statusConfig?.color
                  )}
                >
                  {statusConfig?.label}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {SURVEY_TYPES[survey.type as keyof typeof SURVEY_TYPES]}
                </Badge>
              </div>
              <CardTitle className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                {survey.title}
              </CardTitle>
              <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                {survey.description || 'No description provided'}
              </p>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => onAction(survey._id, 'view')}>
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAction(survey._id, 'edit')}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Survey
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onAction(survey._id, 'duplicate')}
              >
                <Copy className="h-4 w-4 mr-2" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onAction(survey._id, 'export')}>
                <Download className="h-4 w-4 mr-2" />
                Export Results
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onAction(survey._id, 'archive')}
                className="text-red-600"
              >
                <Archive className="h-4 w-4 mr-2" />
                Archive
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Enhanced Progress for active surveys */}
        {showProgress && survey.status === 'active' && (
          <div className="bg-white/60 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between text-sm font-medium">
              <span className="text-gray-700">Survey Progress</span>
              <span className="text-green-600">
                {survey.completion_rate?.toFixed(1) || '0.0'}%
              </span>
            </div>
            <Progress
              value={survey.completion_rate || 0}
              className="h-3 bg-white"
            />
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {survey.response_count || 0} responses
              </span>
              <span className="flex items-center gap-1">
                <Target className="h-3 w-3" />
                Target: {survey.target_responses || 0}
              </span>
            </div>
          </div>
        )}

        {/* Enhanced Metadata */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar className="h-4 w-4" />
              <span>
                {survey.status === 'active'
                  ? `Ends ${new Date(survey.end_date).toLocaleDateString()}`
                  : `Created ${new Date(survey.created_at).toLocaleDateString()}`}
              </span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Users className="h-4 w-4" />
              <span>{survey.created_by.name}</span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-gray-600">
              <Clock className="h-4 w-4" />
              <span>~{survey.estimated_duration} min</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <BarChart3 className="h-4 w-4" />
              <span>{survey.question_count || 0} questions</span>
            </div>
          </div>
        </div>

        {/* Tags */}
        {survey.tags && survey.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {survey.tags.slice(0, 3).map((tag, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="text-xs bg-white/60"
              >
                {tag}
              </Badge>
            ))}
            {survey.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs bg-white/60">
                +{survey.tags.length - 3} more
              </Badge>
            )}
          </div>
        )}

        {/* Enhanced Quick Actions */}
        <div className="flex gap-2 pt-4 border-t border-white/50">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 bg-white/60 hover:bg-white border-white/50"
            onClick={() => onAction(survey._id, 'view')}
          >
            <Eye className="h-4 w-4 mr-2" />
            View
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1 bg-white/60 hover:bg-white border-white/50"
            onClick={() => onAction(survey._id, 'results')}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Results
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Survey selection checkbox component
interface SurveySelectionCheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  onClick?: (e: React.MouseEvent) => void;
}

function SurveySelectionCheckbox({
  checked,
  onCheckedChange,
  onClick,
}: SurveySelectionCheckboxProps) {
  const checkboxId = useId();

  return (
    <div className="flex items-center gap-2 mt-1" onClick={onClick}>
      <Checkbox
        id={checkboxId}
        checked={checked}
        onCheckedChange={onCheckedChange}
        className="w-4 h-4"
      />
      <Label htmlFor={checkboxId} className="sr-only">
        Select survey
      </Label>
    </div>
  );
}
