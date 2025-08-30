import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { advancedNLP } from '../../../../../lib/advanced-nlp';
import { connectDB } from '../../../../../lib/db';
import { Response } from '../../../../../models/Response';
import { Survey } from '../../../../../models/Survey';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      surveyId,
      companyId,
      departmentId,
      timeframe = 'weekly',
      includeTopics = true,
    } = await request.json();

    // Validate required parameters
    if (!companyId && !surveyId) {
      return NextResponse.json(
        { error: 'Either companyId or surveyId is required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Build query filters
    const responseFilter: any = {};

    if (surveyId) {
      responseFilter.survey_id = surveyId;
    } else {
      // Get surveys for the company/department
      const surveyFilter: any = { company_id: companyId };
      if (departmentId) {
        surveyFilter.target_departments = departmentId;
      }

      const surveys = await Survey.find(surveyFilter).lean();
      const surveyIds = surveys.map((s) => s._id);
      responseFilter.survey_id = { $in: surveyIds };
    }

    // Get text responses only
    responseFilter.$or = [
      { response_type: 'text' },
      { response_value: { $type: 'string' } },
    ];

    const responses = await Response.find(responseFilter).lean();

    if (responses.length === 0) {
      return NextResponse.json({
        success: true,
        sentimentTrend: {
          timeframe,
          overallSentiment: {
            score: 0,
            magnitude: 0,
            classification: 'neutral',
            confidence: 0,
          },
          trends: [],
          topicSentiments: [],
          anomalies: [],
        },
        message: 'No text responses found for sentiment analysis',
      });
    }

    // Prepare text data with dates
    const textData = responses
      .flatMap((r) =>
        (r.responses || []).map((qr) => ({
          ...qr,
          created_at: r.created_at,
          survey_id: r.survey_id,
          user_id: r.user_id,
          company_id: r.company_id,
          department_id: r.department_id,
        }))
      )
      .map((r) => {
        if (
          typeof r.response_value === 'string' &&
          r.response_value.trim().length > 5
        ) {
          return {
            text: r.response_value.trim(),
            date: new Date(r.created_at),
            metadata: {
              surveyId: r.survey_id,
              userId: r.user_id,
              questionId: r.question_id,
            },
          };
        }
        return null;
      })
      .filter(Boolean) as Array<{ text: string; date: Date; metadata?: any }>;

    if (textData.length === 0) {
      return NextResponse.json({
        success: true,
        sentimentTrend: {
          timeframe,
          overallSentiment: {
            score: 0,
            magnitude: 0,
            classification: 'neutral',
            confidence: 0,
          },
          trends: [],
          topicSentiments: [],
          anomalies: [],
        },
        message: 'No valid text content found for sentiment analysis',
      });
    }

    // Perform sentiment trend analysis
    const sentimentTrend = await advancedNLP.analyzeSentimentTrends(
      textData,
      timeframe as 'daily' | 'weekly' | 'monthly'
    );

    // Generate additional insights
    const insights = this.generateSentimentInsights(sentimentTrend, textData);

    return NextResponse.json({
      success: true,
      sentimentTrend,
      insights,
      metadata: {
        totalResponses: responses.length,
        textDocuments: textData.length,
        timeframe,
        analysisDate: new Date().toISOString(),
        dateRange: {
          start: Math.min(...textData.map((t) => t.date.getTime())),
          end: Math.max(...textData.map((t) => t.date.getTime())),
        },
      },
    });
  } catch (error) {
    console.error('Sentiment trend analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze sentiment trends' },
      { status: 500 }
    );
  }
}

