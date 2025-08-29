import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ActionPlanTemplate } from '@/models/ActionPlanTemplate';
import { User } from '@/models/User';
import { connectDB } from '@/lib/db';

// GET /api/action-plans/templates - Get action plan templates
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const user = await User.findById(session.user.id);
    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    // Build query - include global templates and company-specific templates
    let query: any = {
      is_active: true,
      $or: [
        { company_id: null }, // Global templates
        { company_id: user.company_id }, // Company-specific templates
      ],
    };

    if (category) {
      query.category = category;
    }

    const templates = await ActionPlanTemplate.find(query)
      .sort({ usage_count: -1, created_at: -1 })
      .populate('created_by', 'name email');

    // Get unique categories for filtering
    const categories = await ActionPlanTemplate.distinct('category', {
      is_active: true,
      $or: [{ company_id: null }, { company_id: user.company_id }],
    });

    return Response.json({
      templates,
      categories,
    });
  } catch (error) {
    console.error('Error fetching action plan templates:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/action-plans/templates - Create action plan template
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const user = await User.findById(session.user.id);
    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    // Check permissions - only admins can create templates
    if (!['super_admin', 'company_admin'].includes(user.role)) {
      return Response.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      name,
      description,
      category,
      kpi_templates = [],
      qualitative_objective_templates = [],
      ai_recommendation_templates = [],
      tags = [],
      is_global = false,
    } = body;

    // Validate required fields
    if (!name || !description || !category) {
      return Response.json(
        {
          error: 'Missing required fields: name, description, category',
        },
        { status: 400 }
      );
    }

    // Only super admins can create global templates
    const company_id =
      is_global && user.role === 'super_admin' ? null : user.company_id;

    const template = new ActionPlanTemplate({
      name,
      description,
      category,
      company_id,
      created_by: user._id,
      kpi_templates,
      qualitative_objective_templates,
      ai_recommendation_templates,
      tags,
    });

    await template.save();

    await template.populate('created_by', 'name email');

    return Response.json(
      {
        template,
        message: 'Action plan template created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating action plan template:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
