import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import AIReanalysisTriggerService from '../../../../../lib/ai-reanalysis-triggers';
import { hasStringPermission } from '../../../../../lib/permissions';

// POST /api/ai/reanalysis/assess - Assess demographic impact and reanalysis need
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { survey_id, changes, company_id } = body;

    if (!survey_id || !changes || !Array.isArray(changes)) {
      return NextResponse.json(
        { error: 'Survey ID and changes array are required' },
        { status: 400 }
      );
    }

    // Validate permissions
    if (!hasStringPermission(session.user.role, 'manage_ai_insights')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const assessment = await AIReanalysisTriggerService.assessDemographicImpact(
      survey_id,
      changes
    );

    return NextResponse.json({
      success: true,
      data: assessment,
    });
  } catch (error) {
    console.error('Error assessing demographic impact:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
