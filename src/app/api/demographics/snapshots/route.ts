import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import DemographicVersioningService from '../../../../lib/demographic-versioning';
import { validatePermissions } from '../../../../lib/permissions';

// GET /api/demographics/snapshots - Get demographic snapshots for a survey
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const surveyId = searchParams.get('survey_id');
    const companyId = searchParams.get('company_id');

    if (!surveyId) {
      return NextResponse.json(
        { error: 'Survey ID is required' },
        { status: 400 }
      );
    }

    // Validate permissions
    const hasPermission = await validatePermissions(
      session.user.id,
      'read',
      'demographic_snapshots',
      { company_id: companyId }
    );

    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const snapshots =
      await DemographicVersioningService.getDemographicHistory(surveyId);

    return NextResponse.json({
      success: true,
      data: snapshots,
    });
  } catch (error) {
    console.error('Error fetching demographic snapshots:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/demographics/snapshots - Create a new demographic snapshot
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { survey_id, company_id, reason, options } = body;

    if (!survey_id || !company_id || !reason) {
      return NextResponse.json(
        { error: 'Survey ID, Company ID, and reason are required' },
        { status: 400 }
      );
    }

    // Validate permissions
    const hasPermission = await validatePermissions(
      session.user.id,
      'create',
      'demographic_snapshots',
      { company_id }
    );

    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const snapshot = await DemographicVersioningService.createSnapshot(
      survey_id,
      company_id,
      session.user.id,
      reason,
      options
    );

    return NextResponse.json({
      success: true,
      data: snapshot,
      message: 'Demographic snapshot created successfully',
    });
  } catch (error) {
    console.error('Error creating demographic snapshot:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
