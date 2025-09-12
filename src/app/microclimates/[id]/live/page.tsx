import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import Microclimate from '@/models/Microclimate';
import LiveMicroclimateDashboard from '@/components/microclimate/LiveMicroclimateDashboard';
import { Loading } from '@/components/ui/Loading';

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getMicroclimateData(id: string, session: any) {
  await connectToDatabase();

  const microclimate = await Microclimate.findById(id).lean();

  if (!microclimate) {
    return null;
  }

  // Check access permissions
  if (
    microclimate.company_id !== session.user.companyId &&
    session.user.role !== 'super_admin'
  ) {
    return null;
  }

  // Only allow access to active or paused microclimates
  if (!['active', 'paused'].includes(microclimate.status)) {
    return null;
  }

  return {
    id: microclimate._id.toString(),
    title: microclimate.title,
    status: microclimate.status,
    response_count: microclimate.response_count || 0,
    target_participant_count: microclimate.target_participant_count || 0,
    participation_rate: microclimate.participation_rate || 0,
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
    live_results: microclimate.live_results || {
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
    ai_insights: microclimate.ai_insights || [],
    questions:
      microclimate.questions?.map((q: any) => ({
        question: q.text,
        responses:
          q.options?.map((option: string, index: number) => ({
            option,
            count:
              microclimate.live_results?.response_distribution?.[
                `${q._id}_${index}`
              ] || 0,
            percentage:
              microclimate.response_count > 0
                ? ((microclimate.live_results?.response_distribution?.[
                    `${q._id}_${index}`
                  ] || 0) /
                    microclimate.response_count) *
                  100
                : 0,
          })) || [],
        total_responses: microclimate.response_count || 0,
      })) || [],
  };
}

export default async function LiveMicroclimatePage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  const { id } = await params;

  if (!session?.user) {
    notFound();
  }

  const microclimateData = await getMicroclimateData(id, session);

  if (!microclimateData) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <Suspense fallback={<Loading size="lg" />}>
        <LiveMicroclimateDashboard
          microclimateId={id}
          initialData={microclimateData}
        />
      </Suspense>
    </div>
  );
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
