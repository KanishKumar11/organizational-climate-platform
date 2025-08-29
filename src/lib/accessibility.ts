/**
 * Accessibility utilities and testing helpers
 * Ensures WCAG 2.1 AA compliance across the application
 */

// Color contrast calculation utilities
export function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

export function getContrastRatio(
  color1: [number, number, number],
  color2: [number, number, number]
): number {
  const lum1 = getLuminance(...color1);
  const lum2 = getLuminance(...color2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

export function hexToRgb(hex: string): [number, number, number] | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16),
      ]
    : null;
}

export function isAccessibleContrast(
  foreground: string,
  background: string,
  level: 'AA' | 'AAA' = 'AA',
  isLargeText: boolean = false
): boolean {
  const fg = hexToRgb(foreground);
  const bg = hexToRgb(background);

  if (!fg || !bg) return false;

  const ratio = getContrastRatio(fg, bg);

  if (level === 'AAA') {
    return isLargeText ? ratio >= 4.5 : ratio >= 7;
  }

  return isLargeText ? ratio >= 3 : ratio >= 4.5;
}

// Focus management utilities
export function trapFocus(element: HTMLElement): () => void {
  const focusableElements = element.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  ) as NodeListOf<HTMLElement>;

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  function handleTabKey(e: KeyboardEvent) {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        lastElement.focus();
        e.preventDefault();
      }
    } else {
      if (document.activeElement === lastElement) {
        firstElement.focus();
        e.preventDefault();
      }
    }
  }

  element.addEventListener('keydown', handleTabKey);
  firstElement?.focus();

  return () => {
    element.removeEventListener('keydown', handleTabKey);
  };
}

export function restoreFocus(previousActiveElement: Element | null) {
  if (previousActiveElement && 'focus' in previousActiveElement) {
    (previousActiveElement as HTMLElement).focus();
  }
}

// Screen reader utilities
export function announceToScreenReader(
  message: string,
  priority: 'polite' | 'assertive' = 'polite'
) {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;

  document.body.appendChild(announcement);

  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

// Keyboard navigation helpers
export function handleArrowNavigation(
  event: KeyboardEvent,
  items: HTMLElement[],
  currentIndex: number,
  orientation: 'horizontal' | 'vertical' = 'vertical'
): number {
  const { key } = event;
  let newIndex = currentIndex;

  if (orientation === 'vertical') {
    if (key === 'ArrowDown') {
      newIndex = (currentIndex + 1) % items.length;
      event.preventDefault();
    } else if (key === 'ArrowUp') {
      newIndex = currentIndex === 0 ? items.length - 1 : currentIndex - 1;
      event.preventDefault();
    }
  } else {
    if (key === 'ArrowRight') {
      newIndex = (currentIndex + 1) % items.length;
      event.preventDefault();
    } else if (key === 'ArrowLeft') {
      newIndex = currentIndex === 0 ? items.length - 1 : currentIndex - 1;
      event.preventDefault();
    }
  }

  if (key === 'Home') {
    newIndex = 0;
    event.preventDefault();
  } else if (key === 'End') {
    newIndex = items.length - 1;
    event.preventDefault();
  }

  if (newIndex !== currentIndex) {
    items[newIndex]?.focus();
  }

  return newIndex;
}

// Form accessibility helpers
export function generateId(prefix: string = 'field'): string {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
}

export function getAriaDescribedBy(
  ...ids: (string | undefined)[]
): string | undefined {
  const validIds = ids.filter(Boolean);
  return validIds.length > 0 ? validIds.join(' ') : undefined;
}

// Motion preferences
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function getAnimationDuration(defaultDuration: number): number {
  return prefersReducedMotion() ? 0 : defaultDuration;
}

// High contrast detection
export function prefersHighContrast(): boolean {
  return window.matchMedia('(prefers-contrast: high)').matches;
}

// Color scheme detection
export function getPreferredColorScheme(): 'light' | 'dark' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

// Accessibility testing utilities
export interface AccessibilityIssue {
  type: 'error' | 'warning';
  rule: string;
  message: string;
  element?: HTMLElement;
}

export function checkAccessibility(element: HTMLElement): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];

  // Check for missing alt text on images
  const images = element.querySelectorAll('img');
  images.forEach((img) => {
    if (
      !img.alt &&
      !img.getAttribute('aria-label') &&
      !img.getAttribute('aria-labelledby')
    ) {
      issues.push({
        type: 'error',
        rule: 'img-alt',
        message: 'Image missing alt text',
        element: img,
      });
    }
  });

  // Check for form labels
  const inputs = element.querySelectorAll('input, select, textarea');
  inputs.forEach((input) => {
    const hasLabel =
      input.getAttribute('aria-label') ||
      input.getAttribute('aria-labelledby') ||
      element.querySelector(`label[for="${input.id}"]`);

    if (!hasLabel) {
      issues.push({
        type: 'error',
        rule: 'form-label',
        message: 'Form control missing label',
        element: input as HTMLElement,
      });
    }
  });

  // Check for heading hierarchy
  const headings = Array.from(
    element.querySelectorAll('h1, h2, h3, h4, h5, h6')
  );
  let previousLevel = 0;

  headings.forEach((heading) => {
    const level = parseInt(heading.tagName.charAt(1));
    if (level > previousLevel + 1) {
      issues.push({
        type: 'warning',
        rule: 'heading-hierarchy',
        message: `Heading level ${level} skips level ${previousLevel + 1}`,
        element: heading as HTMLElement,
      });
    }
    previousLevel = level;
  });

  // Check for interactive elements without accessible names
  const interactive = element.querySelectorAll(
    'button, a, [role="button"], [role="link"]'
  );
  interactive.forEach((el) => {
    const hasAccessibleName =
      el.textContent?.trim() ||
      el.getAttribute('aria-label') ||
      el.getAttribute('aria-labelledby') ||
      el.querySelector('img')?.alt;

    if (!hasAccessibleName) {
      issues.push({
        type: 'error',
        rule: 'interactive-name',
        message: 'Interactive element missing accessible name',
        element: el as HTMLElement,
      });
    }
  });

  return issues;
}

