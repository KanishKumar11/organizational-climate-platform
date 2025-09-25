import '@testing-library/jest-dom';

// Add global polyfills for Node.js environment
if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => '/test-path',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock NextAuth
jest.mock('next-auth/react', () => ({
  useSession: () => ({
    data: {
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
        role: 'company_admin',
        company_id: 'test-company-id',
      },
    },
    status: 'authenticated',
  }),
  signIn: jest.fn(),
  signOut: jest.fn(),
  getSession: jest.fn(),
}));

// Mock MongoDB connection
jest.mock('./src/lib/mongodb', () => ({
  connectDB: jest.fn().mockResolvedValue(true),
  default: jest.fn().mockResolvedValue(true),
}));

// Mock Next.js Web API globals
global.Request = class MockRequest {
  constructor(input, init = {}) {
    this.url = typeof input === 'string' ? input : input.url;
    this.method = init.method || 'GET';
    this.headers = new Map(Object.entries(init.headers || {}));
    this.body = init.body;
  }

  async json() {
    return JSON.parse(this.body || '{}');
  }

  async text() {
    return this.body || '';
  }
};

global.Response = class MockResponse {
  constructor(body, init = {}) {
    this.body = body;
    this.status = init.status || 200;
    this.statusText = init.statusText || 'OK';
    this.headers = new Map(Object.entries(init.headers || {}));
    this.ok = this.status >= 200 && this.status < 300;
  }

  async json() {
    return typeof this.body === 'string' ? JSON.parse(this.body) : this.body;
  }

  async text() {
    return typeof this.body === 'string' ? this.body : JSON.stringify(this.body);
  }

  static json(data, init = {}) {
    return new Response(JSON.stringify(data), {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...init.headers,
      },
    });
  }
};

// Mock NextAuth providers
jest.mock('next-auth/providers/credentials', () => {
  return {
    __esModule: true,
    default: jest.fn(() => ({
      id: 'credentials',
      name: 'Credentials',
      type: 'credentials',
      credentials: {},
      authorize: jest.fn(),
    })),
  };
});

// Mock environment variables
process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
process.env.NEXTAUTH_SECRET = 'test-secret';
process.env.NEXTAUTH_URL = 'http://localhost:3000';
process.env.NODE_ENV = 'test';
process.env.SUPPRESS_JEST_WARNINGS = 'true';

// Global test utilities
global.mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
  role: 'company_admin',
  company_id: 'test-company-id',
};

global.mockRequest = (overrides = {}) => ({
  method: 'GET',
  url: 'http://localhost:3000/api/test',
  headers: new Headers({
    'content-type': 'application/json',
    ...overrides.headers,
  }),
  json: jest.fn().mockResolvedValue({}),
  ...overrides,
});

global.mockResponse = () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    end: jest.fn().mockReturnThis(),
  };
  return res;
};