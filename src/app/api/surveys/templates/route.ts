import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import SurveyTemplate from '@/models/SurveyTemplate';
import { hasFeaturePermission } from '@/lib/permissions';

// Get survey templates
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const isPublic = searchParams.get('public') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Build query
    const query: any = {};

    if (isPublic) {
      query.is_public = true;
    } else {
      // Show user's templates and public templates
      query.$or = [
        { created_by: session.user.id },
        { company_id: session.user.companyId },
        { is_public: true },
      ];
    }

    if (category) {
      query.category = category;
    }

    const templates = await SurveyTemplate.find(query)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .populate('created_by', 'name email');

    const total = await SurveyTemplate.countDocuments(query);

    return NextResponse.json({
      templates,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching survey templates:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Create survey template
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permissions
    if (!hasFeaturePermission(session.user.role, 'CREATE_SURVEYS')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();

    const body = await request.json();
    const {
      name,
      description,
      category,
      questions,
      demographics,
      settings,
      is_public = false,
      tags = [],
    } = body;

    // Validate required fields
    if (!name || !questions || questions.length === 0) {
      return NextResponse.json(
        { error: 'Name and questions are required' },
        { status: 400 }
      );
    }

    const template = new SurveyTemplate({
      name,
      description,
      category,
      questions,
      demographics: demographics || [],
      settings: {
        anonymous: false,
        allow_partial_responses: true,
        randomize_questions: false,
        show_progress: true,
        auto_save: true,
        ...settings,
      },
      is_public,
      tags,
      created_by: session.user.id,
      company_id: session.user.companyId,
    });

    await template.save();

    return NextResponse.json(
      {
        success: true,
        template: {
          id: template._id,
          name: template.name,
          category: template.category,
          is_public: template.is_public,
          created_at: template.created_at,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating survey template:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
