/**
 * Comprehensive unit tests for SurveyManagement component
 * Tests survey listing, pagination, search, and management functionality
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SurveyManagement from '@/components/dashboard/SurveyManagement';
import { mockSurvey, renderWithProviders } from '../../utils/test-helpers';

// Mock fetch for API calls
global.fetch = jest.fn();

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
  }),
}));

// Mock session
jest.mock('next-auth/react', () => ({
  useSession: () => ({
    data: {
      user: {
        id: 'test-user-id',
        role: 'company_admin',
        company_id: 'test-company-id',
      },
    },
    status: 'authenticated',
  }),
}));

describe('SurveyManagement Component', () => {
  const mockSurveys = [
    mockSurvey({
      id: '1',
      title: 'Employee Satisfaction Survey',
      status: 'active',
      created_at: new Date('2024-01-01'),
      responses_count: 25,
      total_invitations: 100,
    }),
    mockSurvey({
      id: '2',
      title: 'Quarterly Climate Survey',
      status: 'draft',
      created_at: new Date('2024-01-15'),
      responses_count: 0,
      total_invitations: 0,
    }),
    mockSurvey({
      id: '3',
      title: 'Annual Engagement Survey',
      status: 'completed',
      created_at: new Date('2023-12-01'),
      responses_count: 150,
      total_invitations: 200,
    }),
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          surveys: mockSurveys,
          pagination: {
            page: 1,
            limit: 12,
            total: mockSurveys.length,
            pages: 1,
          },
        },
      }),
    });
  });

  describe('Component Rendering', () => {
    test('should render survey management interface', async () => {
      renderWithProviders(<SurveyManagement />);

      expect(screen.getByText('Survey Management')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Search surveys...')).toBeInTheDocument();
      expect(screen.getByText('Create New Survey')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText('Employee Satisfaction Survey')).toBeInTheDocument();
      });
    });

    test('should display survey cards with correct information', async () => {
      renderWithProviders(<SurveyManagement />);

      await waitFor(() => {
        expect(screen.getByText('Employee Satisfaction Survey')).toBeInTheDocument();
        expect(screen.getByText('Quarterly Climate Survey')).toBeInTheDocument();
        expect(screen.getByText('Annual Engagement Survey')).toBeInTheDocument();
      });

      // Check status badges
      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getByText('Draft')).toBeInTheDocument();
      expect(screen.getByText('Completed')).toBeInTheDocument();

      // Check response counts
      expect(screen.getByText('25 / 100 responses')).toBeInTheDocument();
      expect(screen.getByText('0 / 0 responses')).toBeInTheDocument();
      expect(screen.getByText('150 / 200 responses')).toBeInTheDocument();
    });

    test('should show loading state initially', () => {
      renderWithProviders(<SurveyManagement />);

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    test('should show empty state when no surveys', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            surveys: [],
            pagination: { page: 1, limit: 12, total: 0, pages: 0 },
          },
        }),
      });

      renderWithProviders(<SurveyManagement />);

      await waitFor(() => {
        expect(screen.getByText('No surveys found')).toBeInTheDocument();
        expect(screen.getByText('Create your first survey to get started')).toBeInTheDocument();
      });
    });
  });

  describe('Search Functionality', () => {
    test('should handle search input', async () => {
      const user = userEvent.setup();
      renderWithProviders(<SurveyManagement />);

      const searchInput = screen.getByPlaceholderText('Search surveys...');
      await user.type(searchInput, 'satisfaction');

      // Should debounce the search
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('search=satisfaction'),
          expect.any(Object)
        );
      }, { timeout: 1000 });
    });

    test('should clear search results', async () => {
      const user = userEvent.setup();
      renderWithProviders(<SurveyManagement />);

      const searchInput = screen.getByPlaceholderText('Search surveys...');
      await user.type(searchInput, 'test');
      await user.clear(searchInput);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.not.stringContaining('search='),
          expect.any(Object)
        );
      });
    });

    test('should handle search with no results', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            surveys: [],
            pagination: { page: 1, limit: 12, total: 0, pages: 0 },
          },
        }),
      });

      const user = userEvent.setup();
      renderWithProviders(<SurveyManagement />);

      const searchInput = screen.getByPlaceholderText('Search surveys...');
      await user.type(searchInput, 'nonexistent');

      await waitFor(() => {
        expect(screen.getByText('No surveys found')).toBeInTheDocument();
      });
    });
  });

  describe('Status Filtering', () => {
    test('should filter by status', async () => {
      const user = userEvent.setup();
      renderWithProviders(<SurveyManagement />);

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('Employee Satisfaction Survey')).toBeInTheDocument();
      });

      // Click on status filter
      const statusFilter = screen.getByText('All Status');
      await user.click(statusFilter);

      const activeFilter = screen.getByText('Active');
      await user.click(activeFilter);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('status=active'),
          expect.any(Object)
        );
      });
    });

    test('should show correct status counts', async () => {
      renderWithProviders(<SurveyManagement />);

      await waitFor(() => {
        // Should show status counts in filter dropdown
        expect(screen.getByText('All (3)')).toBeInTheDocument();
        expect(screen.getByText('Active (1)')).toBeInTheDocument();
        expect(screen.getByText('Draft (1)')).toBeInTheDocument();
        expect(screen.getByText('Completed (1)')).toBeInTheDocument();
      });
    });
  });

  describe('Pagination', () => {
    test('should handle pagination controls', async () => {
      const mockPaginatedResponse = {
        success: true,
        data: {
          surveys: mockSurveys.slice(0, 2),
          pagination: {
            page: 1,
            limit: 2,
            total: 3,
            pages: 2,
          },
        },
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockPaginatedResponse,
      });

      const user = userEvent.setup();
      renderWithProviders(<SurveyManagement />);

      await waitFor(() => {
        expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
      });

      const nextButton = screen.getByText('Next');
      await user.click(nextButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('page=2'),
          expect.any(Object)
        );
      });
    });

    test('should disable pagination buttons appropriately', async () => {
      renderWithProviders(<SurveyManagement />);

      await waitFor(() => {
        const prevButton = screen.getByText('Previous');
        expect(prevButton).toBeDisabled();
      });
    });
  });

  describe('Survey Actions', () => {
    test('should handle survey creation', async () => {
      const user = userEvent.setup();
      renderWithProviders(<SurveyManagement />);

      const createButton = screen.getByText('Create New Survey');
      await user.click(createButton);

      // Should navigate to survey creation page
      // This would be tested with router mock
    });

    test('should handle survey editing', async () => {
      const user = userEvent.setup();
      renderWithProviders(<SurveyManagement />);

      await waitFor(() => {
        expect(screen.getByText('Employee Satisfaction Survey')).toBeInTheDocument();
      });

      const editButton = screen.getAllByText('Edit')[0];
      await user.click(editButton);

      // Should navigate to survey edit page
    });

    test('should handle survey deletion', async () => {
      const user = userEvent.setup();
      renderWithProviders(<SurveyManagement />);

      await waitFor(() => {
        expect(screen.getByText('Employee Satisfaction Survey')).toBeInTheDocument();
      });

      const deleteButton = screen.getAllByText('Delete')[0];
      await user.click(deleteButton);

      // Should show confirmation dialog
      expect(screen.getByText('Confirm Deletion')).toBeInTheDocument();
      expect(screen.getByText('Are you sure you want to delete this survey?')).toBeInTheDocument();

      const confirmButton = screen.getByText('Delete Survey');
      await user.click(confirmButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/surveys/1'),
          expect.objectContaining({ method: 'DELETE' })
        );
      });
    });

    test('should handle survey duplication', async () => {
      const user = userEvent.setup();
      renderWithProviders(<SurveyManagement />);

      await waitFor(() => {
        expect(screen.getByText('Employee Satisfaction Survey')).toBeInTheDocument();
      });

      const duplicateButton = screen.getAllByText('Duplicate')[0];
      await user.click(duplicateButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/surveys/1/duplicate'),
          expect.objectContaining({ method: 'POST' })
        );
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle API errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      renderWithProviders(<SurveyManagement />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load surveys')).toBeInTheDocument();
        expect(screen.getByText('Try Again')).toBeInTheDocument();
      });
    });

    test('should handle retry functionality', async () => {
      (global.fetch as jest.Mock)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: { surveys: mockSurveys, pagination: {} },
          }),
        });

      const user = userEvent.setup();
      renderWithProviders(<SurveyManagement />);

      await waitFor(() => {
        expect(screen.getByText('Try Again')).toBeInTheDocument();
      });

      const retryButton = screen.getByText('Try Again');
      await user.click(retryButton);

      await waitFor(() => {
        expect(screen.getByText('Employee Satisfaction Survey')).toBeInTheDocument();
      });
    });

    test('should handle server errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({
          success: false,
          message: 'Internal server error',
        }),
      });

      renderWithProviders(<SurveyManagement />);

      await waitFor(() => {
        expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    test('should have proper ARIA labels', async () => {
      renderWithProviders(<SurveyManagement />);

      expect(screen.getByLabelText('Search surveys')).toBeInTheDocument();
      expect(screen.getByLabelText('Filter by status')).toBeInTheDocument();
    });

    test('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      renderWithProviders(<SurveyManagement />);

      const searchInput = screen.getByPlaceholderText('Search surveys...');
      await user.tab();

      expect(searchInput).toHaveFocus();
    });

    test('should announce loading states to screen readers', () => {
      renderWithProviders(<SurveyManagement />);

      expect(screen.getByLabelText('Loading surveys')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    test('should debounce search input', async () => {
      const user = userEvent.setup();
      renderWithProviders(<SurveyManagement />);

      const searchInput = screen.getByPlaceholderText('Search surveys...');
      
      // Type multiple characters quickly
      await user.type(searchInput, 'test');

      // Should only make one API call after debounce delay
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(2); // Initial load + debounced search
      }, { timeout: 1000 });
    });

    test('should handle large datasets efficiently', async () => {
      const largeSurveyList = Array.from({ length: 100 }, (_, i) =>
        mockSurvey({ id: i.toString(), title: `Survey ${i}` })
      );

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            surveys: largeSurveyList.slice(0, 12),
            pagination: { page: 1, limit: 12, total: 100, pages: 9 },
          },
        }),
      });

      const startTime = performance.now();
      renderWithProviders(<SurveyManagement />);

      await waitFor(() => {
        expect(screen.getByText('Survey 0')).toBeInTheDocument();
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render quickly even with large datasets
      expect(renderTime).toBeLessThan(1000);
    });
  });

  describe('Responsive Design', () => {
    test('should adapt to mobile viewport', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      renderWithProviders(<SurveyManagement />);

      // Should show mobile-optimized layout
      expect(screen.getByTestId('mobile-survey-grid')).toBeInTheDocument();
    });

    test('should show desktop layout on larger screens', () => {
      // Mock desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1200,
      });

      renderWithProviders(<SurveyManagement />);

      // Should show desktop layout
      expect(screen.getByTestId('desktop-survey-grid')).toBeInTheDocument();
    });
  });
});
