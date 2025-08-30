import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import QuestionBank from '@/models/QuestionBank';
import { connectDB } from '@/lib/db';
import { hasPermission, hasStringPermission } from '@/lib/permissions';

// GET /api/question-bank/[id] - Get specific question with variations
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasStringPermission(session.user.role, 'manage_questions')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;

    const { searchParams } = new URL(request.url);
    const includeVariations = searchParams.get('include_variations') === 'true';

    const question = await QuestionBank.findById(id);
    if (!question) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    // Check access permissions
    if (
      question.company_id &&
      session.user.role !== 'super_admin' &&
      question.company_id !== session.user.companyId
    ) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    let response: any = question.toObject();

    if (includeVariations) {
      const variations = await question.getVariations();
      response.variations = variations;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching question:', error);
    return NextResponse.json(
      { error: 'Failed to fetch question' },
      { status: 500 }
    );
  }
}

// PUT /api/question-bank/[id] - Update question
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasStringPermission(session.user.role, 'manage_questions')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    await connectDB();
    const { id } = await params;

    const question = await QuestionBank.findById(id);
    if (!question) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    // Check access permissions
    if (
      question.company_id &&
      session.user.role !== 'super_admin' &&
      question.company_id !== session.user.companyId
    ) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

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
      is_active,
    } = body;

    // Update fields
    if (text !== undefined) question.text = text;
    if (type !== undefined) question.type = type;
    if (category !== undefined) question.category = category;
    if (subcategory !== undefined) question.subcategory = subcategory;
    if (options !== undefined) question.options = options;
    if (scale_min !== undefined) question.scale_min = scale_min;
    if (scale_max !== undefined) question.scale_max = scale_max;
    if (scale_labels !== undefined) question.scale_labels = scale_labels;
    if (tags !== undefined) question.tags = tags;
    if (industry !== undefined) question.industry = industry;
    if (company_size !== undefined) question.company_size = company_size;
    if (is_active !== undefined) question.is_active = is_active;

    // Increment version for significant changes
    if (text || type || options) {
      question.version += 1;
    }

    await question.save();

    return NextResponse.json(question);
  } catch (error) {
    console.error('Error updating question:', error);
    return NextResponse.json(
      { error: 'Failed to update question' },
      { status: 500 }
    );
  }
}

// DELETE /api/question-bank/[id] - Soft delete question
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasStringPermission(session.user.role, 'manage_questions')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    await connectDB();
    const { id } = await params;

    const question = await QuestionBank.findById(id);
    if (!question) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    // Check access permissions
    if (
      question.company_id &&
      session.user.role !== 'super_admin' &&
      question.company_id !== session.user.companyId
    ) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Soft delete by setting is_active to false
    question.is_active = false;
    await question.save();

    return NextResponse.json({ message: 'Question deactivated successfully' });
  } catch (error) {
    console.error('Error deleting question:', error);
    return NextResponse.json(
      { error: 'Failed to delete question' },
      { status: 500 }
    );
  }
}
