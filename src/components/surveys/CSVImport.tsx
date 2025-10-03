import React, { useState, useCallback } from 'react';
import {
  Upload,
  Download,
  AlertCircle,
  CheckCircle2,
  X,
  FileSpreadsheet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  CSVImportService,
  ImportedUser,
  ColumnMapping,
  ImportResult,
} from '@/lib/csv-import-service';

/**
 * CLIMA-003: CSV Import Component
 *
 * Drag-drop CSV/XLSX upload with:
 * - Auto-detection of column mappings
 * - Manual column mapping
 * - Data validation and preview
 * - Duplicate detection
 * - Error reporting
 */

interface CSVImportProps {
  onImportComplete: (users: ImportedUser[]) => void;
  existingUsers?: ImportedUser[];
  maxFileSize?: number; // in MB
  requireEmail?: boolean;
  requireName?: boolean;
}

const TARGET_FIELDS = [
  { value: 'email', label: 'Email (Required)' },
  { value: 'name', label: 'Name' },
  { value: 'department', label: 'Department' },
  { value: 'employee_id', label: 'Employee ID' },
  { value: 'phone', label: 'Phone' },
  { value: 'position', label: 'Position' },
  { value: 'ignore', label: 'Ignore This Column' },
];

export default function CSVImport({
  onImportComplete,
  existingUsers = [],
  maxFileSize = 10,
  requireEmail = true,
  requireName = false,
}: CSVImportProps) {
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [step, setStep] = useState<'upload' | 'mapping' | 'preview'>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);

  // Handle file selection
  const handleFileSelect = async (selectedFile: File) => {
    // Validate file size
    if (selectedFile.size > maxFileSize * 1024 * 1024) {
      alert(`File size exceeds ${maxFileSize}MB limit`);
      return;
    }

    // Validate file type
    const fileType = selectedFile.name.split('.').pop()?.toLowerCase();
    if (!['csv', 'xlsx', 'xls'].includes(fileType || '')) {
      alert('Please upload a CSV or Excel file');
      return;
    }

    setFile(selectedFile);
    setLoading(true);

    try {
      // Parse file to get headers
      let parseResult;
      if (fileType === 'csv') {
        parseResult = await CSVImportService.parseCSV(selectedFile);
      } else {
        parseResult = await CSVImportService.parseXLSX(selectedFile);
      }

      setHeaders(parseResult.headers);

      // Auto-detect mapping
      const autoMapping = CSVImportService.autoDetectMapping(
        parseResult.headers
      );
      setMapping(autoMapping);

      setStep('mapping');
    } catch (error) {
      alert(`Error parsing file: ${(error as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle drag and drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  // Update column mapping
  const updateMapping = (sourceColumn: string, targetField: string) => {
    setMapping((prev) => ({
      ...prev,
      [sourceColumn]: targetField,
    }));
  };

  // Validate and preview
  const handlePreview = async () => {
    if (!file) return;

    setLoading(true);
    try {
      // Filter out ignored columns
      const finalMapping = Object.entries(mapping)
        .filter(([_, target]) => target !== 'ignore')
        .reduce((acc, [source, target]) => ({ ...acc, [source]: target }), {});

      const result = await CSVImportService.importUsers(file, finalMapping, {
        requireEmail,
        requireName,
        deduplicateBy: 'email',
      });

      setImportResult(result);
      setStep('preview');
    } catch (error) {
      alert(`Import error: ${(error as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  // Confirm import
  const handleConfirmImport = () => {
    if (importResult && importResult.data.length > 0) {
      onImportComplete(importResult.data);
    }
  };

  // Download template
  const handleDownloadTemplate = () => {
    const template = CSVImportService.generateTemplate(true);
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'user-import-template.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  // Reset to upload step
  const handleReset = () => {
    setFile(null);
    setHeaders([]);
    setMapping({});
    setImportResult(null);
    setStep('upload');
  };

  return (
    <div className="space-y-4">
      {/* Upload Step */}
      {step === 'upload' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Import Users from CSV/Excel
            </CardTitle>
            <CardDescription>
              Upload a CSV or Excel file with user information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Drag-drop area */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragging
                  ? 'border-primary bg-primary/5'
                  : 'border-muted hover:border-primary/50'
              }`}
            >
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium mb-2">
                Drag and drop your file here
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                or click to browse (CSV, XLSX, XLS - max {maxFileSize}MB)
              </p>
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileInputChange}
                className="hidden"
                id="file-input"
              />
              <Button asChild>
                <label htmlFor="file-input" className="cursor-pointer">
                  Choose File
                </label>
              </Button>
            </div>

            <Separator />

            {/* Template download */}
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <p className="font-medium text-sm">Need a template?</p>
                <p className="text-xs text-muted-foreground">
                  Download our sample CSV file with example data
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadTemplate}
              >
                <Download className="h-4 w-4 mr-2" />
                Download Template
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mapping Step */}
      {step === 'mapping' && (
        <Card>
          <CardHeader>
            <CardTitle>Map Columns</CardTitle>
            <CardDescription>
              Match the columns from your file to the required fields
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                File: <strong>{file?.name}</strong> ({headers.length} columns
                detected)
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              {headers.map((header) => (
                <div
                  key={header}
                  className="grid grid-cols-2 gap-4 items-center"
                >
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{header}</Badge>
                  </div>
                  <Select
                    value={mapping[header] || 'ignore'}
                    onValueChange={(value) => updateMapping(header, value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select field..." />
                    </SelectTrigger>
                    <SelectContent>
                      {TARGET_FIELDS.map((field) => (
                        <SelectItem key={field.value} value={field.value}>
                          {field.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>

            <Separator />

            <div className="flex gap-2">
              <Button variant="outline" onClick={handleReset}>
                Cancel
              </Button>
              <Button onClick={handlePreview} disabled={loading}>
                {loading ? 'Processing...' : 'Preview & Validate'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview Step */}
      {step === 'preview' && importResult && (
        <div className="space-y-4">
          {/* Stats Cards */}
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">
                  {importResult.stats.total}
                </div>
                <div className="text-xs text-muted-foreground">Total Rows</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-green-600">
                  {importResult.stats.valid}
                </div>
                <div className="text-xs text-muted-foreground">Valid Users</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-yellow-600">
                  {importResult.stats.duplicates}
                </div>
                <div className="text-xs text-muted-foreground">Duplicates</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-red-600">
                  {importResult.stats.errors}
                </div>
                <div className="text-xs text-muted-foreground">Errors</div>
              </CardContent>
            </Card>
          </div>

          {/* Errors */}
          {importResult.errors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="font-medium mb-2">
                  {importResult.errors.length} validation error(s) found:
                </div>
                <ScrollArea className="h-32">
                  <ul className="text-sm space-y-1">
                    {importResult.errors.slice(0, 10).map((error, index) => (
                      <li key={index}>
                        Row {error.row}, Column "{error.column}":{' '}
                        {error.message}
                      </li>
                    ))}
                    {importResult.errors.length > 10 && (
                      <li className="text-muted-foreground">
                        ...and {importResult.errors.length - 10} more errors
                      </li>
                    )}
                  </ul>
                </ScrollArea>
              </AlertDescription>
            </Alert>
          )}

          {/* Success message */}
          {importResult.success && (
            <Alert>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription>
                All data validated successfully! {importResult.stats.valid}{' '}
                users ready to import.
              </AlertDescription>
            </Alert>
          )}

          {/* Preview Table */}
          <Card>
            <CardHeader>
              <CardTitle>
                Preview Valid Users ({importResult.data.length})
              </CardTitle>
              <CardDescription>These users will be imported</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Email</th>
                      <th className="text-left p-2">Name</th>
                      <th className="text-left p-2">Department</th>
                      <th className="text-left p-2">Employee ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importResult.data.slice(0, 50).map((user, index) => (
                      <tr key={index} className="border-b hover:bg-muted/50">
                        <td className="p-2">{user.email}</td>
                        <td className="p-2">{user.name || '-'}</td>
                        <td className="p-2">{user.department || '-'}</td>
                        <td className="p-2">{user.employee_id || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {importResult.data.length > 50 && (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    Showing first 50 of {importResult.data.length} users
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Duplicates */}
          {importResult.duplicates.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-yellow-600">
                  Duplicate Users ({importResult.duplicates.length})
                </CardTitle>
                <CardDescription>
                  These users were already found in the import and will be
                  skipped
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-32">
                  <ul className="text-sm space-y-1">
                    {importResult.duplicates.slice(0, 10).map((user, index) => (
                      <li key={index}>
                        {user.email} {user.name && `(${user.name})`}
                      </li>
                    ))}
                    {importResult.duplicates.length > 10 && (
                      <li className="text-muted-foreground">
                        ...and {importResult.duplicates.length - 10} more
                      </li>
                    )}
                  </ul>
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleReset}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleConfirmImport}
              disabled={importResult.data.length === 0}
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Import {importResult.data.length} User
              {importResult.data.length !== 1 ? 's' : ''}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
