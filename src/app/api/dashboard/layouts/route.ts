import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { z } from 'zod';

// Validation schema for dashboard layout
const layoutConfigSchema = z.object({
  name: z.string().min(1, 'Layout name is required'),
  description: z.string().optional(),
  layout_type: z.enum(['grid', 'masonry', 'flex', 'custom']).default('grid'),
  grid_config: z
    .object({
      columns: z.number().min(1).max(12).default(3),
      row_height: z.number().min(50).default(150),
      margin: z.array(z.number()).length(2).default([10, 10]),
      container_padding: z.array(z.number()).length(2).default([10, 10]),
      breakpoints: z.record(z.string(), z.number()).optional(),
    })
    .optional(),
  widget_positions: z
    .array(
      z.object({
        widget_id: z.string(),
        x: z.number().min(0),
        y: z.number().min(0),
        width: z.number().min(1),
        height: z.number().min(1),
        min_width: z.number().optional(),
        min_height: z.number().optional(),
        max_width: z.number().optional(),
        max_height: z.number().optional(),
      })
    )
    .default([]),
  responsive_config: z
    .object({
      mobile: z
        .object({
          columns: z.number().default(1),
          row_height: z.number().default(120),
        })
        .optional(),
      tablet: z
        .object({
          columns: z.number().default(2),
          row_height: z.number().default(140),
        })
        .optional(),
      desktop: z
        .object({
          columns: z.number().default(3),
          row_height: z.number().default(150),
        })
        .optional(),
    })
    .optional(),
  is_default: z.boolean().default(false),
  is_shared: z.boolean().default(false),
});

// GET /api/dashboard/layouts - Get dashboard layouts
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const layout_id = searchParams.get('layout_id');
    const include_shared = searchParams.get('include_shared') === 'true';
    const layout_type = searchParams.get('layout_type');

    const { db } = await connectToDatabase();

    if (layout_id) {
      // Get specific layout
      const layout = await db.collection('dashboard_layouts').findOne({
        _id: layout_id,
        $or: [
          { created_by: session.user.id },
          { company_id: session.user.companyId, is_shared: true },
        ],
      });

      if (!layout) {
        return NextResponse.json(
          { error: 'Layout not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        layout: {
          ...layout,
          id: layout._id.toString(),
        },
      });
    }

    // Get all available layouts
    let query: any = {
      $or: [{ created_by: session.user.id }],
    };

    if (include_shared) {
      query.$or.push({ company_id: session.user.companyId, is_shared: true });
    }

    if (layout_type) {
      query.layout_type = layout_type;
    }

    const layouts = await db
      .collection('dashboard_layouts')
      .find(query)
      .sort({ is_default: -1, name: 1 })
      .toArray();

    // Include built-in layouts
    const builtInLayouts = getBuiltInLayouts();

    return NextResponse.json({
      success: true,
      layouts: [
        ...builtInLayouts,
        ...layouts.map((layout) => ({
          ...layout,
          id: layout._id.toString(),
        })),
      ],
    });
  } catch (error) {
    console.error('Error fetching dashboard layouts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard layouts' },
      { status: 500 }
    );
  }
}

// POST /api/dashboard/layouts - Create dashboard layout
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const layoutData = layoutConfigSchema.parse(body);

    const { db } = await connectToDatabase();

    // Check if layout name already exists for this user
    const existingLayout = await db.collection('dashboard_layouts').findOne({
      name: layoutData.name,
      created_by: session.user.id,
    });

    if (existingLayout) {
      return NextResponse.json(
        { error: 'Layout name already exists' },
        { status: 409 }
      );
    }

    // If setting as default, unset other defaults
    if (layoutData.is_default) {
      await db.collection('dashboard_layouts').updateMany(
        {
          created_by: session.user.id,
          is_default: true,
        },
        { $set: { is_default: false } }
      );
    }

    const layout = {
      ...layoutData,
      created_by: session.user.id,
      company_id: session.user.companyId,
      created_at: new Date(),
      updated_at: new Date(),
    };

    const result = await db.collection('dashboard_layouts').insertOne(layout);

    return NextResponse.json(
      {
        success: true,
        layout: {
          ...layout,
          id: result.insertedId.toString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating dashboard layout:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create dashboard layout' },
      { status: 500 }
    );
  }
}

