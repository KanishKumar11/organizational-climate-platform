import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import Survey from '@/models/Survey';
import Company from '@/models/Company';
import AuditLog from '@/models/AuditLog';

// GET /api/profile/activity - Get user activity timeline
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    await connectToDatabase();

    const userId = session.user.id;

    console.log('Fetching activity for user:', userId);

    // Get user's surveys with activity data
    const surveys = await Survey.find({ created_by: userId })
      .populate('company_id', 'name')
      .sort({ created_at: -1 })
      .limit(limit)
      .skip(offset)
      .select('title status created_at updated_at response_count company_id')
      .lean();

    console.log('Found surveys:', surveys.length);

    // Get user's company admin activities
    const companies = await Company.find({ admin: userId })
      .sort({ created_at: -1 })
      .limit(limit)
      .skip(offset)
      .select('name created_at updated_at')
      .lean();

    console.log('Found companies:', companies.length);

    // Get user's audit log activities (logins, logouts, etc.)
    const auditLogs = await AuditLog.find({ user_id: userId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .skip(offset)
      .select('action resource resource_id details timestamp success')
      .lean();

    console.log('Found audit logs:', auditLogs.length);

    // Combine and sort activities
    const activities = [
      ...surveys.map((survey) => ({
        id: survey._id.toString(),
        type: 'survey_created' as const,
        title: `Created survey "${survey.title}"`,
        description: survey.company_id
          ? `For company: ${(survey.company_id as any).name}`
          : 'Survey created',
        timestamp: survey.created_at,
        status: survey.status,
        metadata: {
          surveyId: survey._id.toString(),
          responseCount: survey.response_count || 0,
        },
      })),
      ...surveys
        .filter(
          (survey) => survey.updated_at && survey.updated_at > survey.created_at
        )
        .map((survey) => ({
          id: `${survey._id.toString()}_updated`,
          type: 'survey_updated' as const,
          title: `Updated survey "${survey.title}"`,
          description: 'Survey configuration modified',
          timestamp: survey.updated_at,
          status: survey.status,
          metadata: {
            surveyId: survey._id.toString(),
          },
        })),
      ...companies.map((company) => ({
        id: company._id.toString(),
        type: 'company_created' as const,
        title: `Created company "${company.name}"`,
        description: 'Company administration setup',
        timestamp: company.created_at,
        metadata: {
          companyId: company._id.toString(),
        },
      })),
      ...auditLogs.map((log) => {
        let title = '';
        let description = '';
        let type = log.action as string;

        switch (log.action) {
          case 'login':
            title = 'Logged in';
            description = 'Successfully signed into the system';
            type = 'login';
            break;
          case 'logout':
            title = 'Logged out';
            description = 'Signed out of the system';
            type = 'logout';
            break;
          case 'update':
            if (log.resource === 'user') {
              title = 'Updated profile';
              description = 'Profile information modified';
              type = 'profile_updated';
            } else {
              title = `Updated ${log.resource}`;
              description = `${log.resource} was modified`;
              type = log.action;
            }
            break;
          case 'create':
            title = `Created ${log.resource}`;
            description = `New ${log.resource} was created`;
            type = log.action;
            break;
          case 'delete':
            title = `Deleted ${log.resource}`;
            description = `${log.resource} was removed`;
            type = log.action;
            break;
          case 'export':
            title = `Exported ${log.resource} data`;
            description = 'Data export completed';
            type = 'export';
            break;
          default:
            title = `${log.action.replace(/_/g, ' ')}`;
            description = `Action performed on ${log.resource}`;
            type = log.action;
        }

        return {
          id: log._id.toString(),
          type,
          title,
          description,
          timestamp: log.timestamp,
          success: log.success,
          metadata: {
            resource: log.resource,
            resource_id: log.resource_id,
            details: log.details,
          },
        };
      }),
    ];

    // Sort by timestamp (most recent first)
    activities.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    console.log('Total activities before pagination:', activities.length);

    // Apply pagination
    const paginatedActivities = activities.slice(offset, offset + limit);

    console.log('Returning activities:', paginatedActivities.length);

    return NextResponse.json({
      activities: paginatedActivities,
      total: activities.length,
      hasMore: offset + limit < activities.length,
    });
  } catch (error) {
    console.error('Error fetching activity:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
