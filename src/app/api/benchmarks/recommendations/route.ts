import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { BenchmarkService } from '@/lib/benchmark-service';
import { validatePermissions } from '@/lib/permissions';

// GET /api/benchmarks/recommendations - Get benchmark-based recommendations
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
    const survey_id = searchParams.get('survey_id');
    const company_id = searchParams.get('company_id') || session.user.companyId;
    const focus_areas = searchParams.get('focus_areas')?.split(',');
    const priority_level = searchParams.get('priority_level') as
      | 'high'
      | 'medium'
      | 'low'
      | undefined;

    if (!survey_id) {
      return NextResponse.json(
        { error: 'Survey ID is required' },
        { status: 400 }
      );
    }

    const recommendations = await BenchmarkService.generateRecommendations({
      survey_id,
      company_id,
      focus_areas,
      priority_level,
    });

    return NextResponse.json({
      success: true,
      recommendations,
    });
  } catch (error) {
    console.error('Error getting benchmark recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to get benchmark recommendations' },
      { status: 500 }
    );
  }
}

// POST /api/benchmarks/recommendations - Create custom benchmark recommendations
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permissions
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
      title,
      description,
      benchmark_data,
      target_metrics,
      improvement_areas,
      timeline,
      priority,
    } = body;

    if (!title || !benchmark_data || !target_metrics) {
      return NextResponse.json(
        { error: 'Title, benchmark data, and target metrics are required' },
        { status: 400 }
      );
    }

    const customRecommendation =
      await BenchmarkService.createCustomRecommendation({
        title,
        description,
        benchmark_data,
        target_metrics,
        improvement_areas,
        timeline,
        priority: priority || 'medium',
        created_by: session.user.id,
        company_id: session.user.companyId,
      });

    return NextResponse.json(
      {
        success: true,
        recommendation: customRecommendation,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating custom benchmark recommendation:', error);
    return NextResponse.json(
      { error: 'Failed to create custom recommendation' },
      { status: 500 }
    );
  }
}
