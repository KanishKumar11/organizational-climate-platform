/**
 * Typography and layout standards
 * Provides consistent typography and spacing utilities
 */

import { cn } from './utils';

/**
 * Typography variants for consistent text styling
 */
export const typographyVariants = {
  // Headings - Inter font
  h1: 'font-heading text-responsive-3xl font-semibold tracking-tight',
  h2: 'font-heading text-responsive-2xl font-semibold tracking-tight',
  h3: 'font-heading text-responsive-xl font-semibold tracking-tight',
  h4: 'font-heading text-responsive-lg font-semibold tracking-tight',
  h5: 'font-heading text-responsive-base font-semibold tracking-tight',
  h6: 'font-heading text-responsive-sm font-semibold tracking-tight',

  // Body text - Roboto font
  body: 'font-body text-responsive-base font-normal',
  bodyLarge: 'font-body text-responsive-lg font-normal',
  bodySmall: 'font-body text-responsive-sm font-normal',

  // Data displays - Roboto font
  data: 'font-data text-sm font-normal tabular-nums',
  dataLarge: 'font-data text-base font-normal tabular-nums',
  dataSmall: 'font-data text-xs font-normal tabular-nums',

  // Navigation - Inter font
  nav: 'font-heading text-sm font-medium tracking-wide',
  navLarge: 'font-heading text-base font-medium tracking-wide',

  // Buttons - Inter font
  button: 'font-heading text-sm font-medium tracking-wide',
  buttonLarge: 'font-heading text-base font-medium tracking-wide',
  buttonSmall: 'font-heading text-xs font-medium tracking-wide',

  // Labels - Inter font
  label: 'font-heading text-sm font-medium',
  labelLarge: 'font-heading text-base font-medium',
  labelSmall: 'font-heading text-xs font-medium',

  // Captions and small text - Roboto font
  caption: 'font-body text-xs font-normal text-muted-foreground',
  small: 'font-body text-xs font-normal',

  // Special variants
  code: 'font-mono text-sm',
  quote: 'font-body text-lg italic',
  lead: 'font-body text-xl font-normal text-muted-foreground',
} as const;

export type TypographyVariant = keyof typeof typographyVariants;

/**
 * Spacing system for consistent layout
 */
export const spacing = {
  // Component spacing
  xs: 'space-y-1',
  sm: 'space-y-2',
  md: 'space-y-4',
  lg: 'space-y-6',
  xl: 'space-y-8',
  '2xl': 'space-y-12',
  '3xl': 'space-y-16',

  // Section spacing
  section: 'space-y-12',
  sectionLarge: 'space-y-16',
  sectionSmall: 'space-y-8',
} as const;

export type SpacingVariant = keyof typeof spacing;

/**
 * Container variants for consistent layout
 */
export const containerVariants = {
  default: 'container mx-auto container-padding',
  narrow: 'container mx-auto container-padding max-w-4xl',
  wide: 'container mx-auto container-padding max-w-8xl',
  full: 'w-full container-padding',
} as const;

export type ContainerVariant = keyof typeof containerVariants;

/**
 * Shadow variants for consistent elevation
 */
export const shadowVariants = {
  none: '',
  subtle: 'shadow-subtle',
  soft: 'shadow-soft',
  medium: 'shadow-medium',
  strong: 'shadow-strong',
  intense: 'shadow-intense',
} as const;

export type ShadowVariant = keyof typeof shadowVariants;

/**
 * Border radius variants
 */
export const radiusVariants = {
  none: 'rounded-none',
  subtle: 'rounded-subtle',
  soft: 'rounded-soft',
  medium: 'rounded-medium',
  strong: 'rounded-strong',
  intense: 'rounded-intense',
  full: 'rounded-full',
} as const;

export type RadiusVariant = keyof typeof radiusVariants;

/**
 * Typography component props
 */
export interface TypographyProps {
  variant?: TypographyVariant;
  className?: string;
  children: React.ReactNode;
}

/**
 * Get typography classes for a specific variant
 */
export function getTypographyClasses(
  variant: TypographyVariant,
  className?: string
): string {
  return cn(typographyVariants[variant], className);
}

/**
 * Get spacing classes
 */
export function getSpacingClasses(variant: SpacingVariant): string {
  return spacing[variant];
}

/**
 * Get container classes
 */
export function getContainerClasses(
  variant: ContainerVariant,
  className?: string
): string {
  return cn(containerVariants[variant], className);
}

/**
 * Get shadow classes
 */
export function getShadowClasses(variant: ShadowVariant): string {
  return shadowVariants[variant];
}

/**
 * Get border radius classes
 */
export function getRadiusClasses(variant: RadiusVariant): string {
  return radiusVariants[variant];
}

/**
 * Responsive breakpoints for consistent media queries
 */
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

/**
 * Grid system utilities
 */
export const gridVariants = {
  auto: 'grid grid-auto-fit gap-6',
  cols1: 'grid grid-cols-1 gap-6',
  cols2: 'grid grid-cols-1 md:grid-cols-2 gap-6',
  cols3: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
  cols4: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6',
  cols6: 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6',
} as const;

export type GridVariant = keyof typeof gridVariants;

/**
 * Get grid classes
 */
export function getGridClasses(
  variant: GridVariant,
  className?: string
): string {
  return cn(gridVariants[variant], className);
}

/**
 * Flex utilities
 */
export const flexVariants = {
  row: 'flex flex-row items-center gap-4',
  col: 'flex flex-col gap-4',
  center: 'flex items-center justify-center gap-4',
  between: 'flex items-center justify-between gap-4',
  start: 'flex items-start gap-4',
  end: 'flex items-end gap-4',
} as const;

export type FlexVariant = keyof typeof flexVariants;

/**
 * Get flex classes
 */
export function getFlexClasses(
  variant: FlexVariant,
  className?: string
): string {
  return cn(flexVariants[variant], className);
}

/**
 * Animation duration constants
 */
export const animationDurations = {
  fast: '150ms',
  normal: '300ms',
  slow: '500ms',
  slower: '750ms',
} as const;

/**
 * Transition utilities
 */
export const transitionVariants = {
  all: 'transition-all duration-300 ease-in-out',
  colors: 'transition-colors duration-300 ease-in-out',
  opacity: 'transition-opacity duration-300 ease-in-out',
  transform: 'transition-transform duration-300 ease-in-out',
  fast: 'transition-all duration-150 ease-in-out',
  slow: 'transition-all duration-500 ease-in-out',
} as const;

export type TransitionVariant = keyof typeof transitionVariants;

/**
 * Get transition classes
 */
export function getTransitionClasses(variant: TransitionVariant): string {
  return transitionVariants[variant];
}


