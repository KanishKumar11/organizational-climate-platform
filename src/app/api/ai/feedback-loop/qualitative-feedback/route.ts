import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  processQualitativeFeedback,
  aiFeedbackLoop,
} from '../../../../../lib/ai-feedback-loop';
import { connectDB } from '../../../../../lib/db';

// Helper function to classify sentiment
function classifySentiment(score: number): string {
  if (score <= -0.6) return 'very_negative';
  if (score <= -0.2) return 'negative';
  if (score >= 0.6) return 'very_positive';
  if (score >= 0.2) return 'positive';
  return 'neutral';
}

// Helper function to calculate overall confidence
function calculateOverallConfidence(insights: any[]): number {
  if (insights.length === 0) return 0.5;
  return (
    insights.reduce((sum, insight) => sum + insight.confidence, 0) /
    insights.length
  );
}

// Helper function to calculate feedback analytics
function calculateFeedbackAnalytics(feedback: any[]): any {
  if (feedback.length === 0) {
    return {
      totalFeedback: 0,
      averageSentiment: 0,
      sentimentDistribution: {},
      topThemes: [],
      topEntities: [],
      sourceDistribution: {},
      insightSummary: {},
    };
  }

  // Sentiment analytics
  const sentiments = feedback.map((f: any) => f.sentiment);
  const averageSentiment =
    sentiments.reduce((sum: number, s: number) => sum + s, 0) /
    sentiments.length;

  const sentimentDistribution = {
    very_positive: feedback.filter((f: any) => f.sentiment >= 0.6).length,
    positive: feedback.filter(
      (f: any) => f.sentiment >= 0.2 && f.sentiment < 0.6
    ).length,
    neutral: feedback.filter(
      (f: any) => f.sentiment > -0.2 && f.sentiment < 0.2
    ).length,
    negative: feedback.filter(
      (f: any) => f.sentiment <= -0.2 && f.sentiment > -0.6
    ).length,
    very_negative: feedback.filter((f: any) => f.sentiment <= -0.6).length,
  };

  // Theme analytics
  const allThemes = feedback.flatMap((f: any) => f.themes);
  const themeFrequency = allThemes.reduce(
    (acc: Record<string, number>, theme: string) => {
      acc[theme] = (acc[theme] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const topThemes = Object.entries(themeFrequency)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 10)
    .map(([theme, count]) => ({
      theme,
      count,
      percentage: ((count as number) / feedback.length) * 100,
    }));

  // Entity analytics
  const allEntities = feedback.flatMap((f: any) => f.entities);
  const entityFrequency = allEntities.reduce(
    (acc: Record<string, number>, entity: string) => {
      acc[entity] = (acc[entity] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const topEntities = Object.entries(entityFrequency)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 10)
    .map(([entity, count]) => ({
      entity,
      count,
      percentage: ((count as number) / feedback.length) * 100,
    }));

  // Source distribution
  const sourceDistribution = feedback.reduce(
    (acc: Record<string, number>, f: any) => {
      acc[f.source] = (acc[f.source] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  // Insight summary
  const allInsights = feedback.flatMap((f: any) => f.insights);
  const insightSummary = {
    totalInsights: allInsights.length,
    highImpact: allInsights.filter((i: any) => i.impact === 'high').length,
    mediumImpact: allInsights.filter((i: any) => i.impact === 'medium').length,
    lowImpact: allInsights.filter((i: any) => i.impact === 'low').length,
    averageConfidence:
      allInsights.length > 0
        ? allInsights.reduce((sum: number, i: any) => sum + i.confidence, 0) /
          allInsights.length
        : 0,
    topInsightTypes: getTopInsightTypes(allInsights),
  };

  return {
    totalFeedback: feedback.length,
    averageSentiment: Math.round(averageSentiment * 100) / 100,
    sentimentDistribution,
    topThemes,
    topEntities,
    sourceDistribution,
    insightSummary,
  };
}

// Helper function to get top insight types
function getTopInsightTypes(insights: any[]): any[] {
  const typeFrequency = insights.reduce(
    (acc: Record<string, number>, insight: any) => {
      acc[insight.type] = (acc[insight.type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return Object.entries(typeFrequency)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 5)
    .map(([type, count]) => ({ type, count }));
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { source, content, companyId, surveyId, actionPlanId, metadata } =
      await request.json();

    // Validate required parameters
    if (!source || !content) {
      return NextResponse.json(
        { error: 'source and content are required' },
        { status: 400 }
      );
    }

    if (!['survey', 'microclimate', 'action_plan', 'manual'].includes(source)) {
      return NextResponse.json(
        {
          error:
            'source must be one of: survey, microclimate, action_plan, manual',
        },
        { status: 400 }
      );
    }

    if (content.trim().length < 10) {
      return NextResponse.json(
        { error: 'content must be at least 10 characters long' },
        { status: 400 }
      );
    }

    await connectDB();

    // Prepare feedback data
    const feedbackData = {
      source: source as 'survey' | 'microclimate' | 'action_plan' | 'manual',
      content: content.trim(),
      timestamp: new Date(),
      metadata: {
        ...metadata,
        companyId,
        surveyId,
        actionPlanId,
        userId: session.user.id,
        submittedAt: new Date().toISOString(),
      },
    };

    // Process the qualitative feedback
    const feedbackId = await processQualitativeFeedback(feedbackData);

    // Get the processed feedback with insights
    const processedFeedback =
      aiFeedbackLoop.getQualitativeFeedbackInsights(1)[0];

    return NextResponse.json({
      success: true,
      message: 'Qualitative feedback processed successfully',
      feedbackId,
      analysis: {
        sentiment: processedFeedback.sentiment,
        sentimentClassification: classifySentiment(processedFeedback.sentiment),
        themes: processedFeedback.themes,
        entities: processedFeedback.entities,
        insights: processedFeedback.insights,
        confidence: calculateOverallConfidence(processedFeedback.insights),
      },
    });
  } catch (error) {
    console.error('Qualitative feedback processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process qualitative feedback' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const source = searchParams.get('source');
    const limit = parseInt(searchParams.get('limit') || '50');
    const sentiment = searchParams.get('sentiment'); // 'positive', 'negative', 'neutral'
    const theme = searchParams.get('theme');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    await connectDB();

    // Get qualitative feedback insights
    let feedbackInsights = aiFeedbackLoop.getQualitativeFeedbackInsights(
      limit * 2
    ); // Get more to allow filtering

    // Apply filters
    if (source) {
      feedbackInsights = feedbackInsights.filter((f) => f.source === source);
    }

    if (sentiment) {
      feedbackInsights = feedbackInsights.filter((f) => {
        const sentimentClass = classifySentiment(f.sentiment);
        return (
          (sentiment === 'positive' &&
            (sentimentClass === 'positive' ||
              sentimentClass === 'very_positive')) ||
          (sentiment === 'negative' &&
            (sentimentClass === 'negative' ||
              sentimentClass === 'very_negative')) ||
          (sentiment === 'neutral' && sentimentClass === 'neutral')
        );
      });
    }

    if (theme) {
      feedbackInsights = feedbackInsights.filter((f) =>
        f.themes.some((t) => t.toLowerCase().includes(theme.toLowerCase()))
      );
    }

    if (startDate) {
      const start = new Date(startDate);
      feedbackInsights = feedbackInsights.filter((f) => f.timestamp >= start);
    }

    if (endDate) {
      const end = new Date(endDate);
      feedbackInsights = feedbackInsights.filter((f) => f.timestamp <= end);
    }

    // Limit results
    feedbackInsights = feedbackInsights.slice(0, limit);

    // Calculate analytics
    const analytics = calculateFeedbackAnalytics(feedbackInsights);

    return NextResponse.json({
      success: true,
      feedback: feedbackInsights.map((f) => ({
        id: f.id,
        source: f.source,
        content:
          f.content.substring(0, 200) + (f.content.length > 200 ? '...' : ''), // Truncate for overview
        sentiment: f.sentiment,
        sentimentClassification: classifySentiment(f.sentiment),
        themes: f.themes,
        entities: f.entities,
        timestamp: f.timestamp,
        insightCount: f.insights.length,
        highImpactInsights: f.insights.filter((i) => i.impact === 'high')
          .length,
      })),
      analytics,
    });
  } catch (error) {
    console.error('Qualitative feedback retrieval error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve qualitative feedback' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { feedbackId, processed, additionalInsights } = await request.json();

    // Validate required parameters
    if (!feedbackId) {
      return NextResponse.json(
        { error: 'feedbackId is required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Get current feedback
    const allFeedback = aiFeedbackLoop.getQualitativeFeedbackInsights(1000);
    const feedback = allFeedback.find((f) => f.id === feedbackId);

    if (!feedback) {
      return NextResponse.json(
        { error: 'Feedback not found' },
        { status: 404 }
      );
    }

    // Update feedback properties
    if (processed !== undefined) {
      feedback.processed = processed;
    }

    if (additionalInsights && Array.isArray(additionalInsights)) {
      feedback.insights.push(...additionalInsights);
    }

    return NextResponse.json({
      success: true,
      message: 'Qualitative feedback updated successfully',
      feedback: {
        id: feedback.id,
        processed: feedback.processed,
        insightCount: feedback.insights.length,
      },
    });
  } catch (error) {
    console.error('Qualitative feedback update error:', error);
    return NextResponse.json(
      { error: 'Failed to update qualitative feedback' },
      { status: 500 }
    );
  }
}


