import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

// Simple cache for middleware to avoid database calls on every request
let maintenanceCache: { enabled: boolean; loginEnabled: boolean; expiry: number } | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Simplified system settings check for middleware (Edge Runtime compatible)
async function getSystemStatus() {
  const now = Date.now();
  
  // Return cached values if still valid
  if (maintenanceCache && now < maintenanceCache.expiry) {
    return {
      maintenanceMode: maintenanceCache.enabled,
      loginEnabled: maintenanceCache.loginEnabled
    };
  }

  // Default values (fail-safe)
  const defaultValues = {
    maintenanceMode: false,
    loginEnabled: true
  };

  try {
    // For middleware, we'll use default safe values and update cache
    maintenanceCache = {
      enabled: false,
      loginEnabled: true,
      expiry: now + CACHE_DURATION
    };
    
    return defaultValues;
  } catch (error) {
    console.warn('Middleware system status check failed, using defaults:', error);
    return defaultValues;
  }
}

export default withAuth(
  async function middleware(req) {
    const token = req.nextauth.token;
    const isAuth = !!token;
    const isAuthPage = req.nextUrl.pathname.startsWith('/auth');
    const isApiRoute = req.nextUrl.pathname.startsWith('/api');
    const isPublicRoute =
      req.nextUrl.pathname === '/' ||
      req.nextUrl.pathname.startsWith('/public');
    const isMaintenancePage = req.nextUrl.pathname === '/maintenance';
    const isAdminRoute = req.nextUrl.pathname.startsWith('/admin') || req.nextUrl.pathname.startsWith('/api/admin');

    // Check system status
    const systemStatus = await getSystemStatus();
    
    // Check system maintenance mode first
    if (systemStatus.maintenanceMode && !isMaintenancePage && !isAdminRoute) {
      // Allow super admins to bypass maintenance mode
      if (!isAuth || token?.role !== 'super_admin') {
        return NextResponse.redirect(new URL('/maintenance', req.url));
      }
    }

    // Check if login is enabled (except for super admins and maintenance page)
    if (!isMaintenancePage && !isAdminRoute) {
      if (!systemStatus.loginEnabled && (!isAuth || token?.role !== 'super_admin')) {
        return NextResponse.redirect(new URL('/maintenance', req.url));
      }
    }

    // Allow API routes to handle their own auth
    if (isApiRoute) {
      return NextResponse.next();
    }

    // Allow public routes and maintenance page
    if (isPublicRoute || isMaintenancePage) {
      return NextResponse.next();
    }

    // Redirect to login if not authenticated and not on auth page
    if (!isAuth && !isAuthPage) {
      return NextResponse.redirect(new URL('/auth/signin', req.url));
    }

    // Redirect to dashboard if authenticated and on auth page
    if (isAuth && isAuthPage) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    // Check if user is active
    if (isAuth && !token?.isActive) {
      return NextResponse.redirect(new URL('/auth/inactive', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        // This callback is called for every request
        // Return true to allow the request, false to redirect to sign-in
        return true; // We handle auth logic in the middleware function above
      },
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth.js routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|public).*)',
  ],
};


