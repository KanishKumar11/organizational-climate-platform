import { NextRequest, NextResponse } from 'next/server';
import connectDB from './mongodb';
import { validateEnv } from './env';
import { UserRole, IUserBase } from '../types/user';
import { IUser } from '../models/User';
import { hasFeaturePermission, ROLE_PERMISSIONS } from './permissions';

// API Response wrapper for consistent error handling
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Create standardized API response
export function createApiResponse<T>(
  success: boolean,
  data?: T,
  error?: string,
  message?: string
): ApiResponse<T> {
  return {
    success,
    data,
    error,
    message,
  };
}

// API Error class for consistent error handling
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Middleware wrapper for API routes
export function withApiMiddleware(
  handler: (req: NextRequest) => Promise<NextResponse>
): (req: NextRequest) => Promise<NextResponse>;
export function withApiMiddleware(
  handler: (req: NextRequest, context: { params: any }) => Promise<NextResponse>
): (req: NextRequest, context: { params: any }) => Promise<NextResponse>;
export function withApiMiddleware(
  handler: (
    req: NextRequest,
    context?: { params: any }
  ) => Promise<NextResponse>
) {
  return async (req: NextRequest, context?: { params: any }) => {
    try {
      // Validate environment variables
      validateEnv();

      // Connect to database
      await connectDB();

      // Call the actual handler
      return await handler(req, context);
    } catch (error) {
      console.error('API Error:', error);

      if (error instanceof ApiError) {
        return NextResponse.json(
          createApiResponse(false, null, error.message),
          { status: error.statusCode }
        );
      }

      // Handle unexpected errors
      return NextResponse.json(
        createApiResponse(false, null, 'Internal server error'),
        { status: 500 }
      );
    }
  };
}

// CORS headers for API responses
export function addCorsHeaders(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, OPTIONS'
  );
  response.headers.set(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization'
  );
  return response;
}

// Handle OPTIONS requests for CORS
export function handleOptions() {
  const response = new NextResponse(null, { status: 200 });
  return addCorsHeaders(response);
}

// User context interface for authenticated requests
export interface UserContext {
  user: IUser;
  isAuthenticated: boolean;
}

// Extended request interface with user context
export interface AuthenticatedRequest extends NextRequest {
  user?: IUser;
}

