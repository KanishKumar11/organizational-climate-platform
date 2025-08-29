import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Survey from '@/models/Survey';
import Response from '@/models/Response';

// Get real-time survey statistics
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

    const surveyId = params.id;

    // Get survey
    const survey = await Survey.findById(surveyId);
    if (!survey) {
      return NextResponse.json({ error: 'Survey not found' }, { status: 404 });
    }

    // Check permissions
    if (survey.company_id !== session.user.companyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Build response query with role-based filtering
    let responseQuery: any = { survey_id: surveyId };

    // Apply department filtering for department admins
    if (session.user.role === 'department_admin' && session.user.departmentId) {
      responseQuery.department_id = session.user.departmentId;
    }

    // Get response statistics
    const [
      totalResponses,
      completedResponses,
      inProgressResponses,
      recentResponses,
      hourlyStats,
    ] = await Promise.all([
      Response.countDocuments(responseQuery),
      Response.countDocuments({ ...responseQuery, is_complete: true }),
      Response.countDocuments({ ...responseQuery, is_complete: false }),
      getRecentResponses(responseQuery),
      getHourlyStats(responseQuery),
    ]);

    // Calculate rates
    const completionRate =
      totalResponses > 0 ? (completedResponses / totalResponses) * 100 : 0;
    const responseRate = survey.target_audience_count
      ? (totalResponses / survey.target_audience_count) * 100
      : null;

    return NextResponse.json({
      total_responses: totalResponses,
      completed_responses: completedResponses,
      in_progress_responses: inProgressResponses,
      completion_rate: completionRate,
      response_rate: responseRate,
      target_audience: survey.target_audience_count,
      recent_responses: recentResponses,
      hourly_stats: hourlyStats,
      last_updated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching real-time stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function getRecentResponses(baseQuery: any) {
  const responses = await Response.find({
    ...baseQuery,
    is_complete: true,
  })
    .sort({ completion_time: -1 })
    .limit(10)
    .select('_id completion_time department_id is_anonymous');

  return responses.map((response) => ({
    id: response._id.toString(),
    completed_at: response.completion_time || response.created_at,
    department: response.department_id,
    is_anonymous: response.is_anonymous,
  }));
}

async function getHourlyStats(baseQuery: any) {
  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // Generate hourly buckets for the last 24 hours
  const hourlyBuckets = [];
  for (let i = 23; i >= 0; i--) {
    const hour = new Date(now.getTime() - i * 60 * 60 * 1000);
    hourlyBuckets.push({
      hour: hour.getHours().toString().padStart(2, '0') + ':00',
      start: new Date(
        hour.getFullYear(),
        hour.getMonth(),
        hour.getDate(),
        hour.getHours()
      ),
      end: new Date(
        hour.getFullYear(),
        hour.getMonth(),
        hour.getDate(),
        hour.getHours() + 1
      ),
    });
  }

  // Get responses for each hour
  const hourlyStats = await Promise.all(
    hourlyBuckets.map(async (bucket) => {
      const count = await Response.countDocuments({
        ...baseQuery,
        is_complete: true,
        completion_time: {
          $gte: bucket.start,
          $lt: bucket.end,
        },
      });

      return {
        hour: bucket.hour,
        responses: count,
      };
    })
  );

  return hourlyStats;
}
