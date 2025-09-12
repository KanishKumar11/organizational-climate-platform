/**
 * Performance Optimization Service
 * Handles caching, query optimization, and performance monitoring
 */

import { IUser } from '../models/User';
import { UserRole } from '../types/user';
import AuditService from './audit-service';

export interface CacheConfig {
  ttl: number; // Time to live in milliseconds
  maxSize: number; // Maximum number of items in cache
  strategy: 'lru' | 'fifo' | 'lfu'; // Cache eviction strategy
}

export interface PerformanceMetrics {
  operation: string;
  duration_ms: number;
  cache_hit: boolean;
  query_count: number;
  memory_usage: number;
  timestamp: Date;
  user_role?: UserRole;
  company_id?: string;
}

export interface QueryOptimization {
  original_query: any;
  optimized_query: any;
  indexes_used: string[];
  execution_time_ms: number;
  rows_examined: number;
  rows_returned: number;
}

export interface CacheItem<T> {
  key: string;
  value: T;
  created_at: Date;
  last_accessed: Date;
  access_count: number;
  ttl: number;
}

export class PerformanceOptimizer {
  private static instance: PerformanceOptimizer;
  private caches: Map<string, Map<string, CacheItem<any>>> = new Map();
  private cacheConfigs: Map<string, CacheConfig> = new Map();
  private performanceMetrics: PerformanceMetrics[] = [];
  private auditService: AuditService;
  private queryOptimizations: Map<string, QueryOptimization> = new Map();

  private constructor() {
    this.auditService = AuditService.getInstance();
    this.initializeDefaultCaches();
    this.startPerformanceMonitoring();
  }

  public static getInstance(): PerformanceOptimizer {
    if (!PerformanceOptimizer.instance) {
      PerformanceOptimizer.instance = new PerformanceOptimizer();
    }
    return PerformanceOptimizer.instance;
  }

  private initializeDefaultCaches(): void {
    // Dashboard KPIs cache
    this.createCache('dashboard_kpis', {
      ttl: 5 * 60 * 1000, // 5 minutes
      maxSize: 1000,
      strategy: 'lru',
    });

    // Survey results cache
    this.createCache('survey_results', {
      ttl: 15 * 60 * 1000, // 15 minutes
      maxSize: 500,
      strategy: 'lru',
    });

    // AI insights cache
    this.createCache('ai_insights', {
      ttl: 30 * 60 * 1000, // 30 minutes
      maxSize: 200,
      strategy: 'lru',
    });

    // User permissions cache
    this.createCache('user_permissions', {
      ttl: 60 * 60 * 1000, // 1 hour
      maxSize: 2000,
      strategy: 'lru',
    });

    // Microclimate data cache (shorter TTL for real-time data)
    this.createCache('microclimate_data', {
      ttl: 2 * 60 * 1000, // 2 minutes
      maxSize: 100,
      strategy: 'fifo',
    });

    // Report data cache
    this.createCache('report_data', {
      ttl: 60 * 60 * 1000, // 1 hour
      maxSize: 100,
      strategy: 'lru',
    });

    // Question bank cache
    this.createCache('question_bank', {
      ttl: 24 * 60 * 60 * 1000, // 24 hours
      maxSize: 50,
      strategy: 'lfu',
    });
  }

  public createCache(cacheName: string, config: CacheConfig): void {
    this.caches.set(cacheName, new Map());
    this.cacheConfigs.set(cacheName, config);
  }

  public async get<T>(cacheName: string, key: string): Promise<T | null> {
    const cache = this.caches.get(cacheName);
    const config = this.cacheConfigs.get(cacheName);

    if (!cache || !config) {
      return null;
    }

    const item = cache.get(key);

    if (!item) {
      return null;
    }

    // Check if item has expired
    const now = new Date();
    if (now.getTime() - item.created_at.getTime() > item.ttl) {
      cache.delete(key);
      return null;
    }

    // Update access information
    item.last_accessed = now;
    item.access_count++;

    return item.value;
  }