// Get current user from NextAuth session
async function getCurrentUser(req: NextRequest): Promise<IUser | null> {
  try {
    // Try to get session from NextAuth
    const { getServerSession } = await import('next-auth');
    const { authOptions } = await import('./auth');

    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return null;
    }

    // Fetch full user data from database
    const User = (await import('../models/User')).default;
    const user = await (User as any).findOne({
      email: session.user.email,
      is_active: true,
    });

    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

// Authentication middleware
export function withAuth(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
): (req: NextRequest) => Promise<NextResponse>;
export function withAuth(
  handler: (
    req: AuthenticatedRequest,
    context: { params: any }
  ) => Promise<NextResponse>
): (req: NextRequest, context: { params: any }) => Promise<NextResponse>;
export function withAuth(
  handler: (
    req: AuthenticatedRequest,
    context?: { params: any }
  ) => Promise<NextResponse>
) {
  return withApiMiddleware(
    async (req: NextRequest, context?: { params: any }) => {
      const user = await getCurrentUser(req);

      if (!user) {
        return NextResponse.json(
          createApiResponse(false, null, 'Authentication required'),
          { status: 401 }
        );
      }

      // Add user to request context
      const authenticatedReq = req as AuthenticatedRequest;
      authenticatedReq.user = user;

      return await handler(authenticatedReq, context);
    }
  );
}

// Role-based authorization middleware
export function withRoleAuth(
  requiredRole: UserRole,
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
): (req: NextRequest) => Promise<NextResponse>;
export function withRoleAuth(
  requiredRole: UserRole,
  handler: (
    req: AuthenticatedRequest,
    context: { params: any }
  ) => Promise<NextResponse>
): (req: NextRequest, context: { params: any }) => Promise<NextResponse>;
export function withRoleAuth(
  requiredRole: UserRole,
  handler: (
    req: AuthenticatedRequest,
    context?: { params: any }
  ) => Promise<NextResponse>
) {
  return withAuth(
    async (req: AuthenticatedRequest, context?: { params: any }) => {
      const user = req.user!; // User is guaranteed to exist due to withAuth

      if (!user.hasPermission(requiredRole)) {
        return NextResponse.json(
          createApiResponse(false, null, 'Insufficient permissions'),
          { status: 403 }
        );
      }

      return await handler(req, context);
    }
  );
}

// Feature-based authorization middleware
export function withFeatureAuth(
  feature: keyof typeof ROLE_PERMISSIONS,
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
): (req: NextRequest) => Promise<NextResponse>;
export function withFeatureAuth(
  feature: keyof typeof ROLE_PERMISSIONS,
  handler: (
    req: AuthenticatedRequest,
    context: { params: any }
  ) => Promise<NextResponse>
): (req: NextRequest, context: { params: any }) => Promise<NextResponse>;
export function withFeatureAuth(
  feature: keyof typeof ROLE_PERMISSIONS,
  handler: (
    req: AuthenticatedRequest,
    context?: { params: any }
  ) => Promise<NextResponse>
) {
  return withAuth(
    async (req: AuthenticatedRequest, context?: { params: any }) => {
      const user = req.user!; // User is guaranteed to exist due to withAuth

      if (!hasFeaturePermission(user.role, feature)) {
        return NextResponse.json(
          createApiResponse(
            false,
            null,
            `Access denied: ${feature} permission required`
          ),
          { status: 403 }
        );
      }

      return await handler(req, context);
    }
  );
}

// Company access authorization middleware
export function withCompanyAuth(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
) {
  return withAuth(async (req: AuthenticatedRequest) => {
    const user = req.user!;
    const url = new URL(req.url);
    const companyId =
      url.searchParams.get('company_id') || req.headers.get('x-company-id');

    if (companyId && !user.canAccessCompany(companyId)) {
      return NextResponse.json(
        createApiResponse(
          false,
          null,
          'Access denied: Cannot access this company'
        ),
        { status: 403 }
      );
    }

    return await handler(req);
  });
}

// Department access authorization middleware
export function withDepartmentAuth(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
) {
  return withAuth(async (req: AuthenticatedRequest) => {
    const user = req.user!;
    const url = new URL(req.url);
    const departmentId =
      url.searchParams.get('department_id') ||
      req.headers.get('x-department-id');

    if (departmentId && !user.canAccessDepartment(departmentId)) {
      return NextResponse.json(
        createApiResponse(
          false,
          null,
          'Access denied: Cannot access this department'
        ),
        { status: 403 }
      );
    }

    return await handler(req);
  });
}

// Combined middleware for common authorization patterns
export function withSurveyAuth(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
) {
  return withFeatureAuth('CREATE_SURVEYS', withCompanyAuth(handler));
}

export function withMicroclimateAuth(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
) {
  return withFeatureAuth('LAUNCH_MICROCLIMATES', withDepartmentAuth(handler));
}

export function withActionPlanAuth(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
) {
  return withFeatureAuth('CREATE_ACTION_PLANS', withDepartmentAuth(handler));
}

export function withAnalyticsAuth(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
) {
  return withFeatureAuth('VIEW_COMPANY_ANALYTICS', withCompanyAuth(handler));
}

// Validation helpers
export function validateRequestBody<T>(
  body: any,
  requiredFields: (keyof T)[]
): { isValid: boolean; missingFields: string[] } {
  const missingFields: string[] = [];

  for (const field of requiredFields) {
    if (!body || body[field] === undefined || body[field] === null) {
      missingFields.push(String(field));
    }
  }

  return {
    isValid: missingFields.length === 0,
    missingFields,
  };
}

// Rate limiting helper (basic implementation)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  identifier: string,
  maxRequests: number = 100,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const windowStart = now - windowMs;

  // Clean up old entries
  for (const [key, value] of rateLimitMap.entries()) {
    if (value.resetTime < windowStart) {
      rateLimitMap.delete(key);
    }
  }

  const current = rateLimitMap.get(identifier);

  if (!current || current.resetTime < windowStart) {
    // New window or first request
    rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs });
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetTime: now + windowMs,
    };
  }

  if (current.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetTime: current.resetTime };
  }

  current.count++;
  return {
    allowed: true,
    remaining: maxRequests - current.count,
    resetTime: current.resetTime,
  };
}

// Rate limiting middleware
export function withRateLimit(
  maxRequests: number = 100,
  windowMs: number = 15 * 60 * 1000
) {
  return function (
    handler: (
      req: NextRequest,
      context?: { params: any }
    ) => Promise<NextResponse>
  ) {
    return withApiMiddleware(
      async (req: NextRequest, context?: { params: any }) => {
        const identifier =
          req.headers.get('x-forwarded-for') ||
          req.headers.get('x-real-ip') ||
          'unknown';
        const rateLimit = checkRateLimit(identifier, maxRequests, windowMs);

        if (!rateLimit.allowed) {
          return NextResponse.json(
            createApiResponse(false, null, 'Rate limit exceeded'),
            {
              status: 429,
              headers: {
                'X-RateLimit-Limit': maxRequests.toString(),
                'X-RateLimit-Remaining': '0',
                'X-RateLimit-Reset': new Date(
                  rateLimit.resetTime
                ).toISOString(),
              },
            }
          );
        }

        const response = await handler(req, context);

        // Add rate limit headers to successful responses
        response.headers.set('X-RateLimit-Limit', maxRequests.toString());
        response.headers.set(
          'X-RateLimit-Remaining',
          rateLimit.remaining.toString()
        );
        response.headers.set(
          'X-RateLimit-Reset',
          new Date(rateLimit.resetTime).toISOString()
        );

        return response;
      }
    );
  };
}
