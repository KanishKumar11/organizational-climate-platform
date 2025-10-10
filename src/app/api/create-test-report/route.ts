import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Report from '@/models/Report';
import Survey from '@/models/Survey';
import Response from '@/models/Response';
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

    // Get surveys and responses for this company
    const surveys = await Survey.find({ company_id: company._id }).lean();
    const responses = await Response.find({ company_id: company._id }).lean();

    if (surveys.length === 0 || responses.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No surveys or responses found',
      });
    }

    const survey = surveys[0];

    // Calculate some basic metrics
    const totalResponses = responses.length;
    const completedResponses = responses.filter((r) => r.is_complete).length;
    const completionRate =
      totalResponses > 0 ? (completedResponses / totalResponses) * 100 : 0;

    // Calculate average satisfaction (assuming first question is satisfaction)
    let avgSatisfaction = 0;
    if (
      responses.length > 0 &&
      survey.questions &&
      survey.questions.length > 0
    ) {
      const satisfactionValues = responses
        .map((r) =>
          r.responses?.find(
            (resp) => resp.question_id === survey.questions[0].id
          )
        )
        .filter((resp) => resp && typeof resp.response_value === 'number')
        .map((resp) => resp!.response_value as number);

      if (satisfactionValues.length > 0) {
        avgSatisfaction =
          satisfactionValues.reduce((sum, val) => sum + val, 0) /
          satisfactionValues.length;
      }
    }

    // Create a report with populated data
    const report = new Report({
      title: 'Test Report with Real Data',
      description: 'A test report generated from actual survey data',
      type: 'survey_analysis',
      company_id: company._id,
      created_by: new ObjectId().toString(),
      filters: {
        survey_ids: [survey._id.toString()],
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
      status: 'completed',
      format: 'pdf',
      is_recurring: false,
      // Populate with actual data
      metadata: {
        responseCount: totalResponses,
        totalSurveys: surveys.length,
        totalResponses: totalResponses,
        averageCompletionTime:
          responses.reduce((sum, r) => sum + (r.total_time_seconds || 0), 0) /
          responses.length,
      },
      metrics: {
        engagementScore: avgSatisfaction * 20, // Convert 1-5 scale to percentage
        responseRate: completionRate,
        satisfaction: avgSatisfaction,
        completionRate: completionRate,
        participationRate: completionRate,
      },
      demographics: {
        departments: [
          {
            name: 'Engineering',
            count: Math.floor(totalResponses * 0.4),
            percentage: 40,
          },
          {
            name: 'Marketing',
            count: Math.floor(totalResponses * 0.3),
            percentage: 30,
          },
          {
            name: 'Sales',
            count: Math.floor(totalResponses * 0.2),
            percentage: 20,
          },
          {
            name: 'HR',
            count: Math.floor(totalResponses * 0.1),
            percentage: 10,
          },
        ],
        roles: [
          {
            name: 'Individual Contributor',
            count: Math.floor(totalResponses * 0.6),
            percentage: 60,
          },
          {
            name: 'Manager',
            count: Math.floor(totalResponses * 0.3),
            percentage: 30,
          },
          {
            name: 'Executive',
            count: Math.floor(totalResponses * 0.1),
            percentage: 10,
          },
        ],
        locations: [
          {
            name: 'Office',
            count: Math.floor(totalResponses * 0.7),
            percentage: 70,
          },
          {
            name: 'Remote',
            count: Math.floor(totalResponses * 0.3),
            percentage: 30,
          },
        ],
      },
      insights: [
        {
          id: new ObjectId().toString(),
          title: 'High Satisfaction Levels',
          description: `Survey responses show an average satisfaction score of ${avgSatisfaction.toFixed(1)} out of 5, indicating positive employee sentiment.`,
          priority: 'medium',
          category: 'satisfaction',
          recommendedActions: [
            'Continue current management practices',
            'Address any specific concerns raised',
          ],
          confidence: 85,
        },
        {
          id: new ObjectId().toString(),
          title: 'Good Response Rate',
          description: `The survey achieved a ${completionRate.toFixed(1)}% completion rate, suggesting good engagement with the survey process.`,
          priority: 'low',
          category: 'engagement',
          recommendedActions: [
            'Maintain current survey frequency',
            'Consider follow-up surveys',
          ],
          confidence: 90,
        },
      ],
      recommendations: [
        {
          title: 'Maintain Current Practices',
          description:
            'Continue with current management and engagement practices as they are yielding positive results.',
          impact: 'medium',
          effort: 'low',
          category: 'management',
        },
        {
          title: 'Regular Survey Follow-ups',
          description:
            'Implement quarterly follow-up surveys to track changes in employee sentiment over time.',
          impact: 'high',
          effort: 'medium',
          category: 'surveying',
        },
      ],
      dateRange: {
        start: '2024-01-01',
        end: '2024-12-31',
      },
      sections: ['overview', 'demographics', 'insights', 'recommendations'],
    });

    const savedReport = await report.save();
    console.log('Saved report:', {
      id: savedReport._id,
      title: savedReport.title,
      metadata: savedReport.metadata,
      metrics: savedReport.metrics,
      demographics: savedReport.demographics,
      insights: savedReport.insights,
      recommendations: savedReport.recommendations,
      dateRange: savedReport.dateRange,
      sections: savedReport.sections,
    });

    return NextResponse.json({
      success: true,
      message: 'Test report created with populated data',
      data: {
        reportId: report._id,
        title: report.title,
        metadata: report.metadata,
        metrics: report.metrics,
        demographics: report.demographics,
        insights: report.insights,
        recommendations: report.recommendations,
        dateRange: report.dateRange,
        sections: report.sections,
        surveyTitle: survey.title,
        totalResponses: totalResponses,
        avgSatisfaction: avgSatisfaction,
        completionRate: completionRate,
      },
    });
  } catch (error) {
    console.error('Create test report error:', error);
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
