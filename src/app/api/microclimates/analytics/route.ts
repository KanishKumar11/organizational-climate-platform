import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Microclimate from '@/models/Microclimate';
import Response from '@/models/Response';

// GET /api/microclimates/analytics - Get general microclimate analytics
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const timeframe = parseInt(searchParams.get('timeframe') || '30');
    
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - timeframe);

    // Build query based on user role
    let microclimateQuery: any = {
      created_at: { $gte: startDate, $lte: endDate }
    };

    if (session.user.role !== 'super_admin') {
      microclimateQuery.company_id = session.user.companyId;
    }

    // Get basic counts
    const [
      totalMicroclimates,
      activeMicroclimates,
      completedMicroclimates,
      allMicroclimates
    ] = await Promise.all([
      Microclimate.countDocuments(microclimateQuery),
      Microclimate.countDocuments({ ...microclimateQuery, status: 'active' }),
      Microclimate.countDocuments({ ...microclimateQuery, status: 'completed' }),
      Microclimate.find(microclimateQuery)
        .select('_id title status response_count target_participant_count created_at')
        .sort({ created_at: -1 })
        .limit(100)
    ]);

    // Calculate total responses and participation rates
    let totalResponses = 0;
    let totalTargetParticipants = 0;
    const participationRates: number[] = [];

    allMicroclimates.forEach(microclimate => {
      const responseCount = microclimate.response_count || 0;
      const targetCount = microclimate.target_participant_count || 0;
      
      totalResponses += responseCount;
      totalTargetParticipants += targetCount;
      
      if (targetCount > 0) {
        participationRates.push((responseCount / targetCount) * 100);
      }
    });

    const averageParticipationRate = participationRates.length > 0
      ? participationRates.reduce((a, b) => a + b, 0) / participationRates.length
      : 0;

    // Get top performing microclimates
    const topPerforming = allMicroclimates
      .filter(m => m.target_participant_count > 0)
      .map(m => ({
        id: m._id.toString(),
        title: m.title,
        participation_rate: ((m.response_count || 0) / m.target_participant_count) * 100,
        response_count: m.response_count || 0
      }))
      .sort((a, b) => b.participation_rate - a.participation_rate)
      .slice(0, 5);

    // Get recent activity
    const recentActivity = allMicroclimates
      .slice(0, 10)
      .map(m => ({
        id: m._id.toString(),
        title: m.title,
        status: m.status,
        created_at: m.created_at.toISOString(),
        response_count: m.response_count || 0
      }));

    // Generate engagement trends (simplified - by week for the timeframe)
    const engagementTrends = [];
    const weeksToShow = Math.min(Math.ceil(timeframe / 7), 12);
    
    for (let i = weeksToShow - 1; i >= 0; i--) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - (i * 7));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      const weekMicroclimates = allMicroclimates.filter(m => {
        const createdAt = new Date(m.created_at);
        return createdAt >= weekStart && createdAt <= weekEnd;
      });

      const weekResponses = weekMicroclimates.reduce((sum, m) => sum + (m.response_count || 0), 0);
      const weekTargets = weekMicroclimates.reduce((sum, m) => sum + (m.target_participant_count || 0), 0);
      const weekParticipationRate = weekTargets > 0 ? (weekResponses / weekTargets) * 100 : 0;

      engagementTrends.push({
        period: `${weekStart.toLocaleDateString()} - ${weekEnd.toLocaleDateString()}`,
        participation_rate: Math.round(weekParticipationRate * 100) / 100,
        response_count: weekResponses
      });
    }

    const analytics = {
      total_microclimates: totalMicroclimates,
      active_microclimates: activeMicroclimates,
      completed_microclimates: completedMicroclimates,
      total_responses: totalResponses,
      average_participation_rate: Math.round(averageParticipationRate * 100) / 100,
      engagement_trends: engagementTrends,
      top_performing: topPerforming,
      recent_activity: recentActivity,
      timeframe_days: timeframe,
      generated_at: new Date().toISOString()
    };

    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Error fetching microclimate analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
