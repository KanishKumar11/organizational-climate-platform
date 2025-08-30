'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import {
  FileText,
  Download,
  Calendar,
  Clock,
  Filter,
  Search,
  MoreVertical,
  Trash2,
  Share2,
  Eye,
} from 'lucide-react';

interface Report {
  _id: string;
  title: string;
  description?: string;
  type: string;
  status: 'generating' | 'completed' | 'failed' | 'scheduled';
  format: string;
  file_size?: number;
  generation_completed_at?: string;
  created_at: string;
  download_count: number;
  expires_at?: string;
  shared_with?: string[];
}

interface ReportListProps {
  onCreateNew: () => void;
  onViewReport: (report: Report) => void;
}

export default function ReportList({
  onCreateNew,
  onViewReport,
}: ReportListProps) {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });

  useEffect(() => {
    loadReports();
  }, [pagination.page, statusFilter, typeFilter]);

  const loadReports = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (typeFilter !== 'all') params.append('type', typeFilter);

      const response = await fetch(`/api/reports?${params}`);
      if (response.ok) {
        const data = await response.json();
        setReports(data.reports);
        setPagination((prev) => ({
          ...prev,
          total: data.pagination.total,
          pages: data.pagination.pages,
        }));
      }
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (report: Report) => {
    if (report.status !== 'completed') return;

    try {
      const response = await fetch(`/api/reports/${report._id}/download`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${report.title}.${report.format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        // Refresh the report to update download count
        loadReports();
      }
    } catch (error) {
      console.error('Error downloading report:', error);
    }
  };

  const handleDelete = async (reportId: string) => {
    if (!confirm('Are you sure you want to delete this report?')) return;

    try {
      const response = await fetch(`/api/reports/${reportId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        loadReports();
      }
    } catch (error) {
      console.error('Error deleting report:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      generating: { variant: 'secondary' as const, text: 'Generating' },
      completed: { variant: 'default' as const, text: 'Completed' },
      failed: { variant: 'destructive' as const, text: 'Failed' },
      scheduled: { variant: 'outline' as const, text: 'Scheduled' },
    };

    const config =
      variants[status as keyof typeof variants] || variants.completed;
    return <Badge variant={config.variant}>{config.text}</Badge>;
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      survey_analysis: 'Survey Analysis',
      department_comparison: 'Department Comparison',
      trend_analysis: 'Trend Analysis',
      benchmark_comparison: 'Benchmark Comparison',
      executive_summary: 'Executive Summary',
      custom: 'Custom Report',
    };
    return labels[type as keyof typeof labels] || type;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const filteredReports = reports.filter(
    (report) =>
      report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && reports.length === 0) {
    return (
      <Card className="p-6">
        <LoadingSpinner />
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Reports</h2>
          <p className="text-gray-600 mt-1">
            Generate and manage comprehensive analytics reports
          </p>
        </div>
        <Button onClick={onCreateNew} className="bg-blue-600 hover:bg-blue-700">
          <FileText className="h-4 w-4 mr-2" />
          Create New Report
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search reports..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="generating">Generating</option>
              <option value="scheduled">Scheduled</option>
              <option value="failed">Failed</option>
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="survey_analysis">Survey Analysis</option>
              <option value="department_comparison">
                Department Comparison
              </option>
              <option value="trend_analysis">Trend Analysis</option>
              <option value="benchmark_comparison">Benchmark Comparison</option>
              <option value="executive_summary">Executive Summary</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Reports List */}
      <div className="space-y-4">
        {filteredReports.length === 0 ? (
          <Card className="p-8 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No reports found
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                ? 'Try adjusting your filters or search terms.'
                : 'Get started by creating your first report.'}
            </p>
            {!searchTerm && statusFilter === 'all' && typeFilter === 'all' && (
              <Button
                onClick={onCreateNew}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <FileText className="h-4 w-4 mr-2" />
                Create Your First Report
              </Button>
            )}
          </Card>
        ) : (
          filteredReports.map((report) => (
            <Card key={report._id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-medium truncate">
                      {report.title}
                    </h3>
                    {getStatusBadge(report.status)}
                    <Badge variant="outline">{getTypeLabel(report.type)}</Badge>
                  </div>

                  {report.description && (
                    <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                      {report.description}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      Created {new Date(report.created_at).toLocaleDateString()}
                    </div>
                    {report.generation_completed_at && (
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        Completed{' '}
                        {new Date(
                          report.generation_completed_at
                        ).toLocaleDateString()}
                      </div>
                    )}
                    <div className="flex items-center">
                      <Download className="h-4 w-4 mr-1" />
                      {report.download_count} downloads
                    </div>
                    {report.file_size && (
                      <span>{formatFileSize(report.file_size)}</span>
                    )}
                    <span className="uppercase">{report.format}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  {report.status === 'completed' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(report)}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewReport(report)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>

                  <div className="relative group">
                    <Button variant="outline" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                    <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                      <button
                        onClick={() => {
                          /* Handle share */
                        }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center"
                      >
                        <Share2 className="h-4 w-4 mr-2" />
                        Share Report
                      </button>
                      <button
                        onClick={() => handleDelete(report._id)}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 text-red-600 flex items-center"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Report
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {report.expires_at && (
                <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-sm text-yellow-800">
                    Expires on{' '}
                    {new Date(report.expires_at).toLocaleDateString()}
                  </p>
                </div>
              )}
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
            {pagination.total} reports
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page === 1}
              onClick={() =>
                setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
              }
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page === pagination.pages}
              onClick={() =>
                setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
              }
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
