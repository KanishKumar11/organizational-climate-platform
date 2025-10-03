import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import SurveyDraft from '@/models/SurveyDraft';
import SurveyAuditLog from '@/models/SurveyAuditLog';

/**
 * DELETE Draft Endpoint
 * 
 * Permanently deletes a draft
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

    const draft = await (SurveyDraft as any).findById(params.id);

    if (!draft) {
      return NextResponse.json(
        { error: 'Draft not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (draft.user_id.toString() !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden: You do not own this draft' },
        { status: 403 }
      );
    }

    // Log deletion event before deleting
    if (typeof (SurveyAuditLog as any).logChange === 'function') {
      await (SurveyAuditLog as any).logChange({
        surveyId: draft._id,
        action: 'draft_deleted',
        entityType: 'draft',
        entityId: draft._id.toString(),
        before: {
          current_step: draft.current_step,
          auto_save_count: draft.auto_save_count,
          created_at: draft.created_at,
        },
        user: {
          userId: session.user.id,
          userName: session.user.name || 'Unknown',
          userEmail: session.user.email || '',
          userRole: (session.user as any).role || 'user',
        },
        request: {
          ipAddress: req.headers.get('x-forwarded-for') || 
                     req.headers.get('x-real-ip') || 
                     'unknown',
          userAgent: req.headers.get('user-agent') || 'unknown',
          sessionId: draft.session_id,
        },
      });
    }

    // Delete draft
    await (SurveyDraft as any).findByIdAndDelete(params.id);

    return NextResponse.json({
      success: true,
      message: 'Draft deleted successfully',
    });

  } catch (error) {
    console.error('Delete draft error:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET Draft Endpoint
 * 
 * Retrieves a specific draft by ID
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

    const draft = await (SurveyDraft as any).findById(params.id).lean();

    if (!draft) {
      return NextResponse.json(
        { error: 'Draft not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (draft.user_id.toString() !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden: You do not own this draft' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      draft: {
        id: draft._id.toString(),
        current_step: draft.current_step,
        version: draft.version,
        step1_data: draft.step1_data,
        step2_data: draft.step2_data,
        step3_data: draft.step3_data,
        step4_data: draft.step4_data,
        auto_save_count: draft.auto_save_count,
        last_autosave_at: draft.last_autosave_at,
        expires_at: draft.expires_at,
        is_recovered: draft.is_recovered,
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
