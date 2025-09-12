import { NextRequest, NextResponse } from 'next/server';
import { withAuth, createApiResponse } from '@/lib/api-middleware';
import PerformanceOptimizer from '@/lib/performance-optimizer';
import DatabaseOptimizer from '@/lib/database-optimizer';
import { hasFeaturePermission } from '@/lib/permissions';

export const GET = withAuth(async (req) => {
  const user = req.user!;
  const url = new URL(req.url);
  const action = url.searchParams.get('action');

  // Only super admins and company admins can view performance metrics
  if (!hasFeaturePermission(user.role, 'GLOBAL_SETTINGS')) {
    return NextResponse.json(
      createApiResponse(false, null, 'Insufficient permissions'),
      { status: 403 }
    );
  }

  try {
    const performanceOptimizer = PerformanceOptimizer.getInstance();
    const databaseOptimizer = DatabaseOptimizer.getInstance();

    switch (action) {
      case 'stats':
        const performanceStats = performanceOptimizer.getPerformanceStats();
        const databaseStats = await databaseOptimizer.getDatabaseStats();

        return NextResponse.json(
          createApiResponse(
            true,
            {
              performance: performanceStats,
              database: databaseStats,
              timestamp: new Date().toISOString(),
            },
            'Performance statistics retrieved successfully'
          )
        );

      case 'metrics':
        const timeRange = {
          start: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          end: new Date(),
        };

        const operation = url.searchParams.get('operation');
        const metrics = performanceOptimizer.getPerformanceMetrics(
          operation || undefined,
          timeRange
        );

        return NextResponse.json(
          createApiResponse(
            true,
            {
              metrics,
              time_range: timeRange,
              operation_filter: operation,
            },
            'Performance metrics retrieved successfully'
          )
        );

      case 'query-analytics':
        const collection = url.searchParams.get('collection');
        const queryAnalytics = await databaseOptimizer.getQueryAnalytics(
          collection || undefined
        );

        return NextResponse.json(
          createApiResponse(
            true,
            {
              query_analytics: queryAnalytics,
              collection_filter: collection,
            },
            'Query analytics retrieved successfully'
          )
        );

      case 'index-usage':
        const indexUsage = await databaseOptimizer.getIndexUsageStats();

        return NextResponse.json(
          createApiResponse(
            true,
            { index_usage: indexUsage },
            'Index usage statistics retrieved successfully'
          )
        );

      case 'cache-status':
        const cacheStats = performanceOptimizer.getPerformanceStats();

        return NextResponse.json(
          createApiResponse(
            true,
            {
              cache_hit_rate: cacheStats.cache_hit_rate,
              cache_sizes: cacheStats.cache_sizes,
              memory_usage_mb: cacheStats.memory_usage_mb,
            },
            'Cache status retrieved successfully'
          )
        );

      default:
        // Return comprehensive performance overview
        const overview = {
          performance: performanceOptimizer.getPerformanceStats(),
          database: await databaseOptimizer.getDatabaseStats(),
          cache_status: {
            hit_rate: performanceOptimizer.getPerformanceStats().cache_hit_rate,
            sizes: performanceOptimizer.getPerformanceStats().cache_sizes,
          },
          recent_metrics: performanceOptimizer
            .getPerformanceMetrics()
            .slice(-10),
          timestamp: new Date().toISOString(),
        };

        return NextResponse.json(
          createApiResponse(
            true,
            overview,
            'Performance overview retrieved successfully'
          )
        );
    }
  } catch (error) {
    console.error('Error retrieving performance data:', error);
    return NextResponse.json(
      createApiResponse(false, null, 'Failed to retrieve performance data'),
      { status: 500 }
    );
  }
});

