'use client';

import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loading } from '@/components/ui/Loading';
import {
  Upload,
  Download,
  FileText,
  CheckCircle,
  AlertCircle,
  X,
  Users,
  FileSpreadsheet,
} from 'lucide-react';

interface ImportResult {
  success: boolean;
  message: string;
  imported: number;
  errors: string[];
  duplicates: number;
  skipped: number;
}

interface PreviewUser {
  name: string;
  email: string;
  role: string;
  department: string;
  status: 'valid' | 'error' | 'duplicate';
  errors?: string[];
}

export default function BulkUserImport() {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewUser[]>([]);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setImportResult(null);
      setShowPreview(false);
      setPreviewData([]);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const droppedFile = event.dataTransfer.files[0];
    if (droppedFile && (droppedFile.type === 'text/csv' || droppedFile.name.endsWith('.csv'))) {
      setFile(droppedFile);
      setImportResult(null);
      setShowPreview(false);
      setPreviewData([]);
    }
  };

  const previewImport = async () => {
    if (!file) return;

    setImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('preview', 'true');

      const response = await fetch('/api/admin/bulk-import', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      if (response.ok) {
        setPreviewData(result.preview || []);
        setShowPreview(true);
      } else {
        alert(result.error || 'Failed to preview import');
      }
    } catch (error) {
      console.error('Error previewing import:', error);
      alert('Failed to preview import');
    } finally {
      setImporting(false);
    }
  };

  const executeImport = async () => {
    if (!file) return;

    setImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('preview', 'false');

      const response = await fetch('/api/admin/bulk-import', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      setImportResult(result);
      setShowPreview(false);
    } catch (error) {
      console.error('Error importing users:', error);
      setImportResult({
        success: false,
        message: 'Failed to import users',
        imported: 0,
        errors: ['Network error occurred'],
        duplicates: 0,
        skipped: 0,
      });
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = [
      'name,email,role,department',
      'John Doe,john.doe@company.com,employee,Engineering',
      'Jane Smith,jane.smith@company.com,supervisor,Marketing',
      'Bob Johnson,bob.johnson@company.com,leader,Sales'
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'user_import_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const reset = () => {
    setFile(null);
    setPreviewData([]);
    setImportResult(null);
    setShowPreview(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bulk User Import</h1>
          <p className="text-gray-600">Import multiple users from CSV file</p>
        </div>
        <Button variant="outline" onClick={downloadTemplate}>
          <Download className="w-4 h-4 mr-2" />
          Download Template
        </Button>
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Import Instructions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">CSV Format Requirements</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• File must be in CSV format</li>
                <li>• Required columns: name, email, role, department</li>
                <li>• First row should contain column headers</li>
                <li>• Maximum file size: 10MB</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Valid Roles</h4>
              <div className="flex flex-wrap gap-1">
                {['employee', 'supervisor', 'leader', 'department_admin', 'company_admin'].map(role => (
                  <Badge key={role} variant="outline" className="text-xs">
                    {role}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* File Upload */}
      <Card>
        <CardHeader>
          <CardTitle>Upload CSV File</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            {file ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-3">
                  <FileSpreadsheet className="w-8 h-8 text-green-600" />
                  <div>
                    <p className="font-medium text-gray-900">{file.name}</p>
                    <p className="text-sm text-gray-500">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center justify-center gap-3">
                  <Button onClick={previewImport} disabled={importing}>
                    {importing ? <Loading size="sm" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                    Preview Import
                  </Button>
                  <Button variant="outline" onClick={reset}>
                    <X className="w-4 h-4 mr-2" />
                    Remove File
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                <div>
                  <p className="text-lg font-medium text-gray-900">Drop your CSV file here</p>
                  <p className="text-gray-500">or click to browse</p>
                </div>
                <Button onClick={() => fileInputRef.current?.click()}>
                  Select File
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      {showPreview && previewData.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Import Preview ({previewData.length} users)</CardTitle>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-green-100 rounded-full"></div>
                    Valid: {previewData.filter(u => u.status === 'valid').length}
                  </span>
                  <span className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-red-100 rounded-full"></div>
                    Errors: {previewData.filter(u => u.status === 'error').length}
                  </span>
                  <span className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-yellow-100 rounded-full"></div>
                    Duplicates: {previewData.filter(u => u.status === 'duplicate').length}
                  </span>
                </div>
                <Button onClick={executeImport} disabled={importing}>
                  {importing ? <Loading size="sm" /> : <Users className="w-4 h-4 mr-2" />}
                  Import Users
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-3 font-medium text-gray-700">Status</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-700">Name</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-700">Email</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-700">Role</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-700">Department</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-700">Issues</th>
                  </tr>
                </thead>
                <tbody>
                  {previewData.map((user, index) => (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="py-2 px-3">
                        {user.status === 'valid' && <CheckCircle className="w-4 h-4 text-green-600" />}
                        {user.status === 'error' && <AlertCircle className="w-4 h-4 text-red-600" />}
                        {user.status === 'duplicate' && <AlertCircle className="w-4 h-4 text-yellow-600" />}
                      </td>
                      <td className="py-2 px-3">{user.name}</td>
                      <td className="py-2 px-3">{user.email}</td>
                      <td className="py-2 px-3">{user.role}</td>
                      <td className="py-2 px-3">{user.department}</td>
                      <td className="py-2 px-3">
                        {user.errors && user.errors.length > 0 && (
                          <div className="text-sm text-red-600">
                            {user.errors.join(', ')}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Import Result */}
      {importResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {importResult.success ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600" />
              )}
              Import {importResult.success ? 'Completed' : 'Failed'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-700">{importResult.message}</p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{importResult.imported}</div>
                <div className="text-sm text-green-700">Imported</div>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{importResult.duplicates}</div>
                <div className="text-sm text-yellow-700">Duplicates</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{importResult.skipped}</div>
                <div className="text-sm text-red-700">Skipped</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{importResult.errors.length}</div>
                <div className="text-sm text-red-700">Errors</div>
              </div>
            </div>

            {importResult.errors.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Errors:</h4>
                <ul className="text-sm text-red-600 space-y-1">
                  {importResult.errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}

            <Button onClick={reset} className="w-full">
              Import Another File
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
