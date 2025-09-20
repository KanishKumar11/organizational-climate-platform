import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Survey from '@/models/Survey';
import Response from '@/models/Response';
import SurveyInvitation from '@/models/SurveyInvitation';
import { sanitizeForSerialization } from '@/lib/datetime-utils';

// Get survey statistics
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

    // Get survey
    const survey = await Survey.findById(surveyId);
    if (!survey) {
      return NextResponse.json({ error: 'Survey not found' }, { status: 404 });
    }

    // Check permissions
    if (survey.company_id !== session.user.companyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get response statistics
    const totalResponses = await Response.countDocuments({
      survey_id: surveyId,
    });

    const completedResponses = await Response.countDocuments({
      survey_id: surveyId,
      is_complete: true,
    });

    const partialResponses = totalResponses - completedResponses;

    // Get invitation statistics
    const totalInvitations = await SurveyInvitation.countDocuments({
      survey_id: surveyId,
    });

    const openedInvitations = await SurveyInvitation.countDocuments({
      survey_id: surveyId,
      status: { $in: ['opened', 'responded'] },
    });

    const respondedInvitations = await SurveyInvitation.countDocuments({
      survey_id: surveyId,
      status: 'responded',
    });

    // Calculate rates
    const responseRate =
      totalInvitations > 0 ? (completedResponses / totalInvitations) * 100 : 0;
    const openRate =
      totalInvitations > 0 ? (openedInvitations / totalInvitations) * 100 : 0;
    const completionRate =
      totalResponses > 0 ? (completedResponses / totalResponses) * 100 : 0;

    // Get response timeline (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const responseTimeline = await Response.aggregate([
      {
        $match: {
          survey_id: surveyId,
          created_at: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$created_at' },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    // Get department breakdown if user has access
    let departmentBreakdown = null;
    if (
      session.user.role === 'super_admin' ||
      session.user.role === 'company_admin'
    ) {
      departmentBreakdown = await Response.aggregate([
        {
          $match: {
            survey_id: surveyId,
            is_complete: true,
          },
        },
        {
          $group: {
            _id: '$department_id',
            count: { $sum: 1 },
          },
        },
        {
          $sort: { count: -1 },
        },
      ]);
    }

    // Get average completion time
    const avgCompletionTime = await Response.aggregate([
      {
        $match: {
          survey_id: surveyId,
          is_complete: true,
          total_time_seconds: { $exists: true, $gt: 0 },
        },
      },
      {
        $group: {
          _id: null,
          avgTime: { $avg: '$total_time_seconds' },
        },
      },
    ]);

    const statistics = {
      survey: {
        id: survey._id,
        title: survey.title,
        status: survey.status,
        type: survey.type,
        start_date: survey.start_date,
        end_date: survey.end_date,
      },
      responses: {
        total: totalResponses,
        completed: completedResponses,
        partial: partialResponses,
        completion_rate: Math.round(completionRate * 100) / 100,
      },
      invitations: {
        total: totalInvitations,
        opened: openedInvitations,
        responded: respondedInvitations,
        open_rate: Math.round(openRate * 100) / 100,
        response_rate: Math.round(responseRate * 100) / 100,
      },
      engagement: {
        average_completion_time_seconds: avgCompletionTime[0]?.avgTime || null,
        response_timeline: responseTimeline.map((item) => ({
          date: item._id,
          responses: item.count,
        })),
      },
      demographics: {
        department_breakdown:
          departmentBreakdown?.map((item) => ({
            department_id: item._id || 'unknown',
            response_count: item.count,
          })) || null,
      },
      generated_at: new Date().toISOString(),
    };

    return NextResponse.json(sanitizeForSerialization(statistics));
  } catch (error) {
    console.error('Error fetching survey statistics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
