/**
 * Skeleton loading components
 * Provides consistent loading states with smooth animations
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { skeletonVariants } from '@/lib/animations';

interface SkeletonProps {
  className?: string;
  animate?: boolean;
  style?: React.CSSProperties;
}

/**
 * Base skeleton component
 */
export function Skeleton({ className, animate = true, style }: SkeletonProps) {
  if (animate) {
    return (
      <motion.div
        variants={skeletonVariants}
        animate="loading"
        className={cn('bg-muted rounded animate-pulse', className)}
        style={style}
      />
    );
  }

  return <div className={cn('bg-muted rounded animate-pulse', className)} style={style} />;
}

/**
 * Text skeleton variants
 */
export function SkeletonText({
  lines = 1,
  className,
  animate = true,
  style,
}: SkeletonProps & { lines?: number }) {
  return (
    <div className={cn('space-y-2', className)} style={style}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          animate={animate}
          className={cn(
            'h-4',
            i === lines - 1 && lines > 1 ? 'w-3/4' : 'w-full'
          )}
        />
      ))}
    </div>
  );
}

/**
 * Card skeleton
 */
export function SkeletonCard({ className, animate = true, style }: SkeletonProps) {
  return (
    <div className={cn('p-6 border rounded-lg space-y-4', className)} style={style}>
      <div className="flex items-center space-x-4">
        <Skeleton animate={animate} className="h-12 w-12 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton animate={animate} className="h-4 w-1/2" />
          <Skeleton animate={animate} className="h-3 w-1/3" />
        </div>
      </div>
      <SkeletonText lines={3} animate={animate} />
      <div className="flex space-x-2">
        <Skeleton animate={animate} className="h-8 w-20" />
        <Skeleton animate={animate} className="h-8 w-16" />
      </div>
    </div>
  );
}

/**
 * Table skeleton
 */
export function SkeletonTable({
  rows = 5,
  cols = 4,
  className,
  animate = true,
}: SkeletonProps & { rows?: number; cols?: number }) {
  return (
    <div className={cn('space-y-3', className)}>
      {/* Header */}
      <div className="flex space-x-4">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} animate={animate} className="h-4 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex space-x-4">
          {Array.from({ length: cols }).map((_, colIndex) => (
            <Skeleton key={colIndex} animate={animate} className="h-8 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * Chart skeleton
 */
export function SkeletonChart({
  type = 'bar',
  className,
  animate = true,
  style,
}: SkeletonProps & { type?: 'bar' | 'line' | 'pie' | 'area' }) {
  if (type === 'pie') {
    return (
      <div className={cn('flex items-center justify-center', className)} style={style}>
        <Skeleton animate={animate} className="h-48 w-48 rounded-full" />
      </div>
    );
  }

  if (type === 'line' || type === 'area') {
    return (
      <div className={cn('space-y-4', className)} style={style}>
        <div className="flex items-end space-x-2 h-48">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="flex-1 flex flex-col justify-end">
              <Skeleton
                animate={animate}
                className={`w-full mb-2`}
                style={{ height: `${Math.random() * 80 + 20}%` }}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-between">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} animate={animate} className="h-3 w-12" />
          ))}
        </div>
      </div>
    );
  }

  // Bar chart (default)
  return (
    <div className={cn('space-y-4', className)} style={style}>
      <div className="flex items-end space-x-2 h-48">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton
            key={i}
            animate={animate}
            className="flex-1"
            style={{ height: `${Math.random() * 80 + 20}%` }}
          />
        ))}
      </div>
      <div className="flex justify-between">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} animate={animate} className="h-3 w-8" />
        ))}
      </div>
    </div>
  );
}

/**
 * Dashboard skeleton
 */
export function SkeletonDashboard({
  className,
  animate = true,
  style,
}: SkeletonProps) {
  return (
    <div className={cn('space-y-6', className)} style={style}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <Skeleton animate={animate} className="h-8 w-48" />
        <Skeleton animate={animate} className="h-10 w-32" />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="p-6 border rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton animate={animate} className="h-4 w-20" />
              <Skeleton animate={animate} className="h-4 w-4 rounded-full" />
            </div>
            <Skeleton animate={animate} className="h-8 w-16" />
            <Skeleton animate={animate} className="h-3 w-24" />
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 border rounded-lg">
          <Skeleton animate={animate} className="h-6 w-32 mb-4" />
          <SkeletonChart animate={animate} />
        </div>
        <div className="p-6 border rounded-lg">
          <Skeleton animate={animate} className="h-6 w-32 mb-4" />
          <SkeletonChart type="pie" animate={animate} />
        </div>
      </div>

      {/* Table */}
      <div className="p-6 border rounded-lg">
        <Skeleton animate={animate} className="h-6 w-40 mb-4" />
        <SkeletonTable animate={animate} />
      </div>
    </div>
  );
}

/**
 * List skeleton
 */
export function SkeletonList({
  items = 5,
  className,
  animate = true,
}: SkeletonProps & { items?: number }) {
  return (
    <div className={cn('space-y-4', className)}>
      {Array.from({ length: items }).map((_, i) => (
        <div
          key={i}
          className="flex items-center space-x-4 p-4 border rounded-lg"
        >
          <Skeleton animate={animate} className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton animate={animate} className="h-4 w-3/4" />
            <Skeleton animate={animate} className="h-3 w-1/2" />
          </div>
          <Skeleton animate={animate} className="h-8 w-20" />
        </div>
      ))}
    </div>
  );
}

/**
 * Form skeleton
 */
export function SkeletonForm({
  fields = 5,
  className,
  animate = true,
}: SkeletonProps & { fields?: number }) {
  return (
    <div className={cn('space-y-6', className)}>
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton animate={animate} className="h-4 w-24" />
          <Skeleton animate={animate} className="h-10 w-full" />
        </div>
      ))}
      <div className="flex space-x-4 pt-4">
        <Skeleton animate={animate} className="h-10 w-24" />
        <Skeleton animate={animate} className="h-10 w-20" />
      </div>
    </div>
  );
}

/**
 * Avatar skeleton
 */
export function SkeletonAvatar({
  size = 'md',
  className,
  animate = true,
}: SkeletonProps & { size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  const sizes = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
  };

  return (
    <Skeleton
      animate={animate}
      className={cn('rounded-full', sizes[size], className)}
    />
  );
}

/**
 * Button skeleton
 */
export function SkeletonButton({
  size = 'md',
  className,
  animate = true,
  style,
}: SkeletonProps & { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: 'h-8 w-20',
    md: 'h-10 w-24',
    lg: 'h-12 w-28',
  };

  return (
    <Skeleton
      animate={animate}
      className={cn('rounded-md', sizes[size], className)}
      style={style}
    />
  );
}

/**
 * Badge skeleton
 */
export function SkeletonBadge({ className, animate = true, style }: SkeletonProps) {
  return (
    <Skeleton
      animate={animate}
      className={cn('h-5 w-16 rounded-full', className)}
      style={style}
    />
  );
}
