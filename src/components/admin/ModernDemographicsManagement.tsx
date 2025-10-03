'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Loading } from '@/components/ui/Loading';
import { useToast } from '@/hooks/use-toast';
import { toast } from 'sonner';
import {
  Database,
  Plus,
  Upload,
  Eye,
  Edit,
  Trash2,
  FileSpreadsheet,
  Settings,
  Users,
  AlertCircle,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  Search,
  Filter,
  Download,
  RefreshCw,
} from 'lucide-react';

interface DemographicField {
  _id: string;
  company_id: string;
  field: string;
  label: string;
  type: 'select' | 'text' | 'number' | 'date';
  options?: string[];
  required: boolean;
  order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Company {
  _id: string;
  name: string;
  domain: string;
  industry: string;
  size: string;
  country: string;
  is_active: boolean;
}

interface DemographicsStats {
  totalFields: number;
  totalCompanies: number;
  totalUsers: number;
}

interface ModernDemographicsManagementProps {
  userRole: string;
  onStatsChange?: (stats: DemographicsStats) => void;
}

export default function ModernDemographicsManagement({
  userRole,
  onStatsChange,
}: ModernDemographicsManagementProps) {
  const router = useRouter();
  const { toast: showToast } = useToast();
  const { showConfirmation, ConfirmationDialog } = useConfirmationDialog();

  // State management
  const [demographics, setDemographics] = useState<DemographicField[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCompany, setSelectedCompany] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showBulkUploadDialog, setShowBulkUploadDialog] = useState(false);
  const [editingField, setEditingField] = useState<DemographicField | null>(
    null
  );
  const [uploading, setUploading] = useState(false);

  // Form state for creating/editing
  const [formData, setFormData] = useState({
    company_id: '',
    field: '',
    label: '',
    type: 'text' as 'select' | 'text' | 'number' | 'date',
    options: [] as string[],
    required: false,
    order: 0,
  });

  // Bulk upload state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadCompanyId, setUploadCompanyId] = useState('');

  // Load data
  useEffect(() => {
    loadCompanies();
  }, []);

  useEffect(() => {
    if (selectedCompany) {
      loadDemographics();
    }
  }, [selectedCompany]);

  const loadCompanies = async () => {
    try {
      const response = await fetch('/api/admin/companies');
      if (response.ok) {
        const data = await response.json();
        setCompanies(data.companies || []);
      }
    } catch (error) {
      console.error('Error loading companies:', error);
      toast.error('Failed to load companies');
    }
  };

  const loadDemographics = async () => {
    if (selectedCompany === 'all') return;

    try {
      setLoading(true);
      const response = await fetch(
        `/api/admin/demographics?companyId=${selectedCompany}`
      );
      if (response.ok) {
        const data = await response.json();
        setDemographics(data.data || []);

        // Calculate stats
        const stats: DemographicsStats = {
          totalFields: data.data?.length || 0,
          totalCompanies: companies.filter((c) => c.is_active).length,
          totalUsers: 0, // This would need a separate API call
        };
        onStatsChange?.(stats);
      }
    } catch (error) {
      console.error('Error loading demographics:', error);
      toast.error('Failed to load demographics');
    } finally {
      setLoading(false);
    }
  };

  // Filter demographics based on search
  const filteredDemographics = useMemo(() => {
    return demographics.filter(
      (field) =>
        field.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        field.field.toLowerCase().includes(searchTerm.toLowerCase()) ||
        field.type.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [demographics, searchTerm]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingField
        ? `/api/admin/demographics/${editingField._id}`
        : '/api/admin/demographics';

      const method = editingField ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success(
          editingField
            ? 'Demographic field updated successfully'
            : 'Demographic field created successfully'
        );
        setShowCreateDialog(false);
        setEditingField(null);
        resetForm();
        loadDemographics();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to save demographic field');
      }
    } catch (error) {
      console.error('Error saving demographic field:', error);
      toast.error('Failed to save demographic field');
    }
  };

