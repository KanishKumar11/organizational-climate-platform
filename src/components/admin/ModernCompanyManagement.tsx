'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import {
  Building2,
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Users,
  Eye,
  Settings,
  Download,
  Grid3X3,
  List,
  CheckCircle,
  Clock,
  Target,
  BarChart3,
  Globe,
  Building,
  Crown,
  Shield,
  Briefcase,
} from 'lucide-react';

interface Company {
  _id: string;
  name: string;
  domain: string;
  industry: string;
  size: 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
  country: string;
  subscription_tier: 'basic' | 'professional' | 'enterprise';
  is_active: boolean;
  userCount?: number;
  created_at: string;
  updated_at: string;
}

interface CompanyFormData {
  name: string;
  domain: string;
  industry: string;
  size: Company['size'];
  country: string;
  subscription_tier: Company['subscription_tier'];
}

const COMPANY_SIZES = [
  { value: 'startup', label: '1-10 employees' },
  { value: 'small', label: '11-50 employees' },
  { value: 'medium', label: '51-200 employees' },
  { value: 'large', label: '201-1000 employees' },
  { value: 'enterprise', label: '1000+ employees' },
];

const SUBSCRIPTION_TIERS = [
  { value: 'basic', label: 'Basic' },
  { value: 'professional', label: 'Professional' },
  { value: 'enterprise', label: 'Enterprise' },
];

interface ModernCompanyManagementProps {
  userRole: string;
}

