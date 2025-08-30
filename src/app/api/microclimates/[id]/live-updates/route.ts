import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Microclimate from '@/models/Microclimate';
import { connectToDatabase } from '@/lib/mongodb';

// GET /api/microclimates/[id]/live-updates - Get real-time microclimate data
export async function GET(
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

    // Return live data for real-time updates
    const liveData = {
      id: microclimate._id,
      title: microclimate.title,
      status: microclimate.status,
      response_count: microclimate.response_count,
      target_participant_count: microclimate.target_participant_count,
      participation_rate: microclimate.participation_rate,
      live_results: microclimate.live_results,
      ai_insights: microclimate.ai_insights,
      time_remaining: microclimate.isActive()
        ? Math.max(
            0,
            Math.floor(
              (new Date(microclimate.scheduling.start_time).getTime() +
                microclimate.scheduling.duration_minutes * 60 * 1000 -
                Date.now()) /
                (1000 * 60)
            )
          )
        : undefined,
      updated_at: microclimate.updated_at,
    };

    return NextResponse.json(liveData);
  } catch (error) {
    console.error('Error fetching live microclimate data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/microclimates/[id]/live-updates - Trigger live update (for testing)
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

    const body = await request.json();
    const { type, data } = body;

    // Handle different types of live updates
    switch (type) {
      case 'new_response':
        // Simulate new response processing
        microclimate.response_count += 1;
        microclimate.participation_rate =
          microclimate.calculateParticipationRate();

        // Update word cloud data (simulate)
        if (data.text) {
          const existingWord = microclimate.live_results.word_cloud_data.find(
            (word: any) => word.text.toLowerCase() === data.text.toLowerCase()
          );

          if (existingWord) {
            existingWord.value += 1;
          } else {
            microclimate.live_results.word_cloud_data.push({
              text: data.text,
              value: 1,
            });
          }
        }

        // Update sentiment (simulate)
        if (data.sentiment) {
          const currentSentiment = microclimate.live_results.sentiment_score;
          const newSentiment =
            (currentSentiment * (microclimate.response_count - 1) +
              data.sentiment) /
            microclimate.response_count;
          microclimate.live_results.sentiment_score = newSentiment;
        }

        break;

      case 'ai_insight':
        // Add new AI insight
        microclimate.ai_insights.push({
          type: data.type || 'pattern',
          message: data.message,
          confidence: data.confidence || 0.8,
          timestamp: new Date(),
        });
        break;

      case 'engagement_update':
        // Update engagement level
        microclimate.live_results.engagement_level = data.level;
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid update type' },
          { status: 400 }
        );
    }

    await microclimate.save();

    // Broadcast update via WebSocket (if available)
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

      // Also broadcast participation update
      global.io
        .to(`microclimate_${microclimate._id}`)
        .emit('participation_update', {
          microclimateId: microclimate._id.toString(),
          response_count: microclimate.response_count,
          participation_rate: microclimate.participation_rate,
          target_participant_count: microclimate.target_participant_count,
        });

      // If it's an AI insight, broadcast that separately
      if (type === 'ai_insight') {
        global.io.to(`microclimate_${microclimate._id}`).emit('live_insight', {
          microclimateId: microclimate._id.toString(),
          insight: microclimate.ai_insights[0], // Latest insight
        });
      }
    }

    return NextResponse.json({ success: true, data: microclimate });
  } catch (error) {
    console.error('Error processing live update:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
