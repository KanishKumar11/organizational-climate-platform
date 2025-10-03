import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import QuestionLibrary from '@/models/QuestionLibrary';
import QuestionCategory from '@/models/QuestionCategory';

/**
 * GET Single Question
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const question = await (QuestionLibrary as any).findById(params.id).lean();

    if (!question) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      question: {
        ...question,
        _id: question._id.toString(),
        category_id: question.category_id.toString(),
      },
    });

  } catch (error) {
    console.error('Get question error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT Update Question
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();

    await connectDB();

    const question = await (QuestionLibrary as any).findById(params.id);

    if (!question) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    // Update fields
    if (body.question_text_es) question.question_text_es = body.question_text_es;
    if (body.question_text_en) question.question_text_en = body.question_text_en;
    if (body.question_type) question.question_type = body.question_type;
    if (body.options_es) question.options_es = body.options_es;
    if (body.options_en) question.options_en = body.options_en;
    if (body.is_required !== undefined) question.is_required = body.is_required;
    if (body.is_active !== undefined) question.is_active = body.is_active;

    // Handle category change
    if (body.category_id && body.category_id !== question.category_id.toString()) {
      // Verify new category exists
      const newCategory = await (QuestionCategory as any).findById(body.category_id);
      if (!newCategory) {
        return NextResponse.json(
          { error: 'Category not found' },
          { status: 404 }
        );
      }

      // Update counts
      await (QuestionCategory as any).findByIdAndUpdate(
        question.category_id,
        { $inc: { question_count: -1 } }
      );
      await (QuestionCategory as any).findByIdAndUpdate(
        body.category_id,
        { $inc: { question_count: 1 } }
      );

      question.category_id = body.category_id;
    }

    await question.save();

    return NextResponse.json({
      success: true,
      question: {
        _id: question._id.toString(),
        ...question.toObject(),
      },
    });

  } catch (error) {
    console.error('Update question error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE Question
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const question = await (QuestionLibrary as any).findById(params.id);

    if (!question) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    // Decrement category count
    await (QuestionCategory as any).findByIdAndUpdate(
      question.category_id,
      { $inc: { question_count: -1 } }
    );

    // Delete question
    await (QuestionLibrary as any).findByIdAndDelete(params.id);

    return NextResponse.json({
      success: true,
      message: 'Question deleted successfully',
    });

  } catch (error) {
    console.error('Delete question error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
