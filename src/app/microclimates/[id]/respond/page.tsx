import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import Microclimate from '@/models/Microclimate';
import MicroclimateResponseForm from '@/components/microclimate/MicroclimateResponseForm';
import { Loading } from '@/components/ui/Loading';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Users, MessageSquare } from 'lucide-react';

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ token?: string }>;
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

  // Only allow access to active microclimates
  if (!microclimate.canAcceptResponses()) {
    return { ...microclimate, canRespond: false };
  }

  return {
    id: microclimate._id.toString(),
    title: microclimate.title,
    description: microclimate.description,
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
    questions:
      microclimate.questions?.map((q: any) => ({
        id: q.id,
        text: q.text,
        type: q.type,
        options: q.options,
        required: q.required,
      })) || [],
    real_time_settings: microclimate.real_time_settings,
    canRespond: true,
  };
}

export default async function MicroclimateResponsePage({
  params,
  searchParams,
}: PageProps) {
  const session = await getServerSession(authOptions);
  const { id } = await params;
  const { token } = await searchParams;

  if (!session?.user) {
    notFound();
  }

  const microclimateData = await getMicroclimateData(id, session);

  if (!microclimateData) {
    notFound();
  }

  const formatTimeRemaining = (minutes?: number) => {
    if (!minutes) return 'No time limit';
    if (minutes < 1) return 'Less than 1 minute';
    if (minutes < 60) return `${minutes} minutes`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

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
            <Badge variant="outline" className="text-yellow-800 bg-yellow-100">
              {microclimateData.status}
            </Badge>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-2xl p-8 border border-green-200 mb-8">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 bg-green-100 rounded-xl">
                <MessageSquare className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              {microclimateData.title}
            </h1>
            {microclimateData.description && (
              <p className="text-gray-600 mb-6 text-lg leading-relaxed max-w-2xl mx-auto">
                {microclimateData.description}
              </p>
            )}

            <div className="flex items-center justify-center gap-8 text-sm text-gray-600 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="w-4 h-4 text-blue-600" />
                </div>
                <span className="font-medium">
                  {microclimateData.response_count} /{' '}
                  {microclimateData.target_participant_count} responses
                </span>
              </div>

              {microclimateData.time_remaining !== undefined && (
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Clock className="w-4 h-4 text-orange-600" />
                  </div>
                  <span className="font-medium">
                    {formatTimeRemaining(microclimateData.time_remaining)}{' '}
                    remaining
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <MessageSquare className="w-4 h-4 text-purple-600" />
                </div>
                <span className="font-medium">
                  {microclimateData.questions.length} questions
                </span>
              </div>
            </div>

            {microclimateData.real_time_settings?.anonymous_responses && (
              <div className="mt-4">
                <Badge
                  variant="outline"
                  className="bg-blue-50 text-blue-700 border-blue-200 px-3 py-1"
                >
                  🔒 Anonymous Responses
                </Badge>
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <Card className="mb-8 border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <MessageSquare className="w-5 h-5 text-green-600" />
              </div>
              Instructions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                <p>Please answer all questions honestly and thoughtfully</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                <p>Your responses will help improve our team and workplace</p>
              </div>
              {microclimateData.real_time_settings?.anonymous_responses && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
                  <p>Your responses are completely anonymous</p>
                </div>
              )}
              {microclimateData.real_time_settings?.show_live_results && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-orange-400 rounded-full mt-2 flex-shrink-0"></div>
                  <p>
                    You can view live results after submitting your response
                  </p>
                </div>
              )}
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0"></div>
                <p>Questions marked with * are required</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Response Form */}
        <Suspense fallback={<Loading size="lg" />}>
          <MicroclimateResponseForm
            microclimateId={id}
            questions={microclimateData.questions}
            invitationToken={token}
            onSubmit={() => {
              // Redirect to live results if enabled
              if (microclimateData.real_time_settings?.show_live_results) {
                setTimeout(() => {
                  window.location.href = `/microclimates/${id}/live`;
                }, 2000);
              }
            }}
          />
        </Suspense>
      </div>
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
      title: `Respond: ${microclimateData.title} | Organizational Climate Platform`,
      description: `Share your feedback in the ${microclimateData.title} microclimate survey.`,
    };
  } catch (error) {
    return {
      title: 'Microclimate Response',
    };
  }
}
