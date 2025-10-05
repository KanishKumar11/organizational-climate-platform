import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import DemographicField from '@/models/DemographicField';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const company_id = searchParams.get('company_id');

    if (!company_id) {
      return NextResponse.json(
        { error: 'company_id is required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Fetch active demographic fields for the company, sorted by order
    const fields = await DemographicField.findActiveByCompany(company_id);

    return NextResponse.json({
      success: true,
      fields,
      count: fields.length,
    });
  } catch (error) {
    console.error('Error fetching demographic fields:', error);
    return NextResponse.json(
      { error: 'Failed to fetch demographic fields' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only company admins and super admins can create demographic fields
    if (!['company_admin', 'super_admin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { company_id, field, label, type, options, required, order } = body;

    if (!company_id || !field || !label || !type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if field already exists for this company
    const existingField = await DemographicField.findOne({
      company_id,
      field,
    });

    if (existingField) {
      return NextResponse.json(
        { error: 'Demographic field already exists for this company' },
        { status: 409 }
      );
    }

    const demographicField = await DemographicField.create({
      company_id,
      field,
      label,
      type,
      options: options || [],
      required: required || false,
      order: order || 0,
      is_active: true,
    });

    return NextResponse.json({
      success: true,
      field: demographicField,
    });
  } catch (error) {
    console.error('Error creating demographic field:', error);
    return NextResponse.json(
      { error: 'Failed to create demographic field' },
      { status: 500 }
    );
  }
}
