import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import QuestionBank from '@/models/QuestionBank';
import { connectDB } from '@/lib/db';
import { hasPermission, hasStringPermission } from '@/lib/permissions';

// GET /api/question-bank - Retrieve questions with filtering and search
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const subcategory = searchParams.get('subcategory');
    const type = searchParams.get('type');
    const tags = searchParams.get('tags')?.split(',');
    const search = searchParams.get('search');
    const industry = searchParams.get('industry');
    const companySize = searchParams.get('company_size');
    const popular = searchParams.get('popular') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');

    let query: any = { is_active: true };

    // Apply company scoping based on user role
    if (
      session.user.role === 'company_admin' ||
      session.user.role === 'department_admin'
    ) {
      query.$or = [
        { company_id: session.user.companyId },
        { company_id: { $exists: false } },
      ];
    } else {
      // Regular users can only see global questions
      query.company_id = { $exists: false };
    }

    // Apply filters
    if (category) query.category = category;
    if (subcategory) query.subcategory = subcategory;
    if (type) query.type = type;
    if (tags) query.tags = { $in: tags };
    if (industry) query.industry = industry;
    if (companySize) query.company_size = companySize;

    let questionsQuery;

    if (search) {
      // Text search across multiple fields
      query.$and = [
        query.$and || [],
        {
          $or: [
            { text: { $regex: search, $options: 'i' } },
            { category: { $regex: search, $options: 'i' } },
            { subcategory: { $regex: search, $options: 'i' } },
            { tags: { $in: [new RegExp(search, 'i')] } },
          ],
        },
      ];
    }

    if (popular) {
      questionsQuery = QuestionBank.find(query).sort({
        'metrics.usage_count': -1,
        'metrics.insight_score': -1,
      });
    } else {
      questionsQuery = QuestionBank.find(query).sort({
        category: 1,
        subcategory: 1,
        'metrics.insight_score': -1,
      });
    }

    const questions = await questionsQuery
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const total = await QuestionBank.countDocuments(query);

    return NextResponse.json({
      questions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch questions' },
      { status: 500 }
    );
  }
}

// POST /api/question-bank - Create new question
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permissions - only admins can create questions
    if (!hasStringPermission(session.user.role, 'manage_questions')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    await connectDB();

    const body = await request.json();
    const {
      text,
      type,
      category,
      subcategory,
      options,
      scale_min,
      scale_max,
      scale_labels,
      tags,
      industry,
      company_size,
    } = body;

    // Validate required fields
    if (!text || !type || !category) {
      return NextResponse.json(
        { error: 'Text, type, and category are required' },
        { status: 400 }
      );
    }

    const questionData: any = {
      text,
      type,
      category,
      subcategory,
      tags: tags || [],
      created_by: session.user.id,
      is_ai_generated: false,
    };

    // Add optional fields
    if (options) questionData.options = options;
    if (scale_min) questionData.scale_min = scale_min;
    if (scale_max) questionData.scale_max = scale_max;
    if (scale_labels) questionData.scale_labels = scale_labels;
    if (industry) questionData.industry = industry;
    if (company_size) questionData.company_size = company_size;

    // Set company scope for company admins
    if (session.user.role === 'company_admin') {
      questionData.company_id = session.user.companyId;
    }

    const question = new QuestionBank(questionData);
    await question.save();

    return NextResponse.json(question, { status: 201 });
  } catch (error) {
    console.error('Error creating question:', error);
    return NextResponse.json(
      { error: 'Failed to create question' },
      { status: 500 }
    );
  }
}
