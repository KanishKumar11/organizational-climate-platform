/**
 * TabNavigationFooter Component
 *
 * Provides context-aware Next/Previous navigation for guided survey creation flow
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Send, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SurveyTab } from '@/hooks/useSurveyProgress';

interface TabNavigationFooterProps {
  currentTab: SurveyTab;
  nextTab: SurveyTab | null;
  previousTab: SurveyTab | null;
  canPublish: boolean;
  canSaveDraft: boolean;
  onTabChange: (tab: SurveyTab) => void;
  onSaveDraft: () => void;
  onPublish: () => void;
  saving?: boolean;
  nextTabLabel?: string;
  previousTabLabel?: string;
  nextDisabled?: boolean;
  className?: string;
}

export function TabNavigationFooter({
  currentTab,
  nextTab,
  previousTab,
  canPublish,
  canSaveDraft,
  onTabChange,
  onSaveDraft,
  onPublish,
  saving = false,
  nextTabLabel,
  previousTabLabel,
  nextDisabled = false,
  className,
}: TabNavigationFooterProps) {
  // Format tab label for display
  const formatTabLabel = (tab: SurveyTab): string => {
    const labels: Record<SurveyTab, string> = {
      questions: 'Targeting',
      targeting: 'Invitations',
      invitations: 'Schedule',
      schedule: 'Preview',
      preview: 'QR Code',
      'qr-code': 'QR Code',
    };
    return labels[tab] || tab;
  };

  // Determine if we're on the last step
  const isLastStep = !nextTab || currentTab === 'preview';

  return (
    <>
      {/* Main Footer */}
      <div
        className={cn(
          'flex items-center justify-between pt-6 mt-8 border-t border-gray-200 dark:border-gray-700',
          className
        )}
      >
        {/* Previous Button */}
        <div>
          {previousTab ? (
            <Button
              variant="outline"
              onClick={() => onTabChange(previousTab)}
              disabled={saving}
              className="gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              {previousTabLabel || formatTabLabel(previousTab)}
            </Button>
          ) : (
            <div /> // Empty div for flex spacing
          )}
        </div>

        {/* Right Side Buttons */}
        <div className="flex items-center gap-3">
          {/* Save Draft - Always visible except on QR Code tab */}
          {currentTab !== 'qr-code' && (
            <Button
              variant="outline"
              onClick={onSaveDraft}
              disabled={!canSaveDraft || saving}
              className="gap-2"
            >
              <Save className="w-4 h-4" />
              Save Draft
            </Button>
          )}
        </div>
      </div>

      {/* Floating Next Button */}
      {!isLastStep && nextTab && (
        <Button
          onClick={() => onTabChange(nextTab)}
          disabled={nextDisabled || saving}
          className="fixed bottom-6 right-6 z-50 gap-2 shadow-lg bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full h-auto"
          size="lg"
        >
          {nextTabLabel || `Next: ${formatTabLabel(nextTab)}`}
          <ChevronRight className="w-5 h-5" />
        </Button>
      )}

      {/* Floating Publish Button for Last Step */}
      {isLastStep && (
        <Button
          onClick={onPublish}
          disabled={!canPublish || saving}
          className="fixed bottom-6 right-6 z-50 gap-2 shadow-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-full h-auto"
          size="lg"
        >
          <Send className="w-5 h-5" />
          {saving ? 'Publishing...' : 'Publish Survey'}
        </Button>
      )}
    </>
  );
}
