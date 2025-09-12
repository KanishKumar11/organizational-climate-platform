import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { BenchmarkService } from '@/lib/benchmark-service';
import { validatePermissions } from '@/lib/permissions';
import { z } from 'zod';

// Validation schema for bulk benchmark operations
const bulkBenchmarkSchema = z.object({
  operation: z.enum([
    'create',
    'update',
    'delete',
    'validate',
    'activate',
    'deactivate',
  ]),
  benchmark_ids: z.array(z.string()).optional(),
  benchmarks: z.array(z.any()).optional(),
  filters: z
    .object({
      type: z.enum(['internal', 'industry']).optional(),
      category: z.string().optional(),
      industry: z.string().optional(),
      company_size: z.string().optional(),
      region: z.string().optional(),
      validation_status: z
        .enum(['pending', 'validated', 'rejected'])
        .optional(),
    })
    .optional(),
  updates: z.record(z.string(), z.any()).optional(),
});

// POST /api/benchmarks/bulk - Bulk operations on benchmarks
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permissions - Company Admin and above can perform bulk operations
    const hasPermission = await validatePermissions(
      session.user.id,
      'benchmark:manage',
      session.user.companyId
    );

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { operation, benchmark_ids, benchmarks, filters, updates } =
      bulkBenchmarkSchema.parse(body);

    let result;

    switch (operation) {
      case 'create':
        result = await bulkCreateBenchmarks(benchmarks || [], session.user);
        break;
      case 'update':
        result = await bulkUpdateBenchmarks(
          benchmark_ids || [],
          updates || {},
          session.user
        );
        break;
      case 'delete':
        result = await bulkDeleteBenchmarks(benchmark_ids || [], session.user);
        break;
      case 'validate':
        result = await bulkValidateBenchmarks(
          benchmark_ids || [],
          session.user
        );
        break;
      case 'activate':
        result = await bulkActivateBenchmarks(
          benchmark_ids || [],
          session.user
        );
        break;
      case 'deactivate':
        result = await bulkDeactivateBenchmarks(
          benchmark_ids || [],
          session.user
        );
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid operation' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      operation,
      result,
    });
  } catch (error) {
    console.error('Error performing bulk benchmark operation:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to perform bulk operation' },
      { status: 500 }
    );
  }
}

async function bulkCreateBenchmarks(benchmarks: any[], user: any) {
  const results = {
    created: 0,
    errors: [] as any[],
    benchmarks: [] as any[],
  };

  for (let i = 0; i < benchmarks.length; i++) {
    try {
      const benchmarkData = {
        ...benchmarks[i],
        created_by: user.id,
        company_id:
          benchmarks[i].type === 'internal' ? user.companyId : undefined,
      };

      const benchmark = await BenchmarkService.createBenchmark(benchmarkData);
      results.benchmarks.push(benchmark);
      results.created++;
    } catch (error) {
      results.errors.push({
        index: i,
        error: error instanceof Error ? error.message : 'Creation failed',
        data: benchmarks[i],
      });
    }
  }

  return results;
}

async function bulkUpdateBenchmarks(
  benchmarkIds: string[],
  updates: any,
  user: any
) {
  const result = await BenchmarkService.bulkUpdateBenchmarks(
    benchmarkIds,
    {
      ...updates,
      updated_at: new Date(),
      updated_by: user.id,
    },
    user.companyId
  );

  return {
    matched: result.matchedCount,
    modified: result.modifiedCount,
  };
}

async function bulkDeleteBenchmarks(benchmarkIds: string[], user: any) {
  const result = await BenchmarkService.bulkDeleteBenchmarks(
    benchmarkIds,
    user.companyId
  );

  return {
    matched: result.matchedCount,
    deleted: result.modifiedCount,
  };
}

async function bulkValidateBenchmarks(benchmarkIds: string[], user: any) {
  const result = await BenchmarkService.bulkUpdateBenchmarks(
    benchmarkIds,
    {
      validation_status: 'validated',
      validated_at: new Date(),
      validated_by: user.id,
    },
    user.companyId
  );

  return {
    matched: result.matchedCount,
    validated: result.modifiedCount,
  };
}

async function bulkActivateBenchmarks(benchmarkIds: string[], user: any) {
  const result = await BenchmarkService.bulkUpdateBenchmarks(
    benchmarkIds,
    {
      is_active: true,
      updated_at: new Date(),
      updated_by: user.id,
    },
    user.companyId
  );

  return {
    matched: result.matchedCount,
    activated: result.modifiedCount,
  };
}

async function bulkDeactivateBenchmarks(benchmarkIds: string[], user: any) {
  const result = await BenchmarkService.bulkUpdateBenchmarks(
    benchmarkIds,
    {
      is_active: false,
      updated_at: new Date(),
      updated_by: user.id,
    },
    user.companyId
  );

  return {
    matched: result.matchedCount,
    deactivated: result.modifiedCount,
  };
}
