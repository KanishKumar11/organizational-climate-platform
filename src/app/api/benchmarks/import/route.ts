import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { BenchmarkService } from '@/lib/benchmark-service';
import { validatePermissions } from '@/lib/permissions';
import { z } from 'zod';

// Validation schema for benchmark import
const importBenchmarkSchema = z.object({
  name: z.string().min(1, 'Benchmark name is required'),
  description: z.string().min(1, 'Description is required'),
  type: z.enum(['internal', 'industry']),
  category: z.string().min(1, 'Category is required'),
  source: z.string().min(1, 'Source is required'),
  industry: z.string().optional(),
  company_size: z.string().optional(),
  region: z.string().optional(),
  metrics: z.array(
    z.object({
      metric_name: z.string(),
      value: z.number(),
      unit: z.string().optional(),
      percentile: z.number().optional(),
      sample_size: z.number().optional(),
    })
  ),
  metadata: z.record(z.string(), z.any()).optional(),
  is_active: z.boolean().default(true),
});

const importRequestSchema = z.object({
  benchmarks: z.array(importBenchmarkSchema),
  source: z.string().default('External Import'),
  validate_duplicates: z.boolean().default(true),
  skip_invalid: z.boolean().default(false),
  auto_validate: z.boolean().default(false),
});

// POST /api/benchmarks/import - Import benchmarks from external sources
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permissions - Company Admin and above can import benchmarks
    const hasPermission = await validatePermissions(
      session.user.id,
      'benchmark:create',
      session.user.companyId
    );

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      benchmarks,
      source,
      validate_duplicates,
      skip_invalid,
      auto_validate,
    } = importRequestSchema.parse(body);

    const importResults = {
      total: benchmarks.length,
      imported: 0,
      skipped: 0,
      errors: [] as any[],
      duplicates: [] as any[],
      created_benchmarks: [] as any[],
    };

    for (let i = 0; i < benchmarks.length; i++) {
      const benchmarkData = benchmarks[i];

      try {
        // Check for duplicates if validation is enabled
        if (validate_duplicates) {
          const existingBenchmarks = await BenchmarkService.getBenchmarks({
            name: benchmarkData.name,
            category: benchmarkData.category,
            type: benchmarkData.type,
          });

          if (existingBenchmarks.length > 0) {
            importResults.duplicates.push({
              index: i,
              name: benchmarkData.name,
              existing_id: existingBenchmarks[0]._id,
            });
            importResults.skipped++;
            continue;
          }
        }

        // Prepare benchmark for import
        const benchmarkToImport = {
          ...benchmarkData,
          created_by: session.user.id,
          company_id:
            benchmarkData.type === 'internal'
              ? session.user.companyId
              : undefined,
          source,
          validation_status: auto_validate ? 'validated' : 'pending',
          validated_at: auto_validate ? new Date() : undefined,
          validated_by: auto_validate ? session.user.id : undefined,
        };

        const createdBenchmark =
          await BenchmarkService.createBenchmark(benchmarkToImport);
        importResults.created_benchmarks.push(createdBenchmark);
        importResults.imported++;
      } catch (validationError) {
        if (skip_invalid) {
          importResults.errors.push({
            index: i,
            name: benchmarkData.name,
            error:
              validationError instanceof Error
                ? validationError.message
                : 'Validation failed',
          });
          importResults.skipped++;
        } else {
          throw validationError;
        }
      }
    }

    return NextResponse.json({
      success: true,
      results: importResults,
    });
  } catch (error) {
    console.error('Error importing benchmarks:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to import benchmarks' },
      { status: 500 }
    );
  }
}

// GET /api/benchmarks/import - Get import templates and examples
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hasPermission = await validatePermissions(
      session.user.id,
      'benchmark:create',
      session.user.companyId
    );

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Return import template and examples
    const template = {
      format: 'JSON',
      required_fields: [
        'name',
        'description',
        'type',
        'category',
        'source',
        'metrics',
      ],
      optional_fields: [
        'industry',
        'company_size',
        'region',
        'metadata',
        'is_active',
      ],
      supported_types: ['internal', 'industry'],
      example: {
        name: 'Technology Industry Employee Engagement 2024',
        description:
          'Industry benchmark for employee engagement in technology companies',
        type: 'industry',
        category: 'Employee Engagement',
        source: 'Industry Research Report 2024',
        industry: 'Technology',
        company_size: 'Large',
        region: 'North America',
        metrics: [
          {
            metric_name: 'Overall Engagement Score',
            value: 7.2,
            unit: 'score',
            percentile: 75,
            sample_size: 1500,
          },
          {
            metric_name: 'Manager Effectiveness',
            value: 6.8,
            unit: 'score',
            percentile: 70,
            sample_size: 1500,
          },
        ],
        metadata: {
          survey_period: 'Q1-Q4 2024',
          methodology: 'Online survey',
          response_rate: '68%',
        },
        is_active: true,
      },
    };

    return NextResponse.json({
      success: true,
      template,
    });
  } catch (error) {
    console.error('Error getting benchmark import template:', error);
    return NextResponse.json(
      { error: 'Failed to get import template' },
      { status: 500 }
    );
  }
}
