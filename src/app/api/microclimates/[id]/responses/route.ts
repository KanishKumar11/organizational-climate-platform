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
    await connectToDatabase();
    const { id } = await params;

    const microclimate = await Microclimate.findById(id);
    if (!microclimate) {
      return NextResponse.json(
        { error: 'Microclimate not found' },
        { status: 404 }
      );
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

    // Check access permissions
    const isAnonymousMicroclimate = microclimate.real_time_settings?.anonymous_responses;
    const hasInvitationToken = !!invitation_token;
    const isAuthenticated = !!session?.user;

    // Allow access if:
    // 1. Microclimate is anonymous, OR
    // 2. User has invitation token, OR  
    // 3. User is authenticated
    if (!isAnonymousMicroclimate && !hasInvitationToken && !isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // For authenticated users, check company access
    if (isAuthenticated && 
        microclimate.company_id !== session.user.companyId &&
        session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

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
        // Convert Likert scale to sentiment (-1 to 1)
        const sentimentValue = (answer - 3) / 2; // Assuming 5-point scale (1-5)
        sentimentScore += sentimentValue;
        sentimentCount++;
      }
    }

    // Calculate average sentiment
    const averageSentiment = sentimentCount > 0 ? sentimentScore / sentimentCount : 0;

    // Update microclimate with new data
    const updateData: any = {
      $inc: {
        response_count: 1,
      },
      $set: {
        'live_results.last_updated': new Date(),
      },
    };

    // Update word cloud
    if (Object.keys(wordCloudUpdates).length > 0) {
      updateData.$inc = {
        ...updateData.$inc,
        ...Object.fromEntries(
          Object.entries(wordCloudUpdates).map(([word, count]) => [
            `live_results.word_cloud.${word}`,
            count,
          ])
        ),
      };
    }

    // Update response distribution
    if (Object.keys(responseDistributionUpdates).length > 0) {
      updateData.$inc = {
        ...updateData.$inc,
        ...Object.fromEntries(
          Object.entries(responseDistributionUpdates).map(([key, count]) => [
            `live_results.response_distribution.${key}`,
            count,
          ])
        ),
      };
    }

    // Update sentiment analysis
    if (sentimentCount > 0) {
      updateData.$set = {
        ...updateData.$set,
        'live_results.sentiment_analysis.average_score': averageSentiment,
        'live_results.sentiment_analysis.total_responses': sentimentCount,
        'live_results.sentiment_analysis.last_updated': new Date(),
      };
    }

    await Microclimate.findByIdAndUpdate(id, updateData);

    // Handle invitation token if provided
    if (invitation_token) {
      const invitation = await MicroclimateInvitation.findOne({
        invitation_token: invitation_token,
      });

      if (invitation) {
        invitation.markParticipated();
        await invitation.save();
      }
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Response submitted successfully',
      data: {
        response_count: microclimate.response_count + 1,
        sentiment_score: averageSentiment,
        word_cloud_updates: Object.keys(wordCloudUpdates).length,
        response_distribution_updates: Object.keys(responseDistributionUpdates).length,
      },
    });
  } catch (error) {
    console.error('Error submitting microclimate response:', error);
    return NextResponse.json(
      { error: 'Failed to submit response' },
      { status: 500 }
    );
  }
}