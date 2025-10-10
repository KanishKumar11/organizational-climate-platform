import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Report from '@/models/Report';
import Company from '@/models/Company';
import { ObjectId } from 'mongodb';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    // Get a company
    const companies = await Company.find({}).lean();
    if (companies.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No companies found',
      });
    }

    const company = companies[0];

    // Create a simple report with minimal data
    const report = new Report({
      title: 'Simple Test Report',
      description: 'A simple test report',
      type: 'survey_analysis',
      company_id: company._id,
      created_by: new ObjectId().toString(),
      filters: {
        survey_ids: [],
        time_filter: {
          start_date: new Date('2024-01-01'),
          end_date: new Date('2024-12-31'),
        },
      },
      config: {
        sections: ['overview'],
        includeCharts: false,
        includeExecutiveSummary: false,
        includeRawData: false,
      },
      status: 'draft',
      format: 'pdf',
      is_recurring: false,
    });

    // Save the report first
    const savedReport = await report.save();
    console.log('Simple report saved:', {
      id: savedReport._id,
      title: savedReport.title,
      metadata: savedReport.metadata,
      metrics: savedReport.metrics,
    });

    // Now update it with additional data
    const updatedReport = await Report.findByIdAndUpdate(
      savedReport._id,
      {
        metadata: {
          responseCount: 5,
          totalSurveys: 1,
          totalResponses: 5,
          averageCompletionTime: 300,
        },
        metrics: {
          engagementScore: 75,
          responseRate: 80,
          satisfaction: 4.2,
          completionRate: 100,
          participationRate: 80,
        },
        demographics: {
          departments: [
            { name: 'Engineering', count: 3, percentage: 60 },
            { name: 'Marketing', count: 2, percentage: 40 },
          ],
        },
        insights: [
          {
            id: new ObjectId().toString(),
            title: 'High Satisfaction',
            description: 'Employees report high satisfaction levels',
            priority: 'medium',
            category: 'satisfaction',
            recommendedActions: ['Continue current practices'],
            confidence: 85,
          },
        ],
        recommendations: [
          {
            title: 'Maintain Practices',
            description: 'Continue with current management practices',
            impact: 'medium',
            effort: 'low',
            category: 'management',
          },
        ],
        dateRange: {
          start: '2024-01-01',
          end: '2024-12-31',
        },
        sections: ['overview', 'demographics', 'insights', 'recommendations'],
      },
      { new: true }
    );

    console.log('Updated report:', {
      id: updatedReport?._id,
      title: updatedReport?.title,
      metadata: updatedReport?.metadata,
      metrics: updatedReport?.metrics,
      demographics: updatedReport?.demographics,
      insights: updatedReport?.insights,
      recommendations: updatedReport?.recommendations,
      dateRange: updatedReport?.dateRange,
      sections: updatedReport?.sections,
    });

    return NextResponse.json({
      success: true,
      message: 'Simple test report created and updated',
      data: {
        reportId: updatedReport?._id,
        title: updatedReport?.title,
        metadata: updatedReport?.metadata,
        metrics: updatedReport?.metrics,
        demographics: updatedReport?.demographics,
        insights: updatedReport?.insights,
        recommendations: updatedReport?.recommendations,
        dateRange: updatedReport?.dateRange,
        sections: updatedReport?.sections,
      },
    });
  } catch (error) {
    console.error('Simple test report creation error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to create simple test report',
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
