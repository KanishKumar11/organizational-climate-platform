import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import {
  DataScopingService,
  createScopeContext,
  ScopeContext,
} from '../lib/data-scoping';

export interface ScopedRequest extends NextRequest {
  scopeContext?: ScopeContext;
  scopingService?: DataScopingService;
}

export async function withDataScopingMiddleware(
  request: ScopedRequest,
  resourceType: string,
  operation: 'read' | 'write' | 'delete' = 'read'
) {
  try {
    // Get user token from request
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token || !token.user) {
      return NextResponse.json(
        { error: 'Unauthorized - No valid session' },
        { status: 401 }
      );
    }

    // Create scope context from user token
    const scopeContext = createScopeContext(
      token.user as Record<string, unknown>
    );

    // Get scoping service instance
    const scopingService = DataScopingService.getInstance();

    // Validate access for the resource type and operation
    const validation = await scopingService.validateAccess(
      scopeContext,
      resourceType,
      operation
    );

    if (!validation.allowed) {
      return NextResponse.json(
        {
          error: 'Access denied',
          reason: validation.reason,
          resource_type: resourceType,
          operation,
        },
        { status: 403 }
      );
    }

    // Attach scope context and service to request for use in handlers
    request.scopeContext = scopeContext;
    request.scopingService = scopingService;

    return null; // Continue to handler
  } catch (error) {
    console.error('Data scoping middleware error:', error);
    return NextResponse.json(
      { error: 'Internal server error in data scoping' },
      { status: 500 }
    );
  }
}

// Helper function to apply scoping to MongoDB queries in API handlers
export async function applyScopingToQuery(
  request: ScopedRequest,
  resourceType: string,
  baseQuery: Record<string, unknown> = {},
  operation: 'read' | 'write' | 'delete' = 'read'
): Promise<{
  query: Record<string, unknown>;
  allowed: boolean;
  reason?: string;
}> {
  if (!request.scopeContext || !request.scopingService) {
    throw new Error('Scoping middleware not applied to request');
  }

  return await request.scopingService.applyScopeToQuery(
    request.scopeContext,
    resourceType,
    baseQuery,
    operation
  );
}

// Decorator function for API route handlers
export function withScoping(
  resourceType: string,
  operation: 'read' | 'write' | 'delete' = 'read'
) {
  return function (
    target: unknown,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (
      request: ScopedRequest,
      ...args: unknown[]
    ) {
      // Apply scoping middleware
      const middlewareResult = await withDataScopingMiddleware(
        request,
        resourceType,
        operation
      );

      if (middlewareResult) {
        return middlewareResult; // Return error response
      }

      // Call original handler
      return await originalMethod.call(this, request, ...args);
    };

    return descriptor;
  };
}

// Higher-order function for wrapping API handlers
export function createScopedHandler(
  resourceType: string,
  operation: 'read' | 'write' | 'delete' = 'read'
) {
  return function (
    handler: (
      request: ScopedRequest,
      context?: unknown
    ) => Promise<NextResponse>
  ) {
    return async function (
      request: ScopedRequest,
      context?: unknown
    ): Promise<NextResponse> {
      // Apply scoping middleware
      const middlewareResult = await withDataScopingMiddleware(
        request,
        resourceType,
        operation
      );

      if (middlewareResult) {
        return middlewareResult; // Return error response
      }

      // Call original handler with scoped request
      return await handler(request, context);
    };
  };
}

// Utility function to check if user has access to specific resource
export async function checkResourceAccess(
  request: ScopedRequest,
  resourceType: string,
  resourceId: string,
  operation: 'read' | 'write' | 'delete' = 'read'
): Promise<{ allowed: boolean; reason?: string }> {
  if (!request.scopeContext || !request.scopingService) {
    return { allowed: false, reason: 'Scoping middleware not applied' };
  }

  const validation = await request.scopingService.validateAccess(
    request.scopeContext,
    resourceType,
    operation
  );

  if (!validation.allowed) {
    return { allowed: false, reason: validation.reason };
  }

  // Additional check for specific resource ID if needed
  const scopeFilter = request.scopingService.buildMongoFilter(
    validation.filters
  );

  // This would typically involve a database query to check if the specific resource
  // is accessible under the current scope. For now, we'll assume it's allowed
  // if the general resource type access is granted.

  return { allowed: true };
}

export default {
  withDataScopingMiddleware,
  applyScopingToQuery,
  withScoping,
  createScopedHandler,
  checkResourceAccess,
};


