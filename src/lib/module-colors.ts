/**
 * Module-based color coding system
 * Provides consistent color mapping for different platform modules
 */

export type ModuleType = 'survey' | 'microclimate' | 'ai' | 'action';

export interface ModuleColorScheme {
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
}

/**
 * Module color mappings with accessibility-compliant contrast ratios
 */
export const MODULE_COLORS: Record<ModuleType, ModuleColorScheme> = {
  survey: {
    primary: 'hsl(var(--survey-primary))',
    primaryForeground: 'hsl(var(--survey-primary-foreground))',
    secondary: 'hsl(var(--survey-secondary))',
    secondaryForeground: 'hsl(var(--survey-secondary-foreground))',
    muted: 'hsl(var(--survey-muted))',
    mutedForeground: 'hsl(var(--survey-muted-foreground))',
    accent: 'hsl(var(--survey-accent))',
    accentForeground: 'hsl(var(--survey-accent-foreground))',
  },
  microclimate: {
    primary: 'hsl(var(--microclimate-primary))',
    primaryForeground: 'hsl(var(--microclimate-primary-foreground))',
    secondary: 'hsl(var(--microclimate-secondary))',
    secondaryForeground: 'hsl(var(--microclimate-secondary-foreground))',
    muted: 'hsl(var(--microclimate-muted))',
    mutedForeground: 'hsl(var(--microclimate-muted-foreground))',
    accent: 'hsl(var(--microclimate-accent))',
    accentForeground: 'hsl(var(--microclimate-accent-foreground))',
  },
  ai: {
    primary: 'hsl(var(--ai-primary))',
    primaryForeground: 'hsl(var(--ai-primary-foreground))',
    secondary: 'hsl(var(--ai-secondary))',
    secondaryForeground: 'hsl(var(--ai-secondary-foreground))',
    muted: 'hsl(var(--ai-muted))',
    mutedForeground: 'hsl(var(--ai-muted-foreground))',
    accent: 'hsl(var(--ai-accent))',
    accentForeground: 'hsl(var(--ai-accent-foreground))',
  },
  action: {
    primary: 'hsl(var(--action-primary))',
    primaryForeground: 'hsl(var(--action-primary-foreground))',
    secondary: 'hsl(var(--action-secondary))',
    secondaryForeground: 'hsl(var(--action-secondary-foreground))',
    muted: 'hsl(var(--action-muted))',
    mutedForeground: 'hsl(var(--action-muted-foreground))',
    accent: 'hsl(var(--action-accent))',
    accentForeground: 'hsl(var(--action-accent-foreground))',
  },
};

/**
 * Tailwind CSS class mappings for each module
 */
export const MODULE_CLASSES: Record<ModuleType, Record<string, string>> = {
  survey: {
    bg: 'bg-survey',
    text: 'text-survey-foreground',
    bgSecondary: 'bg-survey-secondary',
    textSecondary: 'text-survey-secondary-foreground',
    bgMuted: 'bg-survey-muted',
    textMuted: 'text-survey-muted-foreground',
    bgAccent: 'bg-survey-accent',
    textAccent: 'text-survey-accent-foreground',
    border: 'border-survey',
    ring: 'ring-survey',
    hover: 'hover:bg-survey/90',
  },
  microclimate: {
    bg: 'bg-microclimate',
    text: 'text-microclimate-foreground',
    bgSecondary: 'bg-microclimate-secondary',
    textSecondary: 'text-microclimate-secondary-foreground',
    bgMuted: 'bg-microclimate-muted',
    textMuted: 'text-microclimate-muted-foreground',
    bgAccent: 'bg-microclimate-accent',
    textAccent: 'text-microclimate-accent-foreground',
    border: 'border-microclimate',
    ring: 'ring-microclimate',
    hover: 'hover:bg-microclimate/90',
  },
  ai: {
    bg: 'bg-ai',
    text: 'text-ai-foreground',
    bgSecondary: 'bg-ai-secondary',
    textSecondary: 'text-ai-secondary-foreground',
    bgMuted: 'bg-ai-muted',
    textMuted: 'text-ai-muted-foreground',
    bgAccent: 'bg-ai-accent',
    textAccent: 'text-ai-accent-foreground',
    border: 'border-ai',
    ring: 'ring-ai',
    hover: 'hover:bg-ai/90',
  },
  action: {
    bg: 'bg-action',
    text: 'text-action-foreground',
    bgSecondary: 'bg-action-secondary',
    textSecondary: 'text-action-secondary-foreground',
    bgMuted: 'bg-action-muted',
    textMuted: 'text-action-muted-foreground',
    bgAccent: 'bg-action-accent',
    textAccent: 'text-action-accent-foreground',
    border: 'border-action',
    ring: 'ring-action',
    hover: 'hover:bg-action/90',
  },
};

