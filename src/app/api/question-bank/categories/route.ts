import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import QuestionBank from '@/models/QuestionBank';
import { connectDB } from '@/lib/db';

// GET /api/question-bank/categories - Get all categories and subcategories
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const includeStats = searchParams.get('include_stats') === 'true';

    // Build query based on user role
    let query: any = { is_active: true };

    if (
      session.user.role === 'company_admin' ||
      session.user.role === 'department_admin'
    ) {
      query.$or = [
        { company_id: session.user.companyId },
        { company_id: { $exists: false } },
      ];
    } else {
      query.company_id = { $exists: false };
    }

    // Aggregate categories and subcategories
    const pipeline: any[] = [
      { $match: query },
      {
        $group: {
          _id: {
            category: '$category',
            subcategory: '$subcategory',
          },
          count: { $sum: 1 },
          avgInsightScore: { $avg: '$metrics.insight_score' },
          totalUsage: { $sum: '$metrics.usage_count' },
        },
      },
      {
        $group: {
          _id: '$_id.category',
          subcategories: {
            $push: {
              name: '$_id.subcategory',
              count: '$count',
              avgInsightScore: '$avgInsightScore',
              totalUsage: '$totalUsage',
            },
          },
          totalQuestions: { $sum: '$count' },
          avgInsightScore: { $avg: '$avgInsightScore' },
          totalUsage: { $sum: '$totalUsage' },
        },
      },
      {
        $project: {
          category: '$_id',
          subcategories: {
            $filter: {
              input: '$subcategories',
              cond: { $ne: ['$$this.name', null] },
            },
          },
          totalQuestions: 1,
          avgInsightScore: { $round: ['$avgInsightScore', 2] },
          totalUsage: 1,
        },
      },
      { $sort: { category: 1 } },
    ];

    const categories = await QuestionBank.aggregate(pipeline);

    // If stats not requested, simplify the response
    if (!includeStats) {
      const simplifiedCategories = categories.map((cat) => ({
        category: cat.category,
        subcategories: cat.subcategories
          .map((sub: any) => sub.name)
          .filter(Boolean),
      }));
      return NextResponse.json({ categories: simplifiedCategories });
    }

    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

// POST /api/question-bank/categories - Create new category structure
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only super admins can create new categories
    if (session.user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    await connectDB();

    const body = await request.json();
    const { category, subcategories = [] } = body;

    if (!category) {
      return NextResponse.json(
        { error: 'Category name is required' },
        { status: 400 }
      );
    }

    // Check if category already exists
    const existingCategory = await QuestionBank.findOne({ category });
    if (existingCategory) {
      return NextResponse.json(
        { error: 'Category already exists' },
        { status: 409 }
      );
    }

    // Create placeholder questions for the new category structure
    const placeholderQuestions = [];

    if (subcategories.length > 0) {
      for (const subcategory of subcategories) {
        placeholderQuestions.push({
          text: `Sample question for ${category} - ${subcategory}`,
          type: 'likert',
          category,
          subcategory,
          tags: [category.toLowerCase(), subcategory.toLowerCase()],
          created_by: session.user.id,
          is_active: false, // Inactive placeholder
          scale_min: 1,
          scale_max: 5,
          scale_labels: { min: 'Strongly Disagree', max: 'Strongly Agree' },
        });
      }
    } else {
      placeholderQuestions.push({
        text: `Sample question for ${category}`,
        type: 'likert',
        category,
        tags: [category.toLowerCase()],
        created_by: session.user.id,
        is_active: false, // Inactive placeholder
        scale_min: 1,
        scale_max: 5,
        scale_labels: { min: 'Strongly Disagree', max: 'Strongly Agree' },
      });
    }

    await QuestionBank.insertMany(placeholderQuestions);

    return NextResponse.json(
      {
        message: 'Category structure created successfully',
        category,
        subcategories,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    );
  }
}
