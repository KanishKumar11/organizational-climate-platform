/**
 * Comprehensive testing utilities for the organizational climate platform
 * Provides mocks, helpers, and utilities for unit and integration testing
 */

import { render, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';

// Mock data generators
export const mockUser = (overrides: Partial<any> = {}) => ({
  _id: 'test-user-id',
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
  role: 'company_admin',
  company_id: 'test-company-id',
  department_id: 'test-department-id',
  is_active: true,
  created_at: new Date('2024-01-01'),
  updated_at: new Date('2024-01-01'),
  ...overrides,
});

export const mockCompany = (overrides: Partial<any> = {}) => ({
  _id: 'test-company-id',
  id: 'test-company-id',
  name: 'Test Company',
  domain: 'testcompany.com',
  industry: 'Technology',
  size: '100-500',
  created_at: new Date('2024-01-01'),
  is_active: true,
  ...overrides,
});

export const mockDepartment = (overrides: Partial<any> = {}) => ({
  _id: 'test-department-id',
  id: 'test-department-id',
  name: 'Test Department',
  company_id: 'test-company-id',
  parent_id: null,
  manager_id: 'test-user-id',
  created_at: new Date('2024-01-01'),
  ...overrides,
});

export const mockSurvey = (overrides: Partial<any> = {}) => ({
  _id: 'test-survey-id',
  id: 'test-survey-id',
  title: 'Test Survey',
  description: 'Test survey description',
  type: 'general_climate',
  company_id: 'test-company-id',
  created_by: 'test-user-id',
  status: 'draft',
  questions: [
    {
      id: 'q1',
      text: 'How satisfied are you?',
      type: 'likert',
      options: [
        'Very Dissatisfied',
        'Dissatisfied',
        'Neutral',
        'Satisfied',
        'Very Satisfied',
      ],
      required: true,
      order: 0,
    },
  ],
  settings: {
    anonymous: false,
    allow_partial_responses: true,
    randomize_questions: false,
  },
  created_at: new Date('2024-01-01'),
  ...overrides,
});

export const mockSurveyResponse = (overrides: Partial<any> = {}) => ({
  _id: 'test-response-id',
  id: 'test-response-id',
  survey_id: 'test-survey-id',
  user_id: 'test-user-id',
  company_id: 'test-company-id',
  responses: {
    q1: 'Satisfied',
  },
  status: 'completed',
  submitted_at: new Date('2024-01-01'),
  ...overrides,
});

// API testing utilities
export const createMockRequest = (
  method: string = 'GET',
  url: string = 'http://localhost:3000/api/test',
  options: Partial<any> = {}
) => {
  const request = new global.Request(url, {
    method,
    headers: {
      'content-type': 'application/json',
      ...options.headers,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  // Add custom properties for testing
  (request as any).user = options.user || mockUser();
  (request as any).company_id = options.company_id || 'test-company-id';

  return request;
};

export const createMockResponse = () => {
  const response = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    end: jest.fn().mockReturnThis(),
    headers: new Headers(),
  };
  return response;
};

// Database mocking utilities
export const mockDatabase = {
  users: new Map(),
  companies: new Map(),
  departments: new Map(),
  surveys: new Map(),
  responses: new Map(),

  // CRUD operations
  create: jest.fn((collection: string, data: any) => {
    const id = data._id || `test-${collection}-${Date.now()}`;
    const item = { ...data, _id: id, id };
    mockDatabase[collection as keyof typeof mockDatabase].set(id, item);
    return Promise.resolve(item);
  }),

  findById: jest.fn((collection: string, id: string) => {
    const item = mockDatabase[collection as keyof typeof mockDatabase].get(id);
    return Promise.resolve(item || null);
  }),

  find: jest.fn((collection: string, query: any = {}) => {
    const items = Array.from(
      mockDatabase[collection as keyof typeof mockDatabase].values()
    );
    return Promise.resolve(items);
  }),

  updateById: jest.fn((collection: string, id: string, update: any) => {
    const existing =
      mockDatabase[collection as keyof typeof mockDatabase].get(id);
    if (existing) {
      const updated = { ...existing, ...update, updated_at: new Date() };
      mockDatabase[collection as keyof typeof mockDatabase].set(id, updated);
      return Promise.resolve(updated);
    }
    return Promise.resolve(null);
  }),

  deleteById: jest.fn((collection: string, id: string) => {
    const deleted =
      mockDatabase[collection as keyof typeof mockDatabase].delete(id);
    return Promise.resolve(deleted);
  }),

  // Utility methods
  clear: () => {
    mockDatabase.users.clear();
    mockDatabase.companies.clear();
    mockDatabase.departments.clear();
    mockDatabase.surveys.clear();
    mockDatabase.responses.clear();
  },

  seed: () => {
    mockDatabase.users.set('test-user-id', mockUser());
    mockDatabase.companies.set('test-company-id', mockCompany());
    mockDatabase.departments.set('test-department-id', mockDepartment());
    mockDatabase.surveys.set('test-survey-id', mockSurvey());
    mockDatabase.responses.set('test-response-id', mockSurveyResponse());
  },
};

// Component testing utilities
export const renderWithProviders = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => {
  // In a real implementation, this would wrap with providers like:
  // - SessionProvider
  // - ThemeProvider
  // - QueryClient
  // For now, we'll use the basic render
  return render(ui, options);
};

// Security testing utilities
export const securityTestCases = {
  sqlInjection: [
    "'; DROP TABLE users; --",
    "' OR '1'='1",
    "admin'--",
    "' UNION SELECT * FROM users --",
  ],
  xssPayloads: [
    '<script>alert("xss")</script>',
    'javascript:alert("xss")',
    '<img src="x" onerror="alert(1)">',
    '"><script>alert("xss")</script>',
  ],
  regexInjection: [
    '.*',
    '(?=.*)',
    '(?!.*)',
    '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)[a-zA-Z\\d]{8,}$',
  ],
  pathTraversal: [
    '../../../etc/passwd',
    '..\\..\\..\\windows\\system32\\config\\sam',
    '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd',
  ],
};

// Performance testing utilities
export const performanceHelpers = {
  measureExecutionTime: async (fn: () => Promise<any>) => {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    return {
      result,
      executionTime: end - start,
    };
  },

  expectPerformance: (executionTime: number, maxTime: number) => {
    expect(executionTime).toBeLessThan(maxTime);
  },
};

// Accessibility testing utilities
export const accessibilityHelpers = {
  expectAriaLabel: (element: HTMLElement, expectedLabel: string) => {
    expect(element).toHaveAttribute('aria-label', expectedLabel);
  },

  expectKeyboardNavigation: (element: HTMLElement) => {
    expect(element).toHaveAttribute('tabindex');
    expect(element.tabIndex).toBeGreaterThanOrEqual(0);
  },

  expectScreenReaderText: (element: HTMLElement) => {
    const srText = element.querySelector('.sr-only');
    expect(srText).toBeInTheDocument();
  },
};

// Error testing utilities
export const errorTestHelpers = {
  expectErrorHandling: async (
    fn: () => Promise<any>,
    expectedError: string
  ) => {
    await expect(fn()).rejects.toThrow(expectedError);
  },

  expectGracefulFailure: async (fn: () => Promise<any>) => {
    try {
      await fn();
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBeDefined();
    }
  },
};

// Rate limiting test utilities
export const rateLimitingHelpers = {
  simulateRateLimitExceeded: () => ({
    success: false,
    retryAfter: 60000,
    remaining: 0,
  }),

  simulateRateLimitOk: () => ({
    success: true,
    remaining: 10,
  }),
};

// Export all utilities
export default {
  mockUser,
  mockCompany,
  mockDepartment,
  mockSurvey,
  mockSurveyResponse,
  createMockRequest,
  createMockResponse,
  mockDatabase,
  renderWithProviders,
  securityTestCases,
  performanceHelpers,
  accessibilityHelpers,
  errorTestHelpers,
  rateLimitingHelpers,
};
