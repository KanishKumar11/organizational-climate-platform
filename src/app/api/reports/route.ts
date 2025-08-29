import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import Report from '@/models/Report';
import { ReportService } from '@/lib/report-service';
import { checkPermissions } from '@/lib/permissions';

// GET /api/reports - Get reports for user's company
export async function GET(request: NextRequest) {
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

    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const type = searchParams.get('type');
    const status = searchParams.get('status');

    // Build query based on user role
    let query: any = {};

    if (session.user.role === 'super_admin') {
      // Super admin can see all reports
    } else {
      // Other roles see only their company's reports
      query.company_id = session.user.company_id;
    }

    if (type) query.type = type;
    if (status) query.status = status;

    const skip = (page - 1) * limit;

    const [reports, total] = await Promise.all([
      Report.find(query)
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Report.countDocuments(query),
    ]);

    return NextResponse.json({
      reports,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}

// POST /api/reports - Create new report
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
    const {
      title,
      description,
      type,
      template_id,
      filters,
      config,
      format,
      scheduled_for,
      is_recurring,
      recurrence_pattern,
    } = body;

    // Validate required fields
    if (!title || !type || !filters || !format) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate filters
    const validation = ReportService.validateFilters(filters);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: 'Invalid filters', details: validation.errors },
        { status: 400 }
      );
    }

    await connectDB();

    // Create report
    const report = new Report({
      title,
      description,
      type,
      company_id: session.user.company_id,
      created_by: session.user.id,
      template_id,
      filters,
      config: config || {
        include_charts: true,
        include_raw_data: false,
        include_ai_insights: true,
        include_recommendations: true,
      },
      format,
      status: scheduled_for ? 'scheduled' : 'generating',
      scheduled_for: scheduled_for ? new Date(scheduled_for) : undefined,
      is_recurring: is_recurring || false,
      recurrence_pattern,
    });

    await report.save();

    // If not scheduled, start generation immediately
    if (!scheduled_for) {
      // In a real implementation, this would trigger a background job
      // For now, we'll mark it as completed immediately
      setTimeout(async () => {
        try {
          await report.markAsStarted();

          // Generate report data
          const reportData = await ReportService.generateReportData(
            filters,
            config,
            session.user.company_id
          );

          // In a real implementation, you would generate the actual file here
          const filePath = `/reports/${report._id}.${format}`;
          const fileSize = 1024 * 1024; // Mock file size

          await report.markAsCompleted(filePath, fileSize);
        } catch (error) {
          console.error('Report generation failed:', error);
          await report.markAsFailed(
            error instanceof Error ? error.message : 'Unknown error'
          );
        }
      }, 1000);
    }

    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    console.error('Error creating report:', error);
    return NextResponse.json(
      { error: 'Failed to create report' },
      { status: 500 }
    );
  }
}
