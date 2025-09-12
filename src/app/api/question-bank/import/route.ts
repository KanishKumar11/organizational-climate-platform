import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import QuestionBank from '@/models/QuestionBank';
import { connectDB } from '@/lib/db';
import { hasStringPermission } from '@/lib/permissions';
import { z } from 'zod';

// Validation schema for question import
const importQuestionSchema = z.object({
  text: z.string().min(1, 'Question text is required'),
  type: z.enum([
    'likert',
    'multiple_choice',
    'ranking',
    'open_ended',
    'yes_no',
    'rating',
  ]),
  category: z.string().min(1, 'Category is required'),
  subcategory: z.string().optional(),
  options: z.array(z.string()).optional(),
  scale_min: z.number().optional(),
  scale_max: z.number().optional(),
  scale_labels: z
    .object({
      min: z.string().optional(),
      max: z.string().optional(),
      middle: z.string().optional(),
    })
    .optional(),
  tags: z.array(z.string()).default([]),
  industry: z.string().optional(),
  company_size: z.string().optional(),
  is_active: z.boolean().default(true),
});

const importRequestSchema = z.object({
  questions: z.array(importQuestionSchema),
  source: z.string().default('Manual Import'),
  validate_duplicates: z.boolean().default(true),
  skip_invalid: z.boolean().default(false),
});

// POST /api/question-bank/import - Import questions from external sources
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permissions - only admins can import questions
    if (!hasStringPermission(session.user.role, 'manage_questions')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    await connectDB();

    const body = await request.json();
    const { questions, source, validate_duplicates, skip_invalid } =
      importRequestSchema.parse(body);

    const importResults = {
      total: questions.length,
      imported: 0,
      skipped: 0,
      errors: [] as any[],
      duplicates: [] as any[],
    };

    const questionsToImport = [];

    for (let i = 0; i < questions.length; i++) {
      const questionData = questions[i];

      try {
        // Check for duplicates if validation is enabled
        if (validate_duplicates) {
          const existingQuestion = await QuestionBank.findOne({
            text: { $regex: new RegExp(`^${questionData.text.trim()}$`, 'i') },
            category: questionData.category,
            $or: [
              { company_id: session.user.companyId },
              { company_id: { $exists: false } },
            ],
          });

          if (existingQuestion) {
            importResults.duplicates.push({
              index: i,
              text: questionData.text,
              existing_id: existingQuestion._id,
            });
            importResults.skipped++;
            continue;
          }
        }

        // Prepare question for import
        const questionToImport = {
          ...questionData,
          created_by: session.user.id,
          company_id:
            session.user.role === 'company_admin'
              ? session.user.companyId
              : undefined,
          is_ai_generated: false,
          source,
          metrics: {
            usage_count: 0,
            insight_score: 5, // Default neutral score
            response_rate: 0,
            last_used: null,
          },
        };

        questionsToImport.push(questionToImport);
      } catch (validationError) {
        if (skip_invalid) {
          importResults.errors.push({
            index: i,
            text: questionData.text,
            error:
              validationError instanceof Error
                ? validationError.message
                : 'Validation failed',
          });
          importResults.skipped++;
        } else {
          throw validationError;
        }
      }
    }

    // Import valid questions
    if (questionsToImport.length > 0) {
      try {
        const result = await QuestionBank.insertMany(questionsToImport, {
          ordered: false,
        });
        importResults.imported = result.length;
      } catch (insertError) {
        // Handle partial insertion errors
        if (insertError.writeErrors) {
          importResults.imported =
            questionsToImport.length - insertError.writeErrors.length;
          importResults.errors.push(
            ...insertError.writeErrors.map((err: any) => ({
              index: err.index,
              error: err.errmsg,
            }))
          );
        } else {
          throw insertError;
        }
      }
    }

    return NextResponse.json({
      success: true,
      results: importResults,
    });
  } catch (error) {
    console.error('Error importing questions:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to import questions' },
      { status: 500 }
    );
  }
}

// GET /api/question-bank/import - Get import templates and examples
export async function GET(request: NextRequest) {
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

    // Return import template and examples
    const template = {
      format: 'JSON',
      required_fields: ['text', 'type', 'category'],
      optional_fields: [
        'subcategory',
        'options',
        'scale_min',
        'scale_max',
        'scale_labels',
        'tags',
        'industry',
        'company_size',
      ],
      supported_types: [
        'likert',
        'multiple_choice',
        'ranking',
        'open_ended',
        'yes_no',
        'rating',
      ],
      example: {
        text: 'How satisfied are you with your current work environment?',
        type: 'likert',
        category: 'Work Environment',
        subcategory: 'Physical Space',
        scale_min: 1,
        scale_max: 5,
        scale_labels: {
          min: 'Very Dissatisfied',
          max: 'Very Satisfied',
        },
        tags: ['satisfaction', 'environment', 'workplace'],
        industry: 'Technology',
        company_size: 'Medium',
        is_active: true,
      },
    };

    return NextResponse.json({
      success: true,
      template,
    });
  } catch (error) {
    console.error('Error getting import template:', error);
    return NextResponse.json(
      { error: 'Failed to get import template' },
      { status: 500 }
    );
  }
}
