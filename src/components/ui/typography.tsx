/**
 * Typography components for consistent text styling
 */

import React from 'react';
import { cn } from '@/lib/utils';
import {
  getTypographyClasses,
  type TypographyVariant,
  getSpacingClasses,
  type SpacingVariant,
} from '@/lib/typography';

interface TypographyProps {
  variant?: TypographyVariant;
  className?: string;
  children: React.ReactNode;
  as?: keyof React.JSX.IntrinsicElements;
}

/**
 * Base Typography component
 */
export function Typography({
  variant = 'body',
  className,
  children,
  as: Component = 'p',
}: TypographyProps) {
  const ComponentElement = Component as React.ElementType;
  return (
    <ComponentElement className={getTypographyClasses(variant, className)}>
      {children}
    </ComponentElement>
  );
}

/**
 * Heading components
 */
export function H1({
  className,
  children,
  ...props
}: Omit<TypographyProps, 'variant' | 'as'>) {
  return (
    <Typography variant="h1" as="h1" className={className} {...props}>
      {children}
    </Typography>
  );
}

export function H2({
  className,
  children,
  ...props
}: Omit<TypographyProps, 'variant' | 'as'>) {
  return (
    <Typography variant="h2" as="h2" className={className} {...props}>
      {children}
    </Typography>
  );
}

export function H3({
  className,
  children,
  ...props
}: Omit<TypographyProps, 'variant' | 'as'>) {
  return (
    <Typography variant="h3" as="h3" className={className} {...props}>
      {children}
    </Typography>
  );
}

export function H4({
  className,
  children,
  ...props
}: Omit<TypographyProps, 'variant' | 'as'>) {
  return (
    <Typography variant="h4" as="h4" className={className} {...props}>
      {children}
    </Typography>
  );
}

export function H5({
  className,
  children,
  ...props
}: Omit<TypographyProps, 'variant' | 'as'>) {
  return (
    <Typography variant="h5" as="h5" className={className} {...props}>
      {children}
    </Typography>
  );
}

export function H6({
  className,
  children,
  ...props
}: Omit<TypographyProps, 'variant' | 'as'>) {
  return (
    <Typography variant="h6" as="h6" className={className} {...props}>
      {children}
    </Typography>
  );
}

/**
 * Body text components
 */
export function Body({
  className,
  children,
  ...props
}: Omit<TypographyProps, 'variant' | 'as'>) {
  return (
    <Typography variant="body" as="p" className={className} {...props}>
      {children}
    </Typography>
  );
}

export function BodyLarge({
  className,
  children,
  ...props
}: Omit<TypographyProps, 'variant' | 'as'>) {
  return (
    <Typography variant="bodyLarge" as="p" className={className} {...props}>
      {children}
    </Typography>
  );
}

export function BodySmall({
  className,
  children,
  ...props
}: Omit<TypographyProps, 'variant' | 'as'>) {
  return (
    <Typography variant="bodySmall" as="p" className={className} {...props}>
      {children}
    </Typography>
  );
}

/**
 * Data display components
 */
export function DataText({
  className,
  children,
  ...props
}: Omit<TypographyProps, 'variant' | 'as'>) {
  return (
    <Typography variant="data" as="span" className={className} {...props}>
      {children}
    </Typography>
  );
}

export function DataTextLarge({
  className,
  children,
  ...props
}: Omit<TypographyProps, 'variant' | 'as'>) {
  return (
    <Typography variant="dataLarge" as="span" className={className} {...props}>
      {children}
    </Typography>
  );
}

export function DataTextSmall({
  className,
  children,
  ...props
}: Omit<TypographyProps, 'variant' | 'as'>) {
  return (
    <Typography variant="dataSmall" as="span" className={className} {...props}>
      {children}
    </Typography>
  );
}

/**
 * Label components
 */
export function Label({
  className,
  children,
  ...props
}: Omit<TypographyProps, 'variant' | 'as'>) {
  return (
    <Typography variant="label" as="label" className={className} {...props}>
      {children}
    </Typography>
  );
}

