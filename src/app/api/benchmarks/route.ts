import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { BenchmarkService } from '@/lib/benchmark-service';
import { validatePermissions } from '@/lib/permissions';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permissions - Company Admin and above can view benchmarks
    const hasPermission = await validatePermissions(
      session.user.id,
      'benchmark:read',
      session.user.companyId
    );

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as
      | 'internal'
      | 'industry'
      | undefined;
    const category = searchParams.get('category');
    const industry = searchParams.get('industry');
    const company_size = searchParams.get('company_size');
    const region = searchParams.get('region');
    const is_active = searchParams.get('is_active') === 'true';
    const validation_status = searchParams.get('validation_status') as
      | 'pending'
      | 'validated'
      | 'rejected'
      | undefined;

    const benchmarks = await BenchmarkService.getBenchmarks({
      type,
      category,
      industry,
      company_size,
      region,
      is_active,
      validation_status,
    });

    return NextResponse.json({ benchmarks });
  } catch (error) {
    console.error('Error fetching benchmarks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch benchmarks' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permissions - Company Admin and above can create benchmarks
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
      name,
      description,
      type,
      category,
      source,
      industry,
      company_size,
      region,
      metrics,
      survey_ids,
    } = body;

    // Validate required fields
    if (!name || !description || !type || !category) {
      return NextResponse.json(
        { error: 'Missing required fields: name, description, type, category' },
        { status: 400 }
      );
    }

    let benchmark;

    if (type === 'internal' && survey_ids && survey_ids.length > 0) {
      // Create internal benchmark from historical data
      benchmark = await BenchmarkService.createInternalBenchmark(
        survey_ids,
        category,
        name,
        description,
        session.user.id,
        session.user.companyId
      );
    } else {
      // Create benchmark with provided metrics
      if (!metrics || metrics.length === 0) {
        return NextResponse.json(
          { error: 'Metrics are required for benchmark creation' },
          { status: 400 }
        );
      }

      benchmark = await BenchmarkService.createBenchmark({
        name,
        description,
        type,
        category,
        source: source || 'Manual Entry',
        industry,
        company_size,
        region,
        created_by: session.user.id,
        company_id: type === 'internal' ? session.user.companyId : undefined,
        metrics,
      });
    }

    return NextResponse.json({ benchmark }, { status: 201 });
  } catch (error) {
    console.error('Error creating benchmark:', error);
    return NextResponse.json(
      { error: 'Failed to create benchmark' },
      { status: 500 }
    );
  }
}


