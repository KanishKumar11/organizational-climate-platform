import { Suspense } from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { connectDB } from '@/lib/db';
import Survey from '@/models/Survey';
import SurveyResults from '@/components/survey/SurveyResults';
import RealTimeTracker from '@/components/survey/RealTimeTracker';
import { Loading } from '@/components/ui/Loading';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface SurveyResultsPageProps {
  params: {
    id: string;
  };
}

async function getSurvey(surveyId: string, userCompanyId: string) {
  await connectDB();

  const survey = await Survey.findById(surveyId);
  if (!survey || survey.company_id !== userCompanyId) {
    return null;
  }

  return {
    id: survey._id.toString(),
    title: survey.title,
    type: survey.type,
    status: survey.status,
    start_date: survey.start_date,
    end_date: survey.end_date,
    response_count: survey.response_count,
  };
}

export default async function SurveyResultsPage({
  params,
}: SurveyResultsPageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/auth/signin');
  }

  const survey = await getSurvey(params.id, session.user.companyId);

  if (!survey) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Survey Not Found
          </h1>
          <p className="text-gray-600">
            The survey you're looking for doesn't exist or you don't have
            permission to view it.
          </p>
        </Card>
      </div>
    );
  }

  const isActive = survey.status === 'active';

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Survey Results
        </h1>
        <p className="text-gray-600">
          Analyze responses and track performance for "{survey.title}"
        </p>
      </div>

      <Tabs
        defaultValue={isActive ? 'real-time' : 'results'}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-2">
          {isActive && (
            <TabsTrigger value="real-time" className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              Real-Time Tracking
            </TabsTrigger>
          )}
          <TabsTrigger value="results">
            Detailed Results & Analytics
          </TabsTrigger>
        </TabsList>

        {isActive && (
          <TabsContent value="real-time" className="space-y-6">
            <Suspense
              fallback={
                <Card className="p-6">
                  <div className="flex items-center justify-center h-64">
                    <Loading size="lg" />
                  </div>
                </Card>
              }
            >
              <RealTimeTracker surveyId={params.id} />
            </Suspense>
          </TabsContent>
        )}

        <TabsContent value="results" className="space-y-6">
          <Suspense
            fallback={
              <Card className="p-6">
                <div className="flex items-center justify-center h-64">
                  <Loading size="lg" />
                </div>
              </Card>
            }
          >
            <SurveyResults surveyId={params.id} />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export async function generateMetadata({ params }: SurveyResultsPageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return {
      title: 'Survey Results - Unauthorized',
    };
  }

  const survey = await getSurvey(params.id, session.user.companyId);

  return {
    title: survey ? `Results: ${survey.title}` : 'Survey Not Found',
    description: survey
      ? `View detailed analytics and real-time tracking for ${survey.title}`
      : 'Survey results not available',
  };
}
