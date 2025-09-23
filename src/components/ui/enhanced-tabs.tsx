'use client';

import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const EnhancedTabs = TabsPrimitive.Root;

const EnhancedTabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      'relative flex items-center justify-start bg-white border-b border-gray-100 overflow-x-auto',
      className
    )}
    {...props}
  />
));
EnhancedTabsList.displayName = TabsPrimitive.List.displayName;

interface EnhancedTabsTriggerProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> {
  icon?: React.ReactNode;
  description?: string;
  count?: number;
  variant?: 'default' | 'compact';
}

const EnhancedTabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  EnhancedTabsTriggerProps
>(
  (
    {
      className,
      children,
      icon,
      description,
      count,
      variant = 'default',
      ...props
    },
    ref
  ) => (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(
        'group relative flex items-center gap-3 px-4 py-3 sm:px-6 sm:py-4 text-sm font-medium transition-all duration-200',
        'text-gray-600 hover:text-gray-900 hover:bg-gray-50/50',
        'data-[state=active]:text-blue-600 data-[state=active]:bg-blue-50/30',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        'border-b-2 border-transparent data-[state=active]:border-blue-500',
        'whitespace-nowrap min-w-0 min-h-[44px]',
        variant === 'compact' && 'px-3 py-2 sm:px-4 sm:py-3 gap-2',
        className
      )}
      {...props}
    >
      {/* Background highlight for active state */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-blue-50 to-blue-100/50 rounded-t-lg opacity-0 group-data-[state=active]:opacity-100"
        initial={false}
        animate={{
          opacity: props.value === props['data-state'] ? 1 : 0,
        }}
        transition={{ duration: 0.2 }}
      />

      {/* Content */}
      <div className="relative flex items-center gap-3">
        {icon && (
          <div
            className={cn(
              'flex items-center justify-center rounded-lg transition-colors duration-200',
              'bg-gray-100 text-gray-500 group-hover:bg-gray-200 group-hover:text-gray-600',
              'group-data-[state=active]:bg-blue-100 group-data-[state=active]:text-blue-600',
              variant === 'compact' ? 'p-1.5 sm:p-2' : 'p-2 sm:p-2.5'
            )}
          >
            {icon}
          </div>
        )}

        <div className="flex flex-col items-start min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'font-medium transition-colors duration-200',
                variant === 'compact'
                  ? 'text-sm sm:text-base'
                  : 'text-base sm:text-lg'
              )}
            >
              {children}
            </span>
            {count !== undefined && (
              <span
                className={cn(
                  'px-2 py-0.5 text-xs font-medium rounded-full transition-colors duration-200',
                  'bg-gray-100 text-gray-600 group-hover:bg-gray-200',
                  'group-data-[state=active]:bg-blue-100 group-data-[state=active]:text-blue-600'
                )}
              >
                {count}
              </span>
            )}
          </div>
          {description && variant !== 'compact' && (
            <span className="text-xs text-gray-500 group-data-[state=active]:text-blue-500 transition-colors duration-200">
              {description}
            </span>
          )}
        </div>
      </div>

      {/* Active indicator line */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
        initial={false}
        animate={{
          scaleX: props.value === props['data-state'] ? 1 : 0,
        }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        style={{ transformOrigin: 'center' }}
      />
    </TabsPrimitive.Trigger>
  )
);
EnhancedTabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const EnhancedTabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      'mt-6 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      'animate-in fade-in-50 slide-in-from-bottom-2 duration-200',
      className
    )}
    {...props}
  />
));
EnhancedTabsContent.displayName = TabsPrimitive.Content.displayName;

// Compact variant for simpler layouts
const CompactTabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      'inline-flex items-center justify-center rounded-xl bg-gray-100 p-1 text-gray-600',
      'shadow-sm border border-gray-200',
      className
    )}
    {...props}
  />
));
CompactTabsList.displayName = 'CompactTabsList';

const CompactTabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      'inline-flex items-center justify-center whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium',
      'transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
      'disabled:pointer-events-none disabled:opacity-50',
      'text-gray-600 hover:text-gray-900 hover:bg-white/60',
      'data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm',
      className
    )}
    {...props}
  />
));
CompactTabsTrigger.displayName = 'CompactTabsTrigger';

export {
  EnhancedTabs,
  EnhancedTabsList,
  EnhancedTabsTrigger,
  EnhancedTabsContent,
  CompactTabsList,
  CompactTabsTrigger,
};