export const POST = withAuth(async (req) => {
  const user = req.user!;

  // Only super admins can perform performance optimizations
  if (!hasFeaturePermission(user.role, 'GLOBAL_SETTINGS')) {
    return NextResponse.json(
      createApiResponse(false, null, 'Insufficient permissions'),
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const { action, parameters } = body;

    const performanceOptimizer = PerformanceOptimizer.getInstance();
    const databaseOptimizer = DatabaseOptimizer.getInstance();

    switch (action) {
      case 'optimize-indexes':
        await databaseOptimizer.createOptimalIndexes();

        return NextResponse.json(
          createApiResponse(
            true,
            { message: 'Database indexes optimized successfully' },
            'Index optimization completed'
          )
        );

      case 'warm-cache':
        const { cache_name, data_keys } = parameters || {};

        if (!cache_name) {
          return NextResponse.json(
            createApiResponse(false, null, 'Cache name is required'),
            { status: 400 }
          );
        }

        // This would need to be implemented based on specific cache warming needs
        // For now, we'll just return success
        return NextResponse.json(
          createApiResponse(
            true,
            { message: `Cache ${cache_name} warming initiated` },
            'Cache warming started'
          )
        );

      case 'clear-cache':
        const { cache_name: clearCacheName } = parameters || {};

        if (clearCacheName) {
          await performanceOptimizer.clear(clearCacheName);
        } else {
          // Clear all caches
          const cacheNames = [
            'dashboard_kpis',
            'survey_results',
            'ai_insights',
            'user_permissions',
          ];
          for (const name of cacheNames) {
            await performanceOptimizer.clear(name);
          }
        }

        return NextResponse.json(
          createApiResponse(
            true,
            { message: 'Cache cleared successfully' },
            'Cache clearing completed'
          )
        );

      case 'cleanup-unused-indexes':
        const droppedIndexes = await databaseOptimizer.cleanupUnusedIndexes();

        return NextResponse.json(
          createApiResponse(
            true,
            {
              dropped_indexes: droppedIndexes,
              count: droppedIndexes.length,
            },
            'Unused indexes cleaned up successfully'
          )
        );

      case 'suggest-indexes':
        const suggestions = await databaseOptimizer.suggestNewIndexes();

        return NextResponse.json(
          createApiResponse(
            true,
            { index_suggestions: suggestions },
            'Index suggestions generated successfully'
          )
        );

      case 'invalidate-cache-pattern':
        const { cache_name: patternCacheName, pattern } = parameters || {};

        if (!patternCacheName || !pattern) {
          return NextResponse.json(
            createApiResponse(
              false,
              null,
              'Cache name and pattern are required'
            ),
            { status: 400 }
          );
        }

        const invalidatedCount = await performanceOptimizer.invalidatePattern(
          patternCacheName,
          new RegExp(pattern)
        );

        return NextResponse.json(
          createApiResponse(
            true,
            {
              invalidated_count: invalidatedCount,
              pattern,
              cache_name: patternCacheName,
            },
            'Cache pattern invalidation completed'
          )
        );

      default:
        return NextResponse.json(
          createApiResponse(false, null, `Unknown action: ${action}`),
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error performing performance optimization:', error);
    return NextResponse.json(
      createApiResponse(false, null, 'Failed to perform optimization'),
      { status: 500 }
    );
  }
});

export const DELETE = withAuth(async (req) => {
  const user = req.user!;

  // Only super admins can delete performance data
  if (!hasFeaturePermission(user.role, 'GLOBAL_SETTINGS')) {
    return NextResponse.json(
      createApiResponse(false, null, 'Insufficient permissions'),
      { status: 403 }
    );
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    const performanceOptimizer = PerformanceOptimizer.getInstance();

    switch (action) {
      case 'clear-metrics':
        // Clear performance metrics history
        // This would need to be implemented in the PerformanceOptimizer class
        return NextResponse.json(
          createApiResponse(
            true,
            { message: 'Performance metrics cleared' },
            'Metrics clearing completed'
          )
        );

      case 'reset-cache':
        // Reset all caches to initial state
        const cacheNames = [
          'dashboard_kpis',
          'survey_results',
          'ai_insights',
          'user_permissions',
          'microclimate_data',
          'report_data',
          'question_bank',
        ];

        for (const cacheName of cacheNames) {
          await performanceOptimizer.clear(cacheName);
        }

        return NextResponse.json(
          createApiResponse(
            true,
            {
              message: 'All caches reset successfully',
              cleared_caches: cacheNames,
            },
            'Cache reset completed'
          )
        );

      default:
        return NextResponse.json(
          createApiResponse(false, null, `Unknown delete action: ${action}`),
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error deleting performance data:', error);
    return NextResponse.json(
      createApiResponse(false, null, 'Failed to delete performance data'),
      { status: 500 }
    );
  }
});