  public async set<T>(
    cacheName: string,
    key: string,
    value: T,
    customTtl?: number
  ): Promise<void> {
    const cache = this.caches.get(cacheName);
    const config = this.cacheConfigs.get(cacheName);

    if (!cache || !config) {
      return;
    }

    const now = new Date();
    const ttl = customTtl || config.ttl;

    // Check cache size and evict if necessary
    if (cache.size >= config.maxSize) {
      this.evictItems(cacheName, 1);
    }

    const item: CacheItem<T> = {
      key,
      value,
      created_at: now,
      last_accessed: now,
      access_count: 1,
      ttl,
    };

    cache.set(key, item);
  }

  public async delete(cacheName: string, key: string): Promise<void> {
    const cache = this.caches.get(cacheName);
    if (cache) {
      cache.delete(key);
    }
  }

  public async clear(cacheName: string): Promise<void> {
    const cache = this.caches.get(cacheName);
    if (cache) {
      cache.clear();
    }
  }

  private evictItems(cacheName: string, count: number): void {
    const cache = this.caches.get(cacheName);
    const config = this.cacheConfigs.get(cacheName);

    if (!cache || !config) {
      return;
    }

    const items = Array.from(cache.entries()).map(([key, item]) => ({
      key,
      ...item,
    }));

    let itemsToEvict: string[] = [];

    switch (config.strategy) {
      case 'lru': // Least Recently Used
        items.sort(
          (a, b) => a.last_accessed.getTime() - b.last_accessed.getTime()
        );
        itemsToEvict = items.slice(0, count).map((item) => item.key);
        break;

      case 'lfu': // Least Frequently Used
        items.sort((a, b) => a.access_count - b.access_count);
        itemsToEvict = items.slice(0, count).map((item) => item.key);
        break;

      case 'fifo': // First In, First Out
        items.sort((a, b) => a.created_at.getTime() - b.created_at.getTime());
        itemsToEvict = items.slice(0, count).map((item) => item.key);
        break;
    }

    itemsToEvict.forEach((key) => cache.delete(key));
  }

  // Scoped caching for role-based data
  public async getScopedData<T>(
    cacheName: string,
    baseKey: string,
    user: IUser,
    dataFetcher: () => Promise<T>
  ): Promise<T> {
    const scopedKey = this.generateScopedKey(baseKey, user);

    // Try to get from cache first
    let data = await this.get<T>(cacheName, scopedKey);

    if (data === null) {
      // Cache miss - fetch data and cache it
      const startTime = Date.now();
      data = await dataFetcher();
      const duration = Date.now() - startTime;

      await this.set(cacheName, scopedKey, data);

      // Record performance metrics
      this.recordMetrics({
        operation: `${cacheName}_fetch`,
        duration_ms: duration,
        cache_hit: false,
        query_count: 1,
        memory_usage: this.estimateMemoryUsage(data),
        timestamp: new Date(),
        user_role: user.role,
        company_id: user.company_id.toString(),
      });
    } else {
      // Cache hit
      this.recordMetrics({
        operation: `${cacheName}_fetch`,
        duration_ms: 0,
        cache_hit: true,
        query_count: 0,
        memory_usage: 0,
        timestamp: new Date(),
        user_role: user.role,
        company_id: user.company_id.toString(),
      });
    }

    return data;
  }

  private generateScopedKey(baseKey: string, user: IUser): string {
    // Generate cache key based on user's access scope
    const scopeParts = [baseKey];

    if (user.role === 'super_admin') {
      scopeParts.push('global');
    } else if (user.role === 'company_admin') {
      scopeParts.push('company', user.company_id.toString());
    } else if (user.role === 'department_admin') {
      scopeParts.push('department', user.department_id.toString());
    } else {
      scopeParts.push('user', user._id.toString());
    }

    return scopeParts.join(':');
  }

