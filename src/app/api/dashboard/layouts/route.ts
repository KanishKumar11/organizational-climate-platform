/**
 * Dashboard layouts API endpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectToDatabase } from '@/lib/mongodb';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { db } = await connectToDatabase();

    // Get user's saved layouts
    const layouts = await db
      .collection('dashboard_layouts')
      .find({
        $or: [
          { user_id: session.user.id },
          { is_shared: true, company_id: session.user.company_id },
        ],
      })
      .sort({ updated_at: -1 })
      .toArray();

    return NextResponse.json({
      success: true,
      layouts: layouts.map((layout) => ({
        ...layout,
        id: layout._id.toString(),
      })),
    });
  } catch (error) {
    console.error('Dashboard layouts API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch dashboard layouts',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      name,
      description,
      widgets,
      layout_type,
      columns,
      theme,
      is_default = false,
      is_shared = false,
    } = body;

    if (!name || !widgets) {
      return NextResponse.json(
        { error: 'Name and widgets are required' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    // If this is being set as default, unset other defaults for this user
    if (is_default) {
      await db
        .collection('dashboard_layouts')
        .updateMany(
          { user_id: session.user.id, is_default: true },
          { $set: { is_default: false } }
        );
    }

    const layoutData = {
      name,
      description,
      widgets,
      layout_type: layout_type || 'grid',
      columns: columns || 3,
      theme: theme || 'default',
      user_id: session.user.id,
      company_id: session.user.company_id,
      is_default,
      is_shared,
      created_at: new Date(),
      updated_at: new Date(),
    };

    const result = await db
      .collection('dashboard_layouts')
      .insertOne(layoutData);

    return NextResponse.json({
      success: true,
      layout: {
        ...layoutData,
        id: result.insertedId.toString(),
      },
    });
  } catch (error) {
    console.error('Dashboard layouts API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to save dashboard layout',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      id,
      name,
      description,
      widgets,
      layout_type,
      columns,
      theme,
      is_default = false,
      is_shared = false,
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Layout ID is required' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    // Verify ownership or shared access
    const existingLayout = await db.collection('dashboard_layouts').findOne({
      _id: id,
      $or: [
        { user_id: session.user.id },
        { is_shared: true, company_id: session.user.company_id },
      ],
    });

    if (!existingLayout) {
      return NextResponse.json(
        { error: 'Layout not found or access denied' },
        { status: 404 }
      );
    }

    // If this is being set as default, unset other defaults for this user
    if (is_default) {
      await db
        .collection('dashboard_layouts')
        .updateMany(
          { user_id: session.user.id, is_default: true },
          { $set: { is_default: false } }
        );
    }

    const updateData = {
      ...(name && { name }),
      ...(description && { description }),
      ...(widgets && { widgets }),
      ...(layout_type && { layout_type }),
      ...(columns && { columns }),
      ...(theme && { theme }),
      is_default,
      is_shared,
      updated_at: new Date(),
    };

    await db
      .collection('dashboard_layouts')
      .updateOne({ _id: id }, { $set: updateData });

    const updatedLayout = await db
      .collection('dashboard_layouts')
      .findOne({ _id: id });

    return NextResponse.json({
      success: true,
      layout: {
        ...updatedLayout,
        id: updatedLayout._id.toString(),
      },
    });
  } catch (error) {
    console.error('Dashboard layouts API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update dashboard layout',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const layoutId = searchParams.get('id');

    if (!layoutId) {
      return NextResponse.json(
        { error: 'Layout ID is required' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    // Verify ownership
    const existingLayout = await db.collection('dashboard_layouts').findOne({
      _id: layoutId,
      user_id: session.user.id,
    });

    if (!existingLayout) {
      return NextResponse.json(
        { error: 'Layout not found or access denied' },
        { status: 404 }
      );
    }

    // Don't allow deletion of default layout
    if (existingLayout.is_default) {
      return NextResponse.json(
        { error: 'Cannot delete default layout' },
        { status: 400 }
      );
    }

    await db.collection('dashboard_layouts').deleteOne({ _id: layoutId });

    return NextResponse.json({
      success: true,
      message: 'Layout deleted successfully',
    });
  } catch (error) {
    console.error('Dashboard layouts API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete dashboard layout',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
