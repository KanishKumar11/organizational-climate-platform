'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useTranslations } from '@/contexts/TranslationContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  EnhancedTabs as Tabs,
  EnhancedTabsContent as TabsContent,
  EnhancedTabsList as TabsList,
  EnhancedTabsTrigger as TabsTrigger,
} from '@/components/ui/enhanced-tabs';
import AnimatedCounter from '@/components/charts/AnimatedCounter';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

import {
  Building2,
  Users,
  FileText,
  TrendingUp,
  AlertCircle,
  Search,
  Plus,
  Activity,
  Database,
  Cpu,
  Zap,
  Eye,
  BarChart3,
  CheckCircle,
} from 'lucide-react';
import { INDUSTRIES } from '@/lib/constants';

interface GlobalKPIs {
  totalCompanies: number;
  totalUsers: number;
  activeUsers: number;
  totalSurveys: number;
  activeSurveys: number;
  totalResponses: number;
  userGrowthRate: number;
  surveyCompletionRate: number;
}

interface CompanyMetric {
  _id: string;
  name: string;
  user_count: number;
  survey_count: number;
  active_surveys: number;
  created_at: string;
}

interface SystemHealth {
  database_status: string;
  api_response_time: number;
  active_connections: number;
  memory_usage: number;
  cpu_usage: number;
}

interface OngoingSurvey {
  _id: string;
  title: string;
  type: string;
  start_date: string;
  end_date: string;
  response_count: number;
  target_responses: number;
  company_id: { name: string };
  created_by: { name: string };
}

interface RecentActivity {
  type: string;
  title: string;
  description: string;
  timestamp: string;
  company: string;
}

interface Company {
  _id: string;
  name: string;
  industry: string;
  employee_count: number;
}

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  company_id?: { name: string };
}

interface Survey {
  _id: string;
  title: string;
  status: string;
  company_id?: { name: string };
  type?: string;
}

interface Department {
  _id: string;
  name: string;
}

interface SearchResult {
  surveys: Survey[];
  users: User[];
  companies: Company[];
  departments: Department[];
  total: number;
}

