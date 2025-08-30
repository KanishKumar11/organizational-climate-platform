import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import DemographicVersioningService from '../../../../lib/demographic-versioning';
import { validatePermissions } from '../../../../lib/permissions';

// GET /api/demographics/impact - Get demographic impact analysis for survey results
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const surveyId = searchParams.get('survey_id');
    const version = searchParams.get('version');
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
      companyId
    );

    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const impactAnalysis =
      await DemographicVersioningService.analyzeDemographicImpact(
        surveyId,
        version ? parseInt(version) : undefined
      );

    if (!impactAnalysis) {
      return NextResponse.json({
        success: true,
        data: null,
        message:
          'Insufficient data for impact analysis (need at least 2 snapshots)',
      });
    }

    return NextResponse.json({
      success: true,
      data: impactAnalysis,
    });
  } catch (error) {
    console.error('Error analyzing demographic impact:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
