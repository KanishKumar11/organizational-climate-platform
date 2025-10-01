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
import { Switch } from '@/components/ui/switch';
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
  useCompanies,
  useCreateCompany,
  useUpdateCompany,
  useDeleteCompany,
  useToggleCompanyStatus,
  useResendInvitation,
  type Company,
  type CompanyFormData,
  type CompanyStats,
} from '@/hooks/useCompanies';
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
  Table as TableIcon,
  Clock,
  Target,
  BarChart3,
  Globe,
  Building,
  Crown,
  Shield,
  Briefcase,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Mail,
} from 'lucide-react';

const COMPANY_SIZES = [
  { value: 'startup', label: '1-10 employees' },
  { value: 'small', label: '11-50 employees' },
  { value: 'medium', label: '51-200 employees' },
  { value: 'large', label: '51-200 employees' },
  { value: 'enterprise', label: '1000+ employees' },
];

const SUBSCRIPTION_TIERS = [
  { value: 'basic', label: 'Basic' },
  { value: 'professional', label: 'Professional' },
  { value: 'enterprise', label: 'Enterprise' },
];

const INDUSTRIES = [
  { value: 'technology', label: 'Technology' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'finance', label: 'Finance' },
  { value: 'education', label: 'Education' },
  { value: 'retail', label: 'Retail' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'consulting', label: 'Consulting' },
  { value: 'real_estate', label: 'Real Estate' },
  { value: 'non_profit', label: 'Non-Profit' },
  { value: 'government', label: 'Government' },
  { value: 'other', label: 'Other' },
];

const sizeSortOrder: Record<Company['size'], number> = {
  startup: 0,
  small: 1,
  medium: 2,
  large: 3,
  enterprise: 4,
};

const tierSortOrder: Record<Company['subscription_tier'], number> = {
  basic: 0,
  professional: 1,
  enterprise: 2,
};

interface ModernCompanyManagementProps {
  userRole: string;
  onStatsChange?: (stats: CompanyStats) => void;
}

type CompanySortField =
  | 'name'
  | 'domain'
  | 'industry'
  | 'size'
  | 'subscription_tier'
  | 'userCount'
  | 'created_at'
  | 'is_active';

