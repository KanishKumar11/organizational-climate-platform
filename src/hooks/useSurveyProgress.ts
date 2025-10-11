/**
 * useSurveyProgress Hook
 *
 * Manages survey creation progress, tab validation, and completion tracking.
 * Implements progressive disclosure pattern for guided workflow.
 */

import { useMemo } from 'react';

export type SurveyTab =
  | 'basic'
  | 'questions'
  | 'targeting'
  | 'demographics'
  | 'invitations'
  | 'schedule'
  | 'preview'
  | 'qr-code';

export interface TabState {
  id: SurveyTab;
  label: string;
  icon: string;
  unlocked: boolean; // Can user access this tab?
  required: boolean; // Is this a required step?
  completed: boolean; // Has user completed this step?
  warning?: string; // Warning message if incomplete
  order: number; // Tab order for navigation
}

export interface SurveyProgressState {
  title: string;
  description: string;
  questions: any[];
  targetDepartments: string[];
  targetType?: 'all' | 'departments' | 'users' | 'csv_import';
  targetUserIds?: string[];
  targetEmails?: string[];
  demographicFieldIds?: string[]; // Selected demographic fields
  startDate: Date | null;
  endDate: Date | null;
  customMessage?: string;
  customSubject?: string;
  createdSurveyId: string | null;
}

export interface UseSurveyProgressReturn {
  tabs: Record<SurveyTab, TabState>;
  progress: {
    percentage: number;
    completedRequired: number;
    totalRequired: number;
    completedOptional: number;
    totalOptional: number;
  };
  canPublish: boolean;
  canSaveDraft: boolean;
  getNextTab: (currentTab: SurveyTab) => SurveyTab | null;
  getPreviousTab: (currentTab: SurveyTab) => SurveyTab | null;
  isTabAccessible: (tab: SurveyTab) => boolean;
  getTabWarning: (tab: SurveyTab) => string | null;
}

/**
 * Hook for managing survey creation progress and tab states
 */
