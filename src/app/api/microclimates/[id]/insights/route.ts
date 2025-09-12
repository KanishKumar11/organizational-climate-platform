import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Microclimate from '@/models/Microclimate';
import AIInsight from '@/models/AIInsight';
import Response from '@/models/Response';

// Get microclimate AI insights
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
    const type = searchParams.get('type'); // pattern, alert, recommendation
    const priority = searchParams.get('priority'); // low, medium, high, critical
    const limit = parseInt(searchParams.get('limit') || '20');

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

    // Build query for insights
    const insightQuery: any = {
      survey_id: microclimateId,
      survey_type: 'microclimate',
    };

    if (type) {
      insightQuery.type = type;
    }

    if (priority) {
      insightQuery.priority = priority;
    }

    // Get AI insights
    const insights = await AIInsight.find(insightQuery)
      .sort({ created_at: -1 })
      .limit(limit);

    // Get live insights from microclimate document
    const liveInsights = microclimate.ai_insights || [];

    // Combine and deduplicate insights
    const allInsights = [...liveInsights, ...insights];
    const uniqueInsights = allInsights.filter(
      (insight, index, self) =>
        index ===
        self.findIndex(
          (i) =>
            ((i as any).description || (i as any).message) === ((insight as any).description || (insight as any).message) &&
            Math.abs(
              new Date((i as any).timestamp || (i as any).createdAt).getTime() -
                new Date((insight as any).timestamp || (insight as any).createdAt).getTime()
            ) < 60000 // Within 1 minute
        )
    );

    // Sort by timestamp/createdAt
    uniqueInsights.sort((a, b) => {
      const dateA = new Date((a as any).timestamp || (a as any).createdAt);
      const dateB = new Date((b as any).timestamp || (b as any).createdAt);
      return dateB.getTime() - dateA.getTime();
    });

    // Generate summary statistics
    const insightSummary = {
      total_insights: uniqueInsights.length,
      by_type: {
        pattern: uniqueInsights.filter((i) => i.type === 'pattern').length,
        alert: uniqueInsights.filter((i) => i.type === 'alert').length,
        recommendation: uniqueInsights.filter(
          (i) => i.type === 'recommendation'
        ).length,
      },
      by_priority: {
        low: uniqueInsights.filter((i) => (i as any).priority === 'low').length,
        medium: uniqueInsights.filter((i) => (i as any).priority === 'medium').length,
        high: uniqueInsights.filter((i) => (i as any).priority === 'high').length,
        critical: uniqueInsights.filter((i) => (i as any).priority === 'critical')
          .length,
      },
      latest_insight: uniqueInsights[0] || null,
    };

    return NextResponse.json({
      microclimate: {
        id: microclimate._id,
        title: microclimate.title,
        status: microclimate.status,
      },
      insights: uniqueInsights.slice(0, limit),
      summary: insightSummary,
    });
  } catch (error) {
    console.error('Error fetching microclimate insights:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Generate new AI insights for microclimate
export async function POST(
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

    // Get responses for analysis
    const responses = await Response.find({
      survey_id: microclimateId,
      survey_type: 'microclimate',
    });

    // Generate insights based on current data
    const newInsights = await generateMicroclimateInsights(
      microclimate,
      responses
    );

    // Save insights to database
    const savedInsights = [];
    for (const insight of newInsights) {
      const aiInsight = new AIInsight({
        survey_id: microclimateId,
        survey_type: 'microclimate',
        type: insight.type,
        category: 'microclimate_analysis',
        title: insight.title || insight.message.substring(0, 50),
        description: insight.message,
        confidence_score: insight.confidence,
        priority: insight.priority || 'medium',
        affected_segments: insight.affected_segments || [],
        recommended_actions: insight.recommended_actions || [],
        metadata: {
          response_count: responses.length,
          participation_rate: microclimate.participation_rate,
          sentiment_score: microclimate.live_results?.sentiment_score,
          engagement_level: microclimate.live_results?.engagement_level,
        },
      });

      await aiInsight.save();
      savedInsights.push(aiInsight);
    }

    // Also update microclimate with live insights
    microclimate.ai_insights = [
      ...newInsights.map((insight) => ({
        type: insight.type,
        message: insight.message,
        confidence: insight.confidence,
        timestamp: new Date(),
      })),
      ...microclimate.ai_insights.slice(0, 5), // Keep only latest 5 live insights
    ].slice(0, 10);

    await microclimate.save();

    return NextResponse.json({
      success: true,
      insights_generated: savedInsights.length,
      insights: savedInsights,
    });
  } catch (error) {
    console.error('Error generating microclimate insights:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to generate insights
async function generateMicroclimateInsights(
  microclimate: any,
  responses: any[]
): Promise<any[]> {
  const insights = [];
  const participationRate = microclimate.participation_rate || 0;
  const sentimentScore = microclimate.live_results?.sentiment_score || 0;
  const responseCount = responses.length;

  // Participation insights
  if (participationRate >= 90 && responseCount >= 10) {
    insights.push({
      type: 'pattern',
      message:
        'Exceptional participation rate! Team is highly engaged with this microclimate.',
      confidence: 0.9,
      priority: 'high',
      recommended_actions: [
        'Consider running similar microclimates more frequently',
        'Share success factors with other teams',
      ],
    });
  } else if (participationRate < 30 && responseCount >= 5) {
    insights.push({
      type: 'alert',
      message:
        'Low participation rate detected. Team engagement may be limited.',
      confidence: 0.8,
      priority: 'high',
      recommended_actions: [
        'Follow up with non-participants',
        'Review timing and communication strategy',
        'Consider shorter or more focused questions',
      ],
    });
  }

  // Sentiment insights
  if (sentimentScore > 0.5 && responseCount >= 5) {
    insights.push({
      type: 'pattern',
      message: 'Positive sentiment detected. Team morale appears to be high.',
      confidence: 0.8,
      priority: 'medium',
      recommended_actions: [
        'Identify and reinforce positive factors',
        'Share positive feedback with team',
      ],
    });
  } else if (sentimentScore < -0.3 && responseCount >= 5) {
    insights.push({
      type: 'alert',
      message:
        'Negative sentiment detected. Consider follow-up discussions with the team.',
      confidence: 0.85,
      priority: 'critical',
      recommended_actions: [
        'Schedule one-on-one meetings',
        'Organize team discussion session',
        'Review recent changes or challenges',
      ],
    });
  }

  // Response timing insights
  const responseTimeline = responses.map((r) => new Date(r.created_at));
  if (responseTimeline.length >= 5) {
    const sortedTimes = responseTimeline.sort(
      (a, b) => a.getTime() - b.getTime()
    );
    const firstResponse = sortedTimes[0];
    const lastResponse = sortedTimes[sortedTimes.length - 1];
    const timeSpanMinutes =
      (lastResponse.getTime() - firstResponse.getTime()) / (1000 * 60);

    if (timeSpanMinutes < 10 && responseCount >= 10) {
      insights.push({
        type: 'pattern',
        message:
          'Rapid response pattern detected. Team is highly responsive and engaged.',
        confidence: 0.7,
        priority: 'medium',
        recommended_actions: [
          'Leverage high engagement for important communications',
          'Consider real-time collaboration opportunities',
        ],
      });
    }
  }

  // Word cloud insights
  const wordCloudData = microclimate.live_results?.word_cloud_data || [];
  if (wordCloudData.length > 0 && responseCount >= 5) {
    const topWords = wordCloudData.slice(0, 3);
    const topWord = topWords[0];

    if (topWord && topWord.value >= 3) {
      insights.push({
        type: 'pattern',
        message: `"${topWord.text}" is a recurring theme in responses (mentioned ${topWord.value} times).`,
        confidence: 0.7,
        priority: 'medium',
        recommended_actions: [
          `Explore the significance of "${topWord.text}" with the team`,
          'Consider addressing this theme in future discussions',
        ],
      });
    }

    // Check for concerning words
    const concerningWords = [
      'stress',
      'overwhelmed',
      'frustrated',
      'difficult',
      'problem',
      'issue',
    ];
    const concerningMatches = wordCloudData.filter((word) =>
      concerningWords.some((concern) =>
        word.text.toLowerCase().includes(concern.toLowerCase())
      )
    );

    if (concerningMatches.length > 0) {
      const totalConcerningMentions = concerningMatches.reduce(
        (sum, word) => sum + word.value,
        0
      );
      if (totalConcerningMentions >= 3) {
        insights.push({
          type: 'alert',
          message: `Concerning themes detected in responses: ${concerningMatches.map((w) => w.text).join(', ')}.`,
          confidence: 0.8,
          priority: 'high',
          recommended_actions: [
            'Schedule team discussion to address concerns',
            'Investigate underlying issues',
            'Provide additional support resources',
          ],
        });
      }
    }
  }

  // Engagement level insights
  const engagementLevel = microclimate.live_results?.engagement_level;
  if (engagementLevel === 'high' && responseCount >= 10) {
    insights.push({
      type: 'pattern',
      message:
        'High engagement level maintained throughout the microclimate session.',
      confidence: 0.8,
      priority: 'medium',
      recommended_actions: [
        'Document successful engagement strategies',
        'Replicate approach in future sessions',
      ],
    });
  } else if (engagementLevel === 'low' && responseCount >= 5) {
    insights.push({
      type: 'recommendation',
      message:
        'Low engagement detected. Consider adjusting approach for future microclimates.',
      confidence: 0.7,
      priority: 'medium',
      recommended_actions: [
        'Review question relevance and clarity',
        'Consider shorter session duration',
        'Improve communication and timing',
      ],
    });
  }

  return insights;
}