// PUT /api/dashboard/layouts - Update dashboard layout
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { layout_id, ...updateData } = body;

    if (!layout_id) {
      return NextResponse.json(
        { error: 'Layout ID is required' },
        { status: 400 }
      );
    }

    const validatedData = layoutConfigSchema.partial().parse(updateData);

    const { db } = await connectToDatabase();

    // Verify ownership
    const existingLayout = await db.collection('dashboard_layouts').findOne({
      _id: layout_id,
      created_by: session.user.id,
    });

    if (!existingLayout) {
      return NextResponse.json(
        { error: 'Layout not found or access denied' },
        { status: 404 }
      );
    }

    // If setting as default, unset other defaults
    if (validatedData.is_default) {
      await db.collection('dashboard_layouts').updateMany(
        {
          created_by: session.user.id,
          is_default: true,
          _id: { $ne: layout_id },
        },
        { $set: { is_default: false } }
      );
    }

    const result = await db.collection('dashboard_layouts').findOneAndUpdate(
      { _id: layout_id },
      {
        $set: {
          ...validatedData,
          updated_at: new Date(),
        },
      },
      { returnDocument: 'after' }
    );

    return NextResponse.json({
      success: true,
      layout: {
        ...result.value,
        id: result.value._id.toString(),
      },
    });
  } catch (error) {
    console.error('Error updating dashboard layout:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update dashboard layout' },
      { status: 500 }
    );
  }
}

// DELETE /api/dashboard/layouts - Delete dashboard layout
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const layout_id = searchParams.get('layout_id');

    if (!layout_id) {
      return NextResponse.json(
        { error: 'Layout ID is required' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    // Verify ownership and that it's not default
    const existingLayout = await db.collection('dashboard_layouts').findOne({
      _id: layout_id,
      created_by: session.user.id,
    });

    if (!existingLayout) {
      return NextResponse.json(
        { error: 'Layout not found or access denied' },
        { status: 404 }
      );
    }

    if (existingLayout.is_default) {
      return NextResponse.json(
        { error: 'Cannot delete default layout' },
        { status: 400 }
      );
    }

    await db.collection('dashboard_layouts').deleteOne({ _id: layout_id });

    return NextResponse.json({
      success: true,
      message: 'Layout deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting dashboard layout:', error);
    return NextResponse.json(
      { error: 'Failed to delete dashboard layout' },
      { status: 500 }
    );
  }
}

function getBuiltInLayouts() {
  return [
    {
      id: 'default-grid',
      name: 'Default Grid',
      description: 'Standard 3-column grid layout',
      layout_type: 'grid',
      grid_config: {
        columns: 3,
        row_height: 150,
        margin: [10, 10],
        container_padding: [10, 10],
      },
      is_default: true,
      is_built_in: true,
    },
    {
      id: 'compact-grid',
      name: 'Compact Grid',
      description: '4-column compact layout for more widgets',
      layout_type: 'grid',
      grid_config: {
        columns: 4,
        row_height: 120,
        margin: [8, 8],
        container_padding: [8, 8],
      },
      is_built_in: true,
    },
    {
      id: 'executive-dashboard',
      name: 'Executive Dashboard',
      description: 'Large widgets for executive overview',
      layout_type: 'grid',
      grid_config: {
        columns: 2,
        row_height: 200,
        margin: [15, 15],
        container_padding: [15, 15],
      },
      is_built_in: true,
    },
    {
      id: 'mobile-optimized',
      name: 'Mobile Optimized',
      description: 'Single column layout optimized for mobile',
      layout_type: 'grid',
      grid_config: {
        columns: 1,
        row_height: 180,
        margin: [10, 10],
        container_padding: [10, 10],
      },
      is_built_in: true,
    },
  ];
}
