/* eslint-disable react-hooks/exhaustive-deps */
/**
 * Enhanced survey management interface with comprehensive features
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import { Progress } from '@/components/ui/progress';

import { getModuleColors } from '@/lib/module-colors';
import { cn } from '@/lib/utils';

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
  const [filteredSurveys, setFilteredSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
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

  const surveyColors = getModuleColors('survey');

  useEffect(() => {
    fetchSurveys();
  }, []);

  useEffect(() => {
    applyFiltersAndSort();
  }, []);

  const fetchSurveys = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (companyId) params.append('company_id', companyId);
      if (departmentId) params.append('department_id', departmentId);

      const response = await fetch(`/api/surveys?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setSurveys(data.surveys || []);
      }
    } catch (error) {
      console.error('Failed to fetch surveys:', error);
    } finally {
      setLoading(false);
    }
  }, [companyId, departmentId]);

  const applyFiltersAndSort = useCallback(() => {
    let filtered = [...surveys];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (survey) =>
          survey.title.toLowerCase().includes(query) ||
          survey.description.toLowerCase().includes(query) ||
          survey.type.toLowerCase().includes(query) ||
          survey.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    // Apply status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter((survey) => survey.status === filters.status);
    }

    // Apply type filter
    if (filters.type !== 'all') {
      filtered = filtered.filter((survey) => survey.type === filters.type);
    }

    // Apply date range filter
    if (filters.dateRange !== 'all') {
      const now = new Date();
      const filterDate = new Date();

      switch (filters.dateRange) {
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
        case 'quarter':
          filterDate.setMonth(now.getMonth() - 3);
          break;
        case 'year':
          filterDate.setFullYear(now.getFullYear() - 1);
          break;
      }

      filtered = filtered.filter(
        (survey) => new Date(survey.created_at) >= filterDate
      );
    }

    // Apply created by filter
    if (filters.createdBy !== 'all') {
      filtered = filtered.filter(
        (survey) => survey.created_by.id === filters.createdBy
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'created_at':
          comparison =
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'end_date':
          comparison =
            new Date(a.end_date).getTime() - new Date(b.end_date).getTime();
          break;
        case 'response_count':
          comparison = a.response_count - b.response_count;
          break;
        case 'completion_rate':
          comparison = a.completion_rate - b.completion_rate;
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredSurveys(filtered);
  }, [surveys, searchQuery, filters, sortField, sortOrder]);

  const handleCreateSurvey = () => {
    // Navigate to survey creation page
    window.location.href = '/dashboard/surveys/create';
  };

  const handleSurveyAction = async (surveyId: string, action: string) => {
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

  const handleBulkAction = async (action: string) => {
    if (selectedSurveys.length === 0) return;

    try {
      const response = await fetch('/api/surveys/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          survey_ids: selectedSurveys,
          action,
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

  const ongoingSurveys = filteredSurveys.filter((s) => s.status === 'active');
  const pastSurveys = filteredSurveys.filter((s) =>
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

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Survey Management</h2>
          <p className="text-muted-foreground">
            Create, manage, and track your organizational surveys
          </p>
        </div>

        <Button
          onClick={handleCreateSurvey}
          className="flex items-center gap-2"
          style={{
            backgroundColor: surveyColors.primary,
            color: surveyColors.primaryForeground,
          }}
        >
          <Plus className="h-4 w-4" />
          Create New Survey
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search surveys by title, description, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2">
              <Select
                value={filters.status}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
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
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Type" />
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
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Date" />
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
          {(searchQuery || Object.values(filters).some((f) => f !== 'all')) && (
            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t">
              {searchQuery && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Search: &quot;{searchQuery}&quot;
                  <button
                    onClick={() => setSearchQuery('')}
                    className="ml-1 hover:bg-gray-200 rounded"
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
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      {key}: {value}
                      <button
                        onClick={() =>
                          setFilters((prev) => ({ ...prev, [key]: 'all' }))
                        }
                        className="ml-1 hover:bg-gray-200 rounded"
                      >
                        ×
                      </button>
                    </Badge>
                  )
              )}
            </div>
          )}
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

      {/* Survey Tabs */}
      <Tabs defaultValue="ongoing" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="ongoing" className="flex items-center gap-2">
            <Play className="h-4 w-4" />
            Ongoing ({ongoingSurveys.length})
          </TabsTrigger>
          <TabsTrigger value="past" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Past ({pastSurveys.length})
          </TabsTrigger>
          <TabsTrigger value="all" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            All ({filteredSurveys.length})
          </TabsTrigger>
        </TabsList>

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
          />
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          <SurveyGrid
            surveys={filteredSurveys}
            selectedSurveys={selectedSurveys}
            onToggleSelection={toggleSurveySelection}
            onSurveyAction={handleSurveyAction}
            sortField={sortField}
            sortOrder={sortOrder}
            onSort={toggleSort}
            showProgress={true}
          />
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
}: SurveyGridProps) {
  if (surveys.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No surveys found</h3>
          <p className="text-muted-foreground">
            Try adjusting your filters or create a new survey to get started.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Sort Controls */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">Sort by:</span>
        {(
          ['title', 'created_at', 'end_date', 'response_count'] as SortField[]
        ).map((field) => (
          <Button
            key={field}
            variant="ghost"
            size="sm"
            onClick={() => onSort(field)}
            className={cn(
              'flex items-center gap-1',
              sortField === field && 'bg-muted'
            )}
          >
            {field.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
            {sortField === field &&
              (sortOrder === 'asc' ? (
                <SortAsc className="h-3 w-3" />
              ) : (
                <SortDesc className="h-3 w-3" />
              ))}
          </Button>
        ))}
      </div>

      {/* Survey Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
  const surveyColors = getModuleColors('survey');
  const statusConfig =
    SURVEY_STATUSES[survey.status as keyof typeof SURVEY_STATUSES];

  return (
    <Card
      className={cn(
        'cursor-pointer transition-all duration-200 hover:shadow-md border-l-4',
        isSelected && 'ring-2 ring-blue-500 ring-offset-2'
      )}
      style={{ borderLeftColor: surveyColors.primary }}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={onToggleSelection}
              className="mt-1"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg truncate">{survey.title}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {survey.description}
              </p>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onAction(survey._id, 'view')}>
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAction(survey._id, 'edit')}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
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
              <DropdownMenuItem onClick={() => onAction(survey._id, 'archive')}>
                <Archive className="h-4 w-4 mr-2" />
                Archive
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Status and Type */}
        <div className="flex items-center justify-between">
          <Badge className={cn('flex items-center gap-1', statusConfig?.color)}>
            {/* {getStatusIcon(survey.status)} */}
            {statusConfig?.label}
          </Badge>
          <Badge variant="outline">
            {SURVEY_TYPES[survey.type as keyof typeof SURVEY_TYPES]}
          </Badge>
        </div>

        {/* Progress (for ongoing surveys) */}
        {showProgress && survey.status === 'active' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Progress</span>
              <span>{survey.completion_rate.toFixed(1)}%</span>
            </div>
            <Progress value={survey.completion_rate} className="h-2" />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{survey.response_count} responses</span>
              <span>Target: {survey.target_responses}</span>
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="h-3 w-3" />
            <span>
              {survey.status === 'active'
                ? `Ends ${new Date(survey.end_date).toLocaleDateString()}`
                : `Created ${new Date(survey.created_at).toLocaleDateString()}`}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-3 w-3" />
            <span>{survey.created_by.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-3 w-3" />
            <span>~{survey.estimated_duration} min</span>
          </div>
        </div>

        {/* Tags */}
        {survey.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {survey.tags.slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {survey.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{survey.tags.length - 3} more
              </Badge>
            )}
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex gap-2 pt-2 border-t">
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={() => onAction(survey._id, 'view')}
          >
            <Eye className="h-3 w-3 mr-1" />
            View
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={() => onAction(survey._id, 'results')}
          >
            <BarChart3 className="h-3 w-3 mr-1" />
            Results
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
