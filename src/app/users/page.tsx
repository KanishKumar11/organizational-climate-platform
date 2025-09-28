'use client';

import { useMemo, useState } from 'react';

import { useAuth } from '@/hooks/useAuth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import UserManagement, {
  type UserStats,
} from '@/components/admin/UserManagement';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, Shield, Users } from 'lucide-react';

const ROLE_LABELS: Record<string, string> = {
  employee: 'Employee',
  supervisor: 'Supervisor',
  leader: 'Leader',
  department_admin: 'Department Admin',
  company_admin: 'Company Admin',
  super_admin: 'Super Admin',
};

export default function UsersPage() {
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const numberFormatter = useMemo(() => new Intl.NumberFormat('en-US'), []);
  const formatValue = (value: number | null | undefined) =>
    value === null || value === undefined
      ? '--'
      : numberFormatter.format(value);
  const activePercent =
    userStats && userStats.total > 0
      ? Math.round((userStats.active / userStats.total) * 100)
      : null;
  const inactivePercent =
    userStats && userStats.total > 0
      ? Math.round((userStats.inactive / userStats.total) * 100)
      : null;
  const topRoleEntry = useMemo(() => {
    if (!userStats) return null;
    return (
      Object.entries(userStats.roleDistribution)
        .filter(([, count]) => count > 0)
        .sort((a, b) => b[1] - a[1])[0] ?? null
    );
  }, [userStats]);
  const topRoleLabel = topRoleEntry
    ? ROLE_LABELS[topRoleEntry[0]] || topRoleEntry[0]
    : null;
  const uniqueRoles = useMemo(() => {
    if (!userStats) return 0;
    return Object.keys(userStats.roleDistribution).filter(
      (role) => userStats.roleDistribution[role] > 0
    ).length;
  }, [userStats]);

  const headerCards = [
    {
      key: 'accounts',
      label: 'User Accounts',
      value: formatValue(userStats?.total),
      icon: Users,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      subtitle:
        userStats && activePercent !== null && inactivePercent !== null
          ? `${formatValue(userStats.active)} active (${activePercent}%) · ${formatValue(userStats.inactive)} inactive (${inactivePercent}%)`
          : 'Syncing roster…',
      footer:
        userStats && userStats.departments !== undefined
          ? `${formatValue(userStats.departments)} departments`
          : null,
    },
    {
      key: 'roles',
      label: 'Role Coverage',
      value:
        topRoleEntry && userStats
          ? `${Math.round((topRoleEntry[1] / userStats.total) * 100)}%`
          : '--',
      icon: Shield,
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      subtitle:
        topRoleLabel && topRoleEntry
          ? `${topRoleLabel} (${formatValue(topRoleEntry[1])} users)`
          : 'Awaiting role data',
      footer: userStats
        ? `${formatValue(uniqueRoles)} roles represented`
        : null,
    },
  ];

  const { user, isLoading, canManageUsers } = useAuth();

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

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
              Please log in to access user management.
            </p>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  // Check if user has permission to manage users
  if (!canManageUsers) {
    return (
      <DashboardLayout>
        <Card>
          <CardContent className="p-12 text-center">
            <AlertCircle className="h-12 w-12 text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Insufficient Permissions
            </h3>
            <p className="text-gray-600">
              You don&rsquo;t have permission to manage users. Contact your
              administrator for access.
            </p>
            <div className="mt-4 text-sm text-gray-500">
              Required permissions: User Management
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
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-3xl" />
          <div className="absolute inset-0 bg-grid-pattern opacity-5" />
          <div className="relative p-8 lg:p-12">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex items-start gap-6">
                <div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
                  <Users className="h-10 w-10 text-white" />
                </div>
                <div className="space-y-2">
                  <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
                    User Management
                  </h1>
                  <p className="text-lg text-gray-600 max-w-2xl">
                    Maintain your organization&rsquo;s roster, manage access,
                    and ensure every role has the right coverage.
                  </p>
                  <div className="flex flex-wrap items-center gap-3 pt-2 text-sm text-gray-500">
                    <span>
                      Role:{' '}
                      <span className="font-medium capitalize">
                        {user.role.replace('_', ' ')}
                      </span>
                    </span>
                    {user.role === 'super_admin' && (
                      <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                        Global Access
                      </span>
                    )}
                    {user.role === 'company_admin' && (
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                        Company Scope
                      </span>
                    )}
                  </div>
                </div>
              </div>

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

        <UserManagement onStatsChange={setUserStats} />
      </div>
    </DashboardLayout>
  );
}
