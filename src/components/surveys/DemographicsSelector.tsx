'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Upload,
  Download,
  CheckCircle,
  AlertCircle,
  FileSpreadsheet,
  Users,
  Filter,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DemographicField {
  _id: string;
  field: string;
  label: string;
  type: 'select' | 'text' | 'number' | 'date';
  options?: string[];
  required: boolean;
  order: number;
  is_active: boolean;
}

interface DemographicsSelectionProps {
  companyId: string;
  selectedFields: string[];
  onFieldsChange: (fields: string[]) => void;
  onDemographicsUpload?: (data: any) => void;
  showUpload?: boolean;
}

export default function DemographicsSelector({
  companyId,
  selectedFields,
  onFieldsChange,
  onDemographicsUpload,
  showUpload = true,
}: DemographicsSelectionProps) {
  const [availableFields, setAvailableFields] = useState<DemographicField[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<any>(null);

  useEffect(() => {
    fetchDemographicFields();
  }, [companyId]);

  const fetchDemographicFields = async () => {
    try {
      const response = await fetch(`/api/demographics/fields?company_id=${companyId}`);
      if (response.ok) {
        const data = await response.json();
        setAvailableFields(data.fields || []);
      }
    } catch (error) {
      console.error('Error fetching demographic fields:', error);
      toast.error('Failed to load demographic fields');
    } finally {
      setLoading(false);
    }
  };

  const handleFieldToggle = (fieldId: string) => {
    const newSelected = selectedFields.includes(fieldId)
      ? selectedFields.filter((f) => f !== fieldId)
      : [...selectedFields, fieldId];
    onFieldsChange(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedFields.length === availableFields.length) {
      onFieldsChange([]);
    } else {
      onFieldsChange(availableFields.map((f) => f._id));
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];

    if (!validTypes.includes(file.type) && !file.name.match(/\.(csv|xlsx|xls)$/i)) {
      toast.error('Please upload a CSV or Excel file');
      return;
    }

    setUploadedFile(file);
    setUploadPreview(null);

    // Parse and preview the file
    const formData = new FormData();
    formData.append('file', file);
    formData.append('company_id', companyId);

    setUploading(true);
    try {
      const response = await fetch('/api/demographics/upload/preview', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to parse file');
      }

      const preview = await response.json();
      setUploadPreview(preview);
      toast.success(`File parsed: ${preview.totalRows} rows found`);
    } catch (error) {
      console.error('Error parsing file:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to parse file');
      setUploadedFile(null);
    } finally {
      setUploading(false);
    }
  };

  const handleUpload = async () => {
    if (!uploadedFile || !uploadPreview) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', uploadedFile);
    formData.append('company_id', companyId);

    try {
      const response = await fetch('/api/demographics/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to upload demographics');
      }

      const result = await response.json();
      toast.success(`Successfully updated demographics for ${result.updatedCount} users`);
      
      if (onDemographicsUpload) {
        onDemographicsUpload(result);
      }

      setUploadedFile(null);
      setUploadPreview(null);
    } catch (error) {
      console.error('Error uploading demographics:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload demographics');
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    // Generate CSV template with demographic field headers
    const headers = ['email', ...availableFields.map((f) => f.field)];
    const csvContent = headers.join(',') + '\n' + 
      'user@example.com,' + availableFields.map(() => '').join(',');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'demographics_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Template downloaded');
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading demographic fields...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Field Selection */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Select Demographic Fields
              </CardTitle>
              <CardDescription className="mt-1">
                Choose which demographic information to collect for survey segmentation
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handleSelectAll}>
              {selectedFields.length === availableFields.length ? 'Deselect All' : 'Select All'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {availableFields.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 mb-2">No demographic fields configured</p>
              <p className="text-sm text-gray-500">
                Contact your administrator to set up demographic fields
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availableFields.map((field) => (
                <div
                  key={field._id}
                  className={cn(
                    'flex items-start space-x-3 p-4 rounded-lg border-2 transition-all cursor-pointer hover:bg-gray-50',
                    selectedFields.includes(field._id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200'
                  )}
                  onClick={() => handleFieldToggle(field._id)}
                >
                  <Checkbox
                    id={`field-${field._id}`}
                    checked={selectedFields.includes(field._id)}
                    onCheckedChange={() => handleFieldToggle(field._id)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <Label
                      htmlFor={`field-${field._id}`}
                      className="font-medium cursor-pointer"
                    >
                      {field.label}
                      {field.required && (
                        <span className="text-red-500 ml-1">*</span>
                      )}
                    </Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {field.type}
                      </Badge>
                      {field.options && field.options.length > 0 && (
                        <span className="text-xs text-gray-500">
                          {field.options.length} options
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {selectedFields.length > 0 && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start gap-2">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-900">
                    {selectedFields.length} field{selectedFields.length !== 1 ? 's' : ''} selected
                  </p>
                  <p className="text-sm text-blue-700 mt-1">
                    Demographics will be auto-populated from user profiles during survey responses
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* CSV Upload Section */}
      {showUpload && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5" />
              Bulk Demographics Upload
            </CardTitle>
            <CardDescription>
              Upload a CSV/Excel file to update user demographics in bulk (90% preferred method)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Template Download */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
              <div className="flex items-center gap-3">
                <Download className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="font-medium">Download Template</p>
                  <p className="text-sm text-gray-600">
                    CSV template with current demographic fields
                  </p>
                </div>
              </div>
              <Button variant="outline" onClick={downloadTemplate}>
                Download
              </Button>
            </div>

            <Separator />

            {/* File Upload */}
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="demographics-upload"
                  disabled={uploading}
                />
                <label
                  htmlFor="demographics-upload"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <Upload className="w-12 h-12 text-gray-400 mb-4" />
                  <p className="font-medium text-gray-900 mb-1">
                    Upload Demographics File
                  </p>
                  <p className="text-sm text-gray-600">
                    CSV or Excel file (max 10MB)
                  </p>
                </label>
              </div>

              {/* Upload Preview */}
              {uploadPreview && (
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-green-900">
                          File Parsed Successfully
                        </p>
                        <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-green-700">Total Rows:</span>
                            <span className="font-medium ml-2">
                              {uploadPreview.totalRows}
                            </span>
                          </div>
                          <div>
                            <span className="text-green-700">Valid Rows:</span>
                            <span className="font-medium ml-2">
                              {uploadPreview.validRows}
                            </span>
                          </div>
                          <div>
                            <span className="text-green-700">Fields Found:</span>
                            <span className="font-medium ml-2">
                              {uploadPreview.fieldsFound?.join(', ')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {uploadPreview.errors && uploadPreview.errors.length > 0 && (
                    <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                        <div>
                          <p className="font-medium text-yellow-900 mb-2">
                            Validation Warnings ({uploadPreview.errors.length})
                          </p>
                          <ul className="text-sm text-yellow-800 space-y-1">
                            {uploadPreview.errors.slice(0, 5).map((error: string, idx: number) => (
                              <li key={idx}>• {error}</li>
                            ))}
                            {uploadPreview.errors.length > 5 && (
                              <li className="font-medium">
                                ... and {uploadPreview.errors.length - 5} more
                              </li>
                            )}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button
                      onClick={handleUpload}
                      disabled={uploading || uploadPreview.validRows === 0}
                      className="flex-1"
                    >
                      {uploading ? (
                        <>Uploading...</>
                      ) : (
                        <>
                          <Users className="w-4 h-4 mr-2" />
                          Upload {uploadPreview.validRows} User Demographics
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setUploadedFile(null);
                        setUploadPreview(null);
                      }}
                      disabled={uploading}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
