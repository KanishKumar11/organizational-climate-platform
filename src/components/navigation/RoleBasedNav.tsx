'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { useTranslations } from '@/contexts/TranslationContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
  BarChart3,
  Users,
  FileText,
  Zap,
  Target,
  Settings,
  Building2,
  Shield,
  TrendingUp,
  UserCheck,
  Globe,
  Database,
  Briefcase,
  Activity,
  Sparkles,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  description?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export default function RoleBasedNav() {
  const {
    user,
    isSuperAdmin,
    isCompanyAdmin,
    isLeader,
    isSupervisor,
    canCreateSurveys,
    canLaunchMicroclimates,
    canCreateActionPlans,
    canViewCompanyAnalytics,
    canManageUsers,
  } = useAuth();

  const t = useTranslations('navigation');
  const pathname = usePathname();

  if (!user) return null;

  const sections: NavSection[] = [];

  // Core section - always available
  sections.push({
    title: t('overview'),
    items: [
      {
        label: t('dashboard'),
        href: '/dashboard',
        icon: BarChart3,
        description: t('dashboardDesc'),
      },
    ],
  });

  // Survey management section
  if (canCreateSurveys || user.role === 'employee') {
    const surveyItems: NavItem[] = [];

    if (user.role === 'employee') {
      surveyItems.push({
        label: t('mySurveys'),
        href: '/surveys/my',
        icon: FileText,
        description: t('mySurveysDesc'),
      });
    }

    if (canCreateSurveys) {
      surveyItems.push(
        {
          label: t('surveys'),
          href: '/surveys',
          icon: FileText,
          description: t('surveysDesc'),
        },
        {
          label: t('surveyTemplates'),
          href: '/surveys/templates',
          icon: Briefcase,
          description: t('surveyTemplatesDesc'),
        }
      );
    }

    sections.push({
      title: t('surveyManagement'),
      items: surveyItems,
    });
  }

  // Microclimate section
  if (canLaunchMicroclimates) {
    sections.push({
      title: t('realtimeFeedback'),
      items: [
        {
          label: t('microclimates'),
          href: '/microclimates',
          icon: Zap,
          badge: t('live'),
          description: t('microclimatesDesc'),
        },
      ],
    });
  }

  // Action plans section
  if (canCreateActionPlans) {
    sections.push({
      title: t('improvement'),
      items: [
        {
          label: t('actionPlans'),
          href: '/action-plans',
          icon: Target,
          description: t('actionPlansDesc'),
        },
      ],
    });
  }

  // Analytics section
  if (canViewCompanyAnalytics) {
    sections.push({
      title: t('analytics'),
      items: [
        {
          label: t('aiInsights'),
          href: '/ai-insights',
          icon: Sparkles,
          badge: 'AI',
          description: t('aiInsightsDesc'),
        },
        {
          label: t('reports'),
          href: '/reports',
          icon: TrendingUp,
          description: t('reportsDesc'),
        },
        {
          label: t('benchmarks'),
          href: '/benchmarks',
          icon: Activity,
          description: t('benchmarksDesc'),
        },
      ],
    });
  }

  // Team management section
  if (isLeader || isSupervisor) {
    sections.push({
      title: t('teamManagement'),
      items: [
        {
          label: t('myTeam'),
          href: '/team',
          icon: Users,
          description: t('myTeamDesc'),
        },
      ],
    });
  }

  // User management section
  if (canManageUsers) {
    sections.push({
      title: t('organization'),
      items: [
        {
          label: t('users'),
          href: '/users',
          icon: UserCheck,
          description: t('usersDesc'),
        },
        {
          label: t('departments'),
          href: '/departments',
          icon: Building2,
          description: t('departmentsDesc'),
        },
      ],
    });
  }

  // Company admin section
  if (isCompanyAdmin) {
    sections.push({
      title: t('companySettings'),
      items: [
        {
          label: t('companyConfig'),
          href: '/settings/company',
          icon: Settings,
          description: t('companyConfigDesc'),
        },
      ],
    });
  }

  // Super admin section
  if (isSuperAdmin) {
    sections.push({
      title: t('systemAdministration'),
      items: [
        {
          label: t('companies'),
          href: '/admin/companies',
          icon: Building2,
          description: t('companiesDesc'),
        },
        {
          label: t('systemSettings'),
          href: '/admin/system-settings',
          icon: Shield,
          description: t('systemSettingsDesc'),
        },
        {
          label: t('systemLogs'),
          href: '/logs',
          icon: Database,
          description: t('systemLogsDesc'),
        },
      ],
    });
  }

  const isActiveLink = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard' || pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className="space-y-6">
      {sections.map((section, sectionIndex) => (
        <motion.div
          key={section.title}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: sectionIndex * 0.1 }}
          className="space-y-2"
        >
          <h3 className="px-3 !text-lg font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider font-montserrat">
            {section.title}
          </h3>

          <div className="space-y-1">
            {section.items.map((item, itemIndex) => {
              const isActive = isActiveLink(item.href);
              const Icon = item.icon;

              return (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: sectionIndex * 0.1 + itemIndex * 0.05 }}
                >
                  <Button
                    asChild
                    variant={isActive ? 'secondary' : 'ghost'}
                    className={cn(
                      'w-full justify-start gap-3 h-auto p-3 text-left rounded-2xl transition-all duration-200 font-montserrat',
                      isActive
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg ring-2 ring-blue-200 dark:ring-blue-600 hover:from-blue-600 hover:to-indigo-600'
                        : 'hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400'
                    )}
                  >
                    <Link href={item.href}>
                      <Icon
                        className={cn(
                          'h-4 w-4 flex-shrink-0 transition-colors',
                          isActive
                            ? 'text-white'
                            : 'text-blue-500 dark:text-blue-400'
                        )}
                      />
                      <div className="flex-1 text-left min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              'text-sm truncate font-medium',
                              isActive
                                ? 'text-white'
                                : 'text-slate-700 dark:text-slate-300'
                            )}
                          >
                            {item.label}
                          </span>
                          {item.badge && (
                            <Badge
                              variant="destructive"
                              className="text-xs px-1.5 py-0 flex-shrink-0 bg-gradient-to-r from-red-500 to-pink-500 text-white font-montserrat"
                            >
                              {item.badge}
                            </Badge>
                          )}
                        </div>
                        {item.description && (
                          <p
                            className={cn(
                              '!text-xs mt-0.5 break-words hyphens-auto leading-tight whitespace-normal font-montserrat',
                              isActive
                                ? 'text-white/80'
                                : 'text-slate-500 dark:text-slate-400'
                            )}
                          >
                            {item.description}
                          </p>
                        )}
                      </div>
                    </Link>
                  </Button>
                </motion.div>
              );
            })}
          </div>

          {sectionIndex < sections.length - 1 && (
            <Separator className="mt-4 bg-blue-200 dark:bg-blue-600" />
          )}
        </motion.div>
      ))}
    </nav>
  );
}
