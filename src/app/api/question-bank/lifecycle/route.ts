import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import QuestionBank from '@/models/QuestionBank';
import { connectDB } from '@/lib/db';
import { hasStringPermission } from '@/lib/permissions';

// GET /api/question-bank/lifecycle - Get questions by lifecycle status
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can manage question lifecycle
    if (!hasStringPermission(session.user.role, 'manage_questions')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // active, deprecated, archived
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');

    // Build base query with company scoping
    let baseQuery: any = {};

    if (session.user.role === 'company_admin') {
      baseQuery.$or = [
        { company_id: session.user.companyId },
        { company_id: { $exists: false } },
      ];
    }

    // Apply status filter
    switch (status) {
      case 'active':
        baseQuery.is_active = true;
        break;
      case 'deprecated':
        baseQuery.is_active = false;
        baseQuery.archived_at = { $exists: false };
        break;
      case 'archived':
        baseQuery.archived_at = { $exists: true };
        break;
      default:
        // Return all if no status specified
        break;
    }

    if (category) {
      baseQuery.category = category;
    }

    const questions = await QuestionBank.find(baseQuery)
      .sort({ updated_at: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select(
        'text category subcategory type metrics is_active archived_at deprecated_at created_at updated_at'
      )
      .lean();

    const total = await QuestionBank.countDocuments(baseQuery);

    // Get lifecycle statistics
    const lifecycleStats = await getLifecycleStatistics(
      session.user.role === 'company_admin' ? session.user.companyId : null
    );

    return NextResponse.json({
      questions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      statistics: lifecycleStats,
    });
  } catch (error) {
    console.error('Error fetching lifecycle questions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lifecycle questions' },
      { status: 500 }
    );
  }
}

// PATCH /api/question-bank/lifecycle - Update question lifecycle status
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can manage question lifecycle
    if (!hasStringPermission(session.user.role, 'manage_questions')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    await connectDB();

    const body = await request.json();
    const { question_ids, action, reason } = body;

    if (!question_ids || !Array.isArray(question_ids) || !action) {
      return NextResponse.json(
        { error: 'Question IDs array and action are required' },
        { status: 400 }
      );
    }

    const validActions = ['activate', 'deprecate', 'archive', 'restore'];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        {
          error:
            'Invalid action. Must be one of: activate, deprecate, archive, restore',
        },
        { status: 400 }
      );
    }

    // Build update data based on action
    let updateData: any = { updated_at: new Date() };

    switch (action) {
      case 'activate':
        updateData.is_active = true;
        updateData.$unset = { deprecated_at: 1, archived_at: 1 };
        break;
      case 'deprecate':
        updateData.is_active = false;
        updateData.deprecated_at = new Date();
        updateData.deprecation_reason = reason;
        break;
      case 'archive':
        updateData.is_active = false;
        updateData.archived_at = new Date();
        updateData.archive_reason = reason;
        break;
      case 'restore':
        updateData.is_active = true;
        updateData.$unset = {
          deprecated_at: 1,
          archived_at: 1,
          deprecation_reason: 1,
          archive_reason: 1,
        };
        break;
    }

    // Apply company scoping for company admins
    let query: any = { _id: { $in: question_ids } };
    if (session.user.role === 'company_admin') {
      query.$or = [
        { company_id: session.user.companyId },
        { company_id: { $exists: false } },
      ];
    }

    const result = await QuestionBank.updateMany(query, updateData);

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'No questions found or insufficient permissions' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Successfully ${action}d ${result.modifiedCount} question(s)`,
      modified_count: result.modifiedCount,
      matched_count: result.matchedCount,
    });
  } catch (error) {
    console.error('Error updating question lifecycle:', error);
    return NextResponse.json(
      { error: 'Failed to update question lifecycle' },
      { status: 500 }
    );
  }
}

async function getLifecycleStatistics(companyId?: string) {
  let baseQuery: any = {};

  if (companyId) {
    baseQuery.$or = [
      { company_id: companyId },
      { company_id: { $exists: false } },
    ];
  }

  const stats = await QuestionBank.aggregate([
    { $match: baseQuery },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        active: {
          $sum: {
            $cond: [{ $eq: ['$is_active', true] }, 1, 0],
          },
        },
        deprecated: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ['$is_active', false] },
                  { $not: { $ifNull: ['$archived_at', false] } },
                ],
              },
              1,
              0,
            ],
          },
        },
        archived: {
          $sum: {
            $cond: [{ $ifNull: ['$archived_at', false] }, 1, 0],
          },
        },
        ai_generated: {
          $sum: {
            $cond: [{ $eq: ['$is_ai_generated', true] }, 1, 0],
          },
        },
        human_created: {
          $sum: {
            $cond: [{ $eq: ['$is_ai_generated', false] }, 1, 0],
          },
        },
        avg_effectiveness: { $avg: '$metrics.insight_score' },
        total_usage: { $sum: '$metrics.usage_count' },
      },
    },
  ]);

  // Get category breakdown
  const categoryBreakdown = await QuestionBank.aggregate([
    { $match: baseQuery },
    {
      $group: {
        _id: '$category',
        total: { $sum: 1 },
        active: {
          $sum: {
            $cond: [{ $eq: ['$is_active', true] }, 1, 0],
          },
        },
        deprecated: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ['$is_active', false] },
                  { $not: { $ifNull: ['$archived_at', false] } },
                ],
              },
              1,
              0,
            ],
          },
        },
        archived: {
          $sum: {
            $cond: [{ $ifNull: ['$archived_at', false] }, 1, 0],
          },
        },
      },
    },
    { $sort: { total: -1 } },
  ]);

  // Get recent lifecycle changes
  const recentChanges = await QuestionBank.find({
    ...baseQuery,
    $or: [
      {
        deprecated_at: {
          $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
      {
        archived_at: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
    ],
  })
    .sort({ updated_at: -1 })
    .limit(10)
    .select(
      'text category deprecated_at archived_at deprecation_reason archive_reason'
    )
    .lean();

  return {
    overview: stats[0] || {
      total: 0,
      active: 0,
      deprecated: 0,
      archived: 0,
      ai_generated: 0,
      human_created: 0,
      avg_effectiveness: 0,
      total_usage: 0,
    },
    category_breakdown: categoryBreakdown,
    recent_changes: recentChanges,
  };
}
