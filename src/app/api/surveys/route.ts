import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import Survey from '@/models/Survey';
import { hasPermission, hasFeaturePermission } from '@/lib/permissions';

// Get surveys
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);
    const skip = (page - 1) * limit;

    // Debug logging
    console.log('=== SURVEY GET DEBUG ===');
    console.log('Session user:', {
      id: session.user.id,
      email: session.user.email,
      role: session.user.role,
      companyId: session.user.companyId,
      departmentId: session.user.departmentId,
    });
    console.log('Query params:', { type, status, page, limit });

    // Build query
    const query: any = {};

    // Only filter by company if user has a companyId (super_admin might not have one)
    if (session.user.companyId) {
      query.company_id = session.user.companyId;
    } else if (session.user.role !== 'super_admin') {
      // Non-super-admin users must have a company
      console.log('ERROR: Non-super-admin user without companyId');
      return NextResponse.json(
        { error: 'User not associated with a company' },
        { status: 403 }
      );
    }

    if (type) query.type = type;
    if (status) query.status = status;

    // Add search functionality
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } },
      ];
    }

    console.log('Final query:', query);

    // Get surveys
    const surveys = await Survey.find(query)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit);

    console.log('Found surveys:', surveys.length);

    // Also check total surveys in database
    const totalSurveysInDB = await Survey.countDocuments({});
    console.log('Total surveys in database:', totalSurveysInDB);

    // Check surveys for this company specifically
    if (session.user.companyId) {
      const companySurveys = await Survey.find({
        company_id: session.user.companyId,
      });
      console.log('Surveys for this company:', companySurveys.length);
    }

    console.log('=== END SURVEY GET DEBUG ===');

    const total = await Survey.countDocuments(query);

    return NextResponse.json({
      surveys,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching surveys:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Create survey
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Debug session data
    console.log('=== SURVEY CREATION DEBUG ===');
    console.log('Full session object:', JSON.stringify(session, null, 2));
    console.log('Session user data:', {
      id: session.user.id,
      email: session.user.email,
      role: session.user.role,
      companyId: session.user.companyId,
      departmentId: session.user.departmentId,
      isActive: session.user.isActive,
    });

    // Check if role exists and is valid
    if (!session.user.role) {
      console.log('ERROR: No role found in session');
      return NextResponse.json(
        {
          error: 'Forbidden',
          details: 'No role found in user session',
        },
        { status: 403 }
      );
    }

    // If user is not super_admin in session, check database directly (in case session is stale)
    if (session.user.role !== 'super_admin') {
      console.log('User is not super_admin in session, checking database...');
      await connectDB();
      const User = (await import('@/models/User')).default;
      const dbUser = await User.findOne({ email: session.user.email });

      if (dbUser && dbUser.role === 'super_admin') {
        console.log('User is super_admin in database, updating session role');
        session.user.role = 'super_admin';
      }
    }

    // Check permissions - super_admin and company_admin can create surveys
    const hasPermission = hasFeaturePermission(
      session.user.role,
      'CREATE_SURVEYS'
    );
    console.log('Permission check:', {
      userRole: session.user.role,
      roleType: typeof session.user.role,
      hasCreateSurveysPermission: hasPermission,
      availableRoles: [
        'super_admin',
        'company_admin',
        'leader',
        'supervisor',
        'employee',
      ],
    });

    // Also check the ROLE_PERMISSIONS directly
    const { ROLE_PERMISSIONS } = await import('@/lib/permissions');
    console.log(
      'CREATE_SURVEYS allowed roles:',
      ROLE_PERMISSIONS.CREATE_SURVEYS
    );
    console.log(
      'User role in allowed roles:',
      ROLE_PERMISSIONS.CREATE_SURVEYS.includes(session.user.role)
    );

    if (!hasPermission) {
      console.log('PERMISSION DENIED for role:', session.user.role);
      return NextResponse.json(
        {
          error: 'Forbidden',
          details: `User role '${session.user.role}' does not have CREATE_SURVEYS permission. Allowed roles: ${ROLE_PERMISSIONS.CREATE_SURVEYS.join(', ')}`,
        },
        { status: 403 }
      );
    }

    console.log('Permission check PASSED');
    console.log('=== END DEBUG ===');

    await connectDB();

    const body = await request.json();
    const {
      title,
      description,
      type,
      questions,
      demographics,
      settings,
      start_date,
      end_date,
      department_ids,
      status,
    } = body;

    // Create survey
    const surveyData = {
      title,
      description,
      type,
      company_id: session.user.companyId,
      created_by: session.user.id,
      questions,
      demographics: demographics || [],
      settings: {
        anonymous: false,
        allow_partial_responses: true,
        randomize_questions: false,
        show_progress: true,
        auto_save: true,
        notification_settings: {
          send_invitations: true,
          send_reminders: true,
          reminder_frequency_days: 3,
        },
        ...settings,
      },
      start_date: new Date(start_date),
      end_date: new Date(end_date),
      department_ids: department_ids || [],
      status: status || 'draft', // Use provided status or default to 'draft'
    };

    console.log('Creating survey with data:', surveyData);

    const survey = new Survey(surveyData);
    await survey.save();

    console.log('Survey created successfully:', {
      id: survey._id,
      title: survey.title,
      company_id: survey.company_id,
      created_by: survey.created_by,
    });

    return NextResponse.json(
      {
        success: true,
        survey: {
          id: survey._id,
          title: survey.title,
          type: survey.type,
          status: survey.status,
          created_at: survey.created_at,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating survey:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