// Helper function to generate sentiment insights
function generateSentimentInsights(
  sentimentTrend: any,
  textData: any[]
): any[] {
  const insights = [];

  // Overall sentiment insight
  const overall = sentimentTrend.overallSentiment;
  insights.push({
    type: 'overall',
    title: `Overall Sentiment: ${overall.classification.replace('_', ' ').toUpperCase()}`,
    description: `Average sentiment score of ${overall.score.toFixed(2)} with ${overall.confidence.toFixed(2)} confidence`,
    score: overall.score,
    classification: overall.classification,
    impact: Math.abs(overall.score) > 0.3 ? 'high' : 'medium',
    recommendations: this.getSentimentRecommendations(overall.classification),
  });

  // Trend direction insight
  if (sentimentTrend.trends.length >= 2) {
    const firstTrend = sentimentTrend.trends[0];
    const lastTrend = sentimentTrend.trends[sentimentTrend.trends.length - 1];
    const trendChange = lastTrend.sentiment.score - firstTrend.sentiment.score;

    let trendDirection = 'stable';
    if (trendChange > 0.1) trendDirection = 'improving';
    else if (trendChange < -0.1) trendDirection = 'declining';

    insights.push({
      type: 'trend',
      title: `Sentiment Trend: ${trendDirection.toUpperCase()}`,
      description: `Sentiment has ${trendDirection === 'improving' ? 'improved' : trendDirection === 'declining' ? 'declined' : 'remained stable'} by ${Math.abs(trendChange).toFixed(2)} points`,
      change: trendChange,
      direction: trendDirection,
      impact: Math.abs(trendChange) > 0.2 ? 'high' : 'medium',
      recommendations: this.getTrendRecommendations(
        trendDirection,
        trendChange
      ),
    });
  }

  // Topic sentiment insights
  const negativeTopics = sentimentTrend.topicSentiments
    .filter((ts: any) => ts.sentiment.score < -0.2)
    .sort((a: any, b: any) => a.sentiment.score - b.sentiment.score)
    .slice(0, 3);

  if (negativeTopics.length > 0) {
    insights.push({
      type: 'negative_topics',
      title: 'Topics with Negative Sentiment',
      description: 'Areas requiring attention based on sentiment analysis',
      topics: negativeTopics.map((ts: any) => ({
        name: ts.topicName,
        score: ts.sentiment.score,
        trend: ts.trend,
      })),
      impact: 'high',
      recommendations: [
        'Focus improvement efforts on these specific areas',
        'Conduct deeper analysis of negative feedback',
        'Develop targeted action plans for each topic',
      ],
    });
  }

  const positiveTopics = sentimentTrend.topicSentiments
    .filter((ts: any) => ts.sentiment.score > 0.2)
    .sort((a: any, b: any) => b.sentiment.score - a.sentiment.score)
    .slice(0, 3);

  if (positiveTopics.length > 0) {
    insights.push({
      type: 'positive_topics',
      title: 'Topics with Positive Sentiment',
      description: 'Organizational strengths based on sentiment analysis',
      topics: positiveTopics.map((ts: any) => ({
        name: ts.topicName,
        score: ts.sentiment.score,
        trend: ts.trend,
      })),
      impact: 'medium',
      recommendations: [
        'Leverage these strengths in other areas',
        'Share best practices from these topics',
        'Maintain focus on these positive areas',
      ],
    });
  }

  // Anomaly insights
  sentimentTrend.anomalies.forEach((anomaly: any) => {
    insights.push({
      type: 'anomaly',
      title: `Sentiment ${anomaly.type.charAt(0).toUpperCase() + anomaly.type.slice(1)}`,
      description: anomaly.description,
      date: anomaly.date,
      severity: anomaly.severity,
      affectedTopics: anomaly.affectedTopics,
      impact: anomaly.severity === 'high' ? 'high' : 'medium',
      recommendations: [
        'Investigate the root cause of this sentiment change',
        'Review organizational events around this time',
        'Consider immediate intervention if needed',
      ],
    });
  });

  // Volume and engagement insights
  const totalVolume = sentimentTrend.trends.reduce(
    (sum: number, t: any) => sum + t.volume,
    0
  );
  const avgVolume = totalVolume / sentimentTrend.trends.length;

  const lowVolumePercentage =
    sentimentTrend.trends.filter((t: any) => t.volume < avgVolume * 0.5)
      .length / sentimentTrend.trends.length;

  if (lowVolumePercentage > 0.3) {
    insights.push({
      type: 'engagement',
      title: 'Low Response Volume Detected',
      description: `${(lowVolumePercentage * 100).toFixed(1)}% of time periods had below-average response volume`,
      impact: 'medium',
      recommendations: [
        'Investigate barriers to feedback participation',
        'Improve communication about feedback importance',
        'Consider alternative feedback collection methods',
      ],
    });
  }

  return insights.sort((a, b) => {
    const impactWeight = { high: 3, medium: 2, low: 1 };
    return impactWeight[b.impact] - impactWeight[a.impact];
  });
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const departmentId = searchParams.get('departmentId');
    const period = searchParams.get('period') || '6months';
    const timeframe = searchParams.get('timeframe') || 'weekly';

    if (!companyId) {
      return NextResponse.json(
        { error: 'companyId is required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Calculate period in months
    const periodMonths =
      period === '3months' ? 3 : period === '12months' ? 12 : 6;
    const startDate = new Date(
      Date.now() - periodMonths * 30 * 24 * 60 * 60 * 1000
    );

    // Build survey filter
    const surveyFilter: any = {
      company_id: companyId,
      created_at: { $gte: startDate },
    };

    if (departmentId) {
      surveyFilter.target_departments = departmentId;
    }

    const surveys = await Survey.find(surveyFilter).lean();
    const surveyIds = surveys.map((s) => s._id);

    // Get text responses
    const responses = await Response.find({
      survey_id: { $in: surveyIds },
      created_at: { $gte: startDate },
      $or: [{ response_type: 'text' }, { response_value: { $type: 'string' } }],
    }).lean();

    // Prepare text data
    const textData = responses
      .flatMap((r) =>
        (r.responses || []).map((qr) => ({
          ...qr,
          created_at: r.created_at,
          survey_id: r.survey_id,
          user_id: r.user_id,
        }))
      )
      .map((r) => {
        if (
          typeof r.response_value === 'string' &&
          r.response_value.trim().length > 5
        ) {
          return {
            text: r.response_value.trim(),
            date: new Date(r.created_at),
            metadata: {
              surveyId: r.survey_id,
              userId: r.user_id,
            },
          };
        }
        return null;
      })
      .filter(Boolean) as Array<{ text: string; date: Date; metadata?: any }>;

    if (textData.length === 0) {
      return NextResponse.json({
        success: true,
        trends: [],
        summary: {
          overallSentiment: 0,
          totalTexts: 0,
          timeframe,
          period,
        },
      });
    }

    // Analyze sentiment trends
    const sentimentTrend = await advancedNLP.analyzeSentimentTrends(
      textData,
      timeframe as 'daily' | 'weekly' | 'monthly'
    );

    // Calculate additional statistics
    const sentimentScores = sentimentTrend.trends.map((t) => t.sentiment.score);
    const avgSentiment =
      sentimentScores.reduce((sum, score) => sum + score, 0) /
      sentimentScores.length;
    const sentimentVariance =
      sentimentScores.reduce(
        (sum, score) => sum + Math.pow(score - avgSentiment, 2),
        0
      ) / sentimentScores.length;
    const sentimentStdDev = Math.sqrt(sentimentVariance);

    // Identify best and worst periods
    const sortedTrends = [...sentimentTrend.trends].sort(
      (a, b) => a.sentiment.score - b.sentiment.score
    );
    const worstPeriod = sortedTrends[0];
    const bestPeriod = sortedTrends[sortedTrends.length - 1];

    // Calculate sentiment distribution
    const sentimentDistribution = {
      very_negative: sentimentTrend.trends.filter(
        (t) => t.sentiment.score <= -0.6
      ).length,
      negative: sentimentTrend.trends.filter(
        (t) => t.sentiment.score > -0.6 && t.sentiment.score <= -0.2
      ).length,
      neutral: sentimentTrend.trends.filter(
        (t) => t.sentiment.score > -0.2 && t.sentiment.score < 0.2
      ).length,
      positive: sentimentTrend.trends.filter(
        (t) => t.sentiment.score >= 0.2 && t.sentiment.score < 0.6
      ).length,
      very_positive: sentimentTrend.trends.filter(
        (t) => t.sentiment.score >= 0.6
      ).length,
    };

    return NextResponse.json({
      success: true,
      trends: sentimentTrend.trends,
      topicSentiments: sentimentTrend.topicSentiments,
      anomalies: sentimentTrend.anomalies,
      summary: {
        overallSentiment: sentimentTrend.overallSentiment,
        avgSentiment,
        sentimentStdDev,
        totalTexts: textData.length,
        timeframe,
        period,
        periodsAnalyzed: sentimentTrend.trends.length,
        bestPeriod: {
          date: bestPeriod?.date,
          score: bestPeriod?.sentiment.score,
          volume: bestPeriod?.volume,
        },
        worstPeriod: {
          date: worstPeriod?.date,
          score: worstPeriod?.sentiment.score,
          volume: worstPeriod?.volume,
        },
        sentimentDistribution,
      },
    });
  } catch (error) {
    console.error('Sentiment trends history error:', error);
    return NextResponse.json(
      { error: 'Failed to get sentiment trends history' },
      { status: 500 }
    );
  }
}
