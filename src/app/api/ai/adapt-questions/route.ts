import { NextRequest, NextResponse } from 'next/server';
import {
  adaptQuestionsForDemographic,
  generateAdaptiveQuestions,
} from '@/lib/ai-service';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { questionIds, context, generateNew } = await request.json();

    if (!context) {
      return NextResponse.json(
        { error: 'Missing demographic context' },
        { status: 400 }
      );
    }

    let adaptedQuestions = [];
    let newQuestions = [];

    // Adapt existing questions if provided
    if (questionIds && questionIds.length > 0) {
      adaptedQuestions = await adaptQuestionsForDemographic(
        questionIds,
        context
      );
    }

    // Generate new questions if requested
    if (generateNew) {
      const categories = [
        'communication',
        'collaboration',
        'leadership',
        'worklife',
        'growth',
      ];
      for (const category of categories) {
        const categoryQuestions = await generateAdaptiveQuestions(
          category,
          context,
          2
        );
        newQuestions.push(
          ...categoryQuestions.map((q) => ({ category, question: q }))
        );
      }
    }

    return NextResponse.json({
      success: true,
      adaptedQuestions,
      newQuestions,
      context,
      processedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Question adaptation error:', error);
    return NextResponse.json(
      { error: 'Failed to adapt questions' },
      { status: 500 }
    );
  }
}
