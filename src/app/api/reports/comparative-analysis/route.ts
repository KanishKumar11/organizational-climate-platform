import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import { ReportService } from '@/lib/report-service';
import { checkPermissions } from '@/lib/permissions';

// POST /api/reports/comparative-analysis - Generate comparative analysis
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permissions
    if (!checkPermissions(session.user.role, 'EXPORT_REPORTS')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { filters, comparison_type, config } = body;

    // Validate required fields
    if (!filters || !comparison_type) {
      return NextResponse.json(
        { error: 'Missing required fields: filters and comparison_type' },
        { status: 400 }
      );
    }

    // Validate comparison type
    const validComparisonTypes = ['department', 'time_period', 'benchmark'];
    if (!validComparisonTypes.includes(comparison_type)) {
      return NextResponse.json(
        {
          error:
            'Invalid comparison_type. Must be one of: department, time_period, benchmark',
        },
        { status: 400 }
      );
    }

    await connectDB();

    // Generate report data
    const reportData = await ReportService.generateReportData(
      filters,
      config || {
        include_charts: true,
        include_raw_data: true,
        include_ai_insights: true,
        include_recommendations: true,
      },
      session.user.companyId
    );

    // Generate comparative analysis
    const comparativeAnalysis = ReportService.generateComparativeAnalysis(
      reportData,
      comparison_type
    );

    if (!comparativeAnalysis) {
      return NextResponse.json(
        { error: 'Unable to generate comparative analysis with current data' },
        { status: 400 }
      );
    }

    // Generate relevant charts for the comparison
    const chartTypes = {
      department: ['department_comparison', 'performance_matrix'],
      time_period: ['trend_analysis', 'sentiment_analysis'],
      benchmark: ['benchmark_comparison', 'gap_analysis'],
    };

    const charts = chartTypes[comparison_type as keyof typeof chartTypes]
      .map((chartType) =>
        ReportService.generateChartData(reportData, chartType)
      )
      .flat();

    return NextResponse.json({
      comparison_type,
      analysis: comparativeAnalysis,
      charts,
      metadata: reportData.metadata,
      summary: this.generateComparisonSummary(
        comparativeAnalysis,
        comparison_type
      ),
    });
  } catch (error) {
    console.error('Error generating comparative analysis:', error);
    return NextResponse.json(
      { error: 'Failed to generate comparative analysis' },
      { status: 500 }
    );
  }
}

// Helper function to generate comparison summary
function generateComparisonSummary(analysis: any, comparisonType: string): any {
  switch (comparisonType) {
    case 'department':
      return {
        total_departments: Object.keys(analysis.departments).length,
        top_performer: analysis.rankings[0]?.department_id,
        bottom_performer:
          analysis.rankings[analysis.rankings.length - 1]?.department_id,
        average_score:
          analysis.rankings.reduce(
            (sum: number, dept: any) => sum + dept.score,
            0
          ) / analysis.rankings.length,
        score_range: {
          highest: analysis.rankings[0]?.score || 0,
          lowest: analysis.rankings[analysis.rankings.length - 1]?.score || 0,
        },
      };

    case 'time_period':
      return {
        total_periods: analysis.periods?.length || 0,
        trend_direction: analysis.overall_direction,
        change_rate: analysis.change_rate,
        improvement: analysis.overall_direction === 'improving',
      };

    case 'benchmark':
      return {
        total_benchmarks: analysis.summary?.total_benchmarks || 0,
        above_benchmark: analysis.summary?.above_benchmark || 0,
        below_benchmark: analysis.summary?.below_benchmark || 0,
        overall_performance:
          analysis.summary?.above_benchmark /
            analysis.summary?.total_benchmarks || 0,
      };

    default:
      return {};
  }
}


