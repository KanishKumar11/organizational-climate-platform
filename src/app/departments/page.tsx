'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from '@/contexts/TranslationContext';

import { useAuth } from '@/hooks/useAuth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ModernDepartmentManagement, {
  type DepartmentStats,
} from '@/components/admin/ModernDepartmentManagement';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, Building2, Users, Settings } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

export default function DepartmentsPage() {
  const [departmentStats, setDepartmentStats] =
    useState<DepartmentStats | null>(null);
  const t = useTranslations('departments');
  const common = useTranslations('common');
  const numberFormatter = useMemo(() => new Intl.NumberFormat('en-US'), []);
  const formatValue = (value: number | null | undefined) =>
    value === null || value === undefined
      ? '--'
      : numberFormatter.format(value);
  const activePercent =
    departmentStats && departmentStats.total > 0
      ? Math.round((departmentStats.active / departmentStats.total) * 100)
      : null;
  const managedPercent =
    departmentStats && departmentStats.total > 0
      ? Math.round((departmentStats.withManagers / departmentStats.total) * 100)
      : null;
  const averageTeamSize =
    departmentStats && departmentStats.total > 0
      ? Math.round(departmentStats.totalUsers / departmentStats.total)
      : null;

  const headerCards = [
    {
      key: 'structure',
      label: t('structureOverview'),
      value: formatValue(departmentStats?.total),
      icon: Building2,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      subtitle:
        departmentStats && activePercent !== null
          ? `${formatValue(departmentStats.active)} ${t('active')} (${activePercent}%) · ${formatValue(departmentStats.inactive)} ${t('inactive')}`
          : departmentStats
            ? `${formatValue(departmentStats.active)} ${t('active')} · ${formatValue(departmentStats.inactive)} ${t('inactive')}`
            : t('syncingData'),
      footer:
        departmentStats && departmentStats.maxLevel !== undefined
          ? `${t('maxDepth')} ${formatValue(departmentStats.maxLevel)}`
          : null,
    },
    {
      key: 'workforce',
      label: t('peopleCoverage'),
      value: formatValue(departmentStats?.totalUsers),
      icon: Users,
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      subtitle:
        departmentStats && averageTeamSize !== null
          ? `${t('avg')} ${formatValue(averageTeamSize)} ${t('perDepartment')}`
          : t('noAssignmentsYet'),
      footer:
        managedPercent !== null
          ? `${managedPercent}% ${t('managed')} (${formatValue(
              departmentStats?.withManagers
            )} ${t('teams')})`
          : t('assignManagersDepartments'),
    },
  ];

  const { user, isLoading, canManageUsers, isSuperAdmin, isCompanyAdmin } =
    useAuth();

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="text-sm text-muted-foreground">
              {t('loadingDepartmentManagement')}
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!user) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto">
            <CardContent className="p-12 text-center">
              <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
              <h3 className="text-xl font-semibold text-foreground mb-3">
                {t('authenticationRequired')}
              </h3>
              <p className="text-muted-foreground mb-6">
                {t('loginAccessDepartment')}
              </p>
              <div className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                {t('secureAccess')}
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  // Check if user has permission to manage departments
  // Super admins and company admins can manage departments
  const canManageDepartments = isSuperAdmin || isCompanyAdmin || canManageUsers;

  if (!canManageDepartments) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-lg mx-auto">
            <CardContent className="p-12 text-center">
              <div className="p-4 bg-amber-50 rounded-full w-fit mx-auto mb-6">
                <AlertCircle className="h-16 w-16 text-amber-600" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">
                {t('accessRestricted')}
              </h3>
              <p className="text-muted-foreground mb-6">
                {t('noPermissionsDepartments')}
              </p>
              <div className="bg-muted p-4 rounded-lg text-left">
                <h4 className="font-medium text-sm mb-2">
                  {t('requiredPermissions')}
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• {t('superAdministrator')}</li>
                  <li>• {t('companyAdministrator')}</li>
                  <li>• {t('departmentManagementRights')}</li>
                </ul>
              </div>
              <div className="mt-6 text-xs text-muted-foreground">
                {t('currentRole')}{' '}
                <span className="font-medium capitalize">
                  {user.role.replace('_', ' ')}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-6 space-y-8">
        {/* Breadcrumb Navigation */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{t('departmentManagement')}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        {/* Modern Page Header */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-3xl"></div>
          <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
          <div className="relative p-8 lg:p-12">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex items-start gap-6">
                <div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
                  <Building2 className="h-10 w-10 text-white" />
                </div>
                <div className="space-y-2">
                  <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
                    {t('departmentManagement')}
                  </h1>
                  <p className="text-lg text-gray-600 max-w-2xl">
                    {t('organizeCompanyStructure')}
                    oversee departmental operations with powerful tools and
                    insights.
                  </p>
                  <div className="flex items-center gap-4 pt-2">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Users className="h-4 w-4" />
                      <span>
                        {t('role')}{' '}
                        <span className="font-medium capitalize">
                          {user.role.replace('_', ' ')}
                        </span>
                      </span>
                    </div>
                    {user.role === 'super_admin' && (
                      <div className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                        {t('globalAccess')}
                      </div>
                    )}
                    {user.role === 'company_admin' && (
                      <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                        {t('companyScope')}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
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

        {/* Main Department Management Component */}
        <ModernDepartmentManagement onStatsChange={setDepartmentStats} />

        {/* Help & Guidelines Section */}
        <Card className="bg-gradient-to-r from-slate-50 to-gray-50 border-slate-200">
          <CardContent className="p-8">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Settings className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  {t('departmentManagementGuidelines')}
                </h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-800">
                      {t('structureBestPractices')}
                    </h4>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                        {t('keepHierarchyReasonable')}
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                        {t('clearDescriptiveNames')}
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                        {t('assignManagersAccountability')}
                      </li>
                    </ul>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-800">
                      {t('userManagement')}
                    </h4>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                        {t('reviewAssignments')}
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                        {t('bulkOperations')}
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                        {t('monitorDepartmentSize')}
                      </li>
                    </ul>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-800">
                      {t('securityCompliance')}
                    </h4>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                        {t('maintainAccessControls')}
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                        {t('documentChanges')}
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                        {t('regularAudits')}
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