export function useSurveyProgress(
  state: SurveyProgressState
): UseSurveyProgressReturn {
  const {
    title,
    questions,
    targetDepartments,
    targetType = 'all',
    targetUserIds = [],
    targetEmails = [],
    demographicFieldIds = [],
    startDate,
    endDate,
    customMessage,
    customSubject,
    createdSurveyId,
  } = state;

  // Calculate tab states
  const tabs = useMemo<Record<SurveyTab, TabState>>(() => {
    // Basic Info - Always unlocked, required
    const basicCompleted = title.trim() !== '';

    // Questions - Unlocks when basic info complete, required
    const questionsUnlocked = basicCompleted;
    const questionsCompleted = questions.length > 0;

    // Targeting - Unlocks when questions exist, required
    const targetingUnlocked = questions.length > 0;
    const targetingCompleted = (() => {
      switch (targetType) {
        case 'all':
          return true; // Always valid for "all employees"
        case 'departments':
          return targetDepartments.length > 0;
        case 'users':
          return targetUserIds.length > 0;
        case 'csv_import':
          return targetEmails.length > 0;
        default:
          return false;
      }
    })();

    // Demographics - Unlocks when targeting complete, optional
    const demographicsUnlocked = targetingCompleted;
    const demographicsCompleted = demographicFieldIds.length > 0;

    // Invitations - Unlocks when departments selected, optional
    const invitationsUnlocked = targetDepartments.length > 0;
    const invitationsCompleted =
      (customMessage && customMessage.trim() !== '') ||
      (customSubject && customSubject.trim() !== '');

    // Schedule - Unlocks when questions exist, required
    const scheduleUnlocked = questions.length > 0;
    const scheduleCompleted = startDate !== null && endDate !== null;

    // Preview - Unlocks when basic requirements met, required
    const previewUnlocked =
      title.trim() !== '' &&
      questions.length > 0 &&
      targetDepartments.length > 0;
    const previewCompleted = previewUnlocked; // Viewing is completion

    // QR Code - Unlocks when survey published, optional
    const qrCodeUnlocked = createdSurveyId !== null;
    const qrCodeCompleted = false; // Not a completion step

    return {
      basic: {
        id: 'basic',
        label: 'Basic Info',
        icon: 'FileText',
        unlocked: true,
        required: true,
        completed: basicCompleted,
        warning: !basicCompleted ? 'Enter a survey title' : undefined,
        order: 0,
      },
      questions: {
        id: 'questions',
        label: 'Questions',
        icon: 'HelpCircle',
        unlocked: questionsUnlocked,
        required: true,
        completed: questionsCompleted,
        warning: !questionsUnlocked
          ? 'Complete Basic Info first'
          : !questionsCompleted
            ? 'Add at least one question'
            : undefined,
        order: 1,
      },
      targeting: {
        id: 'targeting',
        label: 'Targeting',
        icon: 'Users',
        unlocked: targetingUnlocked,
        required: true,
        completed: targetingCompleted,
        warning: !targetingUnlocked
          ? 'Add questions first'
          : !targetingCompleted
            ? 'Select at least one department'
            : undefined,
        order: 2,
      },
      demographics: {
        id: 'demographics',
        label: 'Demographics',
        icon: 'Filter',
        unlocked: demographicsUnlocked,
        required: false,
        completed: demographicsCompleted,
        warning: !demographicsUnlocked ? 'Complete Targeting first' : undefined,
        order: 3,
      },
      invitations: {
        id: 'invitations',
        label: 'Invitations',
        icon: 'Mail',
        unlocked: invitationsUnlocked,
        required: false,
        completed: invitationsCompleted,
        warning: !invitationsUnlocked
          ? 'Select departments first in Targeting'
          : undefined,
        order: 4,
      },
      schedule: {
        id: 'schedule',
        label: 'Schedule',
        icon: 'Calendar',
        unlocked: scheduleUnlocked,
        required: true,
        completed: scheduleCompleted,
        warning: !scheduleUnlocked
          ? 'Add questions first'
          : !scheduleCompleted
            ? 'Set start and end dates'
            : undefined,
        order: 5,
      },
      preview: {
        id: 'preview',
        label: 'Preview',
        icon: 'Eye',
        unlocked: previewUnlocked,
        required: true,
        completed: previewCompleted,
        warning: !previewUnlocked
          ? 'Complete Questions and Targeting tabs first'
          : undefined,
        order: 6,
      },
      'qr-code': {
        id: 'qr-code',
        label: 'QR Code',
        icon: 'QrCode',
        unlocked: qrCodeUnlocked,
        required: false,
        completed: qrCodeCompleted,
        warning: !qrCodeUnlocked
          ? 'Publish survey first to generate QR code'
          : undefined,
        order: 7,
      },
    };
  }, [
    title,
    questions.length,
    targetDepartments.length,
    startDate,
    endDate,
    customMessage,
    customSubject,
    createdSurveyId,
  ]);

  // Calculate progress
  const progress = useMemo(() => {
    const tabArray = Object.values(tabs);
    const requiredTabs = tabArray.filter((tab) => tab.required);
    const optionalTabs = tabArray.filter((tab) => !tab.required);

    const completedRequired = requiredTabs.filter(
      (tab) => tab.completed
    ).length;
    const totalRequired = requiredTabs.length;

    const completedOptional = optionalTabs.filter(
      (tab) => tab.completed
    ).length;
    const totalOptional = optionalTabs.length;

    const percentage =
      totalRequired > 0
        ? Math.round((completedRequired / totalRequired) * 100)
        : 0;

    return {
      percentage,
      completedRequired,
      totalRequired,
      completedOptional,
      totalOptional,
    };
  }, [tabs]);

  // Can publish when all required tabs completed
  const canPublish = useMemo(() => {
    return Object.values(tabs)
      .filter((tab) => tab.required)
      .every((tab) => tab.completed);
  }, [tabs]);

  // Can save draft with minimal requirements
  const canSaveDraft = useMemo(() => {
    return title.trim() !== '' && questions.length > 0;
  }, [title, questions.length]);

  // Get next tab in sequence
  const getNextTab = (currentTab: SurveyTab): SurveyTab | null => {
    const tabArray = Object.values(tabs).sort((a, b) => a.order - b.order);
    const currentIndex = tabArray.findIndex((tab) => tab.id === currentTab);

    if (currentIndex === -1 || currentIndex === tabArray.length - 1) {
      return null;
    }

    // Find next unlocked tab
    for (let i = currentIndex + 1; i < tabArray.length; i++) {
      if (tabArray[i].unlocked) {
        return tabArray[i].id;
      }
    }

    return null;
  };

  // Get previous tab in sequence
  const getPreviousTab = (currentTab: SurveyTab): SurveyTab | null => {
    const tabArray = Object.values(tabs).sort((a, b) => a.order - b.order);
    const currentIndex = tabArray.findIndex((tab) => tab.id === currentTab);

    if (currentIndex <= 0) {
      return null;
    }

    // Find previous unlocked tab
    for (let i = currentIndex - 1; i >= 0; i--) {
      if (tabArray[i].unlocked) {
        return tabArray[i].id;
      }
    }

    return null;
  };

  // Check if tab is accessible
  const isTabAccessible = (tab: SurveyTab): boolean => {
    return tabs[tab]?.unlocked ?? false;
  };

  // Get warning message for tab
  const getTabWarning = (tab: SurveyTab): string | null => {
    return tabs[tab]?.warning ?? null;
  };

  return {
    tabs,
    progress,
    canPublish,
    canSaveDraft,
    getNextTab,
    getPreviousTab,
    isTabAccessible,
    getTabWarning,
  };
}
