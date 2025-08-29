import { NextRequest, NextResponse } from 'next/server';
import { processSurveyResponses } from '@/lib/ai-service';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { responses, context } = await request.json();

    if (!responses || !context) {
      return NextResponse.json(
        { error: 'Missing responses or context' },
        { status: 400 }
      );
    }

    // Process responses using JavaScript AI service
    const analysis = await processSurveyResponses(responses, context);

    return NextResponse.json({
      success: true,
      analysis,
      processedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('AI analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze responses' },
      { status: 500 }
    );
  }
}
