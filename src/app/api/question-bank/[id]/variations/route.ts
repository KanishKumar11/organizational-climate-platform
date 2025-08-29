import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import QuestionBank from '@/models/QuestionBank';
import { connectDB } from '@/lib/db';
import { hasPermission } from '@/lib/permissions';

// GET /api/question-bank/[id]/variations - Get all variations of a question
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

    const parentQuestion = await QuestionBank.findById(id);
    if (!parentQuestion) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    // Check access permissions
    if (
      parentQuestion.company_id &&
      session.user.role !== 'super_admin' &&
      parentQuestion.company_id !== session.user.companyId
    ) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const variations = await parentQuestion.getVariations();

    return NextResponse.json({
      parent_question: {
        id: parentQuestion._id,
        text: parentQuestion.text,
        version: parentQuestion.version,
      },
      variations: variations.map((v: any) => ({
        id: v._id,
        text: v.text,
        version: v.version,
        created_by: v.created_by,
        created_at: v.created_at,
        metrics: v.metrics,
        is_ai_generated: v.is_ai_generated,
      })),
    });
  } catch (error) {
    console.error('Error fetching question variations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch question variations' },
      { status: 500 }
    );
  }
}

// POST /api/question-bank/[id]/variations - Create new variation of a question
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(session.user.role, 'manage_questions')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    await connectDB();
    const { id } = await params;

    const parentQuestion = await QuestionBank.findById(id);
    if (!parentQuestion) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    // Check access permissions
    if (
      parentQuestion.company_id &&
      session.user.role !== 'super_admin' &&
      parentQuestion.company_id !== session.user.companyId
    ) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const body = await request.json();
    const { text, is_ai_generated = false } = body;

    if (!text) {
      return NextResponse.json(
        { error: 'Question text is required' },
        { status: 400 }
      );
    }

    const variation = await parentQuestion.createVariation(
      text,
      session.user.id
    );

    // Mark as AI-generated if specified
    if (is_ai_generated) {
      variation.is_ai_generated = true;
      await variation.save();
    }

    return NextResponse.json(variation, { status: 201 });
  } catch (error) {
    console.error('Error creating question variation:', error);
    return NextResponse.json(
      { error: 'Failed to create question variation' },
      { status: 500 }
    );
  }
}
