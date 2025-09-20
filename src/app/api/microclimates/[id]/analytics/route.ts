/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Microclimate from '@/models/Microclimate';
import Response from '@/models/Response';
import AIInsight from '@/models/AIInsight';
import { sanitizeForSerialization } from '@/lib/datetime-utils';

// Get microclimate analytics
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;

    const microclimateId = id;
    const { searchParams } = new URL(request.url);
    const includeInsights = searchParams.get('insights') === 'true';
    const includeWordCloud = searchParams.get('word_cloud') === 'true';
    const includeSentiment = searchParams.get('sentiment') === 'true';

    // Get microclimate
    const microclimate = await Microclimate.findById(microclimateId);
    if (!microclimate) {
      return NextResponse.json(
        { error: 'Microclimate not found' },
        { status: 404 }
      );
    }

    // Check permissions
    if (
      microclimate.company_id !== session.user.companyId &&
      session.user.role !== 'super_admin'
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get responses for this microclimate
    const responses = await Response.find({
      survey_id: microclimateId,
      survey_type: 'microclimate',
    });

    // Calculate basic analytics
    const totalResponses = responses.length;
    const participationRate =
      microclimate.target_participant_count > 0
        ? (totalResponses / microclimate.target_participant_count) * 100
        : 0;

    // Response distribution by question
    const questionAnalytics = microclimate.questions.map((question) => {
      const questionResponses = responses.flatMap((response) =>
        response.responses.filter((r) => r.question_id === question.id)
      );

      let analytics: any = {
        question_id: question.id,
        question_text: question.text,
        question_type: question.type,
        response_count: questionResponses.length,
        response_rate:
          totalResponses > 0
            ? (questionResponses.length / totalResponses) * 100
            : 0,
      };

      // Type-specific analytics
      if (question.type === 'likert' || question.type === 'emoji_rating') {
        const numericResponses = questionResponses
          .map((r) => parseFloat(r.response_value as string))
          .filter((val) => !isNaN(val));

        if (numericResponses.length > 0) {
          analytics.average_score =
            numericResponses.reduce((a, b) => a + b, 0) /
            numericResponses.length;
          analytics.score_distribution = {};

          numericResponses.forEach((score) => {
            analytics.score_distribution[score] =
              (analytics.score_distribution[score] || 0) + 1;
          });
        }
      } else if (question.type === 'multiple_choice') {
        analytics.option_distribution = {};
        questionResponses.forEach((response) => {
          const value = response.response_value as string;
          analytics.option_distribution[value] =
            (analytics.option_distribution[value] || 0) + 1;
        });
      } else if (question.type === 'open_ended') {
        analytics.text_responses = questionResponses.map((r) => ({
          response: r.response_text || r.response_value,
        }));
      }

      return analytics;
    });

    // Real-time engagement metrics
    const engagementMetrics = {
      response_velocity: calculateResponseVelocity(responses),
      peak_participation_time: calculatePeakParticipationTime(responses),
      average_response_time: calculateAverageResponseTime(responses),
      completion_rate:
        (responses.filter((r) => r.is_complete).length /
          Math.max(1, totalResponses)) *
        100,
    };

    // Sentiment analysis over time
    let sentimentAnalysis = null;
    if (includeSentiment) {
      sentimentAnalysis = {
        overall_sentiment: microclimate.live_results.sentiment_score || 0,
        sentiment_distribution: calculateSentimentDistribution(
          microclimate.live_results.sentiment_score
        ),
        sentiment_timeline: calculateSentimentTimeline(responses),
        sentiment_by_question: calculateSentimentByQuestion(
          microclimate.questions,
          responses
        ),
      };
    }

    // Word cloud data
    let wordCloudAnalysis = null;
    if (includeWordCloud) {
      wordCloudAnalysis = {
        top_words: microclimate.live_results.word_cloud_data || [],
        word_frequency: calculateWordFrequency(responses),
        trending_words: calculateTrendingWords(responses),
      };
    }

    // AI insights
    let aiInsights = null;
    if (includeInsights) {
      aiInsights = await AIInsight.find({
        survey_id: microclimateId,
        survey_type: 'microclimate',
      }).sort({ created_at: -1 });
    }

    const analytics = {
      microclimate: {
        id: microclimate._id,
        title: microclimate.title,
        status: microclimate.status,
        created_at: microclimate.created_at,
        duration_minutes: microclimate.scheduling.duration_minutes,
      },
      overview: {
        total_responses: totalResponses,
        target_participants: microclimate.target_participant_count,
        participation_rate: Math.round(participationRate * 100) / 100,
        completion_rate: engagementMetrics.completion_rate,
        engagement_level: microclimate.live_results.engagement_level || 'low',
      },
      questions: questionAnalytics,
      engagement: engagementMetrics,
      sentiment: sentimentAnalysis,
      word_cloud: wordCloudAnalysis,
      insights: aiInsights,
      generated_at: new Date().toISOString(),
    };

    return NextResponse.json(sanitizeForSerialization(analytics));
  } catch (error) {
    console.error('Error fetching microclimate analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper functions
function calculateResponseVelocity(responses: any[]): number {
  if (responses.length < 2) return 0;

  const sortedResponses = responses.sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  const firstResponse = new Date(sortedResponses[0].created_at);
  const lastResponse = new Date(
    sortedResponses[sortedResponses.length - 1].created_at
  );
  const timeSpanMinutes =
    (lastResponse.getTime() - firstResponse.getTime()) / (1000 * 60);

  return timeSpanMinutes > 0 ? responses.length / timeSpanMinutes : 0;
}

function calculatePeakParticipationTime(responses: any[]): string | null {
  if (responses.length === 0) return null;

  const hourCounts: Record<number, number> = {};

  responses.forEach((response) => {
    const hour = new Date(response.created_at).getHours();
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  });

  const peakHour = Object.entries(hourCounts).sort(
    ([, a], [, b]) => b - a
  )[0]?.[0];

  return peakHour ? `${peakHour}:00` : null;
}

function calculateAverageResponseTime(responses: any[]): number | null {
  const responseTimes = responses
    .filter((r) => r.total_time_seconds && r.total_time_seconds > 0)
    .map((r) => r.total_time_seconds);

  if (responseTimes.length === 0) return null;

  return responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
}

function calculateSentimentDistribution(sentimentScore: number): any {
  const score = sentimentScore || 0;

  return {
    positive: score > 0.2 ? Math.min(100, (score + 1) * 50) : 0,
    neutral: Math.abs(score) <= 0.2 ? 100 - Math.abs(score) * 250 : 0,
    negative: score < -0.2 ? Math.min(100, (1 - score) * 50) : 0,
  };
}

function calculateSentimentTimeline(responses: any[]): any[] {
  const timeline: Record<
    string,
    { positive: number; negative: number; neutral: number; count: number }
  > = {};

  responses.forEach((response) => {
    const date = response.created_at.toISOString().split('T')[0];
    if (!timeline[date]) {
      timeline[date] = { positive: 0, negative: 0, neutral: 0, count: 0 };
    }

    // Simple sentiment calculation based on response content
    const sentiment = calculateResponseSentiment(response);
    if (sentiment > 0.2) timeline[date].positive++;
    else if (sentiment < -0.2) timeline[date].negative++;
    else timeline[date].neutral++;

    timeline[date].count++;
  });

  return Object.entries(timeline).map(([date, data]) => ({
    date,
    positive_percentage: (data.positive / data.count) * 100,
    negative_percentage: (data.negative / data.count) * 100,
    neutral_percentage: (data.neutral / data.count) * 100,
    total_responses: data.count,
  }));
}

function calculateSentimentByQuestion(
  questions: any[],
  responses: any[]
): any[] {
  return questions.map((question) => {
    const questionResponses = responses.filter(
      (r) => r.question_id === question.id
    );
    const sentiments = questionResponses.map(calculateResponseSentiment);
    const avgSentiment =
      sentiments.length > 0
        ? sentiments.reduce((a, b) => a + b, 0) / sentiments.length
        : 0;

    return {
      question_id: question.id,
      question_text: question.text,
      average_sentiment: avgSentiment,
      response_count: questionResponses.length,
    };
  });
}

function calculateResponseSentiment(response: any): number {
  // Simple sentiment calculation - in production, use proper NLP
  if (response.response_value && typeof response.response_value === 'number') {
    // For Likert scales, convert to sentiment (-1 to 1)
    return (response.response_value - 3) / 2;
  }

  if (response.response_text) {
    // Basic text sentiment analysis
    const text = response.response_text.toLowerCase();
    const positiveWords = [
      'good',
      'great',
      'excellent',
      'happy',
      'satisfied',
      'positive',
    ];
    const negativeWords = [
      'bad',
      'terrible',
      'awful',
      'sad',
      'frustrated',
      'negative',
    ];

    let sentiment = 0;
    positiveWords.forEach((word) => {
      if (text.includes(word)) sentiment += 0.5;
    });
    negativeWords.forEach((word) => {
      if (text.includes(word)) sentiment -= 0.5;
    });

    return Math.max(-1, Math.min(1, sentiment));
  }

  return 0;
}

function calculateWordFrequency(responses: any[]): any[] {
  const wordCounts: Record<string, number> = {};

  responses.forEach((response) => {
    if (response.response_text) {
      const words = response.response_text
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter((word: string) => word.length > 3);

      words.forEach((word: string) => {
        wordCounts[word] = (wordCounts[word] || 0) + 1;
      });
    }
  });

  return Object.entries(wordCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 50)
    .map(([word, count]) => ({ word, count }));
}

function calculateTrendingWords(responses: any[]): any[] {
  // Simple trending calculation - words that appear more frequently in recent responses
  const recentResponses = responses
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    .slice(0, Math.floor(responses.length / 2));

  const recentWords = calculateWordFrequency(recentResponses);
  const allWords = calculateWordFrequency(responses);

  return recentWords
    .map((recent) => {
      const overall = allWords.find((w) => w.word === recent.word);
      const trendScore = overall ? recent.count / overall.count : 1;
      return { ...recent, trend_score: trendScore };
    })
    .filter((w) => w.trend_score > 1.2)
    .sort((a, b) => b.trend_score - a.trend_score)
    .slice(0, 10);
}
