import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import DemographicSnapshot from '../../../../../models/DemographicSnapshot';
import { validatePermissions } from '../../../../../lib/permissions';

// GET /api/demographics/snapshots/[id] - Get specific demographic snapshot
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const snapshot = await DemographicSnapshot.findById(id);

    if (!snapshot) {
      return NextResponse.json(
        { error: 'Demographic snapshot not found' },
        { status: 404 }
      );
    }

    // Validate permissions
    const hasPermission = await validatePermissions(
      session.user.id,
      'read',
      'demographic_snapshots',
      { company_id: snapshot.company_id }
    );

    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      data: snapshot,
    });
  } catch (error) {
    console.error('Error fetching demographic snapshot:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/demographics/snapshots/[id] - Archive demographic snapshot
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const snapshot = await DemographicSnapshot.findById(id);

    if (!snapshot) {
      return NextResponse.json(
        { error: 'Demographic snapshot not found' },
        { status: 404 }
      );
    }

    // Validate permissions
    const hasPermission = await validatePermissions(
      session.user.id,
      'delete',
      'demographic_snapshots',
      { company_id: snapshot.company_id }
    );

    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Archive instead of delete for audit purposes
    snapshot.is_active = false;
    await snapshot.save();

    return NextResponse.json({
      success: true,
      message: 'Demographic snapshot archived successfully',
    });
  } catch (error) {
    console.error('Error archiving demographic snapshot:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
