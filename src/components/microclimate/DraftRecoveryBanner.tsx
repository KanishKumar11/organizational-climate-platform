'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileWarning,
  X,
  RotateCcw,
  Trash2,
  Clock,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

/**
 * Draft Recovery Banner Component
 * 
 * Beautiful, modern banner that appears when an unsaved draft is detected.
 * 
 * Features:
 * - Animated slide-in from top
 * - Gradient background with soft shadows
 * - Clear recovery and discard actions
 * - Draft age and metadata display
 * - Auto-dismiss option
 * - Loading states for actions
 * - Accessibility support
 */

export interface DraftRecoveryBannerProps {
  /** Draft age (e.g., "hace 2 horas") */
  draftAge: string;
  /** Current step in the draft */
  currentStep?: number;
  /** Total save count */
  saveCount?: number;
  /** Time until expiry */
  timeUntilExpiry?: string;
  /** Is expiring soon (< 24 hours) */
  isExpiringSoon?: boolean;
  /** Recovery callback */
  onRecover: () => void;
  /** Discard callback */
  onDiscard: () => void;
  /** Dismiss callback */
  onDismiss?: () => void;
  /** Loading state for recovery */
  isRecovering?: boolean;
  /** Loading state for discard */
  isDiscarding?: boolean;
  /** Language */
  language?: 'es' | 'en';
  /** Position */
  position?: 'top' | 'bottom';
  /** Show close button */
  showClose?: boolean;
}

const translations = {
  es: {
    title: 'Borrador sin guardar encontrado',
    description: 'Encontramos un borrador de encuesta que no terminaste.',
    lastEdited: 'Última edición',
    step: 'Paso',
    saves: 'guardados',
    expiresIn: 'Expira en',
    expiringSoon: '¡Expira pronto!',
    recover: 'Recuperar Borrador',
    discard: 'Descartar',
    recovering: 'Recuperando...',
    discarding: 'Descartando...',
  },
  en: {
    title: 'Unsaved draft found',
    description: 'We found a survey draft you didn\'t finish.',
    lastEdited: 'Last edited',
    step: 'Step',
    saves: 'saves',
    expiresIn: 'Expires in',
    expiringSoon: 'Expiring soon!',
    recover: 'Recover Draft',
    discard: 'Discard',
    recovering: 'Recovering...',
    discarding: 'Discarding...',
  },
};

