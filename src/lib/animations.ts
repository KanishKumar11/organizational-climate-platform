/**
 * Advanced animation and interaction system
 * Provides consistent animations and transitions using Framer Motion and CSS
 */

import { Variants, Transition } from 'framer-motion';

/**
 * Common animation durations
 */
export const DURATIONS = {
  fast: 0.15,
  normal: 0.3,
  slow: 0.5,
  slower: 0.8,
} as const;

/**
 * Common easing functions
 */
export const EASINGS = {
  easeOut: [0.0, 0.0, 0.2, 1],
  easeIn: [0.4, 0.0, 1, 1],
  easeInOut: [0.4, 0.0, 0.2, 1],
  bounce: [0.68, -0.55, 0.265, 1.55],
  spring: { type: 'spring', stiffness: 300, damping: 30 },
  springBouncy: { type: 'spring', stiffness: 400, damping: 25 },
  springGentle: { type: 'spring', stiffness: 200, damping: 35 },
} as const;

/**
 * Fade animations
 */
export const fadeVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: DURATIONS.normal, ease: EASINGS.easeOut },
  },
  exit: {
    opacity: 0,
    transition: { duration: DURATIONS.fast, ease: EASINGS.easeIn },
  },
};

export const fadeInUpVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATIONS.normal, ease: EASINGS.easeOut },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: { duration: DURATIONS.fast, ease: EASINGS.easeIn },
  },
};

export const fadeInDownVariants: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATIONS.normal, ease: EASINGS.easeOut },
  },
  exit: {
    opacity: 0,
    y: 20,
    transition: { duration: DURATIONS.fast, ease: EASINGS.easeIn },
  },
};

export const fadeInLeftVariants: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: DURATIONS.normal, ease: EASINGS.easeOut },
  },
  exit: {
    opacity: 0,
    x: 20,
    transition: { duration: DURATIONS.fast, ease: EASINGS.easeIn },
  },
};

export const fadeInRightVariants: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: DURATIONS.normal, ease: EASINGS.easeOut },
  },
  exit: {
    opacity: 0,
    x: -20,
    transition: { duration: DURATIONS.fast, ease: EASINGS.easeIn },
  },
};

/**
 * Scale animations
 */
export const scaleVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: DURATIONS.normal, ease: EASINGS.easeOut },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: DURATIONS.fast, ease: EASINGS.easeIn },
  },
};

export const scaleSpringVariants: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: EASINGS.springBouncy,
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    transition: { duration: DURATIONS.fast, ease: EASINGS.easeIn },
  },
};

/**
 * Stagger animations for lists
 */
export const staggerContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      staggerChildren: 0.05,
      staggerDirection: -1,
    },
  },
};

export const staggerItemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATIONS.normal, ease: EASINGS.easeOut },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: { duration: DURATIONS.fast, ease: EASINGS.easeIn },
  },
};

/**
 * Card hover animations
 */
export const cardHoverVariants: Variants = {
  rest: {
    scale: 1,
    y: 0,
    transition: { duration: DURATIONS.fast, ease: EASINGS.easeOut },
  },
  hover: {
    scale: 1.02,
    y: -4,
    transition: { duration: DURATIONS.fast, ease: EASINGS.easeOut },
  },
  tap: {
    scale: 0.98,
    transition: { duration: 0.1, ease: EASINGS.easeOut },
  },
};

/**
 * Button animations
 */
export const buttonVariants: Variants = {
  rest: {
    scale: 1,
    transition: { duration: DURATIONS.fast, ease: EASINGS.easeOut },
  },
  hover: {
    scale: 1.05,
    transition: { duration: DURATIONS.fast, ease: EASINGS.easeOut },
  },
  tap: {
    scale: 0.95,
    transition: { duration: 0.1, ease: EASINGS.easeOut },
  },
};

/**
 * Loading animations
 */
export const pulseVariants: Variants = {
  pulse: {
    scale: [1, 1.05, 1],
    opacity: [0.7, 1, 0.7],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: EASINGS.easeInOut,
    },
  },
};

export const spinVariants: Variants = {
  spin: {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: 'linear',
    },
  },
};

/**
 * Progress bar animations
 */
export const progressVariants: Variants = {
  hidden: { width: '0%' },
  visible: (progress: number) => ({
    width: `${progress}%`,
    transition: { duration: DURATIONS.slow, ease: EASINGS.easeOut },
  }),
};

/**
 * Counter animations
 */
export const counterVariants: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: DURATIONS.slow,
      ease: EASINGS.bounce,
      delay: 0.2,
    },
  },
};

/**
 * Modal/Dialog animations
 */
export const modalBackdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: DURATIONS.normal, ease: EASINGS.easeOut },
  },
  exit: {
    opacity: 0,
    transition: { duration: DURATIONS.fast, ease: EASINGS.easeIn },
  },
};

export const modalContentVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: DURATIONS.normal,
      ease: EASINGS.easeOut,
      delay: 0.1,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 20,
    transition: { duration: DURATIONS.fast, ease: EASINGS.easeIn },
  },
};

/**
 * Microclimate visualization animations
 */
export const wordCloudVariants: Variants = {
  hidden: { opacity: 0, scale: 0 },
  visible: (delay: number = 0) => ({
    opacity: 1,
    scale: 1,
    transition: {
      duration: DURATIONS.normal,
      ease: EASINGS.easeOut,
      delay: delay * 0.1,
    },
  }),
  hover: {
    scale: 1.1,
    transition: { duration: DURATIONS.fast, ease: EASINGS.easeOut },
  },
};

