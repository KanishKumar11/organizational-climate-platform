import { NextRequest, NextResponse } from 'next/server';
import { reportSharingService } from '@/lib/report-sharing';
import { connectDB } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    // Verify this is a legitimate cron request
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.CRON_SECRET;

    if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Process all scheduled reports that are due
    await reportSharingService.processScheduledReports();

    return NextResponse.json({
      success: true,
      message: 'Scheduled reports processed',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Scheduled reports cron error:', error);
    return NextResponse.json(
      { error: 'Failed to process scheduled reports' },
      { status: 500 }
    );
  }
}

// Also allow GET for health checks
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    service: 'scheduled-reports-cron',
    timestamp: new Date().toISOString(),
  });
}