  // Handle bulk upload
  const handleBulkUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile || !uploadCompanyId) return;

    setUploading(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', uploadFile);
      formDataUpload.append('companyId', uploadCompanyId);

      const response = await fetch('/api/admin/demographics/bulk-upload', {
        method: 'POST',
        body: formDataUpload,
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(
          `Bulk upload completed. Processed: ${result.data.processed}, Updated: ${result.data.updated}`
        );

        if (result.data.errors.length > 0) {
          toast.warning(
            `${result.data.errors.length} rows had errors. Check console for details.`
          );
          console.log('Upload errors:', result.data.errors);
        }

        setShowBulkUploadDialog(false);
        setUploadFile(null);
        setUploadCompanyId('');
      } else {
        toast.error(result.error || 'Bulk upload failed');
      }
    } catch (error) {
      console.error('Error during bulk upload:', error);
      toast.error('Bulk upload failed');
    } finally {
      setUploading(false);
    }
  };

  // Handle delete
  const handleDelete = (field: DemographicField) => {
    showConfirmation({
      title: 'Delete Demographic Field',
      description: `Are you sure you want to delete "${field.label}"? This action cannot be undone.`,
      confirmText: 'Delete',
      variant: 'destructive',
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/admin/demographics/${field._id}`, {
            method: 'DELETE',
          });

          if (response.ok) {
            toast.success('Demographic field deleted successfully');
            loadDemographics();
          } else {
            const error = await response.json();
            toast.error(error.error || 'Failed to delete demographic field');
          }
        } catch (error) {
          console.error('Error deleting demographic field:', error);
          toast.error('Failed to delete demographic field');
        }
      },
    });
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      company_id: selectedCompany === 'all' ? '' : selectedCompany,
      field: '',
      label: '',
      type: 'text',
      options: [],
      required: false,
      order: 0,
    });
  };

  // Handle edit
  const handleEdit = (field: DemographicField) => {
    setEditingField(field);
    setFormData({
      company_id: field.company_id,
      field: field.field,
      label: field.label,
      type: field.type,
      options: field.options || [],
      required: field.required,
      order: field.order,
    });
    setShowCreateDialog(true);
  };

  // Add option to form
  const addOption = () => {
    setFormData((prev) => ({
      ...prev,
      options: [...prev.options, ''],
    }));
  };

  // Update option
  const updateOption = (index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      options: prev.options.map((opt, i) => (i === index ? value : opt)),
    }));
  };

  // Remove option
  const removeOption = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index),
    }));
  };

  const selectedCompanyName =
    companies.find((c) => c._id === selectedCompany)?.name || 'Select Company';

  return (
    <>
      <div className="space-y-6">
        {/* Controls */}
        <Card className="border-0 shadow-sm bg-white/80 backdrop-blur">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search demographic fields..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-80"
                  />
                </div>

                <Select
                  value={selectedCompany}
                  onValueChange={setSelectedCompany}
                >
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Select company" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Companies</SelectItem>
                    {companies.map((company) => (
                      <SelectItem key={company._id} value={company._id}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowBulkUploadDialog(true)}
                  className="gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Bulk Upload
                </Button>
                <Button
                  onClick={() => {
                    resetForm();
                    setShowCreateDialog(true);
                  }}
                  className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  <Plus className="h-4 w-4" />
                  Add Field
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Demographics Table */}
        <Card className="border-0 shadow-sm bg-white/80 backdrop-blur">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-semibold text-gray-900">
                  Demographic Fields
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedCompany === 'all'
                    ? 'Select a company to view demographic fields'
                    : `Managing fields for ${selectedCompanyName}`}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={loadDemographics}
                disabled={loading}
                className="gap-2"
              >
                <RefreshCw
                  className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}
                />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <Loading />
              </div>
            ) : selectedCompany === 'all' ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <Database className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Select a Company
                </h3>
                <p className="text-gray-600 max-w-md">
                  Choose a company from the dropdown above to view and manage
                  their demographic fields.
                </p>
              </div>
            ) : filteredDemographics.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <Database className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Demographic Fields
                </h3>
                <p className="text-gray-600 max-w-md mb-4">
                  {searchTerm
                    ? 'No fields match your search criteria.'
                    : 'Get started by adding your first demographic field.'}
                </p>
                {!searchTerm && (
                  <Button
                    onClick={() => {
                      resetForm();
                      setShowCreateDialog(true);
                    }}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add First Field
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-200">
                      <TableHead className="font-semibold text-gray-900">
                        Field
                      </TableHead>
                      <TableHead className="font-semibold text-gray-900">
                        Label
                      </TableHead>
                      <TableHead className="font-semibold text-gray-900">
                        Type
                      </TableHead>
                      <TableHead className="font-semibold text-gray-900">
                        Required
                      </TableHead>
                      <TableHead className="font-semibold text-gray-900">
                        Options
                      </TableHead>
                      <TableHead className="font-semibold text-gray-900">
                        Order
                      </TableHead>
                      <TableHead className="font-semibold text-gray-900">
                        Status
                      </TableHead>
                      <TableHead className="font-semibold text-gray-900 w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDemographics.map((field) => (
                      <TableRow
                        key={field._id}
                        className="border-gray-100 hover:bg-gray-50/50"
                      >
                        <TableCell className="font-mono text-sm text-gray-900">
                          {field.field}
                        </TableCell>
                        <TableCell className="font-medium text-gray-900">
                          {field.label}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="capitalize">
                            {field.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {field.required ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-gray-400" />
                          )}
                        </TableCell>
                        <TableCell>
                          {field.options && field.options.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {field.options
                                .slice(0, 3)
                                .map((option, index) => (
                                  <Badge
                                    key={index}
                                    variant="outline"
                                    className="text-xs"
                                  >
                                    {option}
                                  </Badge>
                                ))}
                              {field.options.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{field.options.length - 3} more
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {field.order}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={field.is_active ? 'default' : 'secondary'}
                            className={
                              field.is_active
                                ? 'bg-green-100 text-green-800'
                                : ''
                            }
                          >
                            {field.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleEdit(field)}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDelete(field)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create/Edit Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingField
                  ? 'Edit Demographic Field'
                  : 'Create Demographic Field'}
              </DialogTitle>
              <DialogDescription>
                {editingField
                  ? 'Update the demographic field configuration.'
                  : 'Define a new demographic field for data collection.'}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="field">Field Name</Label>
                  <Input
                    id="field"
                    value={formData.field}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        field: e.target.value,
                      }))
                    }
                    placeholder="e.g., gender, tenure, department"
                    required
                  />
                  <p className="text-xs text-gray-500">
                    Internal field identifier (lowercase, no spaces)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="label">Display Label</Label>
                  <Input
                    id="label"
                    value={formData.label}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        label: e.target.value,
                      }))
                    }
                    placeholder="e.g., Gender, Tenure in Company"
                    required
                  />
                  <p className="text-xs text-gray-500">
                    User-friendly label shown in forms
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Field Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(
                      value: 'select' | 'text' | 'number' | 'date'
                    ) =>
                      setFormData((prev) => ({
                        ...prev,
                        type: value,
                        options: value === 'select' ? prev.options : [],
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Text</SelectItem>
                      <SelectItem value="number">Number</SelectItem>
                      <SelectItem value="date">Date</SelectItem>
                      <SelectItem value="select">Select (Dropdown)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="order">Display Order</Label>
                  <Input
                    id="order"
                    type="number"
                    value={formData.order}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        order: parseInt(e.target.value) || 0,
                      }))
                    }
                    min="0"
                  />
                  <p className="text-xs text-gray-500">
                    Order in which fields appear (lower numbers first)
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="required"
                  checked={formData.required}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({
                      ...prev,
                      required: checked as boolean,
                    }))
                  }
                />
                <Label htmlFor="required">Required field</Label>
              </div>

              {formData.type === 'select' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Options</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addOption}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Option
                    </Button>
                  </div>

                  {formData.options.map((option, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={option}
                        onChange={(e) => updateOption(index, e.target.value)}
                        placeholder={`Option ${index + 1}`}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeOption(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateDialog(false);
                    setEditingField(null);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-blue-600 to-purple-600"
                >
                  {editingField ? 'Update Field' : 'Create Field'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Bulk Upload Dialog */}
        <Dialog
          open={showBulkUploadDialog}
          onOpenChange={setShowBulkUploadDialog}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Bulk Upload Demographics
              </DialogTitle>
              <DialogDescription>
                Upload a CSV or Excel file to assign demographic data to users
                in bulk.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleBulkUpload} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="uploadCompany">Company</Label>
                <Select
                  value={uploadCompanyId}
                  onValueChange={setUploadCompanyId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select company" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((company) => (
                      <SelectItem key={company._id} value={company._id}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="file">File</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  required
                />
                <p className="text-xs text-gray-500">
                  Supported formats: CSV, Excel (.xlsx, .xls)
                </p>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">
                  File Format Requirements:
                </h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• First column must be "email" (required)</li>
                  <li>• Other columns should match demographic field names</li>
                  <li>• Select fields must use exact option values</li>
                  <li>• Date fields should be in YYYY-MM-DD format</li>
                </ul>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowBulkUploadDialog(false);
                    setUploadFile(null);
                    setUploadCompanyId('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!uploadFile || !uploadCompanyId || uploading}
                  className="bg-gradient-to-r from-blue-600 to-purple-600"
                >
                  {uploading ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <ConfirmationDialog />
    </>
  );
}
