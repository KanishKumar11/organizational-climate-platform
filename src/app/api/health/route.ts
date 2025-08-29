import { NextRequest, NextResponse } from 'next/server';
import { withApiMiddleware, createApiResponse } from '@/lib/api-middleware';
import connectDB from '@/lib/mongodb';

async function healthHandler(req: NextRequest) {
  try {
    // Test database connection
    await connectDB();

    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      environment: process.env.NODE_ENV,
    };

    return NextResponse.json(createApiResponse(true, healthData));
  } catch (error) {
    const healthData = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      environment: process.env.NODE_ENV,
      error: error instanceof Error ? error.message : 'Unknown error',
    };

    return NextResponse.json(
      createApiResponse(false, healthData, 'Health check failed'),
      { status: 503 }
    );
  }
}

export const GET = withApiMiddleware(healthHandler);
