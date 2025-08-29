/**
 * Animated components using Framer Motion
 * Provides pre-built animated components for common use cases
 */

'use client';

import React from 'react';
import { motion, AnimatePresence, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  fadeVariants,
  fadeInUpVariants,
  fadeInDownVariants,
  fadeInLeftVariants,
  fadeInRightVariants,
  scaleVariants,
  scaleSpringVariants,
  staggerContainerVariants,
  staggerItemVariants,
  cardHoverVariants,
  buttonVariants,
  modalBackdropVariants,
  modalContentVariants,
  progressVariants,
  counterVariants,
  alertVariants,
  skeletonVariants,
  pageVariants,
} from '@/lib/animations';

/**
 * Base animated container
 */
interface AnimatedProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  className?: string;
}

export function Animated({ children, className, ...props }: AnimatedProps) {
  return (
    <motion.div className={className} {...props}>
      {children}
    </motion.div>
  );
}

/**
 * Fade animations
 */
export function FadeIn({ children, className, ...props }: AnimatedProps) {
  return (
    <motion.div
      variants={fadeVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function FadeInUp({ children, className, ...props }: AnimatedProps) {
  return (
    <motion.div
      variants={fadeInUpVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function FadeInDown({ children, className, ...props }: AnimatedProps) {
  return (
    <motion.div
      variants={fadeInDownVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function FadeInLeft({ children, className, ...props }: AnimatedProps) {
  return (
    <motion.div
      variants={fadeInLeftVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function FadeInRight({ children, className, ...props }: AnimatedProps) {
  return (
    <motion.div
      variants={fadeInRightVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/**
 * Scale animations
 */
export function ScaleIn({ children, className, ...props }: AnimatedProps) {
  return (
    <motion.div
      variants={scaleVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function ScaleSpring({ children, className, ...props }: AnimatedProps) {
  return (
    <motion.div
      variants={scaleSpringVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/**
 * Stagger animations
 */
interface StaggerProps extends AnimatedProps {
  staggerDelay?: number;
  childDelay?: number;
}

export function StaggerContainer({
  children,
  className,
  staggerDelay = 0.1,
  childDelay = 0.1,
  ...props
}: StaggerProps) {
  const customVariants = {
    ...staggerContainerVariants,
    visible: {
      ...staggerContainerVariants.visible,
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: childDelay,
      },
    },
  };

  return (
    <motion.div
      variants={customVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className, ...props }: AnimatedProps) {
  return (
    <motion.div variants={staggerItemVariants} className={className} {...props}>
      {children}
    </motion.div>
  );
}

/**
 * Interactive animations
 */
export function AnimatedCard({ children, className, ...props }: AnimatedProps) {
  return (
    <motion.div
      variants={cardHoverVariants}
      initial="rest"
      whileHover="hover"
      whileTap="tap"
      className={cn('cursor-pointer', className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function AnimatedButton({
  children,
  className,
  ...props
}: AnimatedProps) {
  return (
    <motion.div
      variants={buttonVariants}
      initial="rest"
      whileHover="hover"
      whileTap="tap"
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/**
 * Modal animations
 */
interface ModalProps {
  isOpen: boolean;
  onClose?: () => void;
  children: React.ReactNode;
  className?: string;
}

export function AnimatedModal({
  isOpen,
  onClose,
  children,
  className,
}: ModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            variants={modalBackdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onClose}
          />
          <motion.div
            variants={modalContentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={cn(
              'fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50',
              className
            )}
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/**
 * Progress animations
 */
interface ProgressProps {
  progress: number;
  className?: string;
  showLabel?: boolean;
}

export function AnimatedProgress({
  progress,
  className,
  showLabel = false,
}: ProgressProps) {
  return (
    <div className={cn('relative', className)}>
      <div className="w-full bg-muted rounded-full h-2">
        <motion.div
          variants={progressVariants}
          initial="hidden"
          animate="visible"
          custom={progress}
          className="h-2 bg-primary rounded-full"
        />
      </div>
      {showLabel && (
        <motion.span
          variants={counterVariants}
          initial="hidden"
          animate="visible"
          className="absolute right-0 top-3 text-sm font-medium"
        >
          {progress}%
        </motion.span>
      )}
    </div>
  );
}

/**
 * Counter animation
 */
interface CounterProps {
  value: number;
  className?: string;
  duration?: number;
}

export function AnimatedCounter({
  value,
  className,
  duration = 0.8,
}: CounterProps) {
  const [displayValue, setDisplayValue] = React.useState(0);

  React.useEffect(() => {
    const startTime = Date.now();
    const startValue = displayValue;
    const difference = value - startValue;

    const updateCounter = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / (duration * 1000), 1);

      // Easing function for smooth animation
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentValue = Math.round(startValue + difference * easeOut);

      setDisplayValue(currentValue);

      if (progress < 1) {
        requestAnimationFrame(updateCounter);
      }
    };

    requestAnimationFrame(updateCounter);
  }, [value, duration, displayValue]);

  return (
    <motion.span
      variants={counterVariants}
      initial="hidden"
      animate="visible"
      className={className}
    >
      {displayValue.toLocaleString()}
    </motion.span>
  );
}

/**
 * Alert animations
 */
interface AlertProps {
  priority?: 'low' | 'medium' | 'high' | 'critical';
  children: React.ReactNode;
  className?: string;
}

export function AnimatedAlert({
  priority = 'medium',
  children,
  className,
}: AlertProps) {
  const priorityColors = {
    low: 'border-info bg-info/10',
    medium: 'border-warning bg-warning/10',
    high: 'border-error bg-error/10',
    critical: 'border-error bg-error/20 shadow-lg shadow-error/20',
  };

  return (
    <motion.div
      variants={alertVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={cn(
        'border-2 rounded-lg p-4',
        priorityColors[priority],
        className
      )}
    >
      {children}
    </motion.div>
  );
}

/**
 * Skeleton loading
 */
export function AnimatedSkeleton({ className }: { className?: string }) {
  return (
    <motion.div
      variants={skeletonVariants}
      animate="loading"
      className={cn('bg-muted rounded', className)}
    />
  );
}

/**
 * Page transitions
 */
export function PageTransition({ children, className }: AnimatedProps) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="in"
      exit="out"
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * List animations
 */
interface AnimatedListProps {
  items: React.ReactNode[];
  className?: string;
  itemClassName?: string;
}

export function AnimatedList({
  items,
  className,
  itemClassName,
}: AnimatedListProps) {
  return (
    <StaggerContainer className={className}>
      {items.map((item, index) => (
        <StaggerItem key={index} className={itemClassName}>
          {item}
        </StaggerItem>
      ))}
    </StaggerContainer>
  );
}

/**
 * Hover effects wrapper
 */
interface HoverEffectProps extends AnimatedProps {
  effect?: 'lift' | 'glow' | 'scale' | 'rotate';
}

export function HoverEffect({
  children,
  className,
  effect = 'lift',
  ...props
}: HoverEffectProps) {
  const effects = {
    lift: { y: -4, scale: 1.02 },
    glow: { boxShadow: '0 10px 25px rgba(0,0,0,0.1)' },
    scale: { scale: 1.05 },
    rotate: { rotate: 2 },
  };

  return (
    <motion.div
      whileHover={effects[effect]}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/**
 * Presence wrapper for conditional rendering
 */
interface PresenceProps {
  show: boolean;
  children: React.ReactNode;
  mode?: 'wait' | 'sync' | 'popLayout';
}

export function Presence({ show, children, mode = 'wait' }: PresenceProps) {
  return <AnimatePresence mode={mode}>{show && children}</AnimatePresence>;
}
