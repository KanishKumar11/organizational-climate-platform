import { Suspense } from 'react';
import { notFound, redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Microclimate from '@/models/Microclimate';
import Response from '@/models/Response';
import DashboardLayout from '@/components/layout/DashboardLayout';
import MicroclimateFinalResults from '@/components/microclimate/MicroclimateFinalResults';
import { Loading } from '@/components/ui/Loading';
import { ErrorBoundary } from '@/components/error/ErrorBoundary';

// Sanitization function for circular references
function sanitizeForSerialization(obj: any): any {
  const seen = new WeakSet();

  function sanitize(value: any): any {
    if (value === null || typeof value !== 'object') {
      return value;
    }

    if (seen.has(value)) {
      return '[Circular Reference]';
    }

    seen.add(value);

    if (value instanceof Date) {
      return value.toISOString();
    }

    if (Array.isArray(value)) {
      return value.map(sanitize);
    }

    const sanitized: any = {};
    for (const key in value) {
      if (value.hasOwnProperty(key)) {
        sanitized[key] = sanitize(value[key]);
      }
    }
    return sanitized;
  }

  return sanitize(obj);
}

async function getMicroclimateResults(id: string, session: any) {
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

    // Only allow access to completed or cancelled microclimates
    if (!['completed', 'cancelled'].includes(microclimate.status)) {
      console.log(
        `Microclimate ${id} is not completed. Status: ${microclimate.status}`
      );
      return null;
    }

    // Get all responses for this microclimate
    const responses = await Response.find({
      microclimate_id: id,
    }).populate('user_id', 'name email department_id');

    // Convert to plain object to avoid circular references
    const plainMicroclimate = microclimate.toObject
      ? microclimate.toObject()
      : microclimate;

    // Ensure all dates are converted to ISO strings for serialization
    if (plainMicroclimate.scheduling?.start_time) {
      plainMicroclimate.scheduling.start_time = new Date(
        plainMicroclimate.scheduling.start_time
      );
    }

    const transformedData = {
      id: plainMicroclimate._id.toString(),
      title: plainMicroclimate.title,
      description: plainMicroclimate.description,
      status: plainMicroclimate.status,
      response_count: plainMicroclimate.response_count || 0,
      target_participant_count: plainMicroclimate.target_participant_count || 0,
      participation_rate: plainMicroclimate.participation_rate || 0,
      created_at: plainMicroclimate.created_at,
      updated_at: plainMicroclimate.updated_at,
      duration_minutes: plainMicroclimate.scheduling?.duration_minutes || 0,
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
          timestamp: insight.timestamp
            ? new Date(insight.timestamp)
            : new Date(),
          priority: insight.priority,
        })
      ),
      questions:
        plainMicroclimate.questions?.map((q: any) => ({
          id: q.id,
          question: q.text,
          type: q.type,
          options: q.options,
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
      responses: responses.map((response: any) => ({
        id: response._id.toString(),
        user_name: response.user_id?.name || 'Anonymous',
        submitted_at: response.submitted_at,
        answers: response.answers,
      })),
      targeting: plainMicroclimate.targeting,
      created_by: {
        name: 'Unknown', // We'd need to populate this from User model
        id: plainMicroclimate.created_by || null,
      },
    };

    // Sanitize the entire data structure to ensure it's serializable
    return sanitizeForSerialization(transformedData);
  } catch (error) {
    console.error('Error fetching microclimate results:', error);
    throw error;
  }
}

export default async function MicroclimateResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/auth/signin');
  }

  const microclimateData = await getMicroclimateResults(id, session);

  if (!microclimateData) {
    notFound();
  }

  // If microclimate is still active, redirect to live dashboard
  if (microclimateData.status === 'active') {
    redirect(`/microclimates/${id}/live`);
  }

  return (
    <DashboardLayout>
      <ErrorBoundary>
        <Suspense fallback={<Loading size="lg" />}>
          <MicroclimateFinalResults
            microclimateId={id}
            data={microclimateData}
          />
        </Suspense>
      </ErrorBoundary>
    </DashboardLayout>
  );
}
