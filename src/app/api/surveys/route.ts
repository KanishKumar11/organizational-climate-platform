import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Survey from '@/models/Survey';
import { hasPermission } from '@/lib/permissions';

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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Build query
    let query: any = { company_id: session.user.companyId };

    if (type) query.type = type;
    if (status) query.status = status;

    // Get surveys
    const surveys = await Survey.find(query)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit);

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

    // Check permissions
    if (!hasPermission(session.user.role, 'company_admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

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
    } = body;

    // Create survey
    const survey = new Survey({
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
    });

    await survey.save();

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


