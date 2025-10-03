'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Cloud,
  CloudOff,
  Check,
  AlertCircle,
  RefreshCw,
  Clock,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Modern Autosave Indicator Component
 *
 * Features:
 * - Animated status transitions
 * - Relative time display
 * - Accessibility support (ARIA live regions)
 * - Beautiful gradient backgrounds
 * - Smooth micro-interactions
 */

type AutosaveStatus = 'idle' | 'saving' | 'saved' | 'error' | 'conflict';

interface AutosaveIndicatorProps {
  status: AutosaveStatus;
  lastSavedAt: Date | null;
  saveCount: number;
  onRetry?: () => void;
  className?: string;
  language?: 'es' | 'en';
}

const statusConfig: Record<
  AutosaveStatus,
  {
    icon: React.ComponentType<{ className?: string }>;
    label: { es: string; en: string };
    color: string;
    bgGradient: string;
    iconColor: string;
    animate?: boolean;
  }
> = {
  idle: {
    icon: Cloud,
    label: { es: 'Guardado automático activado', en: 'Autosave enabled' },
    color: 'text-gray-400',
    bgGradient: 'from-gray-50 to-gray-100',
    iconColor: 'text-gray-400',
  },
  saving: {
    icon: RefreshCw,
    label: { es: 'Guardando...', en: 'Saving...' },
    color: 'text-blue-600',
    bgGradient: 'from-blue-50 to-indigo-50',
    iconColor: 'text-blue-500',
    animate: true,
  },
  saved: {
    icon: Check,
    label: { es: 'Guardado', en: 'Saved' },
    color: 'text-emerald-600',
    bgGradient: 'from-emerald-50 to-teal-50',
    iconColor: 'text-emerald-500',
  },
  error: {
    icon: CloudOff,
    label: { es: 'Error al guardar', en: 'Save failed' },
    color: 'text-red-600',
    bgGradient: 'from-red-50 to-rose-50',
    iconColor: 'text-red-500',
  },
  conflict: {
    icon: AlertCircle,
    label: { es: 'Conflicto de versión', en: 'Version conflict' },
    color: 'text-orange-600',
    bgGradient: 'from-orange-50 to-amber-50',
    iconColor: 'text-orange-500',
  },
};

export function AutosaveIndicator({
  status,
  lastSavedAt,
  saveCount,
  onRetry,
  className = '',
  language = 'es',
}: AutosaveIndicatorProps) {
  const [relativeTime, setRelativeTime] = useState<string>('');
  const config = statusConfig[status];
  const Icon = config.icon;

  // Update relative time every 30 seconds
  useEffect(() => {
    if (!lastSavedAt) return;

    const updateTime = () => {
      setRelativeTime(
        formatDistanceToNow(lastSavedAt, {
          addSuffix: true,
          locale: language === 'es' ? es : undefined,
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 30000);

    return () => clearInterval(interval);
  }, [lastSavedAt, language]);

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 ${className}`}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={status}
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className={`
            relative overflow-hidden rounded-2xl shadow-lg border border-gray-200
            bg-gradient-to-br ${config.bgGradient}
            backdrop-blur-sm
          `}
        >
          {/* Shimmer effect for saving state */}
          {status === 'saving' && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
              animate={{
                x: ['-100%', '100%'],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'linear',
              }}
            />
          )}

          <div className="relative px-4 py-3 flex items-center gap-3">
            {/* Icon with animation */}
            <motion.div
              animate={config.animate ? { rotate: 360 } : {}}
              transition={{
                duration: 1,
                repeat: config.animate ? Infinity : 0,
                ease: 'linear',
              }}
            >
              <Icon className={`w-5 h-5 ${config.iconColor}`} />
            </motion.div>

            {/* Status text */}
            <div className="flex flex-col">
              <span className={`text-sm font-medium ${config.color}`}>
                {config.label[language]}
              </span>

              {/* Last saved time */}
              {status === 'saved' && lastSavedAt && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xs text-gray-500 flex items-center gap-1"
                >
                  <Clock className="w-3 h-3" />
                  {relativeTime}
                </motion.span>
              )}

              {/* Save count badge */}
              {status === 'saved' && saveCount > 0 && (
                <span className="text-xs text-gray-400">
                  {saveCount} {language === 'es' ? 'guardados' : 'saves'}
                </span>
              )}
            </div>

            {/* Retry button for errors */}
            {(status === 'error' || status === 'conflict') && onRetry && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onRetry}
                className="
                  ml-2 px-3 py-1 text-xs font-medium rounded-lg
                  bg-white shadow-sm border border-gray-200
                  hover:bg-gray-50 transition-colors
                  text-gray-700
                "
                aria-label={
                  language === 'es' ? 'Reintentar guardar' : 'Retry save'
                }
              >
                {language === 'es' ? 'Reintentar' : 'Retry'}
              </motion.button>
            )}
          </div>

          {/* Progress bar for saving */}
          {status === 'saving' && (
            <motion.div
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 2, ease: 'easeInOut' }}
              style={{ transformOrigin: 'left' }}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/**
 * Compact Autosave Badge (for header/toolbar)
 */
export function AutosaveBadge({
  status,
  lastSavedAt,
  language = 'es',
  className = '',
}: Omit<AutosaveIndicatorProps, 'saveCount' | 'onRetry'>) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-gray-200 shadow-sm ${className}`}
      role="status"
      aria-live="polite"
    >
      <motion.div
        animate={config.animate ? { rotate: 360 } : {}}
        transition={{
          duration: 1,
          repeat: config.animate ? Infinity : 0,
          ease: 'linear',
        }}
      >
        <Icon className={`w-4 h-4 ${config.iconColor}`} />
      </motion.div>

      <span className={`text-sm font-medium ${config.color}`}>
        {config.label[language]}
      </span>

      {status === 'saved' && lastSavedAt && (
        <span className="text-xs text-gray-400">
          {formatDistanceToNow(lastSavedAt, {
            addSuffix: true,
            locale: language === 'es' ? es : undefined,
          })}
        </span>
      )}
    </div>
  );
}
