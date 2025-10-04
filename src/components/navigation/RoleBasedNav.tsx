'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
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

  const pathname = usePathname();

  if (!user) return null;

  const sections: NavSection[] = [];

  // Core section - always available
  sections.push({
    title: 'Overview',
    items: [
      {
        label: 'Dashboard',
        href: '/dashboard',
        icon: BarChart3,
        description: 'Main overview and KPIs',
      },
    ],
  });

  // Survey management section
  if (canCreateSurveys || user.role === 'employee') {
    const surveyItems: NavItem[] = [];

    if (user.role === 'employee') {
      surveyItems.push({
        label: 'My Surveys',
        href: '/surveys/my',
        icon: FileText,
        description: 'Surveys assigned to me',
      });
    }

    if (canCreateSurveys) {
      surveyItems.push(
        {
          label: 'All Surveys',
          href: '/surveys',
          icon: FileText,
          description: 'Manage all surveys',
        },
        {
          label: 'Survey Templates',
          href: '/surveys/templates',
          icon: Briefcase,
          description: 'Reusable survey templates',
        }
      );
    }

    sections.push({
      title: 'Surveys',
      items: surveyItems,
    });
  }

  // Microclimate section
  if (canLaunchMicroclimates) {
    sections.push({
      title: 'Real-time Feedback',
      items: [
        {
          label: 'Microclimates',
          href: '/microclimates',
          icon: Zap,
          badge: 'Live',
          description: 'Real-time team feedback',
        },
      ],
    });
  }

  // Action plans section
  if (canCreateActionPlans) {
    sections.push({
      title: 'Improvement',
      items: [
        {
          label: 'Action Plans',
          href: '/action-plans',
          icon: Target,
          description: 'Track improvement initiatives',
        },
      ],
    });
  }

  // Analytics section
  if (canViewCompanyAnalytics) {
    sections.push({
      title: 'Analytics',
      items: [
        {
          label: 'AI Insights',
          href: '/ai-insights',
          icon: Sparkles,
          badge: 'AI',
          description: 'AI-powered analysis and recommendations',
        },
        {
          label: 'Reports',
          href: '/reports',
          icon: TrendingUp,
          description: 'Detailed analytics and insights',
        },
        {
          label: 'Benchmarks',
          href: '/benchmarks',
          icon: Activity,
          description: 'Industry comparisons',
        },
      ],
    });
  }

  // Team management section
  if (isLeader || isSupervisor) {
    sections.push({
      title: 'Team Management',
      items: [
        {
          label: 'My Team',
          href: '/team',
          icon: Users,
          description: 'Team overview and insights',
        },
      ],
    });
  }

  // User management section
  if (canManageUsers) {
    sections.push({
      title: 'Organization',
      items: [
        {
          label: 'Users',
          href: '/users',
          icon: UserCheck,
          description: 'Manage team members',
        },
        {
          label: 'Departments',
          href: '/departments',
          icon: Building2,
          description: 'Organizational structure',
        },
      ],
    });
  }

  // Company admin section
  if (isCompanyAdmin) {
    sections.push({
      title: 'Company Settings',
      items: [
        {
          label: 'Company Config',
          href: '/settings/company',
          icon: Settings,
          description: 'Company-wide settings',
        },
      ],
    });
  }

  // Super admin section
  if (isSuperAdmin) {
    sections.push({
      title: 'System Administration',
      items: [
        {
          label: 'Companies',
          href: '/admin/companies',
          icon: Building2,
          description: 'Manage authorized companies and domains',
        },
        {
          label: 'System Settings',
          href: '/admin/system-settings',
          icon: Shield,
          description: 'System-wide configuration',
        },
        {
          label: 'System Logs',
          href: '/logs',
          icon: Database,
          description: 'Audit and system logs',
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
          <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
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
                      'w-full justify-start gap-3 h-auto p-3 text-left',
                      isActive &&
                        'bg-secondary text-secondary-foreground font-medium'
                    )}
                  >
                    <Link href={item.href}>
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      <div className="flex-1 text-left min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm truncate">{item.label}</span>
                          {item.badge && (
                            <Badge
                              variant="destructive"
                              className="text-xs px-1.5 py-0 flex-shrink-0"
                            >
                              {item.badge}
                            </Badge>
                          )}
                        </div>
                        {item.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 break-words hyphens-auto leading-tight whitespace-normal">
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

          {sectionIndex < sections.length - 1 && <Separator className="mt-4" />}
        </motion.div>
      ))}
    </nav>
  );
}
