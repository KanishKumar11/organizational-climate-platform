import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import DemographicField from '@/models/DemographicField';
import { connectToDatabase } from '@/lib/mongodb';
import { USER_ROLES } from '@/types/user';

// GET /api/admin/demographics?companyId=...
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      );
    }

    // Check permissions
    const userRole = session.user.role;
    if (userRole !== 'super_admin' && session.user.companyId !== companyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectToDatabase();

    const demographics = await DemographicField.findByCompany(companyId);

    return NextResponse.json({
      success: true,
      data: demographics,
    });
  } catch (error) {
    console.error('Error fetching demographics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/demographics
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { companyId, field, label, type, options, required, order } = body;

    if (!companyId || !field || !label || !type) {
      return NextResponse.json(
        { error: 'Missing required fields: companyId, field, label, type' },
        { status: 400 }
      );
    }

    // Check permissions
    const userRole = session.user.role;
    if (userRole !== 'super_admin' && session.user.companyId !== companyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Validate type
    const validTypes = ['select', 'text', 'number', 'date'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type. Must be one of: select, text, number, date' },
        { status: 400 }
      );
    }

    // Validate options for select type
    if (
      type === 'select' &&
      (!options || !Array.isArray(options) || options.length === 0)
    ) {
      return NextResponse.json(
        { error: 'Options array is required for select type' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Check if field already exists for this company
    const existing = await DemographicField.findOne({
      company_id: companyId,
      field: field,
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Demographic field already exists for this company' },
        { status: 409 }
      );
    }

    const demographicField = new DemographicField({
      company_id: companyId,
      field,
      label,
      type,
      options: type === 'select' ? options : undefined,
      required: required || false,
      order: order || 0,
    });

    await demographicField.save();

    return NextResponse.json({
      success: true,
      data: demographicField,
    });
  } catch (error) {
    console.error('Error creating demographic field:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/demographics/[id]
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Demographic field ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { label, type, options, required, order, is_active } = body;

    await connectToDatabase();

    const demographicField = await DemographicField.findById(id);
    if (!demographicField) {
      return NextResponse.json(
        { error: 'Demographic field not found' },
        { status: 404 }
      );
    }

    // Check permissions
    const userRole = session.user.role;
    if (
      userRole !== 'super_admin' &&
      session.user.companyId !== demographicField.company_id
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Validate type if provided
    if (type) {
      const validTypes = ['select', 'text', 'number', 'date'];
      if (!validTypes.includes(type)) {
        return NextResponse.json(
          { error: 'Invalid type. Must be one of: select, text, number, date' },
          { status: 400 }
        );
      }

      // Validate options for select type
      if (
        type === 'select' &&
        (!options || !Array.isArray(options) || options.length === 0)
      ) {
        return NextResponse.json(
          { error: 'Options array is required for select type' },
          { status: 400 }
        );
      }
    }

    // Update fields
    if (label !== undefined) demographicField.label = label;
    if (type !== undefined) {
      demographicField.type = type;
      demographicField.options = type === 'select' ? options : undefined;
    }
    if (required !== undefined) demographicField.required = required;
    if (order !== undefined) demographicField.order = order;
    if (is_active !== undefined) demographicField.is_active = is_active;

    await demographicField.save();

    return NextResponse.json({
      success: true,
      data: demographicField,
    });
  } catch (error) {
    console.error('Error updating demographic field:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/demographics/[id]
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Demographic field ID is required' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const demographicField = await DemographicField.findById(id);
    if (!demographicField) {
      return NextResponse.json(
        { error: 'Demographic field not found' },
        { status: 404 }
      );
    }

    // Check permissions
    const userRole = session.user.role;
    if (
      userRole !== 'super_admin' &&
      session.user.companyId !== demographicField.company_id
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Soft delete by setting is_active to false
    demographicField.is_active = false;
    await demographicField.save();

    return NextResponse.json({
      success: true,
      message: 'Demographic field deactivated',
    });
  } catch (error) {
    console.error('Error deleting demographic field:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
