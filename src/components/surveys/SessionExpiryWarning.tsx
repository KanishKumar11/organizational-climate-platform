import React, { useEffect, useState } from 'react';
import { AlertTriangle, Clock, Save } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/Progress';

/**
 * CLIMA-006: Session Expiry Warning Modal
 *
 * Warns users when their session is about to expire
 * and provides options to save or extend the session.
 */

interface SessionExpiryWarningProps {
  isOpen: boolean;
  onExtendSession: () => void;
  onSaveAndClose: () => Promise<void>;
  expiresInSeconds: number;
}

export default function SessionExpiryWarning({
  isOpen,
  onExtendSession,
  onSaveAndClose,
  expiresInSeconds: initialSeconds,
}: SessionExpiryWarningProps) {
  const [remainingSeconds, setRemainingSeconds] = useState(initialSeconds);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    setRemainingSeconds(initialSeconds);

    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, initialSeconds]);

  const handleSaveAndClose = async () => {
    setSaving(true);
    try {
      await onSaveAndClose();
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setSaving(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = (remainingSeconds / initialSeconds) * 100;

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-orange-600">
            <AlertTriangle className="h-5 w-5" />
            Session Expiring Soon
          </DialogTitle>
          <DialogDescription>
            Your session will expire in{' '}
            <strong className="text-orange-700 dark:text-orange-400">
              {formatTime(remainingSeconds)}
            </strong>
            . Please save your work or extend your session to avoid losing
            progress.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {/* Countdown Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1 text-muted-foreground">
                <Clock className="h-4 w-4" />
                Time Remaining
              </span>
              <span className="font-mono font-bold text-orange-600">
                {formatTime(remainingSeconds)}
              </span>
            </div>
            <Progress
              value={progressPercent}
              className={`h-2 ${
                remainingSeconds < 30
                  ? '[&>div]:bg-red-500'
                  : remainingSeconds < 60
                    ? '[&>div]:bg-orange-500'
                    : '[&>div]:bg-yellow-500'
              }`}
            />
          </div>

          {/* Auto-save Status */}
          <div className="p-3 bg-muted/50 rounded-md">
            <p className="text-sm text-muted-foreground">
              Your work is automatically saved every few seconds. You can safely
              close this page and return later to continue from where you left
              off.
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onExtendSession}
            className="w-full sm:w-auto"
          >
            Continue Working
          </Button>
          <Button
            variant="default"
            onClick={handleSaveAndClose}
            disabled={saving}
            className="w-full sm:w-auto"
          >
            {saving ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save & Close
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
