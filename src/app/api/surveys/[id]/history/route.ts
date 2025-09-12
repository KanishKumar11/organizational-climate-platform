import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Survey from '@/models/Survey';
import SurveyVersion from '@/models/SurveyVersion';
import AuditLog from '@/models/AuditLog';

// Get survey history and audit trail
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;

    const surveyId = id;
    const { searchParams } = new URL(request.url);
    const includeVersions = searchParams.get('versions') === 'true';
    const includeAuditLog = searchParams.get('audit') === 'true';

    // Get survey
    const survey = await Survey.findById(surveyId);
    if (!survey) {
      return NextResponse.json({ error: 'Survey not found' }, { status: 404 });
    }

    // Check permissions
    if (survey.company_id !== session.user.companyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const history: any = {
      survey: {
        id: survey._id,
        title: survey.title,
        current_version: survey.version || 1,
        status: survey.status,
        created_at: survey.created_at,
        updated_at: survey.updated_at,
      },
    };

    // Get version history if requested
    if (includeVersions) {
      const versions = await SurveyVersion.find({ survey_id: surveyId })
        .sort({ version_number: -1 })
        .populate('created_by', 'name email')
        .select('version_number title changes reason created_by created_at');

      history.versions = versions;
    }

    // Get audit log if requested
    if (includeAuditLog) {
      const auditLogs = await AuditLog.find({
        resource_type: 'survey',
        resource_id: surveyId,
      })
        .sort({ timestamp: -1 })
        .limit(50)
        .populate('user_id', 'name email');

      history.audit_log = auditLogs;
    }

    // Get key milestones
    const milestones = [];

    // Survey creation
    milestones.push({
      type: 'created',
      date: survey.created_at,
      description: 'Survey created',
      user: survey.created_by,
    });

    // Status changes (from audit log if available)
    if (includeAuditLog) {
      const statusChanges = await AuditLog.find({
        resource_type: 'survey',
        resource_id: surveyId,
        action: 'status_change',
      })
        .sort({ timestamp: 1 })
        .populate('user_id', 'name email');

      statusChanges.forEach((log) => {
        milestones.push({
          type: 'status_change',
          date: log.timestamp,
          description: `Status changed to ${(log.details as any)?.new_values?.status || 'unknown'}`,
          user: log.user_id,
          details: log.details,
        });
      });
    }

    // Sort milestones by date
    milestones.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    history.milestones = milestones;

    // Get statistics over time
    const Response = (await import('@/models/Response')).default;
    const responseStats = await Response.aggregate([
      {
        $match: {
          survey_id: surveyId,
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$created_at' },
          },
          count: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$is_complete', true] }, 1, 0] },
          },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    history.response_timeline = responseStats.map((stat) => ({
      date: stat._id,
      total_responses: stat.count,
      completed_responses: stat.completed,
    }));

    return NextResponse.json(history);
  } catch (error) {
    console.error('Error fetching survey history:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
