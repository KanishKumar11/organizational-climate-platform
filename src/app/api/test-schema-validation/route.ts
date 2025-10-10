import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Report from '@/models/Report';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    // Create a new report with all fields
    const report = new Report({
      title: 'Schema Validation Test',
      type: 'survey_analysis',
      company_id: '68d5518a04127f5f884e728d',
      created_by: 'test-user',
      filters: {
        survey_ids: [],
        time_filter: {
          start_date: new Date('2024-01-01'),
          end_date: new Date('2025-12-31'),
        },
      },
      config: {
        include_charts: false,
        include_raw_data: false,
        include_ai_insights: false,
        include_recommendations: false,
      },
      status: 'generating',
      format: 'pdf',
      is_recurring: false,
      // Add populated data
      metadata: {
        responseCount: 5,
        totalSurveys: 1,
        totalResponses: 5,
        averageCompletionTime: 300,
      },
      metrics: {
        engagementScore: 75.5,
        responseRate: 85.0,
        satisfaction: 8.2,
        completionRate: 95.0,
        participationRate: 80.0,
      },
      demographics: {
        departments: [
          { name: 'Engineering', count: 10, percentage: 50 },
          { name: 'Marketing', count: 5, percentage: 25 },
        ],
      },
      insights: [
        {
          id: '1',
          title: 'High Employee Satisfaction',
          description: 'Employees show high satisfaction',
          priority: 'high',
          category: 'satisfaction',
          recommendedActions: ['Continue current practices'],
          confidence: 0.85,
        },
      ],
      recommendations: [
        {
          title: 'Improve Communication',
          description: 'Enhance internal communication',
          impact: 'high',
          effort: 'medium',
          category: 'communication',
        },
      ],
      dateRange: {
        start: '2024-01-01',
        end: '2025-12-31',
      },
      sections: ['overview', 'demographics', 'insights', 'recommendations'],
    });

    // Validate before saving
    const validationError = report.validateSync();
    if (validationError) {
      console.error('Validation error:', validationError);
      return NextResponse.json(
        {
          success: false,
          message: 'Validation failed',
          error: validationError.message,
          details: validationError.errors,
        },
        { status: 400 }
      );
    }

    const savedReport = await report.save();
    console.log('Report saved successfully:', {
      id: savedReport._id,
      title: savedReport.title,
      hasMetadata: !!savedReport.metadata,
      hasMetrics: !!savedReport.metrics,
      metadata: savedReport.metadata,
      metrics: savedReport.metrics,
    });

    return NextResponse.json({
      success: true,
      message: 'Report created and saved successfully',
      data: {
        reportId: savedReport._id,
        title: savedReport.title,
        metadata: savedReport.metadata,
        metrics: savedReport.metrics,
        demographics: savedReport.demographics,
        insights: savedReport.insights,
        recommendations: savedReport.recommendations,
      },
    });
  } catch (error) {
    console.error('Schema validation test error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to test schema validation',
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
