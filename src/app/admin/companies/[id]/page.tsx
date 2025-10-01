'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loading } from '@/components/ui/Loading';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import {
  Building2,
  Users,
  Calendar,
  Mail,
  Globe,
  MapPin,
  Phone,
  Crown,
  Shield,
  Briefcase,
  ArrowLeft,
  TrendingUp,
  Activity,
} from 'lucide-react';

interface CompanyDetails {
  _id: string;
  name: string;
  domain: string;
  industry: string;
  size: string;
  subscription_tier: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  userCount: number;
  description?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  contact?: {
    email?: string;
    phone?: string;
    website?: string;
  };
}

const getSizeLabel = (size: string) => {
  const sizeMap: Record<string, string> = {
    startup: '1-10 employees',
    small: '11-50 employees',
    medium: '51-200 employees',
    large: '201-1000 employees',
    enterprise: '1000+ employees',
  };
  return sizeMap[size] || size;
};

const getTierColor = (tier: string) => {
  const colorMap: Record<string, string> = {
    basic: 'bg-gray-100 text-gray-800',
    professional: 'bg-blue-100 text-blue-800',
    enterprise: 'bg-purple-100 text-purple-800',
  };
  return colorMap[tier] || 'bg-gray-100 text-gray-800';
};

export default function CompanyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { success, error: toastError } = useToast();
  const [company, setCompany] = useState<CompanyDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const companyId = params.id as string;

  useEffect(() => {
    const fetchCompanyDetails = async () => {
      if (!companyId) return;

      try {
        setLoading(true);
        const response = await fetch(`/api/admin/companies/${companyId}`);

        if (!response.ok) {
          throw new Error('Failed to fetch company details');
        }

        const data = await response.json();

        if (data.success) {
          setCompany(data.data);
        } else {
          setError(data.message || 'Failed to load company details');
        }
      } catch (err) {
        console.error('Error fetching company:', err);
        setError('Failed to load company details');
        toastError(
          'Error',
          'Failed to load company details'
        );
      } finally {
        setLoading(false);
      }
    };

    if (user && user.role === 'super_admin') {
      fetchCompanyDetails();
    }
  }, [companyId, user?.role]);

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  // Check permissions
  if (!user || user.role !== 'super_admin') {
    return (
      <DashboardLayout>
        <Card>
          <CardContent className="p-12 text-center">
            <Shield className="h-12 w-12 text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Access Denied
            </h3>
            <p className="text-gray-600">
              You don&apos;t have permission to view company details.
            </p>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loading />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !company) {
    return (
      <DashboardLayout>
        <Card>
          <CardContent className="p-12 text-center">
            <div className="text-red-500 mb-4">
              <Shield className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Error Loading Company
            </h3>
            <p className="text-gray-600 mb-4">
              {error || 'Company not found'}
            </p>
            <Button onClick={() => router.push('/admin/companies')}>
              Back to Companies
            </Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/admin/companies')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Companies
            </Button>
          </div>
        </div>

        {/* Company Overview */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-3xl" />
          <div className="absolute inset-0 bg-grid-pattern opacity-5" />
          <div className="relative p-8 lg:p-12">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex items-start gap-6">
                <div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl shadow-lg">
                  <Building2 className="h-10 w-10 text-white" />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
                      {company.name}
                    </h1>
                    <Badge
                      variant={company.is_active ? 'default' : 'secondary'}
                      className={company.is_active ? 'bg-green-100 text-green-800' : ''}
                    >
                      {company.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <p className="text-lg text-gray-600 max-w-2xl">
                    {company.description || 'No description available'}
                  </p>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Globe className="h-4 w-4" />
                      {company.domain}
                    </span>
                    <span className="flex items-center gap-1">
                      <Briefcase className="h-4 w-4" />
                      {company.industry}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {getSizeLabel(company.size)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Created {new Date(company.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <Badge className={`px-4 py-2 text-sm font-medium ${getTierColor(company.subscription_tier)}`}>
                  <Crown className="h-4 w-4 mr-2" />
                  {company.subscription_tier.charAt(0).toUpperCase() + company.subscription_tier.slice(1)} Plan
                </Badge>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{company.userCount}</div>
                  <div className="text-sm text-gray-600">Active Users</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Company Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Contact Information */}
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 opacity-30" />
            <div className="relative">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Mail className="h-5 w-5 text-blue-600" />
                  </div>
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {company.contact?.email && (
                  <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <Mail className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Email</p>
                      <p className="text-sm font-medium text-gray-900">{company.contact.email}</p>
                    </div>
                  </div>
                )}
                {company.contact?.phone && (
                  <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100">
                    <div className="p-2 bg-green-50 rounded-lg">
                      <Phone className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Phone</p>
                      <p className="text-sm font-medium text-gray-900">{company.contact.phone}</p>
                    </div>
                  </div>
                )}
                {company.contact?.website && (
                  <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100">
                    <div className="p-2 bg-purple-50 rounded-lg">
                      <Globe className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Website</p>
                      <a
                        href={company.contact.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {company.contact.website}
                      </a>
                    </div>
                  </div>
                )}
                {!company.contact?.email && !company.contact?.phone && !company.contact?.website && (
                  <div className="text-center py-8">
                    <div className="p-4 bg-gray-50 rounded-full w-16 h-16 mx-auto mb-4">
                      <Mail className="h-8 w-8 text-gray-400 mx-auto" />
                    </div>
                    <p className="text-sm font-medium text-gray-900 mb-1">No Contact Information</p>
                    <p className="text-xs text-gray-500">Contact details will appear here when available</p>
                  </div>
                )}
              </CardContent>
            </div>
          </Card>

          {/* Address Information */}
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 opacity-30" />
            <div className="relative">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <MapPin className="h-5 w-5 text-green-600" />
                  </div>
                  Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                {company.address && (company.address.street || company.address.city || company.address.state || company.address.zipCode || company.address.country) ? (
                  <div className="space-y-3">
                    {company.address.street && (
                      <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-100">
                        <div className="p-2 bg-green-50 rounded-lg mt-0.5">
                          <MapPin className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Street Address</p>
                          <p className="text-sm font-medium text-gray-900">{company.address.street}</p>
                        </div>
                      </div>
                    )}
                    {(company.address.city || company.address.state || company.address.zipCode) && (
                      <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-100">
                        <div className="p-2 bg-blue-50 rounded-lg mt-0.5">
                          <Building2 className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">City & Postal</p>
                          <p className="text-sm font-medium text-gray-900">
                            {[company.address.city, company.address.state, company.address.zipCode]
                              .filter(Boolean)
                              .join(', ')}
                          </p>
                        </div>
                      </div>
                    )}
                    {company.address.country && (
                      <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-100">
                        <div className="p-2 bg-purple-50 rounded-lg mt-0.5">
                          <Globe className="h-4 w-4 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Country</p>
                          <p className="text-sm font-medium text-gray-900">{company.address.country}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="p-4 bg-gray-50 rounded-full w-16 h-16 mx-auto mb-4">
                      <MapPin className="h-8 w-8 text-gray-400 mx-auto" />
                    </div>
                    <p className="text-sm font-medium text-gray-900 mb-1">No Address Information</p>
                    <p className="text-xs text-gray-500">Address details will appear here when available</p>
                  </div>
                )}
              </CardContent>
            </div>
          </Card>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-blue-600/5 to-indigo-600/10" />
            <div className="absolute top-0 right-0 w-20 h-20 bg-blue-100 rounded-full -mr-10 -mt-10 opacity-20" />
            <CardContent className="relative p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-blue-700 uppercase tracking-wide">Total Users</p>
                  <p className="text-3xl font-bold text-gray-900">{company.userCount}</p>
                  <p className="text-xs text-blue-600 font-medium">Active members</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Users className="h-8 w-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-green-600/5 to-emerald-600/10" />
            <div className="absolute top-0 right-0 w-20 h-20 bg-green-100 rounded-full -mr-10 -mt-10 opacity-20" />
            <CardContent className="relative p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-green-700 uppercase tracking-wide">Status</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {company.is_active ? 'Active' : 'Inactive'}
                  </p>
                  <p className="text-xs text-green-600 font-medium">
                    {company.is_active ? 'Fully operational' : 'Currently inactive'}
                  </p>
                </div>
                <div className={`p-4 bg-gradient-to-br rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300 ${
                  company.is_active
                    ? 'from-green-500 to-green-600'
                    : 'from-gray-400 to-gray-500'
                }`}>
                  <Activity className="h-8 w-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-purple-600/5 to-indigo-600/10" />
            <div className="absolute top-0 right-0 w-20 h-20 bg-purple-100 rounded-full -mr-10 -mt-10 opacity-20" />
            <CardContent className="relative p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-purple-700 uppercase tracking-wide">Subscription</p>
                  <p className="text-3xl font-bold text-gray-900 capitalize">
                    {company.subscription_tier}
                  </p>
                  <p className="text-xs text-purple-600 font-medium">Current plan</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <TrendingUp className="h-8 w-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}