  // Database query optimization
  public async optimizeQuery(
    queryName: string,
    queryBuilder: () => any,
    indexHints?: string[]
  ): Promise<any> {
    const startTime = Date.now();

    // Build the query
    const query = queryBuilder();

    // Apply index hints if provided
    if (indexHints && indexHints.length > 0) {
      // This would be implemented based on your database driver
      // For MongoDB, you might use .hint() method
      // query.hint(indexHints[0]);
    }

    // Execute query and measure performance
    const result = await query;
    const executionTime = Date.now() - startTime;

    // Store optimization data
    this.queryOptimizations.set(queryName, {
      original_query: query,
      optimized_query: query, // Would be different if optimization was applied
      indexes_used: indexHints || [],
      execution_time_ms: executionTime,
      rows_examined: result?.length || 0,
      rows_returned: result?.length || 0,
    });

    // Log slow queries
    if (executionTime > 1000) {
      // Queries taking more than 1 second
      console.warn(`Slow query detected: ${queryName} took ${executionTime}ms`);

      await this.auditService.logEvent({
        action: 'read',
        resource: 'template',
        resource_id: queryName,
        success: true,
        context: {
          user_id: 'system',
          company_id: 'system',
          ip_address: '',
        },
        details: {
          execution_time_ms: executionTime,
          query_name: queryName,
          indexes_used: indexHints,
        },
      });
    }

    return result;
  }

  // Lazy loading helper
  public createLazyLoader<T>(
    dataFetcher: () => Promise<T>,
    cacheKey?: string,
    cacheName: string = 'lazy_data'
  ): () => Promise<T> {
    let loadingPromise: Promise<T> | null = null;

    return async (): Promise<T> => {
      // If already loading, return the same promise
      if (loadingPromise) {
        return loadingPromise;
      }

      // Check cache if key provided
      if (cacheKey) {
        const cached = await this.get<T>(cacheName, cacheKey);
        if (cached !== null) {
          return cached;
        }
      }

      // Start loading
      loadingPromise = dataFetcher();

      try {
        const result = await loadingPromise;

        // Cache result if key provided
        if (cacheKey) {
          await this.set(cacheName, cacheKey, result);
        }

        return result;
      } finally {
        loadingPromise = null;
      }
    };
  }

  // Performance monitoring
  private recordMetrics(metrics: PerformanceMetrics): void {
    this.performanceMetrics.push(metrics);

    // Keep only last 1000 metrics to prevent memory issues
    if (this.performanceMetrics.length > 1000) {
      this.performanceMetrics = this.performanceMetrics.slice(-1000);
    }
  }

  public getPerformanceMetrics(
    operation?: string,
    timeRange?: { start: Date; end: Date }
  ): PerformanceMetrics[] {
    let metrics = this.performanceMetrics;

    if (operation) {
      metrics = metrics.filter((m) => m.operation === operation);
    }

    if (timeRange) {
      metrics = metrics.filter(
        (m) => m.timestamp >= timeRange.start && m.timestamp <= timeRange.end
      );
    }

    return metrics;
  }

  public getPerformanceStats(): {
    cache_hit_rate: number;
    average_response_time: number;
    slow_queries_count: number;
    memory_usage_mb: number;
    cache_sizes: Record<string, number>;
  } {
    const recentMetrics = this.performanceMetrics.slice(-100); // Last 100 operations

    const cacheHits = recentMetrics.filter((m) => m.cache_hit).length;
    const cacheHitRate =
      recentMetrics.length > 0 ? (cacheHits / recentMetrics.length) * 100 : 0;

    const avgResponseTime =
      recentMetrics.length > 0
        ? recentMetrics.reduce((sum, m) => sum + m.duration_ms, 0) /
          recentMetrics.length
        : 0;

    const slowQueries = recentMetrics.filter(
      (m) => m.duration_ms > 1000
    ).length;

    const memoryUsage =
      recentMetrics.reduce((sum, m) => sum + m.memory_usage, 0) / (1024 * 1024); // Convert to MB

    const cacheSizes: Record<string, number> = {};
    for (const [name, cache] of this.caches) {
      cacheSizes[name] = cache.size;
    }

    return {
      cache_hit_rate: cacheHitRate,
      average_response_time: avgResponseTime,
      slow_queries_count: slowQueries,
      memory_usage_mb: memoryUsage,
      cache_sizes: cacheSizes,
    };
  }

