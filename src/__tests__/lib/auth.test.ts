/**
 * Comprehensive unit tests for authentication system
 * Tests NextAuth configuration, session management, and authorization
 */

import { authOptions } from '@/lib/auth';
import { mockUser, mockDatabase } from '../utils/test-helpers';

// Mock NextAuth
jest.mock('next-auth', () => ({
  default: jest.fn(),
  getServerSession: jest.fn(),
}));

// Mock NextAuth providers
jest.mock('next-auth/providers/credentials', () => ({
  default: jest.fn(() => ({
    id: 'credentials',
    name: 'Credentials',
    type: 'credentials',
    credentials: {},
    authorize: jest.fn(),
  })),
}));

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

// Mock database models
jest.mock('@/models/User', () => ({
  default: {
    findOne: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
  },
}));

jest.mock('@/models/Company', () => ({
  default: {
    findById: jest.fn(),
  },
}));

import bcrypt from 'bcryptjs';
import User from '@/models/User';
import Company from '@/models/Company';

describe('Authentication System', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDatabase.clear();
    mockDatabase.seed();
  });

  describe('AuthOptions Configuration', () => {
    test('should have correct providers configured', () => {
      expect(authOptions.providers).toBeDefined();
      expect(authOptions.providers).toHaveLength(1); // Credentials provider
    });

    test('should have correct session configuration', () => {
      expect(authOptions.session).toBeDefined();
      expect(authOptions.session?.strategy).toBe('jwt');
      expect(authOptions.session?.maxAge).toBe(30 * 24 * 60 * 60); // 30 days
    });

    test('should have JWT configuration', () => {
      expect(authOptions.jwt).toBeDefined();
      expect(authOptions.jwt?.maxAge).toBe(30 * 24 * 60 * 60); // 30 days
    });

    test('should have custom pages configured', () => {
      expect(authOptions.pages).toBeDefined();
      expect(authOptions.pages?.signIn).toBe('/auth/signin');
      expect(authOptions.pages?.error).toBe('/auth/error');
    });
  });

  describe('Credentials Provider', () => {
    const credentialsProvider = authOptions.providers[0];

    test('should authenticate valid user credentials', async () => {
      const mockUserData = mockUser({
        email: 'test@example.com',
        password: 'hashedPassword123',
        is_active: true,
      });

      (User.findOne as jest.Mock).mockResolvedValue(mockUserData);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (Company.findById as jest.Mock).mockResolvedValue({
        _id: 'test-company-id',
        name: 'Test Company',
        is_active: true,
      });

      const credentials = {
        email: 'test@example.com',
        password: 'password123',
      };

      const result = await credentialsProvider.authorize(credentials, {} as any);

      expect(result).toBeDefined();
      expect(result?.email).toBe('test@example.com');
      expect(result?.role).toBe('company_admin');
      expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedPassword123');
    });

    test('should reject invalid email', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);

      const credentials = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      const result = await credentialsProvider.authorize(credentials, {} as any);

      expect(result).toBeNull();
      expect(User.findOne).toHaveBeenCalledWith({ email: 'nonexistent@example.com' });
    });

    test('should reject invalid password', async () => {
      const mockUserData = mockUser({
        email: 'test@example.com',
        password: 'hashedPassword123',
      });

      (User.findOne as jest.Mock).mockResolvedValue(mockUserData);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const credentials = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      const result = await credentialsProvider.authorize(credentials, {} as any);

      expect(result).toBeNull();
      expect(bcrypt.compare).toHaveBeenCalledWith('wrongpassword', 'hashedPassword123');
    });

    test('should reject inactive user', async () => {
      const mockUserData = mockUser({
        email: 'test@example.com',
        password: 'hashedPassword123',
        is_active: false,
      });

      (User.findOne as jest.Mock).mockResolvedValue(mockUserData);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const credentials = {
        email: 'test@example.com',
        password: 'password123',
      };

      const result = await credentialsProvider.authorize(credentials, {} as any);

      expect(result).toBeNull();
    });

    test('should reject user from inactive company', async () => {
      const mockUserData = mockUser({
        email: 'test@example.com',
        password: 'hashedPassword123',
        is_active: true,
      });

      (User.findOne as jest.Mock).mockResolvedValue(mockUserData);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (Company.findById as jest.Mock).mockResolvedValue({
        _id: 'test-company-id',
        name: 'Test Company',
        is_active: false,
      });

      const credentials = {
        email: 'test@example.com',
        password: 'password123',
      };

      const result = await credentialsProvider.authorize(credentials, {} as any);

      expect(result).toBeNull();
    });

    test('should handle missing credentials', async () => {
      const result1 = await credentialsProvider.authorize({}, {} as any);
      expect(result1).toBeNull();

      const result2 = await credentialsProvider.authorize({ email: 'test@example.com' }, {} as any);
      expect(result2).toBeNull();

      const result3 = await credentialsProvider.authorize({ password: 'password123' }, {} as any);
      expect(result3).toBeNull();
    });

    test('should handle database errors gracefully', async () => {
      (User.findOne as jest.Mock).mockRejectedValue(new Error('Database error'));

      const credentials = {
        email: 'test@example.com',
        password: 'password123',
      };

      const result = await credentialsProvider.authorize(credentials, {} as any);

      expect(result).toBeNull();
    });
  });

  describe('JWT Callbacks', () => {
    test('should include user data in JWT token', async () => {
      const user = mockUser();
      const token = {};

      const result = await authOptions.callbacks?.jwt?.({ token, user } as any);

      expect(result).toEqual({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        company_id: user.company_id,
        department_id: user.department_id,
      });
    });

    test('should preserve existing token data', async () => {
      const existingToken = {
        id: 'existing-id',
        email: 'existing@example.com',
        role: 'existing-role',
      };

      const result = await authOptions.callbacks?.jwt?.({ token: existingToken } as any);

      expect(result).toEqual(existingToken);
    });

    test('should handle token refresh', async () => {
      const user = mockUser({ id: 'updated-id' });
      const existingToken = {
        id: 'old-id',
        email: 'old@example.com',
      };

      const result = await authOptions.callbacks?.jwt?.({ token: existingToken, user } as any);

      expect(result?.id).toBe('updated-id');
      expect(result?.email).toBe(user.email);
    });
  });

  describe('Session Callbacks', () => {
    test('should create session from JWT token', async () => {
      const token = {
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
        role: 'company_admin',
        company_id: 'test-company-id',
        department_id: 'test-department-id',
      };

      const session = { expires: '2024-12-31' };

      const result = await authOptions.callbacks?.session?.({ session, token } as any);

      expect(result?.user).toEqual({
        id: token.id,
        email: token.email,
        name: token.name,
        role: token.role,
        company_id: token.company_id,
        department_id: token.department_id,
      });
      expect(result?.expires).toBe('2024-12-31');
    });

    test('should handle missing token data', async () => {
      const token = {};
      const session = { expires: '2024-12-31' };

      const result = await authOptions.callbacks?.session?.({ session, token } as any);

      expect(result?.user).toEqual({
        id: undefined,
        email: undefined,
        name: undefined,
        role: undefined,
        company_id: undefined,
        department_id: undefined,
      });
    });
  });

  describe('Authorization Callbacks', () => {
    test('should authorize valid user', async () => {
      const user = mockUser();

      const result = await authOptions.callbacks?.signIn?.({ user } as any);

      expect(result).toBe(true);
    });

    test('should block inactive user', async () => {
      const user = mockUser({ is_active: false });

      const result = await authOptions.callbacks?.signIn?.({ user } as any);

      expect(result).toBe(false);
    });

    test('should handle missing user', async () => {
      const result = await authOptions.callbacks?.signIn?.({} as any);

      expect(result).toBe(false);
    });
  });

  describe('Security Features', () => {
    test('should have secure JWT secret', () => {
      expect(authOptions.secret).toBeDefined();
      expect(typeof authOptions.secret).toBe('string');
    });

    test('should have secure session configuration', () => {
      expect(authOptions.session?.strategy).toBe('jwt');
      expect(authOptions.session?.maxAge).toBeGreaterThan(0);
      expect(authOptions.session?.updateAge).toBeGreaterThan(0);
    });

    test('should have CSRF protection enabled', () => {
      expect(authOptions.useSecureCookies).toBe(process.env.NODE_ENV === 'production');
    });
  });

  describe('Role-Based Access Control', () => {
    test('should correctly identify super admin', async () => {
      const superAdminUser = mockUser({ role: 'super_admin' });
      const token = {};

      const result = await authOptions.callbacks?.jwt?.({ token, user: superAdminUser } as any);

      expect(result?.role).toBe('super_admin');
    });

    test('should correctly identify company admin', async () => {
      const companyAdminUser = mockUser({ role: 'company_admin' });
      const token = {};

      const result = await authOptions.callbacks?.jwt?.({ token, user: companyAdminUser } as any);

      expect(result?.role).toBe('company_admin');
    });

    test('should correctly identify department admin', async () => {
      const deptAdminUser = mockUser({ role: 'department_admin' });
      const token = {};

      const result = await authOptions.callbacks?.jwt?.({ token, user: deptAdminUser } as any);

      expect(result?.role).toBe('department_admin');
    });

    test('should correctly identify employee', async () => {
      const employeeUser = mockUser({ role: 'employee' });
      const token = {};

      const result = await authOptions.callbacks?.jwt?.({ token, user: employeeUser } as any);

      expect(result?.role).toBe('employee');
    });
  });

  describe('Error Handling', () => {
    test('should handle authentication errors gracefully', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'password123',
      };

      (User.findOne as jest.Mock).mockRejectedValue(new Error('Database connection failed'));

      const result = await credentialsProvider.authorize(credentials, {} as any);

      expect(result).toBeNull();
    });

    test('should handle JWT callback errors', async () => {
      const user = null;
      const token = {};

      const result = await authOptions.callbacks?.jwt?.({ token, user } as any);

      expect(result).toBeDefined();
    });

    test('should handle session callback errors', async () => {
      const token = null;
      const session = { expires: '2024-12-31' };

      const result = await authOptions.callbacks?.session?.({ session, token } as any);

      expect(result).toBeDefined();
    });
  });
});
