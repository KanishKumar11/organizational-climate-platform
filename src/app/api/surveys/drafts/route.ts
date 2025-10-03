import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import SurveyDraft, { ISurveyDraft } from '@/models/SurveyDraft';
import type { FilterQuery } from 'mongoose';

/**
 * CLIMA-006: Survey Draft Autosave API
 *
 * POST /api/surveys/drafts - Save/update draft
 * GET /api/surveys/drafts/latest - Get latest draft for recovery
 */

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const {
      session_id,
      title,
      description,
      type,
      questions,
      settings,
      department_ids,
      target_user_ids,
      demographic_filters,
      start_date,
      end_date,
      step,
      last_edited_field,
    } = body;

    if (!session_id) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Find existing draft or create new one
    const findQuery: FilterQuery<ISurveyDraft> = {
      user_id: session.user.id,
      session_id,
    };

    let draft = await (SurveyDraft as any).findOne(findQuery).exec();

    if (draft) {
      // Update existing draft
      draft.title = title;
      draft.description = description;
      draft.type = type;
      draft.questions = questions;
      draft.settings = settings;
      draft.department_ids = department_ids;
      draft.target_user_ids = target_user_ids;
      draft.demographic_filters = demographic_filters;
      draft.start_date = start_date;
      draft.end_date = end_date;
      draft.step = step;
      draft.last_edited_field = last_edited_field;
      draft.auto_save_count += 1;

      await draft.save();
    } else {
      // Create new draft
      draft = new SurveyDraft({
        user_id: session.user.id,
        company_id: session.user.companyId,
        session_id,
        title,
        description,
        type,
        questions,
        settings,
        department_ids,
        target_user_ids,
        demographic_filters,
        start_date,
        end_date,
        step: step || 1,
        last_edited_field,
        auto_save_count: 1,
      });

      await draft.save();
    }

    return NextResponse.json({
      success: true,
      draft: {
        id: draft._id,
        updated_at: draft.updated_at,
        auto_save_count: draft.auto_save_count,
      },
    });
  } catch (error) {
    console.error('Error saving draft:', error);
    return NextResponse.json(
      { error: 'Failed to save draft' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const session_id = searchParams.get('session_id');

    let query: FilterQuery<ISurveyDraft> = {
      user_id: session.user.id,
      company_id: session.user.companyId,
    };

    if (session_id) {
      query.session_id = session_id;
    }

    // Get most recent draft
    const draft = await (SurveyDraft as any)
      .findOne(query)
      .sort({ updated_at: -1 })
      .lean()
      .exec();

    if (!draft) {
      return NextResponse.json({ draft: null });
    }

    // Check if draft is recent (within last hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const isRecent = new Date(draft.updated_at) > oneHourAgo;

    return NextResponse.json({
      draft: {
        ...draft,
        is_recent: isRecent,
      },
    });
  } catch (error) {
    console.error('Error fetching draft:', error);
    return NextResponse.json(
      { error: 'Failed to fetch draft' },
      { status: 500 }
    );
  }
}
