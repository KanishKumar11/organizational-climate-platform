import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import DemographicField from '@/models/DemographicField';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only company admins and super admins can reorder
    if (!['company_admin', 'super_admin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { company_id, field_orders } = body;

    if (!company_id || !field_orders || !Array.isArray(field_orders)) {
      return NextResponse.json(
        { error: 'company_id and field_orders array are required' },
        { status: 400 }
      );
    }

    // Check access
    if (
      company_id !== session.user.companyId &&
      session.user.role !== 'super_admin'
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();

    // Update order for each field
    const updatePromises = field_orders.map(
      (item: { id: string; order: number }) =>
        DemographicField.findByIdAndUpdate(
          item.id,
          { order: item.order },
          { new: true }
        )
    );

    await Promise.all(updatePromises);

    return NextResponse.json({
      success: true,
      message: 'Field order updated successfully',
    });
  } catch (error) {
    console.error('Error reordering demographic fields:', error);
    return NextResponse.json(
      { error: 'Failed to reorder demographic fields' },
      { status: 500 }
    );
  }
}
