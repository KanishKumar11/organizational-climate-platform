/**
 * Frontend Export Integration Examples
 * 
 * These are ready-to-use React components for integrating export functionality
 * into your frontend pages.
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileText, Table, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Utility function to download CSV
 */
export function downloadCSV(csvContent: string, filename: string) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Utility function to download PDF
 */
export function downloadPDF(blob: Blob, filename: string) {
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ============================================================================
// 1. Survey Export Buttons Component
// ============================================================================

interface SurveyExportButtonsProps {
  surveyId: string;
  surveyTitle: string;
}

export function SurveyExportButtons({ surveyId, surveyTitle }: SurveyExportButtonsProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handlePDFExport = async () => {
    setIsExporting(true);
    try {
      const response = await fetch(`/api/surveys/${surveyId}/export/pdf`);
      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
      }

      const blob = await response.blob();
      const filename = `survey-${surveyTitle.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${Date.now()}.pdf`;
      downloadPDF(blob, filename);

      toast.success('PDF exported successfully');
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error('Failed to export PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleCSVExport = async (format: 'long' | 'wide' | 'summary') => {
    setIsExporting(true);
    try {
      const response = await fetch(`/api/surveys/${surveyId}/export/csv?format=${format}`);
      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
      }

      const csvText = await response.text();
      const filename = `survey-${surveyTitle.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${format}-${Date.now()}.csv`;
      downloadCSV(csvText, filename);

      toast.success(`CSV (${format}) exported successfully`);
    } catch (error) {
      console.error('CSV export error:', error);
      toast.error('Failed to export CSV. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex gap-2">
      {/* PDF Export Button */}
      <Button
        onClick={handlePDFExport}
        disabled={isExporting}
        variant="outline"
        size="sm"
      >
        {isExporting ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <FileText className="mr-2 h-4 w-4" />
        )}
        Export PDF
      </Button>

      {/* CSV Export Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" disabled={isExporting}>
            {isExporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Table className="mr-2 h-4 w-4" />
            )}
            Export CSV
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => handleCSVExport('long')}>
            <div>
              <div className="font-medium">Long Format</div>
              <div className="text-xs text-muted-foreground">One row per response</div>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleCSVExport('wide')}>
            <div>
              <div className="font-medium">Wide Format</div>
              <div className="text-xs text-muted-foreground">One column per question</div>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleCSVExport('summary')}>
            <div>
              <div className="font-medium">Summary Statistics</div>
              <div className="text-xs text-muted-foreground">Aggregated data only</div>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// ============================================================================
// 2. Microclimate Export Buttons Component
// ============================================================================

interface MicroclimateExportButtonsProps {
  microclimateId: string;
  microclimateTitle: string;
}

export function MicroclimateExportButtons({
  microclimateId,
  microclimateTitle,
}: MicroclimateExportButtonsProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (format: 'pdf' | 'csv') => {
    setIsExporting(true);
    try {
      const response = await fetch(`/api/microclimates/${microclimateId}/export/${format}`);
      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
      }

      const blob = await response.blob();
      const filename = `microclimate-${microclimateTitle.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${Date.now()}.${format}`;

      if (format === 'pdf') {
        downloadPDF(blob, filename);
      } else {
        const text = await blob.text();
        downloadCSV(text, filename);
      }

      toast.success(`${format.toUpperCase()} exported successfully`);
    } catch (error) {
      console.error(`${format.toUpperCase()} export error:`, error);
      toast.error(`Failed to export ${format.toUpperCase()}. Please try again.`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        onClick={() => handleExport('pdf')}
        disabled={isExporting}
        variant="outline"
        size="sm"
      >
        {isExporting ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <FileText className="mr-2 h-4 w-4" />
        )}
        Export PDF
      </Button>
      <Button
        onClick={() => handleExport('csv')}
        disabled={isExporting}
        variant="outline"
        size="sm"
      >
        {isExporting ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Table className="mr-2 h-4 w-4" />
        )}
        Export CSV
      </Button>
    </div>
  );
}

// ============================================================================
// 3. Action Plan Export Buttons Component
// ============================================================================

interface ActionPlanExportButtonsProps {
  actionPlanId: string;
  actionPlanTitle: string;
}

export function ActionPlanExportButtons({
  actionPlanId,
  actionPlanTitle,
}: ActionPlanExportButtonsProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (format: 'pdf' | 'csv') => {
    setIsExporting(true);
    try {
      const response = await fetch(`/api/action-plans/${actionPlanId}/export/${format}`);
      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
      }

      const blob = await response.blob();
      const filename = `action-plan-${actionPlanTitle.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${Date.now()}.${format}`;

      if (format === 'pdf') {
        downloadPDF(blob, filename);
      } else {
        const text = await blob.text();
        downloadCSV(text, filename);
      }

      toast.success(`${format.toUpperCase()} exported successfully`);
    } catch (error) {
      console.error(`${format.toUpperCase()} export error:`, error);
      toast.error(`Failed to export ${format.toUpperCase()}. Please try again.`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        onClick={() => handleExport('pdf')}
        disabled={isExporting}
        variant="outline"
        size="sm"
      >
        {isExporting ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <FileText className="mr-2 h-4 w-4" />
        )}
        Export PDF
      </Button>
      <Button
        onClick={() => handleExport('csv')}
        disabled={isExporting}
        variant="outline"
        size="sm"
      >
        {isExporting ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Table className="mr-2 h-4 w-4" />
        )}
        Export Data
      </Button>
    </div>
  );
}

// ============================================================================
// 4. Users Export Button (Admin Only)
// ============================================================================

export function UsersExportButton() {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await fetch('/api/users/export/csv');
      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
      }

      const csvText = await response.text();
      const filename = `users-export-${Date.now()}.csv`;
      downloadCSV(csvText, filename);

      toast.success('Users exported successfully');
    } catch (error) {
      console.error('Users export error:', error);
      toast.error('Failed to export users. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button onClick={handleExport} disabled={isExporting} variant="outline" size="sm">
      {isExporting ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Download className="mr-2 h-4 w-4" />
      )}
      Export All Users
    </Button>
  );
}

// ============================================================================
// 5. Demographics Template Download Button
// ============================================================================

export function DemographicsTemplateButton() {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const response = await fetch('/api/demographics/template/csv');
      if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`);
      }

      const csvText = await response.text();
      downloadCSV(csvText, 'demographics-template.csv');

      toast.success('Template downloaded successfully');
    } catch (error) {
      console.error('Template download error:', error);
      toast.error('Failed to download template. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Button onClick={handleDownload} disabled={isDownloading} variant="outline" size="sm">
      {isDownloading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Download className="mr-2 h-4 w-4" />
      )}
      Download Template
    </Button>
  );
}

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/**
 * Example 1: Survey Results Page
 * 
 * File: src/app/admin/surveys/[id]/results/page.tsx
 */
/*
import { SurveyExportButtons } from '@/components/exports/export-buttons';

export default async function SurveyResultsPage({ params }: { params: { id: string } }) {
  const survey = await getSurvey(params.id);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1>{survey.title} - Results</h1>
        <SurveyExportButtons surveyId={survey.id} surveyTitle={survey.title} />
      </div>
      {/* Survey results content *\/}
    </div>
  );
}
*/

/**
 * Example 2: Microclimate Dashboard
 * 
 * File: src/app/admin/microclimates/[id]/page.tsx
 */
/*
import { MicroclimateExportButtons } from '@/components/exports/export-buttons';

export default async function MicroclimatePage({ params }: { params: { id: string } }) {
  const microclimate = await getMicroclimate(params.id);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1>{microclimate.title}</h1>
        <MicroclimateExportButtons
          microclimateId={microclimate.id}
          microclimateTitle={microclimate.title}
        />
      </div>
      {/* Microclimate dashboard content *\/}
    </div>
  );
}
*/

/**
 * Example 3: Action Plan Details
 * 
 * File: src/app/admin/action-plans/[id]/page.tsx
 */
/*
import { ActionPlanExportButtons } from '@/components/exports/export-buttons';

export default async function ActionPlanPage({ params }: { params: { id: string } }) {
  const actionPlan = await getActionPlan(params.id);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1>{actionPlan.title}</h1>
        <ActionPlanExportButtons
          actionPlanId={actionPlan.id}
          actionPlanTitle={actionPlan.title}
        />
      </div>
      {/* Action plan content *\/}
    </div>
  );
}
*/

/**
 * Example 4: Users Management Page
 * 
 * File: src/app/admin/users/page.tsx
 */
/*
import { UsersExportButton } from '@/components/exports/export-buttons';

export default async function UsersPage() {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1>Users Management</h1>
        <UsersExportButton />
      </div>
      {/* Users table content *\/}
    </div>
  );
}
*/

/**
 * Example 5: Demographics Import Page
 * 
 * File: src/app/admin/demographics/import/page.tsx
 */
/*
import { DemographicsTemplateButton } from '@/components/exports/export-buttons';

export default function DemographicsImportPage() {
  return (
    <div>
      <h1>Import Demographics</h1>
      <div className="mb-4">
        <p>Download the template to see the required format:</p>
        <DemographicsTemplateButton />
      </div>
      {/* File upload form *\/}
    </div>
  );
}
*/
