import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Survey from '@/models/Survey';
import User from '@/models/User';
import DemographicField from '@/models/DemographicField';
import SurveyResponseFlow from '@/components/surveys/SurveyResponseFlow';
import { Loading } from '@/components/ui/Loading';
import { Badge } from '@/components/ui/badge';
import { Clock, AlertCircle } from 'lucide-react';

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ token?: string }>;
}

async function getSurveyData(id: string, session: any) {
  try {
    await connectDB();

    console.log('=== getSurveyData Debug ===');
    console.log('Survey ID:', id);
    console.log('Session user:', session?.user);

    // Use .lean() for better performance
    const survey = await Survey.findById(id).lean();

    console.log('Survey found:', survey ? 'Yes' : 'No');
    if (!survey) {
      console.log('Survey not found in database');
      return null;
    }

    console.log('Survey company_id:', survey.company_id);
    console.log('Session user companyId:', session.user.companyId);
    console.log('Session user role:', session.user.role);

    // Check access permissions
    if (
      survey.company_id.toString() !== session.user.companyId.toString() &&
      session.user.role !== 'super_admin'
    ) {
      console.log('Access denied: company mismatch');
      return null;
    }

    // Check if survey can accept responses
    const now = new Date();
    const startDate = new Date(survey.start_date);
    const endDate = new Date(survey.end_date);

    console.log('Survey status:', survey.status);
    console.log('Current date:', now);
    console.log('Start date:', startDate);
    console.log('End date:', endDate);
    console.log('Date check:', now >= startDate && now <= endDate);

    const canAcceptResponses =
      survey.status === 'active' && now >= startDate && now <= endDate;

    console.log('Can accept responses:', canAcceptResponses);

    if (!canAcceptResponses) {
      return {
        id: survey._id.toString(),
        title: survey.title,
        description: survey.description,
        status: survey.status,
        response_count: survey.response_count || 0,
        target_audience_count: survey.target_audience_count || 0,
        start_date: survey.start_date,
        end_date: survey.end_date,
        questions: [],
        settings: {
          anonymous: false,
          show_progress: false,
          allow_partial_responses: false,
        },
        canRespond: false,
      };
    }

    // Create sanitized data object
    const sanitizedData: any = {
      id: survey._id.toString(),
      title: survey.title,
      description: survey.description,
      status: survey.status,
      response_count: survey.response_count || 0,
      target_audience_count: survey.target_audience_count || 0,
      start_date: survey.start_date,
      end_date: survey.end_date,
      time_remaining:
        survey.status === 'active' && now >= startDate && now <= endDate
          ? Math.max(
              0,
              Math.floor(
                (endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
              )
            )
          : undefined,
      questions:
        survey.questions?.map((q: any) => ({
          id: q.id,
          text: q.text,
          type: q.type,
          options: q.options || [],
          scale_min: q.scale_min,
          scale_max: q.scale_max,
          scale_labels: q.scale_labels,
          emoji_options: q.emoji_options,
          required: q.required || false,
          comment_required: q.comment_required,
          comment_prompt: q.comment_prompt,
          binary_comment_config: q.binary_comment_config,
        })) || [],
      settings: {
        anonymous: survey.settings?.anonymous || false,
        show_progress: survey.settings?.show_progress !== false,
        allow_partial_responses:
          survey.settings?.allow_partial_responses !== false,
      },
      demographics: survey.demographics || [],
      canRespond: true,
    };

    // Fetch user demographics if survey has demographic fields
    let userDemographics = {};
    let demographicFields = [];

    if (survey.demographic_field_ids && survey.demographic_field_ids.length > 0) {
      // Fetch user's demographic data
      const user = await User.findOne({
        email: session.user.email,
        company_id: survey.company_id,
      }).lean();

      if (user && user.demographics) {
        userDemographics = user.demographics;
      }

      // Fetch demographic field definitions
      demographicFields = await DemographicField.find({
        _id: { $in: survey.demographic_field_ids },
        company_id: survey.company_id,
        is_active: true,
      })
        .select('_id field label type')
        .lean();

      // Add demographic fields to sanitized data
      sanitizedData.demographic_field_ids = survey.demographic_field_ids.map((id: any) =>
        id.toString()
      );
      sanitizedData.demographicFields = demographicFields.map((field: any) => ({
        _id: field._id.toString(),
        field: field.field,
        label: field.label,
        type: field.type,
      }));
    }

    return {
      surveyData: sanitizedData,
      userDemographics,
    };
  } catch (error) {
    console.error('Error in getSurveyData:', error);
    return null;
  }
}

export default async function SurveyResponsePage({
  params,
  searchParams,
}: PageProps) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;
    const { token } = await searchParams;

    console.log('=== SurveyResponsePage ===');
    console.log('Survey ID:', id);
    console.log('Token:', token);
    console.log('Has session:', !!session?.user);

    if (!session?.user) {
      console.log('No session, returning notFound');
      notFound();
    }

    const result = await getSurveyData(id, session);

    if (!result) {
      console.log('No survey data returned, calling notFound');
      notFound();
    }

    const { surveyData, userDemographics } = result;

    console.log('Survey data retrieved successfully');
    console.log('Can respond:', surveyData.canRespond);

    if (!surveyData.canRespond) {
      return (
        <div className="container mx-auto px-4 py-6">
          <div className="max-w-2xl mx-auto text-center py-12">
            <div className="bg-yellow-50 rounded-2xl p-8 border border-yellow-200">
              <AlertCircle className="w-16 h-16 mx-auto mb-4 text-yellow-600" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Survey Not Available
              </h2>
              <p className="text-gray-600 mb-4">
                {surveyData.status === 'completed' ||
                surveyData.status === 'archived'
                  ? 'This survey has been closed and is no longer accepting responses.'
                  : surveyData.status === 'draft'
                    ? 'This survey has not been published yet.'
                    : surveyData.status === 'paused'
                      ? 'This survey is currently paused.'
                      : 'This survey is not currently accepting responses.'}
              </p>
              <Badge
                variant="outline"
                className="text-yellow-800 bg-yellow-100"
              >
                {surveyData.status}
              </Badge>
              {surveyData.start_date && surveyData.end_date && (
                <div className="mt-4 text-sm text-gray-600">
                  <p>
                    Survey Period:{' '}
                    {new Date(surveyData.start_date).toLocaleDateString()} -{' '}
                    {new Date(surveyData.end_date).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return (
      <Suspense fallback={<Loading size="lg" />}>
        <SurveyResponseFlow
          surveyId={id}
          surveyData={surveyData}
          invitationToken={token}
          userDemographics={userDemographics}
        />
      </Suspense>
    );
  } catch (error) {
    console.error('Survey respond page error:', error);
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-2xl mx-auto text-center py-12">
          <div className="bg-red-50 rounded-2xl p-8 border border-red-200">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-600" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Error Loading Survey
            </h2>
            <p className="text-gray-600 mb-4">
              There was an error loading this survey. Please try again later.
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
    const survey = await Survey.findById(id).select('title company_id').lean();

    if (
      !survey ||
      (survey.company_id !== session.user.companyId &&
        session.user.role !== 'super_admin')
    ) {
      return {
        title: 'Survey Not Found',
      };
    }

    return {
      title: `Respond: ${survey.title} | Organizational Climate Platform`,
      description: `Share your feedback in the ${survey.title} survey.`,
    };
  } catch (error) {
    console.error('Metadata generation error:', error);
    return {
      title: 'Survey Response',
    };
  }
}
