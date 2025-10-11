import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Survey from '@/models/Survey';
import Response, {
  IQuestionResponse,
  IDemographicResponse,
} from '@/models/Response';
import SurveyInvitation from '@/models/SurveyInvitation';
import User from '@/models/User';
import { validateSurveyResponse } from '@/lib/validation';

// Submit survey response
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    const { id } = await params;
    const surveyId = id;

    const {
      responses,
      demographics,
      is_complete = false,
      session_id,
      invitation_token,
    } = body;

    await connectDB();

    // Get survey
    const survey = await Survey.findById(surveyId);
    if (!survey) {
      return NextResponse.json({ error: 'Survey not found' }, { status: 404 });
    }

    // Check if survey is active and can accept responses
    if (!survey.canAcceptResponses()) {
      return NextResponse.json(
        { error: 'Survey is not accepting responses' },
        { status: 400 }
      );
    }

    let userId: string | undefined;
    let companyId: string;
    let departmentId: string | undefined;
    let isAnonymous = survey.settings.anonymous;

    // Handle anonymous surveys, invitation token, or authenticated user
    if (invitation_token) {
      const invitation = await SurveyInvitation.findOne({ invitation_token });
      if (!invitation || invitation.survey_id !== surveyId) {
        return NextResponse.json(
          { error: 'Invalid invitation token' },
          { status: 400 }
        );
      }

      if (invitation.isExpired()) {
        return NextResponse.json(
          { error: 'Invitation has expired' },
          { status: 400 }
        );
      }

      userId = isAnonymous ? undefined : invitation.user_id;
      companyId = invitation.company_id;

      // Update invitation status
      if (invitation.status === 'sent' || invitation.status === 'opened') {
        invitation.markStarted();
        await invitation.save();
      }
    } else if (session?.user) {
      userId = session.user.id;
      companyId = session.user.companyId;
      departmentId = session.user.departmentId;
    } else if (isAnonymous) {
      // Allow anonymous responses for anonymous surveys
      userId = undefined;
      companyId = survey.company_id;
    } else {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get demographics from user or invitation
    let responseDemographics: any[] = [];
    if (userId && !isAnonymous) {
      // Get demographics from authenticated user
      const user = await User.findById(userId);
      if (user?.demographics) {
        // Convert user demographics object to response format
        responseDemographics = Object.entries(user.demographics).map(
          ([field, value]) => ({
            field,
            value,
          })
        );
      }
    } else if (invitation_token) {
      // Get demographics from invitation (for pre-assigned users)
      const invitation = await SurveyInvitation.findOne({ invitation_token });
      if (invitation?.user_id) {
        const user = await User.findById(invitation.user_id);
        if (user?.demographics) {
          responseDemographics = Object.entries(user.demographics).map(
            ([field, value]) => ({
              field,
              value,
            })
          );
        }
      }
    }

    // Validate responses (without demographics since we get them from user)
    const validationResult = validateSurveyResponse(
      survey,
      responses,
      responseDemographics // Use demographics from user instead of request
    );
    if (!validationResult.isValid) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.errors },
        { status: 400 }
      );
    }

    // Check for existing response
    let existingResponse = await Response.findOne({
      survey_id: surveyId,
      $or: [{ user_id: userId }, { session_id: session_id }].filter(Boolean),
    });

    if (existingResponse && existingResponse.is_complete && is_complete) {
      return NextResponse.json(
        { error: 'Response already submitted' },
        { status: 400 }
      );
    }

    if (existingResponse) {
      // Update existing response
      existingResponse.responses = responses;
      existingResponse.demographics = responseDemographics;
      existingResponse.is_complete = is_complete;

      if (is_complete) {
        existingResponse.complete();
      }

      await existingResponse.save();
    } else {
      // Create new response
      existingResponse = new Response({
        survey_id: surveyId,
        user_id: userId,
        session_id: session_id || `session_${Date.now()}_${Math.random()}`,
        company_id: companyId,
        department_id: departmentId,
        responses: responses,
        demographics: responseDemographics,
        is_complete: is_complete,
        is_anonymous: isAnonymous,
        start_time: new Date(),
        ip_address:
          request.headers.get('x-forwarded-for') ||
          request.headers.get('x-real-ip') ||
          'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown',
      });

      if (is_complete) {
        existingResponse.complete();
      }

      await existingResponse.save();
    }

    // Update survey response count if completed
    if (is_complete) {
      await Survey.findByIdAndUpdate(surveyId, {
        $inc: { response_count: 1 },
      });

      // Update invitation status if using token
      if (invitation_token) {
        const invitation = await SurveyInvitation.findOne({ invitation_token });
        if (invitation) {
          invitation.markCompleted();
          await invitation.save();
        }
      }
    }

    return NextResponse.json({
      success: true,
      response_id: existingResponse._id,
      is_complete: existingResponse.is_complete,
      session_id: existingResponse.session_id,
    });
  } catch (error) {
    console.error('Error submitting survey response:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get survey responses (for admins)
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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    // Get survey
    const survey = await Survey.findById(surveyId);
    if (!survey) {
      return NextResponse.json({ error: 'Survey not found' }, { status: 404 });
    }

    // Check permissions
    if (survey.company_id !== session.user.companyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get responses
    const responses = await Response.find({ survey_id: surveyId })
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit);

    const totalResponses = await Response.countDocuments({
      survey_id: surveyId,
    });
    const completedResponses = await Response.countDocuments({
      survey_id: surveyId,
      is_complete: true,
    });

    return NextResponse.json({
      responses,
      pagination: {
        page,
        limit,
        total: totalResponses,
        pages: Math.ceil(totalResponses / limit),
      },
      stats: {
        total: totalResponses,
        completed: completedResponses,
        in_progress: totalResponses - completedResponses,
        completion_rate:
          totalResponses > 0 ? (completedResponses / totalResponses) * 100 : 0,
      },
    });
  } catch (error) {
    console.error('Error fetching survey responses:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
