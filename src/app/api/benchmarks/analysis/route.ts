import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { BenchmarkService } from '@/lib/benchmark-service';
import { validatePermissions } from '@/lib/permissions';

// GET /api/benchmarks/analysis - Get comprehensive benchmark analysis
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permissions
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
    const company_id = searchParams.get('company_id') || session.user.companyId;
    const timeframe = searchParams.get('timeframe') || '12'; // months
    const include_industry = searchParams.get('include_industry') === 'true';
    const categories = searchParams.get('categories')?.split(',');

    const analysis = await BenchmarkService.getComprehensiveAnalysis({
      company_id,
      timeframe: parseInt(timeframe),
      include_industry,
      categories,
    });

    return NextResponse.json({
      success: true,
      analysis,
    });
  } catch (error) {
    console.error('Error getting benchmark analysis:', error);
    return NextResponse.json(
      { error: 'Failed to get benchmark analysis' },
      { status: 500 }
    );
  }
}

// POST /api/benchmarks/analysis - Generate custom benchmark analysis
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permissions
    const hasPermission = await validatePermissions(
      session.user.id,
      'benchmark:analyze',
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
      survey_ids,
      benchmark_ids,
      analysis_type,
      custom_metrics,
      comparison_period,
    } = body;

    if (!survey_ids || !benchmark_ids) {
      return NextResponse.json(
        { error: 'Survey IDs and benchmark IDs are required' },
        { status: 400 }
      );
    }

    const customAnalysis = await BenchmarkService.generateCustomAnalysis({
      survey_ids,
      benchmark_ids,
      analysis_type: analysis_type || 'comprehensive',
      custom_metrics,
      comparison_period,
      requested_by: session.user.id,
      company_id: session.user.companyId,
    });

    return NextResponse.json({
      success: true,
      analysis: customAnalysis,
    });
  } catch (error) {
    console.error('Error generating custom benchmark analysis:', error);
    return NextResponse.json(
      { error: 'Failed to generate custom analysis' },
      { status: 500 }
    );
  }
}