// Accessibility testing hook for React components
export function useAccessibilityTesting(
  enabled: boolean = process.env.NODE_ENV === 'development'
) {
  if (!enabled || typeof window === 'undefined') return;

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const issues = checkAccessibility(node as HTMLElement);
            if (issues.length > 0) {
              console.group('🔍 Accessibility Issues Detected');
              issues.forEach((issue) => {
                const method = issue.type === 'error' ? 'error' : 'warn';
                console[method](
                  `${issue.rule}: ${issue.message}`,
                  issue.element
                );
              });
              console.groupEnd();
            }
          }
        });
      }
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  return () => observer.disconnect();
}

// ARIA live region manager
class LiveRegionManager {
  private regions: Map<string, HTMLElement> = new Map();

  private createRegion(politeness: 'polite' | 'assertive'): HTMLElement {
    const region = document.createElement('div');
    region.setAttribute('aria-live', politeness);
    region.setAttribute('aria-atomic', 'true');
    region.className = 'sr-only';
    document.body.appendChild(region);
    return region;
  }

  announce(message: string, politeness: 'polite' | 'assertive' = 'polite') {
    let region = this.regions.get(politeness);

    if (!region) {
      region = this.createRegion(politeness);
      this.regions.set(politeness, region);
    }

    region.textContent = message;

    // Clear after announcement
    setTimeout(() => {
      region!.textContent = '';
    }, 1000);
  }

  destroy() {
    this.regions.forEach((region) => {
      document.body.removeChild(region);
    });
    this.regions.clear();
  }
}

export const liveRegionManager = new LiveRegionManager();

// Export commonly used ARIA attributes
export const ariaAttributes = {
  // Landmark roles
  landmarks: {
    banner: 'banner',
    navigation: 'navigation',
    main: 'main',
    complementary: 'complementary',
    contentinfo: 'contentinfo',
    search: 'search',
    form: 'form',
    region: 'region',
  },

  // Widget roles
  widgets: {
    button: 'button',
    checkbox: 'checkbox',
    radio: 'radio',
    textbox: 'textbox',
    combobox: 'combobox',
    listbox: 'listbox',
    option: 'option',
    tab: 'tab',
    tabpanel: 'tabpanel',
    dialog: 'dialog',
    alertdialog: 'alertdialog',
    tooltip: 'tooltip',
    menu: 'menu',
    menuitem: 'menuitem',
  },

  // Live region politeness
  live: {
    off: 'off',
    polite: 'polite',
    assertive: 'assertive',
  },

  // States
  states: {
    expanded: 'aria-expanded',
    selected: 'aria-selected',
    checked: 'aria-checked',
    disabled: 'aria-disabled',
    hidden: 'aria-hidden',
    pressed: 'aria-pressed',
    current: 'aria-current',
  },
} as const;
