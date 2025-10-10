'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExportDialog } from './ExportDialog';
import { ShareDialog } from './ShareDialog';
import {
  FileText,
  Calendar,
  Users,
  TrendingUp,
  AlertTriangle,
  Download,
  Share2,
  Filter,
  MoreVertical,
  BarChart3,
  PieChart,
  Activity,
} from 'lucide-react';

interface Recommendation {
  title: string;
  description: string;
  impact: string;
  effort: string;
}

interface Report {
  _id: string;
  id?: string; // Alternative id property
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
  recommendations?: Recommendation[];
  sections?: any[];
  dateRange?: {
    start: string;
    end: string;
  };
  metadata?: {
    responseCount?: number;
  };
  metrics?: {
    engagementScore?: number;
    responseRate?: number;
    satisfaction?: number;
  };
  demographics?: {
    departments?: any[];
  };
  insights?: any[];
}

interface ReportViewerProps {
  report: Report;
  readonly?: boolean;
}

export function ReportViewer({ report, readonly = false }: ReportViewerProps) {
  const [activeSection, setActiveSection] = useState('overview');
  const [currentReport, setCurrentReport] = useState(report);

  // Poll for report updates when status is generating OR when data is missing
  useEffect(() => {
    const needsPolling =
      report?.status === 'generating' ||
      (report?.status === 'completed' &&
        (!currentReport?.metrics ||
          !currentReport?.demographics ||
          !currentReport?.insights ||
          !currentReport?.recommendations));

    if (needsPolling) {
      let pollCount = 0;
      const maxPolls = 30; // Stop after 1 minute (30 * 2 seconds)

      const interval = setInterval(async () => {
        pollCount++;

        // Stop polling after max attempts
        if (pollCount > maxPolls) {
          clearInterval(interval);
          return;
        }

        try {
          const response = await fetch(
            `/api/reports/${report._id || report.id}`
          );
          if (response.ok) {
            const updatedReport = await response.json();
            setCurrentReport(updatedReport);

            // Stop polling if report is completed AND has all data
            if (
              updatedReport.status === 'completed' &&
              updatedReport.metrics &&
              updatedReport.demographics &&
              updatedReport.insights &&
              updatedReport.recommendations
            ) {
              clearInterval(interval);
            }
          }
        } catch (error) {
          console.error('Error polling report status:', error);
        }
      }, 2000); // Poll every 2 seconds

      return () => clearInterval(interval);
    }
  }, [
    report?.status,
    report?._id,
    report?.id,
    currentReport?.metrics,
    currentReport?.demographics,
    currentReport?.insights,
    currentReport?.recommendations,
  ]);

  const sections = [
    { id: 'overview', label: 'Overview', icon: FileText },
    { id: 'demographics', label: 'Demographics', icon: Users },
    { id: 'insights', label: 'AI Insights', icon: TrendingUp },
    { id: 'recommendations', label: 'Recommendations', icon: AlertTriangle },
  ];

  const availableSections = Array.isArray(currentReport?.sections)
    ? currentReport.sections.filter(Boolean)
    : ['overview', 'demographics', 'insights', 'recommendations'];

  return (
    <div className="space-y-6">
      {/* Report Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{currentReport?.title}</h1>
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {currentReport?.dateRange?.start} -{' '}
              {currentReport?.dateRange?.end}
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {currentReport?.metadata?.responseCount || 0} responses
            </div>
            <Badge variant="secondary">
              {currentReport?.status || 'Active'}
            </Badge>
          </div>
        </div>

        {!readonly && (
          <div className="flex items-center gap-3">
            <ExportDialog
              reportId={currentReport?._id || currentReport?.id}
              reportTitle={currentReport?.title}
              availableSections={availableSections}
            />
            <ShareDialog
              reportId={currentReport?._id || currentReport?.id}
              reportTitle={currentReport?.title}
            />
          </div>
        )}
      </div>

      {/* Section Navigation */}
      <div className="flex border-b">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeSection === section.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="h-4 w-4" />
              {section.label}
            </button>
          );
        })}
      </div>

      {/* Section Content */}
      <div className="space-y-6">
        {activeSection === 'overview' && (
          <>
            {currentReport?.status === 'generating' ||
            (currentReport?.status === 'completed' &&
              (!currentReport?.metrics ||
                !currentReport?.demographics ||
                !currentReport?.insights ||
                !currentReport?.recommendations)) ? (
              <div className="text-center py-12">
                <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Generating Report...
                </h3>
                <p className="text-gray-600">
                  Please wait while we process your data and generate insights.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <BarChart3 className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Engagement Score</p>
                      <p className="text-2xl font-bold">
                        {currentReport?.metrics?.engagementScore || 0}%
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <PieChart className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Response Rate</p>
                      <p className="text-2xl font-bold">
                        {currentReport?.metrics?.responseRate || 0}%
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Activity className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Satisfaction</p>
                      <p className="text-2xl font-bold">
                        {currentReport?.metrics?.satisfaction || 0}/5
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </>
        )}

        {activeSection === 'demographics' && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">
              Demographic Breakdown
            </h3>
            {currentReport?.status === 'generating' ||
            (currentReport?.status === 'completed' &&
              (!currentReport?.metrics ||
                !currentReport?.demographics ||
                !currentReport?.insights ||
                !currentReport?.recommendations)) ? (
              <div className="text-center py-8">
                <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-600">Generating demographic data...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {currentReport?.demographics?.departments &&
                currentReport.demographics.departments.length > 0 ? (
                  <div>
                    <h4 className="font-medium mb-2">By Department</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {currentReport.demographics.departments.map(
                        (dept: any) => (
                          <div
                            key={dept.name}
                            className="text-center p-3 bg-gray-50 rounded-lg"
                          >
                            <p className="text-sm text-gray-600">{dept.name}</p>
                            <p className="text-lg font-semibold">
                              {dept.count}
                            </p>
                            <p className="text-xs text-gray-500">
                              {dept.percentage}%
                            </p>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="p-4 bg-gray-100 rounded-lg w-fit mx-auto mb-4">
                      <Users className="h-8 w-8 text-gray-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      No Demographic Data Available
                    </h3>
                    <p className="text-gray-600">
                      Demographic breakdown will appear once you have survey
                      responses with department information.
                    </p>
                  </div>
                )}
              </div>
            )}
          </Card>
        )}

        {activeSection === 'insights' && (
          <div className="space-y-4">
            {currentReport?.status === 'generating' ||
            (currentReport?.status === 'completed' &&
              (!currentReport?.metrics ||
                !currentReport?.demographics ||
                !currentReport?.insights ||
                !currentReport?.recommendations)) ? (
              <Card className="p-6">
                <div className="text-center py-8">
                  <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-gray-600">Generating AI insights...</p>
                </div>
              </Card>
            ) : currentReport?.insights && currentReport.insights.length > 0 ? (
              currentReport.insights.map((insight: any) => (
                <Card key={insight.id} className="p-6">
                  <div className="flex items-start gap-4">
                    <div
                      className={`p-2 rounded-lg ${
                        insight.priority === 'high'
                          ? 'bg-red-100'
                          : insight.priority === 'medium'
                            ? 'bg-yellow-100'
                            : 'bg-blue-100'
                      }`}
                    >
                      <TrendingUp
                        className={`h-5 w-5 ${
                          insight.priority === 'high'
                            ? 'text-red-600'
                            : insight.priority === 'medium'
                              ? 'text-yellow-600'
                              : 'text-blue-600'
                        }`}
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold">{insight.title}</h4>
                        <Badge
                          variant={
                            insight.priority === 'high'
                              ? 'destructive'
                              : insight.priority === 'medium'
                                ? 'default'
                                : 'secondary'
                          }
                        >
                          {insight.priority}
                        </Badge>
                      </div>
                      <p className="text-gray-700 mb-3">
                        {insight.description}
                      </p>
                      {insight.recommendedActions &&
                        insight.recommendedActions.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-gray-900 mb-1">
                              Recommended Actions:
                            </p>
                            <ul className="text-sm text-gray-600 space-y-1">
                              {insight.recommendedActions.map(
                                (action: string, index: number) => (
                                  <li key={index}>• {action}</li>
                                )
                              )}
                            </ul>
                          </div>
                        )}
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <Card className="p-6 text-center">
                <div className="p-4 bg-gray-100 rounded-lg w-fit mx-auto mb-4">
                  <TrendingUp className="h-8 w-8 text-gray-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No AI Insights Available
                </h3>
                <p className="text-gray-600">
                  AI insights will be generated based on your survey responses.
                  Create more surveys and gather responses to see AI-powered
                  insights.
                </p>
              </Card>
            )}
          </div>
        )}

        {activeSection === 'recommendations' && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">AI Recommendations</h3>
            {currentReport?.status === 'generating' ||
            (currentReport?.status === 'completed' &&
              (!currentReport?.metrics ||
                !currentReport?.demographics ||
                !currentReport?.insights ||
                !currentReport?.recommendations)) ? (
              <div className="text-center py-8">
                <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-600">Generating recommendations...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {currentReport?.recommendations &&
                currentReport.recommendations.length > 0 ? (
                  currentReport.recommendations.map(
                    (rec: Recommendation, index: number) => (
                      <div
                        key={index}
                        className="border-l-4 border-blue-500 pl-4"
                      >
                        <h4 className="font-medium">{rec.title}</h4>
                        <p className="text-gray-700 mt-1">{rec.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline">Impact: {rec.impact}</Badge>
                          <Badge variant="outline">Effort: {rec.effort}</Badge>
                        </div>
                      </div>
                    )
                  )
                ) : (
                  <div className="text-center py-8">
                    <div className="p-4 bg-gray-100 rounded-lg w-fit mx-auto mb-4">
                      <AlertTriangle className="h-8 w-8 text-gray-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      No Recommendations Available
                    </h3>
                    <p className="text-gray-600">
                      AI recommendations will be generated based on your survey
                      data and metrics. Generate more reports to see
                      personalized recommendations.
                    </p>
                  </div>
                )}
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
