'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface DashboardGridProps {
  children: ReactNode;
  className?: string;
  columns?: 1 | 2 | 3 | 4;
  gap?: 'sm' | 'md' | 'lg';
}

interface GridItemProps {
  children: ReactNode;
  className?: string;
  span?: 1 | 2 | 3 | 4;
  delay?: number;
}

const gapClasses = {
  sm: 'gap-4',
  md: 'gap-6',
  lg: 'gap-8',
};

const columnClasses = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 md:grid-cols-2',
  3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
};

const spanClasses = {
  1: 'col-span-1',
  2: 'col-span-1 md:col-span-2',
  3: 'col-span-1 md:col-span-2 lg:col-span-3',
  4: 'col-span-1 md:col-span-2 lg:col-span-4',
};

export function DashboardGrid({
  children,
  className,
  columns = 3,
  gap = 'md',
}: DashboardGridProps) {
  return (
    <div
      className={cn('grid', columnClasses[columns], gapClasses[gap], className)}
    >
      {children}
    </div>
  );
}

export function GridItem({
  children,
  className,
  span = 1,
  delay = 0,
}: GridItemProps) {
  return (
    <motion.div
      className={cn(spanClasses[span], className)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: delay * 0.1,
        ease: [0.25, 0.25, 0, 1],
      }}
    >
      {children}
    </motion.div>
  );
}

// Specialized grid layouts for different dashboard types
export function KPIGrid({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <DashboardGrid columns={4} gap="md" className={className}>
      {children}
    </DashboardGrid>
  );
}

export function ChartGrid({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <DashboardGrid columns={2} gap="lg" className={className}>
      {children}
    </DashboardGrid>
  );
}

export function DetailGrid({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <DashboardGrid columns={3} gap="md" className={className}>
      {children}
    </DashboardGrid>
  );
}
