'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { redirect } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { 
  Database, 
  Search, 
  Filter, 
  Download, 
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  User,
  Activity,
  Shield,
  FileText,
  Calendar
} from 'lucide-react';

interface AuditLog {
  _id: string;
  user_id?: string;
  company_id: string;
  action: string;
  resource: string;
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
    action: '',
    resource: '',
    success: '',
    start_date: '',
    end_date: '',
    search: '',
    limit: 50
  });

  // Redirect if user doesn't have permission
  if (!user || !isSuperAdmin) {
    redirect('/dashboard');
  }

  useEffect(() => {
    loadLogs();
    loadReport();
  }, []);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== '') {
          params.append(key, value.toString());
        }
      });

      const response = await fetch(`/api/audit/logs?${params}`);
      if (!response.ok) throw new Error('Failed to load logs');
      
      const data = await response.json();
      setLogs(data.data || []);
    } catch (error) {
      console.error('Error loading logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadReport = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.start_date) params.append('start_date', filters.start_date);
      if (filters.end_date) params.append('end_date', filters.end_date);

      const response = await fetch(`/api/audit/report?${params}`);
      if (!response.ok) throw new Error('Failed to load report');
      
      const data = await response.json();
      setReport(data.data);
    } catch (error) {
      console.error('Error loading report:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadLogs(), loadReport()]);
    setRefreshing(false);
  };

  const handleExport = async (format: 'json' | 'csv') => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
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
      case 'create': return 'default';
      case 'update': return 'secondary';
      case 'delete': return 'destructive';
      case 'login': case 'logout': return 'outline';
      default: return 'secondary';
    }
  };

  const getResourceIcon = (resource: string) => {
    switch (resource) {
      case 'user': return User;
      case 'survey': return FileText;
      case 'audit_log': return Database;
      default: return Activity;
    }
  };

  const renderLogsView = () => (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="action">Action</Label>
              <Input
                id="action"
                placeholder="e.g., create, update"
                value={filters.action}
                onChange={(e) => setFilters(prev => ({ ...prev, action: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="resource">Resource</Label>
              <Input
                id="resource"
                placeholder="e.g., user, survey"
                value={filters.resource}
                onChange={(e) => setFilters(prev => ({ ...prev, resource: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="start_date">Start Date</Label>
              <Input
                id="start_date"
                type="date"
                value={filters.start_date}
                onChange={(e) => setFilters(prev => ({ ...prev, start_date: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="end_date">End Date</Label>
              <Input
                id="end_date"
                type="date"
                value={filters.end_date}
                onChange={(e) => setFilters(prev => ({ ...prev, end_date: e.target.value }))}
                className="mt-1"
              />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <Button onClick={loadLogs} className="w-full sm:w-auto">
              <Search className="h-4 w-4 mr-2" />
              Apply Filters
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setFilters({
                user_id: '', action: '', resource: '', success: '', 
                start_date: '', end_date: '', search: '', limit: 50
              })}
              className="w-full sm:w-auto"
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Logs List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Audit Logs ({logs.length})
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => handleExport('csv')}>
                <Download className="h-4 w-4 mr-2" />
                CSV
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleExport('json')}>
                <Download className="h-4 w-4 mr-2" />
                JSON
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="max-h-96 overflow-y-auto dashboard-scroll">
          {loading ? (
            <LoadingSpinner />
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No audit logs found matching your criteria
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => {
                const ResourceIcon = getResourceIcon(log.resource);
                return (
                  <div key={log._id} className="flex items-start gap-3 p-4 border rounded-lg bg-gray-50">
                    <div className={`h-2 w-2 rounded-full mt-2 ${
                      log.success ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                    <ResourceIcon className="h-5 w-5 text-gray-600 mt-1" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={getActionBadgeVariant(log.action)}>
                          {log.action}
                        </Badge>
                        <Badge variant="outline">
                          {log.resource}
                        </Badge>
                        {!log.success && (
                          <Badge variant="destructive">
                            Failed
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-900">
                        {log.resource_id && `ID: ${log.resource_id}`}
                        {log.user_id && ` • User: ${log.user_id}`}
                      </p>
                      {log.error_message && (
                        <p className="text-sm text-red-600 mt-1">
                          Error: {log.error_message}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                        {log.ip_address && (
                          <span>IP: {log.ip_address}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderReportView = () => (
    <div className="space-y-6">
      {report && (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-600">
                      Total Events
                    </p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">
                      {report.total_events.toLocaleString()}
                    </p>
                  </div>
                  <Activity className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-600">
                      Success Rate
                    </p>
                    <p className="text-xl sm:text-2xl font-bold text-green-600">
                      {report.success_rate.toFixed(1)}%
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
                      Failed Events
                    </p>
                    <p className="text-xl sm:text-2xl font-bold text-red-600">
                      {report.failed_events}
                    </p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-600">
                      Active Users
                    </p>
                    <p className="text-xl sm:text-2xl font-bold text-purple-600">
                      {Object.keys(report.events_by_user).length}
                    </p>
                  </div>
                  <User className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Failures */}
          {report.recent_failures.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  Recent Failures
                </CardTitle>
              </CardHeader>
              <CardContent className="max-h-64 overflow-y-auto dashboard-scroll">
                <div className="space-y-3">
                  {report.recent_failures.map((failure) => (
                    <div key={failure._id} className="flex items-start gap-3 p-3 border border-red-200 rounded-lg bg-red-50">
                      <AlertTriangle className="h-4 w-4 text-red-600 mt-1" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="destructive">
                            {failure.action}
                          </Badge>
                          <Badge variant="outline">
                            {failure.resource}
                          </Badge>
                        </div>
                        <p className="text-sm text-red-900">
                          {failure.error_message || 'Unknown error'}
                        </p>
                        <p className="text-xs text-red-600 mt-1">
                          {new Date(failure.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Shield className="h-8 w-8" />
                System Logs
              </h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1">
                Monitor system activity and audit trail
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <Button 
                variant="outline" 
                onClick={handleRefresh}
                disabled={refreshing}
                className="w-full sm:w-auto"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* View Toggle */}
          <div className="flex border-b mb-6">
            <button
              onClick={() => setActiveView('logs')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeView === 'logs'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Database className="h-4 w-4" />
              Audit Logs
            </button>
            <button
              onClick={() => setActiveView('report')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeView === 'report'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <FileText className="h-4 w-4" />
              Report
            </button>
          </div>

          {/* Content */}
          {activeView === 'logs' ? renderLogsView() : renderReportView()}
        </div>
      </div>
    </DashboardLayout>
  );
}
