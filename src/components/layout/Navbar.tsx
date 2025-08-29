'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { cn } from '@/lib/utils';
import { ChevronRight, Plus } from 'lucide-react';

interface NavbarProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: ReactNode;
  badge?: {
    text: string;
    variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  };
  className?: string;
}

interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function Navbar({
  title,
  description,
  breadcrumbs,
  actions,
  badge,
  className,
}: NavbarProps) {
  return (
    <motion.div
      className={cn('space-y-4 pb-6', className)}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumbs.map((crumb, index) => (
              <div key={index} className="flex items-center">
                {index > 0 && <BreadcrumbSeparator />}
                <BreadcrumbItem>
                  {crumb.href ? (
                    <BreadcrumbLink href={crumb.href}>
                      {crumb.label}
                    </BreadcrumbLink>
                  ) : (
                    <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                  )}
                </BreadcrumbItem>
              </div>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      )}

      {/* Title and Actions */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            {badge && (
              <Badge variant={badge.variant || 'default'}>{badge.text}</Badge>
            )}
          </div>
          {description && (
            <p className="text-muted-foreground">{description}</p>
          )}
        </div>

        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>

      <Separator />
    </motion.div>
  );
}

// Specialized navbar variants
export function SurveyNavbar({
  title,
  status,
  onCreateSurvey,
  className,
}: {
  title: string;
  status?: string;
  onCreateSurvey?: () => void;
  className?: string;
}) {
  const getStatusVariant = (status?: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'draft':
        return 'secondary';
      case 'completed':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  return (
    <Navbar
      title={title}
      description="Create and manage surveys to gather organizational insights"
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Surveys' },
      ]}
      badge={
        status ? { text: status, variant: getStatusVariant(status) } : undefined
      }
      actions={
        onCreateSurvey && (
          <Button onClick={onCreateSurvey} className="gap-2">
            <Plus className="h-4 w-4" />
            Create Survey
          </Button>
        )
      }
      className={className}
    />
  );
}

export function MicroclimateNavbar({
  title,
  isLive,
  onLaunchMicroclimate,
  className,
}: {
  title: string;
  isLive?: boolean;
  onLaunchMicroclimate?: () => void;
  className?: string;
}) {
  return (
    <Navbar
      title={title}
      description="Launch real-time feedback sessions and view live results"
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Microclimates' },
      ]}
      badge={isLive ? { text: 'Live', variant: 'destructive' } : undefined}
      actions={
        onLaunchMicroclimate && (
          <Button onClick={onLaunchMicroclimate} className="gap-2">
            <Plus className="h-4 w-4" />
            Launch Microclimate
          </Button>
        )
      }
      className={className}
    />
  );
}

export function ActionPlanNavbar({
  title,
  activeCount,
  onCreateActionPlan,
  className,
}: {
  title: string;
  activeCount?: number;
  onCreateActionPlan?: () => void;
  className?: string;
}) {
  return (
    <Navbar
      title={title}
      description="Create and track action plans based on survey insights"
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Action Plans' },
      ]}
      badge={
        activeCount
          ? { text: `${activeCount} Active`, variant: 'default' }
          : undefined
      }
      actions={
        onCreateActionPlan && (
          <Button onClick={onCreateActionPlan} className="gap-2">
            <Plus className="h-4 w-4" />
            Create Action Plan
          </Button>
        )
      }
      className={className}
    />
  );
}