export function LabelLarge({
  className,
  children,
  ...props
}: Omit<TypographyProps, 'variant' | 'as'>) {
  return (
    <Typography
      variant="labelLarge"
      as="label"
      className={className}
      {...props}
    >
      {children}
    </Typography>
  );
}

export function LabelSmall({
  className,
  children,
  ...props
}: Omit<TypographyProps, 'variant' | 'as'>) {
  return (
    <Typography
      variant="labelSmall"
      as="label"
      className={className}
      {...props}
    >
      {children}
    </Typography>
  );
}

/**
 * Special text components
 */
export function Caption({
  className,
  children,
  ...props
}: Omit<TypographyProps, 'variant' | 'as'>) {
  return (
    <Typography variant="caption" as="span" className={className} {...props}>
      {children}
    </Typography>
  );
}

export function Small({
  className,
  children,
  ...props
}: Omit<TypographyProps, 'variant' | 'as'>) {
  return (
    <Typography variant="small" as="small" className={className} {...props}>
      {children}
    </Typography>
  );
}

export function Lead({
  className,
  children,
  ...props
}: Omit<TypographyProps, 'variant' | 'as'>) {
  return (
    <Typography variant="lead" as="p" className={className} {...props}>
      {children}
    </Typography>
  );
}

export function Quote({
  className,
  children,
  ...props
}: Omit<TypographyProps, 'variant' | 'as'>) {
  return (
    <Typography
      variant="quote"
      as="blockquote"
      className={className}
      {...props}
    >
      {children}
    </Typography>
  );
}

export function Code({
  className,
  children,
  ...props
}: Omit<TypographyProps, 'variant' | 'as'>) {
  return (
    <Typography
      variant="code"
      as="code"
      className={cn('bg-muted px-1.5 py-0.5 rounded-sm', className)}
      {...props}
    >
      {children}
    </Typography>
  );
}

/**
 * Layout components
 */
interface ContainerProps {
  variant?: 'default' | 'narrow' | 'wide' | 'full';
  className?: string;
  children: React.ReactNode;
}

export function Container({
  variant = 'default',
  className,
  children,
}: ContainerProps) {
  const variants = {
    default: 'container mx-auto container-padding',
    narrow: 'container mx-auto container-padding max-w-4xl',
    wide: 'container mx-auto container-padding max-w-8xl',
    full: 'w-full container-padding',
  };

  return <div className={cn(variants[variant], className)}>{children}</div>;
}

interface SectionProps {
  spacing?: SpacingVariant;
  className?: string;
  children: React.ReactNode;
}

export function Section({
  spacing = 'section',
  className,
  children,
}: SectionProps) {
  return (
    <section className={cn(getSpacingClasses(spacing), className)}>
      {children}
    </section>
  );
}

/**
 * Grid layout component
 */
interface GridProps {
  cols?: 1 | 2 | 3 | 4 | 6 | 'auto';
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
  children: React.ReactNode;
}

export function Grid({
  cols = 'auto',
  gap = 'md',
  className,
  children,
}: GridProps) {
  const colsClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    6: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6',
    auto: 'grid-auto-fit',
  };

  const gapClass = {
    sm: 'gap-4',
    md: 'gap-6',
    lg: 'gap-8',
  };

  return (
    <div className={cn('grid', colsClass[cols], gapClass[gap], className)}>
      {children}
    </div>
  );
}

/**
 * Flex layout component
 */
interface FlexProps {
  direction?: 'row' | 'col';
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around';
  gap?: 'sm' | 'md' | 'lg';
  wrap?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function Flex({
  direction = 'row',
  align = 'center',
  justify = 'start',
  gap = 'md',
  wrap = false,
  className,
  children,
}: FlexProps) {
  const directionClass = direction === 'row' ? 'flex-row' : 'flex-col';
  const alignClass = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch',
  };
  const justifyClass = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around',
  };
  const gapClass = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
  };

  return (
    <div
      className={cn(
        'flex',
        directionClass,
        alignClass[align],
        justifyClass[justify],
        gapClass[gap],
        wrap && 'flex-wrap',
        className
      )}
    >
      {children}
    </div>
  );
}
