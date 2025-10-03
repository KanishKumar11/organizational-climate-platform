import { useCallback, useEffect, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useDebounce } from './useDebounce';

/**
 * CLIMA-006: Autosave Hook with Optimistic Concurrency Control
 *
 * Features:
 * - Debounced saves (configurable interval)
 * - Version conflict detection
 * - Save status indicators
 * - Force save capability
 * - Offline queue support
 */

export type AutosaveStatus = 'idle' | 'saving' | 'saved' | 'error' | 'conflict';

export interface AutosaveOptions {
  /** Debounce interval in milliseconds (default: 5000 - 5 seconds) */
  debounceMs?: number;
  /** Enable autosave (default: true) */
  enabled?: boolean;
  /** Callback on successful save */
  onSuccess?: (data: AutosaveResponse) => void;
  /** Callback on error */
  onError?: (error: Error) => void;
  /** Callback on version conflict */
  onConflict?: (serverVersion: number) => void;
}

export interface AutosaveResponse {
  success: boolean;
  version: number;
  saved_at: string;
  message?: string;
}

export interface AutosaveData {
  current_step: number;
  step1_data?: Record<string, unknown>;
  step2_data?: Record<string, unknown>;
  step3_data?: Record<string, unknown>;
  step4_data?: Record<string, unknown>;
  last_edited_field?: string;
}

export function useAutosave(
  draftId: string | null,
  options: AutosaveOptions = {}
) {
  const {
    debounceMs = 5000,
    enabled = true,
    onSuccess,
    onError,
    onConflict,
  } = options;

  const [status, setStatus] = useState<AutosaveStatus>('idle');
  const [version, setVersion] = useState(1);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [saveCount, setSaveCount] = useState(0);

  const pendingDataRef = useRef<AutosaveData | null>(null);
  const isOnlineRef = useRef(true);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => {
      isOnlineRef.current = true;
      // Retry pending save if any
      if (pendingDataRef.current && draftId) {
        saveMutation.mutate(pendingDataRef.current);
      }
    };
    const handleOffline = () => {
      isOnlineRef.current = false;
      setStatus('error');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [draftId]);

  // Autosave mutation
  const saveMutation = useMutation({
    mutationFn: async (data: AutosaveData) => {
      if (!draftId) {
        throw new Error('Draft ID is required for autosave');
      }

      const response = await fetch(`/api/surveys/drafts/${draftId}/autosave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          version,
        }),
      });

      if (!response.ok) {
        const error = await response.json();

        // Handle version conflict (409)
        if (response.status === 409) {
          throw new Error('CONFLICT');
        }

        throw new Error(error.message || 'Autosave failed');
      }

      return response.json() as Promise<AutosaveResponse>;
    },
    onMutate: () => {
      setStatus('saving');
    },
    onSuccess: (data) => {
      setVersion(data.version);
      setLastSavedAt(new Date(data.saved_at));
      setSaveCount((prev) => prev + 1);
      setStatus('saved');
      pendingDataRef.current = null;

      onSuccess?.(data);

      // Reset to idle after 3 seconds
      setTimeout(() => {
        setStatus('idle');
      }, 3000);
    },
    onError: (error: Error) => {
      if (error.message === 'CONFLICT') {
        setStatus('conflict');
        onConflict?.(version + 1);
      } else {
        setStatus('error');
        // Keep data for retry
        pendingDataRef.current = pendingDataRef.current;
        onError?.(error);
      }
    },
  });

  // Debounced save function
  const debouncedSave = useDebounce((data: AutosaveData) => {
    if (!isOnlineRef.current) {
      pendingDataRef.current = data;
      setStatus('error');
      return;
    }
    saveMutation.mutate(data);
  }, debounceMs);

  // Main save function (debounced)
  const save = useCallback(
    (data: AutosaveData) => {
      if (!enabled || !draftId) return;
      pendingDataRef.current = data;
      debouncedSave(data);
    },
    [enabled, draftId, debouncedSave]
  );

  // Force immediate save (bypass debounce)
  const forceSave = useCallback(
    (data: AutosaveData) => {
      if (!draftId) return;
      pendingDataRef.current = data;
      saveMutation.mutate(data);
    },
    [draftId, saveMutation]
  );

  // Reset version (for conflict resolution)
  const resetVersion = useCallback((newVersion: number) => {
    setVersion(newVersion);
    setStatus('idle');
  }, []);

  // Retry last failed save
  const retry = useCallback(() => {
    if (pendingDataRef.current) {
      saveMutation.mutate(pendingDataRef.current);
    }
  }, [saveMutation]);

  return {
    save,
    forceSave,
    retry,
    resetVersion,
    status,
    version,
    lastSavedAt,
    saveCount,
    isSaving: status === 'saving',
    hasError: status === 'error',
    hasConflict: status === 'conflict',
  };
}

/**
 * Generate unique session ID
 */
export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
