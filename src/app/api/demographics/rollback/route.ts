import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import DemographicVersioningService from '../../../../lib/demographic-versioning';
import { validatePermissions } from '../../../../lib/permissions';

// POST /api/demographics/rollback - Rollback to a previous demographic snapshot
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { survey_id, target_version, reason, company_id } = body;

    if (!survey_id || !target_version || !reason) {
      return NextResponse.json(
        { error: 'Survey ID, target version, and reason are required' },
        { status: 400 }
      );
    }

    // Validate permissions - only company admins and super admins can rollback
    const hasPermission = await validatePermissions(
      session.user.id,
      'update',
      company_id
    );

    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const rollbackSnapshot =
      await DemographicVersioningService.rollbackToSnapshot(
        survey_id,
        target_version,
        session.user.id,
        reason
      );

    return NextResponse.json({
      success: true,
      data: rollbackSnapshot,
      message: `Successfully rolled back to version ${target_version}`,
    });
  } catch (error) {
    console.error('Error rolling back demographic snapshot:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}


