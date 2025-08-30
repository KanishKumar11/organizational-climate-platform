'use client';

import React, { useState } from 'react';
import ReportList from './ReportList';
import ReportBuilder from './ReportBuilder';
import { ReportViewer } from './ReportViewer';

interface Recommendation {
  title: string;
  description: string;
  impact: string;
  effort: string;
}

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
  recommendations?: Recommendation[];
  comparative_analysis?: any;
}

interface ReportGenerationData {
  title: string;
  description?: string;
  type: string;
  filters: any;
  config: any;
  format: string;
  comparison_type?: string;
  comparative_analysis?: any;
}

type ViewMode = 'list' | 'create' | 'view';

export default function ReportsDashboard() {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  const handleCreateNew = () => {
    setViewMode('create');
    setSelectedReport(null);
  };

  const handleViewReport = (report: Report) => {
    setSelectedReport(report);
    setViewMode('view');
  };

  const handleGenerateReport = async (reportData: ReportGenerationData) => {
    try {
      // If comparative analysis is requested, use the comparative analysis endpoint
      if (reportData.comparison_type) {
        const comparativeResponse = await fetch(
          '/api/reports/comparative-analysis',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              filters: reportData.filters,
              comparison_type: reportData.comparison_type,
              config: reportData.config,
            }),
          }
        );

        if (comparativeResponse.ok) {
          const comparativeAnalysis = await comparativeResponse.json();
          // Store the comparative analysis data for the report viewer
          reportData.comparative_analysis = comparativeAnalysis;
        } else {
          const error = await comparativeResponse.json();
          console.warn('Comparative analysis failed:', error);
        }
      }

      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reportData),
      });

      if (response.ok) {
        const newReport = await response.json();
        // Attach comparative analysis data if available
        if (reportData.comparative_analysis) {
          newReport.comparative_analysis = reportData.comparative_analysis;
        }
        setSelectedReport(newReport);
        setViewMode('view');
      } else {
        const error = await response.json();
        alert(`Error creating report: ${error.error}`);
      }
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate report. Please try again.');
    }
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedReport(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {viewMode === 'list' && (
          <ReportList
            onCreateNew={handleCreateNew}
            onViewReport={handleViewReport}
          />
        )}

        {viewMode === 'create' && (
          <ReportBuilder
            onGenerate={handleGenerateReport}
            onCancel={handleBackToList}
          />
        )}

        {viewMode === 'view' && selectedReport && (
          <ReportViewer report={selectedReport} />
        )}
      </div>
    </div>
  );
}
