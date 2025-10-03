import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import SurveyDraft from '@/models/SurveyDraft';
import SurveyAuditLog from '@/models/SurveyAuditLog';

/**
 * POST Recover Draft Endpoint
 *
 * Marks a draft as recovered (is_recovered = true)
 */
export async function POST(
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

    // Verify ownership
    if (draft.user_id.toString() !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden: You do not own this draft' },
        { status: 403 }
      );
    }

    // Mark as recovered
    draft.is_recovered = true;
    await draft.save();

    // Log recovery event
    if (typeof (SurveyAuditLog as any).logChange === 'function') {
      await (SurveyAuditLog as any).logChange({
        surveyId: draft._id,
        action: 'draft_recovered',
        entityType: 'draft',
        entityId: draft._id.toString(),
        after: {
          is_recovered: true,
          recovered_at: new Date(),
        },
        user: {
          userId: session.user.id,
          userName: session.user.name || 'Unknown',
          userEmail: session.user.email || '',
          userRole: (session.user as any).role || 'user',
        },
        request: {
          ipAddress:
            req.headers.get('x-forwarded-for') ||
            req.headers.get('x-real-ip') ||
            'unknown',
          userAgent: req.headers.get('user-agent') || 'unknown',
          sessionId: draft.session_id,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Draft recovered successfully',
      draft: {
        id: draft._id.toString(),
        current_step: draft.current_step,
        step1_data: draft.step1_data,
        step2_data: draft.step2_data,
        step3_data: draft.step3_data,
        step4_data: draft.step4_data,
      },
    });
  } catch (error) {
    console.error('Recover draft error:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
