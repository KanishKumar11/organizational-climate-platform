import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { BenchmarkService } from '@/lib/benchmark-service';
import { validatePermissions } from '@/lib/permissions';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only Super Admins can validate benchmarks
    if (session.user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { benchmark_id, status } = body;

    if (!benchmark_id || !status) {
      return NextResponse.json(
        { error: 'Missing required fields: benchmark_id, status' },
        { status: 400 }
      );
    }

    if (!['validated', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: 'Status must be either "validated" or "rejected"' },
        { status: 400 }
      );
    }

    const benchmark = await BenchmarkService.validateBenchmark(
      benchmark_id,
      status
    );

    if (!benchmark) {
      return NextResponse.json(
        { error: 'Benchmark not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      benchmark,
      message: `Benchmark ${status} successfully`,
    });
  } catch (error) {
    console.error('Error validating benchmark:', error);
    return NextResponse.json(
      { error: 'Failed to validate benchmark' },
      { status: 500 }
    );
  }
}


