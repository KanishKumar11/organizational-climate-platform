import { useEffect, useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

/**
 * Draft Recovery Hook
 * 
 * Automatically detects and recovers unsaved drafts when user returns to the application.
 * 
 * Features:
 * - Automatic draft detection on mount
 * - Age calculation (human-readable)
 * - One-click recovery
 * - One-click discard
 * - Session tracking
 * - Expiry handling
 */

export interface DraftData {
  id: string;
  current_step: number;
  version: number;
  step1_data?: Record<string, unknown>;
  step2_data?: Record<string, unknown>;
  step3_data?: Record<string, unknown>;
  step4_data?: Record<string, unknown>;
  auto_save_count: number;
  last_autosave_at?: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface DraftRecoveryOptions {
  /** Only recover drafts newer than this (hours) - default: 24 */
  maxAgeHours?: number;
  /** Auto-check for drafts on mount - default: true */
  autoCheck?: boolean;
  /** Callback when draft is found */
  onDraftFound?: (draft: DraftData) => void;
  /** Callback when draft is recovered */
  onRecover?: (draft: DraftData) => void;
  /** Callback when draft is discarded */
  onDiscard?: (draftId: string) => void;
}

export function useDraftRecovery(
  userId: string | null,
  companyId: string | null,
  options: DraftRecoveryOptions = {}
) {
  const {
    maxAgeHours = 24,
    autoCheck = true,
    onDraftFound,
    onRecover,
    onDiscard,
  } = options;

  const queryClient = useQueryClient();
  const [showBanner, setShowBanner] = useState(false);

  // Query for latest draft
  const {
    data: latestDraft,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['draft', 'latest', userId, companyId],
    queryFn: async () => {
      if (!userId || !companyId) {
        return null;
      }

      const response = await fetch(
        `/api/surveys/drafts/latest?user_id=${userId}&company_id=${companyId}`
      );

      if (!response.ok) {
        if (response.status === 404) {
          return null; // No draft found
        }
        throw new Error('Failed to fetch draft');
      }

      const data = await response.json();
      return data.draft as DraftData;
    },
    enabled: autoCheck && !!userId && !!companyId,
    staleTime: 0, // Always fetch fresh
    retry: 1,
  });

  // Check if draft is valid for recovery
  const isDraftRecoverable = useCallback((draft: DraftData | null): boolean => {
    if (!draft) return false;

    const now = new Date();
    const updatedAt = new Date(draft.updated_at);
    const expiresAt = new Date(draft.expires_at);

    // Check if expired
    if (now > expiresAt) {
      return false;
    }

    // Check if too old
    const ageHours = (now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60);
    if (ageHours > maxAgeHours) {
      return false;
    }

    return true;
  }, [maxAgeHours]);

  // Calculate draft age
  const getDraftAge = useCallback((draft: DraftData | null): string => {
    if (!draft) return '';

    const now = new Date();
    const updatedAt = new Date(draft.updated_at);
    const diffMs = now.getTime() - updatedAt.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'hace un momento';
    if (diffMins < 60) return `hace ${diffMins} minuto${diffMins > 1 ? 's' : ''}`;
    if (diffHours < 24) return `hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    return `hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
  }, []);

  // Recover draft mutation
  const recoverMutation = useMutation({
    mutationFn: async (draft: DraftData) => {
      // Mark draft as recovered
      const response = await fetch(`/api/surveys/drafts/${draft.id}/recover`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to recover draft');
      }

      return draft;
    },
    onSuccess: (draft) => {
      setShowBanner(false);
      onRecover?.(draft);
      queryClient.invalidateQueries({ queryKey: ['draft'] });
    },
  });

  // Discard draft mutation
  const discardMutation = useMutation({
    mutationFn: async (draftId: string) => {
      const response = await fetch(`/api/surveys/drafts/${draftId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to discard draft');
      }

      return draftId;
    },
    onSuccess: (draftId) => {
      setShowBanner(false);
      onDiscard?.(draftId);
      queryClient.invalidateQueries({ queryKey: ['draft'] });
    },
  });

  // Show banner when draft is found
  useEffect(() => {
    if (latestDraft && isDraftRecoverable(latestDraft)) {
      setShowBanner(true);
      onDraftFound?.(latestDraft);
    }
  }, [latestDraft, isDraftRecoverable, onDraftFound]);

  // Recover draft
  const recoverDraft = useCallback(() => {
    if (latestDraft) {
      recoverMutation.mutate(latestDraft);
    }
  }, [latestDraft, recoverMutation]);

  // Discard draft
  const discardDraft = useCallback(() => {
    if (latestDraft) {
      discardMutation.mutate(latestDraft.id);
    }
  }, [latestDraft, discardMutation]);

  // Hide banner manually
  const hideBanner = useCallback(() => {
    setShowBanner(false);
  }, []);

  // Check for drafts manually
  const checkForDrafts = useCallback(() => {
    refetch();
  }, [refetch]);

  return {
    // State
    hasDraft: !!latestDraft && isDraftRecoverable(latestDraft),
    draft: latestDraft,
    draftAge: getDraftAge(latestDraft),
    isLoading,
    showBanner,
    
    // Actions
    recoverDraft,
    discardDraft,
    hideBanner,
    checkForDrafts,
    
    // Mutation states
    isRecovering: recoverMutation.isPending,
    isDiscarding: discardMutation.isPending,
    recoverError: recoverMutation.error,
    discardError: discardMutation.error,
  };
}

/**
 * Get time until draft expires
 */
export function useTimeUntilExpiry(expiresAt: string | null): {
  timeRemaining: string;
  isExpiringSoon: boolean;
  isExpired: boolean;
} {
  const [timeRemaining, setTimeRemaining] = useState('');
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!expiresAt) {
      setTimeRemaining('');
      return;
    }

    const updateTime = () => {
      const now = new Date();
      const expiry = new Date(expiresAt);
      const diffMs = expiry.getTime() - now.getTime();

      if (diffMs <= 0) {
        setTimeRemaining('Expirado');
        setIsExpired(true);
        return;
      }

      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays > 0) {
        setTimeRemaining(`${diffDays} día${diffDays > 1 ? 's' : ''}`);
      } else if (diffHours > 0) {
        setTimeRemaining(`${diffHours} hora${diffHours > 1 ? 's' : ''}`);
      } else {
        const diffMins = Math.floor(diffMs / (1000 * 60));
        setTimeRemaining(`${diffMins} minuto${diffMins > 1 ? 's' : ''}`);
      }
      
      setIsExpired(false);
    };

    updateTime();
    const interval = setInterval(updateTime, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [expiresAt]);

  const isExpiringSoon = useCallback(() => {
    if (!expiresAt || isExpired) return false;
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffHours = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60);
    return diffHours < 24; // Less than 24 hours
  }, [expiresAt, isExpired]);

  return {
    timeRemaining,
    isExpiringSoon: isExpiringSoon(),
    isExpired,
  };
}
