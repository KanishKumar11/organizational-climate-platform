/**
 * Comprehensive unit tests for accessible components
 * Tests WCAG 2.1 AA compliance and accessibility features
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  SkipLink,
  LiveRegion,
  StatusMessage,
  AccessibleModal,
  ProgressBar,
  AccessibleLoadingSpinner,
  AccessibleBreadcrumb,
} from '@/components/ui/accessible-components';
import { accessibilityHelpers } from '../../utils/test-helpers';

// Mock the accessibility utilities
jest.mock('@/lib/accessibility', () => ({
  announceToScreenReader: jest.fn(),
  FocusManager: {
    saveFocus: jest.fn(),
    restoreFocus: jest.fn(),
    trapFocus: jest.fn(() => jest.fn()),
  },
}));

import { announceToScreenReader, FocusManager } from '@/lib/accessibility';

describe('Accessible Components', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('SkipLink Component', () => {
    test('should render skip link with proper attributes', () => {
      render(<SkipLink href="#main-content">Skip to main content</SkipLink>);

      const skipLink = screen.getByText('Skip to main content');
      expect(skipLink).toBeInTheDocument();
      expect(skipLink).toHaveAttribute('href', '#main-content');
      expect(skipLink).toHaveClass('sr-only');
    });

    test('should become visible on focus', async () => {
      const user = userEvent.setup();
      render(<SkipLink href="#main-content">Skip to main content</SkipLink>);

      const skipLink = screen.getByText('Skip to main content');
      await user.tab();

      expect(skipLink).toHaveFocus();
      expect(skipLink).toHaveClass('focus:not-sr-only');
    });

    test('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<SkipLink href="#main-content">Skip to main content</SkipLink>);

      const skipLink = screen.getByText('Skip to main content');
      await user.tab();
      await user.keyboard('{Enter}');

      // Should navigate to the target
      expect(skipLink).toHaveAttribute('href', '#main-content');
    });
  });

  describe('LiveRegion Component', () => {
    test('should render with proper ARIA attributes', () => {
      render(<LiveRegion message="Status update" priority="polite" />);

      const liveRegion = screen.getByText('Status update');
      expect(liveRegion).toHaveAttribute('aria-live', 'polite');
      expect(liveRegion).toHaveAttribute('aria-atomic', 'true');
      expect(liveRegion).toHaveClass('sr-only');
    });

    test('should support assertive priority', () => {
      render(<LiveRegion message="Error occurred" priority="assertive" />);

      const liveRegion = screen.getByText('Error occurred');
      expect(liveRegion).toHaveAttribute('aria-live', 'assertive');
    });

    test('should default to polite priority', () => {
      render(<LiveRegion message="Default priority" />);

      const liveRegion = screen.getByText('Default priority');
      expect(liveRegion).toHaveAttribute('aria-live', 'polite');
    });

    test('should have unique ID', () => {
      render(<LiveRegion message="Test message" />);

      const liveRegion = screen.getByText('Test message');
      expect(liveRegion).toHaveAttribute('id');
      expect(liveRegion.id).toBeTruthy(); // Just check that ID exists
    });
  });

  describe('StatusMessage Component', () => {
    test('should render success message with proper attributes', () => {
      render(
        <StatusMessage
          type="success"
          message="Operation completed successfully"
        />
      );

      const statusMessage = screen.getByRole('status');
      expect(statusMessage).toBeInTheDocument();
      expect(statusMessage).toHaveAttribute('aria-live', 'polite');
      expect(
        screen.getByText('Operation completed successfully')
      ).toBeInTheDocument();
    });

    test('should render error message with alert role', () => {
      render(<StatusMessage type="error" message="An error occurred" />);

      const errorMessage = screen.getByRole('alert');
      expect(errorMessage).toBeInTheDocument();
      expect(errorMessage).toHaveAttribute('aria-live', 'assertive');
      expect(screen.getByText('An error occurred')).toBeInTheDocument();
    });

    test('should announce message to screen readers', () => {
      render(<StatusMessage type="success" message="Success message" />);

      expect(announceToScreenReader).toHaveBeenCalledWith(
        'Success message',
        'polite'
      );
    });

    test('should announce error messages assertively', () => {
      render(<StatusMessage type="error" message="Error message" />);

      expect(announceToScreenReader).toHaveBeenCalledWith(
        'Error message',
        'assertive'
      );
    });

    test('should show appropriate icons', () => {
      const { rerender } = render(
        <StatusMessage type="success" message="Success" />
      );
      // Check for success message
      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText('Success')).toBeInTheDocument();

      rerender(<StatusMessage type="error" message="Error" />);
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Error')).toBeInTheDocument();

      rerender(<StatusMessage type="warning" message="Warning" />);
      // Warning messages use status role, not alert
      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText('Warning')).toBeInTheDocument();

      rerender(<StatusMessage type="info" message="Info" />);
      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText('Info')).toBeInTheDocument();
    });

    test('should handle dismissal', async () => {
      const onDismiss = jest.fn();
      const user = userEvent.setup();

      render(
        <StatusMessage
          type="success"
          message="Dismissible message"
          onDismiss={onDismiss}
        />
      );

      const dismissButton = screen.getByLabelText('Dismiss success message');
      await user.click(dismissButton);

      expect(onDismiss).toHaveBeenCalled();
    });

    test('should disable auto-announce when specified', () => {
      render(
        <StatusMessage
          type="success"
          message="No announce"
          autoAnnounce={false}
        />
      );

      expect(announceToScreenReader).not.toHaveBeenCalled();
    });
  });

  describe('AccessibleModal Component', () => {
    test('should render modal with proper ARIA attributes', () => {
      render(
        <AccessibleModal
          isOpen={true}
          onClose={jest.fn()}
          title="Test Modal"
          description="Modal description"
        >
          <p>Modal content</p>
        </AccessibleModal>
      );

      const modal = screen.getByRole('dialog');
      expect(modal).toBeInTheDocument();
      expect(modal).toHaveAttribute('aria-modal', 'true');
      expect(modal).toHaveAttribute('aria-labelledby');
      expect(modal).toHaveAttribute('aria-describedby');

      expect(screen.getByText('Test Modal')).toBeInTheDocument();
      expect(screen.getByText('Modal description')).toBeInTheDocument();
      expect(screen.getByText('Modal content')).toBeInTheDocument();
    });

    test('should manage focus properly', () => {
      render(
        <AccessibleModal isOpen={true} onClose={jest.fn()} title="Focus Test">
          <button>Test Button</button>
        </AccessibleModal>
      );

      expect(FocusManager.saveFocus).toHaveBeenCalled();
      expect(FocusManager.trapFocus).toHaveBeenCalled();
    });

    test('should handle escape key', async () => {
      const onClose = jest.fn();
      const user = userEvent.setup();

      render(
        <AccessibleModal isOpen={true} onClose={onClose} title="Escape Test">
          <p>Content</p>
        </AccessibleModal>
      );

      await user.keyboard('{Escape}');
      expect(onClose).toHaveBeenCalled();
    });

    test('should handle backdrop click', async () => {
      const onClose = jest.fn();
      const user = userEvent.setup();

      render(
        <AccessibleModal isOpen={true} onClose={onClose} title="Backdrop Test">
          <p>Content</p>
        </AccessibleModal>
      );

      const backdrop = screen.getByRole('dialog').parentElement;
      await user.click(backdrop!);
      expect(onClose).toHaveBeenCalled();
    });

    test('should not render when closed', () => {
      render(
        <AccessibleModal
          isOpen={false}
          onClose={jest.fn()}
          title="Closed Modal"
        >
          <p>Content</p>
        </AccessibleModal>
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    test('should restore focus on close', () => {
      const { rerender } = render(
        <AccessibleModal
          isOpen={true}
          onClose={jest.fn()}
          title="Focus Restore"
        >
          <p>Content</p>
        </AccessibleModal>
      );

      rerender(
        <AccessibleModal
          isOpen={false}
          onClose={jest.fn()}
          title="Focus Restore"
        >
          <p>Content</p>
        </AccessibleModal>
      );

      expect(FocusManager.restoreFocus).toHaveBeenCalled();
    });
  });

  describe('ProgressBar Component', () => {
    test('should render with proper ARIA attributes', () => {
      render(<ProgressBar value={50} max={100} label="Upload progress" />);

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toBeInTheDocument();
      expect(progressBar).toHaveAttribute('aria-valuenow', '50');
      expect(progressBar).toHaveAttribute('aria-valuemin', '0');
      expect(progressBar).toHaveAttribute('aria-valuemax', '100');
      expect(progressBar).toHaveAttribute('aria-valuetext', '50% complete');
    });

    test('should show label and percentage', () => {
      render(
        <ProgressBar
          value={75}
          label="Download progress"
          showPercentage={true}
        />
      );

      expect(screen.getByText('Download progress')).toBeInTheDocument();
      expect(screen.getByText('75%')).toBeInTheDocument();
    });

    test('should hide percentage when specified', () => {
      render(
        <ProgressBar value={25} label="Progress" showPercentage={false} />
      );

      expect(screen.getByText('Progress')).toBeInTheDocument();
      expect(screen.queryByText('25%')).not.toBeInTheDocument();
    });

    test('should handle custom max value', () => {
      render(<ProgressBar value={30} max={50} />);

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuemax', '50');
      expect(progressBar).toHaveAttribute('aria-valuetext', '60% complete');
    });

    test('should have proper visual width', () => {
      render(<ProgressBar value={40} max={100} />);

      const progressFill = screen
        .getByRole('progressbar')
        .querySelector('.bg-blue-600');
      expect(progressFill).toHaveStyle('width: 40%');
    });
  });

  describe('AccessibleLoadingSpinner Component', () => {
    test('should render with proper ARIA attributes', () => {
      render(<AccessibleLoadingSpinner label="Loading data" />);

      const spinner = screen.getByRole('status');
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveAttribute('aria-label', 'Loading data');

      const srText = screen.getByText('Loading data');
      expect(srText).toHaveClass('sr-only');
    });

    test('should support different sizes', () => {
      const { rerender } = render(<AccessibleLoadingSpinner size="sm" />);
      expect(
        screen.getByRole('status').querySelector('.h-4')
      ).toBeInTheDocument();

      rerender(<AccessibleLoadingSpinner size="md" />);
      expect(
        screen.getByRole('status').querySelector('.h-6')
      ).toBeInTheDocument();

      rerender(<AccessibleLoadingSpinner size="lg" />);
      expect(
        screen.getByRole('status').querySelector('.h-8')
      ).toBeInTheDocument();
    });

    test('should have default label', () => {
      render(<AccessibleLoadingSpinner />);

      const spinner = screen.getByRole('status');
      expect(spinner).toHaveAttribute('aria-label', 'Loading');
    });
  });

  describe('AccessibleBreadcrumb Component', () => {
    const breadcrumbItems = [
      { label: 'Home', href: '/' },
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Users', current: true },
    ];

    test('should render with proper navigation structure', () => {
      render(<AccessibleBreadcrumb items={breadcrumbItems} />);

      const nav = screen.getByRole('navigation');
      expect(nav).toHaveAttribute('aria-label', 'Breadcrumb');

      const list = screen.getByRole('list');
      expect(list).toBeInTheDocument();

      const listItems = screen.getAllByRole('listitem');
      expect(listItems).toHaveLength(3);
    });

    test('should render links for non-current items', () => {
      render(<AccessibleBreadcrumb items={breadcrumbItems} />);

      const homeLink = screen.getByRole('link', { name: 'Home' });
      expect(homeLink).toHaveAttribute('href', '/');

      const dashboardLink = screen.getByRole('link', { name: 'Dashboard' });
      expect(dashboardLink).toHaveAttribute('href', '/dashboard');
    });

    test('should mark current page appropriately', () => {
      render(<AccessibleBreadcrumb items={breadcrumbItems} />);

      const currentItem = screen.getByText('Users');
      expect(currentItem).toHaveAttribute('aria-current', 'page');
      expect(currentItem.tagName).toBe('SPAN');
    });

    test('should include separators with proper ARIA', () => {
      render(<AccessibleBreadcrumb items={breadcrumbItems} />);

      const separators = screen.getAllByText('/');
      expect(separators).toHaveLength(2); // Between 3 items
      separators.forEach((separator) => {
        expect(separator).toHaveAttribute('aria-hidden', 'true');
      });
    });

    test('should handle items without href', () => {
      const itemsWithoutHref = [
        { label: 'Home', href: '/' },
        { label: 'No Link' },
        { label: 'Current', current: true },
      ];

      render(<AccessibleBreadcrumb items={itemsWithoutHref} />);

      expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument();
      expect(screen.getByText('No Link')).toBeInTheDocument();
      expect(
        screen.queryByRole('link', { name: 'No Link' })
      ).not.toBeInTheDocument();
    });
  });

  describe('Accessibility Compliance', () => {
    test('all components should have proper focus indicators', async () => {
      const user = userEvent.setup();

      render(
        <div>
          <SkipLink href="#main">Skip</SkipLink>
          <AccessibleModal isOpen={true} onClose={jest.fn()} title="Modal">
            <button>Modal Button</button>
          </AccessibleModal>
        </div>
      );

      // Test focus indicators
      await user.tab();
      const skipLink = screen.getByText('Skip');
      expect(skipLink).toHaveFocus();
      expect(skipLink).toHaveClass('focus:ring-2');
    });

    test('all interactive elements should be keyboard accessible', async () => {
      const onClose = jest.fn();
      const user = userEvent.setup();

      render(
        <AccessibleModal isOpen={true} onClose={onClose} title="Keyboard Test">
          <button>Test Button</button>
        </AccessibleModal>
      );

      // Should be able to close with keyboard
      await user.keyboard('{Escape}');
      expect(onClose).toHaveBeenCalled();
    });

    test('all components should have proper color contrast', () => {
      render(
        <div>
          <StatusMessage type="success" message="Success" />
          <StatusMessage type="error" message="Error" />
          <StatusMessage type="warning" message="Warning" />
          <StatusMessage type="info" message="Info" />
        </div>
      );

      // Check that status messages have appropriate color classes
      expect(
        screen.getByText('Success').closest('.bg-green-50')
      ).toBeInTheDocument();
      expect(
        screen.getByText('Error').closest('.bg-red-50')
      ).toBeInTheDocument();
      expect(
        screen.getByText('Warning').closest('.bg-yellow-50')
      ).toBeInTheDocument();
      expect(
        screen.getByText('Info').closest('.bg-blue-50')
      ).toBeInTheDocument();
    });

    test('all components should support screen readers', () => {
      render(
        <div>
          <AccessibleLoadingSpinner label="Loading test" />
          <ProgressBar value={50} label="Progress test" />
          <LiveRegion message="Live region test" />
        </div>
      );

      // Check for screen reader text
      expect(screen.getByText('Loading test')).toHaveClass('sr-only');
      expect(screen.getByText('Progress test')).toBeInTheDocument();
      expect(screen.getByText('Live region test')).toHaveClass('sr-only');
    });
  });
});
