'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import {
  Download,
  FileText,
  Table,
  FileSpreadsheet,
  Settings,
  Palette,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

interface ExportDialogProps {
  reportId: string;
  reportTitle: string;
  availableSections: string[];
  onExport?: (format: string) => void;
}

interface ExportOptions {
  format: 'pdf' | 'excel' | 'csv';
  includeCharts: boolean;
  includeExecutiveSummary: boolean;
  sections: string[];
  customBranding?: {
    logo?: string;
    colors?: {
      primary: string;
      secondary: string;
    };
  };
}

export function ExportDialog({
  reportId,
  reportTitle,
  availableSections,
  onExport,
}: ExportDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'pdf',
    includeCharts: true,
    includeExecutiveSummary: true,
    sections: availableSections,
    customBranding: {
      colors: {
        primary: '#2563EB',
        secondary: '#64748B',
      },
    },
  });

  const formatOptions = [
    {
      value: 'pdf',
      label: 'PDF Report',
      description: 'Professional report with charts and formatting',
      icon: FileText,
      recommended: true,
    },
    {
      value: 'excel',
      label: 'Excel Workbook',
      description: 'Data tables with multiple sheets',
      icon: FileSpreadsheet,
      recommended: false,
    },
    {
      value: 'csv',
      label: 'CSV Data',
      description: 'Raw data for analysis',
      icon: Table,
      recommended: false,
    },
  ];

  const handleExport = async () => {
    setIsExporting(true);

    try {
      const response = await fetch(`/api/reports/${reportId}/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(exportOptions),
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      // Get the filename from the response headers
      const contentDisposition = response.headers.get('content-disposition');
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
        : `report.${exportOptions.format}`;

      // Create download link
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      onExport?.(exportOptions.format);
      setIsOpen(false);
    } catch (error) {
      console.error('Export error:', error);
      // Handle error - show toast notification
    } finally {
      setIsExporting(false);
    }
  };

  const toggleSection = (section: string) => {
    setExportOptions((prev) => ({
      ...prev,
      sections: prev.sections.includes(section)
        ? prev.sections.filter((s) => s !== section)
        : [...prev.sections, section],
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Report: {reportTitle}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Format Selection */}
          <div>
            <h3 className="text-sm font-medium mb-3">Export Format</h3>
            <div className="grid grid-cols-1 gap-3">
              {formatOptions.map((format) => {
                const Icon = format.icon;
                return (
                  <Card
                    key={format.value}
                    className={`p-4 cursor-pointer transition-colors ${
                      exportOptions.format === format.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() =>
                      setExportOptions((prev) => ({
                        ...prev,
                        format: format.value as any,
                      }))
                    }
                  >
                    <div className="flex items-start gap-3">
                      <Icon className="h-5 w-5 mt-0.5 text-gray-600" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{format.label}</span>
                          {format.recommended && (
                            <Badge variant="secondary" className="text-xs">
                              Recommended
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {format.description}
                        </p>
                      </div>
                      {exportOptions.format === format.value && (
                        <CheckCircle className="h-5 w-5 text-blue-500" />
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Options */}
          <div>
            <h3 className="text-sm font-medium mb-3">Export Options</h3>
            <div className="space-y-3">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={exportOptions.includeCharts}
                  onChange={(e) =>
                    setExportOptions((prev) => ({
                      ...prev,
                      includeCharts: e.target.checked,
                    }))
                  }
                  className="rounded border-gray-300"
                />
                <div>
                  <span className="text-sm font-medium">Include Charts</span>
                  <p className="text-xs text-gray-600">
                    Embed visualizations in the export
                  </p>
                </div>
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={exportOptions.includeExecutiveSummary}
                  onChange={(e) =>
                    setExportOptions((prev) => ({
                      ...prev,
                      includeExecutiveSummary: e.target.checked,
                    }))
                  }
                  className="rounded border-gray-300"
                />
                <div>
                  <span className="text-sm font-medium">
                    AI Executive Summary
                  </span>
                  <p className="text-xs text-gray-600">
                    Include AI-generated insights and recommendations
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Section Selection */}
          <div>
            <h3 className="text-sm font-medium mb-3">Report Sections</h3>
            <div className="grid grid-cols-2 gap-2">
              {availableSections.map((section) => (
                <label key={section} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={exportOptions.sections.includes(section)}
                    onChange={() => toggleSection(section)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm capitalize">
                    {section.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Custom Branding (PDF only) */}
          {exportOptions.format === 'pdf' && (
            <div>
              <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Custom Branding
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-700">
                    Primary Color
                  </label>
                  <Input
                    type="color"
                    value={
                      exportOptions.customBranding?.colors?.primary || '#2563EB'
                    }
                    onChange={(e) =>
                      setExportOptions((prev) => ({
                        ...prev,
                        customBranding: {
                          ...prev.customBranding,
                          colors: {
                            ...prev.customBranding?.colors,
                            primary: e.target.value,
                          },
                        },
                      }))
                    }
                    className="w-20 h-8"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700">
                    Secondary Color
                  </label>
                  <Input
                    type="color"
                    value={
                      exportOptions.customBranding?.colors?.secondary ||
                      '#64748B'
                    }
                    onChange={(e) =>
                      setExportOptions((prev) => ({
                        ...prev,
                        customBranding: {
                          ...prev.customBranding,
                          colors: {
                            ...prev.customBranding?.colors,
                            secondary: e.target.value,
                          },
                        },
                      }))
                    }
                    className="w-20 h-8"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Export Preview */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium">Export Preview</h4>
                <p className="text-xs text-gray-600 mt-1">
                  Your {exportOptions.format.toUpperCase()} will include{' '}
                  {exportOptions.sections.length} section
                  {exportOptions.sections.length !== 1 ? 's' : ''}
                  {exportOptions.includeCharts && ', charts'}
                  {exportOptions.includeExecutiveSummary && ', and AI summary'}.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isExporting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={isExporting || exportOptions.sections.length === 0}
            className="gap-2"
          >
            {isExporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Export {exportOptions.format.toUpperCase()}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