export default function ModernCompanyManagement({
  userRole,
  onStatsChange,
}: ModernCompanyManagementProps) {
  const router = useRouter();
  const { showConfirmation, ConfirmationDialog } = useConfirmationDialog();
  const { success: toastSuccess, error: toastError } = useToast();

  // React Query hooks
  const { data, isLoading, error } = useCompanies();
  const createCompanyMutation = useCreateCompany();
  const updateCompanyMutation = useUpdateCompany();
  const deleteCompanyMutation = useDeleteCompany();
  const toggleStatusMutation = useToggleCompanyStatus();
  const resendInvitationMutation = useResendInvitation();

  const companies = data?.companies || [];
  const companyStats = data?.stats;

  // Update parent with stats when they change
  useEffect(() => {
    if (companyStats && onStatsChange) {
      onStatsChange(companyStats);
    }
  }, [companyStats, onStatsChange]);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'active' | 'inactive'
  >('all');
  const [sizeFilter, setSizeFilter] = useState<string>('all');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [selectedCompanies, setSelectedCompanies] = useState<Set<string>>(
    new Set()
  );
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'table'>('table');
  const [sortField, setSortField] = useState<CompanySortField>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showInactive, setShowInactive] = useState(true);

  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);

  // Form data
  const [formData, setFormData] = useState<CompanyFormData>({
    name: '',
    domain: '',
    industry: '',
    size: 'small',
    country: '',
    subscription_tier: 'basic',
    admin_email: '',
    admin_message: '',
    send_invitation: true,
  });

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

  const sortedCompanies = useMemo(() => {
    const companiesToSort = [...filteredCompanies];

    const getComparableValue = (company: Company): number | string => {
      switch (sortField) {
        case 'name':
          return company.name?.toLowerCase() ?? '';
        case 'domain':
          return company.domain?.toLowerCase() ?? '';
        case 'industry':
          return company.industry?.toLowerCase() ?? '';
        case 'size':
          return sizeSortOrder[company.size] ?? 0;
        case 'subscription_tier':
          return tierSortOrder[company.subscription_tier] ?? 0;
        case 'userCount':
          return company.userCount ?? 0;
        case 'created_at':
          return company.created_at
            ? new Date(company.created_at).getTime()
            : 0;
        case 'is_active':
          return company.is_active ? 1 : 0;
        default:
          return company.name?.toLowerCase() ?? '';
      }
    };

    companiesToSort.sort((a, b) => {
      const valueA = getComparableValue(a);
      const valueB = getComparableValue(b);

      if (typeof valueA === 'number' && typeof valueB === 'number') {
        const diff = valueA - valueB;
        if (diff === 0) {
          return a.name.localeCompare(b.name);
        }
        return sortOrder === 'asc' ? diff : -diff;
      }

      const comparison = valueA.toString().localeCompare(valueB.toString());
      if (comparison === 0) {
        return a.name.localeCompare(b.name);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return companiesToSort;
  }, [filteredCompanies, sortField, sortOrder]);

  // Statistics
  const stats = useMemo<CompanyStats>(() => {
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

  useEffect(() => {
    if (onStatsChange) {
      onStatsChange(stats);
    }
  }, [stats, onStatsChange]);

  const numberFormatter = useMemo(() => new Intl.NumberFormat('en-US'), []);
  const formatNumber = (value: number) => numberFormatter.format(value);

  const activePercent =
    stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0;
  const inactivePercent =
    stats.total > 0 ? Math.round((stats.inactive / stats.total) * 100) : 0;
  const enterprisePercent =
    stats.total > 0
      ? Math.round((stats.enterpriseClients / stats.total) * 100)
      : 0;
  const averageUsers =
    stats.total > 0 ? Math.round(stats.totalUsers / stats.total) : 0;

  const statCards = [
    {
      key: 'total',
      label: 'Total Companies',
      value: stats.total,
      icon: Building2,
      iconBg: 'bg-blue-500/10',
      iconColor: 'text-blue-600',
      accent: 'from-blue-500 via-sky-500 to-transparent',
      badge: stats.total > 0 ? `${activePercent}% active` : 'Syncing',
      badgeClass: 'bg-blue-50 text-blue-600',
      description: `${formatNumber(stats.active)} active · ${formatNumber(stats.inactive)} inactive`,
      progress: null as number | null,
      progressLabel: null as string | null,
      progressColor: '',
    },
    {
      key: 'users',
      label: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      iconBg: 'bg-emerald-500/10',
      iconColor: 'text-emerald-600',
      accent: 'from-emerald-500 via-teal-500 to-transparent',
      badge: stats.totalUsers > 0 ? 'Adoption' : 'No users',
      badgeClass: 'bg-emerald-50 text-emerald-600',
      description:
        stats.total > 0
          ? `≈ ${formatNumber(averageUsers)} users per company`
          : 'Awaiting user data',
      progress: null,
      progressLabel: null,
      progressColor: '',
    },
    {
      key: 'enterprise',
      label: 'Enterprise Clients',
      value: stats.enterpriseClients,
      icon: Crown,
      iconBg: 'bg-amber-500/10',
      iconColor: 'text-amber-600',
      accent: 'from-amber-500 via-orange-500 to-transparent',
      badge:
        stats.enterpriseClients > 0
          ? `${enterprisePercent}% premium`
          : 'Grow premium',
      badgeClass: 'bg-amber-50 text-amber-600',
      description:
        stats.enterpriseClients > 0
          ? 'High-value contracts onboard'
          : 'No enterprise contracts yet',
      progress: null,
      progressLabel: null,
      progressColor: '',
    },
    {
      key: 'inactive',
      label: 'Inactive Companies',
      value: stats.inactive,
      icon: Clock,
      iconBg: 'bg-rose-500/10',
      iconColor: 'text-rose-600',
      accent: 'from-rose-500 via-pink-500 to-transparent',
      badge: inactivePercent > 0 ? 'Re-engage' : 'All active',
      badgeClass:
        inactivePercent > 0
          ? 'bg-rose-50 text-rose-600'
          : 'bg-gray-100 text-gray-600',
      description:
        inactivePercent > 0
          ? `${inactivePercent}% of portfolio`
          : 'All companies active',
      progress: inactivePercent,
      progressLabel: 'Inactive share',
      progressColor: 'bg-rose-500',
    },
  ];

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
    setSelectedCompanies(new Set(sortedCompanies.map((c) => c._id)));
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
      admin_email: '',
      admin_message: '',
      send_invitation: true,
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
      admin_email: '',
      admin_message: '',
      send_invitation: false,
    });
    setEditingCompany(company);
    setShowEditDialog(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { send_invitation, admin_email, admin_message, ...companyPayload } =
      formData;
    const isCreating = !editingCompany;
    const companyName = companyPayload.name;

    try {
      if (isCreating) {
        // Handle company creation with invitation
        const createPayload = {
          ...companyPayload,
          send_invitation,
          admin_email,
          admin_message,
        };

        await createCompanyMutation.mutateAsync(createPayload);

        // Handle invitation separately if needed
        if (send_invitation && admin_email) {
          // The invitation logic is now handled in the API
          // We could add additional invitation handling here if needed
        }

        setShowCreateDialog(false);
      } else {
        // Handle company update
        await updateCompanyMutation.mutateAsync({
          id: editingCompany!._id,
          data: companyPayload,
        });
        setShowEditDialog(false);
      }

      resetForm();
    } catch (error) {
      // Error handling is done in the mutations
      console.error('Error saving company:', error);
    }
  };

  const deleteCompany = (company: Company) => {
    setCompanyToDelete(company);
    setShowDeleteDialog(true);
  };

  const confirmDeleteCompany = async () => {
    if (!companyToDelete) return;

    setDeleteError(null); // Clear any previous error

    try {
      await deleteCompanyMutation.mutateAsync(companyToDelete._id);
      setShowDeleteDialog(false);
      setCompanyToDelete(null);
    } catch (error) {
      // Set error message to display in dialog
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to delete company';
      setDeleteError(errorMessage);
      console.error('Error deleting company:', error);
    }
  };

  const resendInvitation = async (company: Company) => {
    try {
      await resendInvitationMutation.mutateAsync(company._id);
    } catch (error) {
      // Error handling is done in the mutation
      console.error('Error resending invitation:', error);
    }
  };

  // Export functions
  const exportCompanies = (companiesToExport: Company[]) => {
    try {
      const csvData = companiesToExport.map((company) => ({
        Name: company.name,
        Domain: company.domain,
        Industry: company.industry,
        Size: company.size,
        Country: company.country,
        'Subscription Tier': company.subscription_tier,
        'User Count': company.userCount || 0,
        Status: company.is_active ? 'Active' : 'Inactive',
        'Created At': new Date(company.created_at).toLocaleDateString(),
        'Updated At': new Date(company.updated_at).toLocaleDateString(),
      }));

      const headers = Object.keys(csvData[0]);
      const csvContent = [
        headers.join(','),
        ...csvData.map((row) =>
          headers
            .map((header) => `"${row[header as keyof typeof row]}"`)
            .join(',')
        ),
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute(
        'download',
        `companies_export_${new Date().toISOString().split('T')[0]}.csv`
      );
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Companies exported successfully!', {
        description: `Exported ${companiesToExport.length} companies to CSV.`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export companies', {
        description: 'An error occurred while exporting the data.',
      });
    }
  };

  const exportAllCompanies = () => {
    exportCompanies(companies);
  };

  const exportSelectedCompanies = () => {
    const selectedCompaniesData = companies.filter((company) =>
      selectedCompanies.has(company._id)
    );
    if (selectedCompaniesData.length === 0) {
      toast.error('No companies selected', {
        description: 'Please select companies to export.',
      });
      return;
    }
    exportCompanies(selectedCompaniesData);
  };

  // Navigation functions
  const viewCompanyDetails = (company: Company) => {
    router.push(`/admin/companies/${company._id}`);
  };

  const manageUsers = (company: Company) => {
    // TODO: Navigate to user management page for this company
    toast.info(`User management for ${company.name} - Feature coming soon`);
  };

  const handleBulkActions = () => {
    // TODO: Implement bulk actions functionality
    toast.info('Bulk actions - Feature coming soon');
  };

  // Settings functions
  const openSettings = () => {
    setShowSettingsDialog(true);
  };

  const deactivateCompany = (company: Company) => {
    const action = company.is_active ? 'deactivate' : 'activate';
    const actionText = company.is_active ? 'Deactivate' : 'Activate';

    showConfirmation({
      title: `${actionText} Company`,
      description: `Are you sure you want to ${action} ${company.name}? ${company.is_active ? 'This will prevent users from accessing the system.' : 'This will restore access for all users.'}`,
      confirmText: actionText,
      variant: company.is_active ? 'default' : 'default',
      onConfirm: async () => {
        try {
          await toggleStatusMutation.mutateAsync({
            id: company._id,
            is_active: !company.is_active,
          });
        } catch (error) {
          // Error handling is done in the mutation
          console.error(`Error ${action}ing company:`, error);
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

  const formatDate = (value: string) =>
    value ? new Date(value).toLocaleDateString() : '--';

  const handleSort = (field: CompanySortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (field: CompanySortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 text-muted-foreground" />;
    }

    return sortOrder === 'asc' ? (
      <ArrowUp className="h-4 w-4 text-blue-600" />
    ) : (
      <ArrowDown className="h-4 w-4 text-blue-600" />
    );
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
                <DropdownMenuItem
                  onClick={() => openSettings()}
                  className="cursor-pointer"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Manage Settings
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
              <DropdownMenuItem
                onClick={() => openSettings()}
                className="cursor-pointer"
              >
                <Settings className="h-4 w-4 mr-2" />
                Manage Settings
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    );
  };

  const renderCompaniesTable = (): React.ReactNode => {
    const headerState: boolean | 'indeterminate' =
      sortedCompanies.length > 0 &&
      selectedCompanies.size === sortedCompanies.length
        ? true
        : selectedCompanies.size > 0
          ? 'indeterminate'
          : false;

    return (
      <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={headerState}
                    onCheckedChange={(checked) => {
                      if (checked === true) {
                        setSelectedCompanies(
                          new Set(sortedCompanies.map((company) => company._id))
                        );
                      } else {
                        setSelectedCompanies(new Set());
                      }
                    }}
                    className="cursor-pointer"
                  />
                </TableHead>
                <TableHead
                  onClick={() => handleSort('name')}
                  className="cursor-pointer select-none"
                >
                  <div className="flex items-center gap-2">
                    Company
                    {getSortIcon('name')}
                  </div>
                </TableHead>
                <TableHead
                  onClick={() => handleSort('industry')}
                  className="cursor-pointer select-none"
                >
                  <div className="flex items-center gap-2">
                    Industry
                    {getSortIcon('industry')}
                  </div>
                </TableHead>
                <TableHead
                  onClick={() => handleSort('size')}
                  className="cursor-pointer select-none"
                >
                  <div className="flex items-center gap-2">
                    Size
                    {getSortIcon('size')}
                  </div>
                </TableHead>
                <TableHead
                  onClick={() => handleSort('subscription_tier')}
                  className="cursor-pointer select-none"
                >
                  <div className="flex items-center gap-2">
                    Tier
                    {getSortIcon('subscription_tier')}
                  </div>
                </TableHead>
                <TableHead
                  onClick={() => handleSort('userCount')}
                  className="cursor-pointer select-none"
                >
                  <div className="flex items-center gap-2">
                    Users
                    {getSortIcon('userCount')}
                  </div>
                </TableHead>
                <TableHead
                  onClick={() => handleSort('created_at')}
                  className="cursor-pointer select-none"
                >
                  <div className="flex items-center gap-2">
                    Created
                    {getSortIcon('created_at')}
                  </div>
                </TableHead>
                <TableHead
                  onClick={() => handleSort('is_active')}
                  className="cursor-pointer select-none"
                >
                  <div className="flex items-center gap-2">
                    Status
                    {getSortIcon('is_active')}
                  </div>
                </TableHead>
                <TableHead className="w-12">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedCompanies.map((company) => {
                const isSelected = selectedCompanies.has(company._id);
                const tierIcon = getTierIcon(company.subscription_tier);
                const tierColor = getTierColor(company.subscription_tier);

                return (
                  <TableRow
                    key={company._id}
                    className={`hover:bg-slate-50/70 ${
                      isSelected ? 'bg-blue-50/40' : ''
                    } ${!company.is_active ? 'opacity-80' : ''}`}
                  >
                    <TableCell>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() =>
                          toggleCompanySelection(company._id)
                        }
                        className="cursor-pointer"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div
                          className={`relative flex h-10 w-10 items-center justify-center rounded-xl ${tierColor}`}
                        >
                          {tierIcon}
                          {company.is_active && (
                            <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border border-white bg-emerald-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 truncate">
                            {company.name}
                          </p>
                          <code className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
                            {company.domain}
                          </code>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-700">
                      {company.industry}
                    </TableCell>
                    <TableCell className="text-slate-700">
                      {getSizeLabel(company.size)}
                    </TableCell>
                    <TableCell>
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
                            (tier) => tier.value === company.subscription_tier
                          )?.label
                        }
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-slate-700">
                        <Users className="h-4 w-4 text-slate-400" />
                        <span className="font-medium">
                          {formatNumber(company.userCount ?? 0)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-700">
                      {formatDate(company.created_at)}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          company.is_active
                            ? 'bg-emerald-50 text-emerald-600'
                            : 'bg-rose-50 text-rose-600'
                        }`}
                      >
                        {company.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-slate-100 cursor-pointer"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem
                            onClick={() => openEditDialog(company)}
                            className="cursor-pointer"
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Company
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => openSettings()}
                            className="cursor-pointer"
                          >
                            <Settings className="mr-2 h-4 w-4" />
                            Manage Settings
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loading size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Dashboard */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card
              key={card.key}
              className="relative overflow-hidden border border-slate-200/60 bg-white/95 backdrop-blur transition-all duration-150 hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div
                className={`pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${card.accent}`}
              />
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-2xl ${card.iconBg}`}
                  >
                    <Icon className={`h-4 w-4 ${card.iconColor}`} />
                  </div>
                  {card.badge && (
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${card.badgeClass}`}
                    >
                      {card.badge}
                    </span>
                  )}
                </div>
                <p className="mt-4 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  {card.label}
                </p>
                <div className="mt-1.5 flex items-baseline gap-2">
                  <span className="text-2xl font-semibold text-slate-900">
                    {formatNumber(card.value)}
                  </span>
                </div>
                {card.description && (
                  <p className="mt-2 text-xs text-slate-500">
                    {card.description}
                  </p>
                )}
                {card.progress !== null && card.progressLabel && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-[10px] uppercase tracking-wide text-slate-400">
                      <span>{card.progressLabel}</span>
                      <span>{card.progress}%</span>
                    </div>
                    <div className="mt-1.5 h-1.5 w-full rounded-full bg-slate-200/70">
                      <div
                        className={`h-full rounded-full ${card.progressColor}`}
                        style={{ width: `${Math.min(card.progress, 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
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
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={exportAllCompanies}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export Companies
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={openSettings}
                  >
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
                  variant={viewMode === 'table' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('table')}
                  className="h-8 px-3 cursor-pointer"
                >
                  <TableIcon className="h-4 w-4" />
                </Button>
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportSelectedCompanies}
                  className="cursor-pointer"
                >
                  Export Selected
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkActions}
                  className="cursor-pointer"
                >
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
              {sortedCompanies.length} of {companies.length} companies
            </span>
            {selectedCompanies.size > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={selectAllCompanies}
                className="cursor-pointer"
              >
                Select All ({sortedCompanies.length})
              </Button>
            )}
          </div>
        </div>

        {/* Companies Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loading size="lg" />
          </div>
        ) : sortedCompanies.length === 0 ? (
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
        ) : viewMode === 'table' ? (
          renderCompaniesTable()
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedCompanies.map((company) => renderCompanyCard(company))}
          </div>
        ) : (
          <div className="space-y-3">
            {sortedCompanies.map((company) => renderCompanyListItem(company))}
          </div>
        )}
      </div>

      {/* Create Company Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[520px] max-h-[85vh] overflow-y-auto">
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
                <Select
                  value={formData.industry}
                  onValueChange={(value: string) =>
                    setFormData({ ...formData, industry: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {INDUSTRIES.map((industry) => (
                      <SelectItem key={industry.value} value={industry.value}>
                        {industry.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="send_invitation"
                  checked={formData.send_invitation}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      send_invitation: checked === true,
                    })
                  }
                />
                <Label
                  htmlFor="send_invitation"
                  className="text-sm font-medium cursor-pointer"
                >
                  Send invitation to company administrator
                </Label>
              </div>

              {formData.send_invitation && (
                <div className="space-y-4 pl-6 border-l-2 border-blue-100">
                  <div className="space-y-2">
                    <Label htmlFor="admin_email">Administrator Email *</Label>
                    <Input
                      id="admin_email"
                      type="email"
                      placeholder="admin@company.com"
                      value={formData.admin_email}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          admin_email: e.target.value,
                        })
                      }
                      required={formData.send_invitation}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admin_message">
                      Personal Message (Optional)
                    </Label>
                    <Textarea
                      id="admin_message"
                      placeholder="Welcome to our organizational climate platform! We're excited to have you on board..."
                      value={formData.admin_message}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          admin_message: e.target.value,
                        })
                      }
                      rows={3}
                      className="resize-none"
                    />
                  </div>
                  <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-md">
                    <p className="font-medium">What happens next:</p>
                    <ul className="mt-1 space-y-1 text-xs">
                      <li>
                        • The administrator will receive an invitation email
                      </li>
                      <li>
                        • They can complete their profile and company setup
                      </li>
                      <li>
                        • They'll be able to invite employees and start surveys
                      </li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
                disabled={createCompanyMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createCompanyMutation.isPending}
                className="cursor-pointer"
              >
                {createCompanyMutation.isPending
                  ? 'Creating...'
                  : 'Create Company'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Company Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[520px] max-h-[85vh] overflow-y-auto">
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
                <Select
                  value={formData.industry}
                  onValueChange={(value: string) =>
                    setFormData({ ...formData, industry: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {INDUSTRIES.map((industry) => (
                      <SelectItem key={industry.value} value={industry.value}>
                        {industry.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                disabled={updateCompanyMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateCompanyMutation.isPending}
                className="cursor-pointer"
              >
                {updateCompanyMutation.isPending
                  ? 'Updating...'
                  : 'Update Company'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Company Confirmation Dialog */}
      <Dialog
        open={showDeleteDialog}
        onOpenChange={(open) => {
          setShowDeleteDialog(open);
          if (!open) {
            setDeleteError(null);
            setCompanyToDelete(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <div className="flex flex-col items-center gap-4">
            <div
              className="flex size-12 shrink-0 items-center justify-center rounded-full border-2 border-red-200 bg-red-50"
              aria-hidden="true"
            >
              <Trash2 className="text-red-600 opacity-80" size={24} />
            </div>
            <DialogHeader className="text-center">
              <DialogTitle className="text-lg font-semibold">
                Delete Company
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Are you sure you want to delete {companyToDelete?.name}? This
                action cannot be undone and will permanently remove the company
                and all associated data.
              </DialogDescription>
              {deleteError && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600 font-medium">Error</p>
                  <p className="text-sm text-red-600 mt-1">{deleteError}</p>
                </div>
              )}
            </DialogHeader>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={deleteCompanyMutation.isPending}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmDeleteCompany}
              disabled={deleteCompanyMutation.isPending}
              className="flex-1"
            >
              {deleteCompanyMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                  Deleting...
                </>
              ) : (
                'Delete Permanently'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Company Management Settings</DialogTitle>
            <DialogDescription>
              Configure display and behavior settings for company management.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Show Inactive Companies</Label>
                  <p className="text-sm text-muted-foreground">
                    Display companies that have been deactivated
                  </p>
                </div>
                <Switch
                  checked={showInactive}
                  onCheckedChange={setShowInactive}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Default View Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Choose the default display mode for companies
                  </p>
                </div>
                <Select
                  value={viewMode}
                  onValueChange={(value: 'grid' | 'list' | 'table') =>
                    setViewMode(value)
                  }
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="table">Table</SelectItem>
                    <SelectItem value="grid">Grid</SelectItem>
                    <SelectItem value="list">List</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Default Sort Field</Label>
                  <p className="text-sm text-muted-foreground">
                    Choose how companies are sorted by default
                  </p>
                </div>
                <Select
                  value={sortField}
                  onValueChange={(value: CompanySortField) =>
                    setSortField(value)
                  }
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="created_at">Date Created</SelectItem>
                    <SelectItem value="userCount">User Count</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Sort Order</Label>
                  <p className="text-sm text-muted-foreground">
                    Choose ascending or descending order
                  </p>
                </div>
                <Select
                  value={sortOrder}
                  onValueChange={(value: 'asc' | 'desc') => setSortOrder(value)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">Ascending</SelectItem>
                    <SelectItem value="desc">Descending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowSettingsDialog(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmationDialog />
    </div>
  );
}