export const chartBarVariants: Variants = {
  hidden: { height: 0, opacity: 0 },
  visible: (delay: number = 0) => ({
    height: 'auto',
    opacity: 1,
    transition: {
      duration: DURATIONS.slow,
      ease: EASINGS.easeOut,
      delay: delay * 0.1,
    },
  }),
};

export const heatmapCellVariants: Variants = {
  hidden: { opacity: 0, scale: 0 },
  visible: (delay: number = 0) => ({
    opacity: 1,
    scale: 1,
    transition: {
      duration: DURATIONS.normal,
      ease: EASINGS.easeOut,
      delay: delay * 0.05,
    },
  }),
  hover: {
    scale: 1.1,
    transition: { duration: DURATIONS.fast, ease: EASINGS.easeOut },
  },
};

/**
 * AI alert animations
 */
export const alertVariants: Variants = {
  hidden: { opacity: 0, x: 100, scale: 0.8 },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      duration: DURATIONS.normal,
      ease: EASINGS.springBouncy,
    },
  },
  exit: {
    opacity: 0,
    x: 100,
    scale: 0.8,
    transition: { duration: DURATIONS.fast, ease: EASINGS.easeIn },
  },
};

export const alertPriorityVariants: Variants = {
  low: {
    borderColor: 'hsl(var(--info))',
    backgroundColor: 'hsl(var(--info) / 0.1)',
  },
  medium: {
    borderColor: 'hsl(var(--warning))',
    backgroundColor: 'hsl(var(--warning) / 0.1)',
  },
  high: {
    borderColor: 'hsl(var(--error))',
    backgroundColor: 'hsl(var(--error) / 0.1)',
  },
  critical: {
    borderColor: 'hsl(var(--error))',
    backgroundColor: 'hsl(var(--error) / 0.2)',
    boxShadow: '0 0 20px hsl(var(--error) / 0.3)',
  },
};

/**
 * Skeleton loading animations
 */
export const skeletonVariants: Variants = {
  loading: {
    opacity: [0.5, 1, 0.5],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: EASINGS.easeInOut,
    },
  },
};

/**
 * Page transition animations
 */
export const pageVariants: Variants = {
  initial: { opacity: 0, y: 20 },
  in: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATIONS.normal, ease: EASINGS.easeOut },
  },
  out: {
    opacity: 0,
    y: -20,
    transition: { duration: DURATIONS.fast, ease: EASINGS.easeIn },
  },
};

/**
 * Utility functions for creating custom animations
 */
export function createStaggerAnimation(
  staggerDelay: number = 0.1,
  childDelay: number = 0.1
): Variants {
  return {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: childDelay,
      },
    },
  };
}

export function createSlideAnimation(
  direction: 'up' | 'down' | 'left' | 'right' = 'up',
  distance: number = 20
): Variants {
  const getInitialPosition = () => {
    switch (direction) {
      case 'up':
        return { y: distance };
      case 'down':
        return { y: -distance };
      case 'left':
        return { x: distance };
      case 'right':
        return { x: -distance };
    }
  };

  return {
    hidden: { opacity: 0, ...getInitialPosition() },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: { duration: DURATIONS.normal, ease: EASINGS.easeOut },
    },
  };
}

export function createScaleAnimation(
  initialScale: number = 0.95,
  duration: number = DURATIONS.normal
): Variants {
  return {
    hidden: { opacity: 0, scale: initialScale },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration, ease: EASINGS.easeOut },
    },
  };
}

/**
 * CSS class utilities for simple animations
 */
export const animationClasses = {
  // Fade animations
  fadeIn: 'animate-fade-in',
  fadeInFast: 'animate-fade-in-fast',
  fadeInSlow: 'animate-fade-in-slow',

  // Slide animations
  slideUp: 'animate-slide-up',
  slideUpFast: 'animate-slide-up-fast',
  slideUpSlow: 'animate-slide-up-slow',
  slideDown: 'animate-slide-down',
  slideLeft: 'animate-slide-left',
  slideRight: 'animate-slide-right',

  // Scale animations
  scaleIn: 'animate-scale-in',
  scaleInSlow: 'animate-scale-in-slow',

  // Loading animations
  pulse: 'animate-pulse',
  pulseSlow: 'animate-pulse-slow',
  pulseFast: 'animate-pulse-fast',
  shimmer: 'animate-shimmer',

  // Interactive animations
  bounce: 'animate-bounce-subtle',
  float: 'animate-float',
  glow: 'animate-glow',

  // Counter and progress
  counter: 'animate-counter',
  progress: 'animate-progress',
} as const;

/**
 * Hover effect utilities
 */
export const hoverEffects = {
  lift: 'hover:scale-105 hover:-translate-y-1 transition-transform duration-200',
  glow: 'hover:shadow-lg hover:shadow-primary/25 transition-shadow duration-200',
  brighten: 'hover:brightness-110 transition-all duration-200',
  scale: 'hover:scale-105 transition-transform duration-200',
  rotate: 'hover:rotate-3 transition-transform duration-200',
  skew: 'hover:skew-x-3 transition-transform duration-200',
} as const;

/**
 * Focus effect utilities
 */
export const focusEffects = {
  ring: 'focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
  glow: 'focus-visible:shadow-lg focus-visible:shadow-primary/25',
  scale: 'focus-visible:scale-105',
  outline: 'focus-visible:outline-2 focus-visible:outline-primary',
} as const;