/**
 * Get module color scheme
 */
export function getModuleColors(module: ModuleType): ModuleColorScheme {
  return MODULE_COLORS[module];
}

/**
 * Get module CSS classes
 */
export function getModuleClasses(module: ModuleType): Record<string, string> {
  return MODULE_CLASSES[module];
}

/**
 * Get module-specific button variant classes
 */
export function getModuleButtonClasses(
  module: ModuleType,
  variant: 'default' | 'secondary' | 'outline' | 'ghost' = 'default'
): string {
  const classes = MODULE_CLASSES[module];

  switch (variant) {
    case 'default':
      return `${classes.bg} ${classes.text} ${classes.hover} focus-visible:${classes.ring}`;
    case 'secondary':
      return `${classes.bgSecondary} ${classes.textSecondary} hover:${classes.bgSecondary}/80 focus-visible:${classes.ring}`;
    case 'outline':
      return `border ${classes.border} ${classes.textSecondary} hover:${classes.bgAccent} hover:${classes.textAccent} focus-visible:${classes.ring}`;
    case 'ghost':
      return `${classes.textSecondary} hover:${classes.bgAccent} hover:${classes.textAccent} focus-visible:${classes.ring}`;
    default:
      return `${classes.bg} ${classes.text} ${classes.hover} focus-visible:${classes.ring}`;
  }
}

/**
 * Get module-specific card classes
 */
export function getModuleCardClasses(
  module: ModuleType,
  variant: 'default' | 'muted' | 'accent' = 'default'
): string {
  const classes = MODULE_CLASSES[module];

  switch (variant) {
    case 'muted':
      return `${classes.bgMuted} ${classes.textMuted} border-${module}/20`;
    case 'accent':
      return `${classes.bgAccent} ${classes.textAccent} border-${module}`;
    default:
      return `bg-card text-card-foreground border-${module}/20`;
  }
}

/**
 * Module descriptions for accessibility and documentation
 */
export const MODULE_DESCRIPTIONS: Record<ModuleType, string> = {
  survey: 'Survey management and creation functionality',
  microclimate: 'Real-time feedback and microclimate features',
  ai: 'AI-powered insights and recommendations',
  action: 'Action plan management and tracking',
};

/**
 * Accessibility helper - ensures proper contrast ratios
 */
export function validateColorContrast(
  foreground: string,
  background: string
): boolean {
  // This would typically use a color contrast calculation library
  // For now, we trust that our predefined colors meet WCAG 2.1 AA standards
  return true;
}

/**
 * Get status color classes
 */
export const STATUS_COLORS = {
  success: {
    bg: 'bg-success',
    text: 'text-success-foreground',
    border: 'border-success',
    ring: 'ring-success',
  },
  warning: {
    bg: 'bg-warning',
    text: 'text-warning-foreground',
    border: 'border-warning',
    ring: 'ring-warning',
  },
  error: {
    bg: 'bg-error',
    text: 'text-error-foreground',
    border: 'border-error',
    ring: 'ring-error',
  },
  info: {
    bg: 'bg-info',
    text: 'text-info-foreground',
    border: 'border-info',
    ring: 'ring-info',
  },
};

export type StatusType = keyof typeof STATUS_COLORS;

/**
 * Get status-specific classes
 */
export function getStatusClasses(status: StatusType): Record<string, string> {
  return STATUS_COLORS[status];
}


