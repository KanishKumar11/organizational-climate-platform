import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import DemographicVersioningService from '../../../../lib/demographic-versioning';
import { validatePermissions } from '../../../../lib/permissions';

// POST /api/demographics/compare - Compare two demographic snapshots
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { snapshot1_id, snapshot2_id, company_id } = body;

    if (!snapshot1_id || !snapshot2_id) {
      return NextResponse.json(
        { error: 'Both snapshot IDs are required' },
        { status: 400 }
      );
    }

    // Validate permissions
    const hasPermission = await validatePermissions(
      session.user.id,
      'read',
      'demographic_snapshots',
      { company_id }
    );

    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const comparison = await DemographicVersioningService.compareSnapshots(
      snapshot1_id,
      snapshot2_id
    );

    return NextResponse.json({
      success: true,
      data: comparison,
    });
  } catch (error) {
    console.error('Error comparing demographic snapshots:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
