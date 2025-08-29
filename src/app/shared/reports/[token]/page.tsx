'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ReportViewer } from '@/components/reports/ReportViewer';
import { ReportComments } from '@/components/reports/ReportComments';
import { ExportDialog } from '@/components/reports/ExportDialog';
import {
  Share2,
  Download,
  Eye,
  Clock,
  Shield,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';

interface SharedReportData {
  report: any;
  shareInfo: {
    permissions: 'view' | 'comment' | 'edit';
    allowDownload: boolean;
    expiresAt?: string;
    accessCount: number;
  };
}

export default function SharedReportPage() {
  const params = useParams();
  const token = params.token as string;

  const [reportData, setReportData] = useState<SharedReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'report' | 'comments'>('report');

  useEffect(() => {
    if (token) {
      loadSharedReport();
    }
  }, [token]);

  const loadSharedReport = async () => {
    try {
      const response = await fetch(`/api/shared/reports/${token}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load report');
      }

      const data = await response.json();
      setReportData(data);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!reportData?.shareInfo.allowDownload) return;

    try {
      const response = await fetch(`/api/shared/reports/${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'download' }),
      });

      if (response.ok) {
        const data = await response.json();
        window.open(data.downloadUrl, '_blank');
      }
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const formatExpiryDate = (dateString?: string) => {
    if (!dateString) return null;

    const expiryDate = new Date(dateString);
    const now = new Date();
    const diffInHours =
      (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 0) {
      return 'Expired';
    } else if (diffInHours < 24) {
      return `Expires in ${Math.floor(diffInHours)} hours`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `Expires in ${diffInDays} day${diffInDays !== 1 ? 's' : ''}`;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading shared report...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md p-8 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold mb-2">
            Unable to Access Report
          </h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </Card>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md p-8 text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h1 className="text-xl font-semibold mb-2">Report Not Found</h1>
          <p className="text-gray-600">
            This shared report could not be found.
          </p>
        </Card>
      </div>
    );
  }

  const { report, shareInfo } = reportData;
  const expiryText = formatExpiryDate(shareInfo.expiresAt);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Share2 className="h-6 w-6 text-blue-500" />
                <div>
                  <h1 className="text-xl font-semibold">{report.title}</h1>
                  <div className="flex items-center gap-4 mt-1">
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Eye className="h-4 w-4" />
                      {shareInfo.accessCount} views
                    </div>
                    {expiryText && (
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Clock className="h-4 w-4" />
                        {expiryText}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Permission badge */}
                <Badge
                  variant={
                    shareInfo.permissions === 'edit' ? 'default' : 'secondary'
                  }
                  className="gap-1"
                >
                  {shareInfo.permissions === 'view' && (
                    <Eye className="h-3 w-3" />
                  )}
                  {shareInfo.permissions === 'comment' && (
                    <Share2 className="h-3 w-3" />
                  )}
                  {shareInfo.permissions === 'edit' && (
                    <CheckCircle className="h-3 w-3" />
                  )}
                  Can {shareInfo.permissions}
                </Badge>

                {/* Download button */}
                {shareInfo.allowDownload && (
                  <Button
                    variant="outline"
                    onClick={handleDownload}
                    className="gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                )}
              </div>
            </div>

            {/* Security notice */}
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-blue-800">
                <Shield className="h-4 w-4" />
                This is a shared report. Your access and actions may be logged.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="flex border-b mb-6">
          <button
            onClick={() => setActiveTab('report')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'report'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Report
          </button>
          {shareInfo.permissions !== 'view' && (
            <button
              onClick={() => setActiveTab('comments')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'comments'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Comments
            </button>
          )}
        </div>

        {/* Tab Content */}
        {activeTab === 'report' && (
          <ReportViewer
            report={report}
            readonly={shareInfo.permissions === 'view'}
          />
        )}

        {activeTab === 'comments' && shareInfo.permissions !== 'view' && (
          <ReportComments
            reportId={report.id}
            permissions={shareInfo.permissions}
          />
        )}
      </div>
    </div>
  );
}
