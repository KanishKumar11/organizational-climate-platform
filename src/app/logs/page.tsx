'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { redirect } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Pagination } from '@/components/ui/pagination';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Database,
  Search,
  Filter,
  Download,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Activity,
  Shield,
  FileText,
  Calendar,
  LogIn,
  LogOut,
  Plus,
  Edit,
  Trash2,
  Eye,
} from 'lucide-react';

import { AuditAction, AuditResource } from '@/models/AuditLog';

interface AuditLog {
  _id: string;
  user_id?: string;
  company_id: string;
  action: AuditAction;
  resource: AuditResource;
  resource_id?: string;
  details: any;
  ip_address?: string;
  user_agent?: string;
  success: boolean;
  error_message?: string;
  timestamp: string;
}

interface AuditReport {
  total_events: number;
  success_rate: number;
  failed_events: number;
  events_by_action: Record<string, number>;
  events_by_resource: Record<string, number>;
  events_by_user: Record<string, number>;
  recent_failures: AuditLog[];
  recent_activities: AuditLog[];
  date_range: {
    start: Date;
    end: Date;
  };
}

export default function SystemLogsPage() {
  const { user, isSuperAdmin } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [report, setReport] = useState<AuditReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeView, setActiveView] = useState<'logs' | 'report'>('logs');

  // Filters
  const [filters, setFilters] = useState({
    user_id: '',
    action: 'all',
    resource: 'all',
    success: '',
    start_date: undefined as Date | undefined,
    end_date: undefined as Date | undefined,
    search: '',
    limit: 50,
    page: 1,
  });

  // Pagination state
  const [totalLogs, setTotalLogs] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filter options
  const actionOptions: { value: AuditAction; label: string }[] = [
    { value: 'create', label: 'Create' },
    { value: 'read', label: 'Read' },
    { value: 'update', label: 'Update' },
    { value: 'delete', label: 'Delete' },
    { value: 'login', label: 'Login' },
    { value: 'logout', label: 'Logout' },
    { value: 'export', label: 'Export' },
    { value: 'import', label: 'Import' },
    { value: 'survey_create', label: 'Survey Create' },
    { value: 'survey_launch', label: 'Survey Launch' },
    { value: 'survey_complete', label: 'Survey Complete' },
    { value: 'response_submit', label: 'Response Submit' },
    { value: 'insight_generate', label: 'Insight Generate' },
    { value: 'action_plan_create', label: 'Action Plan Create' },
    { value: 'ai_reanalysis_triggered', label: 'AI Reanalysis Triggered' },
    { value: 'ai_reanalysis_failed', label: 'AI Reanalysis Failed' },
    { value: 'reanalysis_config_updated', label: 'Reanalysis Config Updated' },
    {
      value: 'demographic_snapshot_created',
      label: 'Demographic Snapshot Created',
    },
    {
      value: 'demographic_snapshot_rollback',
      label: 'Demographic Snapshot Rollback',
    },
    {
      value: 'demographic_change_notification',
      label: 'Demographic Change Notification',
    },
  ];

  const resourceOptions: { value: AuditResource; label: string }[] = [
    { value: 'user', label: 'User' },
    { value: 'company', label: 'Company' },
    { value: 'department', label: 'Department' },
    { value: 'survey', label: 'Survey' },
    { value: 'response', label: 'Response' },
    { value: 'insight', label: 'Insight' },
    { value: 'action_plan', label: 'Action Plan' },
    { value: 'template', label: 'Template' },
    { value: 'audit_log', label: 'Audit Log' },
  ];

  // Redirect if user doesn't have permission
  if (!user || (!isSuperAdmin && user.role !== 'company_admin')) {
    redirect('/dashboard');
  }

  const loadLogs = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== '' && value !== 'all') {
          if (value instanceof Date) {
            params.append(key, value.toISOString().split('T')[0]); // Format as YYYY-MM-DD
          } else {
            params.append(key, value.toString());
          }
        }
      });

      const response = await fetch(`/api/audit/logs?${params}`);
      if (!response.ok) throw new Error('Failed to load logs');

      const data = await response.json();
      setLogs(data.data || []);
      setTotalLogs(data.pagination?.total || 0);
      setCurrentPage(data.pagination?.page || 1);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (error) {
      console.error('Error loading logs:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const loadReport = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filters.start_date)
        params.append(
          'start_date',
          filters.start_date.toISOString().split('T')[0]
        );
      if (filters.end_date)
        params.append('end_date', filters.end_date.toISOString().split('T')[0]);

      const response = await fetch(`/api/audit/report?${params}`);
      if (!response.ok) throw new Error('Failed to load report');

      const data = await response.json();
      setReport(data.data);
    } catch (error) {
      console.error('Error loading report:', error);
    }
  }, [filters.start_date, filters.end_date]);

  useEffect(() => {
    loadLogs();
    loadReport();
  }, [loadLogs, loadReport]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadLogs(), loadReport()]);
    setRefreshing(false);
  };

  const handleExport = async (format: 'json' | 'csv') => {
    try {
      const params = new URLSearchParams();
      // Exclude pagination parameters for export to get all data
      const exportFilters = { ...filters };
      delete exportFilters.page;
      delete exportFilters.limit;

      Object.entries(exportFilters).forEach(([key, value]) => {
        if (value && value !== '') {
          params.append(key, value.toString());
        }
      });
      params.append('format', format);

      const response = await fetch(`/api/audit/export?${params}`);
      if (!response.ok) throw new Error('Failed to export logs');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting logs:', error);
    }
  };

  const getActionBadgeVariant = (action: string) => {
    switch (action) {
      case 'create':
        return 'default';
      case 'update':
        return 'secondary';
      case 'delete':
        return 'destructive';
      case 'login':
      case 'logout':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getResourceIcon = (resource: string) => {
    switch (resource) {
      case 'user':
        return User;
      case 'survey':
        return FileText;
      case 'audit_log':
        return Database;
      default:
        return Activity;
    }
  };

  const renderLogsView = () => (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="h-5 w-5 text-blue-600" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <Label
                htmlFor="action"
                className="text-sm font-medium text-gray-700"
              >
                Action
              </Label>
              <Select
                value={filters.action}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, action: value }))
                }
              >
                <SelectTrigger className="mt-1 h-10">
                  <SelectValue placeholder="Select action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  {actionOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label
                htmlFor="resource"
                className="text-sm font-medium text-gray-700"
              >
                Resource
              </Label>
              <Select
                value={filters.resource}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, resource: value }))
                }
              >
                <SelectTrigger className="mt-1 h-10">
                  <SelectValue placeholder="Select resource" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Resources</SelectItem>
                  {resourceOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">
                Start Date
              </Label>
              <DatePicker
                date={filters.start_date}
                onDateChange={(date) =>
                  setFilters((prev) => ({
                    ...prev,
                    start_date: date,
                  }))
                }
                placeholder="Select start date"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">
                End Date
              </Label>
              <DatePicker
                date={filters.end_date}
                onDateChange={(date) =>
                  setFilters((prev) => ({ ...prev, end_date: date }))
                }
                placeholder="Select end date"
                className="mt-1"
              />
            </div>
            <div>
              <Label
                htmlFor="page_size"
                className="text-sm font-medium text-gray-700"
              >
                Page Size
              </Label>
              <Select
                value={filters.limit.toString()}
                onValueChange={(value) =>
                  setFilters((prev) => ({
                    ...prev,
                    limit: parseInt(value),
                    page: 1,
                  }))
                }
              >
                <SelectTrigger className="mt-1 h-10">
                  <SelectValue placeholder="Select page size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 per page</SelectItem>
                  <SelectItem value="25">25 per page</SelectItem>
                  <SelectItem value="50">50 per page</SelectItem>
                  <SelectItem value="100">100 per page</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <Button
              onClick={loadLogs}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-none hover:shadow-xl transition-all duration-200 h-11 px-6 w-full sm:w-auto"
            >
              <Search className="h-4 w-4 mr-2" />
              Apply Filters
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                setFilters({
                  user_id: '',
                  action: 'all',
                  resource: 'all',
                  success: '',
                  start_date: undefined,
                  end_date: undefined,
                  search: '',
                  limit: 50,
                  page: 1,
                })
              }
              className="border-gray-300 hover:bg-gray-50 h-11 px-6 w-full sm:w-auto"
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Logs List */}
      <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center justify-between text-lg">
            <span className="flex items-center gap-2">
              <Database className="h-5 w-5 text-indigo-600" />
              Audit Logs ({logs.length})
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('csv')}
                className="border-gray-300 hover:bg-gray-50"
              >
                <Download className="h-4 w-4 mr-2" />
                CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('json')}
                className="border-gray-300 hover:bg-gray-50"
              >
                <Download className="h-4 w-4 mr-2" />
                JSON
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center">
              <LoadingSpinner />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Database className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">No audit logs found</p>
              <p className="text-sm">
                Try adjusting your filters or check back later
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              <Table className="min-w-full">
                <TableHeader>
                  <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                    <TableHead className="w-12 text-center">Status</TableHead>
                    <TableHead className="min-w-[120px]">Timestamp</TableHead>
                    <TableHead className="min-w-[80px]">Action</TableHead>
                    <TableHead className="min-w-[80px]">Resource</TableHead>
                    <TableHead className="min-w-[100px]">User ID</TableHead>
                    <TableHead className="min-w-[100px]">Resource ID</TableHead>
                    <TableHead className="min-w-[80px]">IP Address</TableHead>
                    <TableHead className="min-w-[150px]">Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => {
                    const ResourceIcon = getResourceIcon(log.resource);
                    return (
                      <TableRow
                        key={log._id}
                        className="hover:bg-gray-50/50 transition-colors"
                      >
                        <TableCell className="text-center">
                          <div className="flex justify-center">
                            <div
                              className={`h-3 w-3 rounded-full ${
                                log.success ? 'bg-green-500' : 'bg-red-500'
                              }`}
                              title={log.success ? 'Success' : 'Failed'}
                            />
                          </div>
                        </TableCell>
                        <TableCell className="text-sm font-mono">
                          {new Date(log.timestamp).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={getActionBadgeVariant(log.action)}
                            className="font-medium"
                          >
                            {log.action}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <ResourceIcon className="h-4 w-4 text-gray-600" />
                            <span className="text-sm">{log.resource}</span>
                          </div>
                        </TableCell>
                        <TableCell
                          className="text-sm font-mono text-gray-600 max-w-[100px] truncate"
                          title={log.user_id}
                        >
                          {log.user_id || '-'}
                        </TableCell>
                        <TableCell
                          className="text-sm font-mono text-gray-600 max-w-[100px] truncate"
                          title={log.resource_id}
                        >
                          {log.resource_id || '-'}
                        </TableCell>
                        <TableCell className="text-sm font-mono text-gray-600">
                          {log.ip_address || '-'}
                        </TableCell>
                        <TableCell className="max-w-[150px] truncate">
                          <div className="space-y-1">
                            {log.error_message && (
                              <div className="text-xs text-red-600 bg-red-50 px-1 py-0.5 rounded border truncate">
                                Error: {log.error_message}
                              </div>
                            )}
                            {log.details && typeof log.details === 'object' && (
                              <div className="text-xs text-gray-600 bg-gray-50 px-1 py-0.5 rounded truncate">
                                {Object.entries(log.details)
                                  .slice(0, 1)
                                  .map(([key, value]) => (
                                    <div key={key} className="truncate">
                                      <span className="font-medium">
                                        {key}:
                                      </span>{' '}
                                      {String(value).slice(0, 20)}
                                      {String(value).length > 20 && '...'}
                                    </div>
                                  ))}
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
          {totalPages > 1 && (
            <div className="mt-8 border-t border-gray-100 pt-6">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => {
                  setFilters((prev) => ({ ...prev, page }));
                  setCurrentPage(page);
                }}
                totalItems={totalLogs}
                itemsPerPage={filters.limit}
                showInfo={true}
                className="bg-transparent border-0 shadow-none"
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderReportView = () => (
    <div className="space-y-8">
      {report && (
        <>
          {/* Enhanced Summary Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="group relative overflow-hidden border-0  bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 hover:shadow-xl shadow-none transition-all duration-300 transform hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-transparent" />
              <CardContent className="relative p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-blue-100 uppercase tracking-wide">
                      Total Events
                    </p>
                    <p className="text-4xl font-bold text-white leading-none">
                      {report.total_events.toLocaleString()}
                    </p>
                    <p className="text-xs text-blue-200 flex items-center gap-1">
                      <Activity className="h-3 w-3" />
                      System activity
                    </p>
                  </div>
                  <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/30">
                    <Activity className="h-7 w-7 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="group relative overflow-hidden border-0 shadow-none bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-700 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/20 to-transparent" />
              <CardContent className="relative p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-emerald-100 uppercase tracking-wide">
                      Success Rate
                    </p>
                    <p className="text-4xl font-bold text-white leading-none">
                      {report.success_rate.toFixed(1)}%
                    </p>
                    <p className="text-xs text-emerald-200 flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      System health
                    </p>
                  </div>
                  <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/30">
                    <CheckCircle className="h-7 w-7 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="group relative overflow-hidden border-0 shadow-none bg-gradient-to-br from-red-500 via-red-600 to-red-700 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-red-400/20 to-transparent" />
              <CardContent className="relative p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-red-100 uppercase tracking-wide">
                      Failed Events
                    </p>
                    <p className="text-4xl font-bold text-white leading-none">
                      {report.failed_events}
                    </p>
                    <p className="text-xs text-red-200 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Requires attention
                    </p>
                  </div>
                  <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/30">
                    <AlertTriangle className="h-7 w-7 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="group relative overflow-hidden border-0 shadow-none bg-gradient-to-br from-violet-500 via-violet-600 to-violet-700 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-400/20 to-transparent" />
              <CardContent className="relative p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-violet-100 uppercase tracking-wide">
                      Active Users
                    </p>
                    <p className="text-4xl font-bold text-white leading-none">
                      {Object.keys(report.events_by_user).length}
                    </p>
                    <p className="text-xs text-violet-200 flex items-center gap-1">
                      <User className="h-3 w-3" />
                      User engagement
                    </p>
                  </div>
                  <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/30">
                    <User className="h-7 w-7 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Analytics Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Action Distribution */}
            <Card className="border-0 shadow-none bg-white/90 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                    <Activity className="h-5 w-5 text-white" />
                  </div>
                  Action Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {report.events_by_action &&
                    Object.entries(report.events_by_action).map(
                      ([action, count]) => (
                        <div
                          key={action}
                          className="flex items-center justify-between p-4 bg-gray-50/50 rounded-xl hover:bg-gray-100/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <Badge
                              variant={getActionBadgeVariant(action)}
                              className="font-medium"
                            >
                              {action}
                            </Badge>
                            <span className="text-sm text-gray-600 capitalize">
                              {action.replace('_', ' ')}
                            </span>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-gray-900">
                              {count}
                            </p>
                            <p className="text-xs text-gray-500">
                              {((count / report.total_events) * 100).toFixed(1)}
                              %
                            </p>
                          </div>
                        </div>
                      )
                    )}
                </div>
              </CardContent>
            </Card>

            {/* Resource Usage */}
            <Card className="border-0 shadow-none bg-white/90 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <Database className="h-5 w-5 text-white" />
                  </div>
                  Resource Usage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {report.events_by_resource &&
                    Object.entries(report.events_by_resource).map(
                      ([resource, count]) => {
                        const IconComponent = getResourceIcon(resource);
                        return (
                          <div
                            key={resource}
                            className="flex items-center justify-between p-4 bg-gray-50/50 rounded-xl hover:bg-gray-100/50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                                <IconComponent className="h-4 w-4 text-gray-600" />
                              </div>
                              <span className="text-sm font-medium text-gray-900 capitalize">
                                {resource.replace('_', ' ')}
                              </span>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-gray-900">
                                {count}
                              </p>
                              <p className="text-xs text-gray-500">
                                {((count / report.total_events) * 100).toFixed(
                                  1
                                )}
                                %
                              </p>
                            </div>
                          </div>
                        );
                      }
                    )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Activity Timeline - Enhanced */}
          <Card className="border-0 shadow-none bg-white/90 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <Clock className="h-5 w-5 text-white" />
                </div>
                Activity Timeline
                <Badge variant="secondary" className="ml-auto">
                  {report.recent_activities?.length || 0} activities
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-200 via-blue-300 to-blue-200"></div>

                <div className="space-y-6">
                  {report.recent_activities &&
                  report.recent_activities.length > 0 ? (
                    report.recent_activities
                      .slice(0, 10)
                      .map((activity, index) => (
                        <div
                          key={activity._id}
                          className="relative flex items-start gap-4"
                        >
                          {/* Timeline dot */}
                          <div
                            className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center shadow-lg border-4 border-white ${
                              activity.success
                                ? 'bg-gradient-to-br from-green-400 to-green-500'
                                : 'bg-gradient-to-br from-red-400 to-red-500'
                            }`}
                          >
                            {activity.success ? (
                              <CheckCircle className="h-5 w-5 text-white" />
                            ) : (
                              <XCircle className="h-5 w-5 text-white" />
                            )}
                          </div>

                          {/* Activity card */}
                          <div className="flex-1 min-w-0">
                            <div
                              className={`p-4 rounded-xl border transition-all duration-200 hover:shadow-md ${
                                activity.success
                                  ? 'bg-gradient-to-r from-green-50/80 to-green-100/80 border-green-200/50 hover:from-green-100/80 hover:to-green-50/80'
                                  : 'bg-gradient-to-r from-red-50/80 to-red-100/80 border-red-200/50 hover:from-red-100/80 hover:to-red-50/80'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Badge
                                      variant={
                                        activity.success
                                          ? 'default'
                                          : 'destructive'
                                      }
                                      className="font-semibold"
                                    >
                                      {activity.action}
                                    </Badge>
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {activity.resource}
                                    </Badge>
                                    {activity.user_id && (
                                      <Badge
                                        variant="secondary"
                                        className="text-xs"
                                      >
                                        User: {activity.user_id.slice(-6)}
                                      </Badge>
                                    )}
                                  </div>

                                  <div className="space-y-1">
                                    <p
                                      className={`text-sm font-medium leading-relaxed ${
                                        activity.success
                                          ? 'text-green-900'
                                          : 'text-red-900'
                                      }`}
                                    >
                                      {activity.success
                                        ? `${activity.action} ${activity.resource} completed successfully`
                                        : activity.error_message ||
                                          'Operation failed'}
                                    </p>

                                    <div className="flex items-center gap-4 text-xs text-gray-600">
                                      <div className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {new Date(
                                          activity.timestamp
                                        ).toLocaleString()}
                                      </div>
                                      {activity.details &&
                                        Object.keys(activity.details).length >
                                          0 && (
                                          <div className="flex items-center gap-1">
                                            <FileText className="h-3 w-3" />
                                            {
                                              Object.keys(activity.details)
                                                .length
                                            }{' '}
                                            details
                                          </div>
                                        )}
                                    </div>
                                  </div>
                                </div>

                                {/* Action icon */}
                                <div
                                  className={`p-2 rounded-lg ${
                                    activity.success
                                      ? 'bg-green-100/80 text-green-600'
                                      : 'bg-red-100/80 text-red-600'
                                  }`}
                                >
                                  {activity.action === 'login' && (
                                    <LogIn className="h-4 w-4" />
                                  )}
                                  {activity.action === 'logout' && (
                                    <LogOut className="h-4 w-4" />
                                  )}
                                  {activity.action === 'create' && (
                                    <Plus className="h-4 w-4" />
                                  )}
                                  {activity.action === 'update' && (
                                    <Edit className="h-4 w-4" />
                                  )}
                                  {activity.action === 'delete' && (
                                    <Trash2 className="h-4 w-4" />
                                  )}
                                  {activity.action === 'read' && (
                                    <Eye className="h-4 w-4" />
                                  )}
                                  {activity.action === 'export' && (
                                    <Download className="h-4 w-4" />
                                  )}
                                  {![
                                    'login',
                                    'logout',
                                    'create',
                                    'update',
                                    'delete',
                                    'read',
                                    'export',
                                  ].includes(activity.action) && (
                                    <Activity className="h-4 w-4" />
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                  ) : (
                    <div className="text-center py-8">
                      <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">
                        No recent activities found
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Failures - Enhanced */}
          {report.recent_failures.length > 0 && (
            <Card className="border-0 shadow-none bg-white/90 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center">
                    <AlertTriangle className="h-5 w-5 text-white" />
                  </div>
                  Recent Failures
                  <Badge variant="destructive" className="ml-auto">
                    {report.recent_failures.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="max-h-96 overflow-y-auto dashboard-scroll">
                <div className="space-y-4">
                  {report.recent_failures.map((failure) => (
                    <div
                      key={failure._id}
                      className="group relative overflow-hidden p-6 border border-red-200/50 rounded-2xl bg-gradient-to-r from-red-50/80 to-red-100/80 hover:from-red-100/80 hover:to-red-50/80 transition-all duration-300 shadow-sm hover:shadow-md"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <div className="relative flex items-start gap-4">
                        <div className="p-3 bg-white/80 rounded-xl shadow-sm border border-red-100/50 backdrop-blur-sm">
                          <AlertTriangle className="h-5 w-5 text-red-600" />
                        </div>
                        <div className="flex-1 min-w-0 space-y-3">
                          <div className="flex items-center gap-3 flex-wrap">
                            <Badge
                              variant="destructive"
                              className="font-semibold px-3 py-1"
                            >
                              {failure.action}
                            </Badge>
                            <Badge
                              variant="outline"
                              className="text-xs border-red-300 text-red-700"
                            >
                              {failure.resource}
                            </Badge>
                            {failure.user_id && (
                              <Badge variant="secondary" className="text-xs">
                                User: {failure.user_id.slice(-8)}
                              </Badge>
                            )}
                          </div>
                          <div className="space-y-2">
                            <p className="text-sm font-semibold text-red-900 leading-relaxed">
                              {failure.error_message ||
                                'Unknown error occurred'}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-red-600">
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {new Date(failure.timestamp).toLocaleString()}
                              </div>
                              {failure.details && (
                                <div className="flex items-center gap-1">
                                  <FileText className="h-3 w-3" />
                                  Details available
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* System Health Indicator */}
          <Card className="border-0 shadow-none bg-gradient-to-r from-gray-50 to-gray-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-gray-900">
                    System Health
                  </h3>
                  <p className="text-sm text-gray-600">
                    Overall system performance and reliability metrics
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div
                    className={`w-4 h-4 rounded-full ${report.success_rate > 95 ? 'bg-green-500' : report.success_rate > 85 ? 'bg-yellow-500' : 'bg-red-500'} animate-pulse`}
                  />
                  <span
                    className={`text-sm font-medium ${report.success_rate > 95 ? 'text-green-700' : report.success_rate > 85 ? 'text-yellow-700' : 'text-red-700'}`}
                  >
                    {report.success_rate > 95
                      ? 'Excellent'
                      : report.success_rate > 85
                        ? 'Good'
                        : 'Needs Attention'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* Modern Gradient Header */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-600 p-8 lg:p-12 mb-8 text-white shadow-xl">
            <div className="absolute inset-0 bg-grid-pattern opacity-5" />
            <div className="relative">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="p-4 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl shadow-none">
                      <Shield className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h1 className="text-4xl font-bold text-white mb-2">
                        System Logs
                      </h1>
                      <p className="text-lg text-purple-100">
                        Monitor system activity and audit trail
                      </p>
                    </div>
                  </div>

                  {report && (
                    <div className="flex flex-wrap items-center gap-6 text-sm text-purple-100">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-green-400 rounded-full shadow-sm" />
                        <span className="font-medium">
                          {report.total_events.toLocaleString()} Total Events
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-blue-400 rounded-full shadow-sm" />
                        <span className="font-medium">
                          {report.success_rate.toFixed(1)}% Success Rate
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-red-400 rounded-full shadow-sm" />
                        <span className="font-medium">
                          {report.failed_events} Failed Events
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-yellow-400 rounded-full shadow-sm" />
                        <span className="font-medium">
                          {Object.keys(report.events_by_user).length} Active
                          Users
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col md:flex-row gap-4 w-full lg:w-auto">
                  <Button
                    variant="outline"
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm w-full md:w-auto"
                  >
                    <RefreshCw
                      className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`}
                    />
                    Refresh
                  </Button>
                </div>
              </div>
            </div>
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>
          </div>

          {/* Enhanced View Toggle */}
          <div className="flex bg-white rounded-2xl shadow-none border border-gray-200/50 p-1 mb-8 backdrop-blur-sm">
            <button
              onClick={() => setActiveView('logs')}
              className={`flex items-center gap-3 px-8 py-4 text-sm font-semibold rounded-xl transition-all duration-300 ${
                activeView === 'logs'
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-none transform scale-105'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50/80'
              }`}
            >
              <Database
                className={`h-5 w-5 ${activeView === 'logs' ? 'text-white' : 'text-blue-500'}`}
              />
              Audit Logs
              {activeView === 'logs' && (
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              )}
            </button>
            <button
              onClick={() => setActiveView('report')}
              className={`flex items-center gap-3 px-8 py-4 text-sm font-semibold rounded-xl transition-all duration-300 ${
                activeView === 'report'
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-none transform scale-105'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50/80'
              }`}
            >
              <FileText
                className={`h-5 w-5 ${activeView === 'report' ? 'text-white' : 'text-purple-500'}`}
              />
              Analytics Report
              {activeView === 'report' && (
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              )}
            </button>
          </div>

          {/* Content */}
          {activeView === 'logs' ? renderLogsView() : renderReportView()}
        </div>
      </div>
    </DashboardLayout>
  );
}
