import React, { useEffect, useState } from 'react';
import { AlertCircle, RotateCcw, X, Clock } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';

/**
 * CLIMA-006: Draft Recovery Banner
 *
 * Displays a banner when an autosaved draft is found,
 * allowing users to restore or discard it.
 */

interface DraftRecoveryBannerProps {
  onRestore: (draft: any) => void;
  onDiscard: (draftId: string) => void;
  sessionKey: string;
}

interface DraftInfo {
  _id: string;
  surveyData: any;
  currentStep: number;
  lastSavedAt: Date;
  autoSaveCount: number;
}

export default function DraftRecoveryBanner({
  onRestore,
  onDiscard,
  sessionKey,
}: DraftRecoveryBannerProps) {
  const [draft, setDraft] = useState<DraftInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    checkForDraft();
  }, [sessionKey]);

  const checkForDraft = async () => {
    try {
      const response = await fetch(
        `/api/surveys/drafts?sessionKey=${sessionKey}`
      );
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.draft) {
          setDraft(data.draft);
        }
      }
    } catch (error) {
      console.error('Error checking for draft:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = () => {
    if (draft) {
      onRestore(draft.surveyData);
      setDismissed(true);
    }
  };

  const handleDiscard = async () => {
    if (!draft) return;

    try {
      const response = await fetch(`/api/surveys/drafts/${draft._id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        onDiscard(draft._id);
        setDismissed(true);
      }
    } catch (error) {
      console.error('Error discarding draft:', error);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
  };

  if (loading || !draft || dismissed) {
    return null;
  }

  const timeAgo = formatDistanceToNow(new Date(draft.lastSavedAt), {
    addSuffix: true,
  });

  return (
    <Alert className="mb-4 border-blue-200 bg-blue-50 dark:bg-blue-950/20">
      <AlertCircle className="h-4 w-4 text-blue-600" />
      <AlertTitle className="text-blue-900 dark:text-blue-100">
        Draft Found
      </AlertTitle>
      <AlertDescription className="text-blue-800 dark:text-blue-200">
        <div className="space-y-3">
          <div className="flex items-start gap-2">
            <Clock className="h-4 w-4 mt-0.5 text-blue-600" />
            <div className="flex-1 space-y-1">
              <p>
                You have an unsaved draft from <strong>{timeAgo}</strong>.
              </p>
              <p className="text-sm">
                Last saved at step {draft.currentStep} • Autosaved{' '}
                {draft.autoSaveCount} time{draft.autoSaveCount !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={handleRestore}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Restore Draft
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDiscard}
              className="border-blue-300 text-blue-900 hover:bg-blue-100"
            >
              Discard Draft
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="text-blue-700 hover:bg-blue-100"
            >
              <X className="h-4 w-4 mr-2" />
              Dismiss
            </Button>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
}
