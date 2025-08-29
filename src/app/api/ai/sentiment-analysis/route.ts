import { NextRequest, NextResponse } from 'next/server';
import { aiService } from '@/lib/ai-service';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { texts } = await request.json();

    if (!texts || !Array.isArray(texts)) {
      return NextResponse.json(
        { error: 'Missing or invalid texts array' },
        { status: 400 }
      );
    }

    // Analyze sentiment for each text
    const sentimentResults = texts.map((text) => ({
      text,
      sentiment: aiService.analyzeSentiment(text),
    }));

    // Calculate overall sentiment metrics
    const overallScore =
      sentimentResults.reduce(
        (sum, result) => sum + result.sentiment.score,
        0
      ) / sentimentResults.length;

    const overallComparative =
      sentimentResults.reduce(
        (sum, result) => sum + result.sentiment.comparative,
        0
      ) / sentimentResults.length;

    // Extract themes from all texts
    const themes = aiService.extractThemes(texts);

    return NextResponse.json({
      success: true,
      results: sentimentResults,
      overall: {
        score: overallScore,
        comparative: overallComparative,
        sentiment:
          overallComparative > 0.1
            ? 'positive'
            : overallComparative < -0.1
              ? 'negative'
              : 'neutral',
      },
      themes,
      processedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Sentiment analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze sentiment' },
      { status: 500 }
    );
  }
}
