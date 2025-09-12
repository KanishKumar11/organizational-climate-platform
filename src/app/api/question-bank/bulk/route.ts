import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import QuestionBank from '@/models/QuestionBank';
import { connectDB } from '@/lib/db';
import { hasStringPermission } from '@/lib/permissions';
import { z } from 'zod';

// Validation schema for bulk operations
const bulkOperationSchema = z.object({
  operation: z.enum(['create', 'update', 'delete', 'activate', 'deactivate']),
  questions: z.array(z.any()).optional(),
  question_ids: z.array(z.string()).optional(),
  filters: z
    .object({
      category: z.string().optional(),
      subcategory: z.string().optional(),
      type: z.string().optional(),
      tags: z.array(z.string()).optional(),
      effectiveness_threshold: z.number().optional(),
    })
    .optional(),
});

// POST /api/question-bank/bulk - Bulk operations on questions
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permissions - only admins can perform bulk operations
    if (!hasStringPermission(session.user.role, 'manage_questions')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    await connectDB();

    const body = await request.json();
    const { operation, questions, question_ids, filters } =
      bulkOperationSchema.parse(body);

    let result;

    switch (operation) {
      case 'create':
        result = await bulkCreateQuestions(questions || [], session.user);
        break;
      case 'update':
        result = await bulkUpdateQuestions(
          question_ids || [],
          body.updates,
          session.user
        );
        break;
      case 'delete':
        result = await bulkDeleteQuestions(question_ids || [], session.user);
        break;
      case 'activate':
        result = await bulkActivateQuestions(question_ids || [], session.user);
        break;
      case 'deactivate':
        result = await bulkDeactivateQuestions(
          question_ids || [],
          session.user
        );
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid operation' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      operation,
      result,
    });
  } catch (error) {
    console.error('Error performing bulk operation:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to perform bulk operation' },
      { status: 500 }
    );
  }
}

async function bulkCreateQuestions(questions: any[], user: any) {
  const validQuestions = questions.map((q) => ({
    ...q,
    created_by: user.id,
    company_id: user.role === 'company_admin' ? user.companyId : undefined,
    is_ai_generated: false,
  }));

  const result = await QuestionBank.insertMany(validQuestions, {
    ordered: false,
  });

  return {
    created: result.length,
    questions: result,
  };
}

async function bulkUpdateQuestions(
  questionIds: string[],
  updates: any,
  user: any
) {
  // Build query with proper scoping
  let query: any = { _id: { $in: questionIds } };

  if (user.role === 'company_admin') {
    query.$or = [
      { company_id: user.companyId },
      { company_id: { $exists: false } },
    ];
  }

  const result = await QuestionBank.updateMany(query, {
    $set: {
      ...updates,
      updated_at: new Date(),
      updated_by: user.id,
    },
  });

  return {
    matched: result.matchedCount,
    modified: result.modifiedCount,
  };
}

async function bulkDeleteQuestions(questionIds: string[], user: any) {
  // Build query with proper scoping
  let query: any = { _id: { $in: questionIds } };

  if (user.role === 'company_admin') {
    query.company_id = user.companyId;
  }

  // Soft delete by marking as inactive
  const result = await QuestionBank.updateMany(query, {
    $set: {
      is_active: false,
      deleted_at: new Date(),
      deleted_by: user.id,
    },
  });

  return {
    matched: result.matchedCount,
    deleted: result.modifiedCount,
  };
}

async function bulkActivateQuestions(questionIds: string[], user: any) {
  let query: any = { _id: { $in: questionIds } };

  if (user.role === 'company_admin') {
    query.$or = [
      { company_id: user.companyId },
      { company_id: { $exists: false } },
    ];
  }

  const result = await QuestionBank.updateMany(query, {
    $set: {
      is_active: true,
      updated_at: new Date(),
      updated_by: user.id,
    },
  });

  return {
    matched: result.matchedCount,
    activated: result.modifiedCount,
  };
}

async function bulkDeactivateQuestions(questionIds: string[], user: any) {
  let query: any = { _id: { $in: questionIds } };

  if (user.role === 'company_admin') {
    query.$or = [
      { company_id: user.companyId },
      { company_id: { $exists: false } },
    ];
  }

  const result = await QuestionBank.updateMany(query, {
    $set: {
      is_active: false,
      updated_at: new Date(),
      updated_by: user.id,
    },
  });

  return {
    matched: result.matchedCount,
    deactivated: result.modifiedCount,
  };
}
