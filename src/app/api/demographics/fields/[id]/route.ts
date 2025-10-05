import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import DemographicField from '@/models/DemographicField';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET - Fetch single demographic field
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;

    await connectDB();

    const field = await DemographicField.findById(id);

    if (!field) {
      return NextResponse.json({ error: 'Field not found' }, { status: 404 });
    }

    // Check access
    if (
      field.company_id.toString() !== session.user.companyId &&
      session.user.role !== 'super_admin'
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      field,
    });
  } catch (error) {
    console.error('Error fetching demographic field:', error);
    return NextResponse.json(
      { error: 'Failed to fetch demographic field' },
      { status: 500 }
    );
  }
}

// PUT - Update demographic field
export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only company admins and super admins can update
    if (!['company_admin', 'super_admin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await context.params;
    const body = await request.json();
    const { label, type, options, required, order, is_active } = body;

    await connectDB();

    const field = await DemographicField.findById(id);

    if (!field) {
      return NextResponse.json({ error: 'Field not found' }, { status: 404 });
    }

    // Check access
    if (
      field.company_id.toString() !== session.user.companyId &&
      session.user.role !== 'super_admin'
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Update allowed fields
    if (label !== undefined) field.label = label;
    if (type !== undefined) field.type = type;
    if (options !== undefined) field.options = options;
    if (required !== undefined) field.required = required;
    if (order !== undefined) field.order = order;
    if (is_active !== undefined) field.is_active = is_active;

    await field.save();

    return NextResponse.json({
      success: true,
      field,
    });
  } catch (error) {
    console.error('Error updating demographic field:', error);
    return NextResponse.json(
      { error: 'Failed to update demographic field' },
      { status: 500 }
    );
  }
}

// PATCH - Partial update (for toggling active status)
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only company admins and super admins can update
    if (!['company_admin', 'super_admin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await context.params;
    const body = await request.json();

    await connectDB();

    const field = await DemographicField.findById(id);

    if (!field) {
      return NextResponse.json({ error: 'Field not found' }, { status: 404 });
    }

    // Check access
    if (
      field.company_id.toString() !== session.user.companyId &&
      session.user.role !== 'super_admin'
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Update only provided fields
    Object.keys(body).forEach((key) => {
      if (body[key] !== undefined) {
        (field as any)[key] = body[key];
      }
    });

    await field.save();

    return NextResponse.json({
      success: true,
      field,
    });
  } catch (error) {
    console.error('Error patching demographic field:', error);
    return NextResponse.json(
      { error: 'Failed to update demographic field' },
      { status: 500 }
    );
  }
}

// DELETE - Delete demographic field
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only company admins and super admins can delete
    if (!['company_admin', 'super_admin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await context.params;

    await connectDB();

    const field = await DemographicField.findById(id);

    if (!field) {
      return NextResponse.json({ error: 'Field not found' }, { status: 404 });
    }

    // Check access
    if (
      field.company_id.toString() !== session.user.companyId &&
      session.user.role !== 'super_admin'
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // TODO: Check if field is used in any surveys before deleting
    // For now, we'll soft delete by setting is_active to false
    // Uncomment the line below for hard delete
    // await DemographicField.findByIdAndDelete(id);
    
    // Soft delete
    field.is_active = false;
    await field.save();

    return NextResponse.json({
      success: true,
      message: 'Field deactivated successfully',
    });
  } catch (error) {
    console.error('Error deleting demographic field:', error);
    return NextResponse.json(
      { error: 'Failed to delete demographic field' },
      { status: 500 }
    );
  }
}
