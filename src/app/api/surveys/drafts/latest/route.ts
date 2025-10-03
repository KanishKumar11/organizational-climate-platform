import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import SurveyDraft from '@/models/SurveyDraft';

/**
 * GET Latest Draft Endpoint
 *
 * Retrieves the most recent draft for a user/company combination
 * that hasn't expired and hasn't been recovered yet.
 *
 * Query Parameters:
 * - user_id: User ID
 * - company_id: Company ID
 * - max_age_hours: Maximum age in hours (default: 24)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('user_id');
    const companyId = searchParams.get('company_id');
    const maxAgeHours = parseInt(searchParams.get('max_age_hours') || '24', 10);

    if (!userId || !companyId) {
      return NextResponse.json(
        { error: 'Missing required parameters: user_id, company_id' },
        { status: 400 }
      );
    }

    // Verify user is requesting their own drafts
    if (userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden: Can only access your own drafts' },
        { status: 403 }
      );
    }

    await connectDB();

    // Calculate cutoff time
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - maxAgeHours);

    // Find latest non-recovered draft
    const draft = await (SurveyDraft as any)
      .findOne({
        user_id: userId,
        company_id: companyId,
        is_recovered: false,
        expires_at: { $gt: new Date() }, // Not expired
        updated_at: { $gt: cutoffTime }, // Within max age
      })
      .sort({ updated_at: -1 }) // Most recent first
      .lean();

    if (!draft) {
      return NextResponse.json({ message: 'No draft found' }, { status: 404 });
    }

    // Return draft data
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
        created_at: draft.created_at,
        updated_at: draft.updated_at,
      },
    });
  } catch (error) {
    console.error('Get latest draft error:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
