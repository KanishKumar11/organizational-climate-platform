'use client';

import React, { useEffect, useRef, useState } from 'react';

export interface AccessibilityOptions {
  enableKeyboardNavigation?: boolean;
  enableFocusManagement?: boolean;
  enableAriaLiveRegions?: boolean;
  enableColorContrastChecking?: boolean;
  announceChanges?: boolean;
}

export interface AccessibilityState {
  isKeyboardUser: boolean;
  currentFocus: HTMLElement | null;
  announcements: string[];
  colorContrastIssues: string[];
}

export function useAccessibility(options: AccessibilityOptions = {}) {
  const {
    enableKeyboardNavigation = true,
    enableFocusManagement = true,
    enableAriaLiveRegions = true,
    enableColorContrastChecking = false,
    announceChanges = true,
  } = options;

  const [state, setState] = useState<AccessibilityState>({
    isKeyboardUser: false,
    currentFocus: null,
    announcements: [],
    colorContrastIssues: [],
  });

  const ariaLiveRef = useRef<HTMLDivElement>(null);
  const focusHistoryRef = useRef<HTMLElement[]>([]);

  // Detect keyboard usage
  useEffect(() => {
    if (!enableKeyboardNavigation) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        setState(prev => ({ ...prev, isKeyboardUser: true }));
      }
    };

    const handleMouseDown = () => {
      setState(prev => ({ ...prev, isKeyboardUser: false }));
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, [enableKeyboardNavigation]);

  // Focus management
  useEffect(() => {
    if (!enableFocusManagement) return;

    const handleFocusChange = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      setState(prev => ({ ...prev, currentFocus: target }));
      
      // Keep focus history
      if (target && focusHistoryRef.current.length < 10) {
        focusHistoryRef.current.push(target);
      }
    };

    document.addEventListener('focusin', handleFocusChange);

    return () => {
      document.removeEventListener('focusin', handleFocusChange);
    };
  }, [enableFocusManagement]);

  // Announce changes to screen readers
  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (!announceChanges || !enableAriaLiveRegions) return;

    setState(prev => ({
      ...prev,
      announcements: [...prev.announcements.slice(-4), message], // Keep last 5 announcements
    }));

    // Create temporary live region for announcement
    const liveRegion = document.createElement('div');
    liveRegion.setAttribute('aria-live', priority);
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'sr-only';
    liveRegion.textContent = message;
    
    document.body.appendChild(liveRegion);
    
    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(liveRegion);
    }, 1000);
  };

  // Focus management utilities
  const focusElement = (element: HTMLElement | null) => {
    if (element && element.focus) {
      element.focus();
      setState(prev => ({ ...prev, currentFocus: element }));
    }
  };

  const focusFirst = (container: HTMLElement) => {
    const focusableElements = getFocusableElements(container);
    if (focusableElements.length > 0) {
      focusElement(focusableElements[0]);
    }
  };

  const focusLast = (container: HTMLElement) => {
    const focusableElements = getFocusableElements(container);
    if (focusableElements.length > 0) {
      focusElement(focusableElements[focusableElements.length - 1]);
    }
  };

  const trapFocus = (container: HTMLElement) => {
    const focusableElements = getFocusableElements(container);
    
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          // Shift + Tab
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          // Tab
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
      
      if (e.key === 'Escape') {
        // Allow escape to break focus trap
        container.dispatchEvent(new CustomEvent('focustrap:escape'));
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    
    // Focus first element
    firstElement.focus();

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  };

  const restoreFocus = () => {
    const lastFocused = focusHistoryRef.current.pop();
    if (lastFocused && document.contains(lastFocused)) {
      focusElement(lastFocused);
    }
  };

  // Keyboard navigation helpers
  const handleArrowNavigation = (
    e: KeyboardEvent,
    items: HTMLElement[],
    currentIndex: number,
    orientation: 'horizontal' | 'vertical' = 'vertical'
  ) => {
    let newIndex = currentIndex;

    if (orientation === 'vertical') {
      if (e.key === 'ArrowDown') {
        newIndex = (currentIndex + 1) % items.length;
      } else if (e.key === 'ArrowUp') {
        newIndex = currentIndex === 0 ? items.length - 1 : currentIndex - 1;
      }
    } else {
      if (e.key === 'ArrowRight') {
        newIndex = (currentIndex + 1) % items.length;
      } else if (e.key === 'ArrowLeft') {
        newIndex = currentIndex === 0 ? items.length - 1 : currentIndex - 1;
      }
    }

    if (newIndex !== currentIndex) {
      e.preventDefault();
      focusElement(items[newIndex]);
      return newIndex;
    }

    return currentIndex;
  };

  // Color contrast checking (basic implementation)
  const checkColorContrast = (element: HTMLElement) => {
    if (!enableColorContrastChecking) return;

    const styles = window.getComputedStyle(element);
    const color = styles.color;
    const backgroundColor = styles.backgroundColor;
    
    // This is a simplified check - in production, you'd use a proper color contrast library
    const contrastRatio = calculateContrastRatio(color, backgroundColor);
    
    if (contrastRatio < 4.5) {
      const issue = `Low contrast ratio (${contrastRatio.toFixed(2)}) on element: ${element.tagName}`;
      setState(prev => ({
        ...prev,
        colorContrastIssues: [...prev.colorContrastIssues, issue],
      }));
    }
  };

  // ARIA helpers
  const setAriaExpanded = (element: HTMLElement, expanded: boolean) => {
    element.setAttribute('aria-expanded', expanded.toString());
    
    if (announceChanges) {
      const label = element.getAttribute('aria-label') || element.textContent || 'Element';
      announce(`${label} ${expanded ? 'expanded' : 'collapsed'}`);
    }
  };

  const setAriaSelected = (element: HTMLElement, selected: boolean) => {
    element.setAttribute('aria-selected', selected.toString());
    
    if (announceChanges && selected) {
      const label = element.getAttribute('aria-label') || element.textContent || 'Item';
      announce(`${label} selected`);
    }
  };

  const setAriaChecked = (element: HTMLElement, checked: boolean) => {
    element.setAttribute('aria-checked', checked.toString());
    
    if (announceChanges) {
      const label = element.getAttribute('aria-label') || element.textContent || 'Checkbox';
      announce(`${label} ${checked ? 'checked' : 'unchecked'}`);
    }
  };

  // Live region component
  const LiveRegion = () => {
    if (!enableAriaLiveRegions) return null;

    return (
      <div
        ref={ariaLiveRef}
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {state.announcements[state.announcements.length - 1]}
      </div>
    );
  };

  return {
    state,
    announce,
    focusElement,
    focusFirst,
    focusLast,
    trapFocus,
    restoreFocus,
    handleArrowNavigation,
    checkColorContrast,
    setAriaExpanded,
    setAriaSelected,
    setAriaChecked,
    LiveRegion,
  };
}

