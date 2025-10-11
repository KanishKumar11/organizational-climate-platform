import { Suspense } from 'react';
import { notFound, redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Microclimate from '@/models/Microclimate';
import UnifiedResponseFlow from '@/components/microclimate/UnifiedResponseFlow';
import { Loading } from '@/components/ui/Loading';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ token?: string }>;
}

async function getMicroclimateData(
  id: string,
  session: any,
  invitationToken?: string
) {
  try {
    await connectDB();

    // Use .lean() for better performance and to avoid potential Mongoose issues
    const microclimate = await Microclimate.findById(id).lean();

    if (!microclimate) {
      return null;
    }

    // Check access permissions
    const isAnonymousMicroclimate =
      microclimate.real_time_settings?.anonymous_responses;
    const hasInvitationToken = !!invitationToken;
    const isAuthenticated = !!session?.user;

    // For anonymous microclimates or invitation tokens, skip company validation
    if (!isAnonymousMicroclimate && !hasInvitationToken) {
      // Only check company access for authenticated users
      if (
        isAuthenticated &&
        microclimate.company_id !== session.user.companyId &&
        session.user.role !== 'super_admin'
      ) {
        return null;
      }
    }

    // Check if microclimate can accept responses
    const now = new Date();
    const startTime = new Date(microclimate.scheduling.start_time);
    const endTime = new Date(
      startTime.getTime() + microclimate.scheduling.duration_minutes * 60 * 1000
    );

    const canAcceptResponses =
      (microclimate.status === 'active' || microclimate.status === 'paused') &&
      now >= startTime &&
      now <= endTime;

    if (!canAcceptResponses) {
      return {
        id: microclimate._id.toString(),
        title: microclimate.title,
        description: microclimate.description,
        status: microclimate.status,
        response_count: microclimate.response_count || 0,
        target_participant_count: microclimate.target_participant_count || 0,
        participation_rate: microclimate.participation_rate || 0,
        time_remaining: undefined,
        questions: [],
        real_time_settings: {
          show_live_results: false,
          anonymous_responses: false,
          allow_comments: false,
          word_cloud_enabled: false,
          sentiment_analysis_enabled: false,
          participation_threshold: 0,
        },
        canRespond: false,
      };
    }

    // Create sanitized data object directly without additional sanitization
    const sanitizedData = {
      id: microclimate._id.toString(),
      title: microclimate.title,
      description: microclimate.description,
      status: microclimate.status,
      response_count: microclimate.response_count || 0,
      target_participant_count: microclimate.target_participant_count || 0,
      participation_rate: microclimate.participation_rate || 0,
      time_remaining:
        microclimate.status === 'active' && now >= startTime && now <= endTime
          ? Math.max(
              0,
              Math.floor((endTime.getTime() - Date.now()) / (1000 * 60))
            )
          : undefined,
      questions:
        microclimate.questions?.map((q: any) => ({
          id: q.id,
          text: q.text,
          type: q.type,
          options: q.options || [],
          required: q.required || false,
        })) || [],
      real_time_settings: {
        show_live_results:
          microclimate.real_time_settings?.show_live_results || false,
        anonymous_responses:
          microclimate.real_time_settings?.anonymous_responses || false,
        allow_comments:
          microclimate.real_time_settings?.allow_comments || false,
        word_cloud_enabled:
          microclimate.real_time_settings?.word_cloud_enabled || false,
        sentiment_analysis_enabled:
          microclimate.real_time_settings?.sentiment_analysis_enabled || false,
        participation_threshold:
          microclimate.real_time_settings?.participation_threshold || 0,
      },
      canRespond: true,
    };

    return sanitizedData;
  } catch (error) {
    console.error('Error in getMicroclimateData:', error);
    return null;
  }
}

export default async function MicroclimateResponsePage({
  params,
  searchParams,
}: PageProps) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;
    const { token } = await searchParams;

    // Get microclimate data first to check if it's anonymous
    await connectDB();
    const microclimate = await Microclimate.findById(id).lean();

    if (!microclimate) {
      notFound();
    }

    // Allow anonymous access if:
    // 1. Microclimate is anonymous, OR
    // 2. User has invitation token, OR
    // 3. User is authenticated
    const isAnonymousMicroclimate =
      microclimate.real_time_settings?.anonymous_responses;
    const hasInvitationToken = !!token;
    const isAuthenticated = !!session?.user;

    if (!isAnonymousMicroclimate && !hasInvitationToken && !isAuthenticated) {
      redirect('/auth/signin');
    }

    const microclimateData = await getMicroclimateData(id, session, token);

    if (!microclimateData) {
      notFound();
    }

    if (!microclimateData.canRespond) {
      return (
        <div className="container mx-auto px-4 py-6">
          <div className="max-w-2xl mx-auto text-center py-12">
            <div className="bg-yellow-50 rounded-2xl p-8 border border-yellow-200">
              <Clock className="w-16 h-16 mx-auto mb-4 text-yellow-600" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Microclimate Not Available
              </h2>
              <p className="text-gray-600 mb-4">
                This microclimate is not currently accepting responses.
              </p>
              <Badge
                variant="outline"
                className="text-yellow-800 bg-yellow-100"
              >
                {microclimateData.status}
              </Badge>
            </div>
          </div>
        </div>
      );
    }

    return (
      <Suspense fallback={<Loading size="lg" />}>
        <UnifiedResponseFlow
          microclimateId={id}
          microclimateData={microclimateData}
          invitationToken={token}
          redirectToLiveResults={
            microclimateData.real_time_settings?.show_live_results || false
          }
        />
      </Suspense>
    );
  } catch (error) {
    console.error('Microclimate respond page error:', error);
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-2xl mx-auto text-center py-12">
          <div className="bg-red-50 rounded-2xl p-8 border border-red-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Error Loading Microclimate
            </h2>
            <p className="text-gray-600 mb-4">
              There was an error loading this microclimate. Please try again
              later.
            </p>
          </div>
        </div>
      </div>
    );
  }
}

export async function generateMetadata({ params }: PageProps) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return {
        title: 'Access Denied',
      };
    }

    // Simplified metadata generation to avoid duplicate database calls
    await connectDB();
    const microclimate = await Microclimate.findById(id)
      .select('title company_id')
      .lean();

    if (
      !microclimate ||
      (microclimate.company_id !== session.user.companyId &&
        session.user.role !== 'super_admin')
    ) {
      return {
        title: 'Microclimate Not Found',
      };
    }

    return {
      title: `Respond: ${microclimate.title} | Organizational Climate Platform`,
      description: `Share your feedback in the ${microclimate.title} microclimate survey.`,
    };
  } catch (error) {
    console.error('Metadata generation error:', error);
    return {
      title: 'Microclimate Response',
    };
  }
}
