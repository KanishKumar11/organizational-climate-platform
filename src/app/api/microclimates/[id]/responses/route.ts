/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Microclimate from '@/models/Microclimate';
import { connectToDatabase } from '@/lib/mongodb';
import MicroclimateInvitation from '@/models/MicroclimateInvitation';

// POST /api/microclimates/[id]/responses - Submit response to microclimate
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const { id } = await params;

    const microclimate = await Microclimate.findById(id);
    if (!microclimate) {
      return NextResponse.json(
        { error: 'Microclimate not found' },
        { status: 404 }
      );
    }

    // Check if user has access to this microclimate
    if (
      microclimate.company_id !== session.user.companyId &&
      session.user.role !== 'super_admin'
    ) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Check if microclimate can accept responses
    if (!microclimate.canAcceptResponses()) {
      return NextResponse.json(
        { error: 'Microclimate is not accepting responses' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { responses, user_metadata, invitation_token } = body;

    // Validate responses
    if (!responses || !Array.isArray(responses)) {
      return NextResponse.json(
        { error: 'Invalid responses format' },
        { status: 400 }
      );
    }

    // Process responses and update live results
    let sentimentScore = 0;
    let sentimentCount = 0;
    const wordCloudUpdates: Record<string, number> = {};
    const responseDistributionUpdates: Record<string, number> = {};

    for (const response of responses) {
      const { question_id, answer, answer_text } = response;

      // Find the question
      const question = microclimate.questions.find((q) => q.id === question_id);
      if (!question) continue;

      // Update response distribution for multiple choice questions
      if (question.type === 'multiple_choice' && typeof answer === 'number') {
        const key = `${question_id}_${answer}`;
        responseDistributionUpdates[key] =
          (microclimate.live_results.response_distribution[key] || 0) + 1;
      }

      // Process text responses for word cloud and sentiment
      if (answer_text && typeof answer_text === 'string') {
        // Simple word extraction for word cloud
        const words = answer_text
          .toLowerCase()
          .replace(/[^\w\s]/g, '')
          .split(/\s+/)
          .filter((word) => word.length > 3); // Only words longer than 3 characters

        words.forEach((word) => {
          wordCloudUpdates[word] = (wordCloudUpdates[word] || 0) + 1;
        });

        // Simple sentiment analysis (basic implementation)
        const positiveWords = [
          'good',
          'great',
          'excellent',
          'amazing',
          'love',
          'happy',
          'satisfied',
          'positive',
        ];
        const negativeWords = [
          'bad',
          'terrible',
          'awful',
          'hate',
          'sad',
          'frustrated',
          'negative',
          'disappointed',
        ];

        let sentiment = 0;
        words.forEach((word) => {
          if (positiveWords.includes(word)) sentiment += 1;
          if (negativeWords.includes(word)) sentiment -= 1;
        });

        if (words.length > 0) {
          sentimentScore += Math.max(-1, Math.min(1, sentiment / words.length));
          sentimentCount++;
        }
      }

      // Process Likert scale responses for sentiment
      if (question.type === 'likert' && typeof answer === 'number') {
        // Convert Likert scale (1-5) to sentiment (-1 to 1)
        const likertSentiment = (answer - 3) / 2; // Maps 1->-1, 3->0, 5->1
        sentimentScore += likertSentiment;
        sentimentCount++;
      }

      // Process emoji ratings for sentiment
      if (question.type === 'emoji_rating' && typeof answer === 'number') {
        // Convert emoji rating (1-5) to sentiment (-1 to 1)
        const emojiSentiment = (answer - 3) / 2;
        sentimentScore += emojiSentiment;
        sentimentCount++;
      }
    }

    // Update microclimate data
    microclimate.response_count += 1;
    microclimate.participation_rate = microclimate.calculateParticipationRate();

    // Update word cloud data
    Object.entries(wordCloudUpdates).forEach(([word, count]) => {
      const existingWord = microclimate.live_results.word_cloud_data.find(
        (w: any) => w.text === word
      );
      if (existingWord) {
        existingWord.value += count;
      } else {
        microclimate.live_results.word_cloud_data.push({
          text: word,
          value: count,
        });
      }
    });

    // Sort word cloud data by value and keep top 50
    microclimate.live_results.word_cloud_data =
      microclimate.live_results.word_cloud_data
        .sort((a: any, b: any) => b.value - a.value)
        .slice(0, 50);

    // Update response distribution
    Object.entries(responseDistributionUpdates).forEach(([key, count]) => {
      microclimate.live_results.response_distribution[key] = count;
    });

    // Update sentiment score (running average)
    if (sentimentCount > 0) {
      const currentSentiment = microclimate.live_results.sentiment_score;
      const currentCount = microclimate.response_count - 1; // Previous count
      const newSentiment = sentimentScore / sentimentCount;

      if (currentCount > 0) {
        microclimate.live_results.sentiment_score =
          (currentSentiment * currentCount + newSentiment) /
          microclimate.response_count;
      } else {
        microclimate.live_results.sentiment_score = newSentiment;
      }
    }

    // Update engagement level based on participation rate
    if (microclimate.participation_rate >= 80) {
      microclimate.live_results.engagement_level = 'high';
    } else if (microclimate.participation_rate >= 50) {
      microclimate.live_results.engagement_level = 'medium';
    } else {
      microclimate.live_results.engagement_level = 'low';
    }

    // Generate AI insights based on patterns (simple implementation)
    const insights = [];

    // High participation insight
    if (
      microclimate.participation_rate >= 90 &&
      microclimate.response_count >= 10
    ) {
      insights.push({
        type: 'pattern' as const,
        message:
          'Exceptional participation rate! Team is highly engaged with this microclimate.',
        confidence: 0.9,
        timestamp: new Date(),
      });
    }

    // Sentiment insights
    if (
      microclimate.live_results.sentiment_score > 0.5 &&
      microclimate.response_count >= 5
    ) {
      insights.push({
        type: 'pattern' as const,
        message: 'Positive sentiment detected. Team morale appears to be high.',
        confidence: 0.8,
        timestamp: new Date(),
      });
    } else if (
      microclimate.live_results.sentiment_score < -0.3 &&
      microclimate.response_count >= 5
    ) {
      insights.push({
        type: 'alert' as const,
        message:
          'Negative sentiment detected. Consider follow-up discussions with the team.',
        confidence: 0.85,
        timestamp: new Date(),
      });
    }

    // Word cloud insights
    const topWords = microclimate.live_results.word_cloud_data.slice(0, 3);
    if (topWords.length > 0 && microclimate.response_count >= 5) {
      const topWord = topWords[0];
      if (topWord.value >= 3) {
        insights.push({
          type: 'pattern' as const,
          message: `"${topWord.text}" is a recurring theme in responses (mentioned ${topWord.value} times).`,
          confidence: 0.7,
          timestamp: new Date(),
        });
      }
    }

    // Add new insights (keep only latest 5)
    if (insights.length > 0) {
      microclimate.ai_insights = [
        ...insights,
        ...microclimate.ai_insights,
      ].slice(0, 5);
    }

    await microclimate.save();

    // Mark invitation as participated if token provided
    if (invitation_token) {
      try {
        const invitation = await (MicroclimateInvitation as any).findOne({
          invitation_token,
          user_id: session.user.id,
          microclimate_id: id,
        });

        if (invitation && invitation.status !== 'participated') {
          invitation.markParticipated();
          await invitation.save();
          console.log(`Marked invitation ${invitation._id} as participated`);
        }
      } catch (invitationError) {
        console.error('Error updating invitation status:', invitationError);
        // Don't fail the response submission if invitation update fails
      }
    }

    // Broadcast real-time updates via WebSocket
    if (global.io) {
      const updateData = {
        microclimate_id: microclimate._id.toString(),
        response_count: microclimate.response_count,
        participation_rate: microclimate.participation_rate,
        live_results: microclimate.live_results,
        ai_insights: microclimate.ai_insights,
      };

      // Broadcast microclimate update
      global.io
        .to(`microclimate_${microclimate._id}`)
        .emit('microclimate_update', updateData);

      // Broadcast participation update
      global.io
        .to(`microclimate_${microclimate._id}`)
        .emit('participation_update', {
          microclimateId: microclimate._id.toString(),
          response_count: microclimate.response_count,
          participation_rate: microclimate.participation_rate,
          target_participant_count: microclimate.target_participant_count,
        });

      // Broadcast new insights if any
      if (insights.length > 0) {
        insights.forEach((insight) => {
          global.io
            .to(`microclimate_${microclimate._id}`)
            .emit('live_insight', {
              microclimateId: microclimate._id.toString(),
              insight,
            });
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Response submitted successfully',
      data: {
        response_count: microclimate.response_count,
        participation_rate: microclimate.participation_rate,
        sentiment_score: microclimate.live_results.sentiment_score,
        engagement_level: microclimate.live_results.engagement_level,
      },
    });
  } catch (error) {
    console.error('Error submitting microclimate response:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
