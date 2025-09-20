import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Microclimate from '@/models/Microclimate';
import LiveMicroclimateDashboard from '@/components/microclimate/LiveMicroclimateDashboard';
import { Loading } from '@/components/ui/Loading';
import ErrorBoundary from '@/components/ErrorBoundary';
import DashboardLayout from '@/components/layout/DashboardLayout';
import {
  sanitizeForSerialization,
  safeToISOString,
} from '@/lib/datetime-utils';

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getMicroclimateData(id: string, session: any) {
  try {
    await connectDB();

    const microclimate = await Microclimate.findById(id);

    if (!microclimate) {
      console.log(`Microclimate not found with ID: ${id}`);
      return null;
    }

    // Check access permissions
    if (
      microclimate.company_id !== session.user.companyId &&
      session.user.role !== 'super_admin'
    ) {
      console.log(
        `Access denied for user ${session.user.id} to microclimate ${id}`
      );
      return null;
    }

    // Helper function to determine correct status based on timing
    function determineStatusFromTiming(
      startTime: Date,
      durationMinutes: number
    ): string {
      const now = new Date();
      const endTime = new Date(
        startTime.getTime() + durationMinutes * 60 * 1000
      );

      if (now < startTime) {
        return 'scheduled';
      } else if (now >= startTime && now <= endTime) {
        return 'active';
      } else {
        return 'completed';
      }
    }

    // Auto-update microclimate status based on current time
    const currentStatus = microclimate.status;
    const correctStatus = determineStatusFromTiming(
      microclimate.scheduling.start_time,
      microclimate.scheduling.duration_minutes
    );

    // Only update if the status should change and it's a valid transition
    if (currentStatus !== correctStatus) {
      // Valid transitions: scheduled -> active -> completed
      const validTransitions = {
        scheduled: ['active', 'completed'],
        active: ['completed'],
        draft: ['scheduled', 'active', 'completed'],
      };

      if (validTransitions[currentStatus]?.includes(correctStatus)) {
        console.log(
          `Auto-updating microclimate ${id} from ${currentStatus} to ${correctStatus}`
        );
        microclimate.status = correctStatus;
        await microclimate.save();
      }
    }

    // Only allow access to active, paused, or recently completed microclimates
    if (!['active', 'paused', 'completed'].includes(microclimate.status)) {
      console.log(
        `Microclimate ${id} has invalid status: ${microclimate.status}`
      );
      return null;
    }

    // Convert to plain object to avoid circular references and ensure serializability
    const plainMicroclimate = microclimate.toObject
      ? microclimate.toObject()
      : microclimate;

    const transformedData = {
      id: plainMicroclimate._id.toString(),
      title: plainMicroclimate.title,
      status: plainMicroclimate.status,
      response_count: plainMicroclimate.response_count || 0,
      target_participant_count: plainMicroclimate.target_participant_count || 0,
      participation_rate: plainMicroclimate.participation_rate || 0,
      time_remaining: microclimate.isActive()
        ? Math.max(
            0,
            Math.floor(
              (plainMicroclimate.scheduling.start_time.getTime() +
                plainMicroclimate.scheduling.duration_minutes * 60 * 1000 -
                Date.now()) /
                (1000 * 60)
            )
          )
        : undefined,
      live_results: plainMicroclimate.live_results || {
        word_cloud_data: [],
        sentiment_score: 0,
        sentiment_distribution: {
          positive: 0,
          neutral: 0,
          negative: 0,
        },
        engagement_level: 'low',
        response_distribution: {},
        top_themes: [],
      },
      ai_insights: (plainMicroclimate.ai_insights || []).map(
        (insight: any) => ({
          type: insight.type,
          message: insight.message,
          confidence: insight.confidence,
          timestamp: safeToISOString(insight.timestamp || new Date()),
          priority: insight.priority,
        })
      ),
      questions:
        plainMicroclimate.questions?.map((q: any) => ({
          question: q.text,
          responses:
            q.options?.map((option: string, index: number) => ({
              option,
              count:
                plainMicroclimate.live_results?.response_distribution?.[
                  `${q.id}_${index}`
                ] || 0,
              percentage:
                plainMicroclimate.response_count > 0
                  ? ((plainMicroclimate.live_results?.response_distribution?.[
                      `${q.id}_${index}`
                    ] || 0) /
                      plainMicroclimate.response_count) *
                    100
                  : 0,
            })) || [],
          total_responses: plainMicroclimate.response_count || 0,
        })) || [],
    };

    // Sanitize the entire data structure to ensure it's serializable
    return sanitizeForSerialization(transformedData);
  } catch (error) {
    console.error('Error fetching microclimate data:', error);
    throw error;
  }
}

export default async function LiveMicroclimatePage({ params }: PageProps) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;

    if (!session?.user) {
      console.log('No session found, redirecting to not found');
      notFound();
    }

    const microclimateData = await getMicroclimateData(id, session);

    if (!microclimateData) {
      console.log(`No microclimate data found for ID: ${id}`);
      notFound();
    }

    return (
      <DashboardLayout>
        <ErrorBoundary>
          <LiveMicroclimateDashboard
            microclimateId={id}
            initialData={microclimateData}
          />
        </ErrorBoundary>
      </DashboardLayout>
    );
  } catch (error) {
    console.error('Error in LiveMicroclimatePage:', error);
    throw error;
  }
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return {
      title: 'Access Denied',
    };
  }

  try {
    const microclimateData = await getMicroclimateData(id, session);

    if (!microclimateData) {
      return {
        title: 'Microclimate Not Found',
      };
    }

    return {
      title: `Live: ${microclimateData.title} | Organizational Climate Platform`,
      description: `Real-time dashboard for ${microclimateData.title} microclimate with live participation tracking and sentiment analysis.`,
    };
  } catch (error) {
    return {
      title: 'Microclimate Dashboard',
    };
  }
}
