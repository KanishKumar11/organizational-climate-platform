import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { reportSharingService, ScheduleOptions } from '@/lib/report-sharing';
import { reportService } from '@/lib/report-service';
import { connectDB } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const {
      name,
      frequency,
      dayOfWeek,
      dayOfMonth,
      time,
      timezone,
      recipients,
      format,
      includeExecutiveSummary,
    } = await request.json();

    // Validate input
    if (
      !name ||
      !frequency ||
      !time ||
      !recipients ||
      !Array.isArray(recipients)
    ) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!['daily', 'weekly', 'monthly', 'quarterly'].includes(frequency)) {
      return NextResponse.json({ error: 'Invalid frequency' }, { status: 400 });
    }

    if (!['pdf', 'excel'].includes(format)) {
      return NextResponse.json({ error: 'Invalid format' }, { status: 400 });
    }

    // Validate time format (HH:MM)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(time)) {
      return NextResponse.json(
        { error: 'Invalid time format' },
        { status: 400 }
      );
    }

    // Check if user has permission to schedule reports
    const report = await reportService.getReport(params.id, session.user.id);
    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    const canSchedule =
      report.createdBy === session.user.id ||
      session.user.role === 'super_admin' ||
      session.user.role === 'company_admin';

    if (!canSchedule) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const scheduleOptions: ScheduleOptions = {
      frequency,
      dayOfWeek,
      dayOfMonth,
      time,
      timezone: timezone || 'UTC',
      recipients,
      format: format || 'pdf',
      includeExecutiveSummary: includeExecutiveSummary !== false,
    };

    const scheduledReport = await reportSharingService.scheduleReport(
      params.id,
      name,
      scheduleOptions,
      session.user.id
    );

    return NextResponse.json({
      success: true,
      scheduleId: scheduledReport.id,
      nextSend: scheduledReport.nextSend,
    });
  } catch (error) {
    console.error('Schedule report error:', error);
    return NextResponse.json(
      { error: 'Failed to schedule report' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Get scheduled reports for this report
    // This would fetch from database
    const scheduledReports = []; // Placeholder

    return NextResponse.json({ scheduledReports });
  } catch (error) {
    console.error('Get scheduled reports error:', error);
    return NextResponse.json(
      { error: 'Failed to get scheduled reports' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const scheduleId = searchParams.get('scheduleId');

    if (!scheduleId) {
      return NextResponse.json(
        { error: 'Schedule ID is required' },
        { status: 400 }
      );
    }

    // Check permissions and delete schedule
    // This would update the database to set isActive = false
    console.log('Deactivating scheduled report:', scheduleId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete scheduled report error:', error);
    return NextResponse.json(
      { error: 'Failed to delete scheduled report' },
      { status: 500 }
    );
  }
}
