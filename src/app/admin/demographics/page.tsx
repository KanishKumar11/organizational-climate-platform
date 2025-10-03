'use client';

import { useMemo, useState } from 'react';
import {
  AlertCircle,
  Database,
  Shield,
  Users,
  FileSpreadsheet,
  Settings,
  Plus,
  Upload,
  Eye,
  Edit,
  Trash2,
} from 'lucide-react';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import ModernDemographicsManagement from '@/components/admin/ModernDemographicsManagement';

export default function DemographicsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [demographicsStats, setDemographicsStats] = useState<{
    totalFields: number;
    totalCompanies: number;
    totalUsers: number;
  } | null>(null);

  const numberFormatter = useMemo(() => new Intl.NumberFormat('en-US'), []);
  const formatValue = (value: number | null | undefined) =>
    value === null || value === undefined
      ? '--'
      : numberFormatter.format(value);

  const headerCards = [
    {
      key: 'fields',
      label: 'Demographic Fields',
      value: formatValue(demographicsStats?.totalFields),
      icon: Database,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      subtitle: 'Custom fields defined across companies',
      footer: 'Dynamic and company-specific',
    },
    {
      key: 'companies',
      label: 'Companies Configured',
      value: formatValue(demographicsStats?.totalCompanies),
      icon: Settings,
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
      subtitle: 'Organizations with demographics setup',
      footer: 'Tailored to each company',
    },
    {
      key: 'users',
      label: 'Users with Demographics',
      value: formatValue(demographicsStats?.totalUsers),
      icon: Users,
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      subtitle: 'Employees with demographic data',
      footer: 'Ready for segmentation',
    },
  ];

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

  const canManageDemographics = user && user.role === 'super_admin';

  if (!user) {
    return (
      <DashboardLayout>
        <Card>
          <CardContent className="p-12 text-center">
            <AlertCircle className="h-12 w-12 text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Access Denied
            </h3>
            <p className="text-gray-600">
              Please log in to access demographics management.
            </p>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  if (!canManageDemographics) {
    return (
      <DashboardLayout>
        <Card>
          <CardContent className="p-12 text-center">
            <Shield className="h-12 w-12 text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Insufficient Permissions
            </h3>
            <p className="text-gray-600">
              You don&rsquo;t have permission to manage demographics. Contact
              your administrator for access.
            </p>
            <div className="mt-4 text-sm text-gray-500">
              Required permissions: Super Administrator
            </div>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-6 space-y-8">
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-emerald-50 rounded-3xl" />
          <div className="absolute inset-0 bg-grid-pattern opacity-5" />
          <div className="relative p-8 lg:p-12">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex items-start gap-6">
                <div className="p-4 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl shadow-lg">
                  <Database className="h-10 w-10 text-white" />
                </div>
                <div className="space-y-2">
                  <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
                    Demographics Management
                  </h1>
                  <p className="text-lg text-gray-600 max-w-2xl">
                    Define company-specific demographic fields, manage data
                    collection, and enable powerful segmentation for climate
                    analysis.
                  </p>
                  <div className="flex flex-wrap items-center gap-3 pt-2 text-sm text-gray-500">
                    <span>
                      Role:{' '}
                      <span className="font-medium capitalize">
                        {user.role.replace('_', ' ')}
                      </span>
                    </span>
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                      Global Scope
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
                {headerCards.map((card) => {
                  const Icon = card.icon;
                  return (
                    <div
                      key={card.key}
                      className="rounded-2xl border border-white/30 bg-white/90 p-4 text-left shadow-sm backdrop-blur transition-all hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`rounded-xl p-2 ${card.iconBg}`}>
                          <Icon className={`h-5 w-5 ${card.iconColor}`} />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-slate-500">
                            {card.label}
                          </div>
                          <div className="text-2xl font-semibold text-slate-900">
                            {card.value}
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-slate-500">
                        {card.subtitle}
                      </div>
                      {card.footer && (
                        <div className="mt-1 text-[11px] uppercase tracking-wide text-slate-400">
                          {card.footer}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <ModernDemographicsManagement
          userRole={user.role}
          onStatsChange={setDemographicsStats}
        />
      </div>
    </DashboardLayout>
  );
}