interface CompanyFormData {
  name: string;
  domain: string;
  industry: string;
  size: 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
  country: string;
  subscription_tier: 'basic' | 'professional' | 'enterprise';
  admin_email: string;
  admin_message?: string;
  send_invitation: boolean;
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

export default function SuperAdminDashboard() {
  useAuth();
  const router = useRouter();
  const { success, error } = useToast();
  const t = useTranslations('dashboard');
  const common = useTranslations('common');
  const nav = useTranslations('navigation');
  const [dashboardData, setDashboardData] = useState<{
    globalKPIs: GlobalKPIs;
    companyMetrics: CompanyMetric[];
    systemHealth: SystemHealth;
    ongoingSurveys: OngoingSurvey[];
    recentActivity: RecentActivity[];
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [loading, setLoading] = useState(true);

  // Company dialog state
  const [showCreateCompanyDialog, setShowCreateCompanyDialog] = useState(false);
  const [isSubmittingCompany, setIsSubmittingCompany] = useState(false);
  const [domainValidationError, setDomainValidationError] =
    useState<string>('');
  const [adminEmailValidationError, setAdminEmailValidationError] =
    useState<string>('');
  const [companyFormData, setCompanyFormData] = useState<CompanyFormData>({
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

  const fetchDashboardData = useCallback(async () => {
    try {
      const response = await fetch('/api/dashboard/super-admin');
      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const performSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch(
        `/api/dashboard/search?q=${encodeURIComponent(searchQuery)}&type=all`
      );
      if (response.ok) {
        const data = await response.json();
        setSearchResults({
          surveys: data.results.surveys || [],
          companies: data.results.companies || [],
          users: data.results.users || [],
          departments: data.results.departments || [],
          total: data.total || 0,
        });
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery]);

  // Domain validation function
  const validateDomain = (domain: string): string => {
    if (!domain.trim()) {
      return 'Domain is required';
    }

    // Remove any protocol or www prefix
    const cleanDomain = domain
      .replace(/^(https?:\/\/)?(www\.)?/, '')
      .toLowerCase();

    // Basic domain format validation
    const domainRegex =
      /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;

    if (!domainRegex.test(cleanDomain)) {
      return 'Please enter a valid domain (e.g., company.com)';
    }

    // Check for invalid characters
    if (cleanDomain.includes(' ')) {
      return 'Domain cannot contain spaces';
    }

    // Check for consecutive dots
    if (cleanDomain.includes('..')) {
      return 'Domain cannot contain consecutive dots';
    }

    // Check minimum length
    if (cleanDomain.length < 4) {
      return 'Domain must be at least 4 characters long';
    }

    // Check maximum length
    if (cleanDomain.length > 253) {
      return 'Domain is too long (maximum 253 characters)';
    }

    // Check for valid TLD
    const tldRegex = /\.[a-zA-Z]{2,}$/;
    if (!tldRegex.test(cleanDomain)) {
      return 'Domain must have a valid top-level domain (e.g., .com, .org)';
    }

    return '';
  };

  // Admin email validation function
  const validateAdminEmail = (email: string, companyDomain: string): string => {
    if (!email.trim()) {
      return 'Admin email is required';
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address';
    }

    // Extract domain from email
    const emailDomain = email.split('@')[1]?.toLowerCase();
    if (!emailDomain) {
      return 'Invalid email format';
    }

    // Clean company domain
    const cleanCompanyDomain = companyDomain
      .replace(/^(https?:\/\/)?(www\.)?/, '')
      .toLowerCase();

    // Check if email domain matches company domain
    if (emailDomain !== cleanCompanyDomain) {
      return `Email domain must match company domain (${cleanCompanyDomain})`;
    }

    return '';
  };

  // Company management functions
  const resetCompanyForm = () => {
    setCompanyFormData({
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
    setDomainValidationError('');
    setAdminEmailValidationError('');
  };

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate domain before submission
    const domainError = validateDomain(companyFormData.domain);
    if (domainError) {
      setDomainValidationError(domainError);
      return;
    }

    // Validate admin email if invitation is enabled
    if (companyFormData.send_invitation && companyFormData.admin_email) {
      const emailError = validateAdminEmail(
        companyFormData.admin_email,
        companyFormData.domain
      );
      if (emailError) {
        setAdminEmailValidationError(emailError);
        return;
      }
    }

    setIsSubmittingCompany(true);

    try {
      console.log('Submitting company data:', companyFormData);

      const response = await fetch('/api/admin/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(companyFormData),
      });

      const responseData = await response.json();
      console.log('API Response:', responseData);

      if (response.ok) {
        console.log('Company created successfully');

        // Company creation API handles invitation sending automatically
        if (companyFormData.send_invitation && companyFormData.admin_email) {
          success(
            'Company created and invitation sent successfully!',
            `${companyFormData.name} has been added to the system and ${companyFormData.admin_email} has been invited.`
          );
        } else {
          success(
            'Company created successfully!',
            `${companyFormData.name} has been added to the system.`
          );
        }

        setShowCreateCompanyDialog(false);
        resetCompanyForm();
        // Refresh dashboard data to show new company
        await fetchDashboardData();
      } else {
        console.error('Failed to create company:', responseData);
        const errorMessage =
          responseData.error ||
          responseData.message ||
          'Unknown error occurred';
        error('Failed to create company', errorMessage);
      }
    } catch (err) {
      console.error('Error creating company:', err);
      error(
        'Error creating company',
        err instanceof Error ? err.message : 'Network error occurred'
      );
    } finally {
      setIsSubmittingCompany(false);
    }
  };

  // Quick action handlers
  const handleAddCompany = () => {
    resetCompanyForm();
    setShowCreateCompanyDialog(true);
  };

  const handleCreateGlobalSurvey = () => {
    router.push('/surveys/create');
  };

  const handleGenerateSystemReport = () => {
    router.push('/reports');
  };

  const handleManageSystemUsers = () => {
    router.push('/admin/companies');
  };

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    if (searchQuery.length >= 2) {
      const debounceTimer = setTimeout(() => {
        performSearch();
      }, 300);
      return () => clearTimeout(debounceTimer);
    } else {
      setSearchResults(null);
    }
  }, [searchQuery, performSearch]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'survey_created':
        return <FileText className="h-4 w-4 text-blue-500" />;
      case 'user_registered':
        return <Users className="h-4 w-4 text-green-500" />;
      case 'company_created':
        return <Building2 className="h-4 w-4 text-purple-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {common('error')}
        </h3>
        <p className="text-gray-600 mb-4">{t('failedToLoadDashboard')}</p>
        <Button onClick={fetchDashboardData}>{common('retry')}</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 dark:from-slate-900 dark:via-blue-900/20 dark:to-indigo-900/20 min-h-screen">
      {/* Modern Header */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 p-4 sm:p-6 lg:p-8 xl:p-12 border border-blue-200/50 dark:border-blue-700/50">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="relative">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 sm:gap-6 lg:gap-8">
            <div className="space-y-4 sm:space-y-6 w-full lg:w-auto">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="p-2 sm:p-3 lg:p-4 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 rounded-xl sm:rounded-2xl shadow-lg ring-2 ring-white/20">
                  <Database className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2 font-montserrat">
                    {t('superAdminTitle')}
                  </h1>
                  <p className="text-sm sm:text-base lg:text-lg text-gray-600 dark:text-gray-300 font-montserrat">
                    {t('superAdminDescription')}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 lg:flex lg:flex-wrap items-center gap-3 sm:gap-4 lg:gap-6 text-xs sm:text-sm text-gray-600 dark:text-gray-300 font-montserrat">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full shadow-sm flex-shrink-0" />
                  <span className="font-medium truncate">
                    {dashboardData?.globalKPIs.totalCompanies || 0}{' '}
                    {nav('companies')}
                  </span>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full shadow-sm flex-shrink-0" />
                  <span className="font-medium truncate">
                    {dashboardData?.globalKPIs.totalUsers || 0}{' '}
                    {t('totalUsers')}
                  </span>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full shadow-sm flex-shrink-0" />
                  <span className="font-medium truncate">
                    {dashboardData?.globalKPIs.activeSurveys || 0}{' '}
                    {t('activeSurveys')}
                  </span>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 bg-gradient-to-r from-pink-500 to-red-500 rounded-full shadow-sm flex-shrink-0" />
                  <span className="font-medium truncate">
                    {dashboardData?.globalKPIs.surveyCompletionRate || 0}%{' '}
                    {t('completion')}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-col lg:flex-col gap-5 lg:max-w-md w-full">
              {/* Search Bar */}
              <div className="flex justify-start lg:justify-start">
                <div className="relative lg:max-w-md w-full">
                  <Input
                    placeholder={t('searchPlaceholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        performSearch();
                      }
                    }}
                    className="h-10 sm:h-12 w-full pr-12 sm:pr-16 text-sm sm:text-base border-2 border-blue-300 dark:border-blue-600 bg-white dark:bg-slate-800 backdrop-blur shadow-lg focus:shadow-xl focus:ring-4 focus:ring-blue-500/30 focus:border-blue-500 transition-all duration-300 rounded-xl sm:rounded-2xl font-montserrat"
                  />
                  <Button
                    onClick={performSearch}
                    disabled={isSearching || !searchQuery.trim()}
                    className="absolute right-1 sm:right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 sm:h-8 sm:w-8 p-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200 rounded-lg sm:rounded-xl font-montserrat font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSearching ? (
                      <div className="animate-spin h-2.5 w-2.5 sm:h-3 sm:w-3 border-2 border-white border-t-transparent rounded-full" />
                    ) : (
                      <Search className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Create Survey Button - Separate Row */}
              <div className="flex justify-start lg:justify-end">
                <Button
                  className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200 h-10 sm:h-12 px-4 sm:px-6 w-full sm:w-auto lg:w-auto rounded-xl sm:rounded-2xl font-montserrat font-semibold text-sm sm:text-base"
                  onClick={() => router.push('/surveys/create')}
                >
                  <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                  <span className="hidden xs:inline">{t('createSurvey')}</span>
                  <span className="xs:hidden">Create</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search Results */}
      {searchResults && (
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50 p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900 dark:text-white font-montserrat">
              Search Results ({searchResults.total})
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchResults(null)}
              className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              ×
            </Button>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {searchResults.surveys?.map((survey) => (
              <div
                key={survey._id}
                className="flex items-center justify-between p-3 rounded-lg bg-gray-50/50 dark:bg-slate-700/50 hover:bg-gray-100/70 dark:hover:bg-slate-600/50 transition-colors duration-200"
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-blue-500 rounded-md">
                    <FileText className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white text-sm font-montserrat">
                      {survey.title}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-montserrat">
                      {survey.company_id?.name} • {survey.type}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-md font-montserrat ${
                    survey.status === 'active'
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {survey.status}
                </span>
              </div>
            ))}
            {searchResults.companies?.map((company) => (
              <div
                key={company._id}
                className="flex items-center justify-between p-3 rounded-lg bg-gray-50/50 dark:bg-slate-700/50 hover:bg-gray-100/70 dark:hover:bg-slate-600/50 transition-colors duration-200"
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-indigo-500 rounded-md">
                    <Building2 className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white text-sm font-montserrat">
                      {company.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-montserrat">
                      {company.industry} • {company.employee_count} employees
                    </p>
                  </div>
                </div>
                <span className="text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-2 py-1 rounded-md font-montserrat">
                  Company
                </span>
              </div>
            ))}
            {searchResults.users?.map((user) => (
              <div
                key={user._id}
                className="flex items-center justify-between p-3 rounded-lg bg-gray-50/50 dark:bg-slate-700/50 hover:bg-gray-100/70 dark:hover:bg-slate-600/50 transition-colors duration-200"
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-purple-500 rounded-md">
                    <Users className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white text-sm font-montserrat">
                      {user.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-montserrat">
                      {user.company_id?.name} • {user.role}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-md font-montserrat ${
                    user.role === 'company_admin'
                      ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                      : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                  }`}
                >
                  {user.role}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Enhanced Global KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="group relative overflow-hidden border-0  bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/30 dark:via-indigo-900/30 dark:to-purple-900/30 backdrop-blur rounded-3xl hover:shadow-2xl transition-all duration-500 hover:scale-105 shadow-none">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <CardContent className="relative p-8">
            <div className="flex items-start justify-between mb-6">
              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 rounded-2xl shadow-xl w-fit ring-4 ring-white/30 group-hover:ring-blue-300/50 transition-all duration-300">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-blue-700 dark:text-blue-300 font-montserrat uppercase tracking-wider">
                    {t('totalCompanies')}
                  </p>
                  <p className="text-4xl font-black text-gray-900 dark:text-white font-montserrat">
                    <AnimatedCounter
                      value={dashboardData.globalKPIs.totalCompanies}
                    />
                  </p>
                </div>
              </div>
              <div className="text-right">
                <Badge className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-0 rounded-2xl mb-3 font-montserrat font-semibold px-3 py-1 shadow-lg">
                  +{dashboardData.globalKPIs.userGrowthRate.toFixed(1)}%{' '}
                  {common('growth')}
                </Badge>
                <p className="text-xs text-blue-600 dark:text-blue-400 font-montserrat font-medium">
                  {t('monthlyGrowth')}
                </p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-blue-700 dark:text-blue-300 font-montserrat font-semibold">
                  {common('active')}
                </span>
                <span className="font-bold font-montserrat text-gray-900 dark:text-white">
                  {dashboardData.globalKPIs.totalCompanies}
                </span>
              </div>
              <div className="w-full bg-white/50 dark:bg-slate-700/50 rounded-full h-3 shadow-inner">
                <div
                  className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 h-3 rounded-full shadow-lg"
                  style={{ width: '100%' }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden border-0 shadow-none bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-900/30 dark:via-purple-900/30 dark:to-pink-900/30 backdrop-blur rounded-3xl hover:shadow-2xl transition-all duration-500 hover:scale-105">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <CardContent className="relative p-8">
            <div className="flex items-start justify-between mb-6">
              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl shadow-xl w-fit ring-4 ring-white/30 group-hover:ring-indigo-300/50 transition-all duration-300">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-300 font-montserrat uppercase tracking-wider">
                    {t('totalUsers')}
                  </p>
                  <p className="text-4xl font-black text-gray-900 dark:text-white font-montserrat">
                    <AnimatedCounter
                      value={dashboardData.globalKPIs.totalUsers}
                    />
                  </p>
                </div>
              </div>
              <div className="text-right">
                <Badge className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-0 rounded-2xl mb-3 font-montserrat font-semibold px-3 py-1 shadow-lg">
                  {dashboardData.globalKPIs.activeUsers} {common('active')}
                </Badge>
                <p className="text-xs text-indigo-600 dark:text-indigo-400 font-montserrat font-medium">
                  {t('activeUsers')}
                </p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-indigo-700 dark:text-indigo-300 font-montserrat font-semibold">
                  {t('activeRate')}
                </span>
                <span className="font-bold font-montserrat text-gray-900 dark:text-white">
                  {dashboardData.globalKPIs.totalUsers > 0
                    ? Math.round(
                        (dashboardData.globalKPIs.activeUsers /
                          dashboardData.globalKPIs.totalUsers) *
                          100
                      )
                    : 0}
                  %
                </span>
              </div>
              <div className="w-full bg-white/50 dark:bg-slate-700/50 rounded-full h-3 shadow-inner">
                <div
                  className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 h-3 rounded-full shadow-lg"
                  style={{
                    width: `${
                      dashboardData.globalKPIs.totalUsers > 0
                        ? Math.min(
                            (dashboardData.globalKPIs.activeUsers /
                              dashboardData.globalKPIs.totalUsers) *
                              100,
                            100
                          )
                        : 0
                    }%`,
                  }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden border-0 shadow-none bg-gradient-to-br from-purple-50 via-pink-50 to-red-50 dark:from-purple-900/30 dark:via-pink-900/30 dark:to-red-900/30 backdrop-blur rounded-3xl hover:shadow-2xl transition-all duration-500 hover:scale-105">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <CardContent className="relative p-8">
            <div className="flex items-start justify-between mb-6">
              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 rounded-2xl shadow-xl w-fit ring-4 ring-white/30 group-hover:ring-purple-300/50 transition-all duration-300">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-purple-700 dark:text-purple-300 font-montserrat uppercase tracking-wider">
                    {t('totalSurveys')}
                  </p>
                  <p className="text-4xl font-black text-gray-900 dark:text-white font-montserrat">
                    <AnimatedCounter
                      value={dashboardData.globalKPIs.totalSurveys}
                    />
                  </p>
                </div>
              </div>
              <div className="text-right">
                <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 rounded-2xl mb-3 font-montserrat font-semibold px-3 py-1 shadow-lg">
                  {dashboardData.globalKPIs.activeSurveys} {common('active')}
                </Badge>
                <p className="text-xs text-purple-600 dark:text-purple-400 font-montserrat font-medium">
                  {t('currentlyRunning')}
                </p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-purple-700 dark:text-purple-300 font-montserrat font-semibold">
                  {t('activeRate')}
                </span>
                <span className="font-bold font-montserrat text-gray-900 dark:text-white">
                  {dashboardData.globalKPIs.totalSurveys > 0
                    ? Math.round(
                        (dashboardData.globalKPIs.activeSurveys /
                          dashboardData.globalKPIs.totalSurveys) *
                          100
                      )
                    : 0}
                  %
                </span>
              </div>
              <div className="w-full bg-white/50 dark:bg-slate-700/50 rounded-full h-3 shadow-inner">
                <div
                  className="bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 h-3 rounded-full shadow-lg"
                  style={{
                    width: `${
                      dashboardData.globalKPIs.totalSurveys > 0
                        ? Math.min(
                            (dashboardData.globalKPIs.activeSurveys /
                              dashboardData.globalKPIs.totalSurveys) *
                              100,
                            100
                          )
                        : 0
                    }%`,
                  }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden border-0 shadow-none bg-gradient-to-br from-pink-50 via-red-50 to-orange-50 dark:from-pink-900/30 dark:via-red-900/30 dark:to-orange-900/30 backdrop-blur rounded-3xl hover:shadow-2xl transition-all duration-500 hover:scale-105">
          <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 via-red-500/10 to-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <CardContent className="relative p-8">
            <div className="flex items-start justify-between mb-6">
              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-br from-pink-500 via-red-500 to-orange-500 rounded-2xl shadow-xl w-fit ring-4 ring-white/30 group-hover:ring-pink-300/50 transition-all duration-300">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-pink-700 dark:text-pink-300 font-montserrat uppercase tracking-wider">
                    {t('completionRate')}
                  </p>
                  <p className="text-4xl font-black text-gray-900 dark:text-white font-montserrat">
                    <AnimatedCounter
                      value={dashboardData.globalKPIs.surveyCompletionRate}
                    />
                    %
                  </p>
                </div>
              </div>
              <div className="text-right">
                <Badge className="bg-gradient-to-r from-pink-500 to-red-500 text-white border-0 rounded-2xl mb-3 font-montserrat font-semibold px-3 py-1 shadow-lg">
                  {dashboardData.globalKPIs.totalResponses} {t('responses')}
                </Badge>
                <p className="text-xs text-pink-600 dark:text-pink-400 font-montserrat font-medium">
                  {t('totalResponses')}
                </p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-pink-700 dark:text-pink-300 font-montserrat font-semibold">
                  {t('completion')}
                </span>
                <span className="font-bold font-montserrat text-gray-900 dark:text-white">
                  {dashboardData.globalKPIs.surveyCompletionRate}%
                </span>
              </div>
              <div className="w-full bg-white/50 dark:bg-slate-700/50 rounded-full h-3 shadow-inner">
                <div
                  className="bg-gradient-to-r from-pink-500 via-red-500 to-orange-500 h-3 rounded-full shadow-lg"
                  style={{
                    width: `${Math.min(dashboardData.globalKPIs.surveyCompletionRate, 100)}%`,
                  }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <div className="   bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 bg-transparent p-0 h-auto gap-0">
            <TabsTrigger
              value="overview"
              className="group relative flex items-center justify-center gap-1 sm:gap-2 py-3 sm:py-4 px-1 sm:px-2 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-blue-50/50 dark:data-[state=active]:bg-blue-900/20 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 transition-all duration-200 hover:bg-blue-50/30 dark:hover:bg-blue-900/10"
            >
              <Activity className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500 dark:text-blue-400 group-data-[state=active]:text-blue-600 dark:group-data-[state=active]:text-blue-400" />
              <div className="text-center">
                <div className="font-semibold text-xs sm:text-sm font-montserrat text-gray-700 dark:text-gray-300 group-data-[state=active]:text-blue-600 dark:group-data-[state=active]:text-blue-400">
                  <span className="hidden xs:inline">{t('overview')}</span>
                  <span className="xs:hidden">Overview</span>
                </div>
              </div>
            </TabsTrigger>

            <TabsTrigger
              value="companies"
              className="group relative flex items-center justify-center gap-1 sm:gap-2 py-3 sm:py-4 px-1 sm:px-2 rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-500 data-[state=active]:bg-indigo-50/50 dark:data-[state=active]:bg-indigo-900/20 data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-400 transition-all duration-200 hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10"
            >
              <Building2 className="h-3 w-3 sm:h-4 sm:w-4 text-indigo-500 dark:text-indigo-400 group-data-[state=active]:text-indigo-600 dark:group-data-[state=active]:text-indigo-400" />
              <div className="text-center">
                <div className="font-semibold text-xs sm:text-sm font-montserrat text-gray-700 dark:text-gray-300 group-data-[state=active]:text-indigo-600 dark:group-data-[state=active]:text-indigo-400">
                  <span className="hidden xs:inline">{t('companies')}</span>
                  <span className="xs:hidden">Companies</span>
                </div>
              </div>
            </TabsTrigger>

            <TabsTrigger
              value="system"
              className="group relative flex items-center justify-center gap-1 sm:gap-2 py-3 sm:py-4 px-1 sm:px-2 rounded-none border-b-2 border-transparent data-[state=active]:border-purple-500 data-[state=active]:bg-purple-50/50 dark:data-[state=active]:bg-purple-900/20 data-[state=active]:text-purple-600 dark:data-[state=active]:text-purple-400 transition-all duration-200 hover:bg-purple-50/30 dark:hover:bg-purple-900/10"
            >
              <Cpu className="h-3 w-3 sm:h-4 sm:w-4 text-purple-500 dark:text-purple-400 group-data-[state=active]:text-purple-600 dark:group-data-[state=active]:text-purple-400" />
              <div className="text-center">
                <div className="font-semibold text-xs sm:text-sm font-montserrat text-gray-700 dark:text-gray-300 group-data-[state=active]:text-purple-600 dark:group-data-[state=active]:text-purple-400">
                  <span className="hidden xs:inline">{t('systemHealth')}</span>
                  <span className="xs:hidden">System</span>
                </div>
              </div>
            </TabsTrigger>

            <TabsTrigger
              value="surveys"
              className="group relative flex items-center justify-center gap-1 sm:gap-2 py-3 sm:py-4 px-1 sm:px-2 rounded-none border-b-2 border-transparent data-[state=active]:border-pink-500 data-[state=active]:bg-pink-50/50 dark:data-[state=active]:bg-pink-900/20 data-[state=active]:text-pink-600 dark:data-[state=active]:text-pink-400 transition-all duration-200 hover:bg-pink-50/30 dark:hover:bg-pink-900/10"
            >
              <FileText className="h-3 w-3 sm:h-4 sm:w-4 text-pink-500 dark:text-pink-400 group-data-[state=active]:text-pink-600 dark:group-data-[state=active]:text-pink-400" />
              <div className="text-center">
                <div className="font-semibold text-xs sm:text-sm font-montserrat text-gray-700 dark:text-gray-300 group-data-[state=active]:text-pink-600 dark:group-data-[state=active]:text-pink-400">
                  <span className="hidden xs:inline">{t('activeSurveys')}</span>
                  <span className="xs:hidden">Surveys</span>
                </div>
              </div>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab Content */}
        <div className="p-3 sm:p-4 lg:p-6 pt-2 sm:pt-3 lg:pt-4">
          <TabsContent value="overview" className="space-y-4 sm:space-y-6 mt-0">
            {/* System Status Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 border border-green-200/50 dark:border-green-700/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-green-800 dark:text-green-200 font-montserrat text-sm">
                      System Status
                    </div>
                    <div className="text-xs text-green-600 dark:text-green-400 font-montserrat">
                      All systems operational
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-blue-200/50 dark:border-blue-700/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-blue-800 dark:text-blue-200 font-montserrat text-sm">
                      Active Users
                    </div>
                    <div className="text-xs text-blue-600 dark:text-blue-400 font-montserrat">
                      {dashboardData.globalKPIs.totalUsers} online
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-4 border border-purple-200/50 dark:border-purple-700/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500 rounded-lg">
                    <FileText className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-purple-800 dark:text-purple-200 font-montserrat text-sm">
                      Active Surveys
                    </div>
                    <div className="text-xs text-purple-600 dark:text-purple-400 font-montserrat">
                      {dashboardData.ongoingSurveys.length} running
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Recent Activity - Compact */}
              <div className="lg:col-span-2">
                <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50 p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-500 rounded-lg">
                      <Activity className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white font-montserrat">
                        {t('recentActivity')}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-montserrat">
                        Latest system events
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {dashboardData.recentActivity
                      .slice(0, 5)
                      .map((activity, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-3 p-3 rounded-lg bg-gray-50/50 dark:bg-slate-700/50 hover:bg-gray-100/70 dark:hover:bg-slate-600/50 transition-colors duration-200"
                        >
                          <div className="p-1.5 bg-blue-500 rounded-md mt-0.5">
                            {getActivityIcon(activity.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 dark:text-white text-sm font-montserrat truncate">
                              {activity.title}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-montserrat truncate">
                              {activity.description}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-gray-400 dark:text-gray-500 font-montserrat">
                                {new Date(
                                  activity.timestamp
                                ).toLocaleDateString()}
                              </span>
                              {activity.company && (
                                <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-md font-montserrat">
                                  {activity.company}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>

              {/* Quick Actions - Compact */}
              <div>
                <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50 p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-green-500 rounded-lg">
                      <Zap className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white font-montserrat">
                        {t('quickActions')}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-montserrat">
                        Common tasks
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Button
                      className="w-full justify-start h-auto p-3 rounded-lg border border-purple-200 dark:border-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-colors duration-200 group"
                      variant="outline"
                      size="sm"
                      onClick={handleAddCompany}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-purple-500 rounded-md">
                          <Plus className="h-4 w-4 text-white" />
                        </div>
                        <div className="text-left">
                          <div className="font-medium text-gray-900 dark:text-white text-sm font-montserrat">
                            {t('addNewCompany')}
                          </div>
                        </div>
                      </div>
                    </Button>

                    <Button
                      className="w-full justify-start h-auto p-3 rounded-lg border border-blue-200 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors duration-200 group"
                      variant="outline"
                      size="sm"
                      onClick={handleCreateGlobalSurvey}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-blue-500 rounded-md">
                          <FileText className="h-4 w-4 text-white" />
                        </div>
                        <div className="text-left">
                          <div className="font-medium text-gray-900 dark:text-white text-sm font-montserrat">
                            {t('createGlobalSurvey')}
                          </div>
                        </div>
                      </div>
                    </Button>

                    <Button
                      className="w-full justify-start h-auto p-3 rounded-lg border border-orange-200 dark:border-orange-700 hover:bg-orange-50 dark:hover:bg-orange-900/30 transition-colors duration-200 group"
                      variant="outline"
                      size="sm"
                      onClick={handleGenerateSystemReport}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-orange-500 rounded-md">
                          <BarChart3 className="h-4 w-4 text-white" />
                        </div>
                        <div className="text-left">
                          <div className="font-medium text-gray-900 dark:text-white text-sm font-montserrat">
                            {t('generateSystemReport')}
                          </div>
                        </div>
                      </div>
                    </Button>

                    <Button
                      className="w-full justify-start h-auto p-3 rounded-lg border border-green-200 dark:border-green-700 hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors duration-200 group"
                      variant="outline"
                      size="sm"
                      onClick={handleManageSystemUsers}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-green-500 rounded-md">
                          <Users className="h-4 w-4 text-white" />
                        </div>
                        <div className="text-left">
                          <div className="font-medium text-gray-900 dark:text-white text-sm font-montserrat">
                            {t('manageSystemUsers')}
                          </div>
                        </div>
                      </div>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="companies" className="space-y-6 mt-0">
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50 p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-indigo-500 rounded-lg">
                  <Building2 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white font-montserrat">
                    {t('companyPerformance')}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-montserrat">
                    Organization metrics and analytics
                  </p>
                </div>
              </div>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {dashboardData.companyMetrics.map((company) => (
                  <div
                    key={company._id}
                    className="flex items-center justify-between p-4 rounded-lg bg-gray-50/50 dark:bg-slate-700/50 hover:bg-gray-100/70 dark:hover:bg-slate-600/50 transition-colors duration-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-500 rounded-md">
                        <Building2 className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white text-sm font-montserrat">
                          {company.name}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-montserrat">
                          {t('added')}{' '}
                          {new Date(company.created_at).toLocaleDateString()}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-md font-montserrat">
                            {company.user_count} {nav('users')}
                          </span>
                          <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-md font-montserrat">
                            {company.survey_count} {nav('surveys')}
                          </span>
                          <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-md font-montserrat">
                            {company.active_surveys} {common('active')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900 dark:text-white font-montserrat">
                          {company.user_count}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 font-montserrat">
                          {t('totalUsers')}
                        </div>
                      </div>
                      <Button
                        className="bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-montserrat"
                        size="sm"
                        onClick={() =>
                          router.push(`/admin/companies/${company._id}`)
                        }
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        {common('viewDetails')}
                      </Button>
                    </div>
                  </div>
                ))}
                {dashboardData.companyMetrics.length === 0 && (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Building2 className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="font-bold text-gray-900 dark:text-white mb-2 font-montserrat">
                      {t('noCompaniesYet')}
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-4 text-sm font-montserrat">
                      {t('startByAddingFirstCompany')}
                    </p>
                    <Button
                      onClick={handleAddCompany}
                      className="bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-montserrat"
                      size="sm"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      {t('addFirstCompany')}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="system" className="space-y-4 sm:space-y-6 mt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50 p-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-green-500 rounded-lg">
                    <Database className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white font-montserrat">
                      {t('databaseHealth')}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-montserrat">
                      System database status
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 font-montserrat">
                      {common('status')}
                    </span>
                    <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded-md font-montserrat">
                      {dashboardData.systemHealth.database_status}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 font-montserrat">
                      {t('activeConnections')}
                    </span>
                    <span className="text-lg font-bold text-gray-900 dark:text-white font-montserrat">
                      {dashboardData.systemHealth.active_connections}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                    <div className="text-xs text-green-600 dark:text-green-400 font-montserrat">
                      {t('allSystemsOperational')}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50 p-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <Zap className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white font-montserrat">
                      {t('performance')}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-montserrat">
                      API response times
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 font-montserrat">
                      {t('apiResponse')}
                    </span>
                    <span
                      className={`text-lg font-bold font-montserrat ${
                        dashboardData.systemHealth.api_response_time < 100
                          ? 'text-green-600 dark:text-green-400'
                          : dashboardData.systemHealth.api_response_time < 200
                            ? 'text-yellow-600 dark:text-yellow-400'
                            : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {dashboardData.systemHealth.api_response_time.toFixed(0)}
                      ms
                    </span>
                  </div>
                  <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                    <div className="text-xs text-gray-500 dark:text-gray-400 font-montserrat">
                      {dashboardData.systemHealth.api_response_time < 100
                        ? t('excellent')
                        : dashboardData.systemHealth.api_response_time < 200
                          ? t('good')
                          : t('needsAttention')}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50 p-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-purple-500 rounded-lg">
                    <Cpu className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white font-montserrat">
                      {t('systemResources')}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-montserrat">
                      CPU and memory usage
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 font-montserrat">
                      {t('cpuUsage')}
                    </span>
                    <span
                      className={`text-lg font-bold font-montserrat ${
                        dashboardData.systemHealth.cpu_usage < 70
                          ? 'text-green-600 dark:text-green-400'
                          : dashboardData.systemHealth.cpu_usage < 90
                            ? 'text-yellow-600 dark:text-yellow-400'
                            : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {dashboardData.systemHealth.cpu_usage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 font-montserrat">
                      {t('memoryUsage')}
                    </span>
                    <span
                      className={`text-lg font-bold font-montserrat ${
                        dashboardData.systemHealth.memory_usage < 70
                          ? 'text-green-600 dark:text-green-400'
                          : dashboardData.systemHealth.memory_usage < 90
                            ? 'text-yellow-600 dark:text-yellow-400'
                            : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {dashboardData.systemHealth.memory_usage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                    <div className="text-xs text-gray-500 dark:text-gray-400 font-montserrat">
                      {t('systemRunningSmoothly')}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="surveys" className="space-y-6 mt-0">
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50 p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-pink-500 rounded-lg">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white font-montserrat">
                    {t('currentOngoingSurveys')}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-montserrat">
                    Active surveys across all organizations
                  </p>
                </div>
              </div>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {dashboardData.ongoingSurveys.map((survey) => (
                  <div
                    key={survey._id}
                    className="flex items-center justify-between p-4 rounded-lg bg-gray-50/50 dark:bg-slate-700/50 hover:bg-gray-100/70 dark:hover:bg-slate-600/50 transition-colors duration-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-pink-500 rounded-md">
                        <FileText className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white text-sm font-montserrat">
                          {survey.title}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-montserrat">
                          {survey.company_id.name} • {survey.type}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 font-montserrat">
                          {t('createdBy')} {survey.created_by.name}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 px-2 py-0.5 rounded-md font-montserrat">
                            {survey.response_count || 0} {common('responses')}
                          </span>
                          <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-md font-montserrat">
                            {t('target')}: {survey.target_responses}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900 dark:text-white font-montserrat">
                          {Math.round(
                            ((survey.response_count || 0) /
                              survey.target_responses) *
                              100
                          )}
                          %
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 font-montserrat">
                          {t('completion')}
                        </div>
                        <div className="w-16 bg-gray-200/50 dark:bg-gray-700/50 rounded-full h-1.5 mt-1">
                          <div
                            className="bg-pink-500 h-1.5 rounded-full"
                            style={{
                              width: `${Math.min(((survey.response_count || 0) / survey.target_responses) * 100, 100)}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                      <Button
                        className="bg-pink-500 hover:bg-pink-600 text-white rounded-lg font-montserrat"
                        size="sm"
                        onClick={() => router.push(`/surveys/${survey._id}`)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
                {dashboardData.ongoingSurveys.length === 0 && (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-pink-500 rounded-full flex items-center justify-center mx-auto mb-3">
                      <FileText className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="font-bold text-gray-900 dark:text-white mb-2 font-montserrat">
                      {t('noOngoingSurveys')}
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-4 text-sm font-montserrat">
                      {t('createFirstGlobalSurvey')}
                    </p>
                    <Button
                      onClick={handleCreateGlobalSurvey}
                      className="bg-pink-500 hover:bg-pink-600 text-white rounded-lg font-montserrat"
                      size="sm"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      {t('createFirstSurvey')}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </div>
      </Tabs>
      {/* </div> */}

      {/* Create Company Dialog */}
      <Dialog
        open={showCreateCompanyDialog}
        onOpenChange={setShowCreateCompanyDialog}
      >
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>{t('addNewCompany')}</DialogTitle>
            <DialogDescription>{t('addCompanyDescription')}</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto pr-1">
            <form onSubmit={handleCreateCompany} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t('companyName')} *</Label>
                  <Input
                    id="name"
                    value={companyFormData.name}
                    onChange={(e) =>
                      setCompanyFormData({
                        ...companyFormData,
                        name: e.target.value,
                      })
                    }
                    placeholder={t('companyNamePlaceholder')}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="domain">{t('emailDomain')} *</Label>
                  <Input
                    id="domain"
                    placeholder={t('domainPlaceholder')}
                    value={companyFormData.domain}
                    onChange={(e) => {
                      const domain = e.target.value;
                      setCompanyFormData({
                        ...companyFormData,
                        domain: domain,
                      });
                      // Real-time validation
                      if (domain.trim()) {
                        const error = validateDomain(domain);
                        setDomainValidationError(error);
                      } else {
                        setDomainValidationError('');
                      }
                    }}
                    onBlur={() => {
                      // Validate on blur for better UX
                      const error = validateDomain(companyFormData.domain);
                      setDomainValidationError(error);
                    }}
                    className={
                      domainValidationError
                        ? 'border-red-500 focus:border-red-500'
                        : ''
                    }
                    required
                  />
                  {domainValidationError ? (
                    <p className="text-sm text-red-600 dark:text-red-400 font-montserrat">
                      {domainValidationError}
                    </p>
                  ) : null}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="industry">{t('industry')} *</Label>
                  <Select
                    value={companyFormData.industry}
                    onValueChange={(value: string) =>
                      setCompanyFormData({
                        ...companyFormData,
                        industry: value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('selectIndustry')} />
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
                  <Label htmlFor="country">{t('country')} *</Label>
                  <Input
                    id="country"
                    value={companyFormData.country}
                    onChange={(e) =>
                      setCompanyFormData({
                        ...companyFormData,
                        country: e.target.value,
                      })
                    }
                    placeholder={t('countryPlaceholder')}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="size">{t('companySize')} *</Label>
                  <Select
                    value={companyFormData.size}
                    onValueChange={(value: CompanyFormData['size']) =>
                      setCompanyFormData({ ...companyFormData, size: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('selectSize')} />
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
                  <Label htmlFor="subscription_tier">
                    {t('subscriptionTier')} *
                  </Label>
                  <Select
                    value={companyFormData.subscription_tier}
                    onValueChange={(
                      value: CompanyFormData['subscription_tier']
                    ) =>
                      setCompanyFormData({
                        ...companyFormData,
                        subscription_tier: value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('selectTier')} />
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

              {/* Company Admin Invitation Section */}
              <div className="space-y-4 border-t pt-4">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="send_invitation"
                    checked={companyFormData.send_invitation}
                    onCheckedChange={(checked) =>
                      setCompanyFormData({
                        ...companyFormData,
                        send_invitation: checked === true,
                      })
                    }
                  />
                  <Label
                    htmlFor="send_invitation"
                    className="text-sm font-medium cursor-pointer"
                  >
                    {t('sendInvitationToAdmin')}
                  </Label>
                </div>

                {companyFormData.send_invitation && (
                  <div className="space-y-4 pl-6 border-l-2 border-blue-100">
                    <div className="space-y-2">
                      <Label htmlFor="admin_email">
                        {t('administratorEmail')} *
                      </Label>
                      <Input
                        id="admin_email"
                        type="email"
                        placeholder={t('adminEmailPlaceholder')}
                        value={companyFormData.admin_email}
                        onChange={(e) => {
                          const email = e.target.value;
                          setCompanyFormData({
                            ...companyFormData,
                            admin_email: email,
                          });
                          // Real-time validation
                          if (email.trim() && companyFormData.domain.trim()) {
                            const error = validateAdminEmail(
                              email,
                              companyFormData.domain
                            );
                            setAdminEmailValidationError(error);
                          } else {
                            setAdminEmailValidationError('');
                          }
                        }}
                        onBlur={() => {
                          // Validate on blur for better UX
                          if (
                            companyFormData.admin_email.trim() &&
                            companyFormData.domain.trim()
                          ) {
                            const error = validateAdminEmail(
                              companyFormData.admin_email,
                              companyFormData.domain
                            );
                            setAdminEmailValidationError(error);
                          }
                        }}
                        className={
                          adminEmailValidationError
                            ? 'border-red-500 focus:border-red-500'
                            : ''
                        }
                        required={companyFormData.send_invitation}
                      />
                      {adminEmailValidationError ? (
                        <p className="text-sm text-red-600 dark:text-red-400 font-montserrat">
                          {adminEmailValidationError}
                        </p>
                      ) : (
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-montserrat">
                          Email must use the company domain (e.g., admin@
                          {companyFormData.domain || 'company.com'})
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="admin_message">
                        {t('personalMessage')}
                      </Label>
                      <Textarea
                        id="admin_message"
                        placeholder={t('personalMessagePlaceholder')}
                        value={companyFormData.admin_message}
                        onChange={(e) =>
                          setCompanyFormData({
                            ...companyFormData,
                            admin_message: e.target.value,
                          })
                        }
                        rows={3}
                        className="resize-none"
                      />
                    </div>
                    <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-md">
                      <p className="font-medium">{t('whatHappensNext')}:</p>
                      <ul className="mt-1 space-y-1 text-xs">
                        <li>• {t('adminWillReceiveEmail')}</li>
                        <li>• {t('canCompleteProfile')}</li>
                        <li>• {t('canInviteEmployees')}</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </form>
          </div>

          <DialogFooter className="flex-shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowCreateCompanyDialog(false)}
              disabled={isSubmittingCompany}
            >
              {common('cancel')}
            </Button>
            <Button
              type="submit"
              disabled={
                isSubmittingCompany ||
                !!domainValidationError ||
                !!adminEmailValidationError ||
                !companyFormData.name.trim() ||
                !companyFormData.domain.trim() ||
                !companyFormData.industry ||
                !companyFormData.country.trim() ||
                (companyFormData.send_invitation &&
                  !companyFormData.admin_email.trim())
              }
              onClick={handleCreateCompany}
              className="cursor-pointer"
            >
              {isSubmittingCompany ? t('creating') : t('createCompany')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
