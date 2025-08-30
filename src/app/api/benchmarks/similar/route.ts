import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { BenchmarkComparisonService } from '@/lib/benchmark-comparison';
import { validatePermissions } from '@/lib/permissions';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
    const industry = searchParams.get('industry');
    const company_size = searchParams.get('company_size');
    const category = searchParams.get('category');

    const similarBenchmarks =
      await BenchmarkComparisonService.findSimilarBenchmarks(
        industry || undefined,
        company_size || undefined,
        category || undefined
      );

    return NextResponse.json({ benchmarks: similarBenchmarks });
  } catch (error) {
    console.error('Error finding similar benchmarks:', error);
    return NextResponse.json(
      { error: 'Failed to find similar benchmarks' },
      { status: 500 }
    );
  }
}


