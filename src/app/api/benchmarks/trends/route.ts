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
      'benchmark:read',
      session.user.company_id
    );

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { survey_ids, metric_name } = body;

    if (!survey_ids || !Array.isArray(survey_ids) || survey_ids.length === 0) {
      return NextResponse.json(
        { error: 'Missing or invalid survey_ids array' },
        { status: 400 }
      );
    }

    if (!metric_name) {
      return NextResponse.json(
        { error: 'Missing required field: metric_name' },
        { status: 400 }
      );
    }

    const trendAnalysis = await BenchmarkComparisonService.analyzeTrends(
      survey_ids,
      metric_name
    );

    return NextResponse.json({ trend_analysis: trendAnalysis });
  } catch (error) {
    console.error('Error analyzing trends:', error);
    return NextResponse.json(
      { error: 'Failed to analyze trends' },
      { status: 500 }
    );
  }
}
