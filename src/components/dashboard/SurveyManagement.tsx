/* eslint-disable react-hooks/exhaustive-deps */
/**
 * Enhanced survey management interface with comprehensive features
 */

'use client';

import React, { useState, useEffect, useCallback, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from '@/contexts/TranslationContext';
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
  const t = useTranslations('surveys');
  const common = useTranslations('common');

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
          <p className="text-gray-600">{t('surveyResults')}</p>
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
              {t('realTimeTracking')}
            </TabsTrigger>
          )}
          <TabsTrigger value="results">
            {t('detailedResultsAnalytics')}
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
  const t = useTranslations('surveys');
  const common = useTranslations('common');
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
  const [isSearching, setIsSearching] = useState(false);
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
    <div className="space-y-6 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 dark:from-slate-900 dark:via-blue-900/20 dark:to-indigo-900/20 min-h-screen">
      {/* Modern Header */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 p-4 sm:p-6 lg:p-8 xl:p-12 border border-blue-200/50 dark:border-blue-700/50">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="relative">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 sm:gap-6 lg:gap-8">
            <div className="space-y-4 sm:space-y-6 w-full lg:w-auto">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="p-2 sm:p-3 lg:p-4 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 rounded-xl sm:rounded-2xl shadow-lg ring-2 ring-white/20">
                  <FileText className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2 font-montserrat">
                    {t('surveyManagement')}
                  </h1>
                  <p className="text-sm sm:text-base lg:text-lg text-gray-600 dark:text-gray-300 font-montserrat">
                    {t('surveyManagementDesc')}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 lg:flex lg:flex-wrap items-center gap-3 sm:gap-4 lg:gap-6 text-xs sm:text-sm text-gray-600 dark:text-gray-300 font-montserrat">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full shadow-sm flex-shrink-0" />
                  <span className="font-medium truncate">
                    {ongoingSurveys.length} {t('activeSurveys')}
                  </span>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full shadow-sm flex-shrink-0" />
                  <span className="font-medium truncate">
                    {pastSurveys.length} {t('completedSurveys')}
                  </span>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full shadow-sm flex-shrink-0" />
                  <span className="font-medium truncate">
                    {pagination.total} {t('totalSurveys')}
                  </span>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-full shadow-sm flex-shrink-0" />
                  <span className="font-medium truncate">
                    {surveys.reduce(
                      (acc, s) => acc + (s.response_count || 0),
                      0
                    )}{' '}
                    {t('totalResponses')}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200 h-10 sm:h-12 px-4 sm:px-6 rounded-xl sm:rounded-2xl font-montserrat font-semibold text-sm sm:text-base"
                onClick={handleCreateSurvey}
              >
                <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                <span className="hidden xs:inline">{t('createNewSurvey')}</span>
                <span className="xs:hidden">Create</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Search and Filters */}
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50">
        <div className="p-4 sm:p-6">
          <div className="space-y-4">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Input
                  placeholder={t('searchSurveys')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-10 sm:h-12 w-full pr-12 sm:pr-16 text-sm sm:text-base border-2 border-blue-300 dark:border-blue-600 bg-white dark:bg-slate-800 backdrop-blur shadow-lg focus:shadow-xl focus:ring-4 focus:ring-blue-500/30 focus:border-blue-500 transition-all duration-300 rounded-xl sm:rounded-2xl font-montserrat"
                />
                <Button
                  onClick={() => setIsSearching(!isSearching)}
                  disabled={isSearching || !searchQuery.trim()}
                  className="absolute right-1 sm:right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 sm:h-8 sm:w-8 p-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200 rounded-lg sm:rounded-xl font-montserrat font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSearching ? (
                    <div className="animate-spin h-2.5 w-2.5 sm:h-3 sm:w-3 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <Search className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                  )}
                </Button>
              </div>

              {/* Modern Filters */}
              <div className="flex flex-wrap gap-3">
                <Select
                  value={filters.status}
                  onValueChange={(value) =>
                    setFilters((prev) => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger className="w-40 h-10 sm:h-12 border-2 border-blue-300 dark:border-blue-600 bg-white dark:bg-slate-800 backdrop-blur shadow-lg focus:shadow-xl focus:ring-4 focus:ring-blue-500/30 focus:border-blue-500 transition-all duration-300 rounded-xl sm:rounded-2xl font-montserrat">
                    <SelectValue placeholder={t('allStatus')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('allStatus')}</SelectItem>
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
                  <SelectTrigger className="w-48 h-10 sm:h-12 border-2 border-indigo-300 dark:border-indigo-600 bg-white dark:bg-slate-800 backdrop-blur shadow-lg focus:shadow-xl focus:ring-4 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all duration-300 rounded-xl sm:rounded-2xl font-montserrat">
                    <SelectValue placeholder={t('allTypes')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('allTypes')}</SelectItem>
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
                  <SelectTrigger className="w-40 h-10 sm:h-12 border-2 border-purple-300 dark:border-purple-600 bg-white dark:bg-slate-800 backdrop-blur shadow-lg focus:shadow-xl focus:ring-4 focus:ring-purple-500/30 focus:border-purple-500 transition-all duration-300 rounded-xl sm:rounded-2xl font-montserrat">
                    <SelectValue placeholder={t('allTime')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('allTime')}</SelectItem>
                    <SelectItem value="week">{t('lastWeek')}</SelectItem>
                    <SelectItem value="month">{t('lastMonth')}</SelectItem>
                    <SelectItem value="quarter">{t('lastQuarter')}</SelectItem>
                    <SelectItem value="year">{t('lastYear')}</SelectItem>
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
                  {t('clearAll')}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedSurveys.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg"
        >
          <span className="text-sm font-medium">
            {selectedSurveys.length}{' '}
            {selectedSurveys.length === 1
              ? t('surveySelected')
              : t('surveysSelected')}
          </span>
          <div className="flex gap-2 ml-auto">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBulkAction('archive')}
            >
              <Archive className="h-3 w-3 mr-1" />
              {t('archive')}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBulkAction('export')}
            >
              <Download className="h-3 w-3 mr-1" />
              {t('export')}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSelectedSurveys([])}
            >
              {t('cancel')}
            </Button>
          </div>
        </motion.div>
      )}

      {/* Enhanced Survey Tabs */}
      <Tabs defaultValue="ongoing" className="w-full">
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
          <TabsList className="grid w-full grid-cols-3 bg-transparent p-0 h-auto gap-0">
            <TabsTrigger
              value="ongoing"
              className="group relative flex items-center justify-center gap-1 sm:gap-2 py-3 sm:py-4 px-1 sm:px-2 rounded-none border-b-2 border-transparent data-[state=active]:border-green-500 data-[state=active]:bg-green-50/50 dark:data-[state=active]:bg-green-900/20 data-[state=active]:text-green-600 dark:data-[state=active]:text-green-400 transition-all duration-200 hover:bg-green-50/30 dark:hover:bg-green-900/10"
            >
              <Play className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 dark:text-green-400 group-data-[state=active]:text-green-600 dark:group-data-[state=active]:text-green-400" />
              <div className="text-center">
                <div className="font-semibold text-xs sm:text-sm font-montserrat text-gray-700 dark:text-gray-300 group-data-[state=active]:text-green-600 dark:group-data-[state=active]:text-green-400">
                  <span className="hidden xs:inline">{t('activeSurveys')}</span>
                  <span className="xs:hidden">Active</span>
                </div>
              </div>
            </TabsTrigger>
            <TabsTrigger
              value="past"
              className="group relative flex items-center justify-center gap-1 sm:gap-2 py-3 sm:py-4 px-1 sm:px-2 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-blue-50/50 dark:data-[state=active]:bg-blue-900/20 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 transition-all duration-200 hover:bg-blue-50/30 dark:hover:bg-blue-900/10"
            >
              <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500 dark:text-blue-400 group-data-[state=active]:text-blue-600 dark:group-data-[state=active]:text-blue-400" />
              <div className="text-center">
                <div className="font-semibold text-xs sm:text-sm font-montserrat text-gray-700 dark:text-gray-300 group-data-[state=active]:text-blue-600 dark:group-data-[state=active]:text-blue-400">
                  <span className="hidden xs:inline">
                    {common('completed')}
                  </span>
                  <span className="xs:hidden">Past</span>
                </div>
              </div>
            </TabsTrigger>
            <TabsTrigger
              value="all"
              className="group relative flex items-center justify-center gap-1 sm:gap-2 py-3 sm:py-4 px-1 sm:px-2 rounded-none border-b-2 border-transparent data-[state=active]:border-purple-500 data-[state=active]:bg-purple-50/50 dark:data-[state=active]:bg-purple-900/20 data-[state=active]:text-purple-600 dark:data-[state=active]:text-purple-400 transition-all duration-200 hover:bg-purple-50/30 dark:hover:bg-purple-900/10"
            >
              <FileText className="h-3 w-3 sm:h-4 sm:w-4 text-purple-500 dark:text-purple-400 group-data-[state=active]:text-purple-600 dark:group-data-[state=active]:text-purple-400" />
              <div className="text-center">
                <div className="font-semibold text-xs sm:text-sm font-montserrat text-gray-700 dark:text-gray-300 group-data-[state=active]:text-purple-600 dark:group-data-[state=active]:text-purple-400">
                  <span className="hidden xs:inline">{t('allSurveys')}</span>
                  <span className="xs:hidden">All</span>
                </div>
              </div>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab Content */}
        <div className="p-3 sm:p-4 lg:p-6 pt-2 sm:pt-3 lg:pt-4">
          <TabsContent value="ongoing" className="space-y-4 sm:space-y-6 mt-0">
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
              t={t}
              common={common}
            />
          </TabsContent>

          <TabsContent value="past" className="space-y-4 sm:space-y-6 mt-0">
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
              t={t}
              common={common}
            />
          </TabsContent>

          <TabsContent value="all" className="space-y-4 sm:space-y-6 mt-0">
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
              t={t}
              common={common}
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
        </div>
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
  t: (key: string, options?: any) => string;
  common: (key: string, options?: any) => string;
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
  t,
  common,
}: SurveyGridProps) {
  if (surveys.length === 0) {
    return (
      <Card className="shadow-none bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50">
        <CardContent className="p-8 sm:p-12 lg:p-16 text-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <FileText className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-3 font-montserrat">
            {t('noSurveysFound')}
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-md mx-auto font-montserrat">
            {t('tryAdjustingFilters')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={onCreateSurvey}
              className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl sm:rounded-2xl font-montserrat font-semibold"
            >
              <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              {t('createNewSurvey')}
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
          <span className="text-sm font-medium text-gray-700">
            {t('sortBy')}
          </span>
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
          {t('showingSurveys', {
            count: surveys.length,
            plural: surveys.length !== 1 ? 's' : '',
          })}
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
                t={t}
                common={common}
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
  t: (key: string, options?: any) => string;
  common: (key: string, options?: any) => string;
}

function SurveyCard({
  survey,
  isSelected,
  onToggleSelection,
  onAction,
  showProgress,
  t,
  common,
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
        'group cursor-pointer transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 border-0 shadow-none bg-gradient-to-br backdrop-blur rounded-3xl hover:scale-105',
        getStatusGradient(survey.status),
        isSelected && 'ring-4 ring-blue-500 ring-offset-2 shadow-2xl'
      )}
    >
      <CardHeader className="pb-4 p-6 sm:p-8">
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
              t={t}
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
              <CardTitle className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors font-montserrat">
                {survey.title}
              </CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 leading-relaxed font-montserrat">
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
                {t('viewDetails')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAction(survey._id, 'edit')}>
                <Edit className="h-4 w-4 mr-2" />
                {t('editSurvey')}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onAction(survey._id, 'duplicate')}
              >
                <Copy className="h-4 w-4 mr-2" />
                {t('duplicate')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onAction(survey._id, 'export')}>
                <Download className="h-4 w-4 mr-2" />
                {t('exportResults')}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onAction(survey._id, 'archive')}
                className="text-red-600"
              >
                <Archive className="h-4 w-4 mr-2" />
                {t('archive')}
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
              <span className="text-gray-700">{t('surveyProgress')}</span>
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
                {survey.response_count || 0} {common('responses')}
              </span>
              <span className="flex items-center gap-1">
                <Target className="h-3 w-3" />
                {t('target')}: {survey.target_responses || 0}
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
                  ? `${t('ends')} ${new Date(survey.end_date).toLocaleDateString()}`
                  : `${t('created')} ${new Date(survey.created_at).toLocaleDateString()}`}
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
              <span>
                {survey.question_count || 0} {t('questions')}
              </span>
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
                {t('moreTags', { count: survey.tags.length - 3 })}
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
            {t('view')}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1 bg-white/60 hover:bg-white border-white/50"
            onClick={() => onAction(survey._id, 'results')}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            {t('results')}
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
  t: (key: string, options?: any) => string;
}

function SurveySelectionCheckbox({
  checked,
  onCheckedChange,
  onClick,
  t,
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
        {t('selectSurvey')}
      </Label>
    </div>
  );
}