export function DraftRecoveryBanner({
  draftAge,
  currentStep,
  saveCount,
  timeUntilExpiry,
  isExpiringSoon = false,
  onRecover,
  onDiscard,
  onDismiss,
  isRecovering = false,
  isDiscarding = false,
  language = 'es',
  position = 'top',
  showClose = true,
}: DraftRecoveryBannerProps) {
  const t = translations[language];

  return (
    <motion.div
      initial={{ 
        y: position === 'top' ? -100 : 100,
        opacity: 0 
      }}
      animate={{ 
        y: 0,
        opacity: 1 
      }}
      exit={{ 
        y: position === 'top' ? -100 : 100,
        opacity: 0 
      }}
      transition={{ 
        type: 'spring',
        damping: 20,
        stiffness: 300
      }}
      className={`
        fixed ${position === 'top' ? 'top-0' : 'bottom-0'} left-0 right-0 z-50
        mx-auto max-w-4xl px-4 ${position === 'top' ? 'mt-4' : 'mb-4'}
      `}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      <div className="
        relative overflow-hidden rounded-2xl shadow-2xl border border-orange-200
        bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50
        backdrop-blur-sm
      ">
        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] bg-repeat" />
        </div>

        {/* Content */}
        <div className="relative p-6">
          <div className="flex items-start gap-4">
            {/* Icon */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ 
                type: 'spring',
                delay: 0.1,
                damping: 15
              }}
              className="
                flex-shrink-0 w-12 h-12 rounded-full
                bg-gradient-to-br from-orange-500 to-amber-500
                flex items-center justify-center
                shadow-lg
              "
            >
              <FileWarning className="w-6 h-6 text-white" />
            </motion.div>

            {/* Text Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {t.title}
                  </h3>
                  <p className="text-sm text-gray-700 mb-3">
                    {t.description}
                  </p>

                  {/* Metadata */}
                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    {/* Last edited */}
                    <div className="flex items-center gap-1.5 text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span className="font-medium">{t.lastEdited}:</span>
                      <span>{draftAge}</span>
                    </div>

                    {/* Current step */}
                    {currentStep && (
                      <Badge variant="outline" className="bg-white/50">
                        {t.step} {currentStep}/4
                      </Badge>
                    )}

                    {/* Save count */}
                    {saveCount && saveCount > 0 && (
                      <Badge variant="outline" className="bg-white/50">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        {saveCount} {t.saves}
                      </Badge>
                    )}

                    {/* Expiry warning */}
                    {timeUntilExpiry && (
                      <Badge 
                        variant={isExpiringSoon ? 'destructive' : 'outline'}
                        className={isExpiringSoon ? '' : 'bg-white/50'}
                      >
                        {isExpiringSoon && <AlertCircle className="w-3 h-3 mr-1" />}
                        {t.expiresIn}: {timeUntilExpiry}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Close button */}
                {showClose && onDismiss && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onDismiss}
                    disabled={isRecovering || isDiscarding}
                    className="flex-shrink-0 hover:bg-white/50"
                    aria-label="Cerrar"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 mt-4">
                <Button
                  onClick={onRecover}
                  disabled={isRecovering || isDiscarding}
                  className="
                    bg-gradient-to-r from-orange-600 to-amber-600
                    hover:from-orange-700 hover:to-amber-700
                    text-white shadow-lg
                    transition-all duration-200
                    hover:scale-105
                  "
                >
                  {isRecovering ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ 
                          duration: 1,
                          repeat: Infinity,
                          ease: 'linear'
                        }}
                      >
                        <RotateCcw className="w-4 h-4 mr-2" />
                      </motion.div>
                      {t.recovering}
                    </>
                  ) : (
                    <>
                      <RotateCcw className="w-4 h-4 mr-2" />
                      {t.recover}
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  onClick={onDiscard}
                  disabled={isRecovering || isDiscarding}
                  className="
                    bg-white/50 hover:bg-white/80
                    border-gray-300
                    transition-all duration-200
                  "
                >
                  {isDiscarding ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ 
                          duration: 1,
                          repeat: Infinity,
                          ease: 'linear'
                        }}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                      </motion.div>
                      {t.discarding}
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      {t.discard}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Expiring soon pulse effect */}
        {isExpiringSoon && (
          <motion.div
            className="absolute inset-0 border-2 border-red-500 rounded-2xl"
            animate={{
              opacity: [0, 0.3, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        )}
      </div>
    </motion.div>
  );
}

/**
 * Compact Draft Recovery Alert (for use in forms)
 */
export function DraftRecoveryAlert({
  draftAge,
  onRecover,
  onDiscard,
  isRecovering = false,
  isDiscarding = false,
  language = 'es',
}: Omit<DraftRecoveryBannerProps, 'position' | 'showClose' | 'onDismiss'>) {
  const t = translations[language];

  return (
    <Alert className="border-orange-200 bg-orange-50">
      <FileWarning className="h-4 w-4 text-orange-600" />
      <AlertDescription>
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <span className="font-medium text-gray-900">{t.title}</span>
            <span className="text-gray-600"> · {t.lastEdited}: {draftAge}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={onRecover}
              disabled={isRecovering || isDiscarding}
              variant="default"
            >
              {isRecovering ? t.recovering : t.recover}
            </Button>
            
            <Button
              size="sm"
              onClick={onDiscard}
              disabled={isRecovering || isDiscarding}
              variant="outline"
            >
              {isDiscarding ? t.discarding : t.discard}
            </Button>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
}

/**
 * Draft Recovery Container with AnimatePresence
 */
export function DraftRecoveryContainer({
  show,
  children,
}: {
  show: boolean;
  children: React.ReactNode;
}) {
  return (
    <AnimatePresence mode="wait">
      {show && children}
    </AnimatePresence>
  );
}
