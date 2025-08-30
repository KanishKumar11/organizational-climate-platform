import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import AIReanalysisTriggerService from '../../../../../lib/ai-reanalysis-triggers';
import { hasStringPermission } from '../../../../../lib/permissions';

// GET /api/ai/reanalysis/config - Get reanalysis configuration
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const surveyId = searchParams.get('survey_id');
    const companyId = searchParams.get('company_id');

    if (!surveyId || !companyId) {
      return NextResponse.json(
        { error: 'Survey ID and Company ID are required' },
        { status: 400 }
      );
    }

    // Validate permissions
    if (!hasStringPermission(session.user.role, 'manage_ai_insights')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const config = await AIReanalysisTriggerService.getReanalysisConfig(
      surveyId,
      companyId
    );

    return NextResponse.json({
      success: true,
      data: config,
    });
  } catch (error) {
    console.error('Error fetching reanalysis config:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/ai/reanalysis/config - Update reanalysis configuration
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { survey_id, company_id, config } = body;

    if (!survey_id || !company_id || !config) {
      return NextResponse.json(
        { error: 'Survey ID, Company ID, and config are required' },
        { status: 400 }
      );
    }

    // Validate permissions - only company admins and super admins can update config
    if (!hasStringPermission(session.user.role, 'manage_ai_insights')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Validate config values
    if (config.trigger_threshold !== undefined) {
      if (
        typeof config.trigger_threshold !== 'number' ||
        config.trigger_threshold < 0 ||
        config.trigger_threshold > 100
      ) {
        return NextResponse.json(
          { error: 'Trigger threshold must be a number between 0 and 100' },
          { status: 400 }
        );
      }
    }

    const updatedConfig =
      await AIReanalysisTriggerService.updateReanalysisConfig(
        survey_id,
        company_id,
        config,
        session.user.id
      );

    return NextResponse.json({
      success: true,
      data: updatedConfig,
      message: 'Reanalysis configuration updated successfully',
    });
  } catch (error) {
    console.error('Error updating reanalysis config:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}


