import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import Survey from '@/models/Survey';
import Response from '@/models/Response';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const userId = session.user.id;
    const companyId = session.user.companyId;

    // Find surveys that are assigned to this user or their department
    const surveys = await Survey.find({
      company_id: companyId,
      status: { $in: ['active', 'completed'] },
      $or: [
        { assigned_users: userId },
        { target_departments: session.user.departmentId },
        { is_company_wide: true },
      ],
    }).sort({ created_at: -1 });

    // Get user's response status for each survey
    const surveyIds = surveys.map((s) => s._id);
    const userResponses = await Response.find({
      survey_id: { $in: surveyIds },
      user_id: userId,
    });

    const responseMap = new Map();
    userResponses.forEach((response) => {
      responseMap.set(response.survey_id.toString(), response);
    });

    // Enrich surveys with user's response status
    const enrichedSurveys = surveys.map((survey) => {
      const userResponse = responseMap.get(survey._id.toString());

      let responseStatus = 'not_started';
      let responseId = undefined;

      if (userResponse) {
        if (userResponse.status === 'completed') {
          responseStatus = 'completed';
        } else {
          responseStatus = 'in_progress';
        }
        responseId = userResponse._id.toString();
      }

      // Calculate priority based on expiration and survey type
      let priority = 'medium';
      const expiresAt = (survey as any).expires_at || survey.end_date;
      if (expiresAt) {
        const daysUntilExpiry = Math.ceil(
          (new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );
        if (daysUntilExpiry <= 3) {
          priority = 'high';
        } else if (daysUntilExpiry > 14) {
          priority = 'low';
        }
      }

      return {
        _id: survey._id,
        title: survey.title,
        description: survey.description,
        status: survey.status,
        type: survey.type || 'custom',
        created_at: survey.created_at,
        expires_at: expiresAt,
        response_count: survey.response_count || 0,
        target_responses:
          (survey as any).target_responses ||
          (survey as any).target_audience_count ||
          0,
        completion_rate: (survey as any).completion_rate || 0,
        is_assigned_to_me: true,
        my_response_status: responseStatus,
        my_response_id: responseId,
        estimated_duration: (survey as any).estimated_duration || 10,
        priority: priority,
      };
    });

    return NextResponse.json({
      success: true,
      surveys: enrichedSurveys,
      count: enrichedSurveys.length,
    });
  } catch (error) {
    console.error('Error fetching user surveys:', error);
    return NextResponse.json(
      { error: 'Failed to fetch surveys' },
      { status: 500 }
    );
  }
}
