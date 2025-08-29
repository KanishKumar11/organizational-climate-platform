import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import AIReanalysisTriggerService from '../../../../../lib/ai-reanalysis-triggers';
import { validatePermissions } from '../../../../../lib/permissions';

// POST /api/ai/reanalysis/trigger - Manually trigger AI re-analysis
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { survey_id, reason, company_id, incremental_only = true } = body;

    if (!survey_id || !reason) {
      return NextResponse.json(
        { error: 'Survey ID and reason are required' },
        { status: 400 }
      );
    }

    // Validate permissions - only company admins and super admins can trigger reanalysis
    const hasPermission = await validatePermissions(
      session.user.id,
      'update',
      'ai_insights',
      { company_id, require_admin: true }
    );

    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const result = await AIReanalysisTriggerService.triggerReanalysis(
      survey_id,
      session.user.id,
      reason,
      undefined, // No impact analysis for manual trigger
      incremental_only
    );

    return NextResponse.json({
      success: true,
      data: result,
      message: 'AI re-analysis triggered successfully',
    });
  } catch (error) {
    console.error('Error triggering AI re-analysis:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
