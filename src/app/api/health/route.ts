import { NextRequest, NextResponse } from 'next/server';
import { withApiMiddleware, createApiResponse } from '@/lib/api-middleware';
import {
  HealthChecker,
  MetricsCollector,
  PerformanceMonitor,
} from '@/lib/production-monitoring';
import connectDB from '@/lib/mongodb';

async function healthHandler(req: NextRequest) {
  try {
    // Register comprehensive health checks
    HealthChecker.registerCheck('database', async () => {
      try {
        await connectDB();
        return { status: 'pass', message: 'Database connection successful' };
      } catch (error) {
        return {
          status: 'fail',
          message: `Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
      }
    });

    HealthChecker.registerCheck('environment', async () => {
      const requiredEnvVars = [
        'MONGODB_URI',
        'NEXTAUTH_SECRET',
        'NEXTAUTH_URL',
      ];

      const missing = requiredEnvVars.filter((envVar) => !process.env[envVar]);

      if (missing.length > 0) {
        return {
          status: 'fail',
          message: `Missing environment variables: ${missing.join(', ')}`,
        };
      }

      return {
        status: 'pass',
        message: 'All required environment variables present',
      };
    });

    HealthChecker.registerCheck('memory', async () => {
      if (typeof process !== 'undefined') {
        const usage = process.memoryUsage();
        const heapUsedMB = usage.heapUsed / 1024 / 1024;

        if (heapUsedMB > 500) {
          return {
            status: 'warn',
            message: `High memory usage: ${heapUsedMB.toFixed(2)}MB`,
          };
        }

        return {
          status: 'pass',
          message: `Memory usage: ${heapUsedMB.toFixed(2)}MB`,
        };
      }

      return { status: 'pass', message: 'Memory check not available' };
    });

    // Run comprehensive health checks
    const healthResult = await HealthChecker.runHealthChecks();

    // Add performance metrics
    const metrics = MetricsCollector.getMetrics();
    const performanceMetrics = PerformanceMonitor.getAllMetrics();

    const enhancedHealthData = {
      ...healthResult,
      environment: process.env.NODE_ENV,
      metrics,
      performance: performanceMetrics,
    };

    // Determine HTTP status based on health
    let httpStatus = 200;
    if (healthResult.status === 'degraded') {
      httpStatus = 200; // Still operational
    } else if (healthResult.status === 'unhealthy') {
      httpStatus = 503; // Service unavailable
    }

    return NextResponse.json(createApiResponse(true, enhancedHealthData), {
      status: httpStatus,
    });
  } catch (error) {
    const healthData = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'unknown',
      environment: process.env.NODE_ENV,
      error:
        error instanceof Error ? error.message : 'Health check system failure',
    };

    return NextResponse.json(
      createApiResponse(false, healthData, 'Health check failed'),
      { status: 503 }
    );
  }
}

export const GET = withApiMiddleware(healthHandler);
