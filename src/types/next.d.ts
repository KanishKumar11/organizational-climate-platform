// Temporary fix for Next.js 15 route parameter types
declare module 'next/server' {
  interface NextRequest {
    customProps?: Record<string, unknown>;
  }
}

// Override the route parameter types to be more flexible
declare global {
  namespace NextJS {
    interface RouteParams {
      [key: string]: string | string[];
    }
  }
}

export {};
