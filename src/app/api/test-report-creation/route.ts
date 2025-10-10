import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Report from '@/models/Report';
import Survey from '@/models/Survey';
import { ReportService } from '@/lib/report-service';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Get the test survey
    const surveys = await Survey.find({}).lean();
    if (surveys.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No surveys found. Please seed survey data first.',
      });
    }

    const testSurvey = surveys[0];

    // Create a test report
    const report = new Report({
      title: 'Test Report with Real Data',
      description: 'A test report generated from actual survey data',
      type: 'survey_analysis',
      company_id: session.user.companyId,
      created_by: session.user.id,
      filters: {
        survey_ids: [testSurvey._id.toString()],
        time_filter: {
          start_date: new Date('2024-01-01'),
          end_date: new Date('2024-12-31'),
        },
      },
      config: {
        sections: ['overview', 'demographics', 'insights', 'recommendations'],
        includeCharts: true,
        includeExecutiveSummary: true,
        includeRawData: false,
      },
      status: 'draft',
      format: 'pdf',
      is_recurring: false,
    });

    await report.save();

    // Generate report data
    const reportData = await ReportService.generateReportData(
      report.filters,
      report.config,
      session.user.companyId
    );

    // Populate the report with actual data
    await ReportService.populateReportWithData(
      report._id.toString(),
      reportData
    );

    // Fetch the populated report
    const populatedReport = await Report.findById(report._id).lean();

    return NextResponse.json({
      success: true,
      message: 'Test report created and populated successfully',
      data: {
        reportId: report._id,
        title: populatedReport?.title,
        metadata: populatedReport?.metadata,
        metrics: populatedReport?.metrics,
        demographics: populatedReport?.demographics,
        insights: populatedReport?.insights,
        recommendations: populatedReport?.recommendations,
        dateRange: populatedReport?.dateRange,
      },
    });
  } catch (error) {
    console.error('Test report creation error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to create test report',
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
