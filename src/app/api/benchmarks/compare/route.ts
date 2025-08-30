import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { BenchmarkComparisonService } from '@/lib/benchmark-comparison';
import { validatePermissions } from '@/lib/permissions';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hasPermission = await validatePermissions(
      session.user.id,
      'benchmark:compare',
      session.user.companyId
    );

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { survey_id, benchmark_id } = body;

    if (!survey_id || !benchmark_id) {
      return NextResponse.json(
        { error: 'Missing required fields: survey_id, benchmark_id' },
        { status: 400 }
      );
    }

    const gapAnalysis = await BenchmarkComparisonService.compareWithBenchmark(
      survey_id,
      benchmark_id
    );

    return NextResponse.json({ gap_analysis: gapAnalysis });
  } catch (error) {
    console.error('Error comparing with benchmark:', error);
    return NextResponse.json(
      { error: 'Failed to compare with benchmark' },
      { status: 500 }
    );
  }
}


