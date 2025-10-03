import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import SurveyDraft from '@/models/SurveyDraft';
import SurveyAuditLog from '@/models/SurveyAuditLog';
import { z } from 'zod';

/**
 * Autosave API Endpoint
 *
 * Features:
 * - Optimistic concurrency control with version checking
 * - Partial updates (only modified step data)
 * - Audit log integration
 * - Request metadata tracking
 */

// Validation schemas for step data
const step1Schema = z.object({
  survey_type: z
    .enum(['climate', 'microclimate', 'culture', 'pulse'])
    .optional(),
  title: z.string().max(150).optional(),
  description: z.string().max(500).optional(),
  company_id: z.string().optional(),
  language: z.enum(['es', 'en']).optional(),
});

const step2Schema = z.object({
  questions: z.array(z.any()).optional(),
  question_ids: z.array(z.string()).optional(),
});

const step3Schema = z.object({
  targeting_type: z.enum(['master_data', 'csv_upload', 'manual']).optional(),
  department_ids: z.array(z.string()).optional(),
  target_user_ids: z.array(z.string()).optional(),
  demographic_filters: z.any().optional(),
  csv_data: z.any().optional(),
  audience_preview: z.any().optional(),
});

const step4Schema = z.object({
  schedule: z.any().optional(),
  distribution: z.any().optional(),
});

const autosaveSchema = z.object({
  current_step: z.number().int().min(1).max(4),
  version: z.number().int().min(1),
  step1_data: step1Schema.optional(),
  step2_data: step2Schema.optional(),
  step3_data: step3Schema.optional(),
  step4_data: step4Schema.optional(),
  last_edited_field: z.string().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate user
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const validationResult = autosaveSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const {
      current_step,
      version,
      step1_data,
      step2_data,
      step3_data,
      step4_data,
      last_edited_field,
    } = validationResult.data;

    // Connect to database
    await connectDB();

    // Find draft (cast to any to avoid Mongoose typing issues)
    const draft = await (SurveyDraft as any).findById(id);

    if (!draft) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }

    // Verify ownership
    if (draft.user_id.toString() !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden: You do not own this draft' },
        { status: 403 }
      );
    }

    // Optimistic concurrency check
    if (draft.version !== version) {
      return NextResponse.json(
        {
          error: 'Version conflict: Draft was modified by another session',
          server_version: draft.version,
          client_version: version,
        },
        { status: 409 }
      );
    }

    // Capture before state for audit
    const beforeState = {
      step: draft.current_step,
      step1_data: draft.step1_data,
      step2_data: draft.step2_data,
      step3_data: draft.step3_data,
      step4_data: draft.step4_data,
    };

    // Update only provided step data
    if (step1_data !== undefined) {
      draft.step1_data = { ...draft.step1_data, ...step1_data };
    }
    if (step2_data !== undefined) {
      draft.step2_data = { ...draft.step2_data, ...step2_data };
    }
    if (step3_data !== undefined) {
      draft.step3_data = { ...draft.step3_data, ...step3_data };
    }
    if (step4_data !== undefined) {
      draft.step4_data = { ...draft.step4_data, ...step4_data };
    }

    draft.current_step = current_step;
    if (last_edited_field) {
      draft.last_edited_field = last_edited_field;
    }
    draft.auto_save_count += 1;

    // Save draft (pre-save hook will increment version)
    await draft.save();

    // Get request metadata
    const userAgent = req.headers.get('user-agent') || 'unknown';
    const ipAddress =
      req.headers.get('x-forwarded-for') ||
      req.headers.get('x-real-ip') ||
      'unknown';

    // Log autosave event (if method exists)
    if (typeof (SurveyAuditLog as any).logChange === 'function') {
      await (SurveyAuditLog as any).logChange({
        surveyId: draft._id,
        action: 'draft_saved',
        entityType: 'draft',
        entityId: `step_${current_step}`,
        before: beforeState,
        after: {
          step: current_step,
          count: draft.auto_save_count,
          version: draft.version,
        },
        user: {
          userId: session.user.id,
          userName: session.user.name || 'Unknown',
          userEmail: session.user.email || '',
          userRole: (session.user as any).role || 'user',
        },
        request: {
          ipAddress,
          userAgent,
          sessionId: draft.session_id,
        },
        metadata: {
          automated: true,
          last_edited_field,
        },
      });
    }

    // Return success response
    return NextResponse.json({
      success: true,
      version: draft.version,
      saved_at: draft.last_autosave_at || draft.updated_at,
      auto_save_count: draft.auto_save_count,
      message: 'Draft autosaved successfully',
    });
  } catch (error) {
    console.error('Autosave error:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET: Retrieve draft data
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    await connectDB();

    const draft = await (SurveyDraft as any).findById(id);

    if (!draft) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }

    if (draft.user_id.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({
      draft: {
        id: draft._id,
        current_step: draft.current_step,
        version: draft.version,
        step1_data: draft.step1_data,
        step2_data: draft.step2_data,
        step3_data: draft.step3_data,
        step4_data: draft.step4_data,
        auto_save_count: draft.auto_save_count,
        last_autosave_at: draft.last_autosave_at,
        expires_at: draft.expires_at,
        created_at: draft.created_at,
        updated_at: draft.updated_at,
      },
    });
  } catch (error) {
    console.error('Get draft error:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
