import { NextRequest, NextResponse } from 'next/server';
import connectDB from './mongodb';
import { validateEnv } from './env';
import { UserRole, IUserBase } from '../types/user';
import { IUser } from '../models/User';
import { hasFeaturePermission, ROLE_PERMISSIONS } from './permissions';
import ErrorHandler, {
  DefaultRetryConfigs,
  DefaultFallbackConfigs,
} from './error-handling';

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

// Enhanced error handling middleware
export function withErrorHandling(
  handler: (
    req: AuthenticatedRequest,
    context?: { params: any }
  ) => Promise<NextResponse>
) {
  return async (req: NextRequest, context?: { params: any }) => {
    const errorHandler = ErrorHandler.getInstance();
    const requestId = generateRequestId();
    const authenticatedReq = req as AuthenticatedRequest;
    authenticatedReq.requestId = requestId;

    try {
      return await handler(authenticatedReq, context);
    } catch (error) {
      const errorContext = {
        user_id: authenticatedReq.user?._id.toString(),
        company_id: authenticatedReq.user?.company_id.toString(),
        request_id: requestId,
        url: req.url,
        method: req.method,
        user_agent: req.headers.get('user-agent') || '',
        ip_address:
          req.headers.get('x-forwarded-for') ||
          req.headers.get('x-real-ip') ||
          '',
        timestamp: new Date(),
      };

      // Determine error type and status code
      let errorType:
        | 'validation'
        | 'permission'
        | 'network'
        | 'database'
        | 'ai_service'
        | 'system'
        | 'business_logic' = 'system';
      let statusCode = 500;

      if (error instanceof Error) {
        if (
          error.message.includes('validation') ||
          error.message.includes('invalid')
        ) {
          errorType = 'validation';
          statusCode = 400;
        } else if (
          error.message.includes('permission') ||
          error.message.includes('unauthorized') ||
          error.message.includes('forbidden')
        ) {
          errorType = 'permission';
          statusCode = 403;
        } else if (error.message.includes('not found')) {
          errorType = 'business_logic';
          statusCode = 404;
        } else if (
          error.message.includes('database') ||
          error.message.includes('connection')
        ) {
          errorType = 'database';
          statusCode = 503;
        } else if (
          error.message.includes('AI') ||
          error.message.includes('analysis')
        ) {
          errorType = 'ai_service';
          statusCode = 503;
        }
      }

      return errorHandler.createApiErrorResponse(
        error as Error,
        errorContext,
        errorType,
        statusCode
      );
    }
  };
}

// Middleware wrapper for API routes with enhanced error handling
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
  return withErrorHandling(
    async (req: AuthenticatedRequest, context?: { params: any }) => {
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

        // Re-throw to be handled by withErrorHandling
        throw error;
      }
    }
  );
}

// Retry middleware
export function withRetry(
  handler: (
    req: AuthenticatedRequest,
    context?: { params: any }
  ) => Promise<NextResponse>,
  retryConfig = DefaultRetryConfigs.network
) {
  return async (req: AuthenticatedRequest, context?: { params: any }) => {
    const errorHandler = ErrorHandler.getInstance();
    const errorContext = {
      user_id: req.user?._id.toString(),
      company_id: req.user?.company_id.toString(),
      request_id: req.requestId || generateRequestId(),
      url: req.url,
      method: req.method,
      user_agent: req.headers.get('user-agent') || '',
      ip_address:
        req.headers.get('x-forwarded-for') ||
        req.headers.get('x-real-ip') ||
        '',
      timestamp: new Date(),
    };

    return await errorHandler.withRetry(
      () => handler(req, context),
      retryConfig,
      errorContext
    );
  };
}