export default function ModernCompanyManagement({
  userRole,
}: ModernCompanyManagementProps) {
  const { showConfirmation, ConfirmationDialog } = useConfirmationDialog();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'active' | 'inactive'
  >('all');
  const [sizeFilter, setSizeFilter] = useState<string>('all');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [selectedCompanies, setSelectedCompanies] = useState<Set<string>>(
    new Set()
  );
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showInactive, setShowInactive] = useState(true);

  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form data
  const [formData, setFormData] = useState<CompanyFormData>({
    name: '',
    domain: '',
    industry: '',
    size: 'small',
    country: '',
    subscription_tier: 'basic',
  });

  // Fetch companies
  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/companies');
      if (response.ok) {
        const data = await response.json();
        setCompanies(data.companies || []);
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter companies
  const filteredCompanies = useMemo(() => {
    return companies.filter((company) => {
      const matchesSearch =
        company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        company.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
        company.industry.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && company.is_active) ||
        (statusFilter === 'inactive' && !company.is_active);

      const matchesSize = sizeFilter === 'all' || company.size === sizeFilter;
      const matchesTier =
        tierFilter === 'all' || company.subscription_tier === tierFilter;
      const matchesInactive = showInactive || company.is_active;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesSize &&
        matchesTier &&
        matchesInactive
      );
    });
  }, [
    companies,
    searchQuery,
    statusFilter,
    sizeFilter,
    tierFilter,
    showInactive,
  ]);

  // Statistics
  const stats = useMemo(() => {
    const active = companies.filter((c) => c.is_active).length;
    const inactive = companies.filter((c) => !c.is_active).length;
    const totalUsers = companies.reduce(
      (sum, c) => sum + (c.userCount || 0),
      0
    );
    const enterpriseClients = companies.filter(
      (c) => c.subscription_tier === 'enterprise'
    ).length;

    return {
      total: companies.length,
      active,
      inactive,
      totalUsers,
      enterpriseClients,
    };
  }, [companies]);

  // Company selection functions
  const toggleCompanySelection = (companyId: string) => {
    const newSelected = new Set(selectedCompanies);
    if (newSelected.has(companyId)) {
      newSelected.delete(companyId);
    } else {
      newSelected.add(companyId);
    }
    setSelectedCompanies(newSelected);
  };

  const selectAllCompanies = () => {
    setSelectedCompanies(new Set(filteredCompanies.map((c) => c._id)));
  };

  const clearSelection = () => {
    setSelectedCompanies(new Set());
  };

  // Form handlers
  const resetForm = () => {
    setFormData({
      name: '',
      domain: '',
      industry: '',
      size: 'small',
      country: '',
      subscription_tier: 'basic',
    });
    setEditingCompany(null);
  };

  const openEditDialog = (company: Company) => {
    setFormData({
      name: company.name,
      domain: company.domain,
      industry: company.industry,
      size: company.size,
      country: company.country,
      subscription_tier: company.subscription_tier,
    });
    setEditingCompany(company);
    setShowEditDialog(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const url = editingCompany
        ? `/api/admin/companies/${editingCompany._id}`
        : '/api/admin/companies';
      const method = editingCompany ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchCompanies();
        setShowCreateDialog(false);
        setShowEditDialog(false);
        resetForm();
      }
    } catch (error) {
      console.error('Error saving company:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteCompany = (company: Company) => {
    showConfirmation({
      title: 'Delete Company',
      description: `Are you sure you want to delete ${company.name}? This action cannot be undone and will affect all users from this company.`,
      confirmText: 'Delete',
      variant: 'destructive',
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/admin/companies/${company._id}`, {
            method: 'DELETE',
          });
          if (response.ok) {
            await fetchCompanies();
          }
        } catch (error) {
          console.error('Error deleting company:', error);
        }
      },
    });
  };

  // Helper functions
  const getTierIcon = (tier: Company['subscription_tier']) => {
    switch (tier) {
      case 'enterprise':
        return <Crown className="h-4 w-4 text-white" />;
      case 'professional':
        return <Shield className="h-4 w-4 text-white" />;
      default:
        return <Briefcase className="h-4 w-4 text-white" />;
    }
  };

  const getTierColor = (tier: Company['subscription_tier']) => {
    switch (tier) {
      case 'enterprise':
        return 'bg-gradient-to-br from-orange-500 to-orange-600';
      case 'professional':
        return 'bg-gradient-to-br from-purple-500 to-purple-600';
      default:
        return 'bg-gradient-to-br from-blue-500 to-blue-600';
    }
  };

  const getSizeLabel = (size: Company['size']) => {
    return COMPANY_SIZES.find((s) => s.value === size)?.label || size;
  };

  // Render company card
  const renderCompanyCard = (company: Company): React.ReactNode => {
    const isSelected = selectedCompanies.has(company._id);
    const tierIcon = getTierIcon(company.subscription_tier);
    const tierColor = getTierColor(company.subscription_tier);

    return (
      <Card
        key={company._id}
        className={`group relative overflow-hidden transition-all duration-200 hover:shadow-lg hover:shadow-blue-100/50 hover:-translate-y-1 border-0 bg-gradient-to-br from-white to-gray-50/30 cursor-pointer ${
          isSelected ? 'ring-2 ring-blue-500 shadow-lg shadow-blue-100/50' : ''
        } ${!company.is_active ? 'opacity-75' : ''}`}
      >
        {/* Status Indicator Strip */}
        <div
          className={`absolute top-0 left-0 right-0 h-1 ${
            company.is_active
              ? 'bg-gradient-to-r from-green-400 to-emerald-500'
              : 'bg-gradient-to-r from-gray-300 to-gray-400'
          }`}
        />

        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => toggleCompanySelection(company._id)}
                className="h-4 w-4 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 cursor-pointer"
              />

              <div
                className={`relative p-2.5 rounded-xl shadow-sm transition-all duration-200 ${tierColor}`}
              >
                {tierIcon}
                {company.is_active && (
                  <div className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 bg-green-400 rounded-full border border-white shadow-sm" />
                )}
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-gray-100 cursor-pointer"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={() => openEditDialog(company)}
                  className="cursor-pointer"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Company
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">
                  <Users className="h-4 w-4 mr-2" />
                  Manage Users
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => deleteCompany(company)}
                  className="cursor-pointer text-red-600 focus:text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Company
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="space-y-3">
            <div>
              <h3
                className={`font-bold text-lg truncate ${company.is_active ? 'text-gray-900' : 'text-gray-600'}`}
              >
                {company.name}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                  {company.domain}
                </code>
                {!company.is_active && (
                  <Badge variant="secondary" className="text-xs">
                    Inactive
                  </Badge>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500 font-medium">Industry</p>
                <p className="font-semibold text-gray-900 truncate">
                  {company.industry}
                </p>
              </div>
              <div>
                <p className="text-gray-500 font-medium">Size</p>
                <p className="font-semibold text-gray-900">
                  {getSizeLabel(company.size)}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <div className="flex items-center gap-1 text-sm">
                <Users className="h-4 w-4 text-gray-500" />
                <span className="font-semibold text-gray-900">
                  {company.userCount || 0}
                </span>
                <span className="text-gray-500">users</span>
              </div>
              <Badge
                variant={
                  company.subscription_tier === 'enterprise'
                    ? 'default'
                    : 'secondary'
                }
                className="text-xs font-medium"
              >
                {
                  SUBSCRIPTION_TIERS.find(
                    (t) => t.value === company.subscription_tier
                  )?.label
                }
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Render company list item
  const renderCompanyListItem = (company: Company): React.ReactNode => {
    const isSelected = selectedCompanies.has(company._id);
    const tierIcon = getTierIcon(company.subscription_tier);
    const tierColor = getTierColor(company.subscription_tier);

    return (
      <div
        key={company._id}
        className={`group relative flex items-center gap-4 p-4 rounded-xl border-0 transition-all duration-200 hover:shadow-md hover:shadow-blue-100/30 bg-gradient-to-r from-white to-gray-50/30 cursor-pointer ${
          isSelected
            ? 'bg-gradient-to-r from-blue-50/50 to-white shadow-md shadow-blue-100/50 ring-1 ring-blue-200'
            : 'hover:bg-gradient-to-r hover:from-gray-50/50 hover:to-white'
        } ${!company.is_active ? 'opacity-75' : ''}`}
      >
        {/* Status Indicator */}
        <div
          className={`absolute left-0 top-2 bottom-2 w-1 rounded-r-full ${
            company.is_active
              ? 'bg-gradient-to-b from-green-400 to-emerald-500'
              : 'bg-gradient-to-b from-gray-300 to-gray-400'
          }`}
        />

        <div className="flex items-center gap-4 flex-1 min-w-0 pl-2">
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => toggleCompanySelection(company._id)}
            className="h-4 w-4 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 cursor-pointer"
          />

          <div
            className={`relative p-2.5 rounded-xl shadow-sm transition-all duration-200 ${tierColor}`}
          >
            {tierIcon}
            {company.is_active && (
              <div className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 bg-green-400 rounded-full border border-white shadow-sm" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <h3
                className={`font-bold text-base truncate ${company.is_active ? 'text-gray-900' : 'text-gray-600'}`}
              >
                {company.name}
              </h3>
              <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                {company.domain}
              </code>
              {!company.is_active && (
                <Badge
                  variant="secondary"
                  className="text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200"
                >
                  Inactive
                </Badge>
              )}
            </div>
            <p className="text-sm text-gray-600 truncate">{company.industry}</p>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-xs text-gray-500 font-medium">Size</p>
              <p className="text-sm font-semibold text-gray-900">
                {getSizeLabel(company.size)}
              </p>
            </div>

            <div className="text-center">
              <p className="text-xs text-gray-500 font-medium">Users</p>
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3 text-gray-500" />
                <p className="text-sm font-semibold text-gray-900">
                  {company.userCount || 0}
                </p>
              </div>
            </div>

            <div className="text-center">
              <p className="text-xs text-gray-500 font-medium">Tier</p>
              <Badge
                variant={
                  company.subscription_tier === 'enterprise'
                    ? 'default'
                    : 'secondary'
                }
                className="text-xs font-medium"
              >
                {
                  SUBSCRIPTION_TIERS.find(
                    (t) => t.value === company.subscription_tier
                  )?.label
                }
              </Badge>
            </div>

            <div className="text-center">
              <p className="text-xs text-gray-500 font-medium">Country</p>
              <div className="flex items-center gap-1">
                <Globe className="h-3 w-3 text-gray-500" />
                <p className="text-sm font-semibold text-gray-900 truncate max-w-20">
                  {company.country}
                </p>
              </div>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-gray-100 cursor-pointer"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                onClick={() => openEditDialog(company)}
                className="cursor-pointer"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Company
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <Users className="h-4 w-4 mr-2" />
                Manage Users
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => deleteCompany(company)}
                className="cursor-pointer text-red-600 focus:text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Company
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loading size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Building2 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold">{stats.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Clock className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Inactive</p>
                <p className="text-2xl font-bold">{stats.inactive}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{stats.totalUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Crown className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Enterprise</p>
                <p className="text-2xl font-bold">{stats.enterpriseClients}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Card */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <CardTitle className="text-2xl">Company Management</CardTitle>
              <p className="text-muted-foreground mt-1">
                Manage authorized companies and their platform access
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <Button
                onClick={() => {
                  resetForm();
                  setShowCreateDialog(true);
                }}
                className="bg-blue-600 hover:bg-blue-700 cursor-pointer"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Company
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="cursor-pointer">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem className="cursor-pointer">
                    <Download className="h-4 w-4 mr-2" />
                    Export Companies
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer">
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Search and Filters */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search companies by name, domain, or industry..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* View Mode Toggle */}
              <div className="flex items-center border rounded-lg p-1">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="h-8 px-3 cursor-pointer"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="h-8 px-3 cursor-pointer"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2">
                <Checkbox
                  id="show-inactive"
                  checked={showInactive}
                  onCheckedChange={(checked) =>
                    setShowInactive(checked === true)
                  }
                  className="cursor-pointer"
                />
                <Label htmlFor="show-inactive" className="text-sm">
                  Show inactive
                </Label>
              </div>

              <Select
                value={statusFilter}
                onValueChange={(value: any) => setStatusFilter(value)}
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sizeFilter} onValueChange={setSizeFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sizes</SelectItem>
                  {COMPANY_SIZES.map((size) => (
                    <SelectItem key={size.value} value={size.value}>
                      {size.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={tierFilter} onValueChange={setTierFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Tier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tiers</SelectItem>
                  {SUBSCRIPTION_TIERS.map((tier) => (
                    <SelectItem key={tier.value} value={tier.value}>
                      {tier.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedCompanies.size > 0 && (
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-blue-900">
                  {selectedCompanies.size} compan
                  {selectedCompanies.size > 1 ? 'ies' : 'y'} selected
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearSelection}
                  className="cursor-pointer"
                >
                  Clear
                </Button>
                <Button variant="outline" size="sm" className="cursor-pointer">
                  Export Selected
                </Button>
                <Button variant="outline" size="sm" className="cursor-pointer">
                  Bulk Actions
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Companies Display */}
      <div className="space-y-4">
        {/* View Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {filteredCompanies.length} of {companies.length} companies
            </span>
            {selectedCompanies.size > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={selectAllCompanies}
                className="cursor-pointer"
              >
                Select All ({filteredCompanies.length})
              </Button>
            )}
          </div>
        </div>

        {/* Companies Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loading size="lg" />
          </div>
        ) : filteredCompanies.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Building2 className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No companies found
              </h3>
              <p className="text-gray-600 text-center mb-4">
                {searchQuery ||
                statusFilter !== 'all' ||
                sizeFilter !== 'all' ||
                tierFilter !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Get started by adding your first company'}
              </p>
              <Button
                onClick={() => {
                  resetForm();
                  setShowCreateDialog(true);
                }}
                className="cursor-pointer"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Company
              </Button>
            </CardContent>
          </Card>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCompanies.map((company) => renderCompanyCard(company))}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredCompanies.map((company) => renderCompanyListItem(company))}
          </div>
        )}
      </div>

      {/* Create Company Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Company</DialogTitle>
            <DialogDescription>
              Add a new company to authorize users from their email domain.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Company Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Acme Corporation"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="domain">Email Domain *</Label>
                <Input
                  id="domain"
                  value={formData.domain}
                  onChange={(e) =>
                    setFormData({ ...formData, domain: e.target.value })
                  }
                  placeholder="acme.com"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="industry">Industry *</Label>
                <Input
                  id="industry"
                  value={formData.industry}
                  onChange={(e) =>
                    setFormData({ ...formData, industry: e.target.value })
                  }
                  placeholder="Technology"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country *</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) =>
                    setFormData({ ...formData, country: e.target.value })
                  }
                  placeholder="United States"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="size">Company Size *</Label>
                <Select
                  value={formData.size}
                  onValueChange={(value: Company['size']) =>
                    setFormData({ ...formData, size: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent>
                    {COMPANY_SIZES.map((size) => (
                      <SelectItem key={size.value} value={size.value}>
                        {size.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tier">Subscription Tier *</Label>
                <Select
                  value={formData.subscription_tier}
                  onValueChange={(value: Company['subscription_tier']) =>
                    setFormData({ ...formData, subscription_tier: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select tier" />
                  </SelectTrigger>
                  <SelectContent>
                    {SUBSCRIPTION_TIERS.map((tier) => (
                      <SelectItem key={tier.value} value={tier.value}>
                        {tier.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="cursor-pointer"
              >
                {isSubmitting ? 'Creating...' : 'Create Company'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Company Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Company</DialogTitle>
            <DialogDescription>
              Update company information and settings.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Company Name *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Acme Corporation"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-domain">Email Domain *</Label>
                <Input
                  id="edit-domain"
                  value={formData.domain}
                  onChange={(e) =>
                    setFormData({ ...formData, domain: e.target.value })
                  }
                  placeholder="acme.com"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-industry">Industry *</Label>
                <Input
                  id="edit-industry"
                  value={formData.industry}
                  onChange={(e) =>
                    setFormData({ ...formData, industry: e.target.value })
                  }
                  placeholder="Technology"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-country">Country *</Label>
                <Input
                  id="edit-country"
                  value={formData.country}
                  onChange={(e) =>
                    setFormData({ ...formData, country: e.target.value })
                  }
                  placeholder="United States"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-size">Company Size *</Label>
                <Select
                  value={formData.size}
                  onValueChange={(value: Company['size']) =>
                    setFormData({ ...formData, size: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent>
                    {COMPANY_SIZES.map((size) => (
                      <SelectItem key={size.value} value={size.value}>
                        {size.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-tier">Subscription Tier *</Label>
                <Select
                  value={formData.subscription_tier}
                  onValueChange={(value: Company['subscription_tier']) =>
                    setFormData({ ...formData, subscription_tier: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select tier" />
                  </SelectTrigger>
                  <SelectContent>
                    {SUBSCRIPTION_TIERS.map((tier) => (
                      <SelectItem key={tier.value} value={tier.value}>
                        {tier.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowEditDialog(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="cursor-pointer"
              >
                {isSubmitting ? 'Updating...' : 'Update Company'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmationDialog />
    </div>
  );
}
