'use client';

import React, { useState, useId } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Download,
  FileText,
  Table,
  FileSpreadsheet,
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
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `Export failed with status ${response.status}`
        );
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
      // Show error toast
      alert(`Export failed: ${error.message}`);
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
        <Button
          variant="outline"
          className="gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border-blue-200 text-blue-700 hover:text-blue-800 font-montserrat"
        >
          <Download className="h-4 w-4" />
          Export
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl">
        <DialogHeader className="pb-6">
          <DialogTitle className="flex items-center gap-3 text-xl font-bold text-gray-900 dark:text-white font-montserrat">
            <div className="p-2 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 rounded-lg">
              <Download className="h-5 w-5 text-white" />
            </div>
            Export Report: {reportTitle}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-8">
          {/* Format Selection */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 font-montserrat">
              Export Format
            </h3>
            <div className="grid grid-cols-1 gap-4">
              {formatOptions.map((format) => {
                const Icon = format.icon;
                return (
                  <Card
                    key={format.value}
                    className={`p-6 cursor-pointer transition-all duration-200 ${
                      exportOptions.format === format.value
                        ? 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30'
                        : 'bg-white/50 dark:bg-slate-700/50 hover:bg-blue-50/30 dark:hover:bg-blue-900/10'
                    }`}
                    onClick={() =>
                      setExportOptions((prev) => ({
                        ...prev,
                        format: format.value as 'pdf' | 'excel' | 'csv',
                      }))
                    }
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`p-3 rounded-xl ${
                          exportOptions.format === format.value
                            ? 'bg-gradient-to-br from-blue-500 to-indigo-500'
                            : 'bg-gray-100 dark:bg-gray-700'
                        }`}
                      >
                        <Icon
                          className={`h-6 w-6 ${
                            exportOptions.format === format.value
                              ? 'text-white'
                              : 'text-gray-600 dark:text-gray-300'
                          }`}
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-semibold text-gray-900 dark:text-white font-montserrat">
                            {format.label}
                          </span>
                          {format.recommended && (
                            <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-montserrat">
                              Recommended
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 font-montserrat">
                          {format.description}
                        </p>
                      </div>
                      {exportOptions.format === format.value && (
                        <div className="p-2 bg-blue-500 rounded-full">
                          <CheckCircle className="h-5 w-5 text-white" />
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Options */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 font-montserrat">
              Export Options
            </h3>
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-slate-700/50 dark:to-blue-900/20 rounded-xl">
                <ExportOptionCheckbox
                  label="Include Charts"
                  description="Embed visualizations in the export"
                  checked={exportOptions.includeCharts}
                  onCheckedChange={(checked) =>
                    setExportOptions((prev) => ({
                      ...prev,
                      includeCharts: checked,
                    }))
                  }
                />
              </div>

              <div className="p-4 bg-gradient-to-r from-gray-50 to-indigo-50 dark:from-slate-700/50 dark:to-indigo-900/20 rounded-xl">
                <ExportOptionCheckbox
                  label="AI Executive Summary"
                  description="Include AI-generated insights and recommendations"
                  checked={exportOptions.includeExecutiveSummary}
                  onCheckedChange={(checked) =>
                    setExportOptions((prev) => ({
                      ...prev,
                      includeExecutiveSummary: checked,
                    }))
                  }
                />
              </div>
            </div>
          </div>

          {/* Section Selection */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 font-montserrat">
              Report Sections
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {availableSections.filter(Boolean).map((section, index) => (
                <div
                  key={section || `section-${index}`}
                  className="p-3 bg-gradient-to-r from-gray-50 to-purple-50 dark:from-slate-700/50 dark:to-purple-900/20 rounded-lg"
                >
                  <SectionCheckbox
                    section={section}
                    checked={exportOptions.sections.includes(section)}
                    onToggle={toggleSection}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Custom Branding (PDF only) */}
          {exportOptions.format === 'pdf' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 font-montserrat flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
                  <Palette className="h-4 w-4 text-white" />
                </div>
                Custom Branding
              </h3>
              <div className="p-4 bg-gradient-to-r from-gray-50 to-purple-50 dark:from-slate-700/50 dark:to-purple-900/20 rounded-xl">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 font-montserrat mb-2 block">
                      Primary Color
                    </label>
                    <Input
                      type="color"
                      value={
                        exportOptions.customBranding?.colors?.primary ||
                        '#2563EB'
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
                      className="w-full h-10 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 font-montserrat mb-2 block">
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
                      className="w-full h-10 rounded-lg"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Export Preview */}
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-xl">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <AlertCircle className="h-5 w-5 text-white" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white font-montserrat">
                  Export Preview
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 font-montserrat">
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
        <div className="flex justify-end gap-4 pt-6">
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isExporting}
            className="px-6 py-2 font-montserrat"
          >
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={isExporting || exportOptions.sections.length === 0}
            className="gap-2 px-6 py-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white font-semibold font-montserrat"
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

// Export Option Checkbox Component
interface ExportOptionCheckboxProps {
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

function ExportOptionCheckbox({
  label,
  description,
  checked,
  onCheckedChange,
}: ExportOptionCheckboxProps) {
  const checkboxId = useId();

  return (
    <div className="flex items-center gap-3">
      <Checkbox
        id={checkboxId}
        checked={checked}
        onCheckedChange={onCheckedChange}
        className="rounded border-gray-300"
      />
      <Label htmlFor={checkboxId} className="cursor-pointer flex-1">
        <span className="text-sm font-semibold text-gray-900 dark:text-white font-montserrat">
          {label}
        </span>
        <p className="text-xs text-gray-600 dark:text-gray-400 font-montserrat mt-1">
          {description}
        </p>
      </Label>
    </div>
  );
}

// Section Checkbox Component
interface SectionCheckboxProps {
  section: string;
  checked: boolean;
  onToggle: (section: string) => void;
}

function SectionCheckbox({ section, checked, onToggle }: SectionCheckboxProps) {
  const checkboxId = useId();

  return (
    <div className="flex items-center gap-3">
      <Checkbox
        id={checkboxId}
        checked={checked}
        onCheckedChange={() => onToggle(section)}
        className="rounded border-gray-300"
      />
      <Label
        htmlFor={checkboxId}
        className="text-sm font-medium capitalize cursor-pointer text-gray-900 dark:text-white font-montserrat"
      >
        {section
          ? section.replace(/([A-Z])/g, ' $1').trim()
          : 'Unknown Section'}
      </Label>
    </div>
  );
}