// Fallback middleware
export function withFallback(
  handler: (
    req: AuthenticatedRequest,
    context?: { params: any }
  ) => Promise<NextResponse>,
  fallbackConfig = DefaultFallbackConfigs.dashboard
) {
  return async (req: AuthenticatedRequest, context?: { params: any }) => {
    const errorHandler = ErrorHandler.getInstance();
    const errorContext = {
      user_id: req.user?._id.toString(),
      company_id: req.user?.company_id.toString(),
      request_id: req.requestId || generateRequestId(),
      url: req.url,
      method: req.method,
      user_agent: req.headers.get('user-agent') || '',
      ip_address:
        req.headers.get('x-forwarded-for') ||
        req.headers.get('x-real-ip') ||
        '',
      timestamp: new Date(),
    };

    try {
      return await handler(req, context);
    } catch (error) {
      const fallbackResult = await errorHandler.withFallback(
        () => handler(req, context),
        fallbackConfig,
        errorContext
      );

      // Return fallback response
      return NextResponse.json(
        createApiResponse(
          true,
          fallbackResult,
          undefined,
          fallbackConfig.fallback_data?.message || 'Service temporarily degraded'
        ),
        { status: 200 }
      );
    }
  };
}

// Circuit breaker middleware
export function withCircuitBreaker(
  handler: (
    req: AuthenticatedRequest,
    context?: { params: any }
  ) => Promise<NextResponse>,
  serviceName: string
) {
  return async (req: AuthenticatedRequest, context?: { params: any }) => {
    const errorHandler = ErrorHandler.getInstance();
    const errorContext = {
      user_id: req.user?._id.toString(),
      company_id: req.user?.company_id.toString(),
      request_id: req.requestId || generateRequestId(),
      url: req.url,
      method: req.method,
      user_agent: req.headers.get('user-agent') || '',
      ip_address:
        req.headers.get('x-forwarded-for') ||
        req.headers.get('x-real-ip') ||
        '',
      timestamp: new Date(),
    };

    if (errorHandler.isCircuitBreakerOpen(serviceName)) {
      return NextResponse.json(
          createApiResponse(
            false,
            null,
            undefined,
            `Service ${serviceName} is temporarily unavailable`
          ),
          { status: 503 }
        );
    }

    return await errorHandler.executeWithCircuitBreaker(
      serviceName,
      () => handler(req, context),
      errorContext
    );
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
  requestId?: string;
}

// Generate unique request ID for tracking
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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

// Enhanced authentication middleware with error handling
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
      try {
        const user = await getCurrentUser(req);

        if (!user) {
          throw new Error('Authentication required');
        }

        // Add user to request context
        const authenticatedReq = req as AuthenticatedRequest;
        authenticatedReq.user = user;

        return await handler(authenticatedReq, context);
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === 'Authentication required') {
            return NextResponse.json(
              createApiResponse(false, null, 'Authentication required'),
              { status: 401 }
            );
          }
        }
        throw error; // Re-throw to be handled by error middleware
      }
    }
  );
}

// Specialized middleware combinations with error handling
export const withAuthAndRetry = (
  handler: (
    req: AuthenticatedRequest,
    context?: { params: any }
  ) => Promise<NextResponse>,
  retryConfig = DefaultRetryConfigs.database
) => withAuth(withRetry(handler, retryConfig));

export const withAuthAndFallback = (
  handler: (
    req: AuthenticatedRequest,
    context?: { params: any }
  ) => Promise<NextResponse>,
  fallbackConfig = DefaultFallbackConfigs.dashboard
) => withAuth(withFallback(handler, fallbackConfig));

export const withAuthAndCircuitBreaker = (
  handler: (
    req: AuthenticatedRequest,
    context?: { params: any }
  ) => Promise<NextResponse>,
  serviceName: string
) => withAuth(withCircuitBreaker(handler, serviceName));

export const withFullProtection = (
  handler: (
    req: AuthenticatedRequest,
    context?: { params: any }
  ) => Promise<NextResponse>,
  serviceName: string,
  retryConfig = DefaultRetryConfigs.network,
  fallbackConfig = DefaultFallbackConfigs.dashboard
) =>
  withAuth(
    withCircuitBreaker(
      withRetry(withFallback(handler, fallbackConfig), retryConfig),
      serviceName
    )
  );

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