  // Memory usage estimation
  private estimateMemoryUsage(data: any): number {
    if (data === null || data === undefined) return 0;

    const jsonString = JSON.stringify(data);
    return jsonString.length * 2; // Rough estimate: 2 bytes per character
  }

  // Cache warming for frequently accessed data
  public async warmCache(
    cacheName: string,
    dataMap: Map<string, () => Promise<any>>
  ): Promise<void> {
    console.log(`Warming cache: ${cacheName}`);

    const promises = Array.from(dataMap.entries()).map(
      async ([key, fetcher]) => {
        try {
          const data = await fetcher();
          await this.set(cacheName, key, data);
        } catch (error) {
          console.error(`Failed to warm cache for key ${key}:`, error);
        }
      }
    );

    await Promise.all(promises);
    console.log(`Cache warming completed for: ${cacheName}`);
  }

  // Cleanup expired items
  private startPerformanceMonitoring(): void {
    // Clean up expired cache items every 5 minutes
    setInterval(
      () => {
        this.cleanupExpiredItems();
      },
      5 * 60 * 1000
    );

    // Log performance stats every 15 minutes
    setInterval(
      () => {
        const stats = this.getPerformanceStats();
        console.log('Performance Stats:', stats);

        // Log to audit service if performance is degraded
        if (stats.cache_hit_rate < 50 || stats.average_response_time > 2000) {
          this.auditService
            .logEvent({
              action: 'read',
              resource: 'template',
              resource_id: 'performance_monitor',
              success: false,
              context: {
                user_id: 'system',
                company_id: 'system',
                ip_address: '',
              },
              details: stats,
            })
            .catch(console.error);
        }
      },
      15 * 60 * 1000
    );
  }

  private cleanupExpiredItems(): void {
    const now = new Date();
    let totalCleaned = 0;

    for (const [cacheName, cache] of this.caches) {
      const config = this.cacheConfigs.get(cacheName);
      if (!config) continue;

      const keysToDelete: string[] = [];

      for (const [key, item] of cache) {
        if (now.getTime() - item.created_at.getTime() > item.ttl) {
          keysToDelete.push(key);
        }
      }

      keysToDelete.forEach((key) => cache.delete(key));
      totalCleaned += keysToDelete.length;
    }

    if (totalCleaned > 0) {
      console.log(`Cleaned up ${totalCleaned} expired cache items`);
    }
  }

  // Batch operations for better performance
  public async batchGet<T>(
    cacheName: string,
    keys: string[]
  ): Promise<Map<string, T | null>> {
    const results = new Map<string, T | null>();

    for (const key of keys) {
      const value = await this.get<T>(cacheName, key);
      results.set(key, value);
    }

    return results;
  }

  public async batchSet<T>(
    cacheName: string,
    items: Map<string, T>,
    customTtl?: number
  ): Promise<void> {
    const promises = Array.from(items.entries()).map(([key, value]) =>
      this.set(cacheName, key, value, customTtl)
    );

    await Promise.all(promises);
  }

  // Invalidate cache based on patterns
  public async invalidatePattern(
    cacheName: string,
    pattern: RegExp
  ): Promise<number> {
    const cache = this.caches.get(cacheName);
    if (!cache) return 0;

    const keysToDelete: string[] = [];

    for (const key of cache.keys()) {
      if (pattern.test(key)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach((key) => cache.delete(key));

    return keysToDelete.length;
  }
}

export default PerformanceOptimizer;
