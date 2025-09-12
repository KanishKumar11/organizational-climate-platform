import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Survey from '@/models/Survey';
import Response from '@/models/Response';
import { hasPermission } from '@/lib/permissions';

// Get survey analytics
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get survey
    const survey = await Survey.findById(id);
    if (!survey) {
      return NextResponse.json({ error: 'Survey not found' }, { status: 404 });
    }

    // Check permissions
    if (!hasPermission(session.user.role, 'company_admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get basic analytics
    const totalResponses = await Response.countDocuments({ survey_id: id });
    const completedResponses = await Response.countDocuments({ 
      survey_id: id, 
      status: 'completed' 
    });

    const analytics = {
      totalResponses,
      completedResponses,
      completionRate: totalResponses > 0 ? (completedResponses / totalResponses) * 100 : 0,
      surveyId: id,
      surveyTitle: survey.title
    };

    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Error fetching survey analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}