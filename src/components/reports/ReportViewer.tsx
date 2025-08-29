'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
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

interface ReportViewerProps {
  report: any;
  readonly?: boolean;
}

export function ReportViewer({ report, readonly = false }: ReportViewerProps) {
  const [activeSection, setActiveSection] = useState('overview');

  const sections = [
    { id: 'overview', label: 'Overview', icon: FileText },
    { id: 'demographics', label: 'Demographics', icon: Users },
    { id: 'insights', label: 'AI Insights', icon: TrendingUp },
    { id: 'recommendations', label: 'Recommendations', icon: AlertTriangle },
  ];

  const availableSections = report?.sections?.map((s: any) => s.name) || [
    'overview',
    'demographics',
    'insights',
    'recommendations',
  ];

  return (
    <div className="space-y-6">
      {/* Report Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{report?.title}</h1>
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {report?.dateRange?.start} - {report?.dateRange?.end}
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {report?.metadata?.responseCount || 0} responses
            </div>
            <Badge variant="secondary">{report?.status || 'Active'}</Badge>
          </div>
        </div>

        {!readonly && (
          <div className="flex items-center gap-3">
            <ExportDialog
              reportId={report?.id}
              reportTitle={report?.title}
              availableSections={availableSections}
            />
            <ShareDialog reportId={report?.id} reportTitle={report?.title} />
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Engagement Score</p>
                  <p className="text-2xl font-bold">
                    {report?.metrics?.engagementScore || 0}%
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
                    {report?.metrics?.responseRate || 0}%
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
                    {report?.metrics?.satisfaction || 0}/5
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {activeSection === 'demographics' && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">
              Demographic Breakdown
            </h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">By Department</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {report?.demographics?.departments?.map((dept: any) => (
                    <div key={dept.name} className="text-center">
                      <p className="text-sm text-gray-600">{dept.name}</p>
                      <p className="text-lg font-semibold">{dept.count}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        )}

        {activeSection === 'insights' && (
          <div className="space-y-4">
            {report?.insights?.map((insight: any) => (
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
                    <p className="text-gray-700 mb-3">{insight.description}</p>
                    {insight.recommendedActions && (
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
            ))}
          </div>
        )}

        {activeSection === 'recommendations' && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">AI Recommendations</h3>
            <div className="space-y-4">
              {report?.recommendations?.map((rec: unknown, index: number) => (
                <div key={index} className="border-l-4 border-blue-500 pl-4">
                  <h4 className="font-medium">{rec.title}</h4>
                  <p className="text-gray-700 mt-1">{rec.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline">Impact: {rec.impact}</Badge>
                    <Badge variant="outline">Effort: {rec.effort}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
