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

    // Create a minimal report with only required fields
    const report = new Report({
      title: 'Minimal Test Report',
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
        include_charts: false,
        include_raw_data: false,
        include_ai_insights: false,
        include_recommendations: false,
      },
      status: 'generating',
      format: 'pdf',
      is_recurring: false,
    });

    const savedReport = await report.save();
    console.log('Minimal report saved:', {
      id: savedReport._id,
      title: savedReport.title,
      type: savedReport.type,
      status: savedReport.status,
    });

    return NextResponse.json({
      success: true,
      message: 'Minimal test report created',
      data: {
        reportId: savedReport._id,
        title: savedReport.title,
        type: savedReport.type,
        status: savedReport.status,
      },
    });
  } catch (error) {
    console.error('Minimal test report creation error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to create minimal test report',
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
