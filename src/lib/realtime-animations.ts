import { Variants, Easing } from 'framer-motion';

// Animation variants for real-time components
export const realTimeAnimations = {
  // Pulse animation for live indicators
  livePulse: {
    animate: {
      opacity: [1, 0.3, 1],
      scale: [1, 1.2, 1],
    },
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },

  // Notification animation for new data
  newDataNotification: {
    initial: { opacity: 0, y: -10, scale: 0.8 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -10, scale: 0.8 },
    transition: { duration: 0.3, ease: 'easeOut' },
  },

  // Highlight animation for updated values
  valueUpdate: {
    initial: { scale: 1.2, color: '#3B82F6' },
    animate: { scale: 1, color: 'inherit' },
    transition: { duration: 0.5, ease: 'easeOut' },
  },

  // Shine effect for progress bars
  progressShine: {
    initial: { x: '-100%' },
    animate: { x: '100%' },
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'linear',
    },
  },

  // Bounce animation for new items
  newItemBounce: {
    initial: { opacity: 0, scale: 0, rotate: -180 },
    animate: { opacity: 1, scale: 1, rotate: 0 },
    exit: { opacity: 0, scale: 0, rotate: 180 },
    transition: {
      duration: 0.6,
      ease: [0.25, 0.25, 0, 1],
    },
  },

  // Glow effect for real-time elements
  realTimeGlow: {
    animate: {
      boxShadow: [
        '0 0 0 rgba(59, 130, 246, 0)',
        '0 0 20px rgba(59, 130, 246, 0.3)',
        '0 0 0 rgba(59, 130, 246, 0)',
      ],
    },
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },

  // Stagger animation for lists
  staggerContainer: {
    animate: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  },

  // Individual item in staggered list
  staggerItem: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
    transition: { duration: 0.3 },
  },

  // Floating animation for emphasis
  float: {
    animate: {
      y: [0, -5, 0],
    },
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },

  // Shake animation for alerts
  shake: {
    animate: {
      x: [0, -5, 5, -5, 5, 0],
    },
    transition: {
      duration: 0.5,
      ease: 'easeInOut',
    },
  },

  // Fade in with slide up
  fadeInUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.5, ease: 'easeOut' },
  },

  // Scale in animation
  scaleIn: {
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.8 },
    transition: { duration: 0.3, ease: 'easeOut' },
  },
};

// Utility functions for real-time animations
export const createRealTimeVariants = (
  baseVariants: Variants,
  isRealTime: boolean
): Variants => {
  if (!isRealTime) return baseVariants;

  return {
    ...baseVariants,
    animate: {
      ...baseVariants.animate,
      ...realTimeAnimations.realTimeGlow.animate,
    },
    transition: {
      ...baseVariants.transition,
      ...realTimeAnimations.realTimeGlow.transition,
    },
  };
};

// Animation presets for different real-time scenarios
export const realTimePresets = {
  // For new responses in microclimate
  newResponse: {
    highlight: {
      scale: [1, 1.05, 1],
      backgroundColor: ['transparent', 'rgba(34, 197, 94, 0.1)', 'transparent'],
    },
    transition: {
      duration: 1,
      ease: 'easeInOut',
    },
  },

  // For participation rate updates
  participationUpdate: {
    bar: {
      scaleX: [0.95, 1.02, 1],
      boxShadow: [
        '0 0 0 rgba(59, 130, 246, 0)',
        '0 0 15px rgba(59, 130, 246, 0.4)',
        '0 0 0 rgba(59, 130, 246, 0)',
      ],
    },
    transition: {
      duration: 0.8,
      ease: 'easeOut',
    },
  },

  // For AI insights
  aiInsight: {
    container: {
      scale: [0.98, 1.01, 1],
      borderColor: ['transparent', '#8B5CF6', 'transparent'],
    },
    transition: {
      duration: 0.6,
      ease: 'easeOut',
    },
  },

  // For word cloud updates
  wordCloudUpdate: {
    word: {
      scale: [1, 1.3, 1],
      color: ['inherit', '#10B981', 'inherit'],
      textShadow: [
        '1px 1px 2px rgba(0,0,0,0.1)',
        '2px 2px 4px rgba(16, 185, 129, 0.3)',
        '1px 1px 2px rgba(0,0,0,0.1)',
      ],
    },
    transition: {
      duration: 1,
      ease: 'easeInOut',
    },
  },
};

// Helper function to create real-time aware motion props
export const createMotionProps = (
  baseProps: any,
  isRealTime: boolean,
  hasUpdate: boolean = false
) => {
  if (!isRealTime) return baseProps;

  const realTimeProps = {
    ...baseProps,
    animate: {
      ...baseProps.animate,
      ...(hasUpdate && realTimeAnimations.realTimeGlow.animate),
    },
    transition: {
      ...baseProps.transition,
      ...(hasUpdate && realTimeAnimations.realTimeGlow.transition),
    },
  };

  return realTimeProps;
};

// Animation timing constants
export const ANIMATION_TIMINGS = {
  FAST: 0.2,
  NORMAL: 0.3,
  SLOW: 0.5,
  VERY_SLOW: 0.8,
  REAL_TIME_PULSE: 2,
  REAL_TIME_GLOW: 1.5,
  STAGGER_DELAY: 0.1,
};

// Easing functions
export const EASING = {
  EASE_OUT: 'easeOut',
  EASE_IN_OUT: 'easeInOut',
  BOUNCE: [0.25, 0.25, 0, 1],
  SPRING: { type: 'spring', stiffness: 300, damping: 30 },
};