// Utility functions
function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const focusableSelectors = [
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'a[href]',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]',
  ];

  return Array.from(
    container.querySelectorAll(focusableSelectors.join(', '))
  ) as HTMLElement[];
}

function calculateContrastRatio(color1: string, color2: string): number {
  // Simplified contrast ratio calculation
  // In production, use a proper color contrast library like 'color-contrast'
  
  // This is a placeholder implementation
  // Real implementation would parse RGB values and calculate luminance
  return 4.5; // Placeholder value
}

// Hook for managing modal accessibility
export function useModalAccessibility() {
  const { trapFocus, restoreFocus, announce } = useAccessibility();
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const openModal = () => {
    previousFocusRef.current = document.activeElement as HTMLElement;
    
    if (modalRef.current) {
      const cleanup = trapFocus(modalRef.current);
      announce('Modal opened', 'assertive');
      
      return cleanup;
    }
  };

  const closeModal = () => {
    announce('Modal closed', 'assertive');
    
    // Restore focus after a brief delay to ensure modal is closed
    setTimeout(() => {
      if (previousFocusRef.current && document.contains(previousFocusRef.current)) {
        previousFocusRef.current.focus();
      } else {
        restoreFocus();
      }
    }, 100);
  };

  return {
    modalRef,
    openModal,
    closeModal,
  };
}

// Hook for managing form accessibility
export function useFormAccessibility() {
  const { announce } = useAccessibility();

  const announceError = (fieldName: string, errorMessage: string) => {
    announce(`Error in ${fieldName}: ${errorMessage}`, 'assertive');
  };

  const announceSuccess = (message: string) => {
    announce(message, 'polite');
  };

  const associateErrorWithField = (fieldId: string, errorId: string) => {
    const field = document.getElementById(fieldId);
    const error = document.getElementById(errorId);
    
    if (field && error) {
      field.setAttribute('aria-describedby', errorId);
      field.setAttribute('aria-invalid', 'true');
    }
  };

  const clearFieldError = (fieldId: string) => {
    const field = document.getElementById(fieldId);
    
    if (field) {
      field.removeAttribute('aria-describedby');
      field.setAttribute('aria-invalid', 'false');
    }
  };

  return {
    announceError,
    announceSuccess,
    associateErrorWithField,
    clearFieldError,
  };
}

export default useAccessibility